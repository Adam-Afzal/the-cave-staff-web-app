// src/pages/ShuraPage.tsx
import { useState } from 'react'
import {
  Users,
  Plus,
  Crown,
  UserMinus,
  UserPlus,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  X,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { cn, getInitials } from '../lib/utils'
import type { Member } from '../types/database'
import type { ShuraWithMembers, ShuraMemberWithProfile } from '../hooks/useShura'
import {
  SHURA_MAX_CAPACITY,
  useShuras,
  useUnassignedMembers,
  useCreateShura,
  useDeleteShura,
  useAddShuraMember,
  useRemoveShuraMember,
  useSetModerator,
  useShuraMeetings,
  useCreateShuraMeeting,
  useUpdateAttendance,
} from '../hooks/useShura'

// ── Capacity bar ─────────────────────────────────────────────

function CapacityBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100)
  const color =
    pct >= 90 ? 'bg-cave-status-error' : pct >= 70 ? 'bg-cave-status-warning' : 'bg-cave-status-success'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-cave-bg-elevated rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-cave-text-muted whitespace-nowrap">
        {current}/{max}
      </span>
    </div>
  )
}

// ── Member avatar chip ────────────────────────────────────────

function MemberChip({
  member,
  isModerator,
}: {
  member: Member
  isModerator: boolean
}) {
  return (
    <div className="relative">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ring-2',
          isModerator
            ? 'bg-cave-gold text-cave-bg-primary ring-cave-gold'
            : 'bg-cave-bg-elevated text-cave-text-primary ring-cave-border'
        )}
        title={`${member.first_name} ${member.last_name}${isModerator ? ' (Moderator)' : ''}`}
      >
        {member.profile_picture_url ? (
          <img
            src={member.profile_picture_url}
            alt=""
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          getInitials(member.first_name, member.last_name)
        )}
      </div>
      {isModerator && (
        <Crown className="absolute -top-1 -right-1 w-3 h-3 text-cave-gold" />
      )}
    </div>
  )
}

// ── Meetings panel ────────────────────────────────────────────

