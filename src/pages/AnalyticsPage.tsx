import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Plus, AlertCircle, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  isStreaming?: boolean
  error?: boolean
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-[#F5C542] animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[#F5C542] animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[#F5C542] animate-bounce [animation-delay:300ms]" />
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-3 rounded-2xl rounded-tr-sm bg-[#F5C542] text-[#0A0C0F] text-sm leading-relaxed font-medium">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-3 max-w-[80%]">
        <div className="w-7 h-7 rounded-full bg-[#F5C542]/10 border border-[#F5C542]/20 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-[#F5C542]" />
        </div>
        <div className={cn(
          "px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed",
          message.error
            ? "bg-red-500/10 border border-red-500/20 text-red-400"
            : "bg-[#1E2530] text-[#E8EAF0]"
        )}>
          {message.isStreaming && message.content === '' ? (
            <TypingIndicator />
          ) : (
            <>
              <span className="whitespace-pre-wrap">{message.content}</span>
              {message.isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-[#F5C542] ml-0.5 animate-pulse align-middle" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function AnalyticsPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [input])

  const startNewChat = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setMessages([])
    setConversationId(null)
    setIsStreaming(false)
    setInput('')
    textareaRef.current?.focus()
  }, [])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    setInput('')
    setIsStreaming(true)

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    const aiMsgId = crypto.randomUUID()
    const aiMsg: Message = { id: aiMsgId, role: 'ai', content: '', isStreaming: true }

    setMessages(prev => [...prev, userMsg, aiMsg])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
        return
      }

      abortRef.current = new AbortController()

      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
        signal: abortRef.current.signal,
      })

      if (res.status === 401) {
        navigate('/login')
        return
      }

      if (res.status === 403) {
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId
            ? { ...m, content: 'You do not have permission to use this feature.', isStreaming: false, error: true }
            : m
        ))
        setIsStreaming(false)
        return
      }

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const event = JSON.parse(data)
            if (event.type === 'conversation_id') {
              setConversationId(event.conversation_id)
            } else if (event.type === 'chunk') {
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, content: m.content + event.content } : m
              ))
            }
          } catch {
            // Malformed JSON in stream — skip
          }
        }
      }

      // Mark streaming complete
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId ? { ...m, isStreaming: false } : m
      ))
    } catch (err: any) {
      if (err.name === 'AbortError') return

      setMessages(prev => prev.map(m =>
        m.id === aiMsgId
          ? { ...m, content: 'Something went wrong. Please try again.', isStreaming: false, error: true }
          : m
      ))
    } finally {
      setIsStreaming(false)
      abortRef.current = null
      textareaRef.current?.focus()
    }
  }, [input, isStreaming, conversationId, navigate])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full bg-[#0A0C0F]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2530] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F5C542]/10 border border-[#F5C542]/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#F5C542]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">Cave AI</h1>
            {conversationId && (
              <p className="text-xs text-[#6B7A94]">Conversation active</p>
            )}
          </div>
        </div>
        <button
          onClick={startNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6B7A94] hover:text-white hover:bg-[#1E2530] border border-[#1E2530] hover:border-[#2A3040] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F5C542]/10 border border-[#F5C542]/20 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[#F5C542]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">How can I help?</h2>
              <p className="text-sm text-[#6B7A94] max-w-xs">
                Ask me anything about members, connections, engagement, or analytics.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                'Who are our most engaged members?',
                'Summarise recent connections',
                'Which members haven\'t engaged recently?',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); textareaRef.current?.focus() }}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#6B7A94] border border-[#1E2530] hover:border-[#F5C542]/30 hover:text-white hover:bg-[#1E2530] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-5 max-w-3xl mx-auto w-full">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-6 py-4 border-t border-[#1E2530]">
        <div className="max-w-3xl mx-auto">
          <div className={cn(
            "flex items-end gap-3 px-4 py-3 rounded-xl border transition-colors bg-[#1E2530]",
            isStreaming ? "border-[#2A3040]" : "border-[#2A3040] focus-within:border-[#F5C542]/40"
          )}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-[#6B7A94] resize-none focus:outline-none leading-relaxed disabled:opacity-50 min-h-[24px]"
            />
            <button
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                isStreaming || !input.trim()
                  ? "bg-[#2A3040] text-[#6B7A94] cursor-not-allowed"
                  : "bg-[#F5C542] text-[#0A0C0F] hover:bg-[#F5C542]/90"
              )}
            >
              {isStreaming ? (
                <AlertCircle className="w-4 h-4 animate-pulse" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-[#6B7A94] text-center mt-2">
            Cave AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  )
}
