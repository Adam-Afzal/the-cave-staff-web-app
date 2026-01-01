// src/pages/EditProfilePage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Loader2, ArrowLeft, Check, RefreshCw } from 'lucide-react'
import { useCurrentStaffProfile, useUpdateStaffProfile, useSyncTelegramAvatar } from '../hooks/useStaffProfile'
import { cn } from '../lib/utils'

export function EditProfilePage() {
  const navigate = useNavigate()
  
  const { data: profile, isLoading: profileLoading } = useCurrentStaffProfile()
  const updateProfile = useUpdateStaffProfile()
  const syncAvatar = useSyncTelegramAvatar()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [intro, setIntro] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Initialize form with profile data
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
      })

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cave-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-cave-bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-cave-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-cave-text-primary">Edit Profile</h1>
          <p className="text-cave-text-secondary">Update your profile information</p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-cave-status-success/10 border border-cave-status-success/20 flex items-center gap-3">
          <Check className="w-5 h-5 text-cave-status-success" />
          <span className="text-cave-status-success font-medium">Profile updated successfully!</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-cave-bg-secondary rounded-xl border border-cave-border p-6 space-y-6">
        {/* Avatar Display (from Telegram) */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-cave-border">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-cave-bg-elevated flex items-center justify-center">
                <User className="w-8 h-8 text-cave-text-secondary" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-cave-text-primary">Profile Picture</p>
            {profile?.telegram_username ? (
              <>
                <p className="text-xs text-cave-text-secondary mb-2">
                  Synced from @{profile.telegram_username}
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
              </>
            ) : (
              <p className="text-xs text-cave-text-secondary">No Telegram account linked</p>
            )}
          </div>
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

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-cave-text-primary mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={profile?.email || ''}
            disabled
            className="w-full px-4 py-2.5 bg-cave-bg-primary border border-cave-border rounded-lg text-cave-text-secondary cursor-not-allowed"
          />
          <p className="text-xs text-cave-text-secondary mt-1">Email cannot be changed</p>
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
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-lg font-medium text-cave-text-secondary hover:bg-cave-bg-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "px-6 py-2.5 rounded-lg font-semibold transition-colors",
              "bg-cave-gold text-cave-bg-primary hover:bg-cave-gold/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}