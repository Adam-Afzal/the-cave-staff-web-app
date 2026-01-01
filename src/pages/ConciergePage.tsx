import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Header } from '../components/layout/Header'
import { Plus, AlertCircle, Clock, CheckCircle, Calendar, X, Users, Link2, FileText, Edit3, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn, getInitials, formatRelativeTime } from '../lib/utils'

type ConnectionType = 'B2B' | 'INVESTMENT' | 'STRATEGIC' | 'LEGAL' | 'FINANCIAL'
type Stage = 'REQUEST_MADE' | 'CONNECTION_MADE'
type RequestFilter = 'ALL' | 'REQUEST_MADE' | 'CONNECTION_MADE'
type MainTab = 'requests' | 'connections'
type RightPanelMode = 'add-request' | 'edit-request' | 'create-connection'

const connectionTypeColors: Record<ConnectionType, { bg: string; text: string }> = {
  B2B: { bg: 'bg-purple-500/15', text: 'text-purple-500' },
  INVESTMENT: { bg: 'bg-teal-500/15', text: 'text-teal-500' },
  STRATEGIC: { bg: 'bg-blue-500/15', text: 'text-blue-500' },
  LEGAL: { bg: 'bg-pink-500/15', text: 'text-pink-500' },
  FINANCIAL: { bg: 'bg-green-500/15', text: 'text-green-500' },
}

const stageColors: Record<Stage, { bg: string; text: string }> = {
  REQUEST_MADE: { bg: 'bg-orange-500/15', text: 'text-orange-500' },
  CONNECTION_MADE: { bg: 'bg-green-500/15', text: 'text-green-500' },
}

function groupRequests(requests: any[]): any[] {
  const groups: { [key: string]: any[] } = {}
  requests.forEach(request => {
    const groupId = request.group_id || request.id
    if (!groups[groupId]) groups[groupId] = []
    groups[groupId].push(request)
  })
  return Object.values(groups).map(group => ({
    ...group[0],
    grouped_requests: group,
    requesting_members: group.map(r => r.requesting_member),
  }))
}

function groupConnections(connections: any[]): any[] {
  const groups: { [key: string]: any[] } = {}
  connections.forEach(connection => {
    const groupId = connection.group_id || connection.id
    if (!groups[groupId]) groups[groupId] = []
    groups[groupId].push(connection)
  })
  return Object.values(groups).map(group => ({
    ...group[0],
    grouped_connections: group,
    from_members: group.map(c => c.from_member),
  }))
}

