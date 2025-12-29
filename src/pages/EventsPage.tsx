import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Link2,
  Globe,
  Lock,
  Clock,
  Video
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { EventModal } from '../components/EventModal'
import { EventAttendeesModal } from '..//components/EventAttendeesModal'

type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
type LocationType = 'in_person' | 'online' | 'hybrid'

interface Event {
    id: string
    title: string
    description: string | null
    summary: string | null  // Add this line
    location: string | null
    location_type: LocationType | null
    online_link: string | null
    starts_at: string
    ends_at: string | null
    capacity: number | null
    status: EventStatus
    slug: string | null
    is_private: boolean
    waitlist_enabled: boolean
    registration_deadline: string | null
    max_guests_per_member: number
    cover_image_url: string | null
    created_at: string
    attendee_count?: number
  }

const statusColors: Record<EventStatus, string> = {
  DRAFT: 'bg-cave-text-muted/20 text-cave-text-muted',
  PUBLISHED: 'bg-cave-status-success/20 text-cave-status-success',
  CANCELLED: 'bg-cave-status-error/20 text-cave-status-error',
  COMPLETED: 'bg-cave-status-info/20 text-cave-status-info',
}

export function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [attendeesEvent, setAttendeesEvent] = useState<Event | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  const queryClient = useQueryClient()

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_attendees(count)
        `)
        .order('starts_at', { ascending: false })

      if (error) throw error
      
      return data.map(event => ({
        ...event,
        attendee_count: event.event_attendees?.[0]?.count ?? 0
      })) as Event[]
    }
  })

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })

  const filteredEvents = events?.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const upcomingEvents = filteredEvents?.filter(e => new Date(e.starts_at) > new Date() && e.status !== 'CANCELLED')
  const pastEvents = filteredEvents?.filter(e => new Date(e.starts_at) <= new Date() || e.status === 'CANCELLED')

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copySignupLink = (slug: string) => {
    const link = `${window.location.origin}/events/${slug}`
    navigator.clipboard.writeText(link)
    // You could add a toast notification here
  }

  const handleDelete = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEventMutation.mutate(eventId)
    }
    setOpenMenuId(null)
  }

  const LocationIcon = ({ type }: { type: LocationType | null }) => {
    if (type === 'online') return <Video className="w-4 h-4" />
    if (type === 'hybrid') return <Globe className="w-4 h-4" />
    return <MapPin className="w-4 h-4" />
  }

  const EventCard = ({ event }: { event: Event }) => (
    <div className="bg-cave-bg-card border border-cave-border rounded-lg p-5 hover:border-cave-gold/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusColors[event.status])}>
              {event.status}
            </span>
            {event.is_private && (
              <span className="flex items-center gap-1 text-cave-text-muted text-xs">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-cave-text-primary truncate mb-2">
            {event.title}
          </h3>
          
          <div className="space-y-1.5 text-sm text-cave-text-secondary">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cave-text-muted" />
              <span>{formatDate(event.starts_at)} at {formatTime(event.starts_at)}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2">
                <LocationIcon type={event.location_type} />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cave-text-muted" />
              <span>
                {event.attendee_count} attending
                {event.capacity && ` / ${event.capacity} capacity`}
              </span>
            </div>

            {event.registration_deadline && new Date(event.registration_deadline) > new Date() && (
              <div className="flex items-center gap-2 text-cave-status-warning">
                <Clock className="w-4 h-4" />
                <span>Registration closes {formatDate(event.registration_deadline)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
            className="p-2 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {openMenuId === event.id && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setOpenMenuId(null)} 
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-cave-bg-elevated border border-cave-border rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    setAttendeesEvent(event)
                    setOpenMenuId(null)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-cave-text-secondary hover:bg-cave-bg-card hover:text-cave-text-primary flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Manage Attendees
                </button>
                <button
                  onClick={() => {
                    setEditingEvent(event)
                    setOpenMenuId(null)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-cave-text-secondary hover:bg-cave-bg-card hover:text-cave-text-primary flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Event
                </button>
                {event.slug && event.status === 'PUBLISHED' && (
                  <button
                    onClick={() => {
                      copySignupLink(event.slug!)
                      setOpenMenuId(null)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-cave-text-secondary hover:bg-cave-bg-card hover:text-cave-text-primary flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    Copy Signup Link
                  </button>
                )}
                <button
                  onClick={() => handleDelete(event.id)}
                  className="w-full px-4 py-2 text-left text-sm text-cave-status-error hover:bg-cave-status-error/10 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Event
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-cave-text-primary">Events</h1>
          <p className="text-cave-text-secondary mt-1">Manage community events and track attendance</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-cave-gold text-cave-bg-primary font-medium rounded-lg hover:bg-cave-gold-dark transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cave-text-muted" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-cave-bg-secondary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EventStatus | 'ALL')}
          className="px-4 py-2.5 bg-cave-bg-secondary border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold/50"
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-cave-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Events */}
          {upcomingEvents && upcomingEvents.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-cave-text-primary mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cave-gold" />
                Upcoming Events
                <span className="text-sm font-normal text-cave-text-muted">({upcomingEvents.length})</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Past Events */}
          {pastEvents && pastEvents.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-cave-text-primary mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cave-text-muted" />
                Past Events
                <span className="text-sm font-normal text-cave-text-muted">({pastEvents.length})</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pastEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {(!filteredEvents || filteredEvents.length === 0) && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-cave-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-cave-text-primary mb-2">No events found</h3>
              <p className="text-cave-text-secondary mb-4">
                {searchQuery || statusFilter !== 'ALL' 
                  ? 'Try adjusting your filters'
                  : 'Create your first event to get started'}
              </p>
              {!searchQuery && statusFilter === 'ALL' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-cave-gold text-cave-bg-primary font-medium rounded-lg hover:bg-cave-gold-dark transition-colors"
                >
                  Create Event
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingEvent) && (
        <EventModal
          event={editingEvent}
          onClose={() => {
            setIsCreateModalOpen(false)
            setEditingEvent(null)
          }}
        />
      )}

      {/* Attendees Modal */}
      {attendeesEvent && (
        <EventAttendeesModal
          event={attendeesEvent}
          onClose={() => setAttendeesEvent(null)}
        />
      )}
    </div>
  )
}