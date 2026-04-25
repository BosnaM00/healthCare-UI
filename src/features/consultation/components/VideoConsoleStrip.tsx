import React, { useState } from 'react'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp,
  Circle, MoreHorizontal, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

interface VideoConsoleStripProps {
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

export function VideoConsoleStrip({
  isRecording = false,
  durationSeconds = 0,
  participantCount = 2,
  onEndCall,
  onToggleScreenShare,
  className,
}: VideoConsoleStripProps) {
  const [micMuted, setMicMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [sharing, setSharing] = useState(false)

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
        <div className="flex items-center gap-3 min-w-[140px]">
          {isRecording && (
            <div className="flex items-center gap-1.5 text-danger text-sm font-medium">
              <Circle className="h-2 w-2 fill-danger text-danger animate-pulse" aria-hidden="true" />
              REC
            </div>
          )}
          <span className="font-mono text-sm text-[--color-text-secondary]" aria-live="off">
            {formatDuration(durationSeconds)}
          </span>
          <span className="sr-only">Call duration</span>
          <div className="flex items-center gap-1 text-[--color-text-tertiary] text-sm">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>{participantCount}</span>
            <span className="sr-only">participants</span>
          </div>
        </div>

        {/* Center — primary controls */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={micMuted ? 'destructive' : 'outline'}
                size="icon"
                onClick={() => setMicMuted((v) => !v)}
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
                variant={videoOff ? 'destructive' : 'outline'}
                size="icon"
                onClick={() => setVideoOff((v) => !v)}
                aria-pressed={videoOff}
                aria-label={videoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {videoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{videoOff ? 'Start video' : 'Stop video'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={sharing ? 'default' : 'outline'}
                size="icon"
                onClick={() => {
                  setSharing((v) => !v)
                  onToggleScreenShare?.()
                }}
                aria-pressed={sharing}
                aria-label={sharing ? 'Stop sharing screen' : 'Share screen'}
              >
                <MonitorUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{sharing ? 'Stop sharing' : 'Share screen'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={onEndCall}
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
        <div className="flex items-center gap-2 min-w-[140px] justify-end">
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
