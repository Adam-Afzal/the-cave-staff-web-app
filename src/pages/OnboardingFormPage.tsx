// src/pages/OnboardingFormPage.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CheckCircle, Loader, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface OnboardingForm {
  id: string
  title: string
  description: string | null
  slug: string
  redirect_url: string | null
  thank_you_message: string | null
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
  const [processingError, setProcessingError] = useState<string | null>(null)

  // Fetch form and questions
  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ['public-form', slug],
    queryFn: async () => {
      console.log('[Onboarding] Fetching form:', slug)
      const { data, error } = await supabase
        .from('onboarding_forms')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('[Onboarding] Error fetching form:', error)
        throw error
      }
      console.log('[Onboarding] Form loaded:', data)
      return data as OnboardingForm
    }
  })

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['public-questions', form?.id],
    enabled: !!form?.id,
    queryFn: async () => {
      console.log('[Onboarding] Fetching questions for form:', form!.id)
      const { data, error } = await supabase
        .from('onboarding_questions')
        .select('*')
        .eq('form_id', form!.id)
        .order('order_index', { ascending: true })

      if (error) {
        console.error('[Onboarding] Error fetching questions:', error)
        throw error
      }
      console.log('[Onboarding] Questions loaded:', data.length)
      return data as OnboardingQuestion[]
    }
  })

  // Handle redirect after submission
  useEffect(() => {
    if (submitted && form?.redirect_url) {
      console.log('[Onboarding] Redirecting to:', form.redirect_url)
      const timer = setTimeout(() => {
        window.location.href = form.redirect_url!
      }, 2000) // Wait 2 seconds to show thank you message
      
      return () => clearTimeout(timer)
    }
  }, [submitted, form?.redirect_url])

  // Submit form
  const submitMutation = useMutation({
    mutationFn: async () => {
      console.log('[Onboarding] Starting submission...')
      console.log('[Onboarding] Form data:', formData)
      
      // Validate required fields
      const newErrors: Record<string, string> = {}
      questions?.forEach(q => {
        if (q.is_required && !formData[q.field_name]) {
          newErrors[q.field_name] = 'This field is required'
        }
      })

      if (Object.keys(newErrors).length > 0) {
        console.error('[Onboarding] Validation errors:', newErrors)
        setErrors(newErrors)
        throw new Error('Please fill in all required fields')
      }

      // Create submission
      console.log('[Onboarding] Creating submission record...')
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

      if (submissionError) {
        console.error('[Onboarding] Submission creation error:', submissionError)
        throw submissionError
      }
      console.log('[Onboarding] Submission created:', submission.id)

      // Create answers
      console.log('[Onboarding] Creating answers...')
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

      if (answersError) {
        console.error('[Onboarding] Answers creation error:', answersError)
        throw answersError
      }
      console.log('[Onboarding] Answers created:', answers.length)

      // Process submission (create member)
      console.log('[Onboarding] Calling process_onboarding_submission...')
      try {
        const { data: result, error: rpcError } = await supabase.rpc(
          'process_onboarding_submission',
          { submission_uuid: submission.id }
        )

        if (rpcError) {
          console.error('[Onboarding] RPC error:', rpcError)
          setProcessingError(`Processing error: ${rpcError.message}`)
          throw rpcError
        }

        console.log('[Onboarding] Processing result:', result)
        
        if (!result || !result.success) {
          const errorMsg = result?.error || 'Unknown processing error'
          console.error('[Onboarding] Processing failed:', errorMsg)
          setProcessingError(errorMsg)
          throw new Error(errorMsg)
        }
        
        console.log('[Onboarding] ✅ Member created successfully:', result.member_id)
        
        // Send Zapier webhook notification with ALL data
        try {
          console.log('[Onboarding] Sending Zapier notification...')
          const zapierWebhookUrl = import.meta.env.VITE_ZAPIER_WEBHOOK_URL
          
          if (zapierWebhookUrl) {
            // Helper function to convert arrays to comma-separated strings
            const arrayToString = (value: any) => {
              if (Array.isArray(value)) return value.join(', ')
              return value || ''
            }
            
            // Send ALL form data as form data so Zapier can parse individual fields
            const formPayload = new URLSearchParams({
              // Generated/System fields
              member_id: result.member_id || '',
              submission_id: submission.id,
              form_slug: slug || '',
              timestamp: new Date().toISOString(),
              join_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
              renewal_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
              
              // Basic Info
              first_name: formData.first_name || '',
              last_name: formData.last_name || '',
              email: formData.email || '',
              phone: formData.phone || '',
              date_of_birth: formData.date_of_birth || '',
              
              // Location
              city: formData.city || '',
              country: formData.country || '',
              region: arrayToString(formData.region),
              timezone: formData.timezone || '',
              
              // Business/Professional
              business_arena: arrayToString(formData.business_arena),
              professional_background: formData.professional_background || '',
              languages: arrayToString(formData.languages),
              topics: arrayToString(formData.topics),
              focus: arrayToString(formData.focus),
              
              // Financial
              net_worth_band: formData.net_worth_band || '',
              annual_revenue_band: formData.annual_revenue_band || '',
              investment_interests: formData.investment_interests || '',
              year_of_first_business: formData.year_of_first_business || '',
              
              // Profile Questions
              first_priority: formData.first_priority || '',
              second_priority: formData.second_priority || '',
              bottlenecks: formData.bottlenecks || '',
              outside_business: formData.outside_business || '',
              support: formData.support || '',
              side_assets: formData.side_assets || '',
              hidden_talents: formData.hidden_talents || '',
              offer_summary: formData.offer_summary || '',
              referral_prospects: formData.referral_prospects || '',
              twelve_month_success: formData.twelve_month_success || '',
              own_description: formData.own_description || '',
              youtube_topics: formData.youtube_topics || '',
              weekly_calls_interest: formData.weekly_calls_interest || '',
              board_room: formData.board_room || '',
              
              // Telegram
              telegram_username: formData.telegram_username || '',

              // Philanthropy
              philanthropy_interest: formData.philanthropy_interest ? 'Yes' : 'No',
              
              // Add any custom fields dynamically
              ...Object.fromEntries(
                Object.entries(formData)
                  .filter(([key]) => ![ // Exclude fields already included above
                    'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
                    'city', 'country', 'region', 'timezone', 'business_arena',
                    'professional_background', 'languages', 'topics', 'focus',
                    'net_worth_band', 'annual_revenue_band', 'investment_interests',
                    'year_of_first_business', 'first_priority', 'second_priority',
                    'bottlenecks', 'outside_business', 'support', 'side_assets',
                    'hidden_talents', 'offer_summary', 'referral_prospects',
                    'twelve_month_success', 'own_description', 'youtube_topics',
                    'weekly_calls_interest', 'board_room', 'telegram_username',
                    'philanthropy_interest'
                  ].includes(key))
                  .map(([key, value]) => [
                    `custom_${key}`,
                    Array.isArray(value) ? value.join(', ') : (value || '')
                  ])
              )
            })
            
            await fetch(zapierWebhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formPayload.toString()
            })
            console.log('[Onboarding] ✅ Zapier notification sent with all fields')
          } else {
            console.log('[Onboarding] ⚠️ Zapier webhook URL not configured')
          }
        } catch (zapierError) {
          // Don't fail the whole submission if Zapier fails
          console.error('[Onboarding] ⚠️ Zapier notification failed:', zapierError)
        }
      } catch (rpcError: any) {
        console.error('[Onboarding] Exception in RPC call:', rpcError)
        setProcessingError(rpcError.message || 'Failed to create member')
        throw rpcError
      }

      return submission
    },
    onSuccess: () => {
      console.log('[Onboarding] ✅ Submission complete!')
      setSubmitted(true)
    },
    onError: (error: any) => {
      console.error('[Onboarding] ❌ Submission failed:', error)
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
    setProcessingError(null)
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
            {form.thank_you_message || "Your submission has been received. We'll be in touch soon."}
          </p>
          {form.redirect_url && (
            <p className="text-sm text-[#6B7A94]">
              Redirecting you in a moment...
            </p>
          )}
          {!form.redirect_url && (
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-cave-gold text-black font-semibold rounded-lg hover:bg-cave-gold-dark transition-colors"
            >
              Back to Home
            </button>
          )}
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

                {question.field_type === 'boolean' && (
                  <input
                    type="checkbox"
                    checked={!!formData[question.field_name]}
                    onChange={(e) => handleChange(question.field_name, e.target.checked)}
                    className="w-5 h-5 rounded border-[#2A2F36] bg-[#1A1F26] text-cave-gold focus:ring-cave-gold cursor-pointer"
                  />
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
              className="w-full px-6 py-3 bg-cave-gold text-black font-semibold rounded-lg hover:bg-cave-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>

          {/* Error Messages */}
          {submitMutation.isError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400 mb-1">
                    Submission Failed
                  </p>
                  <p className="text-xs text-red-400">
                    {submitMutation.error?.message || 'An error occurred. Please try again.'}
                  </p>
                  {processingError && (
                    <p className="text-xs text-red-400 mt-2">
                      Details: {processingError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}