import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle, ExternalLink, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateOnboardingLink, useMedicStripeStatus } from './hooks/use-payments'
import { useAbility } from '@/lib/can'

interface MedicOnboardingPageProps {
  onGoToPayouts?: () => void
}

export function MedicOnboardingPage({ onGoToPayouts }: MedicOnboardingPageProps) {
  const { t } = useTranslation('payouts')
  const ability = useAbility()
  const createLink = useCreateOnboardingLink()
  const { data: status, isLoading, refetch, isFetching } = useMedicStripeStatus()

  // When returning from Stripe onboarding, auto-refresh status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('stripe_onboarding') === 'complete') {
      refetch()
    }
  }, [refetch])

  if (!ability.can('manage', 'OwnPayouts')) {
    return (
      <div className="px-6 py-8 max-w-lg">
        <p className="text-sm text-[--color-danger]">Access denied.</p>
      </div>
    )
  }

  const handleStartOnboarding = () => {
    createLink.mutate(undefined, {
      onSuccess: ({ url }) => {
        window.location.href = url
      },
    })
  }

  const statusItems = [
    { key: 'detailsSubmitted', label: t('onboarding.status.detailsSubmitted'), done: status?.detailsSubmitted ?? false },
    { key: 'chargesEnabled', label: t('onboarding.status.chargesEnabled'), done: status?.chargesEnabled ?? false },
    { key: 'payoutsEnabled', label: t('onboarding.status.payoutsEnabled'), done: status?.payoutsEnabled ?? false },
  ]

  const allDone = status?.onboardingComplete ?? false

  return (
    <div className="px-6 py-8 max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[--color-text-primary]">
          {t('onboarding.title')}
        </h1>
        <p className="mt-2 text-sm text-[--color-text-secondary]">
          {t('onboarding.subtitle')}
        </p>
      </div>

      {/* Status checklist */}
      <section aria-labelledby="checklist-heading">
        <h2
          id="checklist-heading"
          className="text-sm font-semibold text-[--color-text-secondary] uppercase tracking-wide mb-3"
        >
          {t('onboarding.checklist')}
        </h2>

        {isLoading || isFetching ? (
          <div className="flex items-center gap-2 text-sm text-[--color-text-secondary]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{t('onboarding.returnMessage')}</span>
          </div>
        ) : (
          <ul className="space-y-3">
            {statusItems.map((item) => (
              <li key={item.key} className="flex items-center gap-3">
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 text-[--color-success] shrink-0" aria-hidden="true" />
                ) : (
                  <Circle className="h-5 w-5 text-[--color-text-secondary] shrink-0" aria-hidden="true" />
                )}
                <span className={item.done ? 'text-[--color-text-primary] text-sm' : 'text-[--color-text-secondary] text-sm'}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        )}

        {!isLoading && allDone && (
          <div className="mt-4 flex items-center gap-2 rounded-[--radius-lg] border border-[--color-success]/30 bg-[--color-success]/5 px-4 py-3 text-sm text-[--color-success]">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('onboarding.complete')}</span>
          </div>
        )}

        {!isLoading && status && !allDone && (
          <div className="mt-4 flex items-center gap-2 rounded-[--radius-lg] border border-[--color-warning]/30 bg-[--color-warning]/5 px-4 py-3 text-sm text-[--color-warning]">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('onboarding.incomplete')}</span>
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={handleStartOnboarding}
          loading={createLink.isPending}
          disabled={createLink.isPending}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          {t('onboarding.start')}
        </Button>

        {allDone && onGoToPayouts && (
          <Button variant="outline" onClick={onGoToPayouts}>
            {t('payouts.title')}
          </Button>
        )}
      </div>
    </div>
  )
}
