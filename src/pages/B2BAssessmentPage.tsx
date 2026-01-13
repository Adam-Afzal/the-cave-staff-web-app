// src/pages/B2BAssessmentPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ClipboardCheck, 
  Search, 
  User, 
  CheckCircle, 
  XCircle,
  Loader2,
  ArrowRight,
  Building2,
  Briefcase
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { usePartners, useCreateAssessment } from '../hooks/useB2B'
import { cn } from '../lib/utils'

interface Member {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  member_id: string | null
}

interface ThirdParty {
  id: string
  name: string
  company: string | null
  industry: string | null
}

export function B2BAssessmentPage() {
  const navigate = useNavigate()
  const { data: partners } = usePartners()
  const createAssessment = useCreateAssessment()
  
  // Fetch third parties
  const { data: thirdParties } = useQuery({
    queryKey: ['third-parties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('third_parties')
        .select('id, name, company, industry')
        .order('name')
      if (error) throw error
      return data as ThirdParty[]
    }
  })
  
  // Form state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isB2BFit, setIsB2BFit] = useState<boolean | null>(null)
  const [selectedPartners, setSelectedPartners] = useState<string[]>([])
  const [selectedThirdParties, setSelectedThirdParties] = useState<string[]>([])
  const [introStatus, setIntroStatus] = useState<string>('')
  const [noFitReason, setNoFitReason] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [thirdPartySearch, setThirdPartySearch] = useState('')
  
  // Search members
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['member-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return []
      
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, email, member_id')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,member_id.ilike.%${searchQuery}%`)
        .limit(10)
      
      if (error) throw error
      return data as Member[]
    },
    enabled: searchQuery.length >= 2
  })
  
  const handleSelectMember = (member: Member) => {
    setSelectedMember(member)
    setSearchQuery('')
  }
  
  const handlePartnerToggle = (partnerId: string) => {
    setSelectedPartners(prev => 
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    )
  }
  
  const handleThirdPartyToggle = (thirdPartyId: string) => {
    setSelectedThirdParties(prev => 
      prev.includes(thirdPartyId)
        ? prev.filter(id => id !== thirdPartyId)
        : [...prev, thirdPartyId]
    )
  }
  
  // Filter third parties by search
  const filteredThirdParties = thirdParties?.filter(tp => 
    !thirdPartySearch || 
    tp.name.toLowerCase().includes(thirdPartySearch.toLowerCase()) ||
    tp.company?.toLowerCase().includes(thirdPartySearch.toLowerCase())
  ) || []
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMember || isB2BFit === null) return
    
    
    try {
      await createAssessment.mutateAsync({
        member_id: selectedMember.id,
        is_b2b_fit: isB2BFit,
        no_fit_reason: !isB2BFit ? noFitReason : undefined,
        partner_ids: isB2BFit && introStatus === 'intro_made' ? selectedPartners : undefined,
        third_party_ids: isB2BFit && introStatus === 'intro_made' ? selectedThirdParties : undefined,
        intro_status: isB2BFit ? introStatus : undefined,
        notes: notes || undefined
      })
      
      setSubmitSuccess(true)
      
      // Reset form after 2 seconds and redirect
      setTimeout(() => {
        navigate('/b2b/intros')
      }, 2000)
      
    } catch (error) {
      console.error('Failed to create assessment:', error)
    }
  }
  
  const totalConnections = selectedPartners.length + selectedThirdParties.length
  
  const memberName = selectedMember 
    ? `${selectedMember.first_name || ''} ${selectedMember.last_name || ''}`.trim() || selectedMember.email
    : ''
  
  if (submitSuccess) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-8 text-center">
            <CheckCircle className="w-16 h-16 text-cave-status-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-cave-text-primary mb-2">Assessment Logged!</h2>
            <p className="text-cave-text-secondary mb-4">
              {isB2BFit && totalConnections > 0 
                ? `Created ${totalConnections} intro(s) for ${memberName}`
                : `Assessment saved for ${memberName}`
              }
            </p>
            <p className="text-cave-text-muted text-sm">Redirecting to intros dashboard...</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-cave-text-primary flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7 text-cave-gold" />
            B2B Assessment
          </h1>
          <p className="text-cave-text-secondary mt-1">
            Log the outcome of an onboarding call
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Member */}
          <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-6">
            <h3 className="text-lg font-semibold text-cave-text-primary mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cave-gold text-cave-bg-primary text-sm font-bold flex items-center justify-center">1</span>
              Select Member
            </h3>
            
            {selectedMember ? (
              <div className="flex items-center justify-between p-4 bg-cave-bg-elevated rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cave-gold/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-cave-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-cave-text-primary">{memberName}</p>
                    <p className="text-sm text-cave-text-secondary">{selectedMember.member_id || selectedMember.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="text-sm text-cave-text-secondary hover:text-cave-text-primary"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cave-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or member ID..."
                  className="w-full pl-10 pr-4 py-3 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold"
                />
                
                {/* Search Results Dropdown */}
                {searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-cave-bg-elevated border border-cave-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {searching ? (
                      <div className="p-4 text-center text-cave-text-secondary">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      </div>
                    ) : searchResults?.length === 0 ? (
                      <div className="p-4 text-center text-cave-text-secondary">
                        No members found
                      </div>
                    ) : (
                      searchResults?.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleSelectMember(member)}
                          className="w-full px-4 py-3 text-left hover:bg-cave-bg-primary transition-colors flex items-center gap-3"
                        >
                          <User className="w-5 h-5 text-cave-text-muted" />
                          <div>
                            <p className="text-cave-text-primary">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-sm text-cave-text-secondary">
                              {member.member_id || member.email}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Step 2: B2B Fit Decision */}
          {selectedMember && (
            <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-6">
              <h3 className="text-lg font-semibold text-cave-text-primary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cave-gold text-cave-bg-primary text-sm font-bold flex items-center justify-center">2</span>
                B2B Fit?
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsB2BFit(true)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                    isB2BFit === true
                      ? "border-cave-status-success bg-cave-status-success/10"
                      : "border-cave-border hover:border-cave-status-success/50"
                  )}
                >
                  <CheckCircle className={cn(
                    "w-8 h-8",
                    isB2BFit === true ? "text-cave-status-success" : "text-cave-text-muted"
                  )} />
                  <span className={cn(
                    "font-medium",
                    isB2BFit === true ? "text-cave-status-success" : "text-cave-text-secondary"
                  )}>Yes</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsB2BFit(false)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                    isB2BFit === false
                      ? "border-cave-status-error bg-cave-status-error/10"
                      : "border-cave-border hover:border-cave-status-error/50"
                  )}
                >
                  <XCircle className={cn(
                    "w-8 h-8",
                    isB2BFit === false ? "text-cave-status-error" : "text-cave-text-muted"
                  )} />
                  <span className={cn(
                    "font-medium",
                    isB2BFit === false ? "text-cave-status-error" : "text-cave-text-secondary"
                  )}>No</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Step 3a: If Yes - Partner & Third Party Selection */}
          {isB2BFit === true && (
            <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-6">
              <h3 className="text-lg font-semibold text-cave-text-primary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cave-gold text-cave-bg-primary text-sm font-bold flex items-center justify-center">3</span>
                Select Connection(s)
              </h3>
              
              {/* Partners Section */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-cave-text-secondary mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  B2B Partners
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {partners?.filter(p => p.slug !== 'other').map((partner) => (
                    <button
                      key={partner.id}
                      type="button"
                      onClick={() => handlePartnerToggle(partner.id)}
                      className={cn(
                        "p-3 rounded-lg border transition-all flex items-center gap-3",
                        selectedPartners.includes(partner.id)
                          ? "border-cave-gold bg-cave-gold/10"
                          : "border-cave-border hover:border-cave-gold/50"
                      )}
                    >
                      <Building2 className={cn(
                        "w-5 h-5",
                        selectedPartners.includes(partner.id) ? "text-cave-gold" : "text-cave-text-muted"
                      )} />
                      <span className={cn(
                        "font-medium",
                        selectedPartners.includes(partner.id) ? "text-cave-gold" : "text-cave-text-secondary"
                      )}>{partner.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Third Parties Section */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-cave-text-secondary mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Third Parties
                </h4>
                
                {/* Search third parties */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cave-text-muted" />
                  <input
                    type="text"
                    value={thirdPartySearch}
                    onChange={(e) => setThirdPartySearch(e.target.value)}
                    placeholder="Search third parties..."
                    className="w-full pl-9 pr-4 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-sm text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold"
                  />
                </div>
                
                {/* Selected third parties */}
                {selectedThirdParties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedThirdParties.map(tpId => {
                      const tp = thirdParties?.find(t => t.id === tpId)
                      if (!tp) return null
                      return (
                        <span 
                          key={tpId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-cave-gold/10 text-cave-gold rounded-lg text-sm"
                        >
                          {tp.name}
                          <button
                            type="button"
                            onClick={() => handleThirdPartyToggle(tpId)}
                            className="hover:text-cave-gold/70"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
                
                {/* Third parties list */}
                <div className="max-h-48 overflow-y-auto border border-cave-border rounded-lg">
                  {filteredThirdParties.length === 0 ? (
                    <div className="p-4 text-center text-cave-text-muted text-sm">
                      {thirdParties?.length === 0 ? 'No third parties yet' : 'No matching third parties'}
                    </div>
                  ) : (
                    filteredThirdParties.slice(0, 20).map((tp) => (
                      <button
                        key={tp.id}
                        type="button"
                        onClick={() => handleThirdPartyToggle(tp.id)}
                        className={cn(
                          "w-full px-3 py-2 text-left flex items-center justify-between hover:bg-cave-bg-elevated transition-colors border-b border-cave-border last:border-b-0",
                          selectedThirdParties.includes(tp.id) && "bg-cave-gold/5"
                        )}
                      >
                        <div>
                          <p className={cn(
                            "font-medium text-sm",
                            selectedThirdParties.includes(tp.id) ? "text-cave-gold" : "text-cave-text-primary"
                          )}>{tp.name}</p>
                          {(tp.company || tp.industry) && (
                            <p className="text-xs text-cave-text-muted">
                              {[tp.company, tp.industry].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                        {selectedThirdParties.includes(tp.id) && (
                          <CheckCircle className="w-4 h-4 text-cave-gold" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
              
              {/* Intro Status */}
              <div>
                <label className="block text-sm font-medium text-cave-text-primary mb-2">
                  Intro Status
                </label>
                <select
                  value={introStatus}
                  onChange={(e) => setIntroStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold"
                >
                  <option value="">Select status...</option>
                  <option value="intro_made">Intro Made</option>
                  <option value="closed">Closed</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              
              {/* Selection summary */}
              {totalConnections > 0 && (
                <div className="mt-4 p-3 bg-cave-bg-elevated rounded-lg">
                  <p className="text-sm text-cave-text-secondary">
                    Selected: <span className="text-cave-gold font-medium">{totalConnections} connection(s)</span>
                    {selectedPartners.length > 0 && ` (${selectedPartners.length} partner${selectedPartners.length > 1 ? 's' : ''})`}
                    {selectedThirdParties.length > 0 && ` (${selectedThirdParties.length} third part${selectedThirdParties.length > 1 ? 'ies' : 'y'})`}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3b: If No - Reason */}
          {isB2BFit === false && (
            <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-6">
              <h3 className="text-lg font-semibold text-cave-text-primary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cave-gold text-cave-bg-primary text-sm font-bold flex items-center justify-center">3</span>
                Reason
              </h3>
              
              <select
                value={noFitReason}
                onChange={(e) => setNoFitReason(e.target.value)}
                className="w-full px-4 py-2.5 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold"
              >
                <option value="">Select reason...</option>
                <option value="no_fit">No fit for any partner</option>
                <option value="didnt_come_up">Didn't come up</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}
          
          {/* Step 4: Notes */}
          {isB2BFit !== null && (
            <div className="bg-cave-bg-secondary rounded-xl border border-cave-border p-6">
              <h3 className="text-lg font-semibold text-cave-text-primary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cave-gold text-cave-bg-primary text-sm font-bold flex items-center justify-center">4</span>
                Notes (Optional)
              </h3>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes from the call..."
                rows={3}
                className="w-full px-4 py-3 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold resize-none"
              />
            </div>
          )}
          
          {/* Submit Button */}
          {isB2BFit !== null && (
            <button
              type="submit"
              disabled={createAssessment.isPending || (isB2BFit && totalConnections > 0 && !introStatus)}
              className={cn(
                "w-full py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2",
                "bg-cave-gold text-cave-bg-primary hover:bg-cave-gold/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {createAssessment.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Assessment
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}