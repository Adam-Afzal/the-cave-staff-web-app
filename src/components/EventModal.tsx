import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, MapPin, Users, Globe, Video, Lock, Upload, Image, Trash2, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { RichTextEditor } from './RichTextEditor'

type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
type LocationType = 'in_person' | 'online' | 'hybrid'

interface Event {
  id: string
  title: string
  description: string | null
  summary: string | null
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
}

interface EventModalProps {
  event: Event | null
  onClose: () => void
}

function generateSlug(title: string, date: Date): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)

  const suffix = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    .toLowerCase()
    .replace(/\s+/g, '-')

  return `${base}-${suffix}`
}

export function EventModal({ event, onClose }: EventModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!event
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    summary: '',
    location: '',
    location_type: 'in_person' as LocationType,
    online_link: '',
    starts_at: '',
    ends_at: '',
    capacity: '',
    status: 'DRAFT' as EventStatus,
    is_private: false,
    waitlist_enabled: true,
    registration_deadline: '',
    max_guests_per_member: 0,
    cover_image_url: '' as string | null,
    is_recurring: false,
    recurrence_type: 'weekly' as 'weekly' | 'monthly',
    recurrence_end_date: '',
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        summary: event.summary || '',
        location: event.location || '',
        location_type: event.location_type || 'in_person',
        online_link: event.online_link || '',
        starts_at: event.starts_at ? formatDateTimeLocal(event.starts_at) : '',
        ends_at: event.ends_at ? formatDateTimeLocal(event.ends_at) : '',
        capacity: event.capacity?.toString() || '',
        status: event.status,
        is_private: event.is_private,
        waitlist_enabled: event.waitlist_enabled,
        registration_deadline: event.registration_deadline ? formatDateTimeLocal(event.registration_deadline) : '',
        max_guests_per_member: event.max_guests_per_member,
        cover_image_url: event.cover_image_url,
        // Recurrence is create-only (see the !isEditing check around the recurrence
        // fields below) — existing events never carry these, so just keep defaults.
        is_recurring: false,
        recurrence_type: 'weekly',
        recurrence_end_date: '',
      })
      if (event.cover_image_url) {
        setImagePreview(event.cover_image_url)
      }
    }
  }, [event])

  function formatDateTimeLocal(isoString: string): string {
    const date = new Date(isoString)
    return date.toISOString().slice(0, 16)
  }

  async function uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `events/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    setFormData({ ...formData, cover_image_url: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function buildEventPayload(
    data: typeof formData,
    coverImageUrl: string | null,
    startsAt: Date,
    endsAt: Date | null,
    overrides: Record<string, any> = {}
  ) {
    return {
      title: data.title,
      description: data.description || null,
      summary: data.summary || null,
      location: data.location || null,
      location_type: data.location_type,
      online_link: data.online_link || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt ? endsAt.toISOString() : null,
      capacity: data.capacity ? parseInt(data.capacity) : null,
      status: data.status,
      slug: generateSlug(data.title, startsAt),
      is_private: data.is_private,
      waitlist_enabled: data.waitlist_enabled,
      registration_deadline: data.registration_deadline || null,
      max_guests_per_member: data.max_guests_per_member,
      cover_image_url: coverImageUrl,
      ...overrides,
    }
  }

  const createEventMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let coverImageUrl = data.cover_image_url

      if (imageFile) {
        setIsUploadingImage(true)
        try {
          coverImageUrl = await uploadImage(imageFile)
        } finally {
          setIsUploadingImage(false)
        }
      }

      if (data.is_recurring && data.recurrence_end_date) {
        const groupId = crypto.randomUUID()
        const baseStart = new Date(data.starts_at)
        const baseEnd = data.ends_at ? new Date(data.ends_at) : null
        const duration = baseEnd ? baseEnd.getTime() - baseStart.getTime() : null
        const until = new Date(data.recurrence_end_date)
        until.setHours(23, 59, 59, 999)

        const instances = []
        let current = new Date(baseStart)
        let index = 0

        while (current <= until) {
          const instanceEnd = duration !== null ? new Date(current.getTime() + duration) : null
          instances.push(buildEventPayload(data, coverImageUrl, current, instanceEnd, {
            recurrence_group_id: groupId,
            recurrence_type: data.recurrence_type,
          }))

          index++
          current = new Date(baseStart)
          if (data.recurrence_type === 'weekly') {
            current.setDate(current.getDate() + index * 7)
          } else {
            current.setMonth(current.getMonth() + index)
          }
        }

        if (instances.length === 0) throw new Error('No instances generated — check start date and end date')
        const { error } = await supabase.from('events').insert(instances)
        if (error) throw error
      } else {
        const payload = buildEventPayload(
          data,
          coverImageUrl,
          new Date(data.starts_at),
          data.ends_at ? new Date(data.ends_at) : null
        )
        const { error } = await supabase.from('events').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      onClose()
    }
  })

  const updateEventMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let coverImageUrl = data.cover_image_url

      if (imageFile) {
        setIsUploadingImage(true)
        try {
          coverImageUrl = await uploadImage(imageFile)
        } finally {
          setIsUploadingImage(false)
        }
      }

      const payload = {
        title: data.title,
        description: data.description || null,
        summary: data.summary || null,
        location: data.location || null,
        location_type: data.location_type,
        online_link: data.online_link || null,
        starts_at: data.starts_at,
        ends_at: data.ends_at || null,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        status: data.status,
        is_private: data.is_private,
        waitlist_enabled: data.waitlist_enabled,
        registration_deadline: data.registration_deadline || null,
        max_guests_per_member: data.max_guests_per_member,
        cover_image_url: coverImageUrl,
      }

      const { error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', event!.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditing) {
      updateEventMutation.mutate(formData)
    } else {
      createEventMutation.mutate(formData)
    }
  }

  const isLoading = createEventMutation.isPending || updateEventMutation.isPending || isUploadingImage

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-cave-bg-secondary border border-cave-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cave-border">
          <h2 className="text-xl font-semibold text-cave-text-primary">
            {isEditing ? 'Edit Event' : 'Create Event'}
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
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-cave-text-secondary mb-2">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Q1 Networking Dinner"
              className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-cave-text-secondary mb-2">
              Summary
            </label>
            <input
              type="text"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="A short tagline for the event"
              maxLength={150}
              className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
            />
            <p className="text-xs text-cave-text-muted mt-1">Displayed on event cards and signup page header</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-cave-text-secondary mb-2">
              Description
            </label>
            <RichTextEditor
              content={formData.description}
              onChange={(html) => setFormData({ ...formData, description: html })}
              placeholder="Details about the event..."
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-cave-text-secondary mb-2">
              Cover Image
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageSelect}
              className="hidden"
            />
            
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-cave-border">
                <img 
                  src={imagePreview} 
                  alt="Event cover preview" 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-cave-bg-primary/90 text-cave-text-primary rounded-lg font-medium flex items-center gap-2 hover:bg-cave-bg-primary transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-4 py-2 bg-cave-status-error/90 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-cave-status-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-cave-border rounded-lg flex flex-col items-center justify-center gap-3 text-cave-text-muted hover:border-cave-gold/50 hover:text-cave-text-secondary transition-colors"
              >
                <Image className="w-10 h-10" />
                <div className="text-center">
                  <p className="font-medium">Click to upload cover image</p>
                  <p className="text-sm">JPEG, PNG, WebP or GIF (max 5MB)</p>
                </div>
              </button>
            )}
          </div>

          {/* Date/Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cave-text-secondary mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cave-text-secondary mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold/50"
              />
            </div>
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-cave-text-secondary mb-2">
              Location Type
            </label>
            <div className="flex gap-2">
              {[
                { value: 'in_person', label: 'In Person', icon: MapPin },
                { value: 'online', label: 'Online', icon: Video },
                { value: 'hybrid', label: 'Hybrid', icon: Globe },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, location_type: value as LocationType })}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-lg border font-medium flex items-center justify-center gap-2 transition-colors',
                    formData.location_type === value
                      ? 'bg-cave-gold/10 border-cave-gold text-cave-gold'
                      : 'bg-cave-bg-primary border-cave-border text-cave-text-secondary hover:border-cave-text-muted'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Location / Online Link */}
          {(formData.location_type === 'in_person' || formData.location_type === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium text-cave-text-secondary mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="123 Main St, London"
                className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
              />
            </div>
          )}

          {(formData.location_type === 'online' || formData.location_type === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium text-cave-text-secondary mb-2">
                Online Link
              </label>
              <input
                type="url"
                value={formData.online_link}
                onChange={(e) => setFormData({ ...formData, online_link: e.target.value })}
                placeholder="https://zoom.us/j/..."
                className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
              />
            </div>
          )}

          {/* Capacity & Guests Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cave-text-secondary mb-2">
                Capacity
              </label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Unlimited"
                className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:border-cave-gold/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cave-text-secondary mb-2">
                Max Guests per Member
              </label>
              <input
                type="number"
                min="0"
                value={formData.max_guests_per_member}
                onChange={(e) => setFormData({ ...formData, max_guests_per_member: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold/50"
              />
            </div>
          </div>

          {/* Registration Deadline */}
          <div>
            <label className="block text-sm font-medium text-cave-text-secondary mb-2">
              Registration Deadline
            </label>
            <input
              type="datetime-local"
              value={formData.registration_deadline}
              onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
              className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold/50"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-cave-text-secondary mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
              className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold/50"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_private}
                onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                className="w-5 h-5 rounded border-cave-border bg-cave-bg-primary text-cave-gold focus:ring-cave-gold/50"
              />
              <div>
                <span className="text-cave-text-primary font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Private Event
                </span>
                <p className="text-sm text-cave-text-muted">Only accessible via direct link</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.waitlist_enabled}
                onChange={(e) => setFormData({ ...formData, waitlist_enabled: e.target.checked })}
                className="w-5 h-5 rounded border-cave-border bg-cave-bg-primary text-cave-gold focus:ring-cave-gold/50"
              />
              <div>
                <span className="text-cave-text-primary font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Enable Waitlist
                </span>
                <p className="text-sm text-cave-text-muted">Allow signups when capacity is reached</p>
              </div>
            </label>

            {/* Recurring — only on create */}
            {!isEditing && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="w-5 h-5 rounded border-cave-border bg-cave-bg-primary text-cave-gold focus:ring-cave-gold/50"
                />
                <div>
                  <span className="text-cave-text-primary font-medium flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Recurring Event
                  </span>
                  <p className="text-sm text-cave-text-muted">Automatically create repeated instances</p>
                </div>
              </label>
            )}
          </div>

          {/* Recurring options */}
          {!isEditing && formData.is_recurring && (
            <div className="bg-cave-bg-primary border border-cave-gold/20 rounded-lg p-4 space-y-4">
              <p className="text-sm font-medium text-cave-gold flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Recurrence Settings
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cave-text-secondary mb-2">Repeat</label>
                  <select
                    value={formData.recurrence_type}
                    onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value as 'weekly' | 'monthly' })}
                    className="w-full px-4 py-2.5 bg-cave-bg-secondary border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold/50"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cave-text-secondary mb-2">Repeat Until *</label>
                  <input
                    type="date"
                    required={formData.is_recurring}
                    value={formData.recurrence_end_date}
                    min={formData.starts_at ? formData.starts_at.slice(0, 10) : undefined}
                    onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-cave-bg-secondary border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold/50"
                  />
                </div>
              </div>
              {formData.starts_at && formData.recurrence_end_date && (
                <p className="text-xs text-cave-text-muted">
                  {(() => {
                    const start = new Date(formData.starts_at)
                    const until = new Date(formData.recurrence_end_date)
                    let count = 0, cur = new Date(start)
                    while (cur <= until && count < 200) {
                      count++
                      if (formData.recurrence_type === 'weekly') cur.setDate(cur.getDate() + 7)
                      else cur.setMonth(cur.getMonth() + 1)
                    }
                    return `${count} event${count !== 1 ? 's' : ''} will be created`
                  })()}
                </p>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-cave-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg font-medium text-cave-text-secondary hover:bg-cave-bg-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 bg-cave-gold text-cave-bg-primary font-medium rounded-lg hover:bg-cave-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (isUploadingImage ? 'Uploading image...' : 'Saving...') : isEditing ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  )
}