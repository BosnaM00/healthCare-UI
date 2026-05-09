import { useMutation } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from '@/hooks/use-toast'
import type { User } from '@/types'

interface LoginResponse {
  token: string
  userId: string
  role: User['role']
  email: string
  firstName: string
  lastName: string
  requiresMfa?: boolean
}

export function useLogin() {
  const { setUser } = useAuthStore()

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post<LoginResponse>('/auth/login', credentials),
    onSuccess: (data) => {
      if (!data.requiresMfa) {
        const user: User = {
          id: data.userId,
          email: data.email,
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
        }
        setUser(user, data.token)
        toast({ title: 'Welcome back!', description: `Signed in as ${data.firstName}`, variant: 'default' })
      }
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast({ title: error.problem.title, description: error.problem.detail, variant: 'destructive' })
      }
    },
  })
}

export function useMfaVerify() {
  return useMutation({
    mutationFn: (payload: { code: string; tempToken?: string }) =>
      api.post<{ success: boolean }>('/auth/mfa/verify', payload),
  })
}

export function usePasswordResetRequest() {
  return useMutation({
    mutationFn: (payload: { email: string }) =>
      api.post<{ message: string }>('/auth/password-reset/request', payload),
  })
}

export function usePasswordResetConfirm() {
  return useMutation({
    mutationFn: (payload: { token: string; password: string }) =>
      api.post<{ success: boolean }>('/auth/password-reset/confirm', payload),
  })
}
