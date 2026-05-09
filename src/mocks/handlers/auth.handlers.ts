import { http, HttpResponse, delay } from 'msw'
import { mockUsers } from '../fixtures'

const BASE = 'http://localhost:8080/api/v1'

export const authHandlers = [
  // POST /auth/login
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(400)
    const body = await request.json() as { email?: string; password?: string }

    const user = mockUsers.find(u => u.email === body.email)
    if (!user || body.password !== 'password') {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Invalid credentials', status: 401, detail: 'Email or password is incorrect.' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      token: `mock-jwt-token-${user.id}`,
      userId: user.id,
      role: user.role,
      user,
    })
  }),

  // POST /auth/mfa/verify
  http.post(`${BASE}/auth/mfa/verify`, async ({ request }) => {
    await delay(300)
    const body = await request.json() as { code?: string }
    if (body.code !== '123456') {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Invalid MFA code', status: 400, detail: 'The code you entered is incorrect or expired.' },
        { status: 400 }
      )
    }
    return HttpResponse.json({ success: true })
  }),

  // POST /auth/password-reset/request
  http.post(`${BASE}/auth/password-reset/request`, async () => {
    await delay(500)
    return HttpResponse.json({ message: 'If that email exists, we sent a reset link.' })
  }),

  // POST /auth/password-reset/confirm
  http.post(`${BASE}/auth/password-reset/confirm`, async () => {
    await delay(400)
    return HttpResponse.json({ success: true })
  }),

  // GET /auth/me
  http.get(`${BASE}/auth/me`, ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth) {
      return HttpResponse.json({ status: 401 }, { status: 401 })
    }
    const userId = auth.replace('Bearer mock-jwt-token-', '')
    const user = mockUsers.find(u => u.id === userId)
    if (!user) return HttpResponse.json({ status: 401 }, { status: 401 })
    return HttpResponse.json(user)
  }),
]
