import React, { useState } from 'react'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
  className?: string
  onNavigate?: (path: string) => void
  currentPath?: string
}

export function AppShell({ children, className, onNavigate, currentPath }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[--color-background]">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={onNavigate}
          currentPath={currentPath}
        />

        {/* Main content */}
        <main
          id="main-content"
          className={cn(
            'flex-1 min-h-[calc(100vh-var(--topbar-height))] transition-all duration-[--duration-layout]',
            'lg:ml-[--sidebar-width]',
            className
          )}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  )
}
