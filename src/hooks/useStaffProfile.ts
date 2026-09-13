// src/hooks/useStaffProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Staff-admin actions (create/reset-password/deactivate/reactivate/delete) run
// as Supabase Edge Functions rather than calling the-cave-ai-api, which is no
// longer deployed. They need the service-role key, which can only live
// server-side — supabase.functions.invoke() automatically attaches the
// current session as the Authorization header.
async function invokeStaffFunction<T>(name: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body })

  if (error) {
    let detail = error.message
    try {
      const errorBody = await (error as { context?: Response }).context?.json()
      if (errorBody?.detail) detail = errorBody.detail
    } catch {
      // Response body wasn't JSON — fall back to error.message
    }
    throw new Error(detail)
  }

  return data as T
}

export interface StaffProfile {
  id: string
  auth_user_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: string | null
  department: string | null
  intro: string | null
  avatar_url: string | null
  telegram_username: string | null
  telegram_id: number | null
  onboarding_completed: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useCurrentStaffProfile() {
  return useQuery({
    queryKey: ['staff-profile', 'current'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (error) throw error

      return (data as StaffProfile) ?? null
    },
  })
}

export function useUpdateStaffProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<StaffProfile>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('staff')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as StaffProfile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profile'] })
    },
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update staff profile with avatar URL
      const { data, error } = await supabase
        .from('staff')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as StaffProfile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profile'] })
    },
  })
}

// Admin functions for staff management
export function useAllStaffProfiles() {
  return useQuery({
    queryKey: ['staff-profiles', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as StaffProfile[]
    },
  })
}

export function useCreateStaffUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      password,
      firstName,
      lastName,
    }: {
      email: string
      password: string
      firstName: string
      lastName: string
    }) => {
      return invokeStaffFunction('staff-create', { email, password, firstName, lastName })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export function useResetStaffPassword() {
  return useMutation({
    mutationFn: async ({ authUserId, newPassword }: { authUserId: string; newPassword: string }) => {
      return invokeStaffFunction('staff-reset-password', { userId: authUserId, password: newPassword })
    },
  })
}

export function useDeactivateStaffUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (authUserId: string) => {
      return invokeStaffFunction('staff-deactivate', { userId: authUserId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export function useReactivateStaffUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (authUserId: string) => {
      return invokeStaffFunction('staff-reactivate', { userId: authUserId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export function useDeleteStaffUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (authUserId: string) => {
      return invokeStaffFunction('staff-delete', { userId: authUserId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export function useSyncTelegramAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (staffId: string) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/staff/telegram/sync-avatar/${staffId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to sync Telegram avatar')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}