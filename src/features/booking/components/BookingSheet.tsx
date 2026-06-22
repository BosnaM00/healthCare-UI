import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, AlertTriangle, X, Lock } from 'lucide-react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCreateBooking } from '../hooks/use-booking'
import { useCreatePaymentIntent } from '@/features/payments/hooks/use-payments'
import { StripeProvider } from '@/features/payments/StripeProvider'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { env } from '@/env'
import type { Medic, Slot } from '@/types'

interface BookingSheetProps {
  medic: Medic
  slot: Slot
  open: boolean
  onClose: () => void
  onSuccess?: (bookingId: string) => void
  onPaymentResult?: (bookingId: string, paymentId: string) => void
}

type Step = 'review' | 'payment' | 'done'

/** Inner component — must be inside <StripeProvider> to call Stripe hooks */
function PaymentStep({
  bookingId,
  paymentId,
  amountDisplay,
  onSuccess,
  onCancel,
}: {
  bookingId: string
  paymentId: string
  amountDisplay: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation('payments')
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)
    setErrorMessage(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?booking_result=${bookingId}&payment_id=${paymentId}`,
      },
      // For 3DS flows, Stripe will redirect; for non-redirect flows it resolves immediately
      redirect: 'if_required',
    })

    setIsSubmitting(false)

    if (error) {
      // Map Stripe error codes to i18n keys
      const code = error.decline_code ?? error.code ?? 'default'
      const knownKeys = [
        'card_declined', 'insufficient_funds', 'expired_card',
        'incorrect_cvc', 'processing_error', 'authentication_required', 'generic_decline',
      ]
      const i18nKey = knownKeys.includes(code) ? code : 'default'
      setErrorMessage(t(`errors.${i18nKey}`))
    } else {
      // Payment succeeded without redirect (e.g. SetupIntent or direct confirm)
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <PaymentElement
          onChange={(e) => setIsComplete(e.complete)}
          options={{
            layout: 'tabs',
          }}
        />

        {errorMessage && (
          <div
            role="alert"
            className="rounded-[--radius-lg] border border-[--color-danger]/30 bg-[--color-danger]/5 px-4 py-3 text-sm text-[--color-danger] flex items-start gap-2"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-[--color-text-secondary]">
          <Lock className="h-3 w-3" aria-hidden="true" />
          <span>{t('sheet.paymentSecure')}</span>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('sheet.cancel')}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={!stripe || !elements || !isComplete || isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? t('sheet.processing') : `${t('sheet.confirmPay')} ${amountDisplay}`}
          </Button>
        </div>
      </div>
    </form>
  )
}

export function BookingSheet({
  medic,
  slot,
  open,
  onClose,
  onSuccess,
  onPaymentResult,
}: BookingSheetProps) {
  const { t } = useTranslation('payments')
  const [step, setStep] = useState<Step>('review')
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<{
    paymentId: string
    clientSecret: string
    publishableKey: string
  } | null>(null)

  const createBooking = useCreateBooking()
  const createPaymentIntent = useCreatePaymentIntent()

  const startTime = new Date(slot.startTime)
  const endTime = new Date(slot.endTime)
  const amountDisplay = `${medic.pricePerSession} ${medic.currency}`

  const stripeEnabled = env.featureStripe()

  // Step 1 → 2: create booking then create PaymentIntent
  const handleContinueToPayment = () => {
    if (!policyAccepted) return

    createBooking.mutate(
      {
        slotId: slot.id,
        medicId: medic.id,
        consultationType: slot.consultationType ?? medic.consultationTypes?.[0] ?? 'VIDEO',
        cancellationPolicyAccepted: true,
      },
      {
        onSuccess: (booking) => {
          setBookingId(booking.id)

          if (!stripeEnabled) {
            // Feature-flagged off — skip payment step and go straight to done
            setStep('done')
            onSuccess?.(booking.id)
            return
          }

          // Create a PaymentIntent for this booking
          createPaymentIntent.mutate(booking.id, {
            onSuccess: (intent) => {
              setPaymentData({
                paymentId: intent.paymentId,
                clientSecret: intent.clientSecret,
                publishableKey: intent.publishableKey,
              })
              setStep('payment')
            },
          })
        },
      }
    )
  }

  const handlePaymentSuccess = () => {
    setStep('done')
    if (bookingId && paymentData) {
      onPaymentResult?.(bookingId, paymentData.paymentId)
    }
    onSuccess?.(bookingId ?? '')
  }

  if (!open) return null

  const isCreating = createBooking.isPending || createPaymentIntent.isPending

  const content = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-[--color-surface] shadow-[--shadow-elev-3] flex flex-col animate-in slide-in-from-right duration-[--duration-layout]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-sheet-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[--color-border]">
          <h2 id="booking-sheet-title" className="text-lg font-semibold text-[--color-text-primary]">
            {step === 'done' ? t('sheet.titleDone') : t('sheet.title')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ── Step 1: Review ────────────────────────────────── */}
          {step === 'review' && (
            <>
              <section aria-labelledby="summary-heading">
                <h3
                  id="summary-heading"
                  className="text-sm font-semibold text-[--color-text-secondary] uppercase tracking-wide mb-3"
                >
                  {t('sheet.summary')}
                </h3>
                <div className="rounded-[--radius-lg] border border-[--color-border] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--color-text-secondary]">{t('sheet.doctor')}</span>
                    <span className="text-sm font-medium">Dr. {medic.firstName} {medic.lastName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--color-text-secondary]">{t('sheet.date')}</span>
                    <span className="text-sm font-medium">
                      {startTime.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--color-text-secondary]">{t('sheet.time')}</span>
                    <span className="text-sm font-medium">
                      {startTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {endTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--color-text-secondary]">{t('sheet.type')}</span>
                    <Badge variant="secondary">{slot.consultationType}</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[--color-text-primary]">{t('sheet.total')}</span>
                    <span className="text-base font-bold text-[--color-text-primary]">{amountDisplay}</span>
                  </div>
                </div>
              </section>

              <section aria-labelledby="policy-heading">
                <h3
                  id="policy-heading"
                  className="text-sm font-semibold text-[--color-text-secondary] uppercase tracking-wide mb-3"
                >
                  {t('sheet.policy')}
                </h3>
                <div className="rounded-[--radius-lg] border border-[--color-warning]/30 bg-[--color-warning]/5 p-4 text-sm text-[--color-text-secondary] space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-[--color-warning] mt-0.5 shrink-0" aria-hidden="true" />
                    <p>{t('sheet.policyText')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-3">
                  <Checkbox
                    id="policy-accept"
                    checked={policyAccepted}
                    onCheckedChange={(c) => setPolicyAccepted(c === true)}
                    aria-required="true"
                  />
                  <Label htmlFor="policy-accept" className="cursor-pointer leading-snug text-sm">
                    {t('sheet.policyAccept')}
                  </Label>
                </div>
              </section>
            </>
          )}

          {/* ── Step 2: Payment ───────────────────────────────── */}
          {step === 'payment' && paymentData && (
            <section aria-labelledby="payment-heading">
              <h3
                id="payment-heading"
                className="text-sm font-semibold text-[--color-text-secondary] uppercase tracking-wide mb-4"
              >
                {t('sheet.paymentSection')}
              </h3>
              <StripeProvider
                clientSecret={paymentData.clientSecret}
                publishableKey={paymentData.publishableKey}
              >
                <PaymentStep
                  bookingId={bookingId!}
                  paymentId={paymentData.paymentId}
                  amountDisplay={amountDisplay}
                  onSuccess={handlePaymentSuccess}
                  onCancel={onClose}
                />
              </StripeProvider>
            </section>
          )}

          {/* ── Step 3: Done ──────────────────────────────────── */}
          {step === 'done' && bookingId && (
            <div className="flex flex-col items-center gap-6 py-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[--color-success]/15">
                <CheckCircle2 className="h-10 w-10 text-[--color-success]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[--color-text-primary]">
                  {t('sheet.done.heading')}
                </h3>
                <p className="text-sm text-[--color-text-secondary]">
                  {t('sheet.done.subtext', { name: `${medic.firstName} ${medic.lastName}` })}
                </p>
                <p className="text-xs text-[--color-text-secondary] mt-1">
                  {t('sheet.done.emailNote')}
                </p>
              </div>
              <div className="rounded-[--radius-lg] border border-[--color-border] p-4 w-full text-left text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">{t('sheet.date')}</span>
                  <span className="font-medium">
                    {startTime.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">{t('sheet.time')}</span>
                  <span className="font-medium">
                    {startTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">{t('sheet.done.bookingId')}</span>
                  <span className="font-mono text-xs">{bookingId}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer — only shown for review step; payment step manages its own buttons */}
        {step === 'review' && (
          <div className={cn('border-t border-[--color-border] p-6 flex gap-3')}>
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t('sheet.cancel')}
            </Button>
            <Button
              className="flex-1"
              disabled={!policyAccepted || isCreating}
              loading={isCreating}
              onClick={handleContinueToPayment}
            >
              {t('sheet.confirmPay')} {amountDisplay}
            </Button>
          </div>
        )}

        {step === 'done' && (
          <div className="border-t border-[--color-border] p-6 flex justify-center">
            <Button onClick={onClose}>
              {t('sheet.done.goToBookings')}
            </Button>
          </div>
        )}
      </div>
    </>
  )

  return content
}
