// src/hooks/useStaffNotifications.ts
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface StaffNotification {
  id: string
  title: string
  body: string
  link: string
  read: boolean
  created_at: string
}

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const now = ctx.currentTime

    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.frequency.value = 880
    gain1.gain.setValueAtTime(0.15, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc1.start(now)
    osc1.stop(now + 0.3)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.frequency.value = 1100
    gain2.gain.setValueAtTime(0.001, now + 0.15)
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.2)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    osc2.start(now + 0.15)
    osc2.stop(now + 0.5)
  } catch {
    // AudioContext unavailable
  }
}

export function useStaffNotifications() {
  const queryClient = useQueryClient()

  const { data: notifications = [] } = useQuery({
    queryKey: ['staff-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data as StaffNotification[]
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel('staff-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'staff_notifications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['staff-notifications'] })
          playNotificationSound()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [queryClient])

  const markRead = async (id: string) => {
    await supabase.from('staff_notifications').update({ read: true }).eq('id', id)
    queryClient.setQueryData<StaffNotification[]>(['staff-notifications'], prev =>
      prev?.map(n => n.id === id ? { ...n, read: true } : n) ?? []
    )
  }

  const markAllRead = async () => {
    await supabase.from('staff_notifications').update({ read: true }).eq('read', false)
    queryClient.setQueryData<StaffNotification[]>(['staff-notifications'], prev =>
      prev?.map(n => ({ ...n, read: true })) ?? []
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, unreadCount, markRead, markAllRead }
}
