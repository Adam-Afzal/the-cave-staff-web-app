// src/pages/StaffManagementPage.tsx
import { useState } from 'react'
import { 
  Users, 
  Plus, 
  X, 
  Eye, 
  EyeOff, 
  Loader2, 
  Key,
  Check,
  User
} from 'lucide-react'
import { useAllStaffProfiles, useCreateStaffUser, useResetStaffPassword, useFetchTelegramAvatar, type StaffProfile } from '../hooks/useStaffProfile'
import { cn } from '../lib/utils'

// Helper to check if a string is a telegram ID (all digits)
function isTelegramId(value: string): boolean {
  return /^\d+$/.test(value.trim())
}

// Helper to format telegram display from profile
function formatTelegramDisplay(profile: StaffProfile): string | null {
  if (profile.telegram_username) {
    return `@${profile.telegram_username}`
  }
  if (profile.telegram_id) {
    return `ID: ${profile.telegram_id}`
  }
  return null
}

export function StaffManagementPage() {
  const { data: staffProfiles, isLoading } = useAllStaffProfiles()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState<StaffProfile | null>(null)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cave-text-primary">Staff Management</h1>
          <p className="text-cave-text-secondary">Create and manage staff accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cave-gold text-cave-bg-primary font-semibold hover:bg-cave-gold/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Staff Member
        </button>
      </div>

      {/* Staff List */}
      <div className="bg-cave-bg-secondary rounded-xl border border-cave-border overflow-hidden">
        <div className="px-5 py-4 border-b border-cave-border">
          <h3 className="text-lg font-semibold text-cave-text-primary flex items-center gap-2">
            <Users className="w-5 h-5 text-cave-gold" />
            Staff Members
            {staffProfiles && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-cave-bg-elevated text-cave-text-secondary">
                {staffProfiles.length}
              </span>
            )}
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cave-gold mx-auto" />
          </div>
        ) : staffProfiles?.length === 0 ? (
          <div className="p-8 text-center text-cave-text-secondary">
            No staff members yet. Click "Add Staff Member" to create one.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-cave-bg-elevated">
                <th className="px-4 py-3 text-left text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-cave-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cave-border">
              {staffProfiles?.map((staff) => (
                <tr key={staff.id} className="hover:bg-cave-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-cave-bg-elevated flex items-center justify-center">
                        {staff.avatar_url ? (
                          <img src={staff.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-cave-text-secondary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-cave-text-primary">
                          {staff.first_name || staff.last_name 
                            ? `${staff.first_name || ''} ${staff.last_name || ''}`.trim()
                            : 'Unnamed'}
                        </p>
                        {staff.telegram_username || staff.telegram_id ? (
                          <p className="text-xs text-cave-text-secondary">
                            {formatTelegramDisplay(staff)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-cave-text-secondary">
                    {staff.email}
                  </td>
                  <td className="px-4 py-3">
                    {staff.onboarding_completed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-cave-status-success/10 text-cave-status-success">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cave-gold/10 text-cave-gold">
                        Pending Setup
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-cave-text-secondary text-sm">
                    {new Date(staff.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setShowResetModal(staff)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-cave-text-secondary hover:bg-cave-bg-elevated transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <CreateStaffModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <ResetPasswordModal 
          staff={showResetModal} 
          onClose={() => setShowResetModal(null)} 
        />
      )}
    </div>
  )
}

// Create Staff Modal
function CreateStaffModal({ onClose }: { onClose: () => void }) {
  const createStaff = useCreateStaffUser()
  const fetchTelegramAvatar = useFetchTelegramAvatar()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [telegramInput, setTelegramInput] = useState('')
  const [telegramAvatarPreview, setTelegramAvatarPreview] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [fetchingAvatar, setFetchingAvatar] = useState(false)

  // Determine if input is telegram ID or username
  const isIdInput = isTelegramId(telegramInput)

  const handleTelegramLookup = async () => {
    if (!telegramInput.trim()) return
    
    setFetchingAvatar(true)
    setError('')
    
    try {
      // Pass either username or telegram_id based on input type
      const params = isIdInput 
        ? { telegram_id: parseInt(telegramInput.trim(), 10) }
        : { username: telegramInput.trim() }
      
      const result = await fetchTelegramAvatar.mutateAsync(params)
      setTelegramAvatarPreview(result.photo_data_url)
      
      // Auto-fill name if empty
      if (!firstName && result.first_name) setFirstName(result.first_name)
      if (!lastName && result.last_name) setLastName(result.last_name)
    } catch (err: any) {
      setError(err.message || 'Could not find Telegram user')
      setTelegramAvatarPreview(null)
    } finally {
      setFetchingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !firstName || !lastName) {
      setError('All fields are required')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      // Determine if it's a telegram ID or username
      const isId = isTelegramId(telegramInput)
      
      await createStaff.mutateAsync({ 
        email, 
        password, 
        firstName, 
        lastName,
        telegramUsername: !isId && telegramInput.trim() ? telegramInput.trim() : undefined,
        telegramId: isId ? parseInt(telegramInput.trim(), 10) : undefined
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create staff user')
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-cave-bg-secondary rounded-xl border border-cave-border w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-cave-border flex items-center justify-between sticky top-0 bg-cave-bg-secondary">
            <h2 className="text-lg font-semibold text-cave-text-primary">Add Staff Member</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-cave-bg-elevated transition-colors">
              <X className="w-5 h-5 text-cave-text-secondary" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-cave-status-error/10 text-cave-status-error text-sm">
                {error}
              </div>
            )}

            {/* Telegram Username/ID with Avatar Preview */}
            <div>
              <label className="block text-sm font-medium text-cave-text-primary mb-1.5">
                Telegram <span className="text-cave-text-secondary font-normal">(username or ID)</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={telegramInput}
                    onChange={(e) => {
                      // Remove @ if user types it
                      setTelegramInput(e.target.value.replace('@', ''))
                      setTelegramAvatarPreview(null)
                    }}
                    placeholder="username or 1234567890"
                    className="w-full px-4 py-2.5 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-secondary focus:outline-none focus:border-cave-gold"
                  />
                  {telegramInput && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cave-text-secondary">
                      {isIdInput ? 'ID' : 'username'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleTelegramLookup}
                  disabled={!telegramInput.trim() || fetchingAvatar}
                  className={cn(
                    "px-4 py-2.5 rounded-lg font-medium transition-colors",
                    "bg-cave-bg-elevated border border-cave-border text-cave-text-primary",
                    "hover:border-cave-gold disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {fetchingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lookup'}
                </button>
              </div>
              <p className="text-xs text-cave-text-secondary mt-1">
                Enter @username or numeric Telegram ID
              </p>
              {telegramAvatarPreview && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-cave-bg-elevated">
                  <img 
                    src={telegramAvatarPreview} 
                    alt="Telegram avatar" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm text-cave-text-primary font-medium">Avatar found!</p>
                    <p className="text-xs text-cave-text-secondary">Will be used as profile picture</p>
                  </div>
                </div>
              )}
            </div>

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
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cave-text-primary mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-secondary focus:outline-none focus:border-cave-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cave-text-primary mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-secondary focus:outline-none focus:border-cave-gold pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cave-text-secondary hover:text-cave-text-primary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-cave-text-secondary mt-1">Minimum 8 characters</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg font-medium text-cave-text-secondary hover:bg-cave-bg-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createStaff.isPending}
                className={cn(
                  "px-6 py-2.5 rounded-lg font-semibold transition-colors",
                  "bg-cave-gold text-cave-bg-primary hover:bg-cave-gold/90",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2"
                )}
              >
                {createStaff.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Staff Member'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

// Reset Password Modal
function ResetPasswordModal({ staff, onClose }: { staff: StaffProfile; onClose: () => void }) {
  const resetPassword = useResetStaffPassword()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      await resetPassword.mutateAsync({ authUserId: staff.auth_user_id, newPassword: password })
      setSuccess(true)
      setTimeout(onClose, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-cave-bg-secondary rounded-xl border border-cave-border w-full max-w-md shadow-xl">
          <div className="px-6 py-4 border-b border-cave-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-cave-text-primary">Reset Password</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-cave-bg-elevated transition-colors">
              <X className="w-5 h-5 text-cave-text-secondary" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {success ? (
              <div className="p-4 rounded-lg bg-cave-status-success/10 text-cave-status-success text-center">
                <Check className="w-8 h-8 mx-auto mb-2" />
                Password reset successfully!
              </div>
            ) : (
              <>
                {error && (
                  <div className="p-3 rounded-lg bg-cave-status-error/10 text-cave-status-error text-sm">
                    {error}
                  </div>
                )}

                <p className="text-cave-text-secondary">
                  Reset password for <strong className="text-cave-text-primary">{staff.email}</strong>
                </p>

                <div>
                  <label className="block text-sm font-medium text-cave-text-primary mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-secondary focus:outline-none focus:border-cave-gold pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cave-text-secondary hover:text-cave-text-primary"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-cave-text-secondary mt-1">Minimum 8 characters</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-lg font-medium text-cave-text-secondary hover:bg-cave-bg-elevated transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetPassword.isPending}
                    className={cn(
                      "px-6 py-2.5 rounded-lg font-semibold transition-colors",
                      "bg-cave-gold text-cave-bg-primary hover:bg-cave-gold/90",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "flex items-center gap-2"
                    )}
                  >
                    {resetPassword.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </>
  )
}