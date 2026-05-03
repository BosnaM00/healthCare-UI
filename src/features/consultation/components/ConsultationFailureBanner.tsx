import React from 'react'
import { AlertTriangle, RefreshCw, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ConsultationFailureReason } from '@/types'

interface ConsultationFailureBannerProps {
  reason: ConsultationFailureReason
  onReschedule?: () => void
  className?: string
}

interface BannerConfig {
  icon: React.ElementType
  title: string
  description: string
  variant: 'warning' | 'danger' | 'info'
  showReschedule: boolean
}

const BANNER_CONFIG: Record<ConsultationFailureReason, BannerConfig> = {
  MEDIC_NO_SHOW: {
    icon: AlertTriangle,
    title: 'Doctor did not attend',
    description:
      'The doctor was not available for this consultation. A full refund has been issued to your account.',
    variant: 'danger',
    showReschedule: true,
  },
  PATIENT_NO_SHOW: {
    icon: AlertTriangle,
    title: 'Appointment missed',
    description:
      'You were not available at the scheduled time. No refund is available for this consultation.',
    variant: 'warning',
    showReschedule: true,
  },
  TECHNICAL_FAILURE: {
    icon: RefreshCw,
    title: 'Technical issue',
    description:
      'A technical issue prevented the consultation from taking place. A full refund has been issued and you can reschedule.',
    variant: 'warning',
    showReschedule: true,
  },
  MUTUAL_CANCEL: {
    icon: Info,
    title: 'Consultation cancelled',
    description: 'This consultation was cancelled by mutual agreement.',
    variant: 'info',
    showReschedule: false,
  },
  OTHER: {
    icon: Info,
    title: 'Consultation failed',
    description: 'This consultation could not be completed. Please contact support if you have questions.',
    variant: 'info',
    showReschedule: false,
  },
}

export function ConsultationFailureBanner({
  reason,
  onReschedule,
  className,
}: ConsultationFailureBannerProps) {
  const config = BANNER_CONFIG[reason] ?? BANNER_CONFIG.OTHER
  const Icon = config.icon

  const variantClasses: Record<BannerConfig['variant'], string> = {
    danger:
      'bg-[--color-danger]/10 border border-[--color-danger]/20 text-[--color-danger]',
    warning:
      'bg-[--color-warning]/10 border border-[--color-warning]/20 text-[--color-warning]',
    info:
      'bg-[--color-info]/10 border border-[--color-info]/20 text-[--color-info]',
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[--radius-lg] p-4',
        variantClasses[config.variant],
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <Icon className="h-5 w-5 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{config.title}</p>
        <p className="text-xs mt-0.5 text-[--color-text-secondary]">{config.description}</p>
      </div>
      {config.showReschedule && onReschedule && (
        <Button size="sm" variant="outline" onClick={onReschedule} className="shrink-0 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Reschedule
        </Button>
      )}
    </div>
  )
}
