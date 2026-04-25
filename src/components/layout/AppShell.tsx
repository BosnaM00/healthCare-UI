import React, { useState } from 'react'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[--color-background]">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
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
          <div className="p-4 sm:p-6 lg:p-8 max-w-[--content-max-width] mx-auto">
            {children}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  )
}
