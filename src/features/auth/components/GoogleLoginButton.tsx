import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuthStore } from '@/stores/auth.store'
import { useMutation } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import type { User } from '@/types'

interface LoginResponse {
  token: string
  userId: string
  role: User['role']
  email: string
  firstName: string
  lastName: string
}

interface GoogleLoginButtonProps {
  onSuccess?: () => void
}

/**
 * Renders Google's official Sign-In button.
 * On success, exchanges the Google ID token for a MediConnect JWT
 * and stores it in the auth store — identical to the email/password flow.
 */
export function GoogleLoginButton({ onSuccess }: GoogleLoginButtonProps) {
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
      const detail = error instanceof ApiError
        ? error.problem.detail
        : 'An unexpected error occurred. Please try again.'
      toast({
        title: 'Sign-in failed',
        description: detail,
        variant: 'destructive',
      })
    },
  })

  const handleCredentialResponse = (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast({
        title: 'Google Sign-In failed',
        description: 'No credential received from Google. Please try again.',
        variant: 'destructive',
      })
      return
    }
    // credentialResponse.credential is the Google ID token (a JWT).
    // Send it to the backend for verification.
    mutation.mutate(credentialResponse.credential)
  }

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleCredentialResponse}
        onError={() => {
          toast({
            title: 'Google Sign-In failed',
            description: 'The sign-in popup was closed or blocked. Please try again.',
            variant: 'destructive',
          })
        }}
        useOneTap={false}       // disable One Tap to avoid UX conflicts with the form
        width="360"             // approximate width to match the form inputs
        theme="outline"
        shape="rectangular"
        text="signin_with"
      />
    </div>
  )
}
