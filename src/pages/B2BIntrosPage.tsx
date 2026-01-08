// src/pages/B2BIntrosPage.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Handshake, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  Loader2,
  Building2,
  User,
  FileText,
  PoundSterling
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useIntros, useUpdateIntro, useB2BStats, useAssessments } from '../hooks/useB2B'
import { cn } from '../lib/utils'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  intro_made: { label: 'Intro Made', color: 'text-cave-gold', bg: 'bg-cave-gold/10' },
  closed: { label: 'Closed', color: 'text-cave-status-success', bg: 'bg-cave-status-success/10' },
  lost: { label: 'Lost', color: 'text-cave-status-error', bg: 'bg-cave-status-error/10' }
}

type StatusFilter = 'all' | 'active' | 'pending_followup' | 'closed'
type ViewMode = 'intros' | 'assessments'

export function B2BIntrosPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('intros')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [expandedIntro, setExpandedIntro] = useState<string | null>(null)
  const [editingDealAmount, setEditingDealAmount] = useState<string | null>(null)
  const [dealAmountValue, setDealAmountValue] = useState<string>('')
  
  const queryClient = useQueryClient()
  const { data: stats } = useB2BStats()
  const { data: intros, isLoading } = useIntros(
    statusFilter === 'pending_followup' 
      ? { needs_followup: true }
      : statusFilter === 'active'
        ? { status: undefined } // Will filter client-side
        : undefined
  )
  const updateIntro = useUpdateIntro()
  
  // Update deal amount mutation
  const updateDealAmount = useMutation({
    mutationFn: async ({ introId, amount }: { introId: string, amount: number | null }) => {
      const { error } = await supabase
        .from('b2b_intros')
        .update({ deal_amount: amount })
        .eq('id', introId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-intros'] })
      queryClient.invalidateQueries({ queryKey: ['b2b-stats'] })
      setEditingDealAmount(null)
      setDealAmountValue('')
    }
  })
  
  const handleSaveDealAmount = (introId: string) => {
    const amount = dealAmountValue ? parseFloat(dealAmountValue) : null
    updateDealAmount.mutate({ introId, amount })
  }
  
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '—'
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  // Filter intros based on status
  const filteredIntros = intros?.filter(intro => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'active') return intro.status === 'intro_made'
    if (statusFilter === 'closed') return ['closed', 'lost'].includes(intro.status)
    return true
  })
  
  const handleStatusUpdate = async (introId: string, newStatus: string) => {
    await updateIntro.mutateAsync({ introId, status: newStatus })
  }
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }
  
  const getDaysUntilFollowup = (nextFollowup: string | null) => {
    if (!nextFollowup) return null
    const days = Math.ceil((new Date(nextFollowup).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cave-text-primary flex items-center gap-3">
            <Handshake className="w-7 h-7 text-cave-gold" />
            B2B Intros
          </h1>
          <p className="text-cave-text-secondary mt-1">
            Track and manage partner introductions
          </p>
        </div>
        <Link
          to="/b2b/assess"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cave-gold text-cave-bg-primary font-semibold hover:bg-cave-gold/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Assessment
        </Link>
      </div>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-4">
            <p className="text-cave-text-secondary text-sm">Total Intros</p>
            <p className="text-2xl font-bold text-cave-text-primary mt-1">{stats.total_intros}</p>
          </div>
          <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-4">
            <p className="text-cave-text-secondary text-sm">Intro Made</p>
            <p className="text-2xl font-bold text-cave-gold mt-1">
              {stats.intro_by_status?.intro_made || 0}
            </p>
          </div>
          <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-4">
            <p className="text-cave-text-secondary text-sm">Pending Followup</p>
            <p className="text-2xl font-bold text-cave-status-warning mt-1">{stats.pending_followups}</p>
          </div>
        </div>
      )}
      
      {/* View Mode Toggle */}
      <div className="flex gap-2 border-b border-cave-border pb-4">
        <button
          onClick={() => setViewMode('intros')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            viewMode === 'intros'
              ? "bg-cave-gold text-cave-bg-primary"
              : "bg-cave-bg-secondary text-cave-text-secondary hover:text-cave-text-primary"
          )}
        >
          <Handshake className="w-4 h-4 inline-block mr-2" />
          Intros
        </button>
        <button
          onClick={() => setViewMode('assessments')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            viewMode === 'assessments'
              ? "bg-cave-gold text-cave-bg-primary"
              : "bg-cave-bg-secondary text-cave-text-secondary hover:text-cave-text-primary"
          )}
        >
          <FileText className="w-4 h-4 inline-block mr-2" />
          Assessments
        </button>
      </div>
      
      {viewMode === 'intros' ? (
        <>
          {/* Filters */}
          <div className="flex gap-2">
            {[
              { key: 'active', label: 'Active' },
              { key: 'pending_followup', label: 'Needs Followup' },
              { key: 'closed', label: 'Closed' },
              { key: 'all', label: 'All' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key as StatusFilter)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  statusFilter === filter.key
                    ? "bg-cave-gold text-cave-bg-primary"
                    : "bg-cave-bg-secondary text-cave-text-secondary hover:text-cave-text-primary"
                )}
              >
                {filter.label}
          </button>
        ))}
      </div>
      
      {/* Intros List */}
      <div className="bg-cave-bg-secondary rounded-xl border border-cave-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cave-gold mx-auto" />
          </div>
        ) : filteredIntros?.length === 0 ? (
          <div className="p-8 text-center text-cave-text-secondary">
            No intros found
          </div>
        ) : (
          <div className="divide-y divide-cave-border">
            {filteredIntros?.map((intro) => {
              const statusConfig = STATUS_CONFIG[intro.status]
              const daysUntil = getDaysUntilFollowup(intro.next_followup_at)
              const isExpanded = expandedIntro === intro.id
              
              return (
                <div key={intro.id} className="hover:bg-cave-bg-elevated/50 transition-colors">
                  {/* Main Row */}
                  <div 
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedIntro(isExpanded ? null : intro.id)}
                  >
                    {/* Member */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-cave-text-muted" />
                        <span className="font-medium text-cave-text-primary truncate">
                          {intro.member_name || 'Unknown'}
                        </span>
                        {intro.member_display_id && (
                          <span className="text-xs text-cave-text-muted">
                            ({intro.member_display_id})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Partner */}
                    <div className="flex items-center gap-2 w-32">
                      <Building2 className="w-4 h-4 text-cave-text-muted" />
                      <span className="text-cave-text-secondary">{intro.partner_name}</span>
                    </div>
                    
                    {/* Status */}
                    <div className="w-28">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        statusConfig.bg,
                        statusConfig.color
                      )}>
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    {/* Next Followup */}
                    <div className="w-32 text-sm">
                      {intro.next_followup_at ? (
                        <div className={cn(
                          "flex items-center gap-1",
                          daysUntil !== null && daysUntil <= 0 
                            ? "text-cave-status-error" 
                            : daysUntil !== null && daysUntil <= 2
                              ? "text-cave-status-warning"
                              : "text-cave-text-secondary"
                        )}>
                          <Clock className="w-4 h-4" />
                          {daysUntil !== null && daysUntil <= 0 
                            ? 'Overdue'
                            : daysUntil === 1
                              ? 'Tomorrow'
                              : `${daysUntil} days`
                          }
                        </div>
                      ) : (
                        <span className="text-cave-text-muted">—</span>
                      )}
                    </div>
                    
                    {/* Intro Date */}
                    <div className="w-28 text-sm text-cave-text-secondary">
                      {formatDate(intro.intro_date)}
                    </div>
                    
                    {/* Expand Icon */}
                    <ChevronDown className={cn(
                      "w-5 h-5 text-cave-text-muted transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-cave-border/50 mt-0 pt-4 bg-cave-bg-elevated/30">
                      <div className="space-y-4">
                        {/* Update Status */}
                        <div>
                          <label className="block text-sm font-medium text-cave-text-secondary mb-2">
                            Status
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                              <button
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusUpdate(intro.id, status)
                                }}
                                disabled={updateIntro.isPending || intro.status === status}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                  intro.status === status
                                    ? `${config.bg} ${config.color} ring-2 ring-current`
                                    : "bg-cave-bg-primary text-cave-text-secondary hover:text-cave-text-primary",
                                  "disabled:opacity-50"
                                )}
                              >
                                {config.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Deal Amount */}
                        <div>
                          <label className="block text-sm font-medium text-cave-text-secondary mb-2">
                            Deal Amount
                          </label>
                          {editingDealAmount === intro.id ? (
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1 max-w-xs">
                                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cave-text-muted" />
                                <input
                                  type="number"
                                  value={dealAmountValue}
                                  onChange={(e) => setDealAmountValue(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="0"
                                  className="w-full pl-9 pr-4 py-2 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold"
                                />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSaveDealAmount(intro.id)
                                }}
                                disabled={updateDealAmount.isPending}
                                className="px-3 py-2 rounded-lg bg-cave-gold text-cave-bg-primary text-sm font-medium"
                              >
                                {updateDealAmount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingDealAmount(null)
                                  setDealAmountValue('')
                                }}
                                className="px-3 py-2 text-cave-text-secondary text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingDealAmount(intro.id)
                                setDealAmountValue(intro.deal_amount?.toString() || '')
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cave-bg-primary text-cave-text-secondary hover:text-cave-text-primary"
                            >
                              <PoundSterling className="w-4 h-4" />
                              <span>{formatCurrency(intro.deal_amount)}</span>
                            </button>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="space-y-2 text-sm">
                          {intro.last_followup_at && (
                            <p className="text-cave-text-secondary">
                              <span className="text-cave-text-muted">Last followup:</span>{' '}
                              {formatDate(intro.last_followup_at)}
                            </p>
                          )}
                          {intro.notes && (
                            <p className="text-cave-text-secondary">
                              <span className="text-cave-text-muted">Notes:</span>{' '}
                              {intro.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
        </>
      ) : (
        <AssessmentsView formatDate={formatDate} />
      )}
    </div>
  )
}

// Assessments View Component
function AssessmentsView({ formatDate }: { formatDate: (d: string) => string }) {
  const { data: assessments, isLoading } = useAssessments({ limit: 100 })
  
  if (isLoading) {
    return (
      <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-cave-gold mx-auto" />
      </div>
    )
  }
  
  return (
    <div className="bg-cave-bg-secondary rounded-xl border border-cave-border overflow-hidden">
      {assessments?.length === 0 ? (
        <div className="p-8 text-center text-cave-text-secondary">
          No assessments found
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-cave-bg-elevated">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-cave-text-secondary">Member</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-cave-text-secondary">B2B Fit</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-cave-text-secondary">Intros</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-cave-text-secondary">Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-cave-text-secondary"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cave-border">
            {assessments?.map((assessment) => (
              <tr key={assessment.id} className="hover:bg-cave-bg-elevated/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-cave-text-muted" />
                    <span className="text-cave-text-primary font-medium">
                      {assessment.member_name || 'Unknown'}
                    </span>
                    {assessment.member_display_id && (
                      <span className="text-xs text-cave-text-muted">
                        ({assessment.member_display_id})
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {assessment.is_b2b_fit ? (
                    <span className="flex items-center gap-1 text-cave-status-success">
                      <CheckCircle className="w-4 h-4" />
                      Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-cave-text-muted">
                      <XCircle className="w-4 h-4" />
                      No
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-cave-text-secondary">
                  {/* We'd need to fetch intro count - for now show indicator */}
                  {assessment.is_b2b_fit ? (
                    <span className="text-cave-gold">View →</span>
                  ) : (
                    <span className="text-cave-text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-cave-text-secondary">
                  {formatDate(assessment.assessed_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/b2b/assess/${assessment.id}`}
                    className="text-sm text-cave-gold hover:text-cave-gold/80"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}