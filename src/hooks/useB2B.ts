// src/hooks/useB2B.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL

// =====================================================
// TYPES
// =====================================================

export interface Partner {
  id: string
  name: string
  slug: string
  active: boolean
}

export interface ScheduledCall {
  id: string
  title: string | null
  starts_at: string
  ends_at: string | null
  attendee_name: string | null
  attendee_email: string | null
  attendee_phone: string | null
  member_id: string | null
  status: 'scheduled' | 'reminder_sent' | 'completed' | 'no_show' | 'cancelled'
  reminder_sent_at: string | null
  created_at: string
  // Joined fields
  member_name?: string | null
  member_display_id?: string | null
}

export interface B2BAssessment {
  id: string
  member_id: string
  member_name: string | null
  member_display_id: string | null
  concierge_id: string | null
  is_b2b_fit: boolean
  no_fit_reason: string | null
  notes: string | null
  assessed_at: string
  intros?: B2BIntro[]
}

export interface B2BIntro {
  id: string
  assessment_id: string
  member_id: string
  partner_id: string
  member_name?: string
  member_display_id?: string
  partner_name?: string
  partner_slug?: string
  status: 'intro_made' | 'scheduled' | 'member_declined' | 'na'
  intro_date: string
  last_followup_at: string | null
  next_followup_at: string | null
  closed_at: string | null
  notes: string | null
}

export interface B2BStats {
  total_assessments: number
  b2b_fits: number
  b2b_fit_rate: number
  total_intros: number
  intro_by_status: Record<string, number>
  pending_followups: number
}

export interface AssessmentCreateData {
  member_id: string
  is_b2b_fit: boolean
  no_fit_reason?: string
  partner_ids?: string[]
  intro_status?: string
  notes?: string
}

// =====================================================
// PARTNERS (Direct Supabase)
// =====================================================

export function usePartners() {
  return useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('active', true)
        .order('name')
      
      if (error) throw error
      return data as Partner[]
    }
  })
}

// =====================================================
// SCHEDULED CALLS (Direct Supabase)
// =====================================================

export function useScheduledCalls(options?: { upcoming?: boolean; status?: string }) {
  return useQuery({
    queryKey: ['scheduled-calls', options],
    queryFn: async () => {
      let query = supabase
        .from('scheduled_calls')
        .select('*, members(first_name, last_name, member_id)')
        .order('starts_at', { ascending: false })
        .limit(50)
      
      if (options?.status) {
        query = query.eq('status', options.status)
      }
      
      if (options?.upcoming) {
        const now = new Date().toISOString()
        query = query.gte('starts_at', now).eq('status', 'scheduled')
      }
      
      const { data, error } = await query
      if (error) throw error
      
      // Format response
      return data.map((row: any) => {
        const member = row.members || {}
        return {
          ...row,
          members: undefined,
          member_name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || null,
          member_display_id: member.member_id || null
        }
      }) as ScheduledCall[]
    },
    refetchInterval: 60000 // Refresh every minute
  })
}

export function useUpdateCallStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ callId, status }: { callId: string; status: string }) => {
      const { data, error } = await supabase
        .from('scheduled_calls')
        .update({ status })
        .eq('id', callId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-calls'] })
    }
  })
}

// =====================================================
// ASSESSMENTS (Direct Supabase for reads, API for create)
// =====================================================

