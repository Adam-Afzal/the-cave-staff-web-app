// src/components/StaffNotificationBell.tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { cn } from '../lib/utils'
import { useStaffNotifications } from '../hooks/useStaffNotifications'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function StaffNotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead } = useStaffNotifications()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    const base = 'The Cave Staff'
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base
  }, [unreadCount])

  const handleClick = async (id: string, link: string, read: boolean) => {
    if (!read) await markRead(id)
    setOpen(false)
    navigate(link)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          open
            ? 'bg-cave-bg-elevated text-cave-text-primary'
            : 'text-cave-text-secondary hover:bg-cave-bg-elevated hover:text-cave-text-primary'
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-cave-gold text-black text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-cave-bg-secondary border border-cave-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cave-border">
            <span className="text-sm font-semibold text-cave-text-primary">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-cave-gold hover:opacity-80 transition-opacity"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-cave-text-muted text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n.id, n.link, n.read)}
                  className={cn(
                    'w-full text-left px-4 py-3.5 border-b border-cave-border last:border-0 transition-colors hover:bg-cave-bg-elevated',
                    !n.read && 'bg-cave-gold/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-cave-gold flex-shrink-0 mt-1.5" />
                    )}
                    <div className={n.read ? 'pl-4' : ''}>
                      <p className={cn('text-sm font-medium', n.read ? 'text-cave-text-secondary' : 'text-cave-text-primary')}>
                        {n.title}
                      </p>
                      <p className="text-xs text-cave-text-muted mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-xs text-cave-text-muted mt-1.5">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
