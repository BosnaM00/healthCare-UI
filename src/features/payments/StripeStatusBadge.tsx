import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { PaymentStatus, UserRole } from '@/types'

/** Which contexts a given state is visible in */
const visibilityMap: Record<PaymentStatus, Partial<Record<'patient' | 'medic' | 'operator', boolean>>> = {
  RESERVED:  { patient: true,  medic: true,  operator: true },
  HELD:      { patient: true,  medic: true,  operator: true },
  RELEASED:  { patient: true,  medic: true,  operator: true },
  REFUNDED:  { patient: true,  medic: true,  operator: true },
  DISPUTED:  { patient: false, medic: true,  operator: true },
  FAILED:    { patient: true,  medic: false, operator: true },
  // legacy
  PENDING:   { patient: true,  medic: true,  operator: true },
  CAPTURED:  { patient: true,  medic: true,  operator: true },
}

/** Tailwind colour classes per state */
const colourMap: Record<PaymentStatus, string> = {
  RESERVED:  'bg-amber-100   text-amber-800   border-amber-200   dark:bg-amber-900/20  dark:text-amber-300',
  HELD:      'bg-teal-100    text-teal-800    border-teal-200    dark:bg-teal-900/20   dark:text-teal-300',
  RELEASED:  'bg-green-100   text-green-800   border-green-200   dark:bg-green-900/20  dark:text-green-300',
  REFUNDED:  'bg-slate-100   text-slate-700   border-slate-200   dark:bg-slate-800/30  dark:text-slate-400',
  DISPUTED:  'bg-red-100     text-red-800     border-red-200     dark:bg-red-900/20    dark:text-red-300',
  FAILED:    'bg-red-100     text-red-800     border-red-200     dark:bg-red-900/20    dark:text-red-300',
  PENDING:   'bg-amber-100   text-amber-800   border-amber-200   dark:bg-amber-900/20  dark:text-amber-300',
  CAPTURED:  'bg-teal-100    text-teal-800    border-teal-200    dark:bg-teal-900/20   dark:text-teal-300',
}

type ViewerRole = 'patient' | 'medic' | 'operator'

function roleToViewer(role?: UserRole): ViewerRole {
  if (role === 'MEDIC') return 'medic'
  if (role === 'ADMIN') return 'operator'
  return 'patient'
}

interface StripeStatusBadgeProps {
  state: PaymentStatus
  /**
   * Which role is viewing. Controls visibility & label copy.
   * Defaults to 'patient' if omitted.
   */
  viewerRole?: UserRole | ViewerRole
  className?: string
}

export function StripeStatusBadge({ state, viewerRole, className }: StripeStatusBadgeProps) {
  const { t } = useTranslation('payments')

  // Normalise viewerRole
  const viewer: ViewerRole =
    viewerRole === 'patient' || viewerRole === 'medic' || viewerRole === 'operator'
      ? viewerRole
      : roleToViewer(viewerRole as UserRole | undefined)

  const visible = visibilityMap[state]?.[viewer] ?? true
  if (!visible) return null

  // Use medic-specific label when applicable
  const labelKey =
    viewer === 'medic' && `statusMedic.${state}` in t('statusMedic', { returnObjects: true })
      ? `statusMedic.${state}`
      : `status.${state}`

  const label = t(labelKey)
  if (!label) return null

  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        colourMap[state] ?? colourMap.PENDING,
        className
      )}
    >
      {label}
    </span>
  )
}
