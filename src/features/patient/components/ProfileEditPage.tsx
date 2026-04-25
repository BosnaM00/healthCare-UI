import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Phone, Save } from 'lucide-react'
import { patientProfileSchema, type PatientProfileInput } from '../schemas/patient.schema'
import { usePatientProfile, useUpdatePatientProfile } from '../hooks/use-patient'
import { useAuthStore } from '@/stores/auth.store'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { SkeletonText } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function ProfileEditPage() {
  const user = useAuthStore((s) => s.user)
  const { data: profile, isLoading } = usePatientProfile(user?.id)
  const updateProfile = useUpdatePatientProfile(user?.id ?? '')

  const { control, handleSubmit, reset } = useForm<PatientProfileInput>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      firstName: profile?.firstName ?? user?.firstName ?? '',
      lastName: profile?.lastName ?? user?.lastName ?? '',
      phone: profile?.phone ?? user?.phone ?? '',
    },
    values: profile
      ? { firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone ?? '' }
      : undefined,
  })

  const onSubmit = (data: PatientProfileInput) => {
    updateProfile.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" />
        <SkeletonText lines={4} />
      </div>
    )
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="My Profile"
        description="Update your personal information"
      />

      {/* Avatar section */}
      <div className="flex items-center gap-4 p-4 rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface]">
        <Avatar className="h-16 w-16 text-lg">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-[--color-text-primary]">
            {profile?.firstName ?? user?.firstName} {profile?.lastName ?? user?.lastName}
          </p>
          <p className="text-sm text-[--color-text-secondary]">{user?.email}</p>
          <p className="text-xs mt-1 text-[--color-accent] capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={control} name="firstName" label="First name" required>
            {(field) => (
              <Input
                {...field}
                id="field-firstName"
                placeholder="Maria"
                startAdornment={<User className="h-4 w-4" />}
                error={field.error}
              />
            )}
          </FormField>

          <FormField control={control} name="lastName" label="Last name" required>
            {(field) => (
              <Input
                {...field}
                id="field-lastName"
                placeholder="Popescu"
                error={field.error}
              />
            )}
          </FormField>
        </div>

        <FormField
          control={control}
          name="phone"
          label="Phone number"
          description="Used for appointment reminders"
        >
          {(field) => (
            <Input
              {...field}
              id="field-phone"
              type="tel"
              placeholder="+40 721 234 567"
              startAdornment={<Phone className="h-4 w-4" />}
              error={field.error}
            />
          )}
        </FormField>

        {/* Read-only email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[--color-text-primary]">
            Email address
          </label>
          <Input
            value={user?.email ?? ''}
            disabled
            readOnly
            className="bg-[--color-neutral-50]"
          />
          <p className="text-xs text-[--color-text-secondary]">
            Email cannot be changed. Contact support if needed.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            loading={updateProfile.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
          >
            Discard
          </Button>
        </div>
      </form>
    </div>
  )
}
