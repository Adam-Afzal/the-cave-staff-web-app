import { Search, Bell } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="h-16 bg-cave-bg-secondary border-b border-cave-border flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-cave-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm text-cave-text-secondary">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cave-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 bg-cave-bg-elevated border border-cave-border rounded-lg text-sm text-cave-text-primary placeholder:text-cave-text-muted focus:outline-none focus:ring-2 focus:ring-cave-gold/50 focus:border-cave-gold"
          />
        </div>

        <button className="relative p-2 rounded-lg text-cave-text-secondary hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cave-status-error rounded-full" />
        </button>

        {actions}
      </div>
    </header>
  )
}