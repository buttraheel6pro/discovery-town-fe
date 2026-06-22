'use client'

import { Bell, LogOut, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearAuthSession } from '@/lib/api/token-storage'

export function AdminHeader() {
  function handleLogout() {
    clearAuthSession()
    window.location.replace('/admin-login')
  }

  return (
    <header className="fixed top-0 right-0 left-64 z-30 border-b border-border bg-background h-16 flex items-center justify-between px-8">
      <div className="flex items-center gap-8 flex-1">
        <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
        </button>

        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-foreground" />
        </button>

        <div className="w-px h-6 bg-border"></div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">Admin User</p>
            <p className="text-xs text-muted-foreground">Manager</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <User className="w-4 h-4 text-accent-foreground" />
          </div>
        </div>

        <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </header>
  )
}
