import { http, HttpResponse, delay } from 'msw'
import { mockUsers } from '../fixtures'
import type { User, Prescription } from '@/types'

const BASE = 'http://localhost:8080/api/v1'

const usersDB: User[] = [...mockUsers]

const mockMyPrescriptions: Prescription[] = [
  {
    id: 'rx-101',
    consultationId: 'consult-1',
    patientId: 'usr-patient-1',
    medicId: 'med-1',
    issuedAt: new Date(Date.now() - 86400_000 * 3).toISOString(),
    diagnosis: 'J06.9 – Acute upper respiratory infection, unspecified',
    notes: 'Rest and adequate hydration recommended.',
    medications: [
      {
        id: 'rxmed-1',
        name: 'Amoxicillin',
        dosage: '500',
        unit: 'mg',
        frequency: 'Three times daily',
        durationDays: 7,
        instructions: 'Take with food',
      },
      {
        id: 'rxmed-2',
        name: 'Paracetamol',
        dosage: '500',
        unit: 'mg',
        frequency: 'As needed (max 4/day)',
        durationDays: 5,
      },
    ],
  },
  {
    id: 'rx-102',
    consultationId: 'consult-0',
    patientId: 'usr-patient-1',
    medicId: 'med-2',
    issuedAt: new Date(Date.now() - 86400_000 * 45).toISOString(),
    diagnosis: 'I10 – Essential (primary) hypertension',
    medications: [
      {
        id: 'rxmed-3',
        name: 'Lisinopril',
        dosage: '10',
        unit: 'mg',
        frequency: 'Once daily',
        durationDays: 30,
        instructions: 'Take in the morning',
        interactionWarning: 'Avoid potassium supplements while taking this medication.',
      },
    ],
  },
]

export const patientHandlers = [
  // GET /prescriptions/my — patient's own prescriptions
  http.get(`${BASE}/prescriptions/my`, async () => {
    await delay(250)
    return HttpResponse.json(mockMyPrescriptions)
  }),

  // GET /patients/:id
  http.get(`${BASE}/patients/:id`, async ({ params }) => {
    await delay(200)
    const user = usersDB.find(u => u.id === params['id'])
    if (!user) return HttpResponse.json({ status: 404 }, { status: 404 })
    return HttpResponse.json(user)
  }),

  // PUT /patients/:id — profile update
  http.put(`${BASE}/patients/:id`, async ({ params, request }) => {
    await delay(400)
    const body = await request.json() as Partial<User>
    const idx = usersDB.findIndex(u => u.id === params['id'])
    if (idx === -1) return HttpResponse.json({ status: 404 }, { status: 404 })
    usersDB[idx] = { ...usersDB[idx]!, ...body }
    return HttpResponse.json(usersDB[idx])
  }),

  // POST /patients/register
  http.post(`${BASE}/patients/register`, async ({ request }) => {
    await delay(600)
    const body = await request.json() as {
      email: string
      password: string
      firstName: string
      lastName: string
      phone?: string
    }

    if (usersDB.some(u => u.email === body.email)) {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Email already in use', status: 409, detail: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: body.email,
      role: 'PATIENT',
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
    }
    usersDB.push(newUser)

    return HttpResponse.json(
      { token: `mock-jwt-token-${newUser.id}`, userId: newUser.id, role: newUser.role, user: newUser },
      { status: 201 }
    )
  }),
]
