import { http, HttpResponse, delay } from 'msw'
import type { MedicStripeStatus, Payment, PaymentIntentResponse, PayoutRecord } from '@/types'
import type { Page } from '@/types'

const BASE = 'http://localhost:8080/api/v1'

// In-memory payment store for mock
const payments = new Map<string, Payment>()

const mockStripeStatus: MedicStripeStatus = {
  stripeAccountId: 'acct_test_mock',
  chargesEnabled: true,
  payoutsEnabled: true,
  detailsSubmitted: true,
  requirementsCurrentlyDue: [],
  onboardingComplete: true,
}

const mockPayouts: PayoutRecord[] = [
  {
    id: 'po_mock_1',
    amountBani: 25000,
    currency: 'RON',
    status: 'paid',
    arrivalDate: new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0]!,
    loginLinkUrl: 'https://dashboard.stripe.com/test',
  },
  {
    id: 'po_mock_2',
    amountBani: 18000,
    currency: 'RON',
    status: 'pending',
    arrivalDate: new Date(Date.now() + 2 * 86400_000).toISOString().split('T')[0]!,
  },
]

export const paymentsHandlers = [
  // POST /v1/payments/intents — create PaymentIntent
  http.post(`${BASE}/payments/intents`, async ({ request }) => {
    await delay(600)
    const body = await request.json() as { bookingId: string }

    const paymentId = `pay-${Date.now()}`
    const payment: Payment = {
      id: paymentId,
      bookingId: body.bookingId,
      patientId: 'usr-patient-1',
      medicId: 'med-1',
      amountBani: 25000,
      applicationFeeBani: 2500,
      currency: 'RON',
      state: 'RESERVED',
      stripePaymentIntentId: `pi_test_mock_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    payments.set(paymentId, payment)

    const response: PaymentIntentResponse = {
      paymentId,
      // Test client secret — Stripe won't accept this but allows UI development
      clientSecret: `pi_test_mock_${Date.now()}_secret_test`,
      publishableKey: import.meta.env['VITE_STRIPE_PUBLISHABLE_KEY'] ?? 'pk_test_mock',
    }
    return HttpResponse.json(response, { status: 201 })
  }),

  // GET /v1/payments/:id
  http.get(`${BASE}/payments/:id`, async ({ params }) => {
    await delay(200)
    const payment = payments.get(params['id'] as string)
    if (!payment) {
      // Return a mock HELD payment for unknown IDs (simulates webhook already processed)
      const mock: Payment = {
        id: params['id'] as string,
        bookingId: 'bk-mock',
        patientId: 'usr-patient-1',
        medicId: 'med-1',
        amountBani: 25000,
        applicationFeeBani: 2500,
        currency: 'RON',
        state: 'HELD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return HttpResponse.json(mock)
    }
    return HttpResponse.json(payment)
  }),

  // POST /v1/payments/:id/refund
  http.post(`${BASE}/payments/:id/refund`, async ({ params }) => {
    await delay(800)
    const payment = payments.get(params['id'] as string)
    if (payment) {
      payment.state = 'REFUNDED'
      payment.updatedAt = new Date().toISOString()
    }
    return HttpResponse.json(payment ?? { id: params['id'], state: 'REFUNDED' })
  }),

  // POST /v1/medics/me/stripe/onboarding — returns onboarding URL
  http.post(`${BASE}/medics/me/stripe/onboarding`, async () => {
    await delay(500)
    // In dev, redirect back to the app's medic-onboarding-return path
    return HttpResponse.json({
      url: `${window.location.origin}/?stripe_onboarding=complete`,
    })
  }),

  // GET /v1/medics/me/stripe/status
  http.get(`${BASE}/medics/me/stripe/status`, async () => {
    await delay(300)
    return HttpResponse.json(mockStripeStatus)
  }),

  // GET /v1/medics/me/payouts
  http.get(`${BASE}/medics/me/payouts`, async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') ?? '0')
    const size = parseInt(url.searchParams.get('size') ?? '20')
    const slice = mockPayouts.slice(page * size, (page + 1) * size)

    const response: Page<PayoutRecord> = {
      content: slice,
      totalElements: mockPayouts.length,
      totalPages: Math.ceil(mockPayouts.length / size),
      number: page,
      size,
    }
    return HttpResponse.json(response)
  }),
]