export function ConciergePage() {
  const queryClient = useQueryClient()
  const [mainTab, setMainTab] = useState<MainTab>('requests')
  const [requestFilter, setRequestFilter] = useState<RequestFilter>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('add-request')
  const [selectedRequestForConnection, setSelectedRequestForConnection] = useState<any>(null)
  const [selectedRequestForEdit, setSelectedRequestForEdit] = useState<any>(null)

  const { data: stats } = useQuery({
    queryKey: ['concierge-stats'],
    queryFn: async () => {
      const [newRequests, inProgress, connectionsMade, thisMonth] = await Promise.all([
        supabase.from('connection_requests').select('id', { count: 'exact' }).eq('stage', 'REQUEST_MADE'),
        supabase.from('connection_requests').select('id', { count: 'exact' }).eq('stage', 'REQUEST_MADE'),
        supabase.from('connections').select('id', { count: 'exact' }),
        supabase.from('connections').select('id', { count: 'exact' }).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ])
      return { newRequests: newRequests.count || 0, inProgress: inProgress.count || 0, connectionsMade: connectionsMade.count || 0, thisMonth: thisMonth.count || 0 }
    }
  })

  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['connection-requests', requestFilter],
    queryFn: async () => {
      let query = supabase.from('connection_requests').select('*, requesting_member:members!requesting_member_id(id, first_name, last_name, business_arena)').order('created_at', { ascending: false })
      if (requestFilter !== 'ALL') query = query.eq('stage', requestFilter)
      const { data, error } = await query
      if (error) throw error
      const requestsWithTargets = await Promise.all(data.map(async (request) => {
        let targetMembersData: any[] = []
        if (request.target_members?.length > 0) {
          const { data: members } = await supabase.from('members').select('id, first_name, last_name, business_arena').in('id', request.target_members)
          targetMembersData = members || []
        }
        let targetThirdPartiesData: any[] = []
        if (request.target_third_parties?.length > 0) {
          const { data: thirdParties } = await supabase.from('third_parties').select('id, name, company').in('id', request.target_third_parties)
          targetThirdPartiesData = thirdParties || []
        }
        return { ...request, target_members_data: targetMembersData, target_third_parties_data: targetThirdPartiesData }
      }))
      return groupRequests(requestsWithTargets)
    }
  })

  const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('connections').select('*, from_member:members!from_member_id(id, first_name, last_name, business_arena), request:connection_requests!request_id(id, description, type)').order('created_at', { ascending: false })
      if (error) throw error
      const connectionsWithTargets = await Promise.all(data.map(async (connection) => {
        let toMembersData: any[] = []
        if (connection.to_member_ids?.length > 0) {
          const { data: members } = await supabase.from('members').select('id, first_name, last_name, business_arena').in('id', connection.to_member_ids)
          toMembersData = members || []
        }
        let toThirdPartiesData: any[] = []
        if (connection.to_third_party_ids?.length > 0) {
          const { data: thirdParties } = await supabase.from('third_parties').select('id, name, company').in('id', connection.to_third_party_ids)
          toThirdPartiesData = thirdParties || []
        }
        return { ...connection, to_members_data: toMembersData, to_third_parties_data: toThirdPartiesData }
      }))
      return groupConnections(connectionsWithTargets)
    }
  })

  const handleMarkConnected = (request: any) => { setSelectedRequestForEdit(null); setSelectedRequestForConnection(request); setRightPanelMode('create-connection') }
  const handleCancelConnection = () => { setSelectedRequestForConnection(null); setRightPanelMode('add-request') }
  const handleViewDetails = (request: any) => { setSelectedRequestForConnection(null); setSelectedRequestForEdit(request); setRightPanelMode('edit-request') }
  const handleCancelEdit = () => { setSelectedRequestForEdit(null); setRightPanelMode('add-request') }
  const handleConnectionCreated = () => { setSelectedRequestForConnection(null); setRightPanelMode('add-request'); queryClient.invalidateQueries({ queryKey: ['connection-requests'] }); queryClient.invalidateQueries({ queryKey: ['connections'] }); queryClient.invalidateQueries({ queryKey: ['concierge-stats'] }) }
  const handleRequestSaved = () => { setSelectedRequestForEdit(null); setRightPanelMode('add-request'); queryClient.invalidateQueries({ queryKey: ['connection-requests'] }); queryClient.invalidateQueries({ queryKey: ['concierge-stats'] }) }

  const statCards = [
    { name: 'New Requests', value: stats?.newRequests || 0, icon: AlertCircle, color: 'orange' },
    { name: 'In Progress', value: stats?.inProgress || 0, icon: Clock, color: 'blue' },
    { name: 'Connections Made', value: stats?.connectionsMade || 0, icon: CheckCircle, color: 'green' },
    { name: 'This Month', value: stats?.thisMonth || 0, icon: Calendar, color: 'gold' },
  ]
  const requestFilterTabs: { key: RequestFilter; label: string; count?: number }[] = [
    { key: 'ALL', label: 'All' }, { key: 'REQUEST_MADE', label: 'Request Made', count: stats?.newRequests }, { key: 'CONNECTION_MADE', label: 'Connection Made' },
  ]

  return (
    <div>
      <Header title="Concierge" subtitle="Manage member connection requests" actions={<button onClick={() => { setSelectedRequestForEdit(null); setRightPanelMode('add-request'); setShowAddModal(true) }} className="px-4 py-2 bg-gradient-to-r from-cave-gold to-yellow-600 text-cave-bg-primary font-bold rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Add Request</button>} />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (<div key={stat.name} className="card p-4"><div className="flex items-start gap-3"><div className={cn("p-2 rounded-lg", stat.color === 'orange' && "bg-orange-500/15", stat.color === 'blue' && "bg-blue-500/15", stat.color === 'green' && "bg-green-500/15", stat.color === 'gold' && "bg-cave-gold/15")}><stat.icon className={cn("w-4 h-4", stat.color === 'orange' && "text-orange-500", stat.color === 'blue' && "text-blue-500", stat.color === 'green' && "text-green-500", stat.color === 'gold' && "text-cave-gold")} /></div><div><p className="text-2xl font-bold text-cave-text-primary">{stat.value}</p><p className="text-sm text-cave-text-secondary">{stat.name}</p></div></div></div>))}
        </div>
        <div className="flex items-center gap-4 border-b border-cave-border">
          <button onClick={() => setMainTab('requests')} className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors", mainTab === 'requests' ? "border-cave-gold text-cave-gold" : "border-transparent text-cave-text-secondary hover:text-cave-text-primary")}><FileText className="w-4 h-4" />Requests{stats?.newRequests ? <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">{stats.newRequests}</span> : null}</button>
          <button onClick={() => setMainTab('connections')} className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors", mainTab === 'connections' ? "border-cave-gold text-cave-gold" : "border-transparent text-cave-text-secondary hover:text-cave-text-primary")}><Link2 className="w-4 h-4" />Connections<span className="px-1.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded">{stats?.connectionsMade || 0}</span></button>
        </div>
        {mainTab === 'requests' && (<>
          <div className="flex items-center gap-2">{requestFilterTabs.map((tab) => (<button key={tab.key} onClick={() => setRequestFilter(tab.key)} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2", requestFilter === tab.key ? "bg-cave-gold/10 text-cave-gold" : "border border-cave-border text-cave-text-secondary hover:border-cave-gold/50")}>{tab.label}{tab.count !== undefined && tab.count > 0 && <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">{tab.count}</span>}</button>))}</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {isLoadingRequests ? <div className="card p-8 text-center text-cave-text-muted">Loading...</div> : requests.length === 0 ? <div className="card p-8 text-center text-cave-text-muted">No requests found</div> : requests.map((request: any) => (<RequestCard key={request.group_id || request.id} request={request} onMarkConnected={() => handleMarkConnected(request)} onViewDetails={() => handleViewDetails(request)} isSelected={selectedRequestForConnection?.group_id === request.group_id || selectedRequestForConnection?.id === request.id} isEditing={selectedRequestForEdit?.group_id === request.group_id || selectedRequestForEdit?.id === request.id} />))}
            </div>
            <div className="card">
              {rightPanelMode === 'add-request' && <RequestForm mode="create" onSuccess={handleRequestSaved} />}
              {rightPanelMode === 'edit-request' && selectedRequestForEdit && <RequestForm mode="edit" request={selectedRequestForEdit} onSuccess={handleRequestSaved} onCancel={handleCancelEdit} />}
              {rightPanelMode === 'create-connection' && selectedRequestForConnection && <CreateConnectionForm request={selectedRequestForConnection} onSuccess={handleConnectionCreated} onCancel={handleCancelConnection} />}
            </div>
          </div>
        </>)}
        {mainTab === 'connections' && (<div className="space-y-4">{isLoadingConnections ? <div className="card p-8 text-center text-cave-text-muted">Loading...</div> : connections.length === 0 ? <div className="card p-8 text-center text-cave-text-muted">No connections found</div> : connections.map((connection: any) => <ConnectionCard key={connection.group_id || connection.id} connection={connection} />)}</div>)}
      </div>
      {showAddModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 lg:hidden"><div className="bg-cave-bg-card rounded-lg w-full max-w-md m-4 max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between p-4 border-b border-cave-border"><h2 className="text-lg font-bold text-cave-text-primary">Add Connection Request</h2><button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-cave-text-muted" /></button></div><RequestForm mode="create" onSuccess={() => { setShowAddModal(false); handleRequestSaved() }} /></div></div>)}
    </div>
  )
}

