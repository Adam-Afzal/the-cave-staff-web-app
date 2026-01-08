// src/pages/EngagementPage.tsx
import { useState } from 'react'
import {
  MessageSquare,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Hash,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  ArrowLeft,
  Calendar,
  Trophy,
  Target
} from 'lucide-react'
import {
  useChannelMetrics,
  useTopicPerformance,
  useUserPerformance,
  useMembersAtRisk,
  useMemberProfile,
  useMemberActivityByTopic,
  type UserPerformance,
} from '../hooks/useEngagement'
import { cn } from '../lib/utils'

// Topic ID to Name mapping
const topicsMap: Record<string, string> = {
  '213': 'Intros',
  '14': 'AI, SAAS, IT',
  '24': 'Asset Allocation & Investment Strategy',
  '32': 'Health and Fitness',
  '38': 'Parenting',
  '36': 'Islam',
  '1': 'Lounge',
  '34': 'Marriage and Polygyny',
  '2': 'Ask for Help',
  '6': 'Announcements'
}

// ============================================================
// METRIC CARD COMPONENT
// ============================================================
interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  subtitle?: string
  icon: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

function MetricCard({ title, value, change, subtitle, icon, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'bg-cave-bg-secondary',
    success: 'bg-cave-status-success/10 border-cave-status-success/20',
    warning: 'bg-cave-gold/10 border-cave-gold/20',
    danger: 'bg-cave-status-error/10 border-cave-status-error/20'
  }

  return (
    <div className={cn(
      'rounded-xl border border-cave-border p-5 transition-all hover:border-cave-gold/30',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-cave-text-secondary">{title}</p>
          <p className="text-2xl font-bold text-cave-text-primary">{value}</p>
          {subtitle && (
            <p className="text-xs text-cave-text-secondary">{subtitle}</p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-cave-bg-elevated">
          {icon}
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {change >= 0 ? (
            <TrendingUp className="w-4 h-4 text-cave-status-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-cave-status-error" />
          )}
          <span className={cn(
            'text-sm font-medium',
            change >= 0 ? 'text-cave-status-success' : 'text-cave-status-error'
          )}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="text-xs text-cave-text-secondary">vs last week</span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// OVERVIEW METRICS COMPONENT
// ============================================================
function OverviewMetrics({ onEngagementsClick }: { onEngagementsClick?: () => void }) {
  const { data: metrics, isLoading, error } = useChannelMetrics()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-cave-bg-secondary animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="p-4 rounded-lg bg-cave-status-error/10 text-cave-status-error">
        Failed to load metrics
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div onClick={onEngagementsClick} className="cursor-pointer">
        <MetricCard
          title="Total Engagements"
          value={metrics.total_engagements.toLocaleString()}
          change={metrics.engagements_change}
          subtitle={`${metrics.engagements_this_week.toLocaleString()} this week • Click to view all`}
          icon={<Activity className="w-5 h-5 text-cave-gold" />}
        />
      </div>
      <MetricCard
        title="Messages"
        value={metrics.total_messages.toLocaleString()}
        change={metrics.messages_change}
        subtitle={`${metrics.messages_this_week.toLocaleString()} this week`}
        icon={<MessageSquare className="w-5 h-5 text-blue-400" />}
      />
      <MetricCard
        title="Active Members"
        value={metrics.active_members}
        subtitle={`${metrics.active_members_percentage.toFixed(1)}% of total`}
        icon={<Users className="w-5 h-5 text-cave-status-success" />}
        variant="success"
      />
      <MetricCard
        title="At Risk"
        value={metrics.at_risk_members}
        subtitle={`${metrics.at_risk_percentage.toFixed(1)}% inactive 14+ days`}
        icon={<AlertTriangle className="w-5 h-5 text-cave-status-error" />}
        variant="danger"
      />
    </div>
  )
}

// ============================================================
// USER LEADERBOARD COMPONENT
// ============================================================
function UserLeaderboard({ onSelectMember }: { onSelectMember: (id: string) => void }) {
  const { data: users, isLoading } = useUserPerformance()
  const [sortField, setSortField] = useState<keyof UserPerformance>('engagements_this_week')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sortedUsers = users?.slice().sort((a, b) => {
    const aVal = a[sortField] ?? 0
    const bVal = b[sortField] ?? 0
    return sortDir === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number)
  })

  const handleSort = (field: keyof UserPerformance) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: keyof UserPerformance }) => {
    if (sortField !== field) return null
    return sortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
  }

  if (isLoading) {
    return <div className="h-96 rounded-xl bg-cave-bg-secondary animate-pulse" />
  }

  return (
    <div className="rounded-xl border border-cave-border bg-cave-bg-secondary overflow-hidden">
      <div className="px-5 py-4 border-b border-cave-border">
        <h3 className="text-lg font-semibold text-cave-text-primary flex items-center gap-2">
          <Trophy className="w-5 h-5 text-cave-gold" />
          Member Leaderboard
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-cave-bg-elevated">
              <th className="px-4 py-3 text-left text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                Member
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-cave-text-secondary uppercase tracking-wider cursor-pointer hover:text-cave-gold"
                onClick={() => handleSort('engagements_this_week')}
              >
                <div className="flex items-center justify-end gap-1">
                  This Week <SortIcon field="engagements_this_week" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-cave-text-secondary uppercase tracking-wider cursor-pointer hover:text-cave-gold"
                onClick={() => handleSort('total_messages')}
              >
                <div className="flex items-center justify-end gap-1">
                  Messages <SortIcon field="total_messages" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-cave-text-secondary uppercase tracking-wider cursor-pointer hover:text-cave-gold"
                onClick={() => handleSort('total_reactions')}
              >
                <div className="flex items-center justify-end gap-1">
                  Reactions <SortIcon field="total_reactions" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-cave-text-secondary uppercase tracking-wider cursor-pointer hover:text-cave-gold"
                onClick={() => handleSort('total_engagements')}
              >
                <div className="flex items-center justify-end gap-1">
                  Total <SortIcon field="total_engagements" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cave-border">
            {sortedUsers?.slice(0, 20).map((user, index) => (
              <tr 
                key={user.member_id} 
                className="hover:bg-cave-bg-elevated cursor-pointer transition-colors"
                onClick={() => onSelectMember(user.member_id)}
              >
                <td className="px-4 py-3">
                  <span className={cn(
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                    index === 0 ? 'bg-cave-gold text-cave-bg-primary' :
                    index === 1 ? 'bg-gray-400 text-cave-bg-primary' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-cave-bg-elevated text-cave-text-secondary'
                  )}>
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-cave-text-primary">
                      {user.first_name} {user.last_name}
                    </p>
                    {user.telegram_username && (
                      <p className="text-xs text-cave-text-secondary">@{user.telegram_username}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-cave-gold">{user.engagements_this_week}</span>
                </td>
                <td className="px-4 py-3 text-right text-cave-text-secondary">
                  {user.total_messages}
                </td>
                <td className="px-4 py-3 text-right text-cave-text-secondary">
                  {user.total_reactions}
                </td>
                <td className="px-4 py-3 text-right font-medium text-cave-text-primary">
                  {user.total_engagements}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// TOPIC PERFORMANCE COMPONENT
// ============================================================
function TopicPerformanceTable() {
  const { data: topics, isLoading } = useTopicPerformance()

  if (isLoading) {
    return <div className="h-72 rounded-xl bg-cave-bg-secondary animate-pulse" />
  }

  return (
    <div className="rounded-xl border border-cave-border bg-cave-bg-secondary overflow-hidden">
      <div className="px-5 py-4 border-b border-cave-border">
        <h3 className="text-lg font-semibold text-cave-text-primary flex items-center gap-2">
          <Hash className="w-5 h-5 text-blue-400" />
          Topic Performance
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-cave-bg-elevated">
              <th className="px-4 py-3 text-left text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                Topic
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                This Week
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                Change
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cave-border">
            {topics?.slice(0, 10).map((topic) => (
              <tr key={topic.topic_id} className="hover:bg-cave-bg-elevated transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-cave-text-primary">{topicsMap[topic.topic_id] || topic.topic_name}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-cave-gold">{topic.engagements_this_week}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {topic.wow_change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-cave-status-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-cave-status-error" />
                    )}
                    <span className={cn(
                      'text-sm font-medium',
                      topic.wow_change >= 0 ? 'text-cave-status-success' : 'text-cave-status-error'
                    )}>
                      {topic.wow_change >= 0 ? '+' : ''}{topic.wow_change.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-cave-text-secondary">
                  {topic.total_engagements}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// AT RISK MEMBERS COMPONENT
// ============================================================
function AtRiskMembers({ onSelectMember }: { onSelectMember: (id: string) => void }) {
  const { data: members, isLoading } = useMembersAtRisk()

  if (isLoading) {
    return <div className="h-72 rounded-xl bg-cave-bg-secondary animate-pulse" />
  }

  if (!members?.length) {
    return (
      <div className="rounded-xl border border-cave-border bg-cave-bg-secondary p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-cave-status-success/20 flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-cave-status-success" />
        </div>
        <p className="text-cave-text-primary font-medium">All members are active!</p>
        <p className="text-sm text-cave-text-secondary">No members at risk of churning</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cave-border bg-cave-bg-secondary overflow-hidden">
      <div className="px-5 py-4 border-b border-cave-border">
        <h3 className="text-lg font-semibold text-cave-text-primary flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-cave-status-error" />
          At Risk Members
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-cave-status-error/20 text-cave-status-error">
            {members.length}
          </span>
        </h3>
      </div>
      <div className="divide-y divide-cave-border max-h-80 overflow-y-auto">
        {members.slice(0, 10).map((member) => (
          <div 
            key={member.member_id} 
            className="px-5 py-3 hover:bg-cave-bg-elevated cursor-pointer transition-colors"
            onClick={() => onSelectMember(member.member_id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-cave-text-primary">
                  {member.first_name} {member.last_name}
                </p>
                {member.telegram_username && (
                  <p className="text-xs text-cave-text-secondary">@{member.telegram_username}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-cave-status-error">
                  {member.days_since_last_message} days ago
                </p>
                <p className="text-xs text-cave-text-secondary">
                  {member.total_messages} messages total
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// MEMBER DETAIL PANEL
// ============================================================
function MemberDetailPanel({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const { data: profile, isLoading: profileLoading } = useMemberProfile(memberId)
  const { data: topicActivity, isLoading: topicsLoading } = useMemberActivityByTopic(memberId)

  if (profileLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-cave-bg-secondary border-l border-cave-border shadow-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-cave-bg-elevated rounded w-1/2" />
          <div className="h-4 bg-cave-bg-elevated rounded w-1/3" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-cave-bg-elevated rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-cave-bg-secondary border-l border-cave-border shadow-xl overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-cave-bg-secondary border-b border-cave-border px-6 py-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-cave-bg-elevated transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-cave-text-secondary" />
        </button>
        <h2 className="text-lg font-semibold text-cave-text-primary">Member Details</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-cave-bg-elevated transition-colors"
        >
          <X className="w-5 h-5 text-cave-text-secondary" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-cave-gold/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-cave-gold">
              {profile.first_name?.[0] || '?'}{profile.last_name?.[0] || ''}
            </span>
          </div>
          <h3 className="text-xl font-bold text-cave-text-primary">
            {profile.first_name} {profile.last_name}
          </h3>
          {profile.telegram_username && (
            <p className="text-cave-text-secondary">@{profile.telegram_username}</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-cave-bg-elevated">
            <p className="text-xs text-cave-text-secondary uppercase tracking-wider">Messages</p>
            <p className="text-2xl font-bold text-cave-text-primary">{profile.total_messages}</p>
          </div>
          <div className="p-4 rounded-lg bg-cave-bg-elevated">
            <p className="text-xs text-cave-text-secondary uppercase tracking-wider">Engagements</p>
            <p className="text-2xl font-bold text-cave-gold">{profile.total_engagements}</p>
          </div>
          <div className="p-4 rounded-lg bg-cave-bg-elevated">
            <p className="text-xs text-cave-text-secondary uppercase tracking-wider">Reactions Given</p>
            <p className="text-2xl font-bold text-cave-text-primary">{profile.total_reactions_given}</p>
          </div>
          <div className="p-4 rounded-lg bg-cave-bg-elevated">
            <p className="text-xs text-cave-text-secondary uppercase tracking-wider">Reactions Received</p>
            <p className="text-2xl font-bold text-cave-text-primary">{profile.total_reactions_received}</p>
          </div>
        </div>

        {/* Activity Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-cave-text-secondary" />
            <span className="text-cave-text-secondary">First message:</span>
            <span className="text-cave-text-primary">{formatDate(profile.first_message_at)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-cave-text-secondary" />
            <span className="text-cave-text-secondary">Last message:</span>
            <span className="text-cave-text-primary">{formatDate(profile.last_message_at)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Target className="w-4 h-4 text-cave-text-secondary" />
            <span className="text-cave-text-secondary">Active days:</span>
            <span className="text-cave-text-primary">{profile.active_days}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Hash className="w-4 h-4 text-cave-text-secondary" />
            <span className="text-cave-text-secondary">Topics participated:</span>
            <span className="text-cave-text-primary">{profile.topics_participated}</span>
          </div>
        </div>

        {/* Topic Activity */}
        <div>
          <h4 className="text-sm font-semibold text-cave-text-primary uppercase tracking-wider mb-3">
            Activity by Topic
          </h4>
          {topicsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-cave-bg-elevated rounded-lg animate-pulse" />
              ))}
            </div>
          ) : topicActivity?.length ? (
            <div className="space-y-2">
              {topicActivity.map((topic) => (
                <div
                  key={topic.topic_id}
                  className="p-3 rounded-lg bg-cave-bg-elevated flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-cave-text-primary">{topicsMap[topic.topic_id] || topic.topic_name}</p>
                    <p className="text-xs text-cave-text-secondary">
                      {topic.message_count} messages · {topic.total_reactions} reactions
                    </p>
                  </div>
                  <span className="text-lg font-bold text-cave-gold">{topic.total_engagements}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cave-text-secondary text-sm">No topic activity found</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ALL MEMBERS MODAL
// ============================================================
function AllMembersModal({ onClose, onSelectMember }: { onClose: () => void; onSelectMember: (id: string) => void }) {
  const { data: users, isLoading } = useUserPerformance()
  const [search, setSearch] = useState('')

  const filteredUsers = users?.filter(user => {
    const searchLower = search.toLowerCase()
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.telegram_username?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="fixed inset-4 md:inset-10 bg-cave-bg-secondary border border-cave-border rounded-xl shadow-xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-cave-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cave-text-primary">All Members</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-cave-bg-elevated transition-colors"
        >
          <X className="w-5 h-5 text-cave-text-secondary" />
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-cave-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cave-text-secondary" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-secondary focus:outline-none focus:border-cave-gold"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-8 text-center text-cave-text-secondary">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-cave-bg-elevated">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                  This Week
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                  Reactions
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cave-border">
              {filteredUsers?.map((user) => (
                <tr 
                  key={user.member_id} 
                  className="hover:bg-cave-bg-elevated cursor-pointer transition-colors"
                  onClick={() => onSelectMember(user.member_id)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-cave-text-primary">
                        {user.first_name} {user.last_name}
                      </p>
                      {user.telegram_username && (
                        <p className="text-xs text-cave-text-secondary">@{user.telegram_username}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-cave-gold">{user.engagements_this_week}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-cave-text-secondary">
                    {user.total_messages}
                  </td>
                  <td className="px-4 py-3 text-right text-cave-text-secondary">
                    {user.total_reactions}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-cave-text-primary">
                    {user.total_engagements}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-cave-border text-sm text-cave-text-secondary">
        {filteredUsers?.length || 0} members
      </div>
    </div>
  )
}

// ============================================================
// MAIN ENGAGEMENT PAGE
// ============================================================
export function EngagementPage() {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [showAllMembers, setShowAllMembers] = useState(false)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-cave-text-primary">Engagement</h1>
        <p className="text-cave-text-secondary">Track community engagement and member activity</p>
      </div>

      {/* Overview Metrics */}
      <OverviewMetrics onEngagementsClick={() => setShowAllMembers(true)} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard - Takes 2 columns */}
        <div className="lg:col-span-2">
          <UserLeaderboard onSelectMember={setSelectedMemberId} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <AtRiskMembers onSelectMember={setSelectedMemberId} />
          <TopicPerformanceTable />
        </div>
      </div>

      {/* Member Detail Panel */}
      {selectedMemberId && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedMemberId(null)}
          />
          {/* Panel */}
          <MemberDetailPanel 
            memberId={selectedMemberId} 
            onClose={() => setSelectedMemberId(null)} 
          />
        </>
      )}

      {/* All Members Modal */}
      {showAllMembers && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowAllMembers(false)}
          />
          <AllMembersModal 
            onClose={() => setShowAllMembers(false)}
            onSelectMember={(id) => {
              setShowAllMembers(false)
              setSelectedMemberId(id)
            }}
          />
        </>
      )}
    </div>
  )
}