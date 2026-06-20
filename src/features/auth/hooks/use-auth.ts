import { useMutation } from '@tanstack/react-query'
import { useGoogleLogin } from '@react-oauth/google'
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

export function useGoogleAuth(onSuccess?: () => void) {
  const { setUser } = useAuthStore()

  const mutation = useMutation({
    mutationFn: (idToken: string) =>
      api.post<LoginResponse>('/auth/google', { idToken }),
    onSuccess: (data) => {
      const user: User = {
        id: data.userId,
        email: data.email,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
      }
      setUser(user, data.token)
      toast({
        title: 'Welcome!',
        description: `Signed in as ${data.firstName}`,
        variant: 'default',
      })
      onSuccess?.()
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast({
          title: error.problem.title,
          description: error.problem.detail,
          variant: 'destructive',
        })
      }
    },
  })

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: () => {
      // tokenResponse.access_token is the access token from Google.
      // However, for backend ID token verification we need the credential JWT.
      // We use the GoogleLogin component instead (see GoogleLoginButton.tsx),
      // which provides the ID token directly via credentialResponse.credential.
      // This hook is kept as a fallback for programmatic use if needed.
    },
    onError: () => {
      toast({
        title: 'Google Sign-In failed',
        description: 'Could not open the Google sign-in window. Please try again.',
        variant: 'destructive',
      })
    },
  })

  return {
    sendIdToken: mutation.mutate,      // call with idToken string
    isPending: mutation.isPending,
    triggerGoogle: triggerGoogleLogin,
  }
}
