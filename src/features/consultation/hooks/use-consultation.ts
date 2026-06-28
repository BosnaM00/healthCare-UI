import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import type {
  Consultation,
  ConsultationNote,
  ConsultationDiagnostics,
  JoinTokenResponse,
  Prescription,
} from '@/types'

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useConsultation(consultationId: string) {
  return useQuery({
    queryKey: ['consultation', consultationId],
    queryFn: () => api.get<Consultation>(`/consultations/${consultationId}`),
    enabled: !!consultationId,
    // Poll every 5s while a call is active; rely on stale cache otherwise
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'IN_PROGRESS' ? 5_000 : false
    },
    staleTime: (query) => {
      const status = query.state.data?.status
      return status === 'IN_PROGRESS' ? 5_000 : 60_000
    },
  })
}

export function useConsultationNote(consultationId: string) {
  return useQuery({
    queryKey: ['consultation-note', consultationId],
    queryFn: () => api.get<ConsultationNote>(`/consultations/${consultationId}/notes`),
    enabled: !!consultationId,
  })
}

/**
 * Backend prescription shape. The real backend stores the whole prescription as a
 * single (encrypted) `content` blob — it has no structured medication columns — so
 * we serialize the form into `content` on write and parse it back on read.
 */
export interface RawPrescription {
  id: string
  consultationId: string
  content: string
  pdfUrl?: string | null
  createdAt: string
}

/** Maps a backend prescription (content blob) into the structured frontend shape. */
export function parsePrescription(raw: RawPrescription): Prescription {
  let parsed: Partial<Prescription> = {}
  try {
    parsed = JSON.parse(raw.content) as Partial<Prescription>
  } catch {
    // Legacy / plain-text content — surface it as notes so nothing is lost
    parsed = { notes: raw.content }
  }
  return {
    id: raw.id,
    consultationId: raw.consultationId,
    patientId: parsed.patientId ?? '',
    medicId: parsed.medicId ?? '',
    issuedAt: raw.createdAt,
    expiresAt: parsed.expiresAt,
    diagnosis: parsed.diagnosis,
    notes: parsed.notes,
    signatureUrl: raw.pdfUrl ?? undefined,
    medications: Array.isArray(parsed.medications)
      ? parsed.medications.map((m, i) => ({
          id: m.id ?? `med-${i}`,
          name: m.name ?? '',
          dosage: m.dosage ?? '',
          unit: m.unit ?? '',
          frequency: m.frequency ?? '',
          durationDays: Number(m.durationDays) || 0,
          instructions: m.instructions,
          interactionWarning: m.interactionWarning,
        }))
      : [],
  }
}

/**
 * Downloads a prescription's PDF (generated server-side) and saves it via the browser.
 * Shared by the patient prescriptions page, the medic patient-record page and the in-call
 * workspace. Surfaces a toast on failure so the buttons give feedback either way.
 */
export async function downloadPrescriptionPdf(prescriptionId: string) {
  try {
    await api.download(`/prescriptions/${prescriptionId}/pdf`, `prescription-${prescriptionId}.pdf`)
  } catch {
    toast({
      title: 'Download failed',
      description: 'Could not generate the prescription PDF. Please try again.',
      variant: 'destructive',
    })
  }
}

export function useConsultationPrescriptions(consultationId: string) {
  return useQuery({
    queryKey: ['consultation-prescriptions', consultationId],
    queryFn: async () => {
      const raw = await api.get<RawPrescription[]>(
        `/prescriptions/consultation/${consultationId}`,
      )
      return raw.map(parsePrescription)
    },
    enabled: !!consultationId,
  })
}

/**
 * Looks up the consultation linked to a given booking.
 * Used by BookingDetailPage so the patient can join without the
 * consultationId being threaded through the router.
 */
export function useConsultationByBookingId(bookingId: string) {
  return useQuery({
    queryKey: ['consultation-by-booking', bookingId],
    queryFn: () => api.get<Consultation>(`/consultations/booking/${bookingId}`),
    enabled: !!bookingId,
    staleTime: 30_000,
  })
}

export function useConsultationDiagnostics(consultationId: string, enabled = false) {
  return useQuery({
    queryKey: ['consultation-diagnostics', consultationId],
    queryFn: () =>
      api.get<ConsultationDiagnostics>(`/consultations/${consultationId}/diagnostics`),
    enabled: !!consultationId && enabled,
    refetchInterval: enabled ? 10_000 : false,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSaveNote(consultationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { content: string; template: string }) =>
      api.put(`/consultations/${consultationId}/notes`, { notes: payload.content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultation-note', consultationId] }),
  })
}

export function useIssuePrescription(consultationId: string) {
  const qc = useQueryClient()
  return useMutation({
    // Backend accepts a single non-blank `content` field; serialize the structured
    // form (diagnosis, notes, medications) into it.
    mutationFn: (payload: unknown) =>
      api.post<RawPrescription>(`/prescriptions/consultation/${consultationId}`, {
        content: JSON.stringify(payload),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['consultation-prescriptions', consultationId] }),
  })
}

/** AI-inferred diagnosis suggestion returned by POST /prescriptions/infer-diagnosis. */
export interface DiagnosisSuggestion {
  diagnosis: string
  reasoning: string
  confidence: 'low' | 'medium' | 'high'
  disclaimer: string
  mock: boolean
}

/**
 * Infers a likely diagnosis from a prescription's medications (AI decision-support).
 * Stateless: nothing is persisted; the medic decides whether to act on the suggestion.
 * MEDIC-only on the backend.
 */
export function useInferDiagnosis() {
  return useMutation({
    mutationFn: (medications: Prescription['medications']) =>
      api.post<DiagnosisSuggestion>('/prescriptions/infer-diagnosis', {
        medications: medications.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          unit: m.unit,
          frequency: m.frequency,
          durationDays: m.durationDays,
        })),
      }),
    onError: () =>
      toast({
        title: 'Diagnosis suggestion failed',
        description: 'Could not analyze the medications. Please try again.',
        variant: 'destructive',
      }),
  })
}

export function useStartConsultation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bookingId: string) =>
      api.post<Consultation>(`/consultations/start?bookingId=${bookingId}`),
    onSuccess: (data) => qc.setQueryData(['consultation', data.id], data),
  })
}

export function useEndConsultation(consultationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (durationSeconds: number) =>
      api.post(`/consultations/${consultationId}/complete?durationSeconds=${durationSeconds}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultation', consultationId] }),
  })
}

/**
 * Fetches a short-lived Daily.co meeting token for the current user.
 * Tokens are scoped to a single consultation and expire in 15 minutes.
 * Never persisted to localStorage — held only in component state.
 */
export function useJoinToken(consultationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post<JoinTokenResponse>(`/consultations/${consultationId}/join`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultation', consultationId] })
    },
  })
}

/**
 * Sends a heartbeat every 30s while the user is in an active call.
 * Allows the backend to distinguish a genuine no-show from a network blip.
 */
export function useDailyHeartbeat(
  consultationId: string,
  active: boolean,
  networkRttMs?: number
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!active || !consultationId) return

    const send = () => {
      api
        .post(`/consultations/${consultationId}/heartbeat`, {
          clientUtcTimestamp: new Date().toISOString(),
          networkRttMs: networkRttMs ?? null,
          mediaState: 'connected',
        })
        .catch(() => {
          // Heartbeats are best-effort; swallow errors silently
        })
    }

    send() // send immediately on mount
    intervalRef.current = setInterval(send, 30_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [active, consultationId, networkRttMs])
}
