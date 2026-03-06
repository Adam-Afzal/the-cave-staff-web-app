// src/components/layout/TopBar.tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentStaffProfile } from '../../hooks/useStaffProfile'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'

export function TopBar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: profile } = useCurrentStaffProfile()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    queryClient.clear()
    navigate('/login')
  }

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.email || 'Staff'

  return (
    <div className="h-16 bg-cave-bg-secondary border-b border-cave-border px-6 flex items-center justify-end">
      {/* Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
            showDropdown ? "bg-cave-bg-elevated" : "hover:bg-cave-bg-elevated"
          )}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden bg-cave-bg-elevated flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-cave-text-secondary" />
            )}
          </div>
          
          {/* Name */}
          <span className="text-sm font-medium text-cave-text-primary hidden sm:block">
            {displayName}
          </span>
          
          <ChevronDown className={cn(
            "w-4 h-4 text-cave-text-secondary transition-transform",
            showDropdown && "rotate-180"
          )} />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-cave-bg-secondary rounded-lg border border-cave-border shadow-xl py-1 z-50">
            {/* Profile Info */}
            <div className="px-4 py-3 border-b border-cave-border">
              <p className="text-sm font-medium text-cave-text-primary truncate">{displayName}</p>
              <p className="text-xs text-cave-text-secondary truncate">{profile?.email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setShowDropdown(false)
                  navigate('/profile/edit')
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cave-text-secondary hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
              >
                <Settings className="w-4 h-4" />
                Edit Profile
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cave-text-secondary hover:bg-cave-status-error/10 hover:text-cave-status-error transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}