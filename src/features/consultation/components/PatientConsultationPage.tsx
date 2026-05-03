import React, { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Video, Clock, AlertCircle, Mic, Camera, CheckCircle2 } from 'lucide-react'
import {
  DailyProvider,
  useDaily,
  useDailyEvent,
  useMeetingState,
} from '@daily-co/daily-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/layout/PageHeader'
import { VideoConsoleStrip } from './VideoConsoleStrip'
import { CallTile } from './CallTile'
import { ConsultationFailureBanner } from './ConsultationFailureBanner'
import {
  useConsultation,
  useConsultationPrescriptions,
  useJoinToken,
  useDailyHeartbeat,
} from '../hooks/use-consultation'
import { cn } from '@/lib/utils'
import type { Booking } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minutes before scheduled start that the Join CTA becomes active */
const JOIN_WINDOW_BEFORE_MIN = 5
/** Minutes after scheduled start that the Join CTA stays active */
const JOIN_WINDOW_AFTER_MIN = 30

// ─── Pre-call lobby ────────────────────────────────────────────────────────────

interface LobbyProps {
  booking: Booking
  onJoin: () => void
  isJoining: boolean
}

function Lobby({ booking, onJoin, isJoining }: LobbyProps) {
  const [countdown, setCountdown] = useState<string | null>(null)
  const [canJoin, setCanJoin] = useState(false)
  const [micOk, setMicOk] = useState<boolean | null>(null)
  const [camOk, setCamOk] = useState<boolean | null>(null)
  const [selfTestDone, setSelfTestDone] = useState(false)

  const scheduledStart = new Date(booking.slot.startTime)

  // Tick countdown every second
  useEffect(() => {
    function tick() {
      const now = new Date()
      const diffMs = scheduledStart.getTime() - now.getTime()
      const windowOpenMs = -JOIN_WINDOW_BEFORE_MIN * 60_000
      const windowCloseMs = JOIN_WINDOW_AFTER_MIN * 60_000

      if (diffMs > 0) {
        // Before window — show countdown
        const totalSec = Math.ceil(diffMs / 1_000)
        const h = Math.floor(totalSec / 3600)
        const m = Math.floor((totalSec % 3600) / 60)
        const s = totalSec % 60
        setCountdown(
          h > 0
            ? `${h}h ${String(m).padStart(2, '0')}m`
            : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        )
        // Enable join 5 min before start
        setCanJoin(diffMs <= JOIN_WINDOW_BEFORE_MIN * 60_000)
      } else if (diffMs >= windowOpenMs && -diffMs <= windowCloseMs) {
        setCountdown(null)
        setCanJoin(true)
      } else {
        // Past the window
        setCountdown(null)
        setCanJoin(false)
      }
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [scheduledStart]) // eslint-disable-line react-hooks/exhaustive-deps

  // 5-second mic/camera self-test
  async function runSelfTest() {
    setSelfTestDone(false)
    setMicOk(null)
    setCamOk(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      setMicOk(true)
      setCamOk(true)
      // Keep the stream open for 2s so user can see the preview, then stop
      setTimeout(() => stream.getTracks().forEach((t) => t.stop()), 2_000)
    } catch (err) {
      const e = err as DOMException
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setMicOk(false)
        setCamOk(false)
      } else if (e.name === 'NotFoundError') {
        setMicOk(false)
        setCamOk(false)
      } else {
        setMicOk(false)
        setCamOk(false)
      }
    } finally {
      setSelfTestDone(true)
    }
  }

  const startTime = scheduledStart.toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 max-w-lg mx-auto gap-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[--color-accent]/10 mb-2">
          <Video className="h-8 w-8 text-[--color-accent]" />
        </div>
        <h1 className="text-2xl font-bold text-[--color-text-primary]">Video consultation</h1>
        <p className="text-sm text-[--color-text-secondary]">{startTime}</p>
      </div>

      {/* Countdown to start */}
      {countdown && (
        <div
          className="flex items-center gap-2 px-5 py-3 rounded-[--radius-lg] bg-[--color-info]/10 border border-[--color-info]/20 text-[--color-info]"
          aria-live="polite"
        >
          <Clock className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">
            Starts in <strong className="font-mono">{countdown}</strong>
          </span>
        </div>
      )}

      {/* Self-test section */}
      <div className="w-full rounded-[--radius-lg] border border-[--color-border] p-5 bg-[--color-surface] space-y-4">
        <h2 className="text-sm font-semibold text-[--color-text-secondary] uppercase tracking-wide">
          Device check
        </h2>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-[--color-text-tertiary]" />
            <span>Microphone</span>
          </div>
          {micOk === null ? (
            <Badge variant="outline">Not tested</Badge>
          ) : micOk ? (
            <Badge className="bg-[--color-success]/20 text-[--color-success] border-[--color-success]/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              OK
            </Badge>
          ) : (
            <Badge variant="destructive">Failed</Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-[--color-text-tertiary]" />
            <span>Camera</span>
          </div>
          {camOk === null ? (
            <Badge variant="outline">Not tested</Badge>
          ) : camOk ? (
            <Badge className="bg-[--color-success]/20 text-[--color-success] border-[--color-success]/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              OK
            </Badge>
          ) : (
            <Badge variant="destructive">Failed</Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={runSelfTest}
        >
          {selfTestDone ? 'Re-test devices' : 'Test mic & camera'}
        </Button>
        {selfTestDone && (micOk === false || camOk === false) && (
          <p className="text-xs text-[--color-danger] flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Check that your browser has permission to use the microphone and camera.
          </p>
        )}
      </div>

      {/* Join button */}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={onJoin}
        disabled={!canJoin || isJoining}
        loading={isJoining}
        aria-label={canJoin ? 'Join video consultation' : 'Join button — not available yet'}
      >
        <Video className="h-5 w-5" />
        {isJoining ? 'Joining…' : canJoin ? 'Join consultation' : 'Join (available 5 min before start)'}
      </Button>

      {!canJoin && !countdown && (
        <p className="text-xs text-center text-[--color-text-tertiary]">
          The join window has passed. Contact your doctor if you need to reschedule.
        </p>
      )}
    </div>
  )
}

// ─── Active call view ─────────────────────────────────────────────────────────

interface ActiveCallProps {
  consultationId: string
  booking: Booking
  onBack: () => void
}

function ActiveCall({ consultationId, booking, onBack }: ActiveCallProps) {
  const { data: prescriptions = [] } = useConsultationPrescriptions(consultationId)
  const [callDuration, setCallDuration] = useState(0)
  const call = useDaily()
  const meetingState = useMeetingState()
  const isInCall = meetingState === 'joined-meeting'

  useDailyHeartbeat(consultationId, isInCall)

  // Navigate back when Daily fires left-meeting (triggered by call.leave() in the strip)
  useDailyEvent(
    'left-meeting',
    useCallback(() => {
      onBack()
    }, [onBack])
  )

  useEffect(() => {
    if (!isInCall) return
    const timer = setInterval(() => setCallDuration((s) => s + 1), 1_000)
    return () => clearInterval(timer)
  }, [isInCall])

  function handleEndCall() {
    // VideoConsoleStrip calls call.leave() which fires left-meeting → onBack()
    // If Daily already disconnected, fall back to direct navigation
    if (!call || !isInCall) onBack()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--topbar-height))]">
      {/* Main area — video + prescription summary */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video */}
        <div className="flex-1 bg-black relative">
          <CallTile className="absolute inset-0 w-full h-full" />
        </div>

        {/* Right pane — read-only summary */}
        <div className="w-64 shrink-0 border-l border-[--color-border] bg-[--color-surface] overflow-auto p-4 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[--color-text-tertiary]">
            Consultation
          </h2>
          <div className="text-sm text-[--color-text-secondary] space-y-1">
            <p>
              <span className="font-medium text-[--color-text-primary]">Doctor: </span>
              {booking.medic
                ? `Dr. ${booking.medic.firstName} ${booking.medic.lastName}`
                : `Medic #${booking.medicId.slice(-6)}`}
            </p>
            <p>
              <span className="font-medium text-[--color-text-primary]">Type: </span>
              {booking.consultationType}
            </p>
          </div>

          {prescriptions.length > 0 && (
            <>
              <Separator />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[--color-text-tertiary]">
                Prescriptions
              </h3>
              <ul className="space-y-2">
                {prescriptions.map((rx) => (
                  <li key={rx.id} className="text-xs text-[--color-text-secondary]">
                    {rx.medications.map((m) => m.name).join(', ')}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Console strip */}
      <VideoConsoleStrip
        role="PARTICIPANT"
        isRecording={false}
        durationSeconds={callDuration}
        onEndCall={handleEndCall}
        className="shrink-0"
      />
    </div>
  )
}

// ─── Root page — fetches token, mounts DailyProvider ─────────────────────────

interface PatientConsultationPageProps {
  consultationId: string
  bookingId: string
  booking: Booking
  onBack: () => void
}

export function PatientConsultationPage({
  consultationId,
  bookingId: _bookingId,
  booking,
  onBack,
}: PatientConsultationPageProps) {
  const { data: consultation } = useConsultation(consultationId)
  const joinToken = useJoinToken(consultationId)
  const [joined, setJoined] = useState(false)

  const hasFailed =
    consultation?.status === 'FAILED' || consultation?.status === 'CANCELLED'

  async function handleJoin() {
    await joinToken.mutateAsync()
    setJoined(true)
  }

  // Show failure banner without DailyProvider
  if (hasFailed && consultation?.failureReason) {
    return (
      <div className="space-y-6 max-w-xl px-6 py-8">
        <PageHeader
          title="Consultation"
          actions={
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          }
        />
        <ConsultationFailureBanner
          reason={consultation.failureReason}
          onReschedule={onBack}
        />
      </div>
    )
  }

  const roomUrl = joinToken.data?.roomUrl ?? consultation?.videoRoomUrl ?? ''
  const token = joinToken.data?.token

  return (
    <DailyProvider
      url={joined && roomUrl ? roomUrl : undefined}
      token={joined ? token : undefined}
      subscribeToTracksAutomatically
    >
      <div className={cn('flex flex-col', joined ? 'h-[calc(100vh-var(--topbar-height))]' : '')}>
        {!joined && (
          <>
            <div className="px-6 pt-4 shrink-0">
              <PageHeader
                title="Consultation"
                actions={
                  <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                }
              />
              <Separator />
            </div>
            <Lobby booking={booking} onJoin={handleJoin} isJoining={joinToken.isPending} />
          </>
        )}

        {joined && (
          <ActiveCall
            consultationId={consultationId}
            booking={booking}
            onBack={onBack}
          />
        )}
      </div>
    </DailyProvider>
  )
}
