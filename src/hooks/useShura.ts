// src/hooks/useShura.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Shura, ShuraMember, ShuraMeeting, ShuraMeetingAttendance, Member } from '../types/database'

const SHURA_MAX_CAPACITY = Number(import.meta.env.VITE_SHURA_MAX_CAPACITY ?? 6)

export { SHURA_MAX_CAPACITY }

// ── Enriched types ──────────────────────────────────────────

export interface ShuraMemberWithProfile extends ShuraMember {
  member: Member
}

export interface ShuraWithMembers extends Shura {
  members: ShuraMemberWithProfile[]
  moderator: ShuraMemberWithProfile | null
}

export interface ShuraMeetingWithAttendance extends ShuraMeeting {
  attendance: (ShuraMeetingAttendance & { member: Pick<Member, 'id' | 'first_name' | 'last_name'> })[]
}

// ── Queries ─────────────────────────────────────────────────

export function useShuras() {
  return useQuery({
    queryKey: ['shuras'],
    queryFn: async (): Promise<ShuraWithMembers[]> => {
      const { data: shuras, error: shuraError } = await supabase
        .from('shura')
        .select('*')
        .order('created_at', { ascending: true })

      if (shuraError) throw shuraError

      const { data: shuraMembers, error: membersError } = await supabase
        .from('shura_members')
        .select('*, member:members(*)')

      if (membersError) throw membersError

      return (shuras ?? []).map((shura) => {
        const members = (shuraMembers ?? [])
          .filter((sm) => sm.shura_id === shura.id)
          .map((sm) => sm as ShuraMemberWithProfile)

        const moderator = members.find((m) => m.is_moderator) ?? null

        return { ...shura, members, moderator }
      })
    },
  })
}

export function useUnassignedMembers() {
  return useQuery({
    queryKey: ['shuras', 'unassigned-members'],
    queryFn: async (): Promise<Member[]> => {
      // Members not present in shura_members at all
      const { data: assignedRows, error: assignedError } = await supabase
        .from('shura_members')
        .select('member_id')

      if (assignedError) throw assignedError

      const assignedIds = (assignedRows ?? []).map((r) => r.member_id)

      let query = supabase
        .from('members')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('first_name', { ascending: true })

      if (assignedIds.length > 0) {
        query = query.not('id', 'in', `(${assignedIds.join(',')})`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Member[]
    },
  })
}

export function useShuraMeetings(shuraId: string) {
  return useQuery({
    queryKey: ['shuras', shuraId, 'meetings'],
    queryFn: async (): Promise<ShuraMeetingWithAttendance[]> => {
      const { data: meetings, error: meetingsError } = await supabase
        .from('shura_meetings')
        .select('*')
        .eq('shura_id', shuraId)
        .order('meeting_date', { ascending: false })

      if (meetingsError) throw meetingsError

      const meetingIds = (meetings ?? []).map((m) => m.id)
      if (meetingIds.length === 0) return []

      const { data: attendance, error: attendanceError } = await supabase
        .from('shura_meeting_attendance')
        .select('*, member:members(id, first_name, last_name)')
        .in('meeting_id', meetingIds)

      if (attendanceError) throw attendanceError

      return (meetings ?? []).map((meeting) => ({
        ...meeting,
        attendance: (attendance ?? []).filter((a) => a.meeting_id === meeting.id) as ShuraMeetingWithAttendance['attendance'],
      }))
    },
    enabled: !!shuraId,
  })
}

// ── Mutations ────────────────────────────────────────────────

export function useCreateShura() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('shura')
        .insert({ name })
        .select()
        .single()

      if (error) throw error
      return data as Shura
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shuras'] })
    },
  })
}

export function useDeleteShura() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shuraId: string) => {
      const { error } = await supabase.from('shura').delete().eq('id', shuraId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shuras'] })
    },
  })
}

export function useAddShuraMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      shuraId,
      memberId,
      isModerator = false,
    }: {
      shuraId: string
      memberId: string
      isModerator?: boolean
    }) => {
      const { data, error } = await supabase
        .from('shura_members')
        .insert({ shura_id: shuraId, member_id: memberId, is_moderator: isModerator })
        .select()
        .single()

      if (error) throw error
      return data as ShuraMember
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shuras'] })
    },
  })
}

export function useRemoveShuraMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shuraMemberId: string) => {
      const { error } = await supabase
        .from('shura_members')
        .delete()
        .eq('id', shuraMemberId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shuras'] })
    },
  })
}

export function useSetModerator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      shuraId,
      shuraMemberId,
    }: {
      shuraId: string
      shuraMemberId: string
    }) => {
      // Clear existing moderator in this shura
      const { error: clearError } = await supabase
        .from('shura_members')
        .update({ is_moderator: false })
        .eq('shura_id', shuraId)
        .eq('is_moderator', true)

      if (clearError) throw clearError

      // Set new moderator
      const { error } = await supabase
        .from('shura_members')
        .update({ is_moderator: true })
        .eq('id', shuraMemberId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shuras'] })
    },
  })
}

export function useCreateShuraMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      shuraId,
      meetingDate,
      notes,
      memberIds,
    }: {
      shuraId: string
      meetingDate: string
      notes?: string
      memberIds: string[]
    }) => {
      const { data: meeting, error: meetingError } = await supabase
        .from('shura_meetings')
        .insert({ shura_id: shuraId, meeting_date: meetingDate, notes })
        .select()
        .single()

      if (meetingError) throw meetingError

      if (memberIds.length > 0) {
        const attendanceRows = memberIds.map((memberId) => ({
          meeting_id: meeting.id,
          member_id: memberId,
          attended: false,
        }))

        const { error: attendanceError } = await supabase
          .from('shura_meeting_attendance')
          .insert(attendanceRows)

        if (attendanceError) throw attendanceError
      }

      return meeting as ShuraMeeting
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shuras', variables.shuraId, 'meetings'] })
    },
  })
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      attendanceId,
      attended,
    }: {
      attendanceId: string
      attended: boolean
      shuraId: string
    }) => {
      const { error } = await supabase
        .from('shura_meeting_attendance')
        .update({ attended })
        .eq('id', attendanceId)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shuras', variables.shuraId, 'meetings'] })
    },
  })
}
