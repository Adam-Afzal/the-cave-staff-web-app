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
  User,
  UserX,
  UserCheck,
  Trash2
} from 'lucide-react'
import {
  useAllStaffProfiles,
  useCreateStaffUser,
  useResetStaffPassword,
  useCurrentStaffProfile,
  useDeactivateStaffUser,
  useReactivateStaffUser,
  useDeleteStaffUser,
  type StaffProfile,
} from '../hooks/useStaffProfile'
import { cn } from '../lib/utils'

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
  const { data: currentProfile } = useCurrentStaffProfile()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState<StaffProfile | null>(null)
  const [showToggleActiveModal, setShowToggleActiveModal] = useState<StaffProfile | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<StaffProfile | null>(null)

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
                    <div className="flex flex-wrap items-center gap-1.5">
                      {staff.onboarding_completed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-cave-status-success/10 text-cave-status-success">
                          <Check className="w-3 h-3" />
                          Onboarded
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cave-gold/10 text-cave-gold">
                          Pending Setup
                        </span>
                      )}
                      {staff.is_active === false && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cave-status-error/10 text-cave-status-error">
                          Deactivated
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-cave-text-secondary text-sm">
                    {new Date(staff.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setShowResetModal(staff)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-cave-text-secondary hover:bg-cave-bg-elevated transition-colors"
                      >
                        <Key className="w-4 h-4" />
                        Reset Password
                      </button>
                      {staff.auth_user_id !== currentProfile?.auth_user_id && (
                        <>
                          <button
                            onClick={() => setShowToggleActiveModal(staff)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-cave-text-secondary hover:bg-cave-bg-elevated transition-colors"
                          >
                            {staff.is_active === false ? (
                              <>
                                <UserCheck className="w-4 h-4" />
                                Reactivate
                              </>
                            ) : (
                              <>
                                <UserX className="w-4 h-4" />
                                Deactivate
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(staff)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-cave-status-error hover:bg-cave-status-error/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
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

      {/* Deactivate / Reactivate Modal */}
      {showToggleActiveModal && (
        <ToggleActiveModal
          staff={showToggleActiveModal}
          onClose={() => setShowToggleActiveModal(null)}
        />
      )}

      {/* Delete Permanently Modal */}
      {showDeleteModal && (
        <DeleteStaffModal
          staff={showDeleteModal}
          onClose={() => setShowDeleteModal(null)}
        />
      )}
    </div>
  )
}

// Create Staff Modal
function CreateStaffModal({ onClose }: { onClose: () => void }) {
  const createStaff = useCreateStaffUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

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
      await createStaff.mutateAsync({ email, password, firstName, lastName })
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

// Deactivate / Reactivate Confirmation Modal
function ToggleActiveModal({ staff, onClose }: { staff: StaffProfile; onClose: () => void }) {
  const deactivate = useDeactivateStaffUser()
  const reactivate = useReactivateStaffUser()
  const [error, setError] = useState('')

  const isDeactivating = staff.is_active !== false
  const mutation = isDeactivating ? deactivate : reactivate
  const staffName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || staff.email || 'this staff member'

  const handleConfirm = async () => {
    setError('')
    try {
      await mutation.mutateAsync(staff.auth_user_id)
      onClose()
    } catch (err: any) {
      setError(err.message || `Failed to ${isDeactivating ? 'deactivate' : 'reactivate'} staff member`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-cave-bg-secondary border border-cave-border rounded-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            isDeactivating ? "bg-cave-status-error/10" : "bg-cave-status-success/10"
          )}>
            {isDeactivating ? (
              <UserX className="w-5 h-5 text-cave-status-error" />
            ) : (
              <UserCheck className="w-5 h-5 text-cave-status-success" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-cave-text-primary">
              {isDeactivating ? 'Deactivate Staff Member' : 'Reactivate Staff Member'}
            </h3>
            <p className="text-sm text-cave-text-secondary truncate">{staffName}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-cave-status-error/10 text-cave-status-error text-sm mb-4">
            {error}
          </div>
        )}

        <p className="text-sm text-cave-text-secondary mb-6">
          {isDeactivating
            ? `${staffName} will immediately lose access to the staff portal. This can be undone at any time.`
            : `${staffName} will regain access to the staff portal.`}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 bg-cave-bg-elevated text-cave-text-secondary rounded-lg text-sm font-medium hover:text-cave-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
              isDeactivating
                ? "bg-cave-status-error text-white hover:bg-cave-status-error/80"
                : "bg-cave-gold text-cave-bg-primary hover:bg-cave-gold/90"
            )}
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {mutation.isPending
              ? (isDeactivating ? 'Deactivating...' : 'Reactivating...')
              : (isDeactivating ? 'Deactivate' : 'Reactivate')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Permanent Delete Confirmation Modal (type-to-confirm)
function DeleteStaffModal({ staff, onClose }: { staff: StaffProfile; onClose: () => void }) {
  const deleteStaff = useDeleteStaffUser()
  const [confirmEmail, setConfirmEmail] = useState('')
  const [error, setError] = useState('')

  const staffName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || staff.email || 'this staff member'
  const canConfirm = staff.email !== null && confirmEmail.trim().toLowerCase() === staff.email.toLowerCase()

  const handleConfirm = async () => {
    if (!canConfirm) return
    setError('')
    try {
      await deleteStaff.mutateAsync(staff.auth_user_id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to delete staff member')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-cave-bg-secondary border border-cave-border rounded-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-cave-status-error/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-cave-status-error" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-cave-text-primary">Delete Staff Member Permanently</h3>
            <p className="text-sm text-cave-text-secondary truncate">{staffName}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-cave-status-error/10 text-cave-status-error text-sm mb-4">
            {error}
          </div>
        )}

        <p className="text-sm text-cave-text-secondary mb-4">
          This permanently deletes their staff record and login. It cannot be undone — consider Deactivate instead
          if you might need to restore access later. If this staff member has associated records (e.g. assigned
          connection requests or created events), deletion will be blocked.
        </p>

        <label className="block text-sm font-medium text-cave-text-primary mb-1.5">
          Type <span className="text-cave-status-error font-semibold">{staff.email}</span> to confirm
        </label>
        <input
          type="text"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          placeholder={staff.email ?? ''}
          className="w-full px-4 py-2.5 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary placeholder:text-cave-text-secondary focus:outline-none focus:border-cave-status-error mb-6"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleteStaff.isPending}
            className="flex-1 px-4 py-2.5 bg-cave-bg-elevated text-cave-text-secondary rounded-lg text-sm font-medium hover:text-cave-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || deleteStaff.isPending}
            className="flex-1 px-4 py-2.5 bg-cave-status-error text-white rounded-lg text-sm font-medium hover:bg-cave-status-error/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleteStaff.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {deleteStaff.isPending ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}