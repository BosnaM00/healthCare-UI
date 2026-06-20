import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from '@/hooks/use-toast'
import type { User, Prescription } from '@/types'
import type { PatientRegisterInput, PatientProfileInput } from '../schemas/patient.schema'

interface RegisterResponse {
  token: string
  userId: string
  role: User['role']
  user: User
}

export function useRegisterPatient() {
  const { setUser } = useAuthStore()

  return useMutation({
    mutationFn: (data: PatientRegisterInput) =>
      api.post<RegisterResponse>('/patients/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      }),
    onSuccess: (data) => {
      setUser(data.user, data.token)
      toast({ title: 'Account created!', description: `Welcome, ${data.user.firstName}!` })
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast({ title: error.problem.title, description: error.problem.detail, variant: 'destructive' })
      }
    },
  })
}

export function useMyPrescriptions() {
  return useQuery({
    queryKey: ['my-prescriptions'],
    queryFn: () => api.get<Prescription[]>('/prescriptions/my'),
  })
}

export function usePatientProfile(patientId?: string) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => api.get<User>(`/patients/${patientId}`),
    enabled: !!patientId,
  })
}

export function useUpdatePatientProfile(patientId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: PatientProfileInput) =>
      api.put<User>(`/patients/${patientId}`, data),
    onSuccess: (data) => {
      qc.setQueryData(['patient', patientId], data)
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' })
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      }
    },
  })
}
