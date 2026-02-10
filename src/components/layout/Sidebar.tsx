// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Link2,
  Calendar,
  BarChart3,
  Settings,
  Activity,
  Phone,
  Flag,
  UserCog,
  Handshake,
  ClipboardCheck,
  FileText
} from 'lucide-react'
import { cn } from '../../lib/utils'
import caveLogo from '../../assets/cavelogo.jpg'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Entities', href: '/entities', icon: Users },
  { name: 'Concierge', href: '/concierge', icon: Link2 },
  { name: 'Onboarding Forms',href: '/onboarding-forms', icon: FileText },
  { name: 'Client Calls', href: '/calls', icon: Phone },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Engagement', href: '/engagement', icon: Activity },
  { name: 'Feature Flags', href: '/feature-flags', icon: Flag },
  { name: 'Staff', href: '/staff', icon: UserCog },
]

const b2bNavigation = [
  { name: 'Scheduled Calls', href: '/b2b/calls', icon: Phone },
  { name: 'Log Assessment', href: '/b2b/assess', icon: ClipboardCheck },
  { name: 'Intros', href: '/b2b/intros', icon: Handshake },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-cave-bg-secondary border-r border-cave-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-cave-border">
        <div className="flex items-center gap-3">
          <img src={caveLogo} alt="The Cave" className="w-8 h-8 rounded-lg object-cover" />
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
        
        {/* B2B Section */}
        <div className="pt-4 mt-4 border-t border-cave-border">
          <p className="px-3 mb-2 text-xs font-semibold text-cave-text-muted uppercase tracking-wider">
            B2B Tracking
          </p>
          {b2bNavigation.map((item) => (
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
        </div>
      </nav>

      {/* Settings Link */}
      <div className="p-3 border-t border-cave-border">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
              isActive
                ? 'bg-cave-gold/10 text-cave-gold'
                : 'text-cave-text-secondary hover:bg-cave-bg-elevated hover:text-cave-text-primary'
            )
          }
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}