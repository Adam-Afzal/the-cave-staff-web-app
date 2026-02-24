// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function Layout() {
  return (
    <div className="min-h-screen bg-cave-bg-primary">
      <Sidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 h-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}