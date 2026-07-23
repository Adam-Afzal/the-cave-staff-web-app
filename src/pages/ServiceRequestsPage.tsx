// src/pages/ServiceRequestsPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '../components/layout/Header'
import { AlertTriangle, Clock, CheckCircle2, Search, Star, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

type StatusFilter = 'all' | 'pending' | 'completed'

interface ConciergeRequest {
  id: string
  description: string
  is_urgent: boolean
  status: 'pending' | 'completed'
  review: string | null
  created_at: string
  completed_at: string | null
  members: {
    id: string
    first_name: string
    last_name: string
  } | null
}

const parseRating = (review: string | null): number | null => {
  if (!review) return null
  const n = parseInt(review)
  return n >= 1 && n <= 5 ? n : null
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-cave-border fill-transparent'}`}
        />
      ))}
    </div>
  )
}

export function ServiceRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['service-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('concierge_requests')
        .select('*, members(id, first_name, last_name)')
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return data as unknown as ConciergeRequest[]
    }
  })

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      setCompletingId(id)
      setCompleteError(null)
      const { error } = await supabase
        .from('concierge_requests')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      setCompletingId(null)
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
    },
    onError: (err: Error) => {
      setCompletingId(null)
      setCompleteError(err.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('concierge_requests')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      setDeleteConfirmId(null)
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
    }
  })

  const filtered = requests.filter(req => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const name = `${req.members?.first_name ?? ''} ${req.members?.last_name ?? ''}`.toLowerCase()
    return name.includes(q) || req.description.toLowerCase().includes(q)
  })

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Service Requests"
        subtitle={pendingCount > 0 ? `${pendingCount} pending` : 'All caught up'}
      />

      <div className="flex-1 overflow-auto p-6">

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cave-text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by member or description..."
              className="w-full pl-9 pr-4 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-sm text-cave-text-primary placeholder-cave-text-muted focus:outline-none focus:border-cave-gold/40 transition-colors"
            />
          </div>

          <div className="flex rounded-lg border border-cave-border overflow-hidden">
            {(['all', 'pending', 'completed'] as StatusFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors capitalize',
                  statusFilter === f
                    ? 'bg-cave-gold/10 text-cave-gold'
                    : 'text-cave-text-secondary hover:bg-cave-bg-elevated hover:text-cave-text-primary'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Error banner */}
        {completeError && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            Failed to update: {completeError}
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-cave-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-cave-text-muted text-sm">No requests found</div>
        ) : (
          <div className="bg-cave-bg-secondary border border-cave-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cave-border">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-cave-text-muted uppercase tracking-wider">Member</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-cave-text-muted uppercase tracking-wider">Request</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-cave-text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-cave-text-muted uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-cave-text-muted uppercase tracking-wider">Rating</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cave-border">
                {filtered.map(req => {
                  const rating = parseRating(req.review)
                  const isDeleting = deleteMutation.isPending && deleteMutation.variables === req.id

                  return (
                    <tr key={req.id} className="hover:bg-cave-bg-elevated transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-cave-text-primary">
                          {req.members ? `${req.members.first_name} ${req.members.last_name}` : '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <div className="flex items-start gap-2">
                          {req.is_urgent && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          )}
                          <p className="text-sm text-cave-text-secondary line-clamp-2">{req.description}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {req.status === 'pending' ? (
                          <span className="flex items-center gap-1 text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full w-fit">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-cave-text-muted">
                          {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {rating !== null ? (
                          <StarDisplay rating={rating} />
                        ) : (
                          <span className="text-xs text-cave-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {req.status === 'pending' && (
                            <button
                              onClick={() => completeMutation.mutate(req.id)}
                              disabled={completingId === req.id}
                              className="flex items-center gap-1.5 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {completingId === req.id ? (
                                <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              Mark Complete
                            </button>
                          )}
                          {deleteConfirmId === req.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteMutation.mutate(req.id)}
                                disabled={isDeleting}
                                className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isDeleting ? '...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-xs text-cave-text-muted hover:text-cave-text-primary px-2 py-1.5 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(req.id)}
                              className="p-1.5 rounded-lg text-cave-text-muted hover:text-cave-status-error hover:bg-cave-status-error/10 transition-colors"
                              title="Delete request"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
