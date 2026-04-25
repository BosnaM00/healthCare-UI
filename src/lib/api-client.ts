import { useAuthStore } from '@/stores/auth.store'
import type { ProblemDetail } from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemDetail
  ) {
    super(problem.detail ?? problem.title)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    useAuthStore.getState().clearAuth()
    window.location.href = '/auth/login'
    throw new ApiError(401, { type: 'about:blank', title: 'Unauthorized', status: 401 })
  }

  if (!res.ok) {
    let problem: ProblemDetail
    try {
      problem = (await res.json()) as ProblemDetail
    } catch {
      problem = { type: 'about:blank', title: res.statusText, status: res.status }
    }
    throw new ApiError(res.status, problem)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'GET' }),
  post:   <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) }),
  put:    <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'PUT', body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'DELETE' }),
}
