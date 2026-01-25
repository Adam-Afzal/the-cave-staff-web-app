// src/pages/staff/OnboardingFormsPage.tsx
// FIXED VERSION - All buttons have cursor-pointer
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Eye, 
  Users,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface OnboardingForm {
  id: string
  title: string
  description: string | null
  slug: string
  is_active: boolean
  created_at: string
  updated_at: string
  submission_count?: number
}

export function OnboardingFormsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Fetch all forms
  const { data: forms, isLoading } = useQuery({
    queryKey: ['onboarding-forms'],
    queryFn: async () => {
      // First, get all forms
      const { data: formsData, error: formsError } = await supabase
        .from('onboarding_forms')
        .select('*')
        .order('created_at', { ascending: false })

      if (formsError) throw formsError

      // Then, get submission counts separately
      const { data: submissionCounts } = await supabase
        .from('onboarding_submissions')
        .select('form_id')

      // Don't throw error if submissions table is empty
      const countsByForm = submissionCounts?.reduce((acc, sub) => {
        acc[sub.form_id] = (acc[sub.form_id] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Combine forms with their submission counts
      return formsData.map(form => ({
        ...form,
        submission_count: countsByForm[form.id] || 0
      })) as OnboardingForm[]
    }
  })

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase
        .from('onboarding_forms')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-forms'] })
    }
  })

  // Delete form
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('onboarding_forms')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-forms'] })
    }
  })

  const copyPublicLink = (slug: string) => {
    const link = `${window.location.origin}/onboarding/${slug}`
    navigator.clipboard.writeText(link)
    // TODO: Show toast notification
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0C0F]">
        <div className="text-gold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0C0F]">
      {/* Header */}
      <div className="border-b border-[#1A1F26]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Onboarding Forms</h1>
              <p className="text-[#6B7A94]">Create and manage member onboarding forms</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cave-gold text-black font-semibold rounded-lg hover:bg-cave-gold-dark transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Create Form
            </button>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!forms || forms.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A1F26] flex items-center justify-center">
              <Users className="w-8 h-8 text-[#6B7A94]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No forms yet</h3>
            <p className="text-[#6B7A94] mb-6">Create your first onboarding form to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-cave-gold text-black font-semibold rounded-lg hover:bg-cave-gold-dark transition-colors cursor-pointer"
            >
              Create Form
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <div
                key={form.id}
                className="group relative bg-gradient-to-br from-[#0D0F12] to-[#1A1F26] border border-[#1A1F26] rounded-xl p-6 hover:border-gold/30 transition-all duration-300"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {form.is_active ? (
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-[#6B7A94]/10 text-[#6B7A94] border border-[#6B7A94]/20 rounded text-xs font-medium">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Form Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-2 pr-20">{form.title}</h3>
                  {form.description && (
                    <p className="text-sm text-[#6B7A94] line-clamp-2 mb-3">{form.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[#6B7A94]">
                    <Users className="w-4 h-4" />
                    <span>{form.submission_count} submissions</span>
                  </div>
                </div>

                {/* Slug */}
                <div className="mb-4 p-2 bg-[#0A0C0F] border border-[#1A1F26] rounded">
                  <div className="text-xs text-[#6B7A94] mb-1">Public URL</div>
                  <div className="text-xs text-white font-mono truncate">
                    /onboarding/{form.slug}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/staff/onboarding-forms/${form.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gold/10 text-gold border border-gold/20 rounded-lg hover:bg-gold/20 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => window.open(`/onboarding/${form.slug}`, '_blank')}
                    className="px-3 py-2 bg-[#0D0F12] text-white border border-[#1A1F26] rounded-lg hover:border-gold/30 transition-colors cursor-pointer"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => copyPublicLink(form.slug)}
                    className="px-3 py-2 bg-[#0D0F12] text-white border border-[#1A1F26] rounded-lg hover:border-gold/30 transition-colors cursor-pointer"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleActiveMutation.mutate({ id: form.id, is_active: !form.is_active })}
                    className="px-3 py-2 bg-[#0D0F12] text-white border border-[#1A1F26] rounded-lg hover:border-gold/30 transition-colors cursor-pointer"
                    title={form.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {form.is_active ? (
                      <ToggleRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-[#6B7A94]" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete "${form.title}"? This cannot be undone.`)) {
                        deleteMutation.mutate(form.id)
                      }
                    }}
                    className="px-3 py-2 bg-[#0D0F12] text-red-400 border border-[#1A1F26] rounded-lg hover:border-red-500/30 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(formId) => {
            setShowCreateModal(false)
            navigate(`/staff/onboarding-forms/${formId}/edit`)
          }}
        />
      )}
    </div>
  )
}

// Create Form Modal Component
interface CreateFormModalProps {
  onClose: () => void
  onSuccess: (formId: string) => void
}

function CreateFormModal({ onClose, onSuccess }: CreateFormModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_forms')
        .insert({
          title,
          description: description || null,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          is_active: false
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      onSuccess(data.id)
    }
  })

  const generateSlug = () => {
    const generated = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    setSlug(generated)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0D0F12] border border-[#1A1F26] rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Create New Form</h2>
        
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Form Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-gold"
              placeholder="Member Onboarding"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-gold resize-none"
              placeholder="Complete this form to join The Cave"
              rows={3}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              URL Slug
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-gold"
                placeholder="member-onboarding"
              />
              <button
                onClick={generateSlug}
                className="px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-[#6B7A94] hover:text-white hover:border-gold/30 transition-colors cursor-pointer"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-[#6B7A94] mt-1">
              /onboarding/{slug || 'your-slug'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#1A1F26] text-white border border-[#2A2F36] rounded-lg hover:border-gold/30 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!title || createMutation.isPending}
            className="flex-1 px-4 py-2 bg-cave-gold text-black font-semibold rounded-lg hover:bg-cave-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Form'}
          </button>
        </div>
      </div>
    </div>
  )
}