export type WealthTier = 'UHNW' | 'HNW' | 'RICH'
export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'CHURNED' | 'PENDING'
export type ConnectionType = 'B2B' | 'INVESTMENT' | 'STRATEGIC' | 'LEGAL' | 'FINANCIAL'
export type ConnectionStage = 'REQUEST_MADE' | 'CONNECTION_MADE'
export type FlagType = 'UNWELL' | 'TRAVEL' | 'FAMILY_NEWS' | 'OPPORTUNITY' | 'NEED'
export type StaffRole = 'ADMIN' | 'MANAGER' | 'CONCIERGE' | 'SALES' | 'MARKETING'
export type StaffDepartment = 'OPERATIONS' | 'SALES' | 'MARKETING' | 'CONCIERGE' | 'EXECUTIVE'
export type ReferralStatus = 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'DECLINED'
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
export type RSVPStatus = 'INVITED' | 'CONFIRMED' | 'DECLINED' | 'WAITLIST'

export interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  profile_picture_url: string | null
  date_of_birth: string | null
  city: string | null
  country: string | null
  region: string[] | null
  timezone: string | null
  industry: string | null
  business_arena: string | null
  business_type: string | null
  years_in_business: number | null
  professional_background: string | null
  languages: string[] | null
  topics: string[] | null
  focus: string[] | null
  net_worth_band: string | null
  annual_revenue_band: string | null
  wealth_tier: WealthTier | null
  investment_interests: string[] | null
  join_date: string
  renewal_date: string | null
  status: MemberStatus
  health_score: number
  intro_posted: boolean
  value_posted: boolean
  notes: string | null
  created_at: string
  updated_at: string,
  member_id: string
}

export interface MemberTelegram {
  id: string
  member_id: string
  telegram_id: string | null
  telegram_username: string | null
  telegram_joined: boolean
  posts_count: number
  last_post_date: string | null
  ghl_id: string | null
  created_at: string
  updated_at: string
}

export interface Staff {
  id: string
  auth_user_id: string | null
  name: string
  email: string
  role: StaffRole
  department: StaffDepartment | null
  created_at: string
  updated_at: string
}

export interface ConnectionRequest {
  id: string
  requesting_member_id: string
  description: string
  type: ConnectionType
  stage: ConnectionStage
  target_member_id: string | null
  target_third_party_id: string | null
  assigned_staff_id: string | null
  ai_suggestions: unknown | null
  created_at: string
  updated_at: string
}

export interface Connection {
  id: string
  request_id: string
  title: string
  description: string | null
  from_member_id: string
  to_member_id: string | null
  to_third_party_id: string | null
  type: ConnectionType
  occurred_at: string | null
  connection_time_mins: number | null
  approved_for_site: boolean
  outcome: string | null
  created_at: string
}

export interface ThirdParty {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  industry: string | null
  referred_by_member_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  starts_at: string
  ends_at: string | null
  capacity: number | null
  status: EventStatus
  created_by_staff_id: string | null
  created_at: string
  updated_at: string
}

export interface UaeTravel {
  id: string
  member_id: string
  travel_date: string
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  member_first_name?: string
  member_last_name?: string
  member_email?: string
  member_profile_picture_url?: string | null
}