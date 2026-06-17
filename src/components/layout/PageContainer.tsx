import React from 'react'
import { cn } from '@/lib/utils'

const SIZE_MAP = {
  narrow: 'max-w-2xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
} as const

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  /** Max content width. Defaults to `default` (max-w-6xl). */
  size?: keyof typeof SIZE_MAP
}

/**
 * Standard page content wrapper — provides consistent responsive padding and a
 * centered, width-constrained content column for every authenticated page.
 */
export function PageContainer({ children, className, size = 'default' }: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4 py-6 sm:px-6 lg:px-8', SIZE_MAP[size], className)}>
      {children}
    </div>
  )
}
