// src/pages/EntitiesPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Users, Search, Plus, Edit2, Trash2, X, Loader2, Briefcase, Mail, Phone, MoreHorizontal, UserMinus, AlertTriangle, ShieldBan
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn, getInitials } from '../lib/utils'

interface ThirdParty {
  id: string; name: string; email: string | null; phone: string | null
  company: string | null; industry: string | null; referred_by_member_id: string | null
  notes: string | null; created_at: string; updated_at: string
  referred_by?: { id: string; first_name: string | null; last_name: string | null } | null
}

interface Member {
  id: string; first_name: string | null; last_name: string | null; email: string | null
  phone: string | null; member_id: string | null; status: string | null
  business_arena: string | null; professional_background: string | null; city: string | null; country: string | null
  join_date: string | null; health_score: number | null; wealth_tier: string | null; created_at: string
  blacklisted: boolean
  profile_picture_url: string | null
  member_telegram?: { telegram_id: string | null; telegram_username: string | null; avatar_url: string | null } | null
}

type TabType = 'members' | 'third-parties'
const statusFilters = ['All', 'Active', 'Inactive', 'Pending', 'Churned', 'Blacklisted']

function HealthScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-cave-bg-elevated rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", score >= 70 ? 'bg-cave-status-success' : score >= 40 ? 'bg-cave-status-warning' : 'bg-cave-status-error')} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-sm font-medium", score >= 70 ? 'text-cave-status-success' : score >= 40 ? 'text-cave-status-warning' : 'text-cave-status-error')}>{score}</span>
    </div>
  )
}

