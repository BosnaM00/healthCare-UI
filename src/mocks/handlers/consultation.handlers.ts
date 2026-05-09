import { http, HttpResponse, delay } from 'msw'
import type {
  Consultation, ConsultationNote, ConsultationDiagnostics, JoinTokenResponse,
  Prescription, PrescriptionMedication,
  VitalReading, PatientDocument, PatientDetail, TimelineEvent,
} from '@/types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockConsultation: Consultation = {
  id: 'consult-1',
  bookingId: 'book-1',   // matches mockBookings[0].id in fixtures.ts
  status: 'IN_PROGRESS',
  videoRoomId: 'mediconnect-test-room',
  videoRoomUrl: 'https://mediconnect-test.daily.co/mediconnect-test-room',
  videoProvider: 'daily',
  startedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  failureReason: null,
}

const mockJoinToken: JoinTokenResponse = {
  roomUrl: 'https://mediconnect-test.daily.co/mediconnect-test-room',
  token: '',   // Public room — no token required
  role: 'PARTICIPANT',
  expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
}

const mockDiagnostics: ConsultationDiagnostics = {
  consultationId: 'consult-1',
  webhookTimestamps: {
    'meeting.started': new Date(Date.now() - 600_000).toISOString(),
    'participant.joined': new Date(Date.now() - 590_000).toISOString(),
  },
  heartbeatSamples: [
    { ts: new Date(Date.now() - 300_000).toISOString(), networkRttMs: 45, mediaState: 'connected' },
    { ts: new Date(Date.now() - 270_000).toISOString(), networkRttMs: 52, mediaState: 'connected' },
  ],
}

const mockNote: ConsultationNote = {
  id: 'note-1',
  consultationId: 'consult-1',
  content: '',
  template: 'FREE',
  updatedAt: new Date().toISOString(),
  isDraft: true,
}

const mockMedications: PrescriptionMedication[] = [
  {
    id: 'med-1',
    name: 'Amoxicillin',
    dosage: '500',
    unit: 'mg',
    frequency: 'Three times daily',
    durationDays: 7,
    instructions: 'Take with food',
  },
]

const mockPrescription: Prescription = {
  id: 'rx-1',
  consultationId: 'consult-1',
  patientId: 'usr-patient-1',
  medicId: 'med-1',
  issuedAt: new Date().toISOString(),
  diagnosis: 'J06.9 – Acute upper respiratory infection, unspecified',
  medications: mockMedications,
  notes: 'Rest and adequate hydration recommended.',
}

const mockVitals: VitalReading[] = Array.from({ length: 10 }, (_, i) => ({
  id: `vital-${i}`,
  patientId: 'usr-patient-1',
  recordedAt: new Date(Date.now() - i * 7 * 86400_000).toISOString(),
  heartRate: 65 + Math.floor(Math.random() * 25),
  systolicBp: 115 + Math.floor(Math.random() * 20),
  diastolicBp: 70 + Math.floor(Math.random() * 15),
  weightKg: 72 + Math.random() * 2,
  oxygenSaturation: 97 + Math.floor(Math.random() * 3),
}))

const mockDocuments: PatientDocument[] = [
  {
    id: 'doc-1',
    patientId: 'usr-patient-1',
    uploadedAt: new Date(Date.now() - 86400_000 * 30).toISOString(),
    name: 'Blood panel results',
    type: 'LAB_RESULT',
    mimeType: 'application/pdf',
    sizeBytes: 245_760,
    url: '#',
  },
  {
    id: 'doc-2',
    patientId: 'usr-patient-1',
    uploadedAt: new Date(Date.now() - 86400_000 * 14).toISOString(),
    name: 'Chest X-ray',
    type: 'IMAGING',
    mimeType: 'image/jpeg',
    sizeBytes: 1_048_576,
    url: '#',
  },
  {
    id: 'doc-3',
    patientId: 'usr-patient-1',
    uploadedAt: new Date(Date.now() - 86400_000 * 7).toISOString(),
    name: 'Cardiology referral',
    type: 'REFERRAL',
    mimeType: 'application/pdf',
    sizeBytes: 98_304,
    url: '#',
  },
]

