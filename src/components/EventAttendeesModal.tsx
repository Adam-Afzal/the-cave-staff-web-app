import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Search, UserPlus, Check, Clock, UserCheck, MoreVertical, Trash2, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

type RsvpStatus = 'CONFIRMED' | 'WAITLIST'

interface Event {
  id: string
  title: string
  capacity: number | null
}

interface Attendee {
  id: string
  event_id: string
  member_id: string | null
  invited_by_member_id: string | null
  guest_name: string | null
  guest_email: string | null
  rsvp_status: RsvpStatus
  attended: boolean | null
  added_by_staff_id: string | null
  notes: string | null
  created_at: string
  member: {
    id: string
    first_name: string
    last_name: string
    email: string
    profile_picture_url: string | null
  } | null
  inviting_member: {
    id: string
    first_name: string
    last_name: string
  } | null
}

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  profile_picture_url: string | null
}

interface EventAttendeesModalProps {
  event: Event
  onClose: () => void
}

const statusConfig: Record<RsvpStatus, { label: string; color: string; icon: typeof Check }> = {
  CONFIRMED: { label: 'Confirmed', color: 'bg-cave-status-success/20 text-cave-status-success', icon: Check },
  WAITLIST: { label: 'Waitlist', color: 'bg-cave-status-warning/20 text-cave-status-warning', icon: Clock },
}

