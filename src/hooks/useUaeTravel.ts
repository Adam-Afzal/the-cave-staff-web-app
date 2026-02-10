import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { UaeTravel } from '../types/database'

export function useUaeTravels() {
  return useQuery({
    queryKey: ['uae-travels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('uae_travels')
        .select('*, members(first_name, last_name, email, profile_picture_url)')
        .order('travel_date', { ascending: true })

      if (error) throw error

      return data.map((row: any) => {
        const member = row.members || {}
        return {
          ...row,
          members: undefined,
          member_first_name: member.first_name || '',
          member_last_name: member.last_name || '',
          member_email: member.email || '',
          member_profile_picture_url: member.profile_picture_url || null,
        }
      }) as UaeTravel[]
    }
  })
}

export function useCreateUaeTravel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { member_id: string; travel_date: string; notes?: string }) => {
      const { error } = await supabase
        .from('uae_travels')
        .insert({
          member_id: data.member_id,
          travel_date: data.travel_date,
          notes: data.notes || null,
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uae-travels'] })
    }
  })
}

export function useUpdateUaeTravel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; travel_date?: string; notes?: string }) => {
      const updateData: Record<string, any> = {}
      if (data.travel_date !== undefined) updateData.travel_date = data.travel_date
      if (data.notes !== undefined) updateData.notes = data.notes || null

      const { error } = await supabase
        .from('uae_travels')
        .update(updateData)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uae-travels'] })
    }
  })
}

export function useDeleteUaeTravel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('uae_travels')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uae-travels'] })
    }
  })
}
