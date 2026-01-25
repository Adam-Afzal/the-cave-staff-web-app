// src/pages/staff/OnboardingFormBuilderPage.tsx
// UPDATED: Added net_worth field to Financial section
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus,
  GripVertical,
  Trash2,
  Settings
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { FormSettings } from '../components/onboarding/FormSettings'
import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core'
import { 
  arrayMove, 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable 
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface OnboardingForm {
  id: string
  title: string
  description: string | null
  slug: string
  is_active: boolean
}

interface OnboardingQuestion {
  id: string
  form_id: string
  label: string
  field_name: string
  field_type: string
  options: string[] | null
  is_required: boolean
  placeholder: string | null
  help_text: string | null
  order_index: number
}

// Available field definitions
const AVAILABLE_FIELDS = {
  basic: {
    label: 'Basic Info',
    fields: [
      { name: 'first_name', label: 'First Name', type: 'text', required: true },
      { name: 'last_name', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'phone' },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
    ]
  },
  location: {
    label: 'Location',
    fields: [
      { name: 'city', label: 'City', type: 'text' },
      { name: 'country', label: 'Country', type: 'text' },
      { 
        name: 'region', 
        label: 'Region', 
        type: 'multiselect'
        // Options removed - set them in the editor
      },
      { name: 'timezone', label: 'Timezone', type: 'text' },
    ]
  },
  business: {
    label: 'Business',
    fields: [
      { 
        name: 'business_arena', 
        label: 'Business Arena', 
        type: 'multiselect',
        options: ['Tech', 'Real Estate', 'Finance', 'E-commerce', 'Consulting', 'Healthcare', 'Other']
      },
      { name: 'professional_background', label: 'Professional Background', type: 'textarea' },
      { 
        name: 'annual_revenue_band', 
        label: 'Annual Revenue Band', 
        type: 'select',
        options: ['$0-100k', '$100k-500k', '$500k-1M', '$1M-5M', '$5M-10M', '$10M+']
      },
      { name: 'year_of_first_business', label: 'Year of First Business', type: 'number' },
    ]
  },
  financial: {
    label: 'Financial',
    fields: [
      { 
        name: 'net_worth_band', 
        label: 'Net Worth Band', 
        type: 'select',
        options: ['$0-100k', '$100k-500k', '$500k-1M', '$1M-5M', '$5M-10M', '$10M+']
      },
      { 
        name: 'net_worth',
        label: 'Net Worth (USD)',
        type: 'number'
      },
      { name: 'investment_interests', label: 'Investment Interests', type: 'textarea' },
    ]
  },
  priorities: {
    label: 'Priorities & Goals',
    fields: [
      { name: 'first_priority', label: 'First Priority', type: 'textarea' },
      { name: 'second_priority', label: 'Second Priority', type: 'textarea' },
      { name: 'bottlenecks', label: 'Current Bottlenecks', type: 'textarea' },
      { name: 'twelve_month_success', label: '12-Month Success Vision', type: 'textarea' },
    ]
  },
  profile: {
    label: 'Member Profile',
    fields: [
      { name: 'outside_business', label: 'Outside Business Interests', type: 'textarea' },
      { name: 'support', label: 'How Can We Support You', type: 'textarea' },
      { name: 'side_assets', label: 'Side Assets', type: 'textarea' },
      { name: 'hidden_talents', label: 'Hidden Talents', type: 'textarea' },
      { name: 'offer_summary', label: 'What You Offer', type: 'textarea' },
      { name: 'referral_prospects', label: 'Referral Prospects', type: 'textarea' },
      { name: 'own_description', label: 'Describe Yourself', type: 'textarea' },
    ]
  },
  interests: {
    label: 'Interests',
    fields: [
      { 
        name: 'topics', 
        label: 'Topics of Interest', 
        type: 'multiselect',
        options: ['AI/ML', 'Crypto', 'Real Estate', 'SaaS', 'E-commerce', 'Marketing', 'Sales']
      },
      { 
        name: 'focus', 
        label: 'Focus Areas', 
        type: 'multiselect',
        options: ['Growth', 'Exit', 'Fundraising', 'Operations', 'Team Building']
      },
      { 
        name: 'languages', 
        label: 'Languages', 
        type: 'multiselect',
        options: ['English', 'Spanish', 'French', 'German', 'Arabic', 'Mandarin', 'Other']
      },
      { name: 'youtube_topics', label: 'YouTube Topics', type: 'textarea' },
      { name: 'weekly_calls_interest', label: 'Weekly Calls Interest', type: 'textarea' },
      { name: 'board_room', label: 'Board Room Participation', type: 'textarea' },
    ]
  },
  social: {
    label: 'Social',
    fields: [
      { name: 'telegram_username', label: 'Telegram Username', type: 'text' },
    ]
  }
}

// Flatten available fields for easy lookup
const AVAILABLE_FIELDS_FLAT = Object.values(AVAILABLE_FIELDS).flatMap(cat => cat.fields)

export function OnboardingFormBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<OnboardingQuestion | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false)

  // Fetch form
  const { data: form } = useQuery({
    queryKey: ['onboarding-form', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_forms')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as OnboardingForm
    }
  })

  // Fetch questions
  const { data: fetchedQuestions, isLoading } = useQuery({
    queryKey: ['onboarding-questions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_questions')
        .select('*')
        .eq('form_id', id)
        .order('order_index', { ascending: true })

      if (error) throw error
      return data as OnboardingQuestion[]
    }
  })

  useEffect(() => {
    if (fetchedQuestions) {
      setQuestions(fetchedQuestions)
    }
  }, [fetchedQuestions])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete all existing questions
      await supabase
        .from('onboarding_questions')
        .delete()
        .eq('form_id', id)

      // Define standard field names (not custom)
      const standardFields = new Set([
        'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
        'city', 'country', 'region', 'timezone', 'business_arena',
        'professional_background', 'languages', 'topics', 'focus',
        'net_worth_band', 'net_worth', 'annual_revenue_band', 'investment_interests',
        'year_of_first_business', 'first_priority', 'second_priority',
        'bottlenecks', 'outside_business', 'support', 'side_assets',
        'hidden_talents', 'offer_summary', 'referral_prospects',
        'twelve_month_success', 'own_description', 'youtube_topics',
        'weekly_calls_interest', 'board_room', 'telegram_username'
      ])

      // Insert new questions
      const { error } = await supabase
        .from('onboarding_questions')
        .insert(
          questions.map((q, index) => ({
            form_id: id,
            label: q.label,
            field_name: q.field_name,
            field_type: q.field_type,
            options: q.options,
            is_required: q.is_required,
            placeholder: q.placeholder,
            help_text: q.help_text,
            order_index: index,
            is_custom_field: !standardFields.has(q.field_name)
          }))
        )

      if (error) throw error
    },
    onSuccess: () => {
      setHasChanges(false)
      queryClient.invalidateQueries({ queryKey: ['onboarding-questions', id] })
    }
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
      setHasChanges(true)
    }
  }

  const addField = (fieldDef: any) => {
    const newQuestion: OnboardingQuestion = {
      id: `temp-${Date.now()}`,
      form_id: id!,
      label: fieldDef.label,
      field_name: fieldDef.name,
      field_type: fieldDef.type,
      options: fieldDef.options || null,
      is_required: fieldDef.required || false,
      placeholder: null,
      help_text: null,
      order_index: questions.length
    }
    setQuestions([...questions, newQuestion])
    setHasChanges(true)
  }

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId))
    setHasChanges(true)
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(null)
    }
  }

  const updateQuestion = (questionId: string, updates: Partial<OnboardingQuestion>) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ))
    setHasChanges(true)
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion({ ...selectedQuestion, ...updates })
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#0A0C0F]">
      <div className="text-gold">Loading...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-[#0A0C0F]">
      {/* Back Button */}
      <div className="border-b border-[#1A1F26] bg-[#0D0F12] px-6 py-4">
        <button
          onClick={() => navigate('/staff/onboarding-forms')}
          className="flex items-center gap-2 text-[#6B7A94] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Forms</span>
        </button>
      </div>

      {/* Editable Form Settings */}
      {form && <FormSettings form={form} />}

      {/* Action Buttons */}
      <div className="border-b border-[#1A1F26] bg-[#0D0F12]">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            {hasChanges && (
              <span className="text-sm text-yellow-500">Unsaved changes</span>
            )}
            <button
              onClick={() => setShowCustomFieldModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Custom Field
            </button>
            <button
              onClick={() => window.open(`/onboarding/${form?.slug}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1F26] text-white border border-[#2A2F36] rounded-lg hover:border-cave-gold/30 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!hasChanges || saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-cave-gold text-black font-semibold rounded-lg hover:bg-cave-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Available Fields */}
        <div className="w-80 border-r border-[#1A1F26] bg-[#0D0F12] overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-white mb-4">Available Fields</h2>
            
            {Object.entries(AVAILABLE_FIELDS).map(([key, category]) => (
              <div key={key} className="mb-6">
                <h3 className="text-xs font-medium text-[#6B7A94] uppercase tracking-wider mb-2">
                  {category.label}
                </h3>
                <div className="space-y-2">
                  {category.fields.map((field) => (
                    <button
                      key={field.name}
                      onClick={() => addField(field)}
                      disabled={questions.some(q => q.field_name === field.name)}
                      className="w-full text-left px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white text-sm hover:border-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group cursor-pointer"
                    >
                      <span>{field.label}</span>
                      <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Form Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-2">Form Questions</h2>
              <p className="text-sm text-[#6B7A94]">
                Drag fields from the left sidebar. Reorder by dragging the handle.
              </p>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-[#1A1F26] rounded-xl">
                <Plus className="w-12 h-12 text-[#6B7A94] mx-auto mb-4" />
                <p className="text-[#6B7A94]">No questions yet. Add fields from the sidebar.</p>
              </div>
            ) : (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {questions.map((question) => (
                      <SortableQuestionItem
                        key={question.id}
                        question={question}
                        isSelected={selectedQuestion?.id === question.id}
                        onSelect={() => setSelectedQuestion(question)}
                        onDelete={() => deleteQuestion(question.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Right Sidebar - Question Editor */}
        {selectedQuestion && (
          <div className="w-96 border-l border-[#1A1F26] bg-[#0D0F12] overflow-y-auto">
            <QuestionEditor
              question={selectedQuestion}
              onUpdate={(updates) => updateQuestion(selectedQuestion.id, updates)}
              onClose={() => setSelectedQuestion(null)}
            />
          </div>
        )}
      </div>

      {/* Custom Field Modal */}
      {showCustomFieldModal && (
        <CustomFieldModal
          onClose={() => setShowCustomFieldModal(false)}
          onAdd={(customField) => {
            const newQuestion: OnboardingQuestion = {
              id: `temp-${Date.now()}`,
              form_id: id!,
              label: customField.label,
              field_name: customField.field_key,
              field_type: customField.field_type,
              options: customField.options || null,
              is_required: false,
              placeholder: null,
              help_text: null,
              order_index: questions.length
            }
            setQuestions([...questions, newQuestion])
            setHasChanges(true)
            setShowCustomFieldModal(false)
          }}
        />
      )}
    </div>
  )
}

// Sortable Question Item
interface SortableQuestionItemProps {
  question: OnboardingQuestion
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

function SortableQuestionItem({ question, isSelected, onSelect, onDelete }: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-4 bg-[#1A1F26] border rounded-lg transition-all ${
        isSelected ? 'border-gold' : 'border-[#2A2F36] hover:border-gold/30'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#6B7A94] hover:text-white"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Question Info */}
      <div className="flex-1 min-w-0" onClick={onSelect}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white">{question.label}</span>
          {question.is_required && (
            <span className="text-xs text-red-400">*</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6B7A94]">
          <span className={`px-2 py-0.5 rounded ${
            !AVAILABLE_FIELDS_FLAT.find(f => f.name === question.field_name)
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              : 'bg-[#0D0F12]'
          }`}>
            {!AVAILABLE_FIELDS_FLAT.find(f => f.name === question.field_name) && '✨ '}
            {question.field_type}
          </span>
          <span>→</span>
          <span className="font-mono">{question.field_name}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onSelect}
          className="p-1.5 hover:bg-[#2A2F36] rounded transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  )
}

// Question Editor Panel
interface QuestionEditorProps {
  question: OnboardingQuestion
  onUpdate: (updates: Partial<OnboardingQuestion>) => void
  onClose: () => void
}

function QuestionEditor({ question, onUpdate, onClose }: QuestionEditorProps) {
  const [optionsText, setOptionsText] = useState(
    question.options?.join('\n') || ''
  )

  // FIX: Reset optionsText when switching questions
  useEffect(() => {
    setOptionsText(question.options?.join('\n') || '')
  }, [question.id])

  const handleOptionsChange = (text: string) => {
    setOptionsText(text)
    const options = text.split('\n').map(o => o.trim()).filter(Boolean)
    onUpdate({ options: options.length > 0 ? options : null })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Edit Question</h3>
        <button onClick={onClose} className="text-[#6B7A94] hover:text-white">
          ×
        </button>
      </div>

      <div className="space-y-4">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Question Label *
          </label>
          <input
            type="text"
            value={question.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-gold"
          />
        </div>

        {/* Field Name (read-only) */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Database Field
          </label>
          <input
            type="text"
            value={question.field_name}
            disabled
            className="w-full px-3 py-2 bg-[#0D0F12] border border-[#2A2F36] rounded-lg text-[#6B7A94] font-mono text-sm cursor-not-allowed"
          />
        </div>

        {/* Placeholder */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Placeholder Text
          </label>
          <input
            type="text"
            value={question.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value || null })}
            className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-gold"
            placeholder="Enter placeholder..."
          />
        </div>

        {/* Help Text */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Help Text
          </label>
          <textarea
            value={question.help_text || ''}
            onChange={(e) => onUpdate({ help_text: e.target.value || null })}
            className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-gold resize-none"
            placeholder="Additional context for the user..."
            rows={3}
          />
        </div>

        {/* Options (for select/multiselect) */}
        {(question.field_type === 'select' || question.field_type === 'multiselect') && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Options (one per line)
            </label>
            <textarea
              value={optionsText}
              onChange={(e) => handleOptionsChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-gold resize-none font-mono text-sm"
              rows={6}
            />
          </div>
        )}

        {/* Required Toggle */}
        <div className="flex items-center justify-between p-3 bg-[#1A1F26] border border-[#2A2F36] rounded-lg">
          <span className="text-sm text-white">Required Field</span>
          <button
            onClick={() => onUpdate({ is_required: !question.is_required })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              question.is_required ? 'bg-gold' : 'bg-[#2A2F36]'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                question.is_required ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

// Custom Field Modal Component
interface CustomFieldModalProps {
  onClose: () => void
  onAdd: (field: {
    label: string
    field_key: string
    field_type: string
    options?: string[]
  }) => void
}

function CustomFieldModal({ onClose, onAdd }: CustomFieldModalProps) {
  const [label, setLabel] = useState('')
  const [fieldKey, setFieldKey] = useState('')
  const [fieldType, setFieldType] = useState<string>('text')
  const [options, setOptions] = useState('')

  const generateFieldKey = () => {
    const generated = label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)
    setFieldKey(generated)
  }

  const handleAdd = () => {
    if (!label || !fieldKey) return

    const fieldData: any = {
      label,
      field_key: fieldKey,
      field_type: fieldType
    }

    if (fieldType === 'select' || fieldType === 'multiselect') {
      const optionArray = options.split('\n').map(o => o.trim()).filter(Boolean)
      if (optionArray.length > 0) {
        fieldData.options = optionArray
      }
    }

    onAdd(fieldData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0D0F12] border border-[#1A1F26] rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Create Custom Field</h2>
            <p className="text-sm text-[#6B7A94] mt-1">
              Add a custom question not in the standard fields
            </p>
          </div>
          <button onClick={onClose} className="text-[#6B7A94] hover:text-white text-2xl">
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Question Label */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Question Label *
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-gold"
              placeholder="How did you hear about us?"
              autoFocus
            />
            <p className="text-xs text-[#6B7A94] mt-1">
              This is what users will see
            </p>
          </div>

          {/* Field Key */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Field Key *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fieldKey}
                onChange={(e) => setFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="flex-1 px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-gold font-mono text-sm"
                placeholder="how_heard_about_us"
              />
              <button
                onClick={generateFieldKey}
                disabled={!label}
                className="px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-[#6B7A94] hover:text-white hover:border-gold/30 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-[#6B7A94] mt-1">
              Database identifier (lowercase, underscores only)
            </p>
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Field Type *
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-gold"
            >
              <option value="text">Short Text</option>
              <option value="textarea">Long Text (Textarea)</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Dropdown (Single Select)</option>
              <option value="multiselect">Multiple Choice (Multi-select)</option>
            </select>
          </div>

          {/* Options (for select/multiselect) */}
          {(fieldType === 'select' || fieldType === 'multiselect') && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Options (one per line) *
              </label>
              <textarea
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-gold resize-none font-mono text-sm"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                rows={6}
              />
              <p className="text-xs text-[#6B7A94] mt-1">
                Enter each option on a new line
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-400 text-xs">i</span>
              </div>
              <div className="text-xs text-purple-300">
                Custom fields are stored separately and can be used for AI search and analytics. 
                They won't appear in the main member profile tables.
              </div>
            </div>
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
            onClick={handleAdd}
            disabled={!label || !fieldKey || (fieldType === 'select' && !options) || (fieldType === 'multiselect' && !options)}
            className="flex-1 px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Add Field
          </button>
        </div>
      </div>
    </div>
  )
}