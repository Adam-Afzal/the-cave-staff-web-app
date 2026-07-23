import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, Link2, ArrowRight, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn, getInitials } from '../lib/utils'
import { useCurrentStaffProfile } from '../hooks/useStaffProfile'
import { getLocationFlag } from '../data/locations'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function joinedOn(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const connectionTypeColors: Record<string, string> = {
  B2B: 'bg-blue-500/10 text-blue-400',
  INVESTMENT: 'bg-cave-gold/10 text-cave-gold',
  STRATEGIC: 'bg-purple-500/10 text-purple-400',
  LEGAL: 'bg-cave-status-error/10 text-cave-status-error',
  FINANCIAL: 'bg-cave-status-success/10 text-cave-status-success',
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: staff } = useCurrentStaffProfile()

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [members, connections] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact' }).eq('status', 'ACTIVE'),
        supabase.from('connections').select('id', { count: 'exact' }),
      ])
      return {
        totalMembers: members.count || 0,
        totalConnections: connections.count || 0,
      }
    }
  })

  const { data: recentMembers = [] } = useQuery({
    queryKey: ['dashboard-recent-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, profile_picture_url, primary_residence, join_date, status, health_score, member_telegram(avatar_url)')
        .order('join_date', { ascending: false })
        .limit(6)
      if (error) throw error
      return data || []
    }
  })

  const { data: recentConnections = [] } = useQuery({
    queryKey: ['dashboard-recent-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id, title, type, created_at,
          from_member:members!from_member_id(id, first_name, last_name, profile_picture_url, member_telegram(avatar_url)),
          to_member:members!to_member_id(id, first_name, last_name, profile_picture_url, member_telegram(avatar_url)),
          to_third_party:third_parties!to_third_party_id(id, name, company)
        `)
        .order('created_at', { ascending: false })
        .limit(8)
      if (error) throw error
      return data || []
    }
  })

  const staffName = staff?.first_name || 'there'

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {staff?.avatar_url ? (
            <img src={staff.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-cave-gold/30" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-cave-gold/20 flex items-center justify-center ring-2 ring-cave-gold/30">
              <span className="text-cave-gold font-bold">{getInitials(staff?.first_name || '', staff?.last_name || '')}</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-cave-text-primary">{getGreeting()}, {staffName}.</h1>
            <p className="text-cave-text-secondary text-sm">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-cave-bg-secondary border border-cave-border rounded-xl">
          <div className="p-1.5 rounded-lg bg-cave-gold/10"><Users className="w-4 h-4 text-cave-gold" /></div>
          <div>
            <p className="text-xs text-cave-text-muted">Active Members</p>
            <p className="text-lg font-bold text-cave-text-primary leading-none">{stats?.totalMembers ?? '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-cave-bg-secondary border border-cave-border rounded-xl">
          <div className="p-1.5 rounded-lg bg-cave-status-success/10"><Link2 className="w-4 h-4 text-cave-status-success" /></div>
          <div>
            <p className="text-xs text-cave-text-muted">Connections Made</p>
            <p className="text-lg font-bold text-cave-text-primary leading-none">{stats?.totalConnections ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recently joined members */}
        <div className="lg:col-span-3 bg-cave-bg-secondary rounded-xl border border-cave-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cave-border">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cave-text-muted" />
              <h2 className="font-semibold text-cave-text-primary">Recently Joined</h2>
            </div>
            <button onClick={() => navigate('/entities')} className="flex items-center gap-1 text-xs text-cave-gold hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-cave-border">
            {recentMembers.length === 0 ? (
              <div className="p-8 text-center text-cave-text-muted text-sm">No members yet</div>
            ) : recentMembers.map((member: any) => {
              const avatarUrl = member.member_telegram?.avatar_url || member.profile_picture_url
              const flag = getLocationFlag(member.primary_residence)
              return (
                <div
                  key={member.id}
                  onClick={() => navigate(`/members/${member.id}`)}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-cave-bg-elevated transition-colors cursor-pointer"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-cave-gold/20 flex items-center justify-center shrink-0">
                      <span className="text-cave-gold font-medium text-xs">{getInitials(member.first_name || '', member.last_name || '')}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-cave-text-primary text-sm">{member.first_name} {member.last_name}</p>
                    {member.primary_residence && (
                      <p className="text-xs text-cave-text-muted truncate">
                        {flag && <span className="mr-1">{flag}</span>}{member.primary_residence}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-cave-text-muted">{member.join_date ? joinedOn(member.join_date) : '—'}</p>
                    <span className={cn(
                      "inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium",
                      member.status === 'ACTIVE' ? 'bg-cave-status-success/20 text-cave-status-success' :
                      member.status === 'ONBOARDING' ? 'bg-cave-status-info/20 text-cave-status-info' :
                      member.status === 'AT_RISK' ? 'bg-cave-status-warning/20 text-cave-status-warning' :
                      'bg-cave-bg-elevated text-cave-text-muted'
                    )}>{member.status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent connections */}
        <div className="lg:col-span-2 bg-cave-bg-secondary rounded-xl border border-cave-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cave-border">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-cave-text-muted" />
              <h2 className="font-semibold text-cave-text-primary">Recent Connections</h2>
            </div>
            <button onClick={() => navigate('/b2b/intros')} className="flex items-center gap-1 text-xs text-cave-gold hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-cave-border">
            {recentConnections.length === 0 ? (
              <div className="p-8 text-center text-cave-text-muted text-sm">No connections yet</div>
            ) : recentConnections.map((conn: any) => {
              const fromName = conn.from_member ? `${conn.from_member.first_name} ${conn.from_member.last_name}` : '?'
              const toName = conn.to_member
                ? `${conn.to_member.first_name} ${conn.to_member.last_name}`
                : conn.to_third_party?.name || 'External'
              const fromAvatar = conn.from_member?.member_telegram?.avatar_url || conn.from_member?.profile_picture_url
              const toAvatar = conn.to_member?.member_telegram?.avatar_url || conn.to_member?.profile_picture_url

              return (
                <div key={conn.id} className="px-5 py-3.5 hover:bg-cave-bg-elevated transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    {/* From avatar */}
                    {fromAvatar ? (
                      <img src={fromAvatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-cave-gold/20 flex items-center justify-center shrink-0">
                        <span className="text-cave-gold text-xs font-medium">{getInitials(conn.from_member?.first_name || '', conn.from_member?.last_name || '')}</span>
                      </div>
                    )}
                    <span className="text-xs font-medium text-cave-text-primary truncate">{fromName}</span>
                    <span className="text-cave-text-muted text-xs shrink-0">↔</span>
                    {/* To avatar */}
                    {toAvatar ? (
                      <img src={toAvatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-cave-bg-elevated flex items-center justify-center shrink-0">
                        <span className="text-cave-text-muted text-xs font-medium">{getInitials(conn.to_member?.first_name || toName.charAt(0), conn.to_member?.last_name || '')}</span>
                      </div>
                    )}
                    <span className="text-xs font-medium text-cave-text-primary truncate">{toName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium", connectionTypeColors[conn.type] || 'bg-cave-bg-elevated text-cave-text-muted')}>
                      {conn.type}
                    </span>
                    <span className="text-xs text-cave-text-muted">{timeAgo(conn.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
