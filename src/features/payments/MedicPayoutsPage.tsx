import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMedicPayouts } from './hooks/use-payments'
import { useAbility } from '@/lib/can'
import type { PayoutRecord } from '@/types'

function formatBani(bani: number, currency: string): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(bani / 100)
}

function PayoutStatusBadge({ status }: { status: PayoutRecord['status'] }) {
  const { t } = useTranslation('payouts')
  const label = t(`payouts.statusLabels.${status}`)
  const variantMap: Record<PayoutRecord['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    paid: 'default',
    pending: 'secondary',
    in_transit: 'secondary',
    canceled: 'outline',
    failed: 'destructive',
  }
  return <Badge variant={variantMap[status]}>{label}</Badge>
}

interface MedicPayoutsPageProps {
  onGoToOnboarding?: () => void
}

export function MedicPayoutsPage({ onGoToOnboarding }: MedicPayoutsPageProps) {
  const { t } = useTranslation('payouts')
  const ability = useAbility()
  const [page, setPage] = useState(0)
  const { data, isLoading, isError } = useMedicPayouts(page)

  if (!ability.can('manage', 'OwnPayouts')) {
    return (
      <div className="px-6 py-8">
        <p className="text-sm text-[--color-danger]">Access denied.</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[--color-text-primary]">
          {t('payouts.title')}
        </h1>
        {onGoToOnboarding && (
          <Button variant="outline" size="sm" onClick={onGoToOnboarding}>
            {t('onboarding.title')}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-[--color-accent]" />
          <span className="sr-only">Loading...</span>
        </div>
      )}

      {isError && (
        <p className="text-sm text-[--color-danger]">Failed to load payout history.</p>
      )}

      {data && data.content.length === 0 && (
        <p className="text-sm text-[--color-text-secondary]">{t('payouts.empty')}</p>
      )}

      {data && data.content.length > 0 && (
        <>
          <div
            className="rounded-[--radius-lg] border border-[--color-border] overflow-hidden"
            role="table"
            aria-label={t('payouts.title')}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 bg-[--color-surface-alt] border-b border-[--color-border] text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wide"
              role="row"
            >
              <span role="columnheader">{t('payouts.columns.amount')}</span>
              <span role="columnheader">{t('payouts.columns.status')}</span>
              <span role="columnheader">{t('payouts.columns.arrival')}</span>
              <span role="columnheader">{t('payouts.columns.actions')}</span>
            </div>

            {/* Table rows */}
            {data.content.map((payout) => (
              <div
                key={payout.id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-4 border-b border-[--color-border] last:border-b-0 items-center hover:bg-[--color-surface-alt] transition-colors"
                role="row"
              >
                <span
                  role="cell"
                  className="text-sm font-semibold text-[--color-text-primary]"
                >
                  {formatBani(payout.amountBani, payout.currency)}
                </span>

                <span role="cell">
                  <PayoutStatusBadge status={payout.status} />
                </span>

                <span role="cell" className="text-sm text-[--color-text-secondary] whitespace-nowrap">
                  {new Date(payout.arrivalDate).toLocaleDateString('ro-RO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>

                <span role="cell">
                  {payout.loginLinkUrl ? (
                    <a
                      href={payout.loginLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[--color-accent] hover:underline"
                      aria-label={t('payouts.viewOnStripe')}
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      {t('payouts.viewOnStripe')}
                    </a>
                  ) : (
                    <span />
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-[--color-text-secondary]">
              <span>
                {page * 20 + 1}–{Math.min((page + 1) * 20, data.totalElements)} / {data.totalElements}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= data.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
