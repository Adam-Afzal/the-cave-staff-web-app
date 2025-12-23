import { useQuery } from '@tanstack/react-query'
import { Header } from '../components/layout'
import { 
  Users, 
  Link2, 
  UserPlus,
  CheckCircle,
  ArrowUpRight,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn, getInitials } from '../lib/utils'

export function DashboardPage() {
  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [members, requests, connections] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact' }),
        supabase.from('connection_requests').select('id', { count: 'exact' }).eq('stage', 'REQUEST_MADE'),
        supabase.from('connections').select('id', { count: 'exact' }),
      ])
      return {
        totalMembers: members.count || 0,
        pendingRequests: requests.count || 0,
        connectionsMade: connections.count || 0,
      }
    }
  })

  // Fetch recent requests
  const { data: recentRequests = [] } = useQuery({
    queryKey: ['recent-requests'],
    queryFn: async () => {
      const { data } = await supabase
        .from('connection_requests')
        .select('*, requesting_member:members(first_name, last_name, business_arena)')
        .eq('stage', 'REQUEST_MADE')
        .order('created_at', { ascending: false })
        .limit(4)
      return data || []
    }
  })

  // Fetch recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data } = await supabase
        .from('connections')
        .select('*, from_member:members!from_member_id(first_name, last_name), to_member:members!to_member_id(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(3)
      return data || []
    }
  })

  const statCards = [
    { 
      name: 'Pending Requests', 
      value: stats?.pendingRequests || 0, 
      change: '+3',
      icon: Link2,
      color: 'cave-gold',
    },
    { 
      name: 'Curated Today', 
      value: 8, 
      change: '+2',
      icon: CheckCircle,
      color: 'cave-status-success',
    },
    { 
      name: 'New Members', 
      value: 3, 
      icon: UserPlus,
      color: 'blue-500',
    },
    { 
      name: 'Total Members', 
      value: stats?.totalMembers || 0, 
      icon: Users,
      color: 'purple-500',
    },
  ]

  return (
    <div>
      <Header 
        title="Dashboard" 
        subtitle="Welcome back! Here's what's happening with The Cave today."
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.name} className="card p-5">
              <div className="flex items-start justify-between">
                <div className={cn(
                  "p-2 rounded-lg",
                  stat.color === 'cave-gold' && "bg-cave-gold/10",
                  stat.color === 'cave-status-success' && "bg-cave-status-success/10",
                  stat.color === 'blue-500' && "bg-blue-500/10",
                  stat.color === 'purple-500' && "bg-purple-500/10",
                )}>
                  <stat.icon className={cn(
                    "w-5 h-5",
                    stat.color === 'cave-gold' && "text-cave-gold",
                    stat.color === 'cave-status-success' && "text-cave-status-success",
                    stat.color === 'blue-500' && "text-blue-500",
                    stat.color === 'purple-500' && "text-purple-500",
                  )} />
                </div>
              </div>
              <p className="text-3xl font-bold text-cave-text-primary mt-3">
                {stat.value}
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-cave-text-secondary">{stat.name}</p>
                {stat.change && (
                  <div className="flex items-center gap-1 text-cave-status-success">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm">{stat.change}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Requests */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between p-4 border-b border-cave-border">
              <h2 className="text-lg font-bold text-cave-text-primary">Recent Connection Requests</h2>
              <button className="text-sm text-cave-gold hover:underline">View All →</button>
            </div>
            <div className="divide-y divide-cave-border">
              {recentRequests.length === 0 ? (
                <div className="p-8 text-center text-cave-text-muted">No pending requests</div>
              ) : (
                recentRequests.map((request: any) => (
                  <div key={request.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cave-bg-elevated flex items-center justify-center">
                        <span className="text-cave-gold font-bold text-sm">
                          {getInitials(
                            request.requesting_member?.first_name || '',
                            request.requesting_member?.last_name || ''
                          )}
                        </span>
                      </div>
                      <div>
                        <p className="text-cave-text-primary font-medium">
                          {request.requesting_member?.first_name} {request.requesting_member?.last_name}
                        </p>
                        <p className="text-sm text-cave-text-muted">
                          {request.requesting_member?.business_arena || 'Unknown'} → {request.description?.slice(0, 40)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-4 py-1.5 bg-cave-gold text-cave-bg-primary font-bold text-sm rounded">
                        Review
                      </button>
                      <button className="px-4 py-1.5 border border-cave-border text-cave-text-secondary text-sm rounded">
                        Skip
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <div className="p-4 border-b border-cave-border">
                <h2 className="text-lg font-bold text-cave-text-primary">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                <button className="w-full p-3 text-left bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-secondary hover:border-cave-gold/50 transition-colors">
                  + Add New Member
                </button>
                <button className="w-full p-3 text-left bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-secondary hover:border-cave-gold/50 transition-colors">
                  📣 Send Announcement
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div className="p-4 border-b border-cave-border">
                <h2 className="text-lg font-bold text-cave-text-primary">Recent Activity</h2>
              </div>
              <div className="p-4 space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-cave-text-muted text-sm">No recent activity</p>
                ) : (
                  recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-cave-status-success mt-1.5" />
                      <div>
                        <p className="text-sm text-cave-text-secondary">
                          Connection made: {activity.from_member?.first_name} ↔ {activity.to_member?.first_name || 'External'}
                        </p>
                        <p className="text-xs text-cave-text-muted">Just now</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}