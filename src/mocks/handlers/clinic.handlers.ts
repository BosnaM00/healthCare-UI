import { http, HttpResponse, delay } from 'msw'
import type { Medic, MedicInvite, EarningsSummary, EarningTransaction, Booking } from '@/types'
import { mockMedics, mockSlots } from '../fixtures'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

const mockInvites: MedicInvite[] = [
  {
    id: 'invite-1',
    clinicId: 'clinic-1',
    email: 'dr.new@example.com',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
    expiresAt: new Date(Date.now() + 86400_000 * 6).toISOString(),
  },
]

let invitesState = [...mockInvites]

const mockClinicEarnings: EarningsSummary = {
  totalGross: 18_000,
  platformFee: 1_800,
  totalNet: 16_200,
  currency: 'RON',
  period: 'current-month',
  consultationCount: 112,
  avgPerConsultation: 144.64,
}

const mockTransactions: EarningTransaction[] = Array.from({ length: 8 }, (_, i) => ({
  id: `tx-${i}`,
  consultationId: `consult-${i}`,
  patientName: ['Maria Popescu', 'Ion Gheorghe', 'Ana Stoian', 'Bogdan Popa'][i % 4]!,
  date: new Date(Date.now() - i * 86400_000 * 2).toISOString(),
  grossAmount: 150 + (i % 3) * 50,
  platformFee: 15 + (i % 3) * 5,
  netAmount: 135 + (i % 3) * 45,
  currency: 'RON',
  status: i % 4 === 0 ? 'REFUNDED' : 'RELEASED',
}))

export const clinicHandlers = [
  // GET clinic medics
  http.get(`${BASE}/clinic/medics`, async () => {
    await delay(200)
    return HttpResponse.json(mockMedics)
  }),

  // GET clinic invites
  http.get(`${BASE}/clinic/invites`, async () => {
    await delay(200)
    return HttpResponse.json(invitesState)
  }),

  // POST invite medic
  http.post(`${BASE}/clinic/invites`, async ({ request }) => {
    await delay(400)
    const body = await request.json() as { email: string }
    const newInvite: MedicInvite = {
      id: `invite-${Date.now()}`,
      clinicId: 'clinic-1',
      email: body.email,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400_000 * 7).toISOString(),
    }
    invitesState = [...invitesState, newInvite]
    return HttpResponse.json(newInvite)
  }),

  // DELETE revoke invite
  http.delete(`${BASE}/clinic/invites/:id`, async ({ params }) => {
    await delay(200)
    invitesState = invitesState.filter((i) => i.id !== params.id)
    return HttpResponse.json({ ok: true })
  }),

  // DELETE remove medic from clinic
  http.delete(`${BASE}/clinic/medics/:id`, async () => {
    await delay(300)
    return HttpResponse.json({ ok: true })
  }),

  // GET clinic schedule
  http.get(`${BASE}/clinic/schedule`, async () => {
    await delay(200)
    const now = new Date()
    const bookings: Booking[] = [
      {
        id: 'bk-clinic-1',
        patientId: 'usr-patient-1',
        medicId: 'med-1',
        slotId: 'slot-c1',
        consultationType: 'VIDEO',
        paymentStatus: 'CAPTURED',
        bookingStatus: 'CONFIRMED',
        createdAt: new Date(Date.now() - 86400_000).toISOString(),
        slot: {
          id: 'slot-c1',
          medicId: 'med-1',
          startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString(),
          endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30).toISOString(),
          consultationType: 'VIDEO',
          available: false,
        },
      },
      {
        id: 'bk-clinic-2',
        patientId: 'usr-patient-2',
        medicId: 'med-2',
        slotId: 'slot-c2',
        consultationType: 'IN_PERSON',
        paymentStatus: 'CAPTURED',
        bookingStatus: 'SCHEDULED',
        createdAt: new Date(Date.now() - 86400_000 * 2).toISOString(),
        slot: {
          id: 'slot-c2',
          medicId: 'med-2',
          startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0).toISOString(),
          endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30).toISOString(),
          consultationType: 'IN_PERSON',
          available: false,
        },
      },
    ]
    return HttpResponse.json(bookings)
  }),

  // GET clinic earnings summary
  http.get(`${BASE}/clinic/earnings/summary`, async () => {
    await delay(200)
    return HttpResponse.json(mockClinicEarnings)
  }),

  // GET clinic earnings transactions
  http.get(`${BASE}/clinic/earnings/transactions`, async () => {
    await delay(200)
    return HttpResponse.json(mockTransactions)
  }),
]
