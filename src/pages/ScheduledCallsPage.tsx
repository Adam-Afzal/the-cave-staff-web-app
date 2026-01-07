// src/pages/ScheduledCallsPage.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Phone, 
  Calendar,
  Clock,
  User,
  Mail,
  CheckCircle,
  XCircle,
  Bell,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { useScheduledCalls, useUpdateCallStatus } from '../hooks/useB2B'
import { cn } from '../lib/utils'

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Calendar },
  reminder_sent: { label: 'Reminder Sent', color: 'text-cave-gold', bg: 'bg-cave-gold/10', icon: Bell },
  completed: { label: 'Completed', color: 'text-cave-status-success', bg: 'bg-cave-status-success/10', icon: CheckCircle },
  no_show: { label: 'No Show', color: 'text-cave-status-error', bg: 'bg-cave-status-error/10', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-cave-text-muted', bg: 'bg-cave-bg-elevated', icon: XCircle }
}

type ViewFilter = 'upcoming' | 'past' | 'all'

export function ScheduledCallsPage() {
  const [viewFilter, setViewFilter] = useState<ViewFilter>('upcoming')
  
  const { data: calls, isLoading } = useScheduledCalls(
    viewFilter === 'upcoming' ? { upcoming: true } : undefined
  )
  const updateStatus = useUpdateCallStatus()
  
  // Filter for past calls
  const filteredCalls = calls?.filter(call => {
    if (viewFilter === 'all') return true
    if (viewFilter === 'upcoming') return new Date(call.starts_at) > new Date()
    if (viewFilter === 'past') return new Date(call.starts_at) <= new Date()
    return true
  }).sort((a, b) => {
    // Sort upcoming by soonest first, past by most recent first
    if (viewFilter === 'upcoming') {
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    }
    return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
  })
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }
  
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getTimeUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diff < 0) return null
    if (hours > 24) return `${Math.floor(hours / 24)}d`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }
  
  const handleMarkCompleted = async (callId: string) => {
    await updateStatus.mutateAsync({ callId, status: 'completed' })
  }
  
  const handleMarkNoShow = async (callId: string) => {
    await updateStatus.mutateAsync({ callId, status: 'no_show' })
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cave-text-primary flex items-center gap-3">
            <Phone className="w-7 h-7 text-cave-gold" />
            Scheduled Calls
          </h1>
          <p className="text-cave-text-secondary mt-1">
            Onboarding calls from GHL calendar
          </p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'past', label: 'Past' },
          { key: 'all', label: 'All' }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setViewFilter(filter.key as ViewFilter)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              viewFilter === filter.key
                ? "bg-cave-gold text-cave-bg-primary"
                : "bg-cave-bg-secondary text-cave-text-secondary hover:text-cave-text-primary"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
      
      {/* Calls List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cave-gold mx-auto" />
          </div>
        ) : filteredCalls?.length === 0 ? (
          <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-8 text-center text-cave-text-secondary">
            {viewFilter === 'upcoming' ? 'No upcoming calls' : 'No calls found'}
          </div>
        ) : (
          filteredCalls?.map((call) => {
            const statusConfig = STATUS_CONFIG[call.status]
            const StatusIcon = statusConfig.icon
            const timeUntil = getTimeUntil(call.starts_at)
            const isPast = new Date(call.starts_at) <= new Date()
            const isToday = new Date(call.starts_at).toDateString() === new Date().toDateString()
            
            return (
              <div 
                key={call.id} 
                className={cn(
                  "bg-cave-bg-secondary rounded-xl border border-cave-border p-5",
                  isToday && !isPast && "ring-2 ring-cave-gold/30"
                )}
              >
                <div className="flex items-start justify-between">
                  {/* Left: Call Info */}
                  <div className="flex items-start gap-4">
                    {/* Time Block */}
                    <div className={cn(
                      "text-center px-4 py-2 rounded-lg",
                      isToday && !isPast ? "bg-cave-gold/20" : "bg-cave-bg-elevated"
                    )}>
                      <p className={cn(
                        "text-sm font-medium",
                        isToday && !isPast ? "text-cave-gold" : "text-cave-text-secondary"
                      )}>
                        {formatDate(call.starts_at)}
                      </p>
                      <p className="text-xl font-bold text-cave-text-primary">
                        {formatTime(call.starts_at)}
                      </p>
                      {timeUntil && (
                        <p className="text-xs text-cave-gold mt-1">in {timeUntil}</p>
                      )}
                    </div>
                    
                    {/* Contact Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-cave-text-muted" />
                        <span className="font-semibold text-cave-text-primary">
                          {call.member_name || call.attendee_name || 'Unknown'}
                        </span>
                        {call.member_display_id && (
                          <span className="text-xs text-cave-text-muted bg-cave-bg-elevated px-2 py-0.5 rounded">
                            {call.member_display_id}
                          </span>
                        )}
                      </div>
                      
                      {call.attendee_email && (
                        <div className="flex items-center gap-2 text-sm text-cave-text-secondary">
                          <Mail className="w-4 h-4 text-cave-text-muted" />
                          {call.attendee_email}
                        </div>
                      )}
                      
                      {call.title && call.title !== 'Onboarding Call' && (
                        <p className="text-sm text-cave-text-muted mt-1">{call.title}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Right: Status & Actions */}
                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                      statusConfig.bg,
                      statusConfig.color
                    )}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </span>
                    
                    {/* Actions for completed/no-show */}
                    {call.status === 'scheduled' || call.status === 'reminder_sent' ? (
                      isPast ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarkCompleted(call.id)}
                            disabled={updateStatus.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-cave-status-success/10 text-cave-status-success hover:bg-cave-status-success/20 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </button>
                          <button
                            onClick={() => handleMarkNoShow(call.id)}
                            disabled={updateStatus.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-cave-status-error/10 text-cave-status-error hover:bg-cave-status-error/20 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            No Show
                          </button>
                        </div>
                      ) : null
                    ) : call.status === 'completed' ? (
                      <Link
                        to="/b2b/assess"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-cave-gold/10 text-cave-gold hover:bg-cave-gold/20 transition-colors"
                      >
                        Log Assessment
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}