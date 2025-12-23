import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Header } from '../components/layout'
import { 
  Phone, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  X, 
  Clock,
  FileText,
  Edit3,
  ExternalLink,
  Settings,
  ChevronDown
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn, getInitials } from '../lib/utils'

type MainTab = 'outstanding' | 'history'

// Configuration for calls per month (can be made dynamic later)
const CALLS_PER_MONTH = 2

export function ClientCallsPage() {
  const queryClient = useQueryClient()
  const [mainTab, setMainTab] = useState<MainTab>('outstanding')
  const [selectedMemberForCall, setSelectedMemberForCall] = useState<any>(null)
  const [selectedCallForEdit, setSelectedCallForEdit] = useState<any>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [callsPerMonth, setCallsPerMonth] = useState(CALLS_PER_MONTH)

  // Get current month date range
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // Fetch all members
  const { data: members = [] } = useQuery({
    queryKey: ['members-for-calls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, email, business_arena, status')
        .eq('status', 'ACTIVE')
        .order('first_name')
      if (error) throw error
      return data
    }
  })

  // Fetch calls for current month
  const { data: monthCalls = [] } = useQuery({
    queryKey: ['month-calls', monthStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_call')
        .select('*')
        .gte('date', monthStart.toISOString())
        .lte('date', monthEnd.toISOString())
      if (error) throw error
      return data
    }
  })

  // Fetch all calls for history
  const { data: allCalls = [], isLoading: isLoadingCalls } = useQuery({
    queryKey: ['all-client-calls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_call')
        .select('*, member:members(id, first_name, last_name, business_arena)')
        .order('date', { ascending: false })
      if (error) throw error
      return data
    }
  })

  // Calculate outstanding calls
  const outstandingMembers = members.map(member => {
    const memberCalls = monthCalls.filter(call => call.member_id === member.id)
    const callsCompleted = memberCalls.length
    const callsRemaining = Math.max(0, callsPerMonth - callsCompleted)
    return {
      ...member,
      callsCompleted,
      callsRemaining,
      lastCall: memberCalls.length > 0 
        ? memberCalls.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null
    }
  }).filter(m => m.callsRemaining > 0)

  // Stats
  const stats = {
    totalMembers: members.length,
    membersWithOutstanding: outstandingMembers.length,
    callsCompletedThisMonth: monthCalls.length,
    callsRequired: members.length * callsPerMonth,
  }

  const handleLogCall = (member: any) => {
    setSelectedCallForEdit(null)
    setSelectedMemberForCall(member)
  }

  const handleEditCall = (call: any) => {
    setSelectedMemberForCall(null)
    setSelectedCallForEdit(call)
  }

  const handleCallSaved = () => {
    setSelectedMemberForCall(null)
    setSelectedCallForEdit(null)
    queryClient.invalidateQueries({ queryKey: ['month-calls'] })
    queryClient.invalidateQueries({ queryKey: ['all-client-calls'] })
  }

  const handleCancel = () => {
    setSelectedMemberForCall(null)
    setSelectedCallForEdit(null)
  }

  const statCards = [
    { name: 'Outstanding Members', value: stats.membersWithOutstanding, icon: AlertCircle, color: 'orange' },
    { name: 'Calls This Month', value: stats.callsCompletedThisMonth, icon: Phone, color: 'green' },
    { name: 'Target Calls', value: stats.callsRequired, icon: Calendar, color: 'blue' },
    { name: 'Active Members', value: stats.totalMembers, icon: CheckCircle, color: 'gold' },
  ]

  return (
    <div>
      <Header 
        title="Client Calls" 
        subtitle="Track bi-weekly check-in calls with members"
        actions={
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-2 bg-cave-bg-elevated border border-cave-border text-cave-text-secondary rounded-lg flex items-center gap-2 hover:border-cave-gold/50"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.name} className="card p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  stat.color === 'orange' && "bg-orange-500/15",
                  stat.color === 'green' && "bg-green-500/15",
                  stat.color === 'blue' && "bg-blue-500/15",
                  stat.color === 'gold' && "bg-cave-gold/15"
                )}>
                  <stat.icon className={cn(
                    "w-4 h-4",
                    stat.color === 'orange' && "text-orange-500",
                    stat.color === 'green' && "text-green-500",
                    stat.color === 'blue' && "text-blue-500",
                    stat.color === 'gold' && "text-cave-gold"
                  )} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-cave-text-primary">{stat.value}</p>
                  <p className="text-sm text-cave-text-secondary">{stat.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Month indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cave-text-secondary">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {monthStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </span>
            <span className="text-cave-text-muted">•</span>
            <span className="text-sm">{callsPerMonth} calls per member required</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-cave-border">
          <button
            onClick={() => setMainTab('outstanding')}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              mainTab === 'outstanding'
                ? "border-cave-gold text-cave-gold"
                : "border-transparent text-cave-text-secondary hover:text-cave-text-primary"
            )}
          >
            <AlertCircle className="w-4 h-4" />
            Outstanding
            {stats.membersWithOutstanding > 0 && (
              <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">
                {stats.membersWithOutstanding}
              </span>
            )}
          </button>
          <button
            onClick={() => setMainTab('history')}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              mainTab === 'history'
                ? "border-cave-gold text-cave-gold"
                : "border-transparent text-cave-text-secondary hover:text-cave-text-primary"
            )}
          >
            <FileText className="w-4 h-4" />
            Call History
            <span className="px-1.5 py-0.5 bg-cave-gold/20 text-cave-gold text-xs font-bold rounded">
              {allCalls.length}
            </span>
          </button>
        </div>

        {/* Outstanding Tab */}
        {mainTab === 'outstanding' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {outstandingMembers.length === 0 ? (
                <div className="card p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-cave-text-primary font-medium">All caught up!</p>
                  <p className="text-cave-text-muted text-sm">All members have completed their calls this month.</p>
                </div>
              ) : (
                outstandingMembers.map((member) => (
                  <OutstandingMemberCard
                    key={member.id}
                    member={member}
                    onLogCall={() => handleLogCall(member)}
                    isSelected={selectedMemberForCall?.id === member.id}
                  />
                ))
              )}
            </div>

            {/* Right Panel - Log Call Form */}
            <div className="card">
              {selectedMemberForCall ? (
                <LogCallForm
                  member={selectedMemberForCall}
                  onSuccess={handleCallSaved}
                  onCancel={handleCancel}
                />
              ) : (
                <div className="p-6 text-center text-cave-text-muted">
                  <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a member to log a call</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {mainTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {isLoadingCalls ? (
                <div className="card p-8 text-center text-cave-text-muted">Loading...</div>
              ) : allCalls.length === 0 ? (
                <div className="card p-8 text-center text-cave-text-muted">No calls recorded yet</div>
              ) : (
                allCalls.map((call: any) => (
                  <CallHistoryCard
                    key={call.id}
                    call={call}
                    onEdit={() => handleEditCall(call)}
                    isSelected={selectedCallForEdit?.id === call.id}
                  />
                ))
              )}
            </div>

            {/* Right Panel - Edit Call Form */}
            <div className="card">
              {selectedCallForEdit ? (
                <EditCallForm
                  call={selectedCallForEdit}
                  onSuccess={handleCallSaved}
                  onCancel={handleCancel}
                />
              ) : (
                <div className="p-6 text-center text-cave-text-muted">
                  <Edit3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a call to view/edit details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-cave-bg-card rounded-lg w-full max-w-md m-4">
            <div className="flex items-center justify-between p-4 border-b border-cave-border">
              <h2 className="text-lg font-bold text-cave-text-primary">Call Settings</h2>
              <button onClick={() => setShowSettingsModal(false)}>
                <X className="w-5 h-5 text-cave-text-muted" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-cave-text-secondary mb-1">
                  Calls Required Per Month
                </label>
                <select
                  value={callsPerMonth}
                  onChange={(e) => setCallsPerMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary"
                >
                  <option value={1}>1 call per month</option>
                  <option value={2}>2 calls per month</option>
                  <option value={3}>3 calls per month</option>
                  <option value={4}>4 calls per month</option>
                </select>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full px-4 py-2 bg-cave-gold text-cave-bg-primary font-bold rounded-lg"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OutstandingMemberCard({ 
  member, 
  onLogCall, 
  isSelected 
}: { 
  member: any
  onLogCall: () => void
  isSelected: boolean
}) {
  return (
    <div className={cn(
      "card p-4 transition-all",
      isSelected && "ring-2 ring-cave-gold"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cave-bg-elevated flex items-center justify-center">
            <span className="text-cave-gold font-bold text-sm">
              {getInitials(member.first_name || '', member.last_name || '')}
            </span>
          </div>
          <div>
            <p className="text-cave-text-primary font-medium">
              {member.first_name} {member.last_name}
            </p>
            <p className="text-xs text-cave-text-muted">{member.business_arena || 'Unknown'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1">
              {[...Array(member.callsCompleted)].map((_, i) => (
                <div key={`done-${i}`} className="w-3 h-3 rounded-full bg-green-500" />
              ))}
              {[...Array(member.callsRemaining)].map((_, i) => (
                <div key={`pending-${i}`} className="w-3 h-3 rounded-full bg-orange-500/30 border border-orange-500" />
              ))}
            </div>
            <p className="text-xs text-cave-text-muted mt-1">
              {member.callsRemaining} call{member.callsRemaining !== 1 ? 's' : ''} remaining
            </p>
          </div>

          <button
            onClick={onLogCall}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded flex items-center gap-2",
              isSelected
                ? "bg-cave-gold text-cave-bg-primary"
                : "bg-green-500 text-white"
            )}
          >
            <Phone className="w-4 h-4" />
            Log Call
          </button>
        </div>
      </div>

      {member.lastCall && (
        <div className="mt-3 pt-3 border-t border-cave-border">
          <p className="text-xs text-cave-text-muted">
            Last call: {new Date(member.lastCall.date).toLocaleDateString('en-GB', { 
              day: 'numeric', 
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
      )}
    </div>
  )
}

function CallHistoryCard({ 
  call, 
  onEdit, 
  isSelected 
}: { 
  call: any
  onEdit: () => void
  isSelected: boolean
}) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No date'
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={cn(
      "card p-4 transition-all",
      isSelected && "ring-2 ring-cave-gold"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cave-bg-elevated flex items-center justify-center">
            <span className="text-cave-gold font-bold text-sm">
              {getInitials(call.member?.first_name || '', call.member?.last_name || '')}
            </span>
          </div>
          <div>
            <p className="text-cave-text-primary font-medium">
              {call.member?.first_name} {call.member?.last_name}
            </p>
            <p className="text-xs text-cave-text-muted">{call.member?.business_arena || 'Unknown'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-cave-text-muted">{formatDate(call.date)}</span>
          {call.recording && (
            <a 
              href={call.recording} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 text-cave-text-muted hover:text-cave-gold"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {call.notes && (
        <div className="mb-3">
          <p className="text-xs text-cave-text-muted mb-1">NOTES</p>
          <p className="text-sm text-cave-text-secondary line-clamp-3">{call.notes}</p>
        </div>
      )}

      {call.feedback && (
        <div className="mb-3">
          <p className="text-xs text-cave-text-muted mb-1">FEEDBACK</p>
          <p className="text-sm text-cave-text-secondary line-clamp-2">{call.feedback}</p>
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-cave-border">
        <button
          onClick={onEdit}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded flex items-center gap-1",
            isSelected
              ? "bg-cave-gold/10 text-cave-gold"
              : "text-cave-text-secondary hover:text-cave-gold"
          )}
        >
          <Edit3 className="w-3 h-3" />
          Edit
        </button>
      </div>
    </div>
  )
}

function LogCallForm({ 
  member, 
  onSuccess, 
  onCancel 
}: { 
  member: any
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    recording: '',
    date: new Date().toISOString().slice(0, 16),
    notes: '',
    feedback: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from('client_call').insert({
        member_id: member.id,
        recording: formData.recording || null,
        date: formData.date ? new Date(formData.date).toISOString() : null,
        notes: formData.notes || null,
        feedback: formData.feedback || null,
      })

      if (error) throw error
      onSuccess()
    } catch (error) {
      console.error('Error logging call:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Phone className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-bold text-cave-text-primary">Log Call</h2>
        </div>
        <p className="text-sm text-cave-text-muted">Record call details for {member.first_name}</p>
      </div>

      {/* Member info */}
      <div className="mb-4 p-3 bg-cave-bg-elevated rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cave-bg-card flex items-center justify-center">
            <span className="text-cave-gold font-bold text-xs">
              {getInitials(member.first_name || '', member.last_name || '')}
            </span>
          </div>
          <div>
            <p className="text-sm text-cave-text-primary font-medium">
              {member.first_name} {member.last_name}
            </p>
            <p className="text-xs text-cave-text-muted">{member.business_arena || 'Unknown'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-cave-text-secondary mb-1">
            Date & Time *
          </label>
          <input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-cave-text-secondary mb-1">
            Fathom Recording URL
          </label>
          <input
            type="url"
            value={formData.recording}
            onChange={(e) => setFormData({ ...formData, recording: e.target.value })}
            className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary"
            placeholder="https://fathom.video/share/..."
          />
        </div>

        <div>
          <label className="block text-sm text-cave-text-secondary mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary resize-none"
            rows={5}
            placeholder="Call notes, discussion points, action items..."
          />
        </div>

        <div>
          <label className="block text-sm text-cave-text-secondary mb-1">
            Member Feedback
          </label>
          <textarea
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary resize-none"
            rows={2}
            placeholder="Any feedback from the member..."
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-green-500 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Log Call'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-cave-bg-elevated border border-cave-border text-cave-text-secondary rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}

function EditCallForm({ 
  call, 
  onSuccess, 
  onCancel 
}: { 
  call: any
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    recording: call.recording || '',
    date: call.date ? new Date(call.date).toISOString().slice(0, 16) : '',
    notes: call.notes || '',
    feedback: call.feedback || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setFormData({
      recording: call.recording || '',
      date: call.date ? new Date(call.date).toISOString().slice(0, 16) : '',
      notes: call.notes || '',
      feedback: call.feedback || '',
    })
  }, [call])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('client_call')
        .update({
          recording: formData.recording || null,
          date: formData.date ? new Date(formData.date).toISOString() : null,
          notes: formData.notes || null,
          feedback: formData.feedback || null,
        })
        .eq('id', call.id)

      if (error) throw error
      onSuccess()
    } catch (error) {
      console.error('Error updating call:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Edit3 className="w-5 h-5 text-cave-gold" />
          <h2 className="text-lg font-bold text-cave-text-primary">Edit Call</h2>
        </div>
        <p className="text-sm text-cave-text-muted">
          Update call details for {call.member?.first_name} {call.member?.last_name}
        </p>
      </div>

      {/* Member info */}
      <div className="mb-4 p-3 bg-cave-bg-elevated rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cave-bg-card flex items-center justify-center">
            <span className="text-cave-gold font-bold text-xs">
              {getInitials(call.member?.first_name || '', call.member?.last_name || '')}
            </span>
          </div>
          <div>
            <p className="text-sm text-cave-text-primary font-medium">
              {call.member?.first_name} {call.member?.last_name}
            </p>
            <p className="text-xs text-cave-text-muted">{call.member?.business_arena || 'Unknown'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-cave-text-secondary mb-1">
            Date & Time
          </label>
          <input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-cave-text-secondary mb-1">
            Fathom Recording URL
          </label>
          <input
            type="url"
            value={formData.recording}
            onChange={(e) => setFormData({ ...formData, recording: e.target.value })}
            className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary"
            placeholder="https://fathom.video/share/..."
          />
          {formData.recording && (
            <a 
              href={formData.recording}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-xs text-cave-gold hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Open recording
            </a>
          )}
        </div>

        <div>
          <label className="block text-sm text-cave-text-secondary mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary resize-none"
            rows={5}
            placeholder="Call notes, discussion points, action items..."
          />
        </div>

        <div>
          <label className="block text-sm text-cave-text-secondary mb-1">
            Member Feedback
          </label>
          <textarea
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary resize-none"
            rows={2}
            placeholder="Any feedback from the member..."
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-cave-gold to-yellow-600 text-cave-bg-primary font-bold rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Update Call'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-cave-bg-elevated border border-cave-border text-cave-text-secondary rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}

