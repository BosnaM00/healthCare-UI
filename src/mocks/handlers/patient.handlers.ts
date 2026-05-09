import { http, HttpResponse, delay } from 'msw'
import { mockUsers } from '../fixtures'
import type { User } from '@/types'

const BASE = 'http://localhost:8080/api/v1'

const usersDB: User[] = [...mockUsers]

export const patientHandlers = [
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
