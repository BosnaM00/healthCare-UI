import { http, HttpResponse, delay } from 'msw'
import { mockBookings, mockMedics, mockSlots } from '../fixtures'
import type { Booking } from '@/types'

const BASE = 'http://localhost:8080/api/v1'

const bookingsDB: Booking[] = [...mockBookings]

export const bookingHandlers = [
  // GET /medics — search with filters
  http.get(`${BASE}/medics`, async ({ request }) => {
    await delay(300)
    const url = new URL(request.url)
    const specialty = url.searchParams.get('specialty')
    const q = url.searchParams.get('q')?.toLowerCase()
    const page = parseInt(url.searchParams.get('page') ?? '0')
    const size = parseInt(url.searchParams.get('size') ?? '10')

    let results = mockMedics.filter(m => m.verificationStatus === 'VERIFIED')
    if (specialty) results = results.filter(m => m.specialties.some(s => s.id === specialty))
    if (q) results = results.filter(m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.specialties.some(s => s.name.toLowerCase().includes(q))
    )

    return HttpResponse.json({
      content: results.slice(page * size, (page + 1) * size),
      totalElements: results.length,
      totalPages: Math.ceil(results.length / size),
      number: page,
      size,
    })
  }),

  // GET /medics/:id
  http.get(`${BASE}/medics/:id`, async ({ params }) => {
    await delay(200)
    const medic = mockMedics.find(m => m.id === params['id'])
    if (!medic) return HttpResponse.json({ status: 404 }, { status: 404 })
    return HttpResponse.json(medic)
  }),

  // GET /medics/:id/slots
  http.get(`${BASE}/medics/:id/slots`, async ({ params }) => {
    await delay(300)
    const slots = mockSlots.filter(s => s.medicId === params['id'] && s.available)
    return HttpResponse.json(slots)
  }),

  // GET /bookings/my (patient own bookings) — must precede /bookings/:id
  http.get(`${BASE}/bookings/my`, async () => {
    await delay(300)
    return HttpResponse.json({
      content: bookingsDB,
      totalElements: bookingsDB.length,
      totalPages: 1,
      number: 0,
      size: 20,
    })
  }),

  // GET /bookings/:id
  http.get(`${BASE}/bookings/:id`, async ({ params }) => {
    await delay(200)
    const booking = bookingsDB.find(b => b.id === params['id'])
    if (!booking) return HttpResponse.json({ status: 404 }, { status: 404 })
    return HttpResponse.json(booking)
  }),

  // POST /bookings
  http.post(`${BASE}/bookings`, async ({ request }) => {
    await delay(600)
    const body = await request.json() as {
      slotId: string
      consultationType: string
      cancellationPolicyAccepted: boolean
    }

    const slot = mockSlots.find(s => s.id === body.slotId)
    if (!slot) return HttpResponse.json({ status: 404 }, { status: 404 })

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      patientId: 'usr-patient-1',
      medicId: slot.medicId,
      slotId: slot.id,
      consultationType: body.consultationType as 'VIDEO' | 'IN_PERSON',
      paymentStatus: 'CAPTURED',
      bookingStatus: 'CONFIRMED',
      cancellationPolicyAcceptedAt: body.cancellationPolicyAccepted ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      slot,
      medic: mockMedics.find(m => m.id === slot.medicId),
    }

    bookingsDB.push(newBooking)
    return HttpResponse.json(newBooking, { status: 201 })
  }),

  // PATCH /bookings/:id/cancel
  http.patch(`${BASE}/bookings/:id/cancel`, async ({ params }) => {
    await delay(400)
    const idx = bookingsDB.findIndex(b => b.id === params['id'])
    if (idx === -1) return HttpResponse.json({ status: 404 }, { status: 404 })
    bookingsDB[idx] = { ...bookingsDB[idx]!, bookingStatus: 'CANCELLED' }
    return HttpResponse.json(bookingsDB[idx])
  }),
]
