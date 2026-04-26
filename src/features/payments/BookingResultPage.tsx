import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStripe } from '@stripe/react-stripe-js'
import type { PaymentIntent } from '@stripe/stripe-js'
import { CheckCircle2, AlertTriangle, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StripeProvider } from './StripeProvider'
import { usePayment } from './hooks/use-payments'

interface BookingResultPageProps {
  bookingId: string
  paymentId: string
  clientSecret: string
  publishableKey: string
  onViewBooking: (bookingId: string) => void
  onRetry: () => void
}

/** Inner component — must be inside <StripeProvider> to call useStripe() */
function ResultContent({
  bookingId,
  paymentId,
  clientSecret,
  onViewBooking,
  onRetry,
}: Omit<BookingResultPageProps, 'publishableKey'>) {
  const { t } = useTranslation('payments')
  const stripe = useStripe()
  const [intentStatus, setIntentStatus] = useState<PaymentIntent['status'] | null>(null)
  const [stripeLoading, setStripeLoading] = useState(true)

  // Poll backend payment record for up to 30s if webhook hasn't landed yet
  const [pollEnabled, setPollEnabled] = useState(false)
  const pollCount = useRef(0)
  const MAX_POLLS = 10
  const POLL_INTERVAL_MS = 3000

  const { data: payment } = usePayment(pollEnabled ? paymentId : null)

  // Retrieve PaymentIntent status from Stripe
  useEffect(() => {
    if (!stripe || !clientSecret) return

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      setStripeLoading(false)
      if (paymentIntent) {
        setIntentStatus(paymentIntent.status)
        // If still processing, start polling the backend
        if (paymentIntent.status === 'processing' || paymentIntent.status === 'requires_action') {
          setPollEnabled(true)
        }
      }
    })
  }, [stripe, clientSecret])

  // Stop polling once backend confirms HELD state or after max polls
  useEffect(() => {
    if (!pollEnabled) return
    if (payment?.state === 'HELD' || payment?.state === 'RELEASED') {
      setPollEnabled(false)
      setIntentStatus('succeeded')
      return
    }
    pollCount.current += 1
    if (pollCount.current >= MAX_POLLS) {
      setPollEnabled(false)
    }
  }, [payment, pollEnabled])

  // Re-enable polling every 3s
  useEffect(() => {
    if (!pollEnabled) return
    const timer = setInterval(() => {
      // TanStack Query handles the actual re-fetch via staleTime; we just need to trigger it
      pollCount.current += 1
      if (pollCount.current >= MAX_POLLS) {
        setPollEnabled(false)
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [pollEnabled])

  if (stripeLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4" role="status" aria-live="polite">
        <Loader2 className="h-10 w-10 animate-spin text-[--color-accent]" />
        <span className="text-sm text-[--color-text-secondary]">{t('result.title')}…</span>
      </div>
    )
  }

  if (intentStatus === 'succeeded') {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center max-w-md mx-auto">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[--color-success]/15">
          <CheckCircle2 className="h-10 w-10 text-[--color-success]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[--color-text-primary]">
            {t('result.succeeded')}
          </h1>
          <p className="text-sm text-[--color-text-secondary]">
            {t('result.succeeded_desc')}
          </p>
        </div>
        <Button onClick={() => onViewBooking(bookingId)}>
          {t('result.viewBooking')}
        </Button>
      </div>
    )
  }

  if (intentStatus === 'processing') {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center max-w-md mx-auto">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[--color-warning]/15">
          <Clock className="h-10 w-10 text-[--color-warning]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[--color-text-primary]">
            {t('result.processing')}
          </h1>
          <p className="text-sm text-[--color-text-secondary]">
            {t('result.processing_desc')}
          </p>
        </div>
        {pollEnabled && (
          <div className="flex items-center gap-2 text-xs text-[--color-text-secondary]">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Checking payment status…</span>
          </div>
        )}
        <Button variant="outline" onClick={() => onViewBooking(bookingId)}>
          {t('result.viewBooking')}
        </Button>
      </div>
    )
  }

  if (intentStatus === 'requires_action') {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center max-w-md mx-auto">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[--color-warning]/15">
          <AlertTriangle className="h-10 w-10 text-[--color-warning]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[--color-text-primary]">
            {t('result.requires_action')}
          </h1>
          <p className="text-sm text-[--color-text-secondary]">
            {t('result.requires_action_desc')}
          </p>
        </div>
        <Button onClick={onRetry}>{t('result.retry')}</Button>
      </div>
    )
  }

  // failed / canceled / unknown
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center max-w-md mx-auto">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[--color-danger]/15">
        <AlertTriangle className="h-10 w-10 text-[--color-danger]" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[--color-text-primary]">
          {intentStatus === 'requires_payment_method'
            ? t('result.failed')
            : t('result.unknown')}
        </h1>
        <p className="text-sm text-[--color-text-secondary]">
          {intentStatus === 'requires_payment_method'
            ? t('result.failed_desc')
            : `Status: ${intentStatus ?? 'unknown'}`}
        </p>
      </div>
      <Button onClick={onRetry}>{t('result.retry')}</Button>
    </div>
  )
}

/** Public wrapper — handles the StripeProvider setup */
export function BookingResultPage(props: BookingResultPageProps) {
  const { t } = useTranslation('payments')

  return (
    <div className="px-6 py-8">
      <h2 className="text-lg font-semibold text-[--color-text-primary] mb-6">{t('result.title')}</h2>
      <StripeProvider
        clientSecret={props.clientSecret}
        publishableKey={props.publishableKey}
      >
        <ResultContent {...props} />
      </StripeProvider>
    </div>
  )
}
