// src/pages/MemberProfilePage.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  MessageSquare,
  User,
  Hash,
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn, getInitials } from '../lib/utils'

function HealthScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-cave-bg-elevated rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            score >= 70 ? 'bg-cave-status-success' : score >= 40 ? 'bg-cave-status-warning' : 'bg-cave-status-error'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn(
        "text-lg font-bold",
        score >= 70 ? 'text-cave-status-success' : score >= 40 ? 'text-cave-status-warning' : 'text-cave-status-error'
      )}>
        {score}
      </span>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, className }: { 
  icon: React.ElementType
  label: string
  value: string | number | null | undefined
  className?: string
}) {
  if (!value) return null
  
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="p-2 rounded-lg bg-cave-bg-elevated">
        <Icon className="w-4 h-4 text-cave-text-muted" />
      </div>
      <div>
        <p className="text-xs text-cave-text-muted uppercase tracking-wider">{label}</p>
        <p className="text-cave-text-primary font-medium">{value}</p>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, count }: { 
  icon: React.ElementType
  title: string
  count?: number
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-cave-gold" />
      <h3 className="text-lg font-semibold text-cave-text-primary">{title}</h3>
      {count !== undefined && (
        <span className="px-2 py-0.5 text-xs rounded-full bg-cave-gold/20 text-cave-gold">
          {count}
        </span>
      )}
    </div>
  )
}

