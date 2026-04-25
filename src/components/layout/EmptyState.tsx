import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-[--radius-lg] border border-dashed border-[--color-border] p-12 text-center',
        className
      )}
      role="status"
      aria-label={title}
    >
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--color-accent-subtle] text-[--color-accent]">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[--color-text-primary]">{title}</h3>
        {description && (
          <p className="text-sm text-[--color-text-secondary] max-w-sm">{description}</p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
