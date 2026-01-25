// src/components/onboarding/FormSettings.tsx
// UPDATED: Added redirect_url and thank_you_message fields

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit2, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface FormSettingsProps {
  form: {
    id: string
    title: string
    description: string | null
    slug: string
    is_active: boolean
    redirect_url?: string | null
    thank_you_message?: string | null
  }
}

export function FormSettings({ form }: FormSettingsProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(form.title)
  const [description, setDescription] = useState(form.description || '')
  const [slug, setSlug] = useState(form.slug)
  const [redirectUrl, setRedirectUrl] = useState(form.redirect_url || '')
  const [thankYouMessage, setThankYouMessage] = useState(
    form.thank_you_message || 'Thank you for your submission! We\'ll be in touch soon.'
  )

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('onboarding_forms')
        .update({
          title,
          description: description || null,
          slug,
          redirect_url: redirectUrl || null,
          thank_you_message: thankYouMessage || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', form.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-form', form.id] })
      setIsEditing(false)
    }
  })

  const generateSlug = () => {
    const generated = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    setSlug(generated)
  }

  const handleCancel = () => {
    setTitle(form.title)
    setDescription(form.description || '')
    setSlug(form.slug)
    setRedirectUrl(form.redirect_url || '')
    setThankYouMessage(form.thank_you_message || 'Thank you for your submission! We\'ll be in touch soon.')
    setIsEditing(false)
  }

  const handleSave = () => {
    updateMutation.mutate()
  }

  if (!isEditing) {
    return (
      <div className="border-b border-[#1A1F26] bg-[#0D0F12]">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{form.title}</h1>
              {form.description && (
                <p className="text-sm text-[#6B7A94] mt-1">{form.description}</p>
              )}
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B7A94]">Public URL:</span>
                  <code className="text-xs text-white font-mono bg-[#1A1F26] px-2 py-1 rounded">
                    /onboarding/{form.slug}
                  </code>
                </div>
                {form.redirect_url && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6B7A94]">Redirects to:</span>
                    <code className="text-xs text-blue-400 font-mono bg-[#1A1F26] px-2 py-1 rounded">
                      {form.redirect_url}
                    </code>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-2 text-[#6B7A94] hover:text-white hover:bg-[#1A1F26] rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span className="text-sm">Edit Details</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-[#1A1F26] bg-[#0D0F12]">
      <div className="max-w-[1920px] mx-auto px-6 py-4">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[#6B7A94] mb-2">
              Form Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-cave-gold"
              placeholder="Member Onboarding"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#6B7A94] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-cave-gold resize-none"
              placeholder="Complete this form to join The Cave"
              rows={2}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-[#6B7A94] mb-2">
              URL Slug *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-cave-gold font-mono text-sm"
                placeholder="member-onboarding"
              />
              <button
                onClick={generateSlug}
                className="px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-[#6B7A94] hover:text-white hover:border-cave-gold/30 transition-colors cursor-pointer"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-[#6B7A94] mt-1">
              Public URL: /onboarding/{slug || 'your-slug'}
            </p>
          </div>

          {/* Redirect URL */}
          <div>
            <label className="block text-xs font-medium text-[#6B7A94] mb-2">
              Redirect URL (Optional)
            </label>
            <input
              type="url"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-cave-gold font-mono text-sm"
              placeholder="https://example.com/welcome"
            />
            <p className="text-xs text-[#6B7A94] mt-1">
              If set, users will be redirected here after submission instead of seeing a thank you message
            </p>
          </div>

          {/* Thank You Message */}
          <div>
            <label className="block text-xs font-medium text-[#6B7A94] mb-2">
              Thank You Message {redirectUrl ? '(Not used if redirect URL is set)' : '*'}
            </label>
            <textarea
              value={thankYouMessage}
              onChange={(e) => setThankYouMessage(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-cave-gold resize-none"
              placeholder="Thank you for your submission! We'll be in touch soon."
              rows={3}
              disabled={!!redirectUrl}
            />
            <p className="text-xs text-[#6B7A94] mt-1">
              Shown to users after form submission if no redirect URL is set
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1F26] text-white border border-[#2A2F36] rounded-lg hover:border-red-500/30 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title || !slug || updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-cave-gold text-black font-semibold rounded-lg hover:bg-cave-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {updateMutation.isError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">
                Failed to save changes. Please try again.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}