const mockPatientDetail: PatientDetail = {
  id: 'usr-patient-1',
  userId: 'usr-patient-1',
  firstName: 'Maria',
  lastName: 'Popescu',
  dateOfBirth: '1988-03-15',
  bloodType: 'A+',
  allergies: ['Penicillin', 'Ibuprofen'],
  email: 'maria.popescu@example.com',
  phone: '+40 721 234 567',
  insurerName: 'Regina Maria',
  insurancePolicyNumber: 'RM-2024-789456',
  lastConsultationAt: new Date(Date.now() - 86400_000 * 14).toISOString(),
  activeConditions: ['Hypertension', 'Type 2 Diabetes'],
}

const mockTimeline: TimelineEvent[] = [
  {
    id: 'ev-1',
    type: 'CONSULTATION',
    timestamp: new Date(Date.now() - 86400_000 * 14).toISOString(),
    title: 'Video consultation with Dr. Ionescu',
    description: 'Annual checkup — all vitals normal',
    relatedId: 'consult-0',
  },
  {
    id: 'ev-2',
    type: 'PRESCRIPTION',
    timestamp: new Date(Date.now() - 86400_000 * 14).toISOString(),
    title: 'Metformin 500mg prescribed',
    relatedId: 'rx-0',
  },
  {
    id: 'ev-3',
    type: 'LAB_RESULT',
    timestamp: new Date(Date.now() - 86400_000 * 30).toISOString(),
    title: 'Blood panel — HbA1c 6.8%',
    description: 'Borderline — monitor',
    relatedId: 'doc-1',
  },
  {
    id: 'ev-4',
    type: 'DOCUMENT',
    timestamp: new Date(Date.now() - 86400_000 * 7).toISOString(),
    title: 'Cardiology referral uploaded',
    relatedId: 'doc-3',
  },
  {
    id: 'ev-5',
    type: 'BOOKING',
    timestamp: new Date(Date.now() - 86400_000 * 60).toISOString(),
    title: 'Booking confirmed with Dr. Ionescu',
    relatedId: 'bk-0',
  },
]

// ─── Handlers ────────────────────────────────────────────────────────────────

