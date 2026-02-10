import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { X, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCreateUaeTravel, useUpdateUaeTravel } from '../hooks/useUaeTravel'
import type { UaeTravel, Member } from '../types/database'

interface UaeTravelModalProps {
  entry: UaeTravel | null  // null = create mode
  onClose: () => void
}

export function UaeTravelModal({ entry, onClose }: UaeTravelModalProps) {
  const isEditing = !!entry
  const navigate = useNavigate()

  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<{ id: string; first_name: string; last_name: string; email: string; profile_picture_url: string | null } | null>(null)
  const [travelDate, setTravelDate] = useState('')
  const [notes, setNotes] = useState('')

  const createMutation = useCreateUaeTravel()
  const updateMutation = useUpdateUaeTravel()

  useEffect(() => {
    if (entry) {
      setSelectedMember({
        id: entry.member_id,
        first_name: entry.member_first_name || '',
        last_name: entry.member_last_name || '',
        email: entry.member_email || '',
        profile_picture_url: entry.member_profile_picture_url || null,
      })
      setTravelDate(entry.travel_date)
      setNotes(entry.notes || '')
    }
  }, [entry])

  const { data: searchResults } = useQuery({
    queryKey: ['member-search', memberSearch],
    queryFn: async () => {
      if (!memberSearch || memberSearch.length < 2) return []

      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, email, profile_picture_url')
        .or(`first_name.ilike.%${memberSearch}%,last_name.ilike.%${memberSearch}%,email.ilike.%${memberSearch}%`)
        .limit(10)

      if (error) throw error
      return data as Member[]
    },
    enabled: memberSearch.length >= 2
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember || !travelDate) return

    if (isEditing) {
      updateMutation.mutate(
        { id: entry!.id, travel_date: travelDate, notes },
        { onSuccess: onClose }
      )
    } else {
      createMutation.mutate(
        { member_id: selectedMember.id, travel_date: travelDate, notes },
        { onSuccess: onClose }
      )
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-cave-bg-secondary border border-cave-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cave-border">
          <h2 className="text-xl font-semibold text-cave-text-primary">
            {isEditing ? 'Edit UAE Travel' : 'Add UAE Travel'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Member Selection */}
          <div>
            <label className="input-label">Member</label>
            {selectedMember ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-cave-bg-primary border border-cave-border rounded-lg">
                {selectedMember.profile_picture_url ? (
                  <img
                    src={selectedMember.profile_picture_url}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cave-gold/20 flex items-center justify-center text-cave-gold font-medium text-sm">
                    {selectedMember.first_name[0]}{selectedMember.last_name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-cave-text-primary font-medium">
                    {selectedMember.first_name} {selectedMember.last_name}
                  </div>
                  <div className="text-sm text-cave-text-muted truncate">{selectedMember.email}</div>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="p-1 rounded text-cave-text-muted hover:text-cave-text-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search members by name or email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
                />

                {searchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-cave-bg-elevated border border-cave-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {searchResults.map(member => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setSelectedMember({
                            id: member.id,
                            first_name: member.first_name,
                            last_name: member.last_name,
                            email: member.email,
                            profile_picture_url: member.profile_picture_url,
                          })
                          setMemberSearch('')
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-cave-bg-card flex items-center gap-3 transition-colors"
                      >
                        {member.profile_picture_url ? (
                          <img
                            src={member.profile_picture_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-cave-gold/20 flex items-center justify-center text-cave-gold font-medium text-sm">
                            {member.first_name[0]}{member.last_name[0]}
                          </div>
                        )}
                        <div>
                          <div className="text-cave-text-primary font-medium">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-sm text-cave-text-muted">{member.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {memberSearch.length >= 2 && searchResults && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-cave-bg-elevated border border-cave-border rounded-lg shadow-lg z-10 px-4 py-3 text-cave-text-muted text-sm">
                    No members found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Travel Date */}
          <div>
            <label className="input-label">Travel Date</label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              required
              className="input w-full"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="input-label">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional details..."
              className="input w-full resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-cave-border">
          {isEditing && selectedMember ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate(`/members/${selectedMember.id}`)
              }}
              className="btn-ghost flex items-center gap-2 text-cave-gold"
            >
              <Users className="w-4 h-4" />
              View Profile
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit as any}
              disabled={!selectedMember || !travelDate || isLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Add Travel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
