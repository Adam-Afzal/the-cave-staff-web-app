// src/hooks/useStaffProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

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
  onboarding_completed: boolean
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
        .single()

      if (error) {
        // Profile doesn't exist yet - this shouldn't happen if staff was created properly
        if (error.code === 'PGRST116') {
          throw new Error('Staff profile not found. Please contact an administrator.')
        }
        throw error
      }

      return data as StaffProfile
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
      telegramUsername,
    }: {
      email: string
      password: string
      firstName: string
      lastName: string
      telegramUsername?: string
    }) => {
      // Create user via FastAPI backend (uses Supabase Admin API)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/staff/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, telegramUsername }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create staff user')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export function useResetStaffPassword() {
  return useMutation({
    mutationFn: async ({ authUserId, newPassword }: { authUserId: string; newPassword: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/staff/${authUserId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to reset password')
      }

      return response.json()
    },
  })
}

export function useFetchTelegramAvatar() {
  return useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/staff/telegram/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to fetch Telegram avatar')
      }

      return response.json()
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