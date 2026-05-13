import React from 'react'
import { Calendar, Users, TrendingUp, Clock, Video, MapPin, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMedicUpcomingBookings, useMedicEarningsSummary } from '../hooks/use-medic'
import { useAuthStore } from '@/stores/auth.store'
import type { Booking } from '@/types'
import { cn } from '@/lib/utils'

function MetricCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[--radius-md] border border-[--color-border] bg-[--color-surface-raised] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[--color-text-tertiary] uppercase tracking-wide">{label}</span>
        <span className="text-[--color-text-tertiary]">{icon}</span>
      </div>
      <p className="text-2xl font-semibold text-[--color-text-primary]">{value}</p>
      {sub && <p className="text-xs text-[--color-text-tertiary] mt-1">{sub}</p>}
    </div>
  )
}

function BookingStatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-info',
    CONFIRMED: 'bg-[--color-accent]',
    COMPLETED: 'bg-[--color-success]',
    CANCELLED: 'bg-[--color-danger]',
    NO_SHOW: 'bg-[--color-warning]',
  }
  return (
    <span
      className={cn('inline-block w-2 h-2 rounded-full shrink-0', colors[status] ?? 'bg-[--color-text-tertiary]')}
      aria-hidden="true"
    />
  )
}

interface MedicDashboardProps {
  onViewPatient: (patientId: string) => void
  onStartConsultation: (bookingId: string, booking: Booking) => void
  onViewSchedule: () => void
}

export function MedicDashboard({ onViewPatient, onStartConsultation, onViewSchedule }: MedicDashboardProps) {
  const user = useAuthStore((s) => s.user)
  const { data: upcomingBookings = [], isLoading } = useMedicUpcomingBookings()
  const { data: earnings } = useMedicEarningsSummary('current-month')

  const todayBookings = upcomingBookings.filter((b) => {
    const d = new Date(b.slot.startTime)
    const today = new Date()
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    )
  })

  const nextBooking = upcomingBookings[0]

  return (
    <div className="px-6 py-6 space-y-6 max-w-5xl">
      <PageHeader
        title={`Good ${getTimeOfDay()}, Dr. ${user?.lastName ?? ''}!`}
        description="Here's your overview for today."
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Today's appointments"
          value={todayBookings.length}
          sub={`${upcomingBookings.length} total upcoming`}
          icon={<Calendar className="h-4 w-4" />}
        />
        <MetricCard
          label="Patients this month"
          value={earnings?.consultationCount ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          label="Earnings this month"
          value={earnings ? `${earnings.totalNet.toLocaleString('ro-RO')} RON` : '—'}
          sub={`After ${((earnings?.platformFee ?? 0) / (earnings?.totalGross || 1) * 100).toFixed(0)}% platform fee`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          label="Avg consultation"
          value={
            earnings?.avgPerConsultation
              ? `${earnings.avgPerConsultation.toLocaleString('ro-RO')} RON`
              : '—'
          }
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Next appointment hero */}
      {nextBooking && (
        <div className="rounded-[--radius-lg] border border-[--color-accent]/30 bg-[--color-accent]/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-[--color-accent] uppercase tracking-wide mb-1">
                Next appointment
              </p>
              <p className="text-lg font-semibold text-[--color-text-primary]">
                Patient #{nextBooking.patientId.slice(-6)}
              </p>
              <div className="flex items-center gap-3 mt-2 text-sm text-[--color-text-secondary]">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  {new Date(nextBooking.slot.startTime).toLocaleString('ro-RO', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="flex items-center gap-1">
                  {nextBooking.consultationType === 'VIDEO' ? (
                    <Video className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {nextBooking.consultationType === 'VIDEO' ? 'Video call' : 'In-person'}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewPatient(nextBooking.patientId)}
              >
                Patient record
              </Button>
              <Button
                size="sm"
                onClick={() => onStartConsultation(nextBooking.id, nextBooking)}
              >
                {nextBooking.consultationType === 'VIDEO' ? 'Join call' : 'Start consultation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Today's schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[--color-text-primary]">Today's Schedule</h2>
          <Button variant="ghost" size="sm" onClick={onViewSchedule} className="gap-1 text-xs">
            Full schedule
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded-[--radius-md] bg-[--color-surface-raised] animate-pulse" />
            ))}
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="rounded-[--radius-md] border border-[--color-border] p-6 text-center">
            <p className="text-sm text-[--color-text-secondary]">No appointments scheduled today.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onViewSchedule}>
              Manage schedule
            </Button>
          </div>
        ) : (
          <ol className="space-y-2" aria-label="Today's appointments">
            {todayBookings.map((booking) => {
              const start = new Date(booking.slot.startTime)
              const end = new Date(booking.slot.endTime)
              const isNow =
                start <= new Date() && new Date() <= end

              return (
                <li
                  key={booking.id}
                  className={cn(
                    'rounded-[--radius-md] border p-3 flex items-center gap-3 transition-colors',
                    isNow
                      ? 'border-[--color-accent]/40 bg-[--color-accent]/5'
                      : 'border-[--color-border] bg-[--color-surface-raised]'
                  )}
                >
                  <div className="text-center w-12 shrink-0">
                    <p className="text-xs font-mono font-medium text-[--color-text-primary]">
                      {start.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-[--color-text-tertiary]">
                      {end.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <Separator orientation="vertical" className="h-8" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <BookingStatusDot status={booking.bookingStatus} />
                      <span className="text-sm font-medium text-[--color-text-primary] truncate">
                        Patient #{booking.patientId.slice(-6)}
                      </span>
                      {isNow && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 ml-1">
                          Now
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-[--color-text-tertiary]">
                      {booking.consultationType === 'VIDEO' ? (
                        <Video className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                      )}
                      <span>{booking.consultationType === 'VIDEO' ? 'Video' : 'In-person'}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onViewPatient(booking.patientId)}
                    >
                      Record
                    </Button>
                    {(booking.bookingStatus === 'SCHEDULED' || booking.bookingStatus === 'CONFIRMED') && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onStartConsultation(booking.id, booking)}
                      >
                        {booking.consultationType === 'VIDEO' ? 'Join' : 'Start'}
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}

function getTimeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
