import React, { useState } from 'react'
import { ArrowLeft, User, Pill, FileText, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { DailyProvider, useDailyEvent, useMeetingState } from '@daily-co/daily-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/layout/PageHeader'
import { VideoConsoleStrip } from './VideoConsoleStrip'
import { CallTile } from './CallTile'
import { NoteEditor } from './NoteEditor'
import { PrescriptionCard, NewPrescriptionForm } from './PrescriptionCard'
import { ConsultationFailureBanner } from './ConsultationFailureBanner'
import {
  useConsultation,
  useConsultationNote,
  useConsultationPrescriptions,
  useSaveNote,
  useIssuePrescription,
  useEndConsultation,
  useJoinToken,
  useDailyHeartbeat,
} from '../hooks/use-consultation'
import type { Booking } from '@/types'

interface MedicConsultationWorkspaceProps {
  consultationId: string
  booking: Booking
  onBack: () => void
  onViewPatient: (patientId: string) => void
}

// ─── Inner workspace — rendered inside DailyProvider ─────────────────────────

interface WorkspaceInnerProps extends MedicConsultationWorkspaceProps {
  roomUrl: string
}

function WorkspaceInner({
  consultationId,
  booking,
  onBack,
  onViewPatient,
  roomUrl: _roomUrl,
}: WorkspaceInnerProps) {
  const [showNewPrescription, setShowNewPrescription] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const { data: consultation } = useConsultation(consultationId)
  const { data: note } = useConsultationNote(consultationId)
  const { data: prescriptions = [] } = useConsultationPrescriptions(consultationId)
  const { mutateAsync: saveNote } = useSaveNote(consultationId)
  const { mutateAsync: issuePrescription } = useIssuePrescription(consultationId)
  const { mutate: endConsultation } = useEndConsultation(consultationId)

  const meetingState = useMeetingState()
  const isInCall = meetingState === 'joined-meeting'

  // Start/stop duration timer based on actual Daily join events
  useDailyEvent('joined-meeting', () => setCallDuration(0))
  useDailyEvent(
    'left-meeting',
    React.useCallback(() => {
      endConsultation()
      onBack()
    }, [endConsultation, onBack])
  )

  // Heartbeat while in call
  useDailyHeartbeat(consultationId, isInCall)

  const isInProgress = consultation?.status === 'IN_PROGRESS'
  const isVideo = booking.consultationType === 'VIDEO'
  const hasFailed =
    consultation?.status === 'FAILED' || consultation?.status === 'CANCELLED'

  // Increment call duration every second while joined
  React.useEffect(() => {
    if (!isInCall) return
    const timer = setInterval(() => setCallDuration((s) => s + 1), 1_000)
    return () => clearInterval(timer)
  }, [isInCall])

  function handleEndCall() {
    // DailyProvider will fire left-meeting which triggers endConsultation + onBack
    // If Daily has already left we fall back to direct call
    if (!isInCall) {
      endConsultation()
      onBack()
    }
  }

  const patientName = `Patient #${booking.patientId.slice(-6)}`

  return (
    <div className="flex flex-col h-[calc(100vh-var(--topbar-height))]">
      {/* Header */}
      <div className="px-6 pt-4 pb-0 shrink-0">
        <PageHeader
          title={`Consultation — ${patientName}`}
          description={
            booking.slot
              ? new Date(booking.slot.startTime).toLocaleString('ro-RO', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : ''
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewPatient(booking.patientId)}
                className="gap-1.5"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                Patient record
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            </div>
          }
        />

        {/* Status banner */}
        {consultation?.status && (
          <div className="flex items-center gap-2 mb-4">
            <Badge
              variant={
                consultation.status === 'IN_PROGRESS'
                  ? 'default'
                  : consultation.status === 'COMPLETED'
                    ? 'secondary'
                    : 'outline'
              }
            >
              {consultation.status.replace('_', ' ')}
            </Badge>
            {isVideo && isInProgress && (
              <Badge variant="outline" className="text-xs gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[--color-success] animate-pulse"
                  aria-hidden="true"
                />
                Live
              </Badge>
            )}
          </div>
        )}

        {/* Failure banner */}
        {hasFailed && consultation?.failureReason && (
          <ConsultationFailureBanner
            reason={consultation.failureReason}
            className="mb-4"
          />
        )}

        <Separator />
      </div>

      {/* Main content — split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Daily.co video pane */}
        {isVideo && (
          <div
            className="w-[340px] shrink-0 bg-black flex items-center justify-center border-r border-[--color-border] relative"
            aria-label="Video call area"
          >
            {consultation?.videoRoomUrl ? (
              <CallTile className="absolute inset-0 w-full h-full" />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-white/70">
                <AlertCircle className="h-8 w-8" aria-hidden="true" />
                <p className="text-sm text-center px-4">
                  Video room not yet assigned.
                  <br />
                  Start the consultation to get a link.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Right: Notes, Prescriptions */}
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="notes" className="h-full flex flex-col">
            <div className="px-6 pt-4 shrink-0">
              <TabsList>
                <TabsTrigger value="notes" className="gap-1.5">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="prescriptions" className="gap-1.5">
                  <Pill className="h-4 w-4" aria-hidden="true" />
                  Prescriptions
                  {prescriptions.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {prescriptions.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="notes" className="flex-1 overflow-auto px-6 py-4">
              <NoteEditor
                consultationId={consultationId}
                initialNote={note}
                onSave={(content, template) => saveNote({ content, template })}
              />
            </TabsContent>

            <TabsContent value="prescriptions" className="flex-1 overflow-auto px-6 py-4 space-y-3">
              {!showNewPrescription && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 w-full"
                  onClick={() => setShowNewPrescription(true)}
                >
                  <Pill className="h-4 w-4" aria-hidden="true" />
                  Issue new prescription
                </Button>
              )}

              {showNewPrescription && (
                <div className="rounded-[--radius-md] border border-[--color-border] p-4 bg-[--color-surface-raised]">
                  <h3 className="text-sm font-medium mb-3">New Prescription</h3>
                  <NewPrescriptionForm
                    consultationId={consultationId}
                    onSubmit={async (data) => {
                      await issuePrescription(data)
                      setShowNewPrescription(false)
                    }}
                    onCancel={() => setShowNewPrescription(false)}
                  />
                </div>
              )}

              {prescriptions.length === 0 && !showNewPrescription && (
                <p className="text-sm text-[--color-text-tertiary] text-center py-8">
                  No prescriptions issued yet
                </p>
              )}

              {prescriptions.map((rx) => (
                <PrescriptionCard
                  key={rx.id}
                  prescription={rx}
                  onReissue={(id) => console.log('Reissue', id)}
                  onDownloadPdf={(id) => console.log('Download PDF', id)}
                />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom: Video console strip */}
      {isVideo && (
        <VideoConsoleStrip
          role="OWNER"
          isRecording={false}
          durationSeconds={callDuration}
          onEndCall={handleEndCall}
          className="shrink-0"
        />
      )}

      {!isVideo && (
        <div className="shrink-0 px-6 py-3 border-t border-[--color-border] bg-[--color-surface] flex justify-end">
          <Button variant="destructive" onClick={handleEndCall} size="sm">
            End Consultation
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Loading state while token is being fetched ───────────────────────────────

function JoinLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--topbar-height))] gap-4 text-[--color-text-secondary]">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">Preparing your consultation room…</p>
    </div>
  )
}

// ─── Public wrapper — fetches token, mounts DailyProvider ────────────────────

export function MedicConsultationWorkspace({
  consultationId,
  booking,
  onBack,
  onViewPatient,
}: MedicConsultationWorkspaceProps) {
  const { data: consultation } = useConsultation(consultationId)
  const joinToken = useJoinToken(consultationId)

  // Auto-fetch OWNER token once the room URL is available
  React.useEffect(() => {
    if (consultation?.videoRoomUrl && !joinToken.data && !joinToken.isPending) {
      joinToken.mutate()
    }
  }, [consultation?.videoRoomUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const roomUrl = joinToken.data?.roomUrl ?? ''
  const token = joinToken.data?.token

  // No room yet — render workspace shell without Daily (video pane shows placeholder)
  if (!roomUrl || !token) {
    return (
      <DailyProvider callObject={null}>
        <WorkspaceInner
          consultationId={consultationId}
          booking={booking}
          onBack={onBack}
          onViewPatient={onViewPatient}
          roomUrl=""
        />
      </DailyProvider>
    )
  }

  // Room + token ready — mount a live Daily call
  return (
    <DailyProvider
      url={roomUrl}
      token={token}
      subscribeToTracksAutomatically
    >
      <WorkspaceInner
        consultationId={consultationId}
        booking={booking}
        onBack={onBack}
        onViewPatient={onViewPatient}
        roomUrl={roomUrl}
      />
    </DailyProvider>
  )
}
