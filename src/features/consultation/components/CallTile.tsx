import React from 'react'
import {
  useParticipantIds,
  useLocalSessionId,
  DailyVideo,
  DailyAudio,
  useMeetingState,
} from '@daily-co/daily-react'
import { User, Loader2, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Single participant tile ──────────────────────────────────────────────────

interface ParticipantTileProps {
  sessionId: string
  isLocal?: boolean
  className?: string
}

function ParticipantTile({ sessionId, isLocal = false, className }: ParticipantTileProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden bg-[--color-neutral-900] flex items-center justify-center',
        className
      )}
    >
      <DailyVideo
        sessionId={sessionId}
        type="video"
        className="w-full h-full object-cover"
        fit="cover"
        mirror={isLocal}
        automirror={isLocal}
      />
      {/* Fallback avatar — DailyVideo is transparent when video is off */}
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <div className="rounded-full bg-[--color-neutral-700] p-4">
          <User className="h-8 w-8 text-white/60" />
        </div>
      </div>
      {isLocal && (
        <span className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/40 rounded px-1.5 py-0.5">
          You
        </span>
      )}
    </div>
  )
}

// ─── Full call tile grid ──────────────────────────────────────────────────────

interface CallTileProps {
  className?: string
}

export function CallTile({ className }: CallTileProps) {
  const meetingState = useMeetingState()
  const remoteIds = useParticipantIds({ filter: 'remote' })
  // useLocalSessionId returns '' when local participant doesn't exist
  const localSessionId = useLocalSessionId()

  if (meetingState === 'joining-meeting' || meetingState === 'loading') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 h-full bg-[--color-neutral-900] text-white/70',
          className
        )}
        aria-live="polite"
        aria-label="Connecting to video call"
      >
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Connecting…</p>
      </div>
    )
  }

  if (meetingState === 'error' || meetingState === 'left-meeting') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 h-full bg-[--color-neutral-900] text-white/70',
          className
        )}
        aria-live="assertive"
      >
        <WifiOff className="h-8 w-8" />
        <p className="text-sm text-center px-4">
          Connection lost.<br />Please refresh to rejoin.
        </p>
      </div>
    )
  }

  const hasRemote = remoteIds.length > 0

  return (
    <div className={cn('relative h-full bg-[--color-neutral-900]', className)}>
      {/* Remote participant — full frame (remoteIds[0] is defined because hasRemote is true) */}
      {hasRemote ? (
        <ParticipantTile
          sessionId={remoteIds[0]!}
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
          <User className="h-10 w-10" />
          <p className="text-sm">Waiting for the other participant…</p>
        </div>
      )}

      {/* Local participant — picture-in-picture corner */}
      {localSessionId && (
        <ParticipantTile
          sessionId={localSessionId}
          isLocal
          className="absolute bottom-3 right-3 w-32 h-24 shadow-lg z-10 border border-white/20"
        />
      )}

      {/* Single DailyAudio component handles all remote audio tracks automatically */}
      <DailyAudio />
    </div>
  )
}
