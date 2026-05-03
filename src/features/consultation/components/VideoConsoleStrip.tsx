import React from 'react'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp,
  Circle, MoreHorizontal, Users, Wifi, WifiOff,
} from 'lucide-react'
import {
  useLocalParticipant,
  useNetwork,
  useScreenShare,
  useParticipantIds,
  useDaily,
  useMeetingState,
} from '@daily-co/daily-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

interface VideoConsoleStripProps {
  /** OWNER = medic; PARTICIPANT = patient */
  role?: 'OWNER' | 'PARTICIPANT'
  isRecording?: boolean
  durationSeconds?: number
  participantCount?: number
  onEndCall: () => void
  onToggleScreenShare?: () => void
  className?: string
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Network quality dot ───────────────────────────────────────────────────────

function NetworkDot({ quality }: { quality: string | undefined }) {
  const classes =
    quality === 'good'
      ? 'bg-[--color-success]'
      : quality === 'low'
        ? 'bg-[--color-warning]'
        : quality === 'very-low'
          ? 'bg-[--color-danger] animate-pulse'
          : 'bg-[--color-neutral-400]'

  const label =
    quality === 'good'
      ? 'Good network'
      : quality === 'low'
        ? 'Low network quality'
        : quality === 'very-low'
          ? 'Very low network quality'
          : 'Network quality unknown'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 cursor-default" aria-label={label}>
          {quality === 'very-low' ? (
            <WifiOff className="h-4 w-4 text-[--color-danger]" />
          ) : (
            <Wifi className={cn('h-4 w-4', quality === 'low' ? 'text-[--color-warning]' : 'text-[--color-text-tertiary]')} />
          )}
          <span className={cn('h-2 w-2 rounded-full', classes)} aria-hidden="true" />
        </div>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

// ─── Main strip ───────────────────────────────────────────────────────────────

export function VideoConsoleStrip({
  role = 'PARTICIPANT',
  isRecording = false,
  durationSeconds = 0,
  onEndCall,
  className,
}: VideoConsoleStripProps) {
  const call = useDaily()
  const meetingState = useMeetingState()
  const localParticipant = useLocalParticipant()
  const remoteIds = useParticipantIds({ filter: 'remote' })
  const { screens, startScreenShare, stopScreenShare, isSharingScreen } = useScreenShare()
  const { threshold: networkQuality } = useNetwork()

  const isInCall = meetingState === 'joined-meeting'
  const micMuted = localParticipant?.audio === false
  const camOff = localParticipant?.video === false
  const participantCount = 1 + remoteIds.length + screens.length

  function toggleMic() {
    if (!call) return
    call.setLocalAudio(micMuted)
  }

  function toggleCamera() {
    if (!call) return
    call.setLocalVideo(camOff)
  }

  function toggleScreenShare() {
    if (isSharingScreen) {
      stopScreenShare()
    } else {
      startScreenShare()
    }
  }

  function handleEndCall() {
    if (call && isInCall) {
      call.leave()
    } else {
      onEndCall()
    }
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center justify-between gap-4 px-6 py-3 bg-[--color-surface] border-t border-[--color-border]',
          className
        )}
        role="toolbar"
        aria-label="Video call controls"
      >
        {/* Left — call status */}
        <div className="flex items-center gap-3 min-w-[160px]">
          {isRecording && (
            <div className="flex items-center gap-1.5 text-danger text-sm font-medium">
              <Circle className="h-2 w-2 fill-danger text-danger animate-pulse" aria-hidden="true" />
              REC
            </div>
          )}
          <span
            className="font-mono text-sm text-[--color-text-secondary]"
            aria-live="off"
            aria-label={`Call duration ${formatDuration(durationSeconds)}`}
          >
            {formatDuration(durationSeconds)}
          </span>
          <div className="flex items-center gap-1 text-[--color-text-tertiary] text-sm">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span aria-label={`${participantCount} participants`}>{participantCount}</span>
          </div>
          <NetworkDot quality={networkQuality} />
        </div>

        {/* Center — primary controls */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={micMuted ? 'destructive' : 'outline'}
                size="icon"
                onClick={toggleMic}
                disabled={!isInCall}
                aria-pressed={micMuted}
                aria-label={micMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {micMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{micMuted ? 'Unmute' : 'Mute'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={camOff ? 'destructive' : 'outline'}
                size="icon"
                onClick={toggleCamera}
                disabled={!isInCall}
                aria-pressed={camOff}
                aria-label={camOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {camOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{camOff ? 'Start video' : 'Stop video'}</TooltipContent>
          </Tooltip>

          {/* Screen share — OWNER (medic) only */}
          {role === 'OWNER' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSharingScreen ? 'default' : 'outline'}
                  size="icon"
                  onClick={toggleScreenShare}
                  disabled={!isInCall}
                  aria-pressed={isSharingScreen}
                  aria-label={isSharingScreen ? 'Stop sharing screen' : 'Share screen'}
                >
                  <MonitorUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isSharingScreen ? 'Stop sharing' : 'Share screen'}</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={handleEndCall}
                aria-label="End call"
                className="bg-danger hover:bg-danger/90"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>End call</TooltipContent>
          </Tooltip>
        </div>

        {/* Right — badges */}
        <div className="flex items-center gap-2 min-w-[160px] justify-end">
          {isRecording && (
            <Badge variant="destructive" className="text-xs">
              Recording
            </Badge>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More options">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More options</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
