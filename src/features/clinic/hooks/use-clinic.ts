import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { Medic, MedicInvite, Booking, EarningsSummary, EarningTransaction } from '@/types'

// ─── Clinic medics ────────────────────────────────────────────────────────────

export function useClinicMedics() {
  return useQuery({
    queryKey: ['clinic-medics'],
    queryFn: () => api.get<Medic[]>('/clinic/medics'),
  })
}

export function useInviteMedic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { email: string }) =>
      api.post<MedicInvite>('/clinic/invites', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clinic-invites'] }),
  })
}

export function useClinicInvites() {
  return useQuery({
    queryKey: ['clinic-invites'],
    queryFn: () => api.get<MedicInvite[]>('/clinic/invites'),
  })
}

export function useRevokeInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) => api.delete(`/clinic/invites/${inviteId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clinic-invites'] }),
  })
}

export function useRemoveMedicFromClinic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (medicId: string) => api.delete(`/clinic/medics/${medicId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clinic-medics'] }),
  })
}

// ─── Clinic schedule oversight ────────────────────────────────────────────────

export function useClinicSchedule() {
  return useQuery({
    queryKey: ['clinic-schedule'],
    queryFn: () => api.get<Booking[]>('/clinic/schedule'),
  })
}

// ─── Clinic earnings ──────────────────────────────────────────────────────────

export function useClinicEarningsSummary(period: string) {
  return useQuery({
    queryKey: ['clinic-earnings-summary', period],
    queryFn: () => api.get<EarningsSummary>(`/clinic/earnings/summary?period=${period}`),
  })
}

export function useClinicEarningsTransactions(period: string) {
  return useQuery({
    queryKey: ['clinic-earnings-transactions', period],
    queryFn: () => api.get<EarningTransaction[]>(`/clinic/earnings/transactions?period=${period}`),
  })
}
