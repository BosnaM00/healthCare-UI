import React from 'react'
import { Video, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConsultation } from '../hooks/use-consultation'

interface ConsultationJoinButtonProps {
  consultationId: string
  role: 'PATIENT' | 'MEDIC'
  scheduledStart?: string
  onJoin: () => void
  className?: string
}

/**
 * Renders a join button that:
 * - Is disabled if the consultation has no room URL yet
 * - Is disabled if we are outside the join window (5 min before → 30 min after)
 * - Navigates to the appropriate consultation page on click
 */
export function ConsultationJoinButton({
  consultationId,
  scheduledStart,
  onJoin,
  className,
}: ConsultationJoinButtonProps) {
  const { data: consultation, isLoading } = useConsultation(consultationId)
  const [now, setNow] = React.useState(() => new Date())

  // Tick every 30s to re-evaluate window
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  if (isLoading) {
    return (
      <Button disabled className={className} size="sm">
        <Video className="h-4 w-4" />
        Join consultation
      </Button>
    )
  }

  const status = consultation?.status
  const hasRoom = !!(consultation?.videoRoomUrl || consultation?.videoRoomId)

  // Determine window availability
  let inWindow = true
  let windowLabel: string | null = null
  if (scheduledStart) {
    const start = new Date(scheduledStart)
    const openMs = start.getTime() - 5 * 60_000
    const closeMs = start.getTime() + 30 * 60_000
    inWindow = now.getTime() >= openMs && now.getTime() <= closeMs
    if (now.getTime() < openMs) {
      const minLeft = Math.ceil((openMs - now.getTime()) / 60_000)
      windowLabel = `Available in ${minLeft} min`
    }
  }

  const isCompleted = status === 'COMPLETED' || status === 'CANCELLED' || status === 'FAILED'
  const canJoin = hasRoom && inWindow && !isCompleted

  return (
    <Button
      className={className}
      size="sm"
      onClick={onJoin}
      disabled={!canJoin}
      aria-label={
        !hasRoom
          ? 'Video room not ready yet'
          : !inWindow && windowLabel
            ? windowLabel
            : 'Join video consultation'
      }
    >
      {!inWindow && windowLabel ? (
        <>
          <Clock className="h-4 w-4" />
          {windowLabel}
        </>
      ) : (
        <>
          <Video className="h-4 w-4" />
          Join consultation
        </>
      )}
    </Button>
  )
}
