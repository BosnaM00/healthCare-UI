import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { Consultation, ConsultationNote, Prescription } from '@/types'

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useConsultation(consultationId: string) {
  return useQuery({
    queryKey: ['consultation', consultationId],
    queryFn: () => api.get<Consultation>(`/consultations/${consultationId}`),
    enabled: !!consultationId,
  })
}

export function useConsultationNote(consultationId: string) {
  return useQuery({
    queryKey: ['consultation-note', consultationId],
    queryFn: () => api.get<ConsultationNote>(`/consultations/${consultationId}/note`),
    enabled: !!consultationId,
  })
}

export function useConsultationPrescriptions(consultationId: string) {
  return useQuery({
    queryKey: ['consultation-prescriptions', consultationId],
    queryFn: () => api.get<Prescription[]>(`/consultations/${consultationId}/prescriptions`),
    enabled: !!consultationId,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSaveNote(consultationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { content: string; template: string }) =>
      api.put<ConsultationNote>(`/consultations/${consultationId}/note`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultation-note', consultationId] }),
  })
}

export function useIssuePrescription(consultationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: unknown) =>
      api.post<Prescription>(`/consultations/${consultationId}/prescriptions`, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['consultation-prescriptions', consultationId] }),
  })
}

export function useStartConsultation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bookingId: string) =>
      api.post<Consultation>(`/consultations/start`, { bookingId }),
    onSuccess: (data) => qc.setQueryData(['consultation', data.id], data),
  })
}

export function useEndConsultation(consultationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`/consultations/${consultationId}/end`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultation', consultationId] }),
  })
}
