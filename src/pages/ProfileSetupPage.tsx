// src/pages/ProfileSetupPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Loader2, RefreshCw } from 'lucide-react'
import { useCurrentStaffProfile, useUpdateStaffProfile, useSyncTelegramAvatar } from '../hooks/useStaffProfile'
import { cn } from '../lib/utils'
import caveLogo from '../assets/cavelogo.jpg'

export function ProfileSetupPage() {
  const navigate = useNavigate()
  
  const { data: profile, isLoading: profileLoading, refetch } = useCurrentStaffProfile()
  const updateProfile = useUpdateStaffProfile()
  const syncAvatar = useSyncTelegramAvatar()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [intro, setIntro] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with profile data when it loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setIntro(profile.intro || '')
    }
  }, [profile])

  const handleSyncAvatar = async () => {
    if (!profile?.id) return
    try {
      await syncAvatar.mutateAsync(profile.id)
      // Refetch profile to get updated avatar_url
      await refetch()
    } catch (error: any) {
      alert(error.message || 'Failed to sync avatar from Telegram')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!firstName.trim() || !lastName.trim()) {
      alert('Please enter your name')
      return
    }

    setIsSubmitting(true)

    try {
      await updateProfile.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        intro: intro.trim(),
        onboarding_completed: true,
      })

      // Navigate after successful update
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-cave-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cave-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Display telegram identifier (username or ID)
  const telegramDisplay = profile?.telegram_username 
    ? `@${profile.telegram_username}`
    : profile?.telegram_id
      ? `ID: ${profile.telegram_id}`
      : null
  
  const hasTelegram = !!(profile?.telegram_username || profile?.telegram_id)

  return (
    <div className="min-h-screen bg-cave-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={caveLogo} alt="The Cave" className="w-12 h-12 rounded-xl mx-auto mb-4 object-cover" />
          <h1 className="text-2xl font-bold text-cave-text-primary mb-2">
            Welcome to The Cave
          </h1>
          <p className="text-cave-text-secondary">
            Let's set up your profile so your team knows who you are
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-cave-bg-secondary rounded-xl border border-cave-border p-6 space-y-6">
          {/* Avatar Display (from Telegram) */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cave-border">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-cave-bg-elevated flex items-center justify-center">
                  <User className="w-10 h-10 text-cave-text-secondary" />
                </div>
              )}
            </div>
            
            {hasTelegram ? (
              <div className="mt-3 text-center">
                <p className="text-xs text-cave-text-secondary mb-2">
                  Synced from {telegramDisplay}
                </p>
                <button
                  type="button"
                  onClick={handleSyncAvatar}
                  disabled={syncAvatar.isPending}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
                    "bg-cave-bg-elevated border border-cave-border text-cave-text-secondary",
                    "hover:border-cave-gold hover:text-cave-text-primary transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <RefreshCw className={cn("w-4 h-4", syncAvatar.isPending && "animate-spin")} />
                  {syncAvatar.isPending ? 'Syncing...' : 'Sync from Telegram'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-cave-text-secondary mt-2">
                No Telegram account linked
              </p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cave-text-primary mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-2.5 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-secondary focus:outline-none focus:border-cave-gold"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cave-text-primary mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-2.5 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-secondary focus:outline-none focus:border-cave-gold"
                required
              />
            </div>
          </div>

          {/* Intro */}
          <div>
            <label className="block text-sm font-medium text-cave-text-primary mb-1.5">
              Introduction
            </label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="Tell us a bit about yourself and your role..."
              rows={4}
              className="w-full px-4 py-2.5 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-secondary focus:outline-none focus:border-cave-gold resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-3 rounded-lg font-semibold transition-colors",
              "bg-cave-gold text-cave-bg-primary hover:bg-cave-gold/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Setup'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}