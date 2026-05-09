import { http, HttpResponse, delay } from 'msw'
import type { Dispute, AuditLogEntry, AdminUser, Page } from '@/types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockDisputes: Dispute[] = [
  {
    id: 'disp-1',
    bookingId: 'bk-disp-1',
    patientId: 'usr-patient-1',
    medicId: 'med-1',
    filedBy: 'PATIENT',
    reason: 'NO_SHOW_MEDIC',
    description: 'The medic did not connect to the video call. I waited 20 minutes and the session expired.',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 86400_000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400_000 * 2).toISOString(),
    patientName: 'Maria Popescu',
    medicName: 'Dr. Andrei Ionescu',
  },
  {
    id: 'disp-2',
    bookingId: 'bk-disp-2',
    patientId: 'usr-patient-2',
    medicId: 'med-2',
    filedBy: 'PATIENT',
    reason: 'TECHNICAL_ISSUE',
    description: 'The video quality was extremely poor throughout the entire session. I could not clearly hear the medic.',
    status: 'UNDER_REVIEW',
    createdAt: new Date(Date.now() - 86400_000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400_000 * 1).toISOString(),
    patientName: 'Ion Gheorghe',
    medicName: 'Dr. Elena Dumitrescu',
  },
  {
    id: 'disp-3',
    bookingId: 'bk-disp-3',
    patientId: 'usr-patient-3',
    medicId: 'med-3',
    filedBy: 'MEDIC',
    reason: 'NO_SHOW_PATIENT',
    description: 'Patient did not connect for 15 minutes. I was online and waiting the full session time.',
    status: 'RESOLVED_MEDIC',
    createdAt: new Date(Date.now() - 86400_000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400_000 * 8).toISOString(),
    resolvedAt: new Date(Date.now() - 86400_000 * 8).toISOString(),
    resolution: 'Patient confirmed they forgot about the appointment. Payment released to medic.',
    patientName: 'Ana Stoian',
    medicName: 'Dr. Mihai Gheorghe',
  },
]

let disputesState = [...mockDisputes]

const mockAuditLog: AuditLogEntry[] = Array.from({ length: 50 }, (_, i) => ({
  id: `audit-${i}`,
  userId: i % 3 === 0 ? 'usr-medic-1' : i % 3 === 1 ? 'usr-patient-1' : 'usr-admin-1',
  userEmail:
    i % 3 === 0
      ? 'dr.ionescu@clinic.ro'
      : i % 3 === 1
        ? 'maria.popescu@example.com'
        : 'admin@mediconnect.ro',
  userRole: i % 3 === 0 ? 'MEDIC' : i % 3 === 1 ? 'PATIENT' : 'ADMIN',
  action:
    ['READ_PATIENT_RECORD', 'VIEW_BOOKING', 'CREATE_BOOKING', 'CANCEL_BOOKING', 'LOGIN', 'LOGOUT'][
      i % 6
    ]!,
  entityType: ['patient', 'booking', 'consultation', 'prescription', 'user'][i % 5]!,
  entityId: `entity-${i}-abcdef12`,
  ipAddress: `192.168.${Math.floor(i / 10)}.${i % 256}`,
  timestamp: new Date(Date.now() - i * 300_000).toISOString(),
}))

const mockAdminUsers: AdminUser[] = [
  {
    id: 'usr-patient-1',
    email: 'maria.popescu@example.com',
    role: 'PATIENT',
    firstName: 'Maria',
    lastName: 'Popescu',
    phone: '+40 721 234 567',
    createdAt: new Date(Date.now() - 86400_000 * 120).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600_000).toISOString(),
    isActive: true,
    consultationCount: 5,
  },
  {
    id: 'usr-medic-1',
    email: 'dr.ionescu@clinic.ro',
    role: 'MEDIC',
    firstName: 'Andrei',
    lastName: 'Ionescu',
    phone: '+40 722 345 678',
    createdAt: new Date(Date.now() - 86400_000 * 200).toISOString(),
    lastLoginAt: new Date(Date.now() - 7200_000).toISOString(),
    isActive: true,
    consultationCount: 28,
    clinicName: 'Clinica Centrală',
  },
  {
    id: 'usr-medic-2',
    email: 'dr.dumitrescu@medpoint.ro',
    role: 'MEDIC',
    firstName: 'Elena',
    lastName: 'Dumitrescu',
    phone: '+40 723 456 789',
    createdAt: new Date(Date.now() - 86400_000 * 150).toISOString(),
    lastLoginAt: new Date(Date.now() - 86400_000).toISOString(),
    isActive: true,
    consultationCount: 15,
    clinicName: 'MedPoint Clinic',
  },
  {
    id: 'usr-clinic-1',
    email: 'manager@clinicacentrala.ro',
    role: 'CLINIC_MANAGER',
    firstName: 'Cristina',
    lastName: 'Marin',
    createdAt: new Date(Date.now() - 86400_000 * 300).toISOString(),
    lastLoginAt: new Date(Date.now() - 86400_000 * 2).toISOString(),
    isActive: true,
    clinicName: 'Clinica Centrală',
  },
  {
    id: 'usr-admin-1',
    email: 'admin@mediconnect.ro',
    role: 'ADMIN',
    firstName: 'Platform',
    lastName: 'Admin',
    createdAt: new Date(Date.now() - 86400_000 * 365).toISOString(),
    lastLoginAt: new Date(Date.now() - 1800_000).toISOString(),
    isActive: true,
  },
  {
    id: 'usr-patient-2',
    email: 'ion.gheorghe@example.com',
    role: 'PATIENT',
    firstName: 'Ion',
    lastName: 'Gheorghe',
    createdAt: new Date(Date.now() - 86400_000 * 45).toISOString(),
    lastLoginAt: new Date(Date.now() - 86400_000 * 3).toISOString(),
    isActive: false,
  },
]