export function EventAttendeesModal({ event, onClose }: EventAttendeesModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  
  const queryClient = useQueryClient()

  // Fetch attendees
  const { data: attendees, isLoading: loadingAttendees } = useQuery({
    queryKey: ['event-attendees', event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          member:members!member_id(id, first_name, last_name, email, profile_picture_url),
          inviting_member:members!invited_by_member_id(id, first_name, last_name)
        `)
        .eq('event_id', event.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Attendee[]
    }
  })

  // Search members for adding
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

  // Add attendee
  const addAttendeeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // Get current user's staff record
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: staffRecord } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user?.email)
        .single()

      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: event.id,
          member_id: memberId,
          rsvp_status: 'CONFIRMED',
          added_by_staff_id: staffRecord?.id || null
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees', event.id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setMemberSearch('')
      setIsAddingMember(false)
    }
  })

  // Update attendee status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ attendeeId, status }: { attendeeId: string; status: RsvpStatus }) => {
      const { error } = await supabase
        .from('event_attendees')
        .update({ rsvp_status: status })
        .eq('id', attendeeId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees', event.id] })
      setOpenMenuId(null)
    }
  })

  // Mark attendance
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ attendeeId, attended }: { attendeeId: string; attended: boolean }) => {
      const { error } = await supabase
        .from('event_attendees')
        .update({ attended })
        .eq('id', attendeeId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees', event.id] })
    }
  })

  // Remove attendee
  const removeAttendeeMutation = useMutation({
    mutationFn: async (attendeeId: string) => {
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('id', attendeeId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees', event.id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setOpenMenuId(null)
    }
  })

  // Helper to get attendee display info
  const getAttendeeInfo = (attendee: Attendee) => {
    if (attendee.member) {
      return {
        name: `${attendee.member.first_name} ${attendee.member.last_name}`,
        email: attendee.member.email,
        initials: `${attendee.member.first_name[0]}${attendee.member.last_name[0]}`,
        profilePicture: attendee.member.profile_picture_url,
        isGuest: false,
        hostName: null
      }
    }
    // Guest attendee
    const nameParts = (attendee.guest_name || 'Guest').split(' ')
    return {
      name: attendee.guest_name || 'Guest',
      email: attendee.guest_email || '',
      initials: nameParts.length >= 2 ? `${nameParts[0][0]}${nameParts[1][0]}` : nameParts[0][0] || 'G',
      profilePicture: null,
      isGuest: true,
      hostName: attendee.inviting_member
        ? `${attendee.inviting_member.first_name} ${attendee.inviting_member.last_name}`
        : null
    }
  }

  const filteredAttendees = attendees?.filter(a => {
    const info = getAttendeeInfo(a)
    const searchLower = searchQuery.toLowerCase()
    return info.name.toLowerCase().includes(searchLower) || info.email.toLowerCase().includes(searchLower)
  })

  const existingMemberIds = new Set(attendees?.filter(a => a.member_id).map(a => a.member_id) || [])
  const availableMembers = searchResults?.filter(m => !existingMemberIds.has(m.id)) || []

  const confirmedCount = attendees?.filter(a => a.rsvp_status === 'CONFIRMED').length || 0

  const handleMenuOpen = (attendeeId: string) => {
    if (openMenuId === attendeeId) {
      setOpenMenuId(null)
      setMenuPosition(null)
      return
    }

    const button = menuButtonRefs.current[attendeeId]
    if (button) {
      const rect = button.getBoundingClientRect()
      const menuHeight = 200 // approximate menu height
      const spaceBelow = window.innerHeight - rect.bottom
      
      // Position menu above if not enough space below
      if (spaceBelow < menuHeight) {
        setMenuPosition({
          top: rect.top - menuHeight,
          left: rect.right - 160
        })
      } else {
        setMenuPosition({
          top: rect.bottom + 4,
          left: rect.right - 160
        })
      }
    }
    setOpenMenuId(attendeeId)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-cave-bg-secondary border border-cave-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cave-border">
          <div>
            <h2 className="text-xl font-semibold text-cave-text-primary">Manage Attendees</h2>
            <p className="text-sm text-cave-text-secondary mt-0.5">
              {event.title} · {confirmedCount} confirmed
              {event.capacity && ` / ${event.capacity} capacity`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Add */}
        <div className="px-6 py-4 border-b border-cave-border space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cave-text-muted" />
              <input
                type="text"
                placeholder="Search attendees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
              />
            </div>
            <button
              onClick={() => setIsAddingMember(!isAddingMember)}
              className={cn(
                'px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors',
                isAddingMember
                  ? 'bg-cave-bg-elevated text-cave-text-primary'
                  : 'bg-cave-gold text-cave-bg-primary hover:bg-cave-gold-dark'
              )}
            >
              <UserPlus className="w-5 h-5" />
              Add Member
            </button>
          </div>

          {/* Add Member Search */}
          {isAddingMember && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                autoFocus
                className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
              />
              
              {availableMembers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-cave-bg-elevated border border-cave-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {availableMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => addAttendeeMutation.mutate(member.id)}
                      disabled={addAttendeeMutation.isPending}
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

              {memberSearch.length >= 2 && availableMembers.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-cave-bg-elevated border border-cave-border rounded-lg shadow-lg z-10 px-4 py-3 text-cave-text-muted text-sm">
                  No members found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attendees List */}
        <div className="flex-1 overflow-y-auto">
          {loadingAttendees ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cave-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAttendees && filteredAttendees.length > 0 ? (
            <div className="divide-y divide-cave-border">
              {filteredAttendees.map(attendee => {
                const { label, color, icon: StatusIcon } = statusConfig[attendee.rsvp_status]
                const info = getAttendeeInfo(attendee)
                
                return (
                  <div key={attendee.id} className="px-6 py-4 flex items-center gap-4">
                    {/* Avatar */}
                    {info.profilePicture ? (
                      <img 
                        src={info.profilePicture} 
                        alt="" 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-medium",
                        info.isGuest 
                          ? "bg-cave-text-muted/20 text-cave-text-muted"
                          : "bg-cave-gold/20 text-cave-gold"
                      )}>
                        {info.isGuest ? <User className="w-5 h-5" /> : info.initials}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-cave-text-primary font-medium">
                          {info.name}
                        </span>
                        {info.isGuest && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-cave-text-muted/20 text-cave-text-muted">
                            Guest
                          </span>
                        )}
                        {info.hostName && (
                          <span className="text-xs text-cave-text-muted">
                            (of {info.hostName})
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-cave-text-muted truncate">{info.email}</div>
                    </div>

                    {/* Status Badge */}
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5', color)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {label}
                    </span>

                    {/* Attendance Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attendee.attended || false}
                        onChange={(e) => markAttendanceMutation.mutate({ 
                          attendeeId: attendee.id, 
                          attended: e.target.checked 
                        })}
                        className="w-5 h-5 rounded border-cave-border bg-cave-bg-primary text-cave-gold focus:ring-cave-gold/50"
                      />
                      <span className="text-sm text-cave-text-secondary">Attended</span>
                    </label>

                    {/* Menu Button */}
                    <button
                      ref={(el) => { menuButtonRefs.current[attendee.id] = el }}
                      onClick={() => handleMenuOpen(attendee.id)}
                      className="p-2 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCheck className="w-12 h-12 text-cave-text-muted mb-4" />
              <h3 className="text-lg font-medium text-cave-text-primary mb-2">No attendees yet</h3>
              <p className="text-cave-text-secondary">
                {searchQuery ? 'No attendees match your search' : 'Add members to this event'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Position Dropdown Menu */}
      {openMenuId && menuPosition && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => { setOpenMenuId(null); setMenuPosition(null) }} />
          <div 
            className="fixed w-40 bg-cave-bg-elevated border border-cave-border rounded-lg shadow-lg z-[70] py-1"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {(['CONFIRMED', 'WAITLIST'] as RsvpStatus[]).map(status => {
              const attendee = attendees?.find(a => a.id === openMenuId)
              return (
                <button
                  key={status}
                  onClick={() => updateStatusMutation.mutate({ attendeeId: openMenuId, status })}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors',
                    attendee?.rsvp_status === status
                      ? 'bg-cave-bg-card text-cave-gold'
                      : 'text-cave-text-secondary hover:bg-cave-bg-card hover:text-cave-text-primary'
                  )}
                >
                  {statusConfig[status].label}
                  {attendee?.rsvp_status === status && <Check className="w-4 h-4 ml-auto" />}
                </button>
              )
            })}
            <hr className="my-1 border-cave-border" />
            <button
              onClick={() => {
                if (confirm('Remove this attendee?')) {
                  removeAttendeeMutation.mutate(openMenuId)
                }
              }}
              className="w-full px-4 py-2 text-left text-sm text-cave-status-error hover:bg-cave-status-error/10 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  )
}