import React from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavLinkProps {
  to: string
  icon: React.ReactNode
  label: string
  collapsed?: boolean
  onClick?: () => void
}

export function NavLink({ to, icon, label, collapsed, onClick }: NavLinkProps) {
  // Using <a> tags here; in a real app these would be TanStack Router <Link> components
  const isActive = typeof window !== 'undefined' && window.location.pathname.startsWith(to)

  const linkContent = (
    <a
      href={to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-[--radius-md] px-3 py-2 text-sm font-medium transition-colors duration-[--duration-fast]',
        'hover:bg-[--color-surface-raised] hover:text-[--color-text-primary]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-focus-ring]',
        isActive
          ? 'bg-[--color-accent-subtle] text-[--color-accent] font-semibold'
          : 'text-[--color-text-secondary]',
        collapsed && 'justify-center px-2'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="shrink-0" aria-hidden="true">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </a>
  )

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return linkContent
}
