import React, { useState } from 'react'
import { Calendar, Pill, FileText, Microscope, FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TimelineEvent, TimelineEventType } from '@/types'

const EVENT_CONFIG: Record<TimelineEventType, { icon: React.ReactNode; color: string; label: string }> = {
  CONSULTATION: {
    icon: <Calendar className="h-3.5 w-3.5" aria-hidden="true" />,
    color: 'bg-[--color-accent]/10 text-[--color-accent] border-[--color-accent]/20',
    label: 'Consultation',
  },
  PRESCRIPTION: {
    icon: <Pill className="h-3.5 w-3.5" aria-hidden="true" />,
    color: 'bg-[--color-success]/10 text-[--color-success] border-[--color-success]/20',
    label: 'Prescription',
  },
  LAB_RESULT: {
    icon: <Microscope className="h-3.5 w-3.5" aria-hidden="true" />,
    color: 'bg-info/10 text-info border-info/20',
    label: 'Lab Result',
  },
  DOCUMENT: {
    icon: <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />,
    color: 'bg-[--color-warning]/10 text-[--color-warning] border-[--color-warning]/20',
    label: 'Document',
  },
  BOOKING: {
    icon: <Calendar className="h-3.5 w-3.5" aria-hidden="true" />,
    color: 'bg-[--color-surface-raised] text-[--color-text-secondary] border-[--color-border]',
    label: 'Booking',
  },
}

const FILTER_OPTIONS: Array<{ value: TimelineEventType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'CONSULTATION', label: 'Consultations' },
  { value: 'PRESCRIPTION', label: 'Prescriptions' },
  { value: 'LAB_RESULT', label: 'Lab Results' },
  { value: 'DOCUMENT', label: 'Documents' },
]

interface PatientTimelineProps {
  events: TimelineEvent[]
  maxItems?: number
}

export function PatientTimeline({ events, maxItems }: PatientTimelineProps) {
  const [filter, setFilter] = useState<TimelineEventType | 'ALL'>('ALL')
  const [showAll, setShowAll] = useState(!maxItems)

  const filtered = events
    .filter((e) => filter === 'ALL' || e.type === filter)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const visible = showAll ? filtered : filtered.slice(0, maxItems ?? filtered.length)

  return (
    <div>
      {/* Filter */}
      <div className="flex flex-wrap gap-1 mb-4" role="group" aria-label="Filter timeline events">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
              filter === opt.value
                ? 'bg-[--color-accent] text-white border-[--color-accent]'
                : 'bg-transparent text-[--color-text-secondary] border-[--color-border] hover:border-[--color-accent]/40'
            )}
            aria-pressed={filter === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-[--color-text-tertiary] py-8 text-center">No events to display</p>
      ) : (
        <ol className="relative" aria-label="Patient timeline">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[--color-border]" aria-hidden="true" />

          {visible.map((event, idx) => {
            const cfg = EVENT_CONFIG[event.type]
            const date = new Date(event.timestamp)

            return (
              <li key={event.id} className="relative pl-7 pb-6 last:pb-0">
                {/* Dot */}
                <div
                  className={cn(
                    'absolute left-0 top-1 w-[15px] h-[15px] rounded-full border flex items-center justify-center',
                    cfg.color
                  )}
                  aria-hidden="true"
                >
                  {cfg.icon}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[--color-text-primary]">
                        {event.title}
                      </span>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', cfg.color)}>
                        {cfg.label}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-xs text-[--color-text-secondary] mt-0.5">{event.description}</p>
                    )}
                  </div>
                  <time
                    dateTime={event.timestamp}
                    className="text-xs text-[--color-text-tertiary] whitespace-nowrap shrink-0"
                  >
                    {date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </time>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {!showAll && filtered.length > (maxItems ?? 0) && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 w-full text-xs"
          onClick={() => setShowAll(true)}
        >
          Show {filtered.length - (maxItems ?? 0)} more events
        </Button>
      )}
    </div>
  )
}
