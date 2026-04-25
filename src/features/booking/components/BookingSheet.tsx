import React, { useState } from 'react'
import { CreditCard, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { useCreateBooking } from '../hooks/use-booking'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Medic, Slot } from '@/types'

interface BookingSheetProps {
  medic: Medic
  slot: Slot
  open: boolean
  onClose: () => void
  onSuccess?: (bookingId: string) => void
}

type Step = 'review' | 'payment' | 'done'

export function BookingSheet({ medic, slot, open, onClose, onSuccess }: BookingSheetProps) {
  const [step, setStep] = useState<Step>('review')
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const createBooking = useCreateBooking()

  const startTime = new Date(slot.startTime)
  const endTime = new Date(slot.endTime)

  const handleBookNow = () => {
    if (!policyAccepted) return
    createBooking.mutate(
      {
        slotId: slot.id,
        consultationType: slot.consultationType,
        cancellationPolicyAccepted: true,
      },
      {
        onSuccess: (booking) => {
          setBookingId(booking.id)
          setStep('done')
          onSuccess?.(booking.id)
        },
      }
    )
  }

  if (!open) return null

  return (
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
            {step === 'done' ? 'Booking Confirmed' : 'Book Appointment'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 'review' && (
            <>
              {/* Appointment summary */}
              <section aria-labelledby="summary-heading">
                <h3 id="summary-heading" className="text-sm font-semibold text-[--color-text-secondary] uppercase tracking-wide mb-3">
                  Appointment Summary
                </h3>
                <div className="rounded-[--radius-lg] border border-[--color-border] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--color-text-secondary]">Doctor</span>
                    <span className="text-sm font-medium">Dr. {medic.firstName} {medic.lastName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--color-text-secondary]">Date</span>
                    <span className="text-sm font-medium">
                      {startTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--color-text-secondary]">Time</span>
                    <span className="text-sm font-medium">
                      {startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--color-text-secondary]">Type</span>
                    <Badge variant="secondary">{slot.consultationType}</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[--color-text-primary]">Total</span>
                    <span className="text-base font-bold text-[--color-text-primary]">
                      {medic.pricePerSession} {medic.currency}
                    </span>
                  </div>
                </div>
              </section>

              {/* Cancellation policy */}
              <section aria-labelledby="policy-heading">
                <h3 id="policy-heading" className="text-sm font-semibold text-[--color-text-secondary] uppercase tracking-wide mb-3">
                  Cancellation Policy
                </h3>
                <div className="rounded-[--radius-lg] border border-[--color-warning]/30 bg-[--color-warning]/5 p-4 text-sm text-[--color-text-secondary] space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-[--color-warning] mt-0.5 shrink-0" aria-hidden="true" />
                    <p>
                      <strong className="text-[--color-text-primary]">Free cancellation</strong> up to 24 hours before
                      the appointment. Cancellations within 24 hours will incur a 50% fee.
                    </p>
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
                    I have read and accept the cancellation policy
                  </Label>
                </div>
              </section>

              {/* Payment placeholder */}
              <section aria-labelledby="payment-heading">
                <h3 id="payment-heading" className="text-sm font-semibold text-[--color-text-secondary] uppercase tracking-wide mb-3">
                  Payment
                </h3>
                <div className="rounded-[--radius-lg] border border-[--color-border] p-4 text-sm text-[--color-text-secondary] flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-[--color-accent]" aria-hidden="true" />
                  <span>
                    Stripe Elements will render here when payment service is integrated.
                    <br />
                    <span className="text-xs">Secure · PCI-DSS compliant</span>
                  </span>
                </div>
              </section>
            </>
          )}

          {step === 'done' && bookingId && (
            <div className="flex flex-col items-center gap-6 py-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[--color-success]/15">
                <CheckCircle2 className="h-10 w-10 text-[--color-success]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[--color-text-primary]">
                  You're all set!
                </h3>
                <p className="text-sm text-[--color-text-secondary]">
                  Your appointment with Dr. {medic.firstName} {medic.lastName} is confirmed.
                </p>
                <p className="text-xs text-[--color-text-secondary] mt-1">
                  Confirmation has been sent to your email.
                </p>
              </div>

              <div className="rounded-[--radius-lg] border border-[--color-border] p-4 w-full text-left text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">Date</span>
                  <span className="font-medium">
                    {startTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">Time</span>
                  <span className="font-medium">
                    {startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">Booking ID</span>
                  <span className="font-mono text-xs">{bookingId}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          'border-t border-[--color-border] p-6 flex gap-3',
          step === 'done' ? 'justify-center' : 'justify-between'
        )}>
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!policyAccepted}
                loading={createBooking.isPending}
                onClick={handleBookNow}
              >
                Confirm & Pay {medic.pricePerSession} {medic.currency}
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={onClose}>
              Go to my bookings
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