export function useAssessments(options?: { member_id?: string; limit?: number }) {
  return useQuery({
    queryKey: ['b2b-assessments', options],
    queryFn: async () => {
      let query = supabase
        .from('b2b_assessments')
        .select('*, members(first_name, last_name, member_id)')
        .order('assessed_at', { ascending: false })
        .limit(options?.limit || 50)
      
      if (options?.member_id) {
        query = query.eq('member_id', options.member_id)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      // Format response
      return data.map((row: any) => {
        const member = row.members || {}
        return {
          ...row,
          members: undefined,
          member_name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || null,
          member_display_id: member.member_id || null
        }
      }) as B2BAssessment[]
    }
  })
}

export function useAssessment(assessmentId: string) {
  return useQuery({
    queryKey: ['b2b-assessment', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('b2b_assessments')
        .select('*, members(first_name, last_name, member_id), b2b_intros(*, partners(name, slug))')
        .eq('id', assessmentId)
        .single()
      
      if (error) throw error
      
      const member = data.members || {}
      return {
        ...data,
        members: undefined,
        member_name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || null,
        member_display_id: member.member_id || null,
        intros: data.b2b_intros || []
      } as B2BAssessment
    },
    enabled: !!assessmentId
  })
}

// Create assessment goes through API (has Slack notification logic)
export function useCreateAssessment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: AssessmentCreateData) => {
      const response = await fetch(`${API_URL}/api/b2b/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create assessment')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['b2b-intros'] })
      queryClient.invalidateQueries({ queryKey: ['b2b-stats'] })
    }
  })
}

// =====================================================
// INTROS (Direct Supabase)
// =====================================================

export function useIntros(options?: { status?: string; needs_followup?: boolean }) {
  return useQuery({
    queryKey: ['b2b-intros', options],
    queryFn: async () => {
      let query = supabase
        .from('b2b_intros')
        .select('*, members(first_name, last_name, member_id), partners(name, slug)')
        .order('intro_date', { ascending: false })
        .limit(50)
      
      if (options?.status) {
        query = query.eq('status', options.status)
      }
      
      if (options?.needs_followup) {
        const now = new Date().toISOString()
        query = query
          .lte('next_followup_at', now)
          .eq('status', 'intro_made')
      }
      
      const { data, error } = await query
      if (error) throw error
      
      // Format response
      return data.map((row: any) => {
        const member = row.members || {}
        const partner = row.partners || {}
        return {
          ...row,
          members: undefined,
          partners: undefined,
          member_name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || null,
          member_display_id: member.member_id || null,
          partner_name: partner.name || null,
          partner_slug: partner.slug || null
        }
      }) as B2BIntro[]
    }
  })
}

export function useUpdateIntro() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ introId, status, notes }: { introId: string; status: string; notes?: string }) => {
      // Get current intro to calculate next followup
      const {  error: fetchError } = await supabase
        .from('b2b_intros')
        .select('intro_date')
        .eq('id', introId)
        .single()
      
      if (fetchError) throw fetchError
      
      const updateData: Record<string, any> = {
        status,
        last_followup_at: new Date().toISOString()
      }
      
      if (notes) {
        updateData.notes = notes
      }
      
      // If changing to intro_made, set next followup to 3 days from now
      if (status === 'intro_made') {
        updateData.next_followup_at = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        updateData.intro_date = new Date().toISOString()
      } else {
        // Other statuses don't need followups
        updateData.next_followup_at = null
      }
      
      const { data, error } = await supabase
        .from('b2b_intros')
        .update(updateData)
        .eq('id', introId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-intros'] })
      queryClient.invalidateQueries({ queryKey: ['b2b-stats'] })
      queryClient.invalidateQueries({ queryKey: ['b2b-assessment-detail'] })
    }
  })
}

// =====================================================
// STATS (Direct Supabase)
// =====================================================

export function useB2BStats() {
  return useQuery({
    queryKey: ['b2b-stats'],
    queryFn: async () => {
      // Get assessments
      const { data: assessments, error: assessError } = await supabase
        .from('b2b_assessments')
        .select('id, is_b2b_fit')
      
      if (assessError) throw assessError
      
      const total_assessments = assessments.length
      const b2b_fits = assessments.filter(a => a.is_b2b_fit).length
      
      // Get intros
      const { data: intros, error: introsError } = await supabase
        .from('b2b_intros')
        .select('id, status')
      
      if (introsError) throw introsError
      
      const intro_by_status: Record<string, number> = {}
      intros.forEach(intro => {
        intro_by_status[intro.status] = (intro_by_status[intro.status] || 0) + 1
      })
      
      // Get pending followups
      const now = new Date().toISOString()
      const { data: pending, error: pendingError } = await supabase
        .from('b2b_intros')
        .select('id')
        .lte('next_followup_at', now)
        .eq('status', 'intro_made')
      
      if (pendingError) throw pendingError
      
      return {
        total_assessments,
        b2b_fits,
        b2b_fit_rate: total_assessments > 0 ? Math.round(b2b_fits / total_assessments * 100 * 10) / 10 : 0,
        total_intros: intros.length,
        intro_by_status,
        pending_followups: pending.length
      } as B2BStats
    }
  })
}