import React, { useState } from 'react'
import {
  ChevronLeft, Calendar, Clock, Video, MapPin, CreditCard,
  AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react'
import { useBooking, useCancelBooking } from '../hooks/use-booking'
import { useConsultationByBookingId } from '@/features/consultation/hooks/use-consultation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { SkeletonText } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { StripeStatusBadge } from '@/features/payments/StripeStatusBadge'
import { ConsultationJoinButton } from '@/features/consultation/components/ConsultationJoinButton'

interface BookingDetailPageProps {
  bookingId: string
  /** Optional — if not supplied the page fetches it via /consultations/booking/:id */
  consultationId?: string
  onBack?: () => void
  onJoinConsultation?: (consultationId: string) => void
}

export function BookingDetailPage({
  bookingId,
  consultationId: consultationIdProp,
  onBack,
  onJoinConsultation,
}: BookingDetailPageProps) {
  const { data: booking, isLoading } = useBooking(bookingId)
  const cancel = useCancelBooking()
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Self-resolve the consultationId if it wasn't threaded through the router
  const { data: consultationByBooking } = useConsultationByBookingId(bookingId)
  const consultationId = consultationIdProp ?? consultationByBooking?.id

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-xl">
        <PageHeader title="Appointment Details" />
        <SkeletonText lines={6} />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-12 text-[--color-text-secondary]">
        Booking not found.
      </div>
    )
  }

  const medic = booking.medic
  const startTime = new Date(booking.slot.startTime)
  const endTime = new Date(booking.slot.endTime)
  const isCancellable = booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'SCHEDULED'
  const isUpcoming = new Date(booking.slot.startTime) > new Date()
  const initials = medic
    ? `${medic.firstName[0] ?? ''}${medic.lastName[0] ?? ''}`.toUpperCase()
    : '?'

  const StatusIcon = {
    CONFIRMED:  <CheckCircle2 className="h-5 w-5 text-[--color-success]" />,
    SCHEDULED:  <Clock className="h-5 w-5 text-[--color-info]" />,
    COMPLETED:  <CheckCircle2 className="h-5 w-5 text-[--color-text-secondary]" />,
    CANCELLED:  <XCircle className="h-5 w-5 text-[--color-danger]" />,
    NO_SHOW:    <AlertTriangle className="h-5 w-5 text-[--color-warning]" />,
  }[booking.bookingStatus]

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="Appointment Details"
        actions={
          onBack ? (
            <Button variant="ghost" onClick={onBack} className="gap-2 -ml-2 text-[--color-text-secondary]">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : undefined
        }
      />

      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-[--radius-lg] p-4 ${
        booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'SCHEDULED'
          ? 'bg-[--color-success]/10 border border-[--color-success]/20'
          : booking.bookingStatus === 'CANCELLED'
          ? 'bg-[--color-danger]/10 border border-[--color-danger]/20'
          : 'bg-[--color-neutral-100] border border-[--color-border]'
      }`}>
        {StatusIcon}
        <div>
          <p className="font-semibold text-[--color-text-primary]">{booking.bookingStatus}</p>
          <p className="text-xs text-[--color-text-secondary]">
            Booked on {new Date(booking.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Doctor info */}
      <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] p-5 shadow-[--shadow-elev-1]">
        <h2 className="text-sm font-semibold text-[--color-text-secondary] uppercase tracking-wide mb-3">
          Doctor
        </h2>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-[--color-text-primary]">
              Dr. {medic?.firstName} {medic?.lastName}
            </p>
            <p className="text-sm text-[--color-text-secondary]">
              {medic?.specialties.map((s) => s.name).join(', ')}
            </p>
            {medic?.clinicName && (
              <p className="text-xs text-[--color-text-secondary] flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {medic.clinicName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Appointment details */}
      <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] p-5 shadow-[--shadow-elev-1] space-y-4">
        <h2 className="text-sm font-semibold text-[--color-text-secondary] uppercase tracking-wide">
          Appointment
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[--color-text-secondary] flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              Date
            </span>
            <p className="font-medium text-[--color-text-primary]">
              {startTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div>
            <span className="text-[--color-text-secondary] flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5" />
              Time
            </span>
            <p className="font-medium text-[--color-text-primary]">
              {startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              {' – '}
              {endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div>
            <span className="text-[--color-text-secondary] flex items-center gap-1.5 mb-1">
              <Video className="h-3.5 w-3.5" />
              Type
            </span>
            <Badge variant="secondary">{booking.consultationType}</Badge>
          </div>
          <div>
            <span className="text-[--color-text-secondary] flex items-center gap-1.5 mb-1">
              <CreditCard className="h-3.5 w-3.5" />
              Payment
            </span>
            <StripeStatusBadge state={booking.paymentStatus} viewerRole="patient" />
          </div>
        </div>
      </div>

      {/* Actions */}
      {isCancellable && isUpcoming && (
        <div className="flex gap-3">
          {booking.consultationType === 'VIDEO' && consultationId && onJoinConsultation ? (
            <ConsultationJoinButton
              consultationId={consultationId}
              role="PATIENT"
              scheduledStart={booking.slot.startTime}
              onJoin={() => onJoinConsultation(consultationId)}
              className="flex-1"
            />
          ) : booking.consultationType === 'VIDEO' ? (
            <Button
              className="flex-1 gap-2"
              disabled
              aria-label="Join video call — available at appointment time"
            >
              <Video className="h-4 w-4" />
              Join consultation
              <span className="text-xs opacity-70">(available at start time)</span>
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="gap-2 text-[--color-danger] border-[--color-danger]/30 hover:bg-[--color-danger]/5"
            onClick={() => setShowCancelDialog(true)}
          >
            Cancel booking
          </Button>
        </div>
      )}

      {/* Cancel confirm dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel appointment?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment with Dr.{' '}
              {medic?.firstName} {medic?.lastName} on{' '}
              {startTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}?
              <br />
              <span className="text-[--color-warning] font-medium mt-1 inline-block">
                Cancellations within 24 hours may incur a 50% fee.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep appointment
            </Button>
            <Button
              variant="destructive"
              loading={cancel.isPending}
              onClick={() => {
                cancel.mutate(bookingId, { onSuccess: () => setShowCancelDialog(false) })
              }}
            >
              Yes, cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
