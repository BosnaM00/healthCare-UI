import React from 'react'
import { Star, Clock, MapPin, Video, UserCheck } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { Medic } from '@/types'

interface MedicCardProps {
  medic: Medic
  onBook?: (medic: Medic) => void
  onViewProfile?: (medic: Medic) => void
  className?: string
}

export function MedicCard({ medic, onBook, onViewProfile, className }: MedicCardProps) {
  const initials = `${medic.firstName[0] ?? ''}${medic.lastName[0] ?? ''}`.toUpperCase()
  const soonest = medic.soonestAvailableSlot
    ? new Date(medic.soonestAvailableSlot)
    : null

  return (
    <article
      className={cn(
        'rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] p-4 shadow-[--shadow-elev-1] hover:shadow-[--shadow-elev-2] transition-shadow flex flex-col gap-4',
        className
      )}
      aria-label={`Dr. ${medic.firstName} ${medic.lastName}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarFallback className="text-base">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[--color-text-primary] truncate">
              Dr. {medic.firstName} {medic.lastName}
            </h3>
            {medic.verificationStatus === 'VERIFIED' && (
              <UserCheck className="h-4 w-4 text-[--color-success] shrink-0" aria-label="Verified medic" />
            )}
          </div>

          {/* Specialties */}
          <div className="flex flex-wrap gap-1 mt-1">
            {medic.specialties.slice(0, 2).map((s) => (
              <Badge key={s.id} variant="secondary" className="text-xs">
                {s.name}
              </Badge>
            ))}
            {medic.specialties.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{medic.specialties.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Rating */}
        {medic.rating != null && (
          <div className="flex items-center gap-1 text-sm shrink-0">
            <Star className="h-4 w-4 fill-[--color-warning] text-[--color-warning]" aria-hidden="true" />
            <span className="font-medium">{medic.rating.toFixed(1)}</span>
            <span className="text-[--color-text-secondary] text-xs">({medic.reviewCount})</span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="space-y-1.5 text-sm text-[--color-text-secondary]">
        {medic.clinicName && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{medic.clinicName}</span>
          </div>
        )}
        {soonest && (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-[--color-success]" aria-hidden="true" />
            <span>
              Available{' '}
              <span className="font-medium text-[--color-text-primary]">
                {formatDate(soonest)}
              </span>
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Video className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{medic.consultationTypes.join(' · ')}</span>
        </div>
      </div>

      {/* Languages */}
      <div className="flex flex-wrap gap-1">
        {medic.languages.map((lang) => (
          <span
            key={lang}
            className="rounded-[--radius-sm] bg-[--color-neutral-100] px-2 py-0.5 text-xs text-[--color-text-secondary]"
          >
            {lang}
          </span>
        ))}
      </div>

      {/* Price + CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-[--color-border]">
        <div>
          <span className="text-lg font-bold text-[--color-text-primary]">
            {medic.pricePerSession}
          </span>{' '}
          <span className="text-sm text-[--color-text-secondary]">{medic.currency}</span>
          <p className="text-xs text-[--color-text-secondary]">per session</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onViewProfile?.(medic)}>
            Profile
          </Button>
          <Button size="sm" onClick={() => onBook?.(medic)}>
            Book
          </Button>
        </div>
      </div>
    </article>
  )
}
