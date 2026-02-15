import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Video,
  Plane,
  ChevronLeft,
  ChevronRight,
  X,
  LayoutList
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { EventModal } from '../components/EventModal'
import { EventAttendeesModal } from '..//components/EventAttendeesModal'
import { UaeTravelModal } from '../components/UaeTravelModal'
import { useUaeTravels, useDeleteUaeTravel } from '../hooks/useUaeTravel'
import type { UaeTravel } from '../types/database'

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
  const [mainTab, setMainTab] = useState<'events' | 'uae-travel'>('events')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [attendeesEvent, setAttendeesEvent] = useState<Event | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false)
  const [editingTravel, setEditingTravel] = useState<UaeTravel | null>(null)
  const [eventsView, setEventsView] = useState<'list' | 'calendar'>('list')
  const [eventCalendarMonth, setEventCalendarMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selectedEventDate, setSelectedEventDate] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)

  const navigate = useNavigate()
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

  // UAE Travel data
  const { data: uaeTravels, isLoading: isLoadingTravels } = useUaeTravels()
  const deleteTravelMutation = useDeleteUaeTravel()

  const now = new Date()
  const upcomingTravels = uaeTravels?.filter(t => new Date(t.travel_date) >= now)
  const pastTravels = uaeTravels?.filter(t => new Date(t.travel_date) < now)

  const handleDeleteTravel = (id: string) => {
    if (confirm('Are you sure you want to delete this travel entry?')) {
      deleteTravelMutation.mutate(id)
    }
  }

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

  const formatTravelDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const TravelCard = ({ travel }: { travel: UaeTravel }) => (
    <div className="bg-cave-bg-card border border-cave-border rounded-lg p-5 hover:border-cave-gold/30 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {travel.member_profile_picture_url ? (
            <img
              src={travel.member_profile_picture_url}
              alt=""
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-cave-gold/20 flex items-center justify-center text-cave-gold font-medium text-sm flex-shrink-0">
              {(travel.member_first_name || '?')[0]}{(travel.member_last_name || '?')[0]}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-cave-text-primary font-medium truncate">
              {travel.member_first_name} {travel.member_last_name}
            </div>
            <div className="flex items-center gap-2 text-sm text-cave-text-secondary">
              <Calendar className="w-3.5 h-3.5 text-cave-text-muted" />
              {formatTravelDate(travel.travel_date)}
            </div>
            {travel.notes && (
              <div className="text-sm text-cave-text-muted mt-1 truncate">{travel.notes}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setEditingTravel(travel)}
            className="p-2 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteTravel(travel.id)}
            className="p-2 rounded-lg text-cave-text-muted hover:bg-cave-status-error/10 hover:text-cave-status-error transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cave-text-primary">Events</h1>
          <p className="text-cave-text-secondary mt-1">Manage community events and track attendance</p>
        </div>
        <button
          onClick={() => mainTab === 'events' ? setIsCreateModalOpen(true) : setIsTravelModalOpen(true)}
          className="px-4 py-2.5 bg-cave-gold text-cave-bg-primary font-medium rounded-lg hover:bg-cave-gold-dark transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {mainTab === 'events' ? 'Create Event' : 'Add UAE Travel'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-cave-border mb-6">
        <button
          onClick={() => setMainTab('events')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
            mainTab === 'events'
              ? "border-cave-gold text-cave-gold"
              : "border-transparent text-cave-text-secondary hover:text-cave-text-primary"
          )}
        >
          <Calendar className="w-4 h-4" />
          Events
        </button>
        <button
          onClick={() => setMainTab('uae-travel')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
            mainTab === 'uae-travel'
              ? "border-cave-gold text-cave-gold"
              : "border-transparent text-cave-text-secondary hover:text-cave-text-primary"
          )}
        >
          <Plane className="w-4 h-4" />
          UAE Travel
        </button>
      </div>

      {/* Events Tab Content */}
      {mainTab === 'events' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
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

          {/* View Toggle */}
          <div className="flex items-center gap-1 mb-6">
            <button
              onClick={() => setEventsView('list')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                eventsView === 'list'
                  ? "bg-cave-gold/20 text-cave-gold"
                  : "text-cave-text-muted hover:text-cave-text-primary hover:bg-cave-bg-elevated"
              )}
            >
              <LayoutList className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setEventsView('calendar')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                eventsView === 'calendar'
                  ? "bg-cave-gold/20 text-cave-gold"
                  : "text-cave-text-muted hover:text-cave-text-primary hover:bg-cave-bg-elevated"
              )}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cave-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : eventsView === 'list' ? (
            <div className="space-y-8">
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
          ) : (
            <>
              {/* Events Calendar View */}
              {(() => {
                const { year, month } = eventCalendarMonth
                const today = new Date()
                const firstDay = new Date(year, month, 1)
                const lastDay = new Date(year, month + 1, 0)
                const startDayOfWeek = firstDay.getDay()
                const daysInMonth = lastDay.getDate()
                const monthLabel = firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

                // Build map of day -> events for this month
                const eventsByDay = new Map<number, Event[]>()
                filteredEvents?.forEach(e => {
                  const d = new Date(e.starts_at)
                  if (d.getFullYear() === year && d.getMonth() === month) {
                    const day = d.getDate()
                    if (!eventsByDay.has(day)) eventsByDay.set(day, [])
                    eventsByDay.get(day)!.push(e)
                  }
                })

                const isToday = (day: number) =>
                  today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

                const prevMonth = () => {
                  setEventCalendarMonth(prev =>
                    prev.month === 0
                      ? { year: prev.year - 1, month: 11 }
                      : { year: prev.year, month: prev.month - 1 }
                  )
                }
                const nextMonth = () => {
                  setEventCalendarMonth(prev =>
                    prev.month === 11
                      ? { year: prev.year + 1, month: 0 }
                      : { year: prev.year, month: prev.month + 1 }
                  )
                }
                const goToToday = () => {
                  setEventCalendarMonth({ year: today.getFullYear(), month: today.getMonth() })
                }

                const dateKey = (day: number) => {
                  const mm = String(month + 1).padStart(2, '0')
                  const dd = String(day).padStart(2, '0')
                  return `${year}-${mm}-${dd}`
                }

                const cells: (number | null)[] = []
                for (let i = 0; i < startDayOfWeek; i++) cells.push(null)
                for (let d = 1; d <= daysInMonth; d++) cells.push(d)

                return (
                  <div className="bg-cave-bg-card border border-cave-border rounded-lg p-5">
                    {/* Month navigation */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={prevMonth}
                        className="p-1.5 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-cave-text-primary">{monthLabel}</h3>
                        {!(today.getFullYear() === year && today.getMonth() === month) && (
                          <button
                            onClick={goToToday}
                            className="text-xs text-cave-gold hover:text-cave-gold-dark transition-colors"
                          >
                            Today
                          </button>
                        )}
                      </div>
                      <button
                        onClick={nextMonth}
                        className="p-1.5 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Day-of-week headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-xs font-medium text-cave-text-muted py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {cells.map((day, i) => {
                        const dayEvents = day !== null ? eventsByDay.get(day) : undefined
                        const hasEvents = !!dayEvents && dayEvents.length > 0
                        const isTodayCell = day !== null && isToday(day)

                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={!hasEvents}
                            onClick={() => {
                              if (hasEvents && day !== null) setSelectedEventDate(dateKey(day))
                            }}
                            className={cn(
                              "relative flex flex-col items-center rounded-lg py-1.5 px-1 text-sm transition-colors min-h-[3.5rem]",
                              day === null && "invisible",
                              isTodayCell && "bg-cave-gold/20 font-bold text-cave-gold",
                              day !== null && !isTodayCell && "text-cave-text-secondary",
                              hasEvents && !isTodayCell && "bg-cave-bg-elevated",
                              hasEvents && "cursor-pointer hover:ring-1 hover:ring-cave-gold/50",
                              !hasEvents && "cursor-default"
                            )}
                          >
                            <span>{day}</span>
                            {hasEvents && (
                              <span className="text-[10px] leading-tight text-cave-gold mt-0.5 truncate max-w-full px-0.5">
                                {dayEvents[0].title.split(/\s+/).slice(0, 2).join(' ')}...
                                {dayEvents.length > 1 && ` +${dayEvents.length - 1}`}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Event Date Detail Modal */}
              {selectedEventDate && (() => {
                const eventsForDate = filteredEvents?.filter(e => {
                  const d = new Date(e.starts_at)
                  const mm = String(d.getMonth() + 1).padStart(2, '0')
                  const dd = String(d.getDate()).padStart(2, '0')
                  return `${d.getFullYear()}-${mm}-${dd}` === selectedEventDate
                }) || []
                const displayDate = new Date(selectedEventDate + 'T00:00:00').toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })

                return (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-cave-bg-secondary border border-cave-border rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                      {/* Header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-cave-border">
                        <div>
                          <h2 className="text-lg font-semibold text-cave-text-primary">Events</h2>
                          <p className="text-sm text-cave-text-secondary">{displayDate}</p>
                        </div>
                        <button
                          onClick={() => setSelectedEventDate(null)}
                          className="p-2 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Event list */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {eventsForDate.map(event => (
                          <div
                            key={event.id}
                            className="bg-cave-bg-card border border-cave-border rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
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
                                <h4 className="text-sm font-semibold text-cave-text-primary truncate">
                                  {event.title}
                                </h4>
                                <div className="space-y-1 mt-1.5 text-xs text-cave-text-secondary">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-cave-text-muted" />
                                    <span>{formatTime(event.starts_at)}</span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1.5">
                                      <LocationIcon type={event.location_type} />
                                      <span className="truncate">{event.location}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-cave-text-muted" />
                                    <span>
                                      {event.attendee_count} attending
                                      {event.capacity && ` / ${event.capacity} capacity`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setSelectedEventDate(null)
                                    setAttendeesEvent(event)
                                  }}
                                  title="Manage Attendees"
                                  className="p-1.5 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
                                >
                                  <Users className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedEventDate(null)
                                    setEditingEvent(event)
                                  }}
                                  title="Edit Event"
                                  className="p-1.5 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {event.slug && event.status === 'PUBLISHED' && (
                                  <button
                                    onClick={() => copySignupLink(event.slug!)}
                                    title="Copy Signup Link"
                                    className="p-1.5 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
                                  >
                                    <Link2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedEventDate(null)
                                    handleDelete(event.id)
                                  }}
                                  title="Delete Event"
                                  className="p-1.5 rounded-lg text-cave-text-muted hover:bg-cave-status-error/10 hover:text-cave-status-error transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </>
      )}

      {/* UAE Travel Tab Content */}
      {mainTab === 'uae-travel' && (
        <>
          {/* Calendar View */}
          {(() => {
            const { year, month } = calendarMonth
            const today = new Date()
            const firstDay = new Date(year, month, 1)
            const lastDay = new Date(year, month + 1, 0)
            const startDayOfWeek = firstDay.getDay() // 0=Sun
            const daysInMonth = lastDay.getDate()
            const monthLabel = firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

            // Build map of day -> travel entries for this month
            const travelsByDay = new Map<number, UaeTravel[]>()
            uaeTravels?.forEach(t => {
              const d = new Date(t.travel_date + 'T00:00:00')
              if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate()
                if (!travelsByDay.has(day)) travelsByDay.set(day, [])
                travelsByDay.get(day)!.push(t)
              }
            })

            const isToday = (day: number) =>
              today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

            const prevMonth = () => {
              setCalendarMonth(prev =>
                prev.month === 0
                  ? { year: prev.year - 1, month: 11 }
                  : { year: prev.year, month: prev.month - 1 }
              )
            }
            const nextMonth = () => {
              setCalendarMonth(prev =>
                prev.month === 11
                  ? { year: prev.year + 1, month: 0 }
                  : { year: prev.year, month: prev.month + 1 }
              )
            }
            const goToToday = () => {
              setCalendarMonth({ year: today.getFullYear(), month: today.getMonth() })
            }

            const dateKey = (day: number) => {
              const mm = String(month + 1).padStart(2, '0')
              const dd = String(day).padStart(2, '0')
              return `${year}-${mm}-${dd}`
            }

            // Build grid cells: leading blanks + day numbers
            const cells: (number | null)[] = []
            for (let i = 0; i < startDayOfWeek; i++) cells.push(null)
            for (let d = 1; d <= daysInMonth; d++) cells.push(d)

            return (
              <div className="bg-cave-bg-card border border-cave-border rounded-lg p-5 mb-6">
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-cave-text-primary">{monthLabel}</h3>
                    {!(today.getFullYear() === year && today.getMonth() === month) && (
                      <button
                        onClick={goToToday}
                        className="text-xs text-cave-gold hover:text-cave-gold-dark transition-colors"
                      >
                        Today
                      </button>
                    )}
                  </div>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-cave-text-muted py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, i) => {
                    const travels = day !== null ? travelsByDay.get(day) : undefined
                    const hasTravel = !!travels && travels.length > 0
                    const isTodayCell = day !== null && isToday(day)

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!hasTravel}
                        onClick={() => {
                          if (hasTravel && day !== null) setSelectedCalendarDate(dateKey(day))
                        }}
                        className={cn(
                          "relative flex flex-col items-center rounded-lg py-1.5 px-1 text-sm transition-colors min-h-[3.5rem]",
                          day === null && "invisible",
                          isTodayCell && "bg-cave-gold/20 font-bold text-cave-gold",
                          day !== null && !isTodayCell && "text-cave-text-secondary",
                          hasTravel && !isTodayCell && "bg-cave-bg-elevated",
                          hasTravel && "cursor-pointer hover:ring-1 hover:ring-cave-gold/50",
                          !hasTravel && "cursor-default"
                        )}
                      >
                        <span>{day}</span>
                        {hasTravel && (
                          <span className="text-[10px] leading-tight text-cave-gold mt-0.5 truncate max-w-full px-0.5">
                            {travels.length === 1
                              ? travels[0].member_first_name
                              : `${travels.length} travelling`}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Date Detail Modal */}
          {selectedCalendarDate && (() => {
            const travelsForDate = uaeTravels?.filter(t => t.travel_date === selectedCalendarDate) || []
            const displayDate = new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })

            return (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-cave-bg-secondary border border-cave-border rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-cave-border">
                    <div>
                      <h2 className="text-lg font-semibold text-cave-text-primary">UAE Travel</h2>
                      <p className="text-sm text-cave-text-secondary">{displayDate}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCalendarDate(null)}
                      className="p-2 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Member list */}
                  <div className="flex-1 overflow-y-auto p-2">
                    {travelsForDate.map(travel => (
                      <div
                        key={travel.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-cave-bg-card transition-colors"
                      >
                        {travel.member_profile_picture_url ? (
                          <img
                            src={travel.member_profile_picture_url}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-cave-gold/20 flex items-center justify-center text-cave-gold font-medium text-sm flex-shrink-0">
                            {(travel.member_first_name || '?')[0]}{(travel.member_last_name || '?')[0]}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-cave-text-primary font-medium truncate">
                            {travel.member_first_name} {travel.member_last_name}
                          </div>
                          {travel.notes && (
                            <div className="text-sm text-cave-text-muted truncate">{travel.notes}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              setSelectedCalendarDate(null)
                              setEditingTravel(travel)
                            }}
                            title="Edit travel"
                            className="p-2 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCalendarDate(null)
                              navigate(`/members/${travel.member_id}`)
                            }}
                            title="View profile"
                            className="p-2 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-gold transition-colors"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {isLoadingTravels ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cave-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {upcomingTravels && upcomingTravels.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-cave-text-primary mb-4 flex items-center gap-2">
                    <Plane className="w-5 h-5 text-cave-gold" />
                    Upcoming Travel
                    <span className="text-sm font-normal text-cave-text-muted">({upcomingTravels.length})</span>
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {upcomingTravels.map(travel => (
                      <TravelCard key={travel.id} travel={travel} />
                    ))}
                  </div>
                </section>
              )}

              {pastTravels && pastTravels.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-cave-text-primary mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cave-text-muted" />
                    Past Travel
                    <span className="text-sm font-normal text-cave-text-muted">({pastTravels.length})</span>
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pastTravels.map(travel => (
                      <TravelCard key={travel.id} travel={travel} />
                    ))}
                  </div>
                </section>
              )}

              {(!uaeTravels || uaeTravels.length === 0) && (
                <div className="text-center py-12">
                  <Plane className="w-12 h-12 text-cave-text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-cave-text-primary mb-2">No UAE travel entries</h3>
                  <p className="text-cave-text-secondary mb-4">
                    Track when members are travelling to the UAE
                  </p>
                  <button
                    onClick={() => setIsTravelModalOpen(true)}
                    className="px-4 py-2 bg-cave-gold text-cave-bg-primary font-medium rounded-lg hover:bg-cave-gold-dark transition-colors"
                  >
                    Add UAE Travel
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Event Modal */}
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

      {/* UAE Travel Modal */}
      {(isTravelModalOpen || editingTravel) && (
        <UaeTravelModal
          entry={editingTravel}
          onClose={() => {
            setIsTravelModalOpen(false)
            setEditingTravel(null)
          }}
        />
      )}
    </div>
  )
}