function RequestCard({ request, onMarkConnected, onViewDetails, isSelected, isEditing }: { request: any; onMarkConnected: () => void; onViewDetails: () => void; isSelected?: boolean; isEditing?: boolean }) {
  const stage = request.stage as Stage
  const type = request.type as ConnectionType
  const isConnected = stage === 'CONNECTION_MADE'
  const targetMembers = request.target_members_data || []
  const targetThirdParties = request.target_third_parties_data || []
  const totalTargets = targetMembers.length + targetThirdParties.length
  const requestingMembers = request.requesting_members || [request.requesting_member]
  const isGrouped = requestingMembers.length > 1

  return (
    <div className={cn("card p-4 transition-all", isConnected && "opacity-80", isSelected && "ring-2 ring-green-500", isEditing && "ring-2 ring-cave-gold")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-1 rounded text-xs font-bold", stageColors[stage].bg, stageColors[stage].text)}>{stage.replace('_', ' ')}</span>
          <span className={cn("px-2 py-1 rounded text-xs font-bold", connectionTypeColors[type]?.bg || 'bg-gray-500/15', connectionTypeColors[type]?.text || 'text-gray-500')}>{type}</span>
          {isGrouped && <span className="px-2 py-1 rounded text-xs font-bold bg-cave-gold/15 text-cave-gold">{requestingMembers.length} MEMBERS</span>}
        </div>
        <span className="text-sm text-cave-text-muted">{formatRelativeTime(request.created_at)}</span>
      </div>
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-1">
          <p className="text-xs text-cave-text-muted mb-1">REQUESTED BY {isGrouped ? `(${requestingMembers.length})` : ''}</p>
          {isGrouped ? (
            <div className="space-y-2">
              {requestingMembers.map((member: any, idx: number) => (
                <div key={member?.id || idx} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cave-bg-elevated flex items-center justify-center"><span className="text-cave-gold font-bold text-xs">{getInitials(member?.first_name || '', member?.last_name || '')}</span></div>
                  <div><p className="text-cave-text-primary font-medium text-sm">{member?.first_name} {member?.last_name}</p><p className="text-xs text-cave-text-muted">{member?.business_arena || 'Unknown'}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cave-bg-elevated flex items-center justify-center"><span className="text-cave-gold font-bold text-xs">{getInitials(request.requesting_member?.first_name || '', request.requesting_member?.last_name || '')}</span></div>
              <div><p className="text-cave-text-primary font-medium">{request.requesting_member?.first_name} {request.requesting_member?.last_name}</p><p className="text-xs text-cave-text-muted">{request.requesting_member?.business_arena || 'Unknown'}</p></div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 pt-6"><div className="w-6 h-0.5 border-t-2 border-dashed border-cave-gold" /><div className="w-2 h-2 rounded-full bg-cave-gold" /></div>
        <div className="flex-1">
          <p className="text-xs text-cave-text-muted mb-1">POTENTIAL CONNECTIONS ({totalTargets})</p>
          {totalTargets === 0 && <p className="text-cave-text-muted text-sm italic">No connections identified yet</p>}
          {targetMembers.length > 0 && <div className="space-y-2">{targetMembers.map((member: any) => (<div key={member.id} className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center"><span className="text-blue-500 font-bold text-xs">{getInitials(member.first_name || '', member.last_name || '')}</span></div><div><p className="text-cave-text-primary font-medium text-sm">{member.first_name} {member.last_name}</p><p className="text-xs text-cave-text-muted">{member.business_arena || 'Member'}</p></div></div>))}</div>}
          {targetThirdParties.length > 0 && <div className={cn("space-y-2", targetMembers.length > 0 && "mt-2 pt-2 border-t border-cave-border")}>{targetThirdParties.map((tp: any) => (<div key={tp.id} className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-orange-500/15 flex items-center justify-center"><span className="text-orange-500 font-bold text-xs">3P</span></div><div><p className="text-cave-text-primary font-medium text-sm">{tp.name}</p><p className="text-xs text-cave-text-muted">{tp.company || 'External'}</p></div></div>))}</div>}
        </div>
      </div>
      <div className="mb-4"><p className="text-xs text-cave-text-muted mb-1">REQUEST</p><p className="text-cave-text-secondary text-sm line-clamp-2">{request.description}</p></div>
      {request.connection_time_mins && <div className="mb-4"><p className="text-xs text-cave-text-muted mb-1">CONNECTION TIME</p><p className="text-cave-text-secondary text-sm">{Math.floor(request.connection_time_mins / 60)}h {request.connection_time_mins % 60}m</p></div>}
      {!isConnected && <div className="flex items-center gap-2"><button onClick={onMarkConnected} className={cn("px-4 py-2 text-white text-sm font-medium rounded", isSelected ? "bg-green-600" : "bg-green-500")}>{isSelected ? 'Creating Connection...' : 'Mark Connected'}</button><button onClick={onViewDetails} className={cn("px-4 py-2 text-sm font-medium rounded border", isEditing ? "border-cave-gold text-cave-gold" : "border-cave-border text-cave-text-secondary")}><Edit3 className="w-4 h-4" /></button></div>}
      {isConnected && <div className="flex items-center justify-between pt-2 border-t border-cave-border"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-500 text-sm font-medium">Connection Made</span></div><button onClick={onViewDetails} className="text-cave-gold text-sm">View Details →</button></div>}
    </div>
  )
}

function ConnectionCard({ connection }: { connection: any }) {
  const type = connection.type as ConnectionType
  const toMembers = connection.to_members_data || []
  const toThirdParties = connection.to_third_parties_data || []
  const totalToTargets = toMembers.length + toThirdParties.length
  const fromMembers = connection.from_members || [connection.from_member]
  const isGrouped = fromMembers.length > 1
  
  const formatTime = (mins: number | null) => { if (!mins) return null; const hours = Math.floor(mins / 60); const minutes = mins % 60; return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m` }
  const formatDate = (dateStr: string | null) => { if (!dateStr) return null; return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/15 text-green-500">CONNECTION MADE</span>
          <span className={cn("px-2 py-1 rounded text-xs font-bold", connectionTypeColors[type]?.bg || 'bg-gray-500/15', connectionTypeColors[type]?.text || 'text-gray-500')}>{type}</span>
          {isGrouped && <span className="px-2 py-1 rounded text-xs font-bold bg-cave-gold/15 text-cave-gold">{fromMembers.length} MEMBERS</span>}
          {connection.approved_for_site && <span className="px-2 py-1 rounded text-xs font-bold bg-cave-gold/15 text-cave-gold">APPROVED</span>}
        </div>
        <span className="text-sm text-cave-text-muted">{formatDate(connection.occurred_at) || formatRelativeTime(connection.created_at)}</span>
      </div>
      <h3 className="text-lg font-bold text-cave-text-primary mb-2">{connection.title}</h3>
      {connection.description && <p className="text-cave-text-secondary text-sm mb-4 line-clamp-2">{connection.description}</p>}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-1">
          <p className="text-xs text-cave-text-muted mb-1">FROM {isGrouped ? `(${fromMembers.length})` : ''}</p>
          {isGrouped ? (
            <div className="space-y-2">
              {fromMembers.map((member: any, idx: number) => (
                <div key={member?.id || idx} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cave-bg-elevated flex items-center justify-center">
                    <span className="text-cave-gold font-bold text-xs">{getInitials(member?.first_name || '', member?.last_name || '')}</span>
                  </div>
                  <div>
                    <p className="text-cave-text-primary font-medium text-sm">{member?.first_name} {member?.last_name}</p>
                    <p className="text-xs text-cave-text-muted">{member?.business_arena || 'Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            connection.from_member && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cave-bg-elevated flex items-center justify-center">
                  <span className="text-cave-gold font-bold text-xs">{getInitials(connection.from_member.first_name || '', connection.from_member.last_name || '')}</span>
                </div>
                <div>
                  <p className="text-cave-text-primary font-medium text-sm">{connection.from_member.first_name} {connection.from_member.last_name}</p>
                  <p className="text-xs text-cave-text-muted">{connection.from_member.business_arena || 'Member'}</p>
                </div>
              </div>
            )
          )}
        </div>
        <div className="flex items-center gap-1 pt-4"><div className="w-6 h-0.5 border-t-2 border-dashed border-green-500" /><CheckCircle className="w-4 h-4 text-green-500" /><div className="w-6 h-0.5 border-t-2 border-dashed border-green-500" /></div>
        <div className="flex-1">
          <p className="text-xs text-cave-text-muted mb-1">CONNECTED TO ({totalToTargets})</p>
          {totalToTargets === 0 && <p className="text-cave-text-muted text-sm italic">No targets recorded</p>}
          {toMembers.length > 0 && (
            <div className="space-y-2">
              {toMembers.map((member: any) => (
                <div key={member.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center"><span className="text-blue-500 font-bold text-xs">{getInitials(member.first_name || '', member.last_name || '')}</span></div>
                  <div><p className="text-cave-text-primary font-medium text-sm">{member.first_name} {member.last_name}</p><p className="text-xs text-cave-text-muted">{member.business_arena || 'Member'}</p></div>
                </div>
              ))}
            </div>
          )}
          {toThirdParties.length > 0 && (
            <div className={cn("space-y-2", toMembers.length > 0 && "mt-2 pt-2 border-t border-cave-border")}>
              {toThirdParties.map((tp: any) => (
                <div key={tp.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/15 flex items-center justify-center"><span className="text-orange-500 font-bold text-xs">3P</span></div>
                  <div><p className="text-cave-text-primary font-medium text-sm">{tp.name}</p><p className="text-xs text-cave-text-muted">{tp.company || 'External'}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-6 pt-3 border-t border-cave-border">
        {connection.connection_time_mins && <div><p className="text-xs text-cave-text-muted">TIME TO CONNECT</p><p className="text-sm text-green-500 font-medium">{formatTime(connection.connection_time_mins)}</p></div>}
        {connection.outcome && <div className="flex-1"><p className="text-xs text-cave-text-muted">OUTCOME</p><p className="text-sm text-cave-text-secondary">{connection.outcome}</p></div>}
        <button className="text-cave-gold text-sm ml-auto">View Details →</button>
      </div>
    </div>
  )
}

function CreateConnectionForm({ request, onSuccess, onCancel }: { request: any; onSuccess: () => void; onCancel: () => void }) {
  const targetMembers = request.target_members_data || []
  const targetThirdParties = request.target_third_parties_data || []
  const requestingMembers = request.requesting_members || [request.requesting_member]
  const groupedRequests = request.grouped_requests || [request]
  const initialHours = request.connection_time_mins ? Math.floor(request.connection_time_mins / 60) : 0
  const initialMins = request.connection_time_mins ? request.connection_time_mins % 60 : 0

  const [formData, setFormData] = useState({
    title: '', description: request.description || '',
    to_member_ids: targetMembers.length === 1 ? [targetMembers[0].id] : [] as string[],
    to_third_party_ids: targetThirdParties.length === 1 && targetMembers.length === 0 ? [targetThirdParties[0].id] : [] as string[],
    outcome: '', occurred_at: new Date().toISOString().split('T')[0], approved_for_site: false,
    connection_time_hours: initialHours, connection_time_minutes: initialMins,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleToMember = (memberId: string) => setFormData(prev => ({ ...prev, to_member_ids: prev.to_member_ids.includes(memberId) ? prev.to_member_ids.filter((id: string) => id !== memberId) : [...prev.to_member_ids, memberId] }))
  const toggleToThirdParty = (tpId: string) => setFormData(prev => ({ ...prev, to_third_party_ids: prev.to_third_party_ids.includes(tpId) ? prev.to_third_party_ids.filter((id: string) => id !== tpId) : [...prev.to_third_party_ids, tpId] }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const connectionTimeMins = (formData.connection_time_hours * 60) + formData.connection_time_minutes
      const groupId = crypto.randomUUID()
      for (const req of groupedRequests) {
        const connectionData = {
          request_id: req.id, group_id: groupId, title: formData.title, description: formData.description || null,
          from_member_id: req.requesting_member_id,
          to_member_ids: formData.to_member_ids.length > 0 ? formData.to_member_ids : null,
          to_third_party_ids: formData.to_third_party_ids.length > 0 ? formData.to_third_party_ids : null,
          type: req.type, connection_time_mins: connectionTimeMins > 0 ? connectionTimeMins : null,
          occurred_at: formData.occurred_at ? new Date(formData.occurred_at).toISOString() : null,
          approved_for_site: formData.approved_for_site, outcome: formData.outcome || null,
        }
        const { error: connectionError } = await supabase.from('connections').insert(connectionData)
        if (connectionError) throw connectionError
        const { error: requestError } = await supabase.from('connection_requests').update({ stage: 'CONNECTION_MADE', connection_time_mins: connectionTimeMins > 0 ? connectionTimeMins : null }).eq('id', req.id)
        if (requestError) throw requestError
      }
      onSuccess()
    } catch (error) { console.error('Error creating connection:', error) } finally { setIsSubmitting(false) }
  }

  const hasTargets = targetMembers.length > 0 || targetThirdParties.length > 0
  const hasSelectedTargets = formData.to_member_ids.length > 0 || formData.to_third_party_ids.length > 0

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="mb-4"><div className="flex items-center gap-2 mb-1"><CheckCircle className="w-5 h-5 text-green-500" /><h2 className="text-lg font-bold text-cave-text-primary">Create Connection</h2></div><p className="text-sm text-cave-text-muted">Complete the connection details</p></div>
      <div className="mb-4 p-3 bg-cave-bg-elevated rounded-lg">
        <p className="text-xs text-cave-text-muted mb-1">ORIGINAL REQUEST</p>
        <p className="text-sm text-cave-text-secondary line-clamp-2">{request.description}</p>
        <div className="mt-2"><p className="text-xs text-cave-text-muted mb-1">REQUESTING MEMBERS ({requestingMembers.length})</p>
          <div className="flex flex-wrap gap-2">{requestingMembers.map((member: any, idx: number) => (<div key={member?.id || idx} className="flex items-center gap-1 px-2 py-1 bg-cave-bg-card rounded"><div className="w-5 h-5 rounded-full bg-cave-gold/20 flex items-center justify-center"><span className="text-cave-gold font-bold text-xs">{getInitials(member?.first_name || '', member?.last_name || '')}</span></div><span className="text-xs text-cave-text-primary">{member?.first_name} {member?.last_name}</span></div>))}</div>
        </div>
      </div>
      <div className="space-y-4">
        <div><label className="block text-sm text-cave-text-secondary mb-1">Connection Title *</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary" placeholder="e.g., Business Partnership" required /></div>
        <div><label className="block text-sm text-cave-text-secondary mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary resize-none" rows={3} placeholder="Details about the connection..." /></div>
        {hasTargets && (<div><label className="block text-sm text-cave-text-secondary mb-1">Connected To * (select all that apply)</label><div className="space-y-2 max-h-48 overflow-y-auto">
          {targetMembers.map((member: any) => (<label key={member.id} className={cn("flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors", formData.to_member_ids.includes(member.id) ? "border-green-500 bg-green-500/10" : "border-cave-border hover:border-cave-gold/50")}><input type="checkbox" checked={formData.to_member_ids.includes(member.id)} onChange={() => toggleToMember(member.id)} className="rounded border-cave-border" /><div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center"><span className="text-blue-500 font-bold text-xs">{getInitials(member.first_name, member.last_name)}</span></div><div><p className="text-sm text-cave-text-primary">{member.first_name} {member.last_name}</p><p className="text-xs text-cave-text-muted">Member</p></div>{formData.to_member_ids.includes(member.id) && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}</label>))}
          {targetThirdParties.map((tp: any) => (<label key={tp.id} className={cn("flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors", formData.to_third_party_ids.includes(tp.id) ? "border-green-500 bg-green-500/10" : "border-cave-border hover:border-cave-gold/50")}><input type="checkbox" checked={formData.to_third_party_ids.includes(tp.id)} onChange={() => toggleToThirdParty(tp.id)} className="rounded border-cave-border" /><div className="w-8 h-8 rounded-full bg-orange-500/15 flex items-center justify-center"><span className="text-orange-500 font-bold text-xs">3P</span></div><div><p className="text-sm text-cave-text-primary">{tp.name}</p><p className="text-xs text-cave-text-muted">{tp.company || 'Third Party'}</p></div>{formData.to_third_party_ids.includes(tp.id) && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}</label>))}
        </div></div>)}
        <div><label className="block text-sm text-cave-text-secondary mb-1"><span className="flex items-center gap-1"><Clock className="w-4 h-4" />Time to Connect</span></label><div className="flex items-center gap-2"><div className="flex-1"><input type="number" min="0" max="999" value={formData.connection_time_hours} onChange={(e) => setFormData({ ...formData, connection_time_hours: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary" /><p className="text-xs text-cave-text-muted mt-1">Hours</p></div><span className="text-cave-text-muted">:</span><div className="flex-1"><input type="number" min="0" max="59" value={formData.connection_time_minutes} onChange={(e) => setFormData({ ...formData, connection_time_minutes: Math.min(59, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary" /><p className="text-xs text-cave-text-muted mt-1">Minutes</p></div></div></div>
        <div><label className="block text-sm text-cave-text-secondary mb-1">Date Connected</label><input type="date" value={formData.occurred_at} onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary" /></div>
        <div><label className="block text-sm text-cave-text-secondary mb-1">Outcome</label><textarea value={formData.outcome} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary resize-none" rows={2} placeholder="What was the result of this connection?" /></div>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.approved_for_site} onChange={(e) => setFormData({ ...formData, approved_for_site: e.target.checked })} className="rounded border-cave-border" /><span className="text-sm text-cave-text-secondary">Approved for website display</span></label>
        {requestingMembers.length > 1 && (<div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"><p className="text-sm text-blue-400">This will create {requestingMembers.length} connection records (one for each requesting member)</p></div>)}
        <div className="flex gap-2 pt-4"><button type="submit" disabled={isSubmitting || !hasSelectedTargets} className="flex-1 px-4 py-2 bg-green-500 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" />{isSubmitting ? 'Creating...' : `Create ${requestingMembers.length > 1 ? requestingMembers.length + ' Connections' : 'Connection'}`}</button><button type="button" onClick={onCancel} className="px-4 py-2 bg-cave-bg-elevated border border-cave-border text-cave-text-secondary rounded-lg">Cancel</button></div>
      </div>
    </form>
  )
}

function RequestForm({ mode, request, onSuccess, onCancel }: { mode: 'create' | 'edit'; request?: any; onSuccess: () => void; onCancel?: () => void }) {
  const isEditMode = mode === 'edit' && request
  const initialHours = request?.connection_time_mins ? Math.floor(request.connection_time_mins / 60) : 0
  const initialMins = request?.connection_time_mins ? request.connection_time_mins % 60 : 0

  const [formData, setFormData] = useState({
    requesting_member_ids: request?.requesting_member_id ? [request.requesting_member_id] : [] as string[],
    description: request?.description || '', type: (request?.type || 'B2B') as ConnectionType,
    target_member_ids: request?.target_members || [] as string[],
    target_third_party_ids: request?.target_third_parties || [] as string[],
    stage: (request?.stage || 'REQUEST_MADE') as Stage,
    connection_time_hours: initialHours, connection_time_minutes: initialMins,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestingMemberSearch, setRequestingMemberSearch] = useState('')
  const [targetMemberSearch, setTargetMemberSearch] = useState('')

  useEffect(() => {
    if (request) {
      const hours = request.connection_time_mins ? Math.floor(request.connection_time_mins / 60) : 0
      const mins = request.connection_time_mins ? request.connection_time_mins % 60 : 0
      const requestingMemberIds = request.grouped_requests ? request.grouped_requests.map((r: any) => r.requesting_member_id) : [request.requesting_member_id]
      setFormData({ requesting_member_ids: requestingMemberIds, description: request.description || '', type: request.type || 'B2B', target_member_ids: request.target_members || [], target_third_party_ids: request.target_third_parties || [], stage: request.stage || 'REQUEST_MADE', connection_time_hours: hours, connection_time_minutes: mins })
    } else {
      setFormData({ requesting_member_ids: [], description: '', type: 'B2B', target_member_ids: [], target_third_party_ids: [], stage: 'REQUEST_MADE', connection_time_hours: 0, connection_time_minutes: 0 })
    }
  }, [request])

  const { data: members = [] } = useQuery({ queryKey: ['members-list'], queryFn: async () => { const { data } = await supabase.from('members').select('id, first_name, last_name, business_arena').order('first_name'); return data || [] } })
  const { data: thirdParties = [] } = useQuery({ queryKey: ['third-parties-list'], queryFn: async () => { const { data } = await supabase.from('third_parties').select('id, name, company').order('name'); return data || [] } })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const connectionTimeMins = (formData.connection_time_hours * 60) + formData.connection_time_minutes
      const groupId = crypto.randomUUID()
      if (isEditMode) {
        const groupedRequests = request.grouped_requests || [request]
        for (const req of groupedRequests) {
          const requestData = { description: formData.description, type: formData.type, stage: formData.stage, target_members: formData.target_member_ids.length > 0 ? formData.target_member_ids : null, target_third_parties: formData.target_third_party_ids.length > 0 ? formData.target_third_party_ids : null, connection_time_mins: connectionTimeMins > 0 ? connectionTimeMins : null }
          const { error } = await supabase.from('connection_requests').update(requestData).eq('id', req.id)
          if (error) throw error
        }
      } else {
        for (const memberId of formData.requesting_member_ids) {
          const requestData = { requesting_member_id: memberId, group_id: formData.requesting_member_ids.length > 1 ? groupId : undefined, description: formData.description, type: formData.type, stage: formData.stage, target_members: formData.target_member_ids.length > 0 ? formData.target_member_ids : null, target_third_parties: formData.target_third_party_ids.length > 0 ? formData.target_third_party_ids : null, connection_time_mins: connectionTimeMins > 0 ? connectionTimeMins : null }
          const { error } = await supabase.from('connection_requests').insert(requestData)
          if (error) throw error
        }
      }
      if (!isEditMode) setFormData({ requesting_member_ids: [], description: '', type: 'B2B', target_member_ids: [], target_third_party_ids: [], stage: 'REQUEST_MADE', connection_time_hours: 0, connection_time_minutes: 0 })
      onSuccess()
    } catch (error) { console.error('Error saving request:', error) } finally { setIsSubmitting(false) }
  }

  const toggleRequestingMember = (memberId: string) => setFormData(prev => ({ ...prev, requesting_member_ids: prev.requesting_member_ids.includes(memberId) ? prev.requesting_member_ids.filter((id: string) => id !== memberId) : [...prev.requesting_member_ids, memberId] }))
  const toggleTargetMember = (memberId: string) => setFormData(prev => ({ ...prev, target_member_ids: prev.target_member_ids.includes(memberId) ? prev.target_member_ids.filter((id: string) => id !== memberId) : [...prev.target_member_ids, memberId] }))
  const toggleTargetThirdParty = (tpId: string) => setFormData(prev => ({ ...prev, target_third_party_ids: prev.target_third_party_ids.includes(tpId) ? prev.target_third_party_ids.filter((id: string) => id !== tpId) : [...prev.target_third_party_ids, tpId] }))

  const connectionTypes: ConnectionType[] = ['B2B', 'INVESTMENT', 'STRATEGIC', 'LEGAL', 'FINANCIAL']
  const selectedMembers = members.filter((m: any) => formData.requesting_member_ids.includes(m.id))

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="mb-4">
        {isEditMode ? (<><div className="flex items-center gap-2 mb-1"><Edit3 className="w-5 h-5 text-cave-gold" /><h2 className="text-lg font-bold text-cave-text-primary">Edit Request</h2></div><p className="text-sm text-cave-text-muted">Update connection request details</p></>) : (<><h2 className="text-lg font-bold text-cave-text-primary">Add Connection Request</h2><p className="text-sm text-cave-text-muted">Log a new member request</p></>)}
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-cave-text-secondary mb-1"><span className="flex items-center gap-1"><Users className="w-4 h-4" />Requesting Member(s) * ({formData.requesting_member_ids.length})</span></label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cave-text-muted" />
            <input type="text" value={requestingMemberSearch} onChange={(e) => setRequestingMemberSearch(e.target.value)} placeholder="Search members..." className="w-full pl-9 pr-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary text-sm" />
          </div>
          <div className="max-h-40 overflow-y-auto border border-cave-border rounded-lg bg-cave-bg-elevated">{members.filter((m: any) => {
            const searchLower = requestingMemberSearch.toLowerCase()
            const fullName = `${m.first_name} ${m.last_name}`.toLowerCase()
            return fullName.includes(searchLower)
          }).map((member: any) => (<label key={member.id} className={cn("flex items-center gap-2 p-2 cursor-pointer hover:bg-cave-bg-card border-b border-cave-border last:border-b-0", formData.requesting_member_ids.includes(member.id) && "bg-cave-gold/10")}><input type="checkbox" checked={formData.requesting_member_ids.includes(member.id)} onChange={() => toggleRequestingMember(member.id)} className="rounded border-cave-border" disabled={isEditMode} /><div className="w-6 h-6 rounded-full bg-cave-gold/15 flex items-center justify-center"><span className="text-cave-gold font-bold text-xs">{getInitials(member.first_name, member.last_name)}</span></div><div className="flex-1 min-w-0"><p className="text-sm text-cave-text-primary truncate">{member.first_name} {member.last_name}</p></div></label>))}</div>
          {selectedMembers.length > 0 && (<div className="mt-2 flex flex-wrap gap-1">{selectedMembers.map((member: any) => (<span key={member.id} className="inline-flex items-center gap-1 px-2 py-1 bg-cave-gold/10 text-cave-gold text-xs rounded">{member.first_name} {member.last_name}{!isEditMode && <button type="button" onClick={() => toggleRequestingMember(member.id)} className="hover:text-cave-gold/70"><X className="w-3 h-3" /></button>}</span>))}</div>)}
          {formData.requesting_member_ids.length > 1 && !isEditMode && <p className="text-xs text-cave-text-muted mt-1">This will create {formData.requesting_member_ids.length} grouped requests</p>}
        </div>
        <div><label className="block text-sm text-cave-text-secondary mb-1">Request Description *</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary resize-none" rows={3} placeholder="Looking for..." required /></div>
        <div><label className="block text-sm text-cave-text-secondary mb-1">Connection Type *</label><div className="flex flex-wrap gap-2">{connectionTypes.map((type) => <button key={type} type="button" onClick={() => setFormData({ ...formData, type })} className={cn("px-3 py-1.5 rounded text-sm transition-colors", formData.type === type ? cn(connectionTypeColors[type].bg, connectionTypeColors[type].text, "border border-current") : "bg-cave-bg-elevated border border-cave-border text-cave-text-secondary")}>{type}</button>)}</div></div>
        <div><label className="block text-sm text-cave-text-secondary mb-1"><span className="flex items-center gap-1"><Clock className="w-4 h-4" />Connection Time</span></label><div className="flex items-center gap-2"><div className="flex-1"><input type="number" min="0" max="999" value={formData.connection_time_hours} onChange={(e) => setFormData({ ...formData, connection_time_hours: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary" /><p className="text-xs text-cave-text-muted mt-1">Hours</p></div><span className="text-cave-text-muted">:</span><div className="flex-1"><input type="number" min="0" max="59" value={formData.connection_time_minutes} onChange={(e) => setFormData({ ...formData, connection_time_minutes: Math.min(59, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary" /><p className="text-xs text-cave-text-muted mt-1">Minutes</p></div></div></div>
        <div>
          <label className="block text-sm text-cave-text-secondary mb-1"><span className="flex items-center gap-1"><Users className="w-4 h-4" />Potential Connections - Members ({formData.target_member_ids.length})</span></label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cave-text-muted" />
            <input type="text" value={targetMemberSearch} onChange={(e) => setTargetMemberSearch(e.target.value)} placeholder="Search members..." className="w-full pl-9 pr-3 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-cave-text-primary text-sm" />
          </div>
          <div className="max-h-40 overflow-y-auto border border-cave-border rounded-lg bg-cave-bg-elevated">{members.filter((m: any) => !formData.requesting_member_ids.includes(m.id)).filter((m: any) => {
            const searchLower = targetMemberSearch.toLowerCase()
            const fullName = `${m.first_name} ${m.last_name}`.toLowerCase()
            return fullName.includes(searchLower)
          }).map((member: any) => <label key={member.id} className={cn("flex items-center gap-2 p-2 cursor-pointer hover:bg-cave-bg-card border-b border-cave-border last:border-b-0", formData.target_member_ids.includes(member.id) && "bg-blue-500/10")}><input type="checkbox" checked={formData.target_member_ids.includes(member.id)} onChange={() => toggleTargetMember(member.id)} className="rounded border-cave-border" /><div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center"><span className="text-blue-500 font-bold text-xs">{getInitials(member.first_name, member.last_name)}</span></div><div className="flex-1 min-w-0"><p className="text-sm text-cave-text-primary truncate">{member.first_name} {member.last_name}</p></div></label>)}</div>
        </div>
        <div><label className="block text-sm text-cave-text-secondary mb-1">Potential Connections - Third Parties ({formData.target_third_party_ids.length})</label><div className="max-h-40 overflow-y-auto border border-cave-border rounded-lg bg-cave-bg-elevated">{thirdParties.length === 0 ? <p className="p-2 text-sm text-cave-text-muted">No third parties available</p> : thirdParties.map((tp: any) => <label key={tp.id} className={cn("flex items-center gap-2 p-2 cursor-pointer hover:bg-cave-bg-card border-b border-cave-border last:border-b-0", formData.target_third_party_ids.includes(tp.id) && "bg-orange-500/10")}><input type="checkbox" checked={formData.target_third_party_ids.includes(tp.id)} onChange={() => toggleTargetThirdParty(tp.id)} className="rounded border-cave-border" /><div className="w-6 h-6 rounded-full bg-orange-500/15 flex items-center justify-center"><span className="text-orange-500 font-bold text-xs">3P</span></div><div className="flex-1 min-w-0"><p className="text-sm text-cave-text-primary truncate">{tp.name}</p></div></label>)}</div></div>
        <div><label className="block text-sm text-cave-text-secondary mb-1">Stage *</label><div className="flex gap-2"><button type="button" onClick={() => setFormData({ ...formData, stage: 'REQUEST_MADE' })} className={cn("flex-1 px-3 py-2 rounded text-sm transition-colors", formData.stage === 'REQUEST_MADE' ? "bg-orange-500/15 border border-orange-500 text-orange-500" : "bg-cave-bg-elevated border border-cave-border text-cave-text-secondary")}>Request Made</button><button type="button" onClick={() => setFormData({ ...formData, stage: 'CONNECTION_MADE' })} className={cn("flex-1 px-3 py-2 rounded text-sm transition-colors", formData.stage === 'CONNECTION_MADE' ? "bg-green-500/15 border border-green-500 text-green-500" : "bg-cave-bg-elevated border border-cave-border text-cave-text-secondary")}>Connection Made</button></div></div>
        <div className="flex gap-2 pt-4"><button type="submit" disabled={isSubmitting || formData.requesting_member_ids.length === 0} className="flex-1 px-4 py-2 bg-gradient-to-r from-cave-gold to-yellow-600 text-cave-bg-primary font-bold rounded-lg disabled:opacity-50">{isSubmitting ? 'Saving...' : isEditMode ? 'Update Request' : formData.requesting_member_ids.length > 1 ? `Add ${formData.requesting_member_ids.length} Requests` : 'Add Request'}</button>{isEditMode && onCancel ? <button type="button" onClick={onCancel} className="px-4 py-2 bg-cave-bg-elevated border border-cave-border text-cave-text-secondary rounded-lg">Cancel</button> : <button type="button" onClick={() => setFormData({ requesting_member_ids: [], description: '', type: 'B2B', target_member_ids: [], target_third_party_ids: [], stage: 'REQUEST_MADE', connection_time_hours: 0, connection_time_minutes: 0 })} className="px-4 py-2 bg-cave-bg-elevated border border-cave-border text-cave-text-secondary rounded-lg">Clear</button>}</div>
      </div>
    </form>
  )
}