// src/pages/MemberProfilePage.tsx
import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Pencil,
  X,
  CreditCard,
  CalendarDays,
  RefreshCw,
  ShieldBan,
  DollarSign,
  Briefcase,
  Check,
  Camera,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn, getInitials } from '../lib/utils'
import type { MembershipType } from '../types/database'

const MEMBERSHIP_TYPE_OPTIONS: MembershipType[] = ['Paid', 'Trial', 'B2B Partner']

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

function EditMembershipModal({
  member,
  onClose
}: {
  member: { id: string; join_date: string; renewal_date: string | null; membership_type: MembershipType | null; amount_paid: number | null }
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  // Ensure dates are in YYYY-MM-DD format for the date input
  const toDateInput = (d: string | null) => d ? d.slice(0, 10) : ''
  const [joinDate, setJoinDate] = useState(toDateInput(member.join_date))
  const [renewalDate, setRenewalDate] = useState(toDateInput(member.renewal_date))
  const [membershipType, setMembershipType] = useState<MembershipType | ''>(member.membership_type || '')
  const [amountPaid, setAmountPaid] = useState(member.amount_paid?.toString() || '')

  const updateMutation = useMutation({
    mutationFn: async (updates: { join_date: string; renewal_date: string | null; membership_type: string | null; amount_paid: number | null }) => {
      const { error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', member.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', member.id] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      join_date: joinDate,
      renewal_date: renewalDate || null,
      membership_type: membershipType || null,
      amount_paid: amountPaid ? parseFloat(amountPaid) : null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-cave-bg-secondary border border-cave-border rounded-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cave-border">
          <h2 className="text-xl font-semibold text-cave-text-primary">Edit Membership Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="input-label">Membership Type</label>
            <select
              value={membershipType}
              onChange={(e) => setMembershipType(e.target.value as MembershipType | '')}
              className="input w-full"
            >
              <option value="">Select type...</option>
              {MEMBERSHIP_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Join Date</label>
            <input
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              required
              className="input w-full"
            />
          </div>

          <div>
            <label className="input-label">Renewal Date</label>
            <input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="input-label">Amount Paid ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="0.00"
              className="input w-full"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-cave-border">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            onClick={handleSubmit as any}
            disabled={!joinDate || updateMutation.isPending}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBlacklistModal, setShowBlacklistModal] = useState(false)
  const [editingBackground, setEditingBackground] = useState(false)
  const [backgroundDraft, setBackgroundDraft] = useState('')
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneDraft, setPhoneDraft] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarUpload = async (file: File) => {
    if (!memberId) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${memberId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`
      const { error: updateError } = await supabase
        .from('members')
        .update({ profile_picture_url: publicUrl })
        .eq('id', memberId)
      if (updateError) throw updateError

      await queryClient.refetchQueries({ queryKey: ['member', memberId] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    } catch (err) {
      console.error('Avatar upload failed:', err)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const blacklistMember = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('members')
        .update({ blacklisted: true, status: 'INACTIVE' })
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setShowBlacklistModal(false)
    }
  })

  const updateMemberField = useMutation({
    mutationFn: async (updates: Record<string, string | null>) => {
      const { error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      setEditingBackground(false)
      setEditingPhone(false)
    }
  })

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
            telegram_username,
            avatar_url
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
          {/* Avatar with upload */}
          <div className="relative flex-shrink-0 group">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAvatarUpload(file)
                e.target.value = ''
              }}
            />
            {member.member_telegram?.avatar_url || member.profile_picture_url ? (
              <img
                src={member.member_telegram?.avatar_url || member.profile_picture_url}
                alt={`${member.first_name} ${member.last_name}`}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-cave-gold/20 flex items-center justify-center">
                <span className="text-cave-gold font-bold text-3xl">
                  {getInitials(member.first_name, member.last_name)}
                </span>
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors cursor-pointer"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>

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
                  {member.blacklisted ? (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400">
                      Blacklisted
                    </span>
                  ) : (
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      member.status === 'ACTIVE' ? 'bg-cave-status-success/20 text-cave-status-success' :
                      member.status === 'INACTIVE' ? 'bg-cave-status-warning/20 text-cave-status-warning' :
                      member.status === 'CHURNED' ? 'bg-cave-status-error/20 text-cave-status-error' :
                      'bg-cave-bg-elevated text-cave-text-secondary'
                    )}>
                      {member.status}
                    </span>
                  )}
                  {member.wealth_tier && (
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      member.wealth_tier === 'UHNW' ? 'bg-cave-gold/20 text-cave-gold' : 'bg-cave-bg-elevated text-cave-text-secondary'
                    )}>
                      {member.wealth_tier}
                    </span>
                  )}
                  {!member.blacklisted && (
                    <button
                      onClick={() => setShowBlacklistModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <ShieldBan className="w-4 h-4" />
                      Blacklist
                    </button>
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

              {/* Phone - editable */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cave-bg-elevated">
                  <Phone className="w-4 h-4 text-cave-text-muted" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-cave-text-muted uppercase tracking-wider">Phone</p>
                    {!editingPhone && (
                      <button
                        onClick={() => { setPhoneDraft(member.phone || ''); setEditingPhone(true) }}
                        className="p-1 rounded text-cave-text-muted hover:text-cave-text-primary hover:bg-cave-bg-elevated transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {editingPhone ? (
                    <div className="mt-1 space-y-2">
                      <input
                        type="tel"
                        value={phoneDraft}
                        onChange={(e) => setPhoneDraft(e.target.value)}
                        className="input w-full"
                        placeholder="Enter phone number..."
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateMemberField.mutate({ phone: phoneDraft || null })}
                          disabled={updateMemberField.isPending}
                          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {updateMemberField.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingPhone(false)}
                          className="btn-ghost text-xs px-3 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-cave-text-primary font-medium">
                      {member.phone || <span className="text-cave-text-muted italic">Not set</span>}
                    </p>
                  )}
                </div>
              </div>
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

              {/* Professional Background - editable */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cave-bg-elevated">
                  <Briefcase className="w-4 h-4 text-cave-text-muted" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-cave-text-muted uppercase tracking-wider">Professional Background</p>
                    {!editingBackground && (
                      <button
                        onClick={() => { setBackgroundDraft(member.professional_background || ''); setEditingBackground(true) }}
                        className="p-1 rounded text-cave-text-muted hover:text-cave-text-primary hover:bg-cave-bg-elevated transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {editingBackground ? (
                    <div className="mt-1 space-y-2">
                      <textarea
                        value={backgroundDraft}
                        onChange={(e) => setBackgroundDraft(e.target.value)}
                        rows={4}
                        className="input w-full resize-none"
                        placeholder="Enter professional background..."
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateMemberField.mutate({ professional_background: backgroundDraft || null })}
                          disabled={updateMemberField.isPending}
                          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {updateMemberField.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingBackground(false)}
                          className="btn-ghost text-xs px-3 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-cave-text-primary font-medium whitespace-pre-wrap">
                      {member.professional_background || <span className="text-cave-text-muted italic">Not set</span>}
                    </p>
                  )}
                </div>
              </div>

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

      {/* Membership Details */}
      <div className="mt-6 bg-cave-bg-secondary rounded-xl border border-cave-border p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={CreditCard} title="Membership Details" />
          <button
            onClick={() => setShowEditModal(true)}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cave-bg-elevated">
              <CreditCard className="w-4 h-4 text-cave-text-muted" />
            </div>
            <div>
              <p className="text-xs text-cave-text-muted uppercase tracking-wider">Membership Type</p>
              <p className="text-cave-text-primary font-medium">
                {member.membership_type ? (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-sm",
                    member.membership_type === 'Paid' ? 'bg-cave-status-success/20 text-cave-status-success' :
                    member.membership_type === 'Trial' ? 'bg-cave-status-warning/20 text-cave-status-warning' :
                    'bg-cave-gold/20 text-cave-gold'
                  )}>
                    {member.membership_type}
                  </span>
                ) : (
                  <span className="text-cave-text-muted">Not set</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cave-bg-elevated">
              <CalendarDays className="w-4 h-4 text-cave-text-muted" />
            </div>
            <div>
              <p className="text-xs text-cave-text-muted uppercase tracking-wider">Join Date</p>
              <p className="text-cave-text-primary font-medium">{formatDate(member.join_date)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cave-bg-elevated">
              <RefreshCw className="w-4 h-4 text-cave-text-muted" />
            </div>
            <div>
              <p className="text-xs text-cave-text-muted uppercase tracking-wider">Renewal Date</p>
              <p className="text-cave-text-primary font-medium">
                {member.renewal_date ? formatDate(member.renewal_date) : <span className="text-cave-text-muted">Not set</span>}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cave-bg-elevated">
              <DollarSign className="w-4 h-4 text-cave-text-muted" />
            </div>
            <div>
              <p className="text-xs text-cave-text-muted uppercase tracking-wider">Amount Paid</p>
              <p className="text-cave-text-primary font-medium">
                {member.amount_paid != null ? `$${Number(member.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <span className="text-cave-text-muted">Not set</span>}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cave-bg-elevated">
              <Clock className="w-4 h-4 text-cave-text-muted" />
            </div>
            <div>
              <p className="text-xs text-cave-text-muted uppercase tracking-wider">Record Created</p>
              <p className="text-cave-text-primary font-medium">{formatDate(member.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Membership Modal */}
      {showEditModal && (
        <EditMembershipModal
          member={member}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Blacklist Confirmation Modal */}
      {showBlacklistModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-cave-bg-secondary border border-cave-border rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 mx-auto mb-4">
                <ShieldBan className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-cave-text-primary text-center mb-2">Blacklist Member</h2>
              <p className="text-cave-text-secondary text-center mb-4">
                Are you sure you want to blacklist <span className="font-medium text-cave-text-primary">{member.first_name} {member.last_name}</span>?
              </p>
              <div className="bg-cave-bg-elevated rounded-lg p-4 mb-6">
                <p className="text-sm text-cave-text-secondary">
                  This will mark the member as <span className="font-medium text-red-400">blacklisted</span> and <span className="font-medium text-cave-status-warning">inactive</span>.
                </p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowBlacklistModal(false)} disabled={blacklistMember.isPending} className="flex-1 px-4 py-2 text-cave-text-secondary hover:text-cave-text-primary border border-cave-border rounded-lg hover:bg-cave-bg-elevated disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={() => blacklistMember.mutate()} disabled={blacklistMember.isPending} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-500/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {blacklistMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldBan className="w-4 h-4" />}
                  {blacklistMember.isPending ? 'Blacklisting...' : 'Blacklist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}