function MeetingsPanel({ shura }: { shura: ShuraWithMembers }) {
  const { data: meetings = [], isLoading } = useShuraMeetings(shura.id)
  const createMeeting = useCreateShuraMeeting()
  const updateAttendance = useUpdateAttendance()

  const [showCreate, setShowCreate] = useState(false)
  const [meetingDate, setMeetingDate] = useState('')
  const [notes, setNotes] = useState('')
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null)

  const handleCreateMeeting = async () => {
    if (!meetingDate) return
    await createMeeting.mutateAsync({
      shuraId: shura.id,
      meetingDate,
      notes: notes || undefined,
      memberIds: shura.members.map((sm) => sm.member_id),
    })
    setShowCreate(false)
    setMeetingDate('')
    setNotes('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 text-cave-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-cave-text-secondary">Meetings</span>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 text-xs text-cave-gold hover:text-cave-gold-dark transition-colors"
        >
          <Plus className="w-3 h-3" />
          Log meeting
        </button>
      </div>

      {showCreate && (
        <div className="bg-cave-bg-elevated rounded-lg p-3 space-y-2">
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="input w-full text-sm py-1.5"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Meeting notes (optional)…"
            rows={2}
            className="input w-full text-sm py-1.5 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateMeeting}
              disabled={!meetingDate || createMeeting.isPending}
              className="btn-primary text-xs py-1 px-3"
            >
              {createMeeting.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="btn-ghost text-xs py-1 px-3"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {meetings.length === 0 ? (
        <p className="text-xs text-cave-text-muted">No meetings recorded yet.</p>
      ) : (
        <div className="space-y-1.5">
          {meetings.map((meeting) => {
            const attended = meeting.attendance.filter((a) => a.attended).length
            const total = meeting.attendance.length
            const isExpanded = expandedMeetingId === meeting.id

            return (
              <div key={meeting.id} className="bg-cave-bg-elevated rounded-lg overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedMeetingId(isExpanded ? null : meeting.id)
                  }
                  className="w-full flex items-center justify-between px-3 py-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-cave-text-muted" />
                    <span className="text-xs font-medium text-cave-text-primary">
                      {new Date(meeting.meeting_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cave-text-muted">
                      {attended}/{total} attended
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-cave-text-muted" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-cave-text-muted" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-2 space-y-1 border-t border-cave-border">
                    {meeting.notes && (
                      <p className="text-xs text-cave-text-muted italic pt-1">{meeting.notes}</p>
                    )}
                    {meeting.attendance.map((att) => (
                      <div key={att.id} className="flex items-center justify-between">
                        <span className="text-xs text-cave-text-secondary">
                          {att.member.first_name} {att.member.last_name}
                        </span>
                        <button
                          onClick={() =>
                            updateAttendance.mutate({
                              attendanceId: att.id,
                              attended: !att.attended,
                              shuraId: shura.id,
                            })
                          }
                          className="flex items-center gap-1"
                        >
                          {att.attended ? (
                            <CheckCircle2 className="w-4 h-4 text-cave-status-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-cave-text-muted" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Manage members modal ──────────────────────────────────────

function ManageMembersModal({
  shura,
  unassigned,
  onClose,
}: {
  shura: ShuraWithMembers
  unassigned: Member[]
  onClose: () => void
}) {
  const addMember = useAddShuraMember()
  const removeMember = useRemoveShuraMember()
  const setModerator = useSetModerator()
  const [search, setSearch] = useState('')

  const filteredUnassigned = unassigned.filter((m) =>
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  const atCapacity = shura.members.length >= SHURA_MAX_CAPACITY

  const handleAdd = async (memberId: string) => {
    await addMember.mutateAsync({ shuraId: shura.id, memberId })
  }

  const handleRemove = async (sm: ShuraMemberWithProfile) => {
    await removeMember.mutateAsync(sm.id)
  }

  const handleSetModerator = async (sm: ShuraMemberWithProfile) => {
    await setModerator.mutateAsync({ shuraId: shura.id, shuraMemberId: sm.id })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-cave-bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cave-border">
          <div>
            <h2 className="text-lg font-semibold text-cave-text-primary">{shura.name}</h2>
            <p className="text-sm text-cave-text-muted">
              Manage members · {shura.members.length}/{SHURA_MAX_CAPACITY} capacity
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-cave-bg-elevated transition-colors">
            <X className="w-5 h-5 text-cave-text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Current members */}
          <div>
            <p className="text-sm font-medium text-cave-text-secondary mb-2">Current Members</p>
            {shura.members.length === 0 ? (
              <p className="text-sm text-cave-text-muted">No members yet.</p>
            ) : (
              <div className="space-y-1.5">
                {shura.members.map((sm) => (
                  <div
                    key={sm.id}
                    className="flex items-center justify-between bg-cave-bg-elevated rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cave-gold/20 flex items-center justify-center text-xs font-semibold text-cave-gold">
                        {getInitials(sm.member.first_name, sm.member.last_name)}
                      </div>
                      <div>
                        <span className="text-sm text-cave-text-primary">
                          {sm.member.first_name} {sm.member.last_name}
                        </span>
                        {sm.is_moderator && (
                          <span className="ml-2 badge-gold text-xs">Moderator</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!sm.is_moderator && (
                        <button
                          onClick={() => handleSetModerator(sm)}
                          disabled={setModerator.isPending}
                          className="flex items-center gap-1 text-xs text-cave-text-muted hover:text-cave-gold transition-colors"
                          title="Set as moderator"
                        >
                          <Crown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(sm)}
                        disabled={removeMember.isPending}
                        className="flex items-center gap-1 text-xs text-cave-text-muted hover:text-cave-status-error transition-colors"
                        title="Remove from shura"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add members */}
          <div>
            <p className="text-sm font-medium text-cave-text-secondary mb-2">
              Add Members
              {atCapacity && (
                <span className="ml-2 text-xs text-cave-status-error">(Capacity reached)</span>
              )}
            </p>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Search unassigned members…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-full text-sm py-1.5"
              />
            </div>
            {filteredUnassigned.length === 0 ? (
              <p className="text-sm text-cave-text-muted">No unassigned members found.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {filteredUnassigned.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-cave-bg-elevated rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cave-bg-primary flex items-center justify-center text-xs font-semibold text-cave-text-secondary">
                        {getInitials(m.first_name, m.last_name)}
                      </div>
                      <div>
                        <p className="text-sm text-cave-text-primary">
                          {m.first_name} {m.last_name}
                        </p>
                        <p className="text-xs text-cave-text-muted">{m.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(m.id)}
                      disabled={atCapacity || addMember.isPending}
                      className="flex items-center gap-1 text-xs text-cave-gold hover:text-cave-gold-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shura card ────────────────────────────────────────────────

function ShuraCard({
  shura,
  unassigned,
  onDelete,
}: {
  shura: ShuraWithMembers
  unassigned: Member[]
  onDelete: (id: string) => void
}) {
  const [showManage, setShowManage] = useState(false)
  const [showMeetings, setShowMeetings] = useState(false)

  return (
    <>
      <div className="card p-5 flex flex-col gap-4">
        {/* Card header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-cave-text-primary truncate">{shura.name}</h3>
            <CapacityBar current={shura.members.length} max={SHURA_MAX_CAPACITY} />
          </div>
          <button
            onClick={() => onDelete(shura.id)}
            className="p-1 rounded hover:bg-cave-bg-elevated text-cave-text-muted hover:text-cave-status-error transition-colors flex-shrink-0"
            title="Delete shura"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Moderator */}
        {shura.moderator ? (
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-cave-gold flex-shrink-0" />
            <span className="text-sm text-cave-text-secondary">
              <span className="font-medium text-cave-gold">
                {shura.moderator.member.first_name} {shura.moderator.member.last_name}
              </span>
              <span className="text-cave-text-muted ml-1">· Moderator</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-cave-text-muted flex-shrink-0" />
            <span className="text-sm text-cave-text-muted italic">No moderator assigned</span>
          </div>
        )}

        {/* Member avatars */}
        {shura.members.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {shura.members.map((sm) => (
              <MemberChip
                key={sm.id}
                member={sm.member}
                isModerator={sm.is_moderator}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-cave-text-muted italic">No members yet.</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-cave-border">
          <button
            onClick={() => setShowManage(true)}
            className="btn-secondary text-xs flex items-center gap-1.5 flex-1"
          >
            <Users className="w-3.5 h-3.5" />
            Manage Members
          </button>
          <button
            onClick={() => setShowMeetings(!showMeetings)}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            Meetings
            {showMeetings ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Meetings panel (expandable) */}
        {showMeetings && (
          <div className="pt-1">
            <MeetingsPanel shura={shura} />
          </div>
        )}
      </div>

      {showManage && (
        <ManageMembersModal
          shura={shura}
          unassigned={unassigned}
          onClose={() => setShowManage(false)}
        />
      )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────

export function ShuraPage() {
  const { data: shuras = [], isLoading: shuraLoading } = useShuras()
  const { data: unassigned = [], isLoading: unassignedLoading } = useUnassignedMembers()
  const createShura = useCreateShura()
  const deleteShura = useDeleteShura()

  const [newShuraName, setNewShuraName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newShuraName.trim()) return
    await createShura.mutateAsync(newShuraName.trim())
    setNewShuraName('')
    setShowCreate(false)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return
    await deleteShura.mutateAsync(deleteConfirmId)
    setDeleteConfirmId(null)
  }

  const isLoading = shuraLoading || unassignedLoading

  return (
    <div>
      <Header
        title="Shuras (Forums)"
        subtitle={`${shuras.length} shura${shuras.length !== 1 ? 's' : ''} · ${unassigned.length} unassigned member${unassigned.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            New Shura
          </button>
        }
      />

      <div className="p-6 space-y-8">
        {/* Create shura inline form */}
        {showCreate && (
          <div className="card p-4 flex items-center gap-3">
            <input
              autoFocus
              type="text"
              placeholder="Shura name…"
              value={newShuraName}
              onChange={(e) => setNewShuraName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') setShowCreate(false)
              }}
              className="input flex-1"
            />
            <button
              onClick={handleCreate}
              disabled={!newShuraName.trim() || createShura.isPending}
              className="btn-primary"
            >
              {createShura.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cave-gold animate-spin" />
          </div>
        )}

        {/* Shura grid */}
        {!isLoading && shuras.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-cave-text-muted uppercase tracking-wider mb-4">
              Active Shuras
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shuras.map((shura) => (
                <ShuraCard
                  key={shura.id}
                  shura={shura}
                  unassigned={unassigned}
                  onDelete={(id) => setDeleteConfirmId(id)}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && shuras.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-cave-text-muted mx-auto mb-3" />
            <p className="text-cave-text-secondary font-medium">No shuras yet</p>
            <p className="text-cave-text-muted text-sm mt-1">
              Create the first shura to get started.
            </p>
          </div>
        )}

        {/* Unassigned members */}
        {!isLoading && (
          <div>
            <h2 className="text-sm font-semibold text-cave-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              Unassigned Members
              <span className="badge-warning">{unassigned.length}</span>
            </h2>

            {unassigned.length === 0 ? (
              <div className="card p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-cave-status-success mx-auto mb-2" />
                <p className="text-cave-text-secondary font-medium">All active members are assigned to a shura</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Membership Type</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassigned.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cave-bg-elevated flex items-center justify-center text-xs font-semibold text-cave-text-secondary">
                              {getInitials(member.first_name, member.last_name)}
                            </div>
                            <div>
                              <p className="font-medium text-cave-text-primary">
                                {member.first_name} {member.last_name}
                              </p>
                              <p className="text-xs text-cave-text-muted">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-cave-text-secondary text-sm">
                            {member.membership_type ?? <span className="text-cave-text-muted">—</span>}
                          </span>
                        </td>
                        <td>
                          <span className="text-cave-text-secondary text-sm">
                            {member.primary_residence ?? <span className="text-cave-text-muted">—</span>}
                          </span>
                        </td>
                        <td>
                          <span
                            className={cn(
                              member.status === 'ACTIVE'
                                ? 'badge-success'
                                : member.status === 'INACTIVE'
                                ? 'badge-warning'
                                : 'badge-error'
                            )}
                          >
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-cave-bg-card rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-cave-text-primary mb-2">Delete Shura</h3>
            <p className="text-sm text-cave-text-secondary mb-5">
              This will permanently delete the shura and remove all members. Meetings and attendance
              records will also be deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteShura.isPending}
                className="btn-primary bg-cave-status-error hover:bg-cave-status-error/90 flex-1"
              >
                {deleteShura.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