function ThirdPartyModal({ thirdParty, onClose, onSave }: { thirdParty: ThirdParty | null; onClose: () => void; onSave: (data: Partial<ThirdParty>) => void }) {
  const [name, setName] = useState(thirdParty?.name || '')
  const [email, setEmail] = useState(thirdParty?.email || '')
  const [phone, setPhone] = useState(thirdParty?.phone || '')
  const [company, setCompany] = useState(thirdParty?.company || '')
  const [industry, setIndustry] = useState(thirdParty?.industry || '')
  const [notes, setNotes] = useState(thirdParty?.notes || '')
  const [referredByMemberId, setReferredByMemberId] = useState(thirdParty?.referred_by_member_id || '')
  const [memberSearch, setMemberSearch] = useState('')

  const { data: memberResults = [] } = useQuery({
    queryKey: ['member-search-referrer', memberSearch],
    queryFn: async () => {
      if (!memberSearch || memberSearch.length < 2) return []
      const { data, error } = await supabase.from('members').select('id, first_name, last_name, email').or(`first_name.ilike.%${memberSearch}%,last_name.ilike.%${memberSearch}%,email.ilike.%${memberSearch}%`).limit(5)
      if (error) throw error
      return data
    },
    enabled: memberSearch.length >= 2
  })

  const { data: selectedMember } = useQuery({
    queryKey: ['member', referredByMemberId],
    queryFn: async () => {
      if (!referredByMemberId) return null
      const { data, error } = await supabase.from('members').select('id, first_name, last_name').eq('id', referredByMemberId).single()
      if (error) return null
      return data
    },
    enabled: !!referredByMemberId
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, email: email || null, phone: phone || null, company: company || null, industry: industry || null, notes: notes || null, referred_by_member_id: referredByMemberId || null })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-cave-bg-secondary rounded-xl border border-cave-border w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-cave-bg-secondary flex items-center justify-between px-6 py-4 border-b border-cave-border">
          <h2 className="text-lg font-semibold text-cave-text-primary">{thirdParty ? 'Edit Third Party' : 'Add New Third Party'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-cave-bg-elevated rounded"><X className="w-5 h-5 text-cave-text-muted" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
            <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Company</label><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
            <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Industry</label><input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-cave-text-secondary mb-1">Referred By Member</label>
            {referredByMemberId && selectedMember ? (
              <div className="flex items-center justify-between px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg">
                <span className="text-cave-text-primary">{selectedMember.first_name} {selectedMember.last_name}</span>
                <button type="button" onClick={() => setReferredByMemberId('')} className="text-cave-text-muted hover:text-cave-text-primary"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="relative">
                <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search for a member..." className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" />
                {memberResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-cave-bg-elevated border border-cave-border rounded-lg shadow-lg z-10">
                    {memberResults.map((m) => (<button key={m.id} type="button" onClick={() => { setReferredByMemberId(m.id); setMemberSearch('') }} className="w-full px-3 py-2 text-left hover:bg-cave-bg-secondary text-cave-text-primary">{m.first_name} {m.last_name}<span className="text-xs text-cave-text-muted ml-2">{m.email}</span></button>))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold resize-none" /></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-cave-text-secondary hover:text-cave-text-primary">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-cave-gold text-cave-bg-primary rounded-lg font-medium hover:bg-cave-gold/90">{thirdParty ? 'Save Changes' : 'Add Third Party'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function OffboardConfirmModal({ member, onClose, onConfirm, isLoading }: { member: Member; onClose: () => void; onConfirm: () => void; isLoading: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-cave-bg-secondary rounded-xl border border-cave-border w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cave-status-warning/20 mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-cave-status-warning" />
          </div>
          <h2 className="text-lg font-semibold text-cave-text-primary text-center mb-2">Offboard Member</h2>
          <p className="text-cave-text-secondary text-center mb-4">
            Are you sure you want to offboard <span className="font-medium text-cave-text-primary">{member.first_name} {member.last_name}</span>?
          </p>
          <div className="bg-cave-bg-elevated rounded-lg p-4 mb-6">
            <p className="text-sm text-cave-text-secondary">
              This will mark the member as <span className="font-medium text-cave-status-warning">inactive</span>. They will:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-cave-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-cave-status-warning mt-0.5">•</span>
                Not appear in member directories
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cave-status-warning mt-0.5">•</span>
                Not be visible in engagement data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cave-status-warning mt-0.5">•</span>
                Retain their data for record-keeping
              </li>
            </ul>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-2 text-cave-text-secondary hover:text-cave-text-primary border border-cave-border rounded-lg hover:bg-cave-bg-elevated disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={onConfirm} disabled={isLoading} className="flex-1 px-4 py-2 bg-cave-status-warning text-white rounded-lg font-medium hover:bg-cave-status-warning/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
              {isLoading ? 'Offboarding...' : 'Offboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BlacklistConfirmModal({ member, onClose, onConfirm, isLoading }: { member: Member; onClose: () => void; onConfirm: () => void; isLoading: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-cave-bg-secondary rounded-xl border border-cave-border w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 mx-auto mb-4">
            <ShieldBan className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-cave-text-primary text-center mb-2">Blacklist Member</h2>
          <p className="text-cave-text-secondary text-center mb-4">
            Are you sure you want to blacklist <span className="font-medium text-cave-text-primary">{member.first_name} {member.last_name}</span>?
          </p>
          <div className="bg-cave-bg-elevated rounded-lg p-4 mb-6">
            <p className="text-sm text-cave-text-secondary">
              This will mark the member as <span className="font-medium text-red-400">blacklisted</span> and <span className="font-medium text-cave-status-warning">inactive</span>. They will:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-cave-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                Be moved to the Blacklisted category
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                Have their status set to inactive
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                Retain their data for record-keeping
              </li>
            </ul>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-2 text-cave-text-secondary hover:text-cave-text-primary border border-cave-border rounded-lg hover:bg-cave-bg-elevated disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={onConfirm} disabled={isLoading} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-500/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldBan className="w-4 h-4" />}
              {isLoading ? 'Blacklisting...' : 'Blacklist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MemberModal({ member, onClose, onSave }: { member: Member | null; onClose: () => void; onSave: (data: Partial<Member>, telegramData?: { telegram_username?: string }) => void }) {
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState(member?.first_name || '')
  const [lastName, setLastName] = useState(member?.last_name || '')
  const [email, setEmail] = useState(member?.email || '')
  const [phone, setPhone] = useState(member?.phone || '')
  const [status, setStatus] = useState(member?.status || 'ACTIVE')
  const [businessArena, setBusinessArena] = useState(member?.business_arena || '')
  const [city, setCity] = useState(member?.city || '')
  const [country, setCountry] = useState(member?.country || '')
  const [joinDate, setJoinDate] = useState(member?.join_date?.split('T')[0] || new Date().toISOString().split('T')[0])
  const [telegramUsername, setTelegramUsername] = useState(member?.member_telegram?.telegram_username || '')
  const [professionalBackground, setProfessionalBackground] = useState(member?.professional_background || '')
  const [showOffboardModal, setShowOffboardModal] = useState(false)
  const [showBlacklistModal, setShowBlacklistModal] = useState(false)

  const offboardMember = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('members').update({ status: 'INACTIVE' }).eq('id', member!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      onClose()
    }
  })

  const blacklistMember = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('members').update({ blacklisted: true, status: 'INACTIVE' }).eq('id', member!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ first_name: firstName || null, last_name: lastName || null, email: email || null, phone: phone || null, status, business_arena: businessArena || null, professional_background: professionalBackground || null, city: city || null, country: country || null, join_date: joinDate || null }, { telegram_username: telegramUsername || undefined })
  }

  const isEditing = !!member
  const canOffboard = isEditing && member.status !== 'INACTIVE'
  const canBlacklist = isEditing && !member.blacklisted

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-cave-bg-secondary rounded-xl border border-cave-border w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-cave-bg-secondary flex items-center justify-between px-6 py-4 border-b border-cave-border">
            <h2 className="text-lg font-semibold text-cave-text-primary">{member ? 'Edit Member' : 'Add New Member'}</h2>
            <button onClick={onClose} className="p-1 hover:bg-cave-bg-elevated rounded"><X className="w-5 h-5 text-cave-text-muted" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">First Name *</label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
              <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Last Name</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Email *</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
              <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Status</label><select value={status || 'ACTIVE'} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="PENDING">Pending</option><option value="CHURNED">Churned</option></select></div>
              <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Join Date</label><input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
            </div>
            <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Business Arena</label><input type="text" value={businessArena} onChange={(e) => setBusinessArena(e.target.value)} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
            <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Professional Background</label><textarea value={professionalBackground} onChange={(e) => setProfessionalBackground(e.target.value)} rows={3} placeholder="Enter professional background..." className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold resize-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">City</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
              <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Country</label><input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div>
            </div>
            <div><label className="block text-sm font-medium text-cave-text-secondary mb-1">Telegram Username</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-cave-text-muted">@</span><input type="text" value={telegramUsername} onChange={(e) => setTelegramUsername(e.target.value.replace('@', ''))} placeholder="username" className="w-full pl-8 pr-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary focus:outline-none focus:border-cave-gold" /></div></div>
            <div className="flex justify-between items-center pt-4">
              <div className="flex items-center gap-2">
                {canOffboard && (
                  <button type="button" onClick={() => setShowOffboardModal(true)} className="flex items-center gap-2 px-4 py-2 text-cave-status-warning hover:bg-cave-status-warning/10 rounded-lg transition-colors">
                    <UserMinus className="w-4 h-4" />
                    Offboard
                  </button>
                )}
                {canBlacklist && (
                  <button type="button" onClick={() => setShowBlacklistModal(true)} className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <ShieldBan className="w-4 h-4" />
                    Blacklist
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-cave-text-secondary hover:text-cave-text-primary">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-cave-gold text-cave-bg-primary rounded-lg font-medium hover:bg-cave-gold/90">{member ? 'Save Changes' : 'Add Member'}</button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {showOffboardModal && member && (
        <OffboardConfirmModal member={member} onClose={() => setShowOffboardModal(false)} onConfirm={() => offboardMember.mutate()} isLoading={offboardMember.isPending} />
      )}
      {showBlacklistModal && member && (
        <BlacklistConfirmModal member={member} onClose={() => setShowBlacklistModal(false)} onConfirm={() => blacklistMember.mutate()} isLoading={blacklistMember.isPending} />
      )}
    </>
  )
}

function MemberPreviewSidebar({ member, onClose, onViewProfile, onEdit }: { member: Member; onClose: () => void; onViewProfile: () => void; onEdit: () => void }) {
  return (
    <div className="w-80 bg-cave-bg-secondary rounded-xl border border-cave-border p-4 h-fit">
      <div className="flex justify-end mb-2"><button onClick={onClose} className="p-1 hover:bg-cave-bg-elevated rounded"><X className="w-4 h-4 text-cave-text-muted" /></button></div>
      <div className="text-center mb-4">
        {member.member_telegram?.avatar_url || member.profile_picture_url ? (<img src={member.member_telegram?.avatar_url || member.profile_picture_url || ''} alt="" className="w-16 h-16 rounded-full object-cover mx-auto mb-3" />) : (<div className="w-16 h-16 rounded-full bg-cave-gold/20 flex items-center justify-center mx-auto mb-3"><span className="text-cave-gold font-bold text-xl">{getInitials(member.first_name || '', member.last_name || '')}</span></div>)}
        <h3 className="text-lg font-semibold text-cave-text-primary">{member.first_name} {member.last_name}</h3>
        <p className="text-sm text-cave-text-secondary">{member.business_arena || 'No business arena'} • {member.city || 'Unknown'}</p>
        {member.member_id && <p className="text-xs font-mono text-cave-gold mt-1">{member.member_id}</p>}
        {member.wealth_tier && <span className={cn("inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium", member.wealth_tier === 'UHNW' ? 'bg-cave-gold/20 text-cave-gold' : 'bg-cave-bg-elevated text-cave-text-secondary')}>{member.wealth_tier}</span>}
      </div>
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-cave-text-muted" /><span className="text-cave-text-secondary truncate">{member.email}</span></div>
        {member.phone && <div className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 text-cave-text-muted" /><span className="text-cave-text-secondary">{member.phone}</span></div>}
        {member.member_telegram?.telegram_username && <div className="flex items-center gap-3 text-sm"><span className="w-4 h-4 text-cave-text-muted text-center">@</span><span className="text-cave-text-secondary">{member.member_telegram.telegram_username}</span></div>}
      </div>
      <div className="pt-4 border-t border-cave-border"><p className="text-xs text-cave-text-muted mb-2">Health Score</p><HealthScoreBadge score={member.health_score || 0} /></div>
      <div className="flex gap-2 mt-4">
        <button onClick={onViewProfile} className="flex-1 px-4 py-2 bg-cave-gold text-cave-bg-primary rounded-lg font-medium hover:bg-cave-gold/90">View Profile</button>
        <button onClick={onEdit} className="flex-1 px-4 py-2 bg-cave-bg-elevated text-cave-text-primary rounded-lg font-medium hover:bg-cave-border">Edit</button>
      </div>
    </div>
  )
}

export function EntitiesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('members')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showThirdPartyModal, setShowThirdPartyModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingThirdParty, setEditingThirdParty] = useState<ThirdParty | null>(null)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [previewMember, setPreviewMember] = useState<Member | null>(null)

  const { data: thirdParties = [], isLoading: thirdPartiesLoading } = useQuery({
    queryKey: ['third-parties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('third_parties').select('*, referred_by:members!referred_by_member_id(id,first_name,last_name)').order('created_at', { ascending: false })
      if (error) throw error
      return data as ThirdParty[]
    }
  })

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase.from('members').select('*, member_telegram(telegram_id,telegram_username,avatar_url)').order('created_at', { ascending: false })
      if (error) throw error
      return data as Member[]
    }
  })

  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchQuery || searchQuery.length < 2 || member.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) || member.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) || member.email?.toLowerCase().includes(searchQuery.toLowerCase()) || member.member_id?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = statusFilter === 'All' ? !member.blacklisted : statusFilter === 'Blacklisted' ? member.blacklisted : !member.blacklisted && member.status?.toUpperCase() === statusFilter.toUpperCase()
    return matchesSearch && matchesFilter
  })

  const filteredThirdParties = thirdParties.filter(tp => !searchQuery || searchQuery.length < 2 || tp.name?.toLowerCase().includes(searchQuery.toLowerCase()) || tp.email?.toLowerCase().includes(searchQuery.toLowerCase()) || tp.company?.toLowerCase().includes(searchQuery.toLowerCase()))

  const createThirdParty = useMutation({
    mutationFn: async (data: Partial<ThirdParty>) => { const { error } = await supabase.from('third_parties').insert(data); if (error) throw error },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['third-parties'] }); setShowThirdPartyModal(false) }
  })

  const updateThirdParty = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ThirdParty> }) => { const { error } = await supabase.from('third_parties').update(data).eq('id', id); if (error) throw error },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['third-parties'] }); setEditingThirdParty(null) }
  })

  const deleteThirdParty = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('third_parties').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['third-parties'] }) }
  })

  const createMember = useMutation({
    mutationFn: async ({ memberData, telegramData }: { memberData: Partial<Member>; telegramData?: { telegram_username?: string } }) => {
      const { data: newMember, error: memberError } = await supabase.from('members').insert(memberData).select().single()
      if (memberError) throw memberError
      const { error: telegramError } = await supabase.from('member_telegram').insert({ member_id: newMember.id, telegram_username: telegramData?.telegram_username || null })
      if (telegramError) throw telegramError
      const { error: profileError } = await supabase.from('member_profile').insert({ member_id: newMember.id })
      if (profileError) throw profileError
      return newMember
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); setShowMemberModal(false) }
  })

  const updateMember = useMutation({
    mutationFn: async ({ id, memberData, telegramData }: { id: string; memberData: Partial<Member>; telegramData?: { telegram_username?: string } }) => {
      const { error: memberError } = await supabase.from('members').update(memberData).eq('id', id)
      if (memberError) throw memberError
      if (telegramData?.telegram_username !== undefined) {
        const { error: telegramError } = await supabase.from('member_telegram').update({ telegram_username: telegramData.telegram_username || null }).eq('member_id', id)
        if (telegramError) throw telegramError
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); setEditingMember(null); setPreviewMember(null) }
  })

  const handleSaveThirdParty = (data: Partial<ThirdParty>) => { editingThirdParty ? updateThirdParty.mutate({ id: editingThirdParty.id, data }) : createThirdParty.mutate(data) }
  const handleSaveMember = (memberData: Partial<Member>, telegramData?: { telegram_username?: string }) => { editingMember ? updateMember.mutate({ id: editingMember.id, memberData, telegramData }) : createMember.mutate({ memberData, telegramData }) }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cave-text-primary">Entities</h1>
          <p className="text-cave-text-secondary">{activeTab === 'members' ? `${members.length} total members` : `${thirdParties.length} third parties`}</p>
        </div>
        <button onClick={() => activeTab === 'members' ? setShowMemberModal(true) : setShowThirdPartyModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cave-gold text-cave-bg-primary font-semibold hover:bg-cave-gold/90 transition-colors">
          <Plus className="w-5 h-5" />Add {activeTab === 'members' ? 'Member' : 'Third Party'}
        </button>
      </div>

      <div className="flex items-center gap-4 border-b border-cave-border">
        <button onClick={() => setActiveTab('members')} className={cn("flex items-center gap-2 px-4 py-3 border-b-2 transition-colors", activeTab === 'members' ? "border-cave-gold text-cave-gold" : "border-transparent text-cave-text-secondary hover:text-cave-text-primary")}><Users className="w-5 h-5" />Members</button>
        <button onClick={() => setActiveTab('third-parties')} className={cn("flex items-center gap-2 px-4 py-3 border-b-2 transition-colors", activeTab === 'third-parties' ? "border-cave-gold text-cave-gold" : "border-transparent text-cave-text-secondary hover:text-cave-text-primary")}><Briefcase className="w-5 h-5" />Third Parties</button>
      </div>

      <div className="flex items-center justify-between">
        {activeTab === 'members' ? (
          <div className="flex items-center gap-2">
            {statusFilters.map((filter) => (<button key={filter} onClick={() => setStatusFilter(filter)} className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", statusFilter === filter ? "bg-cave-gold text-cave-bg-primary" : "text-cave-text-secondary hover:bg-cave-bg-elevated")}>{filter}</button>))}
          </div>
        ) : <div />}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cave-text-muted" />
          <input type="text" placeholder={`Search ${activeTab === 'members' ? 'members' : 'third parties'}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64 pl-10 pr-4 py-2 bg-cave-bg-secondary border border-cave-border rounded-lg text-sm text-cave-text-primary focus:outline-none focus:border-cave-gold" />
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          {activeTab === 'members' ? (
            <div className="bg-cave-bg-secondary rounded-xl border border-cave-border overflow-hidden">
              {membersLoading ? (<div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-cave-gold animate-spin" /></div>) : filteredMembers.length === 0 ? (<div className="text-center py-12 text-cave-text-muted">No members found</div>) : (
                <table className="w-full">
                  <thead className="bg-cave-bg-elevated">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-cave-text-secondary uppercase">Member</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-cave-text-secondary uppercase">Member ID</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-cave-text-secondary uppercase">Business Arena</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-cave-text-secondary uppercase">Location</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-cave-text-secondary uppercase">Health</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-cave-text-secondary uppercase">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cave-border">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} onClick={() => navigate(`/members/${member.id}`)} className={cn("hover:bg-cave-bg-elevated transition-colors cursor-pointer", previewMember?.id === member.id && "bg-cave-gold/5")}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {member.member_telegram?.avatar_url || member.profile_picture_url ? (<img src={member.member_telegram?.avatar_url || member.profile_picture_url || ''} alt="" className="w-10 h-10 rounded-full object-cover" />) : (<div className="w-10 h-10 rounded-full bg-cave-gold/20 flex items-center justify-center"><span className="text-cave-gold font-medium text-sm">{getInitials(member.first_name || '', member.last_name || '')}</span></div>)}
                            <div><p className="font-medium text-cave-text-primary">{member.first_name} {member.last_name}</p><p className="text-xs text-cave-text-muted">{member.email}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{member.member_id ? <span className="font-mono text-sm text-cave-gold">{member.member_id}</span> : <span className="text-cave-text-muted">-</span>}</td>
                        <td className="px-4 py-3">{member.business_arena ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-cave-bg-elevated text-cave-text-secondary">{member.business_arena}</span> : <span className="text-cave-text-muted">-</span>}</td>
                        <td className="px-4 py-3 text-sm text-cave-text-secondary">{member.city && member.country ? `${member.city}, ${member.country}` : member.city || member.country || '-'}</td>
                        <td className="px-4 py-3"><HealthScoreBadge score={member.health_score || 0} /></td>
                        <td className="px-4 py-3"><span className={cn("px-2 py-1 rounded-full text-xs font-medium", member.blacklisted ? 'bg-red-500/20 text-red-400' : member.status === 'ACTIVE' ? 'bg-cave-status-success/20 text-cave-status-success' : member.status === 'INACTIVE' ? 'bg-cave-status-warning/20 text-cave-status-warning' : member.status === 'CHURNED' ? 'bg-cave-status-error/20 text-cave-status-error' : 'bg-cave-bg-elevated text-cave-text-secondary')}>{member.blacklisted ? 'Blacklisted' : member.status || 'Unknown'}</span></td>
                        <td className="px-4 py-3"><button onClick={(e) => { e.stopPropagation(); setPreviewMember(previewMember?.id === member.id ? null : member) }} className="p-2 hover:bg-cave-bg-elevated rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4 text-cave-text-muted" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="bg-cave-bg-secondary rounded-xl border border-cave-border overflow-hidden">
              {thirdPartiesLoading ? (<div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-cave-gold animate-spin" /></div>) : filteredThirdParties.length === 0 ? (<div className="text-center py-12 text-cave-text-muted">{searchQuery ? 'No third parties found' : 'No third parties yet'}</div>) : (
                <table className="w-full">
                  <thead className="bg-cave-bg-elevated">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-cave-text-secondary uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-cave-text-secondary uppercase">Company</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-cave-text-secondary uppercase">Contact</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-cave-text-secondary uppercase">Referred By</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cave-border">
                    {filteredThirdParties.map((tp) => (
                      <tr key={tp.id} className="hover:bg-cave-bg-elevated transition-colors">
                        <td className="px-4 py-3"><div><p className="font-medium text-cave-text-primary">{tp.name}</p>{tp.industry && <p className="text-xs text-cave-text-muted">{tp.industry}</p>}</div></td>
                        <td className="px-4 py-3">{tp.company ? <span className="text-cave-text-secondary">{tp.company}</span> : <span className="text-cave-text-muted">-</span>}</td>
                        <td className="px-4 py-3"><div className="space-y-1">{tp.email && <p className="text-sm text-cave-text-secondary">{tp.email}</p>}{tp.phone && <p className="text-xs text-cave-text-muted">{tp.phone}</p>}</div></td>
                        <td className="px-4 py-3">{tp.referred_by ? <span className="text-sm text-cave-gold">{tp.referred_by.first_name} {tp.referred_by.last_name}</span> : <span className="text-cave-text-muted">-</span>}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditingThirdParty(tp)} className="p-2 hover:bg-cave-bg-elevated rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-cave-text-muted" /></button>
                            <button onClick={() => { if (confirm('Are you sure you want to delete this third party?')) deleteThirdParty.mutate(tp.id) }} className="p-2 hover:bg-cave-status-error/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-cave-status-error" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
        {previewMember && activeTab === 'members' && <MemberPreviewSidebar member={previewMember} onClose={() => setPreviewMember(null)} onViewProfile={() => navigate(`/members/${previewMember.id}`)} onEdit={() => { setEditingMember(previewMember); setPreviewMember(null) }} />}
      </div>

      {(showThirdPartyModal || editingThirdParty) && <ThirdPartyModal thirdParty={editingThirdParty} onClose={() => { setShowThirdPartyModal(false); setEditingThirdParty(null) }} onSave={handleSaveThirdParty} />}
      {(showMemberModal || editingMember) && <MemberModal member={editingMember} onClose={() => { setShowMemberModal(false); setEditingMember(null) }} onSave={handleSaveMember} />}
    </div>
  )
}