import React from 'react'
import { Calendar, Clock, Video, Search, FileText, ArrowRight, Stethoscope } from 'lucide-react'
import { useMyBookings } from '../hooks/use-booking'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/layout/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/stores/auth.store'
import type { Booking } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_BADGE = {
  SCHEDULED:  { variant: 'info',        label: 'Scheduled' },
  CONFIRMED:  { variant: 'success',     label: 'Confirmed' },
  COMPLETED:  { variant: 'secondary',   label: 'Completed' },
  CANCELLED:  { variant: 'destructive', label: 'Cancelled' },
  NO_SHOW:    { variant: 'warning',     label: 'No show' },
} as const

interface PatientDashboardProps {
  onFindMedic?: () => void
  onViewBooking?: (bookingId: string) => void
}

export function PatientDashboard({ onFindMedic, onViewBooking }: PatientDashboardProps) {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useMyBookings()

  const bookings = data?.content ?? []
  const upcoming = bookings.filter(
    (b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'SCHEDULED'
  ).sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime())

  const nextAppointment = upcoming[0] ?? null
  const pastBookings = bookings.filter((b) => b.bookingStatus === 'COMPLETED').slice(0, 3)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting}, ${user?.firstName}!`}
        description="Here's an overview of your health journey"
        actions={
          <Button onClick={onFindMedic} className="gap-2">
            <Search className="h-4 w-4" />
            Find a doctor
          </Button>
        }
      />

      {/* ── Next appointment hero ──────────────────────────────── */}
      {isLoading ? (
        <SkeletonCard className="h-36" />
      ) : nextAppointment ? (
        <NextAppointmentHero booking={nextAppointment} onView={onViewBooking} />
      ) : (
        <EmptyState
          icon={<Calendar className="h-7 w-7" />}
          title="No upcoming appointments"
          description="Book a consultation with a specialist to get started."
          action={{ label: 'Find a doctor', onClick: () => onFindMedic?.() }}
        />
      )}

      {/* ── Quick stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total bookings', value: bookings.length, icon: <Calendar className="h-5 w-5" /> },
          { label: 'Upcoming', value: upcoming.length, icon: <Clock className="h-5 w-5" /> },
          { label: 'Completed', value: bookings.filter(b => b.bookingStatus === 'COMPLETED').length, icon: <Stethoscope className="h-5 w-5" /> },
          { label: 'Video consults', value: bookings.filter(b => b.consultationType === 'VIDEO').length, icon: <Video className="h-5 w-5" /> },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] p-4 shadow-[--shadow-elev-1]"
          >
            <div className="flex items-center gap-2 text-[--color-accent] mb-2">
              {stat.icon}
              <span className="text-xs font-medium text-[--color-text-secondary] uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-[--color-text-primary]">
              {isLoading ? '–' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Upcoming list ────────────────────────────────────── */}
      {upcoming.length > 1 && (
        <section aria-labelledby="upcoming-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="upcoming-heading" className="font-semibold text-[--color-text-primary]">
              Upcoming appointments
            </h2>
          </div>
          <div className="space-y-3">
            {upcoming.slice(1, 4).map((b) => (
              <BookingRow key={b.id} booking={b} onView={onViewBooking} />
            ))}
          </div>
        </section>
      )}

      {/* ── Recent history ───────────────────────────────────── */}
      {pastBookings.length > 0 && (
        <section aria-labelledby="history-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="history-heading" className="font-semibold text-[--color-text-primary]">
              Recent consultations
            </h2>
            <Button variant="ghost" size="sm" className="gap-1 text-[--color-accent]">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-3">
            {pastBookings.map((b) => (
              <BookingRow key={b.id} booking={b} onView={onViewBooking} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function NextAppointmentHero({
  booking,
  onView,
}: {
  booking: Booking
  onView?: (id: string) => void
}) {
  const startTime = new Date(booking.slot.startTime)
  const medic = booking.medic
  const initials = medic
    ? `${medic.firstName[0] ?? ''}${medic.lastName[0] ?? ''}`.toUpperCase()
    : '?'

  const isToday =
    new Date().toDateString() === startTime.toDateString()
  const isTomorrow =
    new Date(Date.now() + 86400000).toDateString() === startTime.toDateString()

  const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : startTime.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="rounded-[--radius-xl] bg-gradient-to-br from-[--color-brand-500] to-[--color-brand-700] p-6 text-[--color-text-on-brand] shadow-[--shadow-elev-2]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">
              Next appointment
            </p>
            <h2 className="text-2xl font-bold">
              {dayLabel}
            </h2>
            <p className="text-lg opacity-90 font-medium">
              {startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {medic && (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border-2 border-white/30">
                <AvatarFallback className="bg-white/20 text-white text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">Dr. {medic.firstName} {medic.lastName}</p>
                <p className="text-xs opacity-80">
                  {medic.specialties[0]?.name} · {booking.consultationType}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <Badge
            className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
            variant="outline"
          >
            {booking.consultationType === 'VIDEO' ? '🎥 Video' : '🏥 In-person'}
          </Badge>

          <div className="flex gap-2 flex-col sm:flex-row">
            {booking.consultationType === 'VIDEO' && (
              <Button
                size="sm"
                className="bg-white text-[--color-brand-700] hover:bg-white/90 font-semibold"
                aria-label="Join video consultation"
                onClick={() => onView?.(booking.id)}
              >
                <Video className="h-4 w-4 mr-1.5" />
                Join now
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={() => onView?.(booking.id)}
            >
              View details
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingRow({ booking, onView }: { booking: Booking; onView?: (id: string) => void }) {
  const startTime = new Date(booking.slot.startTime)
  const medic = booking.medic
  const status = STATUS_BADGE[booking.bookingStatus]
  const initials = medic
    ? `${medic.firstName[0] ?? ''}${medic.lastName[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <div
      className="flex items-center gap-4 rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] px-4 py-3 shadow-[--shadow-elev-1] hover:shadow-[--shadow-elev-2] transition-shadow cursor-pointer"
      onClick={() => onView?.(booking.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onView?.(booking.id)}
      aria-label={`Booking with Dr. ${medic?.firstName} ${medic?.lastName} on ${startTime.toLocaleDateString()}`}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="text-sm">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[--color-text-primary] truncate">
          Dr. {medic?.firstName} {medic?.lastName}
        </p>
        <p className="text-xs text-[--color-text-secondary]">
          {startTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          {' · '}
          {startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          {' · '}
          {booking.consultationType}
        </p>
      </div>

      <Badge variant={status?.variant as 'success' | 'info' | 'secondary' | 'destructive' | 'warning' | 'default'}>
        {status?.label}
      </Badge>
    </div>
  )
}
