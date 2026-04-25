import React, { useState } from 'react'
import {
  AlertOctagon, CheckCircle2, XCircle, Clock, Filter, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAdminDisputes, useResolveDispute, useCloseDispute } from '../hooks/use-admin'
import { cn } from '@/lib/utils'
import type { Dispute, DisputeStatus } from '@/types'

const STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string; icon: React.ReactNode }> = {
  OPEN: {
    label: 'Open',
    color: 'text-danger bg-danger/10 border-danger/20',
    icon: <AlertOctagon className="h-3 w-3" aria-hidden="true" />,
  },
  UNDER_REVIEW: {
    label: 'Under review',
    color: 'text-[--color-warning] bg-[--color-warning]/10 border-[--color-warning]/20',
    icon: <Clock className="h-3 w-3" aria-hidden="true" />,
  },
  RESOLVED_PATIENT: {
    label: 'Resolved — patient',
    color: 'text-[--color-success] bg-[--color-success]/10 border-[--color-success]/20',
    icon: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
  },
  RESOLVED_MEDIC: {
    label: 'Resolved — medic',
    color: 'text-info bg-info/10 border-info/20',
    icon: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
  },
  CLOSED: {
    label: 'Closed',
    color: 'text-[--color-text-tertiary] bg-[--color-surface-raised] border-[--color-border]',
    icon: <XCircle className="h-3 w-3" aria-hidden="true" />,
  },
}

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'RESOLVED_PATIENT', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
]

const REASON_LABELS: Record<string, string> = {
  NO_SHOW_MEDIC: 'Medic no-show',
  NO_SHOW_PATIENT: 'Patient no-show',
  POOR_SERVICE: 'Poor service',
  TECHNICAL_ISSUE: 'Technical issue',
  BILLING: 'Billing',
  OTHER: 'Other',
}

interface ResolveDialogState {
  dispute: Dispute
  favour: 'PATIENT' | 'MEDIC'
}

export function AdminDisputeQueue() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [resolveState, setResolveState] = useState<ResolveDialogState | null>(null)
  const [resolution, setResolution] = useState('')

  const { data, isLoading } = useAdminDisputes({ status: statusFilter || undefined, page })
  const { mutateAsync: resolve, isPending: isResolving } = useResolveDispute()
  const { mutate: closeDispute } = useCloseDispute()

  const disputes = data?.content ?? []
  const totalPages = data?.totalPages ?? 1

  async function handleResolve() {
    if (!resolveState || !resolution.trim()) return
    await resolve({
      id: resolveState.dispute.id,
      resolution,
      favour: resolveState.favour,
    })
    setResolveState(null)
    setResolution('')
  }

  const selectedLabel = STATUS_FILTERS.find((f) => f.value === statusFilter)?.label ?? 'All statuses'

  return (
    <div className="px-6 py-6 space-y-5 max-w-5xl">
      <PageHeader
        title="Dispute Queue"
        description="Review and resolve patient–medic disputes."
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                {selectedLabel}
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_FILTERS.map((f) => (
                <DropdownMenuItem
                  key={f.value}
                  onClick={() => { setStatusFilter(f.value); setPage(0) }}
                >
                  {f.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-[--radius-md] bg-[--color-surface-raised] animate-pulse" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div className="rounded-[--radius-md] border border-[--color-border] py-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-[--color-success] mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-[--color-text-primary]">No disputes found</p>
          <p className="text-xs text-[--color-text-tertiary] mt-1">
            {statusFilter ? `No disputes with status "${selectedLabel}"` : 'All clear!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Dispute queue">
          {disputes.map((dispute) => {
            const cfg = STATUS_CONFIG[dispute.status]
            const filed = new Date(dispute.createdAt).toLocaleDateString('ro-RO', {
              day: '2-digit', month: 'short', year: 'numeric',
            })

            return (
              <article
                key={dispute.id}
                className="rounded-[--radius-md] border border-[--color-border] bg-[--color-surface-raised] p-4"
                role="listitem"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-[--color-text-primary]">
                        Booking #{dispute.bookingId.slice(-8)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0 gap-1', cfg.color)}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {REASON_LABELS[dispute.reason] ?? dispute.reason}
                      </Badge>
                    </div>

                    <p className="text-sm text-[--color-text-secondary] line-clamp-2 mb-2">
                      {dispute.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[--color-text-tertiary]">
                      <span>Filed by: <strong className="text-[--color-text-secondary]">{dispute.filedBy}</strong></span>
                      {dispute.patientName && (
                        <span>Patient: <strong className="text-[--color-text-secondary]">{dispute.patientName}</strong></span>
                      )}
                      {dispute.medicName && (
                        <span>Medic: <strong className="text-[--color-text-secondary]">{dispute.medicName}</strong></span>
                      )}
                      <span>{filed}</span>
                    </div>

                    {dispute.resolution && (
                      <div className="mt-2 text-xs text-[--color-text-secondary] bg-[--color-surface] rounded px-2 py-1 border border-[--color-border]">
                        <strong>Resolution:</strong> {dispute.resolution}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {(dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW') && (
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setResolveState({ dispute, favour: 'PATIENT' as const })}
                      >
                        Favour patient
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setResolveState({ dispute, favour: 'MEDIC' as const })}
                      >
                        Favour medic
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-[--color-text-tertiary]"
                        onClick={() => closeDispute(dispute.id)}
                      >
                        Close
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-[--color-text-secondary]">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Resolve dialog */}
      <Dialog open={!!resolveState} onOpenChange={() => setResolveState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Resolve dispute — in favour of{' '}
              <span className="text-[--color-accent]">{resolveState?.favour}</span>
            </DialogTitle>
            <DialogDescription>
              This action will release or refund the payment accordingly. Provide a brief explanation.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Explain the resolution decision…"
            className="min-h-[100px]"
            aria-label="Resolution notes"
          />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResolveState(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolution.trim() || isResolving}
            >
              {isResolving ? 'Resolving…' : 'Confirm resolution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