export function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()

  // Fetch member data with telegram info
  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          member_telegram (
            telegram_id,
            telegram_username
          )
        `)
        .eq('id', memberId)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!memberId
  })

  // Fetch event signups for this member
  const { data: eventSignups = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['member-events', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_signups')
        .select(`
          *,
          events (
            id,
            title,
            event_date,
            location,
            status
          )
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      return data || []
    },
    enabled: !!memberId
  })

  // Fetch scheduled calls for this member
  const { data: scheduledCalls = [], isLoading: callsLoading } = useQuery({
    queryKey: ['member-calls', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_calls')
        .select('*')
        .eq('member_id', memberId)
        .order('starts_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      return data || []
    },
    enabled: !!memberId
  })

  // Fetch B2B assessments for this member
  const { data: assessments = [] } = useQuery({
    queryKey: ['member-assessments', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('b2b_assessments')
        .select(`
          *,
          b2b_intros (
            id,
            status,
            partner_id,
            partners (name)
          )
        `)
        .eq('member_id', memberId)
        .order('assessed_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!memberId
  })

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCallStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-cave-status-success" />
      case 'no_show':
        return <XCircle className="w-4 h-4 text-cave-status-error" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-cave-text-muted" />
      default:
        return <Clock className="w-4 h-4 text-cave-gold" />
    }
  }

  if (memberLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-cave-gold animate-spin" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/members')}
          className="flex items-center gap-2 text-cave-text-secondary hover:text-cave-text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Members
        </button>
        <div className="text-center py-12">
          <p className="text-cave-text-secondary">Member not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/members')}
        className="flex items-center gap-2 text-cave-text-secondary hover:text-cave-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Members
      </button>

      {/* Profile Header */}
      <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          {member.member_telegram?.avatar_url ? (
            <img 
              src={member.member_telegram.avatar_url} 
              alt={`${member.first_name} ${member.last_name}`}
              className="w-24 h-24 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-cave-gold/20 flex items-center justify-center flex-shrink-0">
              <span className="text-cave-gold font-bold text-3xl">
                {getInitials(member.first_name, member.last_name)}
              </span>
            </div>
          )}

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-cave-text-primary">
                  {member.first_name} {member.last_name}
                </h1>
                {member.member_id && (
                  <p className="text-cave-text-secondary mt-1">
                    Member ID: <span className="font-mono text-cave-gold">{member.member_id}</span>
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    member.status === 'ACTIVE' ? 'bg-cave-status-success/20 text-cave-status-success' : 
                    member.status === 'INACTIVE' ? 'bg-cave-status-warning/20 text-cave-status-warning' :
                    member.status === 'CHURNED' ? 'bg-cave-status-error/20 text-cave-status-error' : 
                    'bg-cave-bg-elevated text-cave-text-secondary'
                  )}>
                    {member.status}
                  </span>
                  {member.wealth_tier && (
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      member.wealth_tier === 'UHNW' ? 'bg-cave-gold/20 text-cave-gold' : 'bg-cave-bg-elevated text-cave-text-secondary'
                    )}>
                      {member.wealth_tier}
                    </span>
                  )}
                </div>
              </div>

              {/* Health Score */}
              <div className="w-48">
                <p className="text-xs text-cave-text-muted uppercase tracking-wider mb-2">Health Score</p>
                <HealthScoreBadge score={member.health_score} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact & Business Info */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-5">
            <SectionHeader icon={User} title="Contact Information" />
            <div className="space-y-4">
              <InfoCard icon={Mail} label="Email" value={member.email} />
              <InfoCard icon={Phone} label="Phone" value={member.phone} />
              <InfoCard 
                icon={MapPin} 
                label="Location" 
                value={member.city && member.country ? `${member.city}, ${member.country}` : member.city || member.country} 
              />
              {member.member_telegram?.telegram_username && (
                <InfoCard icon={MessageSquare} label="Telegram" value={`@${member.member_telegram.telegram_username}`} />
              )}
              {member.member_telegram?.telegram_id && (
                <InfoCard icon={Hash} label="Telegram ID" value={member.member_telegram.telegram_id} />
              )}
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-5">
            <SectionHeader icon={Building2} title="Business Information" />
            <div className="space-y-4">
              <InfoCard icon={Building2} label="Business Arena" value={member.business_arena} />
              {member.linkedin_url && (
                <a 
                  href={member.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-cave-gold hover:text-cave-gold/80 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View LinkedIn Profile
                </a>
              )}
            </div>
          </div>

          {/* B2B Assessments */}
          {assessments.length > 0 && (
            <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-5">
              <SectionHeader icon={Building2} title="B2B Assessments" count={assessments.length} />
              <div className="space-y-3">
                {assessments.map((assessment: any) => (
                  <div key={assessment.id} className="p-3 rounded-lg bg-cave-bg-elevated">
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        "text-sm font-medium",
                        assessment.is_b2b_fit ? "text-cave-status-success" : "text-cave-text-muted"
                      )}>
                        {assessment.is_b2b_fit ? 'B2B Fit' : 'Not B2B Fit'}
                      </span>
                      <span className="text-xs text-cave-text-muted">
                        {formatDate(assessment.assessed_at)}
                      </span>
                    </div>
                    {assessment.b2b_intros?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {assessment.b2b_intros.map((intro: any) => (
                          <span 
                            key={intro.id}
                            className={cn(
                              "text-xs px-2 py-0.5 rounded",
                              intro.status === 'closed' ? 'bg-cave-status-success/20 text-cave-status-success' :
                              intro.status === 'lost' ? 'bg-cave-status-error/20 text-cave-status-error' :
                              'bg-cave-gold/20 text-cave-gold'
                            )}
                          >
                            {intro.partners?.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Middle Column - Events */}
        <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-5">
          <SectionHeader icon={Calendar} title="Event Signups" count={eventSignups.length} />
          
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-cave-gold animate-spin" />
            </div>
          ) : eventSignups.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-cave-text-muted mx-auto mb-3" />
              <p className="text-cave-text-secondary">No event signups yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventSignups.map((signup: any) => (
                <div 
                  key={signup.id}
                  className="p-4 rounded-lg bg-cave-bg-elevated hover:bg-cave-bg-elevated/80 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-cave-text-primary">
                      {signup.events?.title || 'Unknown Event'}
                    </h4>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      signup.status === 'confirmed' ? 'bg-cave-status-success/20 text-cave-status-success' :
                      signup.status === 'attended' ? 'bg-cave-gold/20 text-cave-gold' :
                      signup.status === 'cancelled' ? 'bg-cave-status-error/20 text-cave-status-error' :
                      'bg-cave-bg-secondary text-cave-text-muted'
                    )}>
                      {signup.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-cave-text-secondary">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(signup.events?.event_date)}
                    </span>
                    {signup.events?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {signup.events.location}
                      </span>
                    )}
                  </div>
                  {signup.guest_name && (
                    <p className="text-xs text-cave-text-muted mt-2">
                      Guest: {signup.guest_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Calls */}
        <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-5">
          <SectionHeader icon={Phone} title="Concierge Calls" count={scheduledCalls.length} />
          
          {callsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-cave-gold animate-spin" />
            </div>
          ) : scheduledCalls.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-cave-text-muted mx-auto mb-3" />
              <p className="text-cave-text-secondary">No scheduled calls</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledCalls.map((call: any) => (
                <div 
                  key={call.id}
                  className="p-4 rounded-lg bg-cave-bg-elevated"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-cave-text-primary">
                      {call.title || 'Onboarding Call'}
                    </h4>
                    <div className="flex items-center gap-1">
                      {getCallStatusIcon(call.status)}
                      <span className={cn(
                        "text-xs capitalize",
                        call.status === 'completed' ? 'text-cave-status-success' :
                        call.status === 'no_show' ? 'text-cave-status-error' :
                        call.status === 'cancelled' ? 'text-cave-text-muted' :
                        'text-cave-gold'
                      )}>
                        {call.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-cave-text-secondary">
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(call.starts_at)}
                    </p>
                  </div>
                  {call.calendar_name && (
                    <p className="text-xs text-cave-text-muted mt-2">
                      {call.calendar_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Membership Dates */}
      <div className="mt-6 bg-cave-bg-secondary rounded-xl border border-cave-border p-5">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-cave-text-muted">Record created:</span>
            <span className="ml-2 text-cave-text-primary">{formatDate(member.created_at)}</span>
          </div>
          {member.join_date && (
            <div>
              <span className="text-cave-text-muted">Joined:</span>
              <span className="ml-2 text-cave-text-primary">{formatDate(member.join_date)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}