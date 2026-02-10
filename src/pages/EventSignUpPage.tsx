import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, MapPin, Users, Video, Globe, Clock, CheckCircle, AlertCircle, UserPlus, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'


type LocationType = 'in_person' | 'online' | 'hybrid'

interface Event {
  id: string
  title: string
  description: string | null
  summary: string | null
  location: string | null
  location_type: LocationType | null
  starts_at: string
  ends_at: string | null
  capacity: number | null
  status: string
  slug: string
  is_private: boolean
  waitlist_enabled: boolean
  registration_deadline: string | null
  cover_image_url: string | null
  attendee_count: number
  max_guests_per_member: number
}

interface HostMember {
  id: string
  first_name: string
  last_name: string
  member_id: string
}



export function EventSignupPage() {
  const { slug, memberId: hostMemberId } = useParams<{ slug: string; memberId?: string }>()
  const isInvitedGuestMode = !!hostMemberId
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    member_id: '',
    email: ''
  })
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'not_found' | 'already_registered'>('idle')
  const [registeredName, setRegisteredName] = useState('')
  const [registeredMemberId, setRegisteredMemberId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [copied, setCopied] = useState(false)

  // Fetch event by slug
  const { data: event, isLoading: loadingEvent, error: eventError } = useQuery({
    queryKey: ['event-public', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_attendees(count)
        `)
        .eq('slug', slug)
        .eq('status', 'PUBLISHED')
        .single()

      if (error) throw error
      
      return {
        ...data,
        attendee_count: data.event_attendees?.[0]?.count ?? 0
      } as Event
    }
  })

  // Fetch feature flag for member verification
  const { data: verificationFlag } = useQuery({
    queryKey: ['feature-flag', 'event_signup_member_verification'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('key', 'event_signup_member_verification')
        .single()

      if (error) return { enabled: true } // Default to verification enabled if flag not found
      return data
    }
  })

  const requireMemberVerification = verificationFlag?.enabled ?? true

  // Fetch host member info when in invited guest mode
  const { data: hostMember, isLoading: loadingHost, error: hostError } = useQuery({
    queryKey: ['host-member', hostMemberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, member_id')
        .eq('id', hostMemberId!)
        .eq('status', 'ACTIVE')
        .single()

      if (error) throw error
      return data as HostMember
    },
    enabled: isInvitedGuestMode && !!hostMemberId
  })

  // Verify host member is registered for this event
  const { data: hostAttendee, isLoading: loadingHostAttendee } = useQuery({
    queryKey: ['host-attendee', event?.id, hostMemberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_attendees')
        .select('id, rsvp_status')
        .eq('event_id', event!.id)
        .eq('member_id', hostMemberId!)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      return data
    },
    enabled: isInvitedGuestMode && !!event?.id && !!hostMemberId
  })

  // Fetch how many guests this host already has for this event
  const { data: hostGuestCount } = useQuery({
    queryKey: ['host-guest-count', event?.id, hostMemberId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event!.id)
        .eq('invited_by_member_id', hostMemberId!)

      if (error) throw error
      return count ?? 0
    },
    enabled: isInvitedGuestMode && !!event?.id && !!hostMemberId
  })

  // Fetch guest count for the registered member (after successful registration)
  const { data: myGuestCount, refetch: _refetchMyGuestCount } = useQuery({
    queryKey: ['my-guest-count', event?.id, registeredMemberId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event!.id)
        .eq('invited_by_member_id', registeredMemberId!)

      if (error) throw error
      return count ?? 0
    },
    enabled: !!event?.id && !!registeredMemberId
  })

  // Validation states for invited guest mode
  const hostNotRegistered = isInvitedGuestMode && !loadingHostAttendee && hostAttendee === null
  const guestLimitReached = isInvitedGuestMode &&
    event?.max_guests_per_member !== undefined &&
    event.max_guests_per_member > 0 &&
    (hostGuestCount ?? 0) >= event.max_guests_per_member
  const invalidHostLink = isInvitedGuestMode && !loadingHost && (hostError || !hostMember)

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Invited guest flow: guest registering via shared link
      if (isInvitedGuestMode && hostMemberId) {
        const guestName = `${data.first_name} ${data.last_name}`.trim()
        const guestEmail = data.email.toLowerCase().trim()

        setRegisteredName(data.first_name)

        // Check if already registered with this email
        const { data: existingAttendee } = await supabase
          .from('event_attendees')
          .select('id')
          .eq('event_id', event!.id)
          .eq('guest_email', guestEmail)
          .single()

        if (existingAttendee) {
          setSubmitStatus('already_registered')
          return
        }

        // Determine status based on capacity
        let rsvpStatus: 'CONFIRMED' | 'WAITLIST' = 'CONFIRMED'

        if (event!.capacity) {
          const confirmedCount = event!.attendee_count
          if (confirmedCount >= event!.capacity) {
            if (event!.waitlist_enabled) {
              rsvpStatus = 'WAITLIST'
            } else {
              throw new Error('Event is at full capacity')
            }
          }
        }

        // Register as invited guest
        const { error: attendeeError } = await supabase
          .from('event_attendees')
          .insert({
            event_id: event!.id,
            member_id: null,
            invited_by_member_id: hostMemberId,
            guest_name: guestName,
            guest_email: guestEmail,
            rsvp_status: rsvpStatus,
          })

        if (attendeeError) throw attendeeError
        setSubmitStatus('success')
        return
      }

      if (requireMemberVerification) {
        // Member verification flow: verify member exists by member_id
        const { data: members, error: memberError } = await supabase
          .from('members')
          .select('id, first_name, last_name, member_id')
          .ilike('member_id', data.member_id.trim())
          .eq('status', 'ACTIVE')

        if (memberError) throw memberError

        if (!members || members.length === 0) {
          setSubmitStatus('not_found')
          return
        }

        const member = members[0]
        setRegisteredName(member.first_name || '')
        setRegisteredMemberId(member.id)

        // Check if already registered
        const { data: existingAttendee } = await supabase
          .from('event_attendees')
          .select('id')
          .eq('event_id', event!.id)
          .eq('member_id', member.id)
          .single()

        if (existingAttendee) {
          setSubmitStatus('already_registered')
          return
        }

        // Determine status based on capacity
        let rsvpStatus: 'CONFIRMED' | 'WAITLIST' = 'CONFIRMED'

        if (event!.capacity) {
          const confirmedCount = event!.attendee_count
          if (confirmedCount >= event!.capacity) {
            if (event!.waitlist_enabled) {
              rsvpStatus = 'WAITLIST'
            } else {
              throw new Error('Event is at full capacity')
            }
          }
        }

        const { error: attendeeError } = await supabase
          .from('event_attendees')
          .insert({
            event_id: event!.id,
            member_id: member.id,
            rsvp_status: rsvpStatus,
          })

        if (attendeeError) throw attendeeError
      } else {
        // Guest flow: no member verification required
        const guestName = `${data.first_name} ${data.last_name}`.trim()
        const guestEmail = data.email.toLowerCase().trim()

        setRegisteredName(data.first_name)

        // Check if already registered with this email
        const { data: existingAttendee } = await supabase
          .from('event_attendees')
          .select('id')
          .eq('event_id', event!.id)
          .eq('guest_email', guestEmail)
          .single()

        if (existingAttendee) {
          setSubmitStatus('already_registered')
          return
        }

        // Determine status based on capacity
        let rsvpStatus: 'CONFIRMED' | 'WAITLIST' = 'CONFIRMED'

        if (event!.capacity) {
          const confirmedCount = event!.attendee_count
          if (confirmedCount >= event!.capacity) {
            if (event!.waitlist_enabled) {
              rsvpStatus = 'WAITLIST'
            } else {
              throw new Error('Event is at full capacity')
            }
          }
        }

        // Register as guest (no member_id)
        const { error: attendeeError } = await supabase
          .from('event_attendees')
          .insert({
            event_id: event!.id,
            member_id: null,
            guest_name: guestName,
            guest_email: guestEmail,
            rsvp_status: rsvpStatus,
          })

        if (attendeeError) throw attendeeError
      }

      setSubmitStatus('success')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-public', slug] })
      if (isInvitedGuestMode) {
        queryClient.invalidateQueries({ queryKey: ['host-guest-count', event?.id, hostMemberId] })
      }
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
      setSubmitStatus('error')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitStatus('idle')
    setErrorMessage('')
    registerMutation.mutate(formData)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const LocationIcon = ({ type }: { type: LocationType | null }) => {
    if (type === 'online') return <Video className="w-5 h-5" />
    if (type === 'hybrid') return <Globe className="w-5 h-5" />
    return <MapPin className="w-5 h-5" />
  }

  const isDeadlinePassed = event?.registration_deadline && new Date(event.registration_deadline) < new Date()
  const isFull = event?.capacity && event.attendee_count >= event.capacity && !event.waitlist_enabled

  const copyGuestLink = () => {
    const link = `${window.location.origin}/events/${event?.slug}/guest/${registeredMemberId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate remaining guest slots for the registered member
  const remainingGuestSlots = event?.max_guests_per_member
    ? event.max_guests_per_member - (myGuestCount ?? 0)
    : 0

  if (loadingEvent || (isInvitedGuestMode && loadingHost)) {
    return (
      <div className="min-h-screen bg-cave-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cave-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-cave-bg-primary flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-cave-status-error mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-cave-text-primary mb-2">Event Not Found</h1>
          <p className="text-cave-text-secondary">This event doesn't exist or is no longer available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cave-bg-primary">
      {/* Cover Image */}
      {event.cover_image_url && (
        <div className="w-full h-64 md:h-80 relative">
          <img 
            src={event.cover_image_url} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cave-bg-primary to-transparent" />
        </div>
      )}

      <div className={`max-w-3xl mx-auto px-4 py-8 ${event.cover_image_url ? '-mt-16 relative z-10' : ''}`}>
        {/* Event Header */}
        <div className="bg-cave-bg-card border border-cave-border rounded-xl p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cave-gold flex items-center justify-center">
              <span className="text-cave-bg-primary font-bold text-lg">C</span>
            </div>
            <span className="text-cave-text-secondary font-medium">The Cave</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-cave-text-primary mb-3">
            {event.title}
          </h1>
          
          {event.summary && (
            <p className="text-lg text-cave-text-secondary mb-6">{event.summary}</p>
          )}

          {/* Event Details */}
          <div className="space-y-3 text-cave-text-secondary">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-cave-gold" />
              <span>{formatDate(event.starts_at)} at {formatTime(event.starts_at)}</span>
            </div>

            {event.location && (
              <div className="flex items-center gap-3">
                <LocationIcon type={event.location_type} />
                <span>{event.location}</span>
              </div>
            )}

            {event.capacity && (
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-cave-text-muted" />
                <span>
                  {event.attendee_count} / {event.capacity} spots filled
                  {event.waitlist_enabled && event.attendee_count >= event.capacity && (
                    <span className="text-cave-status-warning ml-2">(Waitlist open)</span>
                  )}
                </span>
              </div>
            )}

            {event.registration_deadline && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-cave-text-muted" />
                <span>
                  Registration {isDeadlinePassed ? 'closed' : 'closes'} {formatDate(event.registration_deadline)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="bg-cave-bg-card border border-cave-border rounded-xl p-6 md:p-8 mb-6">
            <h2 className="text-xl font-semibold text-cave-text-primary mb-4">About This Event</h2>
            <div 
              className="prose prose-invert prose-sm max-w-none text-cave-text-secondary"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
            <style>{`
              .prose ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
              .prose ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
              .prose li { margin: 0.25rem 0; }
              .prose a { color: #f5c542; text-decoration: underline; }
              .prose p { margin: 0.75rem 0; line-height: 1.6; }
              .prose h2 { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem; color: #f8fafc; }
              .prose h3 { font-size: 1.1rem; font-weight: 600; margin: 1rem 0 0.5rem; color: #f8fafc; }
              .prose strong { font-weight: 600; color: #f8fafc; }
              .prose em { font-style: italic; }
            `}</style>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-cave-bg-card border border-cave-border rounded-xl p-6 md:p-8">
          <h2 className="text-xl font-semibold text-cave-text-primary mb-6">
            {isInvitedGuestMode ? 'Register as a Guest' : 'Register for This Event'}
          </h2>

          {/* Invited guest mode info banner */}
          {isInvitedGuestMode && hostMember && !invalidHostLink && !hostNotRegistered && !guestLimitReached && (
            <div className="mb-6 p-4 bg-cave-gold/10 border border-cave-gold/30 rounded-lg">
              <p className="text-cave-text-primary text-sm">
                You've been invited by <span className="font-semibold">{hostMember.first_name} {hostMember.last_name}</span> to attend this event as their guest.
              </p>
            </div>
          )}

          {/* Invited guest mode error states */}
          {invalidHostLink ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-cave-status-error mx-auto mb-4" />
              <h3 className="text-lg font-medium text-cave-text-primary mb-2">Invalid Invite Link</h3>
              <p className="text-cave-text-secondary">This invite link is not valid or the member is no longer active.</p>
            </div>
          ) : hostNotRegistered ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-cave-status-error mx-auto mb-4" />
              <h3 className="text-lg font-medium text-cave-text-primary mb-2">Host Not Registered</h3>
              <p className="text-cave-text-secondary">
                {hostMember?.first_name ? `${hostMember.first_name} hasn't` : "The member who shared this link hasn't"} registered for this event yet.
              </p>
            </div>
          ) : guestLimitReached ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-cave-status-warning mx-auto mb-4" />
              <h3 className="text-lg font-medium text-cave-text-primary mb-2">Guest Limit Reached</h3>
              <p className="text-cave-text-secondary">
                {hostMember?.first_name || 'This member'} has already reached the maximum number of guests for this event.
              </p>
            </div>
          ) : isDeadlinePassed ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-cave-status-error mx-auto mb-4" />
              <h3 className="text-lg font-medium text-cave-text-primary mb-2">Registration Closed</h3>
              <p className="text-cave-text-secondary">The registration deadline for this event has passed.</p>
            </div>
          ) : isFull ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-cave-status-warning mx-auto mb-4" />
              <h3 className="text-lg font-medium text-cave-text-primary mb-2">Event Full</h3>
              <p className="text-cave-text-secondary">This event has reached capacity.</p>
            </div>
          ) : submitStatus === 'success' ? (
            <div className="py-8">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-cave-status-success mx-auto mb-4" />
                <h3 className="text-lg font-medium text-cave-text-primary mb-2">
                  You're Registered{registeredName ? `, ${registeredName}` : ''}!
                </h3>
                <p className="text-cave-text-secondary">We've added you to the event. See you there!</p>
              </div>

              {/* Guest invite section - shown after successful member registration */}
              {!isInvitedGuestMode && requireMemberVerification && registeredMemberId && event.max_guests_per_member > 0 && (
                <div className="mt-8 p-4 bg-cave-bg-primary rounded-lg border border-cave-border">
                  <h4 className="text-cave-text-primary font-medium mb-2 flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Bring a Guest
                  </h4>
                  {remainingGuestSlots > 0 ? (
                    <>
                      <p className="text-cave-text-secondary text-sm mb-4">
                        You can invite up to {remainingGuestSlots} guest{remainingGuestSlots !== 1 ? 's' : ''} to this event. Share this link with them:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/events/${event.slug}/guest/${registeredMemberId}`}
                          className="flex-1 px-3 py-2 bg-cave-bg-secondary border border-cave-border rounded-lg text-cave-text-secondary text-sm"
                        />
                        <button
                          type="button"
                          onClick={copyGuestLink}
                          className="px-4 py-2 bg-cave-gold text-cave-bg-primary font-medium rounded-lg hover:bg-cave-gold-dark transition-colors flex items-center gap-2"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-cave-text-secondary text-sm">
                      You've reached the maximum number of guests ({event.max_guests_per_member}) for this event.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : submitStatus === 'already_registered' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-cave-status-info mx-auto mb-4" />
              <h3 className="text-lg font-medium text-cave-text-primary mb-2">
                Already Registered{registeredName ? `, ${registeredName}` : ''}
              </h3>
              <p className="text-cave-text-secondary">You're already signed up for this event.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitStatus === 'not_found' && (
                <div className="p-4 bg-cave-status-error/10 border border-cave-status-error/30 rounded-lg text-cave-status-error text-sm">
                  We couldn't find your membership with that ID. Please check if you entered your member ID correctly, or contact us on Telegram for help.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-cave-status-error/10 border border-cave-status-error/30 rounded-lg text-cave-status-error text-sm">
                  {errorMessage || 'Something went wrong. Please try again.'}
                </div>
              )}

              {isInvitedGuestMode || !requireMemberVerification ? (
                // Invited guest mode OR Member verification OFF: ask for name and email
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-cave-text-secondary mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="John"
                        className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cave-text-secondary mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Doe"
                        className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cave-text-secondary mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
                    />
                  </div>
                </>
              ) : (
                // Member verification ON: just ask for member_id
                <div>
                  <label className="block text-sm font-medium text-cave-text-secondary mb-2">
                    Member ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    placeholder="e.g. swift-river-compass"
                    className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
                  />
                  <p className="text-xs text-cave-text-muted mt-1">
                    This is your unique ID for The Cave.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full px-6 py-3 bg-cave-gold text-cave-bg-primary font-semibold rounded-lg hover:bg-cave-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registerMutation.isPending ? 'Registering...' : (isInvitedGuestMode ? 'Register as Guest' : 'Register Now')}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-cave-text-muted text-sm">
          <p>Questions? Contact the team on Telegram.</p>
        </div>
      </div>
    </div>
  )
}