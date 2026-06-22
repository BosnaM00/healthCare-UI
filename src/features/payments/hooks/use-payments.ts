import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type {
  MedicStripeStatus,
  Payment,
  PaymentIntentResponse,
  PayoutRecord,
} from '@/types'
import type { Page } from '@/types'

// ─── Query keys ──────────────────────────────────────────────────────────────
export const paymentKeys = {
  all: ['payments'] as const,
  byId: (id: string) => ['payments', id] as const,
  stripeStatus: ['medic', 'stripe', 'status'] as const,
  payouts: (page: number) => ['medic', 'stripe', 'payouts', page] as const,
}

// ─── Patient: create PaymentIntent ───────────────────────────────────────────
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (bookingId: string) =>
      api.post<PaymentIntentResponse>('/payments/intents', { bookingId }),
  })
}

// ─── Patient: get payment by ID (with polling) ───────────────────────────────
export function usePayment(paymentId: string | null) {
  return useQuery({
    queryKey: paymentKeys.byId(paymentId ?? ''),
    queryFn: () => api.get<Payment>(`/payments/${paymentId}`),
    enabled: Boolean(paymentId),
  })
}

// ─── Patient: refund ─────────────────────────────────────────────────────────
export function useRefundPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      api.post<Payment>(`/payments/${paymentId}/refund`, { reason }),
    onSuccess: (_, { paymentId }) => {
      qc.invalidateQueries({ queryKey: paymentKeys.byId(paymentId) })
    },
  })
}

// ─── Medic: Stripe Connect onboarding link ───────────────────────────────────
export function useCreateOnboardingLink() {
  return useMutation({
    mutationFn: () =>
      api.post<{ url: string }>('/medics/me/stripe/onboarding'),
  })
}

// ─── Medic: Stripe account status ────────────────────────────────────────────
export function useMedicStripeStatus() {
  return useQuery({
    queryKey: paymentKeys.stripeStatus,
    queryFn: () => api.get<MedicStripeStatus>('/medics/me/stripe/status'),
    staleTime: 1000 * 30,
  })
}

// ─── Medic: payout history ───────────────────────────────────────────────────
export function useMedicPayouts(page = 0) {
  return useQuery({
    queryKey: paymentKeys.payouts(page),
    queryFn: () =>
      api.get<Page<PayoutRecord>>(`/medics/me/payouts?page=${page}&size=20`),
  })
}
