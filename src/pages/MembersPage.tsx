import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../components/layout/Header'
import { Search, Filter, Plus, MoreHorizontal, Mail, Phone, Loader2 } from 'lucide-react'
import { cn, getInitials } from '../lib/utils'
import { supabase } from '../lib/supabase'
import type { Member } from '../types/database'

const statusFilters = ['All', 'Active', 'Inactive', 'Pending', 'Churned']

function HealthScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-cave-bg-elevated rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full",
            score >= 70 ? 'bg-cave-status-success' : score >= 40 ? 'bg-cave-status-warning' : 'bg-cave-status-error'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn(
        "text-sm font-medium",
        score >= 70 ? 'text-cave-status-success' : score >= 40 ? 'text-cave-status-warning' : 'text-cave-status-error'
      )}>
        {score}
      </span>
    </div>
  )
}

export function MembersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Member[]
    }
  })

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = 
      activeFilter === 'All' || 
      member.status.toLowerCase() === activeFilter.toLowerCase()

    return matchesSearch && matchesFilter
  })

  if (error) {
    return (
      <div className="p-6">
        <div className="text-cave-status-error">Error loading members: {error.message}</div>
      </div>
    )
  }

  return (
    <div>
      <Header 
        title="Members" 
        subtitle={`${members.length} total members`}
        actions={
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        }
      />

      <div className="p-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1">
            {/* Filters */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      activeFilter === filter
                        ? "bg-cave-gold text-cave-bg-primary"
                        : "text-cave-text-secondary hover:bg-cave-bg-elevated"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cave-text-muted" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 bg-cave-bg-card border border-cave-border rounded-lg text-sm"
                  />
                </div>
                <button className="btn-secondary">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>

            {/* Members Table */}
            <div className="card overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 text-cave-gold animate-spin" />
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Business Arena</th>
                      <th>Location</th>
                      <th>Health Score</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-cave-text-muted py-8">
                          No members found
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => (
                        <tr 
                          key={member.id}
                          onClick={() => setSelectedMember(member)}
                          className={cn(
                            "cursor-pointer",
                            selectedMember?.id === member.id && "bg-cave-gold/5"
                          )}
                        >
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-cave-gold/20 flex items-center justify-center">
                                <span className="text-cave-gold font-medium text-sm">
                                  {getInitials(member.first_name, member.last_name)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-cave-text-primary">
                                  {member.first_name} {member.last_name}
                                </p>
                                <p className="text-xs text-cave-text-muted">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>
                            {member.business_arena ? (
                              <span className="badge-info">{member.business_arena}</span>
                            ) : (
                              <span className="text-cave-text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <span className="text-cave-text-secondary">
                              {member.city && member.country 
                                ? `${member.city}, ${member.country}`
                                : member.city || member.country || '-'
                              }
                            </span>
                          </td>
                          <td>
                            <HealthScoreBadge score={member.health_score} />
                          </td>
                          <td>
                            <span className={cn(
                              member.status === 'ACTIVE' ? 'badge-success' : 
                              member.status === 'INACTIVE' ? 'badge-warning' :
                              member.status === 'CHURNED' ? 'badge-error' : 'badge-info'
                            )}>
                              {member.status}
                            </span>
                          </td>
                          <td>
                            <button className="p-1 rounded hover:bg-cave-bg-elevated">
                              <MoreHorizontal className="w-4 h-4 text-cave-text-muted" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Member Preview Sidebar */}
          {selectedMember && (
            <div className="w-80 card p-4 h-fit">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-cave-gold/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-cave-gold font-bold text-xl">
                    {getInitials(selectedMember.first_name, selectedMember.last_name)}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-cave-text-primary">
                  {selectedMember.first_name} {selectedMember.last_name}
                </h3>
                <p className="text-sm text-cave-text-secondary">
                  {selectedMember.business_arena || 'No business arena'} • {selectedMember.city || 'Unknown'}
                </p>
                {selectedMember.wealth_tier && (
                  <span className={cn(
                    "mt-2",
                    selectedMember.wealth_tier === 'UHNW' ? 'badge-gold' : 'badge-info'
                  )}>
                    {selectedMember.wealth_tier}
                  </span>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-cave-text-muted" />
                  <span className="text-cave-text-secondary">{selectedMember.email}</span>
                </div>
                {selectedMember.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-cave-text-muted" />
                    <span className="text-cave-text-secondary">{selectedMember.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-cave-border">
                <p className="text-xs text-cave-text-muted mb-2">Health Score</p>
                <HealthScoreBadge score={selectedMember.health_score} />
              </div>

              <div className="flex gap-2 mt-4">
                <button className="btn-primary flex-1">View Profile</button>
                <button className="btn-secondary flex-1">Message</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}