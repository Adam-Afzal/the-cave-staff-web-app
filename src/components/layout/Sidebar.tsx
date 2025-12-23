import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Link2,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  MessageSquare,
  Phone
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Concierge', href: '/concierge', icon: Link2 },
  { name: 'Client Calls', href: '/calls', icon: Phone },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Telegram', href: '/telegram', icon: MessageSquare },
]

export function Sidebar() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-cave-bg-secondary border-r border-cave-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-cave-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cave-gold flex items-center justify-center">
            <span className="text-cave-bg-primary font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold text-cave-text-primary">The Cave</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-cave-gold/10 text-cave-gold'
                  : 'text-cave-text-secondary hover:bg-cave-bg-elevated hover:text-cave-text-primary'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-cave-border">
        <div className="space-y-1">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-cave-text-secondary hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </NavLink>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-cave-text-secondary hover:bg-cave-status-error/10 hover:text-cave-status-error transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}