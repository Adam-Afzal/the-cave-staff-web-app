// src/pages/OnboardingFormPage.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CheckCircle, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface OnboardingForm {
  id: string
  title: string
  description: string | null
  slug: string
}

interface OnboardingQuestion {
  id: string
  label: string
  field_name: string
  field_type: string
  options: string[] | null
  is_required: boolean
  placeholder: string | null
  help_text: string | null
  order_index: number
  is_custom_field: boolean
}

export function OnboardingFormPage() {
  const { slug } = useParams<{ slug: string }>()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  // Fetch form and questions
  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ['public-form', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_forms')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data as OnboardingForm
    }
  })

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['public-questions', form?.id],
    enabled: !!form?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_questions')
        .select('*')
        .eq('form_id', form!.id)
        .order('order_index', { ascending: true })

      if (error) throw error
      return data as OnboardingQuestion[]
    }
  })

  // Submit form
  const submitMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      const newErrors: Record<string, string> = {}
      questions?.forEach(q => {
        if (q.is_required && !formData[q.field_name]) {
          newErrors[q.field_name] = 'This field is required'
        }
      })

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        throw new Error('Please fill in all required fields')
      }

      // Create submission
      const { data: submission, error: submissionError } = await supabase
        .from('onboarding_submissions')
        .insert({
          form_id: form!.id,
          email: formData.email || '',
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          status: 'pending'
        })
        .select()
        .single()

      if (submissionError) throw submissionError

      // Create answers
      const answers = Object.entries(formData).map(([field_name, value]) => {
        const question = questions?.find(q => q.field_name === field_name)
        return {
          submission_id: submission.id,
          question_id: question?.id || null,
          field_name,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value)
        }
      })

      const { error: answersError } = await supabase
        .from('onboarding_answers')
        .insert(answers)

      if (answersError) throw answersError

      // Process submission (create member)
      const { data: result } = await supabase.rpc(
        'process_onboarding_submission',
        { submission_uuid: submission.id }
      )

      console.log('Processing result:', result)
      return submission
    },
    onSuccess: () => {
      setSubmitted(true)
    }
  })

  const handleChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMutation.mutate()
  }

  if (formLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center">
        <Loader className="w-8 h-8 text-cave-gold animate-spin" />
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Form Not Found</h1>
          <p className="text-[#6B7A94]">This form doesn't exist or is not active.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
          <p className="text-[#6B7A94] mb-6">
            Your submission has been received. We'll be in touch soon.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-cave-gold text-black font-semibold rounded-lg hover:bg-cave-gold-dark transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0C0F] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-[#6B7A94]">{form.description}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#0D0F12] border border-[#1A1F26] rounded-xl p-8">
          <div className="space-y-6">
            {questions?.map((question) => (
              <div key={question.id}>
                <label className="block text-sm font-medium text-white mb-2">
                  {question.label}
                  {question.is_required && <span className="text-red-400 ml-1">*</span>}
                </label>

                {question.help_text && (
                  <p className="text-xs text-[#6B7A94] mb-2">{question.help_text}</p>
                )}

                {/* Render input based on field type */}
                {question.field_type === 'text' && (
                  <input
                    type="text"
                    value={formData[question.field_name] || ''}
                    onChange={(e) => handleChange(question.field_name, e.target.value)}
                    placeholder={question.placeholder || ''}
                    className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-cave-gold"
                  />
                )}

                {question.field_type === 'textarea' && (
                  <textarea
                    value={formData[question.field_name] || ''}
                    onChange={(e) => handleChange(question.field_name, e.target.value)}
                    placeholder={question.placeholder || ''}
                    rows={4}
                    className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-cave-gold resize-none"
                  />
                )}

                {question.field_type === 'email' && (
                  <input
                    type="email"
                    value={formData[question.field_name] || ''}
                    onChange={(e) => handleChange(question.field_name, e.target.value)}
                    placeholder={question.placeholder || ''}
                    className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-cave-gold"
                  />
                )}

                {question.field_type === 'phone' && (
                  <input
                    type="tel"
                    value={formData[question.field_name] || ''}
                    onChange={(e) => handleChange(question.field_name, e.target.value)}
                    placeholder={question.placeholder || ''}
                    className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-cave-gold"
                  />
                )}

                {question.field_type === 'number' && (
                  <input
                    type="number"
                    value={formData[question.field_name] || ''}
                    onChange={(e) => handleChange(question.field_name, e.target.value)}
                    placeholder={question.placeholder || ''}
                    className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-cave-gold"
                  />
                )}

                {question.field_type === 'date' && (
                  <input
                    type="date"
                    value={formData[question.field_name] || ''}
                    onChange={(e) => handleChange(question.field_name, e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-cave-gold"
                  />
                )}

                {question.field_type === 'select' && (
                  <select
                    value={formData[question.field_name] || ''}
                    onChange={(e) => handleChange(question.field_name, e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2A2F36] rounded-lg text-white focus:outline-none focus:border-cave-gold"
                  >
                    <option value="">Select an option</option>
                    {question.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {question.field_type === 'multiselect' && (
                  <div className="space-y-2">
                    {question.options?.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={(formData[question.field_name] || []).includes(option)}
                          onChange={(e) => {
                            const current = formData[question.field_name] || []
                            const updated = e.target.checked
                              ? [...current, option]
                              : current.filter((v: string) => v !== option)
                            handleChange(question.field_name, updated)
                          }}
                          className="w-4 h-4 rounded border-[#2A2F36] bg-[#1A1F26] text-cave-gold focus:ring-cave-gold"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {errors[question.field_name] && (
                  <p className="text-xs text-red-400 mt-1">{errors[question.field_name]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full px-6 py-3 bg-cave-gold text-black font-semibold rounded-lg hover:bg-cave-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>

          {submitMutation.isError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">
                {submitMutation.error?.message || 'An error occurred. Please try again.'}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}