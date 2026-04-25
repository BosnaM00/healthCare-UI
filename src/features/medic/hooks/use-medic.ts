import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type {
  PatientDetail, VitalReading, PatientDocument, Prescription,
  TimelineEvent, Booking, EarningsSummary, EarningTransaction, Slot,
} from '@/types'

// ─── Patient detail (medic view) ─────────────────────────────────────────────

export function usePatientDetail(patientId: string) {
  return useQuery({
    queryKey: ['patient-detail', patientId],
    queryFn: () => api.get<PatientDetail>(`/medic/patients/${patientId}`),
    enabled: !!patientId,
  })
}

export function usePatientVitals(patientId: string) {
  return useQuery({
    queryKey: ['patient-vitals', patientId],
    queryFn: () => api.get<VitalReading[]>(`/medic/patients/${patientId}/vitals`),
    enabled: !!patientId,
  })
}

export function usePatientDocuments(patientId: string) {
  return useQuery({
    queryKey: ['patient-documents', patientId],
    queryFn: () => api.get<PatientDocument[]>(`/medic/patients/${patientId}/documents`),
    enabled: !!patientId,
  })
}

export function usePatientPrescriptions(patientId: string) {
  return useQuery({
    queryKey: ['patient-prescriptions', patientId],
    queryFn: () => api.get<Prescription[]>(`/medic/patients/${patientId}/prescriptions`),
    enabled: !!patientId,
  })
}

export function usePatientTimeline(patientId: string) {
  return useQuery({
    queryKey: ['patient-timeline', patientId],
    queryFn: () => api.get<TimelineEvent[]>(`/medic/patients/${patientId}/timeline`),
    enabled: !!patientId,
  })
}

// ─── Medic patients list ─────────────────────────────────────────────────────

export function useMedicPatients() {
  return useQuery({
    queryKey: ['medic-patients'],
    queryFn: () => api.get<PatientDetail[]>('/medic/patients'),
  })
}

// ─── Medic schedule / bookings ────────────────────────────────────────────────

export function useMedicSchedule() {
  return useQuery({
    queryKey: ['medic-schedule'],
    queryFn: () => api.get<Booking[]>('/medic/schedule'),
  })
}

export function useMedicUpcomingBookings() {
  return useQuery({
    queryKey: ['medic-upcoming-bookings'],
    queryFn: () => api.get<Booking[]>('/medic/bookings/upcoming'),
  })
}

// ─── Medic earnings ───────────────────────────────────────────────────────────

export function useMedicEarningsSummary(period: string) {
  return useQuery({
    queryKey: ['medic-earnings-summary', period],
    queryFn: () => api.get<EarningsSummary>(`/medic/earnings/summary?period=${period}`),
  })
}

export function useMedicEarningsTransactions(period: string) {
  return useQuery({
    queryKey: ['medic-earnings-transactions', period],
    queryFn: () => api.get<EarningTransaction[]>(`/medic/earnings/transactions?period=${period}`),
  })
}
