import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { Dispute, AuditLogEntry, AdminUser, Page } from '@/types'

// ─── Disputes ────────────────────────────────────────────────────────────────

export function useAdminDisputes(params?: { status?: string; page?: number }) {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.page !== undefined) qs.set('page', String(params.page))

  return useQuery({
    queryKey: ['admin-disputes', params],
    queryFn: () => api.get<Page<Dispute>>(`/admin/disputes?${qs}`),
  })
}

export function useDispute(id: string) {
  return useQuery({
    queryKey: ['dispute', id],
    queryFn: () => api.get<Dispute>(`/admin/disputes/${id}`),
    enabled: !!id,
  })
}

export function useResolveDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      resolution,
      favour,
    }: {
      id: string
      resolution: string
      favour: 'PATIENT' | 'MEDIC'
    }) =>
      api.post<Dispute>(`/admin/disputes/${id}/resolve`, { resolution, favour }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] })
    },
  })
}

export function useCloseDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/disputes/${id}/close`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-disputes'] }),
  })
}

// ─── Patient dispute filing ───────────────────────────────────────────────────

export function useFileDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      bookingId: string
      reason: string
      description: string
    }) => api.post<Dispute>('/disputes', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-disputes'] }),
  })
}

export function useMyDisputes() {
  return useQuery({
    queryKey: ['my-disputes'],
    queryFn: () => api.get<Dispute[]>('/disputes/my'),
  })
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export function useAuditLog(params?: { search?: string; page?: number; entityType?: string }) {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.page !== undefined) qs.set('page', String(params.page))
  if (params?.entityType) qs.set('entityType', params.entityType)

  return useQuery({
    queryKey: ['audit-log', params],
    queryFn: () => api.get<Page<AuditLogEntry>>(`/admin/audit?${qs}`),
    staleTime: 0, // always fresh
  })
}

// ─── User Management ──────────────────────────────────────────────────────────

export function useAdminUsers(params?: { role?: string; search?: string; page?: number }) {
  const qs = new URLSearchParams()
  if (params?.role) qs.set('role', params.role)
  if (params?.search) qs.set('search', params.search)
  if (params?.page !== undefined) qs.set('page', String(params.page))

  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => api.get<Page<AdminUser>>(`/admin/users?${qs}`),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/deactivate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useActivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/activate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useChangeUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.put(`/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}
