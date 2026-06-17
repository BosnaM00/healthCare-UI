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
      {/* Skip to content — keyboard / screen-reader accessibility (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-[--radius-md] focus:bg-[--color-surface] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[--color-text-primary] focus:shadow-[--shadow-elev-2] focus:outline-none focus:ring-2 focus:ring-[--color-focus-ring]"
      >
        Skip to main content
      </a>

      <Topbar onMenuClick={() => setSidebarOpen(true)} onNavigate={onNavigate} />

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
          // Trap focus inside the mobile drawer by deactivating the content behind it
          inert={sidebarOpen || undefined}
        >
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  )
}