export const consultationHandlers = [
  // GET consultation by ID
  http.get(`${BASE}/consultations/:id`, async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ ...mockConsultation, id: params.id as string })
  }),

  // GET consultation by booking ID — used by BookingDetailPage to resolve consultationId
  http.get(`${BASE}/consultations/booking/:bookingId`, async ({ params }) => {
    await delay(150)
    if (params.bookingId === 'book-1') {
      return HttpResponse.json(mockConsultation)
    }
    return new HttpResponse(null, { status: 404 })
  }),

  // POST start consultation
  http.post(`${BASE}/consultations/start`, async () => {
    await delay(300)
    return HttpResponse.json(mockConsultation)
  }),

  // POST end consultation
  http.post(`${BASE}/consultations/:id/end`, async () => {
    await delay(200)
    return HttpResponse.json({ ...mockConsultation, status: 'COMPLETED' })
  }),

  // GET consultation note
  http.get(`${BASE}/consultations/:id/note`, async () => {
    await delay(150)
    return HttpResponse.json(mockNote)
  }),

  // PUT save note
  http.put(`${BASE}/consultations/:id/note`, async ({ request }) => {
    await delay(200)
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ ...mockNote, ...body, updatedAt: new Date().toISOString() })
  }),

  // GET prescriptions
  http.get(`${BASE}/consultations/:id/prescriptions`, async () => {
    await delay(200)
    return HttpResponse.json([mockPrescription])
  }),

  // POST issue prescription
  http.post(`${BASE}/consultations/:id/prescriptions`, async ({ request }) => {
    await delay(400)
    const body = await request.json() as Record<string, unknown>
    const newRx: Prescription = {
      id: `rx-${Date.now()}`,
      consultationId: 'consult-1',
      patientId: 'usr-patient-1',
      medicId: 'med-1',
      issuedAt: new Date().toISOString(),
      ...(body as object),
      medications: (body.medications as PrescriptionMedication[] ?? []).map((m, i) => ({
        ...m,
        id: `med-new-${i}`,
      })),
    }
    return HttpResponse.json(newRx)
  }),

  // GET patient detail (medic view)
  http.get(`${BASE}/medic/patients/:patientId`, async () => {
    await delay(200)
    return HttpResponse.json(mockPatientDetail)
  }),

  // GET patient vitals
  http.get(`${BASE}/medic/patients/:patientId/vitals`, async () => {
    await delay(200)
    return HttpResponse.json(mockVitals)
  }),

  // GET patient documents
  http.get(`${BASE}/medic/patients/:patientId/documents`, async () => {
    await delay(200)
    return HttpResponse.json(mockDocuments)
  }),

  // GET patient prescriptions (medic view)
  http.get(`${BASE}/medic/patients/:patientId/prescriptions`, async () => {
    await delay(200)
    return HttpResponse.json([mockPrescription])
  }),

  // GET patient timeline
  http.get(`${BASE}/medic/patients/:patientId/timeline`, async () => {
    await delay(200)
    return HttpResponse.json(mockTimeline)
  }),

  // GET medic patients list
  http.get(`${BASE}/medic/patients`, async () => {
    await delay(250)
    return HttpResponse.json([mockPatientDetail])
  }),

  // GET medic upcoming bookings
  http.get(`${BASE}/medic/bookings/upcoming`, async () => {
    await delay(200)
    const now = new Date()
    return HttpResponse.json([
      {
        id: 'bk-upcoming-1',
        patientId: 'usr-patient-1',
        medicId: 'med-1',
        slotId: 'slot-upcoming-1',
        consultationType: 'VIDEO',
        paymentStatus: 'CAPTURED',
        bookingStatus: 'CONFIRMED',
        createdAt: new Date(Date.now() - 86400_000).toISOString(),
        slot: {
          id: 'slot-upcoming-1',
          medicId: 'med-1',
          startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0).toISOString(),
          endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30).toISOString(),
          consultationType: 'VIDEO',
          available: false,
        },
      },
    ])
  }),

  // GET medic schedule
  http.get(`${BASE}/medic/schedule`, async () => {
    await delay(200)
    return HttpResponse.json([])
  }),

  // GET medic earnings summary
  http.get(`${BASE}/medic/earnings/summary`, async () => {
    await delay(200)
    return HttpResponse.json({
      totalGross: 4500,
      platformFee: 450,
      totalNet: 4050,
      currency: 'RON',
      period: 'current-month',
      consultationCount: 28,
      avgPerConsultation: 144.64,
    })
  }),

  // GET medic earnings transactions
  http.get(`${BASE}/medic/earnings/transactions`, async () => {
    await delay(200)
    return HttpResponse.json([])
  }),

  // POST /consultations/:id/join — issue a Daily meeting token
  http.post(`${BASE}/consultations/:id/join`, async ({ params }) => {
    await delay(300)
    return HttpResponse.json({
      ...mockJoinToken,
      // Return OWNER token for medic-side tests; PARTICIPANT for patient
      role: 'PARTICIPANT' as const,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    } satisfies JoinTokenResponse)
  }),

  // POST /consultations/:id/heartbeat — best-effort, always 204
  http.post(`${BASE}/consultations/:id/heartbeat`, async () => {
    await delay(50)
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /consultations/:id/diagnostics — used by dispute UI
  http.get(`${BASE}/consultations/:id/diagnostics`, async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ ...mockDiagnostics, consultationId: params.id as string })
  }),
]
