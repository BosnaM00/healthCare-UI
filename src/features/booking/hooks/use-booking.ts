import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import type { Booking, Medic, Slot, Page } from '@/types'

// ─── Medic search ───────────────────────────────────────────────────────────
interface MedicSearchParams {
  q?: string
  specialty?: string
  consultationType?: string
  page?: number
  size?: number
}

export function useMedics(params: MedicSearchParams = {}) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.specialty) search.set('specialty', params.specialty)
  if (params.consultationType) search.set('consultationType', params.consultationType)
  search.set('page', String(params.page ?? 0))
  search.set('size', String(params.size ?? 12))

  return useQuery({
    queryKey: ['medics', params],
    queryFn: () => api.get<Page<Medic>>(`/medics?${search.toString()}`),
    placeholderData: (prev) => prev,
  })
}

export function useMedic(id?: string) {
  return useQuery({
    queryKey: ['medics', id],
    queryFn: () => api.get<Medic>(`/medics/${id}`),
    enabled: !!id,
  })
}

export function useMedicSlots(medicId?: string) {
  return useQuery({
    queryKey: ['medic-slots', medicId],
    queryFn: () => api.get<Slot[]>(`/medics/${medicId}/slots`),
    enabled: !!medicId,
  })
}

// ─── Bookings ────────────────────────────────────────────────────────────────
export function useMyBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get<Page<Booking>>('/bookings/my'),
  })
}

export function useBooking(id?: string) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: () => api.get<Booking>(`/bookings/${id}`),
    enabled: !!id,
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      slotId: string
      consultationType: string
      cancellationPolicyAccepted: boolean
    }) => api.post<Booking>('/bookings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      toast({ title: 'Booking confirmed!', description: 'Check your email for details.' })
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast({ title: 'Booking failed', description: error.message, variant: 'destructive' })
      }
    },
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (bookingId: string) => api.patch<Booking>(`/bookings/${bookingId}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      toast({ title: 'Booking cancelled', description: 'Your cancellation has been processed.' })
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast({ title: 'Cancellation failed', description: error.message, variant: 'destructive' })
      }
    },
  })
}
