// src/hooks/useEngagement.ts
import { useQuery } from '@tanstack/react-query'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Types
export interface ChannelMetrics {
  total_engagements: number
  engagements_this_week: number
  engagements_last_week: number
  engagements_change: number
  total_messages: number
  messages_this_week: number
  messages_last_week: number
  messages_change: number
  total_members: number
  active_members: number
  active_members_percentage: number
  at_risk_members: number
  at_risk_percentage: number
}

export interface TopicPerformance {
  topic_id: number
  topic_name: string
  messages_this_week: number
  messages_last_week: number
  reactions_this_week: number
  reactions_last_week: number
  engagements_this_week: number
  engagements_last_week: number
  total_messages: number
  total_reactions: number
  total_engagements: number
  wow_change: number
}

export interface UserPerformance {
  member_id: string
  first_name: string
  last_name: string
  telegram_username: string
  messages_this_week: number
  messages_last_week: number
  reactions_this_week: number
  engagements_this_week: number
  total_messages: number
  total_reactions: number
  total_engagements: number
}

export interface MemberAtRisk {
  member_id: string
  first_name: string
  last_name: string
  telegram_username: string
  total_messages: number
  total_engagements: number
  last_message_at: string
  days_since_last_message: number
}

export interface MemberProfile {
  member_id: string
  first_name: string
  last_name: string
  telegram_username: string
  total_messages: number
  total_reactions_given: number
  total_reactions_received: number
  total_engagements: number
  first_message_at: string | null
  last_message_at: string | null
  active_days: number
  topics_participated: number
}

export interface MemberActivityByTopic {
  topic_id: number
  topic_name: string
  message_count: number
  total_reactions: number
  total_engagements: number
  avg_reactions_per_message: number
  last_message_at: string
}

export interface UserListItem {
  member_id: string
  first_name: string
  last_name: string
  full_name: string
  telegram_username: string
  message_count: number
}

// API functions
async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json()
}

// Hooks
export function useChannelMetrics() {
  return useQuery({
    queryKey: ['engagement', 'metrics'],
    queryFn: () => fetchApi<ChannelMetrics>('/api/dashboard/metrics'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useTopicPerformance() {
  return useQuery({
    queryKey: ['engagement', 'topics'],
    queryFn: () => fetchApi<TopicPerformance[]>('/api/dashboard/topics'),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUserPerformance() {
  return useQuery({
    queryKey: ['engagement', 'users'],
    queryFn: () => fetchApi<UserPerformance[]>('/api/dashboard/users'),
    staleTime: 1000 * 60 * 5,
  })
}

export function useMembersAtRisk() {
  return useQuery({
    queryKey: ['engagement', 'at-risk'],
    queryFn: () => fetchApi<MemberAtRisk[]>('/api/dashboard/users/at-risk'),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUsersList() {
  return useQuery({
    queryKey: ['engagement', 'users-list'],
    queryFn: () => fetchApi<UserListItem[]>('/api/dashboard/users/list'),
    staleTime: 1000 * 60 * 5,
  })
}

export function useMemberProfile(memberId: string | null) {
  return useQuery({
    queryKey: ['engagement', 'member', memberId],
    queryFn: () => fetchApi<MemberProfile>(`/api/dashboard/users/${memberId}`),
    enabled: !!memberId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useMemberActivityByTopic(memberId: string | null) {
  return useQuery({
    queryKey: ['engagement', 'member-topics', memberId],
    queryFn: () => fetchApi<MemberActivityByTopic[]>(`/api/dashboard/users/${memberId}/topics`),
    enabled: !!memberId,
    staleTime: 1000 * 60 * 5,
  })
}