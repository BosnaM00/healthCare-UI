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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[--color-background]">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={onNavigate}
          currentPath={currentPath}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />

        {/* Main content — offset by sidebar width on desktop */}
        <main
          id="main-content"
          className={cn(
            'flex-1 min-h-[calc(100vh-var(--topbar-height))] transition-all duration-[--duration-layout]',
            sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60',
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
