import React, { useState } from 'react'
import {
  Star, MapPin, Video, UserCheck, Globe, Clock, ChevronLeft, Calendar,
} from 'lucide-react'
import { useMedic, useMedicSlots } from '../hooks/use-booking'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton, SkeletonText } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import type { Medic, Slot } from '@/types'
import { cn } from '@/lib/utils'

interface MedicProfilePageProps {
  medicId: string
  onBack?: () => void
  onBook?: (medic: Medic, slot: Slot) => void
}

export function MedicProfilePage({ medicId, onBack, onBook }: MedicProfilePageProps) {
  const { data: medic, isLoading } = useMedic(medicId)
  const { data: slots, isLoading: slotsLoading } = useMedicSlots(medicId)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <SkeletonText lines={4} />
      </div>
    )
  }

  if (!medic) return null

  const initials = `${medic.firstName[0] ?? ''}${medic.lastName[0] ?? ''}`.toUpperCase()

  // Group slots by date
  const slotsByDate = (slots ?? []).reduce<Record<string, Slot[]>>((acc, slot) => {
    const date = new Date(slot.startTime).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date]!.push(slot)
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-3xl">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="gap-2 -ml-2 text-[--color-text-secondary]">
          <ChevronLeft className="h-4 w-4" />
          Back to search
        </Button>
      )}

      {/* Header card */}
      <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] p-6 shadow-[--shadow-elev-1]">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 text-2xl">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[--color-text-primary]">
                Dr. {medic.firstName} {medic.lastName}
              </h1>
              {medic.verificationStatus === 'VERIFIED' && (
                <UserCheck className="h-5 w-5 text-[--color-success]" aria-label="Verified" />
              )}
            </div>

            {/* Specialties */}
            <div className="flex flex-wrap gap-1">
              {medic.specialties.map((s) => (
                <Badge key={s.id} variant="secondary">{s.name}</Badge>
              ))}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[--color-text-secondary]">
              {medic.rating != null && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-[--color-warning] text-[--color-warning]" />
                  <strong className="text-[--color-text-primary]">{medic.rating.toFixed(1)}</strong>
                  ({medic.reviewCount} reviews)
                </span>
              )}
              {medic.clinicName && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {medic.clinicName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                {medic.consultationTypes.join(' & ')}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {medic.languages.join(', ')}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-[--color-text-primary]">
              {medic.pricePerSession}
              <span className="text-base font-normal text-[--color-text-secondary] ml-1">
                {medic.currency}
              </span>
            </p>
            <p className="text-xs text-[--color-text-secondary]">per session</p>
          </div>
        </div>

        {/* Bio */}
        {medic.bio && (
          <>
            <Separator className="my-4" />
            <p className="text-sm text-[--color-text-secondary] leading-relaxed">{medic.bio}</p>
          </>
        )}
      </div>

      {/* Availability calendar */}
      <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] p-6 shadow-[--shadow-elev-1]">
        <h2 className="font-semibold text-[--color-text-primary] flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-[--color-accent]" />
          Available Slots
        </h2>

        {slotsLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : Object.keys(slotsByDate).length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-[--color-text-secondary] py-4">
            <Clock className="h-4 w-4" />
            No available slots in the next 30 days.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(slotsByDate).map(([date, daySlots]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-[--color-text-secondary] mb-2">
                  {new Date(date).toLocaleDateString('en-GB', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id
                    const timeStr = new Date(slot.startTime).toLocaleTimeString('en-GB', {
                      hour: '2-digit', minute: '2-digit',
                    })
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(isSelected ? null : slot)}
                        className={cn(
                          'rounded-[--radius-md] border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-focus-ring]',
                          isSelected
                            ? 'bg-[--color-accent] border-[--color-accent] text-[--color-text-on-brand]'
                            : 'border-[--color-border] hover:border-[--color-accent] hover:text-[--color-accent]'
                        )}
                        aria-pressed={isSelected}
                        aria-label={`${timeStr} ${slot.consultationType}`}
                      >
                        {timeStr}
                        <span className="ml-1.5 text-xs opacity-70">
                          {slot.consultationType === 'VIDEO' ? '🎥' : '🏥'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedSlot && (
          <div className="mt-4 flex items-center justify-between pt-4 border-t border-[--color-border]">
            <div className="text-sm text-[--color-text-secondary]">
              Selected:{' '}
              <span className="font-medium text-[--color-text-primary]">
                {new Date(selectedSlot.startTime).toLocaleDateString('en-GB', {
                  weekday: 'short', day: 'numeric', month: 'short',
                })}{' '}
                at{' '}
                {new Date(selectedSlot.startTime).toLocaleTimeString('en-GB', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
              {' '}· {selectedSlot.consultationType}
            </div>
            <Button onClick={() => medic && selectedSlot && onBook?.(medic, selectedSlot)}>
              Continue to booking
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
