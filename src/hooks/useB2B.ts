// src/hooks/useB2B.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
  member_name: string | null
  member_display_id: string | null
  status: 'scheduled' | 'reminder_sent' | 'completed' | 'no_show' | 'cancelled'
  reminder_sent_at: string | null
  created_at: string
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
  partners?: { name: string; slug: string }
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
// PARTNERS
// =====================================================

export function usePartners() {
  return useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/b2b/partners`)
      if (!response.ok) throw new Error('Failed to fetch partners')
      return response.json() as Promise<Partner[]>
    }
  })
}

// =====================================================
// SCHEDULED CALLS
// =====================================================

export function useScheduledCalls(options?: { upcoming?: boolean; status?: string }) {
  const params = new URLSearchParams()
  if (options?.upcoming) params.append('upcoming', 'true')
  if (options?.status) params.append('status', options.status)
  
  return useQuery({
    queryKey: ['scheduled-calls', options],
    queryFn: async () => {
      const url = `${API_URL}/api/b2b/calls${params.toString() ? `?${params}` : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch calls')
      return response.json() as Promise<ScheduledCall[]>
    },
    refetchInterval: 60000 // Refresh every minute
  })
}

export function useUpdateCallStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ callId, status }: { callId: string; status: string }) => {
      const response = await fetch(`${API_URL}/api/b2b/calls/${callId}?status=${status}`, {
        method: 'PATCH'
      })
      if (!response.ok) throw new Error('Failed to update call status')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-calls'] })
    }
  })
}

// =====================================================
// ASSESSMENTS
// =====================================================

export function useAssessments(options?: { member_id?: string; limit?: number }) {
  const params = new URLSearchParams()
  if (options?.member_id) params.append('member_id', options.member_id)
  if (options?.limit) params.append('limit', options.limit.toString())
  
  return useQuery({
    queryKey: ['b2b-assessments', options],
    queryFn: async () => {
      const url = `${API_URL}/api/b2b/assessments${params.toString() ? `?${params}` : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch assessments')
      return response.json() as Promise<B2BAssessment[]>
    }
  })
}

export function useAssessment(assessmentId: string) {
  return useQuery({
    queryKey: ['b2b-assessment', assessmentId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/b2b/assessments/${assessmentId}`)
      if (!response.ok) throw new Error('Failed to fetch assessment')
      return response.json() as Promise<B2BAssessment>
    },
    enabled: !!assessmentId
  })
}

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
// INTROS
// =====================================================

export function useIntros(options?: { status?: string; needs_followup?: boolean }) {
  const params = new URLSearchParams()
  if (options?.status) params.append('status', options.status)
  if (options?.needs_followup) params.append('needs_followup', 'true')
  
  return useQuery({
    queryKey: ['b2b-intros', options],
    queryFn: async () => {
      const url = `${API_URL}/api/b2b/intros${params.toString() ? `?${params}` : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch intros')
      return response.json() as Promise<B2BIntro[]>
    }
  })
}

export function useUpdateIntro() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ introId, status, notes }: { introId: string; status: string; notes?: string }) => {
      const response = await fetch(`${API_URL}/api/b2b/intros/${introId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      })
      if (!response.ok) throw new Error('Failed to update intro')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-intros'] })
      queryClient.invalidateQueries({ queryKey: ['b2b-stats'] })
    }
  })
}

// =====================================================
// STATS
// =====================================================

export function useB2BStats() {
  return useQuery({
    queryKey: ['b2b-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/b2b/stats`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json() as Promise<B2BStats>
    }
  })
}