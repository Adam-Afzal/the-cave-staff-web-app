// src/pages/B2BAssessmentDetailPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft,
  User,
  CheckCircle,
  XCircle,
  Building2,
  Plus,
  Loader2,
  Trash2,
  Save,
  PoundSterling
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { usePartners } from '../hooks/useB2B'
import { cn } from '../lib/utils'


interface Assessment {
  id: string
  member_id: string
  is_b2b_fit: boolean
  no_fit_reason: string | null
  notes: string | null
  assessed_at: string
  members: {
    first_name: string | null
    last_name: string | null
    email: string | null
    member_id: string | null
  }
  intros: Array<{
    id: string
    partner_id: string
    status: string
    intro_date: string
    deal_amount: number | null
    partners: {
      name: string
      slug: string
    }
  }>
}

const INTRO_STATUS_OPTIONS = [
  { value: 'intro_made', label: 'Intro Made' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' }
]

export function B2BAssessmentDetailPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: partners } = usePartners()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState('')
  const [selectedNewPartners, setSelectedNewPartners] = useState<string[]>([])
  const [newIntroStatus, setNewIntroStatus] = useState<string>('intro_made')
  const [showAddIntro, setShowAddIntro] = useState(false)
  const [editingDealAmount, setEditingDealAmount] = useState<string | null>(null)
  const [dealAmountValue, setDealAmountValue] = useState<string>('')
  
  // Fetch assessment with intros
  const { data: assessment, isLoading } = useQuery({
    queryKey: ['b2b-assessment-detail', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('b2b_assessments')
        .select(`
          *,
          members (first_name, last_name, email, member_id),
          intros:b2b_intros (
            id,
            partner_id,
            status,
            intro_date,
            deal_amount,
            partners (name, slug)
          )
        `)
        .eq('id', assessmentId)
        .single()
      
      if (error) throw error
      return data as Assessment
    },
    enabled: !!assessmentId
  })
  
  useEffect(() => {
    if (assessment) {
      setEditedNotes(assessment.notes || '')
    }
  }, [assessment])
  
  // Update assessment mutation
  const updateAssessment = useMutation({
    mutationFn: async (data: { notes?: string }) => {
      const { error } = await supabase
        .from('b2b_assessments')
        .update(data)
        .eq('id', assessmentId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-assessment-detail', assessmentId] })
      setIsEditing(false)
    }
  })
  
  // Add intro mutation
  const addIntro = useMutation({
    mutationFn: async ({ partnerIds, status }: { partnerIds: string[], status: string }) => {
      const intros = partnerIds.map(partnerId => ({
        assessment_id: assessmentId,
        member_id: assessment!.member_id,
        partner_id: partnerId,
        status: status,
        intro_date: new Date().toISOString(),
        next_followup_at: status === 'intro_made' 
          ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() 
          : null
      }))
      
      const { error } = await supabase
        .from('b2b_intros')
        .insert(intros)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-assessment-detail', assessmentId] })
      queryClient.invalidateQueries({ queryKey: ['b2b-intros'] })
      queryClient.invalidateQueries({ queryKey: ['b2b-stats'] })
      setSelectedNewPartners([])
      setNewIntroStatus('intro_made')
      setShowAddIntro(false)
    }
  })
  
  // Update intro status mutation
  const updateIntroStatus = useMutation({
    mutationFn: async ({ introId, status }: { introId: string, status: string }) => {
      const updateData: Record<string, any> = { status }
      
      // If changing to intro_made, set next followup to 3 days from now
      if (status === 'intro_made') {
        updateData.next_followup_at = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        updateData.intro_date = new Date().toISOString()
        updateData.closed_at = null
      } else {
        // closed or lost - stop all reminders
        updateData.next_followup_at = null
        updateData.closed_at = new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('b2b_intros')
        .update(updateData)
        .eq('id', introId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-assessment-detail', assessmentId] })
      queryClient.invalidateQueries({ queryKey: ['b2b-intros'] })
      queryClient.invalidateQueries({ queryKey: ['b2b-stats'] })
    }
  })
  
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
      queryClient.invalidateQueries({ queryKey: ['b2b-assessment-detail', assessmentId] })
      queryClient.invalidateQueries({ queryKey: ['b2b-intros'] })
      setEditingDealAmount(null)
      setDealAmountValue('')
    }
  })
  
  // Delete intro mutation
  const deleteIntro = useMutation({
    mutationFn: async (introId: string) => {
      const { error } = await supabase
        .from('b2b_intros')
        .delete()
        .eq('id', introId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-assessment-detail', assessmentId] })
      queryClient.invalidateQueries({ queryKey: ['b2b-intros'] })
      queryClient.invalidateQueries({ queryKey: ['b2b-stats'] })
    }
  })
  
  const handleSaveNotes = () => {
    updateAssessment.mutate({ notes: editedNotes })
  }
  
  const handleAddIntros = () => {
    if (selectedNewPartners.length > 0) {
      addIntro.mutate({ partnerIds: selectedNewPartners, status: newIntroStatus })
    }
  }
  
  const handlePartnerToggle = (partnerId: string) => {
    setSelectedNewPartners(prev => 
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    )
  }
  
  const handleSaveDealAmount = (introId: string) => {
    const amount = dealAmountValue ? parseFloat(dealAmountValue) : null
    updateDealAmount.mutate({ introId, amount })
  }
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '—'
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  // Get partners that don't already have intros
  const existingPartnerIds = assessment?.intros.map(i => i.partner_id) || []
  const availablePartners = partners?.filter(p => 
    !existingPartnerIds.includes(p.id) && p.slug !== 'other'
  ) || []
  
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cave-gold" />
      </div>
    )
  }
  
  if (!assessment) {
    return (
      <div className="p-6">
        <p className="text-cave-text-secondary">Assessment not found</p>
      </div>
    )
  }
  
  const memberName = `${assessment.members.first_name || ''} ${assessment.members.last_name || ''}`.trim() 
    || assessment.members.email 
    || 'Unknown'
  
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-cave-bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-cave-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-cave-text-primary">Assessment Details</h1>
          <p className="text-cave-text-secondary">
            {formatDate(assessment.assessed_at)}
          </p>
        </div>
      </div>
      
      {/* Member Info Card */}
      <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-cave-gold/20 flex items-center justify-center">
              <User className="w-6 h-6 text-cave-gold" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-cave-text-primary">{memberName}</h2>
              <p className="text-cave-text-secondary">
                {assessment.members.member_id || assessment.members.email}
              </p>
            </div>
          </div>
          
          {/* B2B Fit Badge */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg",
            assessment.is_b2b_fit 
              ? "bg-cave-status-success/10 text-cave-status-success"
              : "bg-cave-status-error/10 text-cave-status-error"
          )}>
            {assessment.is_b2b_fit ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">
              {assessment.is_b2b_fit ? 'B2B Fit' : 'Not a Fit'}
            </span>
          </div>
        </div>
        
        {!assessment.is_b2b_fit && assessment.no_fit_reason && (
          <div className="mt-4 pt-4 border-t border-cave-border">
            <p className="text-sm text-cave-text-muted">Reason</p>
            <p className="text-cave-text-secondary capitalize">
              {assessment.no_fit_reason.replace(/_/g, ' ')}
            </p>
          </div>
        )}
      </div>
      
      {/* Notes Section */}
      <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-cave-text-primary">Notes</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-cave-gold hover:text-cave-gold/80"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditedNotes(assessment.notes || '')
                }}
                className="text-sm text-cave-text-secondary hover:text-cave-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={updateAssessment.isPending}
                className="flex items-center gap-1 text-sm text-cave-gold hover:text-cave-gold/80"
              >
                {updateAssessment.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
            </div>
          )}
        </div>
        
        {isEditing ? (
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            placeholder="Add notes..."
            rows={4}
            className="w-full px-4 py-3 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold resize-none"
          />
        ) : (
          <p className="text-cave-text-secondary">
            {assessment.notes || 'No notes added'}
          </p>
        )}
      </div>
      
      {/* Intros Section */}
      {assessment.is_b2b_fit && (
        <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-cave-text-primary">
              Partner Intros ({assessment.intros.length})
            </h3>
            {availablePartners.length > 0 && !showAddIntro && (
              <button
                onClick={() => setShowAddIntro(true)}
                className="flex items-center gap-1 text-sm text-cave-gold hover:text-cave-gold/80"
              >
                <Plus className="w-4 h-4" />
                Add Intro
              </button>
            )}
          </div>
          
          {/* Existing Intros */}
          {assessment.intros.length > 0 ? (
            <div className="space-y-3 mb-4">
              {assessment.intros.map((intro) => (
                <div 
                  key={intro.id}
                  className="p-4 bg-cave-bg-elevated rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-cave-gold" />
                      <div>
                        <p className="font-medium text-cave-text-primary">
                          {intro.partners.name}
                        </p>
                        <p className="text-xs text-cave-text-muted">
                          {formatDate(intro.intro_date)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Delete this intro?')) {
                          deleteIntro.mutate(intro.id)
                        }
                      }}
                      className="p-1 text-cave-text-muted hover:text-cave-status-error transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Status Selection */}
                  <div className="mb-3">
                    <label className="block text-xs text-cave-text-muted mb-2">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {INTRO_STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateIntroStatus.mutate({ introId: intro.id, status: option.value })}
                          disabled={updateIntroStatus.isPending}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            intro.status === option.value
                              ? option.value === 'closed'
                                ? "bg-cave-status-success/20 text-cave-status-success ring-1 ring-cave-status-success"
                                : option.value === 'lost'
                                  ? "bg-cave-status-error/20 text-cave-status-error ring-1 ring-cave-status-error"
                                  : "bg-cave-gold/20 text-cave-gold ring-1 ring-cave-gold"
                              : "bg-cave-bg-primary text-cave-text-secondary hover:text-cave-text-primary",
                            "disabled:opacity-50"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Deal Amount */}
                  <div>
                    <label className="block text-xs text-cave-text-muted mb-2">Deal Amount</label>
                    {editingDealAmount === intro.id ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cave-text-muted" />
                          <input
                            type="number"
                            value={dealAmountValue}
                            onChange={(e) => setDealAmountValue(e.target.value)}
                            placeholder="0"
                            className="w-full pl-9 pr-4 py-2 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold"
                          />
                        </div>
                        <button
                          onClick={() => handleSaveDealAmount(intro.id)}
                          disabled={updateDealAmount.isPending}
                          className="px-3 py-2 rounded-lg bg-cave-gold text-cave-bg-primary text-sm font-medium"
                        >
                          {updateDealAmount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </button>
                        <button
                          onClick={() => {
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
                        onClick={() => {
                          setEditingDealAmount(intro.id)
                          setDealAmountValue(intro.deal_amount?.toString() || '')
                        }}
                        className="flex items-center gap-2 text-cave-text-secondary hover:text-cave-text-primary"
                      >
                        <PoundSterling className="w-4 h-4" />
                        <span>{formatCurrency(intro.deal_amount)}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cave-text-secondary mb-4">No intros yet</p>
          )}
          
          {/* Add New Intros */}
          {showAddIntro && (
            <div className="pt-4 border-t border-cave-border">
              <p className="text-sm font-medium text-cave-text-primary mb-3">
                Select partners to intro:
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {availablePartners.map((partner) => (
                  <button
                    key={partner.id}
                    type="button"
                    onClick={() => handlePartnerToggle(partner.id)}
                    className={cn(
                      "p-3 rounded-lg border transition-all flex items-center gap-3",
                      selectedNewPartners.includes(partner.id)
                        ? "border-cave-gold bg-cave-gold/10"
                        : "border-cave-border hover:border-cave-gold/50"
                    )}
                  >
                    <Building2 className={cn(
                      "w-5 h-5",
                      selectedNewPartners.includes(partner.id) ? "text-cave-gold" : "text-cave-text-muted"
                    )} />
                    <span className={cn(
                      "font-medium",
                      selectedNewPartners.includes(partner.id) ? "text-cave-gold" : "text-cave-text-secondary"
                    )}>{partner.name}</span>
                  </button>
                ))}
              </div>
              
              {/* Intro Status Selection */}
              {selectedNewPartners.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-cave-text-primary mb-2">
                    Intro Status
                  </label>
                  <select
                    value={newIntroStatus}
                    onChange={(e) => setNewIntroStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold"
                  >
                    {INTRO_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddIntro(false)
                    setSelectedNewPartners([])
                    setNewIntroStatus('intro_made')
                  }}
                  className="px-4 py-2 text-cave-text-secondary hover:text-cave-text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIntros}
                  disabled={selectedNewPartners.length === 0 || addIntro.isPending}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                    "bg-cave-gold text-cave-bg-primary hover:bg-cave-gold/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {addIntro.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Create Intro{selectedNewPartners.length > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Quick Links */}
      <div className="flex gap-3">
        <Link
          to="/b2b/intros"
          className="text-sm text-cave-text-secondary hover:text-cave-gold"
        >
          ← Back to Intros
        </Link>
        <Link
          to="/b2b/assess"
          className="text-sm text-cave-text-secondary hover:text-cave-gold"
        >
          New Assessment
        </Link>
      </div>
    </div>
  )
}