function paginate<T>(items: T[], page: number, size = 10): Page<T> {
  const start = page * size
  return {
    content: items.slice(start, start + size),
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
    number: page,
    size,
  }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

export const adminHandlers = [
  // GET disputes
  http.get(`${BASE}/admin/disputes`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') ?? '0')

    const filtered = status
      ? disputesState.filter((d) => d.status === status)
      : disputesState

    return HttpResponse.json(paginate(filtered, page))
  }),

  // GET single dispute
  http.get(`${BASE}/admin/disputes/:id`, async ({ params }) => {
    await delay(150)
    const d = disputesState.find((x) => x.id === params.id)
    if (!d) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(d)
  }),

  // POST resolve dispute
  http.post(`${BASE}/admin/disputes/:id/resolve`, async ({ params, request }) => {
    await delay(400)
    const body = await request.json() as { resolution: string; favour: 'PATIENT' | 'MEDIC' }
    disputesState = disputesState.map((d) =>
      d.id === params.id
        ? {
            ...d,
            status: body.favour === 'PATIENT' ? 'RESOLVED_PATIENT' : 'RESOLVED_MEDIC',
            resolution: body.resolution,
            resolvedAt: new Date().toISOString(),
          }
        : d
    )
    return HttpResponse.json(disputesState.find((d) => d.id === params.id))
  }),

  // POST close dispute
  http.post(`${BASE}/admin/disputes/:id/close`, async ({ params }) => {
    await delay(200)
    disputesState = disputesState.map((d) =>
      d.id === params.id ? { ...d, status: 'CLOSED' } : d
    )
    return HttpResponse.json({ ok: true })
  }),

  // POST file dispute (patient side)
  http.post(`${BASE}/disputes`, async ({ request }) => {
    await delay(400)
    const body = await request.json() as Record<string, unknown>
    const newDispute: Dispute = {
      id: `disp-${Date.now()}`,
      bookingId: body.bookingId as string,
      patientId: 'usr-patient-1',
      medicId: 'med-1',
      filedBy: 'PATIENT',
      reason: body.reason as Dispute['reason'],
      description: body.description as string,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    disputesState = [newDispute, ...disputesState]
    return HttpResponse.json(newDispute)
  }),

  // GET my disputes
  http.get(`${BASE}/disputes/my`, async () => {
    await delay(200)
    return HttpResponse.json(disputesState.filter((d) => d.patientId === 'usr-patient-1'))
  }),

  // GET audit log
  http.get(`${BASE}/admin/audit`, async ({ request }) => {
    await delay(300)
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase() ?? ''
    const entityType = url.searchParams.get('entityType') ?? ''
    const page = parseInt(url.searchParams.get('page') ?? '0')

    let filtered = mockAuditLog
    if (search) {
      filtered = filtered.filter(
        (e) =>
          e.action.toLowerCase().includes(search) ||
          e.userEmail.toLowerCase().includes(search) ||
          e.entityType.toLowerCase().includes(search) ||
          e.entityId.toLowerCase().includes(search)
      )
    }
    if (entityType) {
      filtered = filtered.filter((e) => e.entityType === entityType)
    }

    return HttpResponse.json(paginate(filtered, page))
  }),

  // GET admin users
  http.get(`${BASE}/admin/users`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const role = url.searchParams.get('role') ?? ''
    const search = url.searchParams.get('search')?.toLowerCase() ?? ''
    const page = parseInt(url.searchParams.get('page') ?? '0')

    let filtered = mockAdminUsers
    if (role) filtered = filtered.filter((u) => u.role === role)
    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(search) ||
          u.firstName.toLowerCase().includes(search) ||
          u.lastName.toLowerCase().includes(search)
      )
    }

    return HttpResponse.json(paginate(filtered, page))
  }),

  // POST deactivate user
  http.post(`${BASE}/admin/users/:id/deactivate`, async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ id: params.id, isActive: false })
  }),

  // POST activate user
  http.post(`${BASE}/admin/users/:id/activate`, async ({ params }) => {
    await delay(200)
    return HttpResponse.json({ id: params.id, isActive: true })
  }),

  // PUT change role
  http.put(`${BASE}/admin/users/:id/role`, async ({ params, request }) => {
    await delay(200)
    const body = await request.json() as { role: string }
    return HttpResponse.json({ id: params.id, role: body.role })
  }),

  // GDPR handlers
  http.get(`${BASE}/settings/gdpr/consents`, async () => {
    await delay(200)
    return HttpResponse.json([])
  }),

  http.put(`${BASE}/settings/gdpr/consents`, async () => {
    await delay(200)
    return HttpResponse.json({ ok: true })
  }),

  http.post(`${BASE}/settings/gdpr/export`, async () => {
    await delay(600)
    return HttpResponse.json({ ok: true, message: 'Export queued' })
  }),

  http.post(`${BASE}/settings/gdpr/delete-account`, async () => {
    await delay(800)
    return HttpResponse.json({ ok: true })
  }),

  // Audit log submit (from useAuditLogger)
  http.post(`${BASE}/audit/log`, async () => {
    await delay(100)
    return HttpResponse.json({ ok: true })
  }),
]
