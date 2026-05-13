import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
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

export function useConsultationPrescriptions(consultationId: string) {
  return useQuery({
    queryKey: ['consultation-prescriptions', consultationId],
    queryFn: () => api.get<Prescription[]>(`/prescriptions/consultation/${consultationId}`),
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
    mutationFn: (payload: unknown) =>
      api.post<Prescription>(`/prescriptions/consultation/${consultationId}`, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['consultation-prescriptions', consultationId] }),
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
