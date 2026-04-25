import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'
import { patientRegisterSchema, type PatientRegisterInput } from '../schemas/patient.schema'
import { useRegisterPatient } from '../hooks/use-patient'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface RegisterPageProps {
  onSuccess?: () => void
  onLogin?: () => void
}

export function RegisterPage({ onSuccess, onLogin }: RegisterPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const register = useRegisterPatient()

  const { control, handleSubmit, register: rhfRegister, formState: { errors } } = useForm<PatientRegisterInput>({
    resolver: zodResolver(patientRegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      gdprConsent: undefined as unknown as true,
    },
  })

  const onSubmit = (data: PatientRegisterInput) => {
    register.mutate(data, { onSuccess: () => onSuccess?.() })
  }

  return (
    <div className="min-h-screen flex">
      {/* Hero panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between bg-gradient-to-b from-[--color-brand-600] to-[--color-brand-700] p-12 text-white">
        <div className="flex items-center gap-3 text-xl font-bold">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14v-4H7l5-8v4h4l-5 8z" />
          </svg>
          MediConnect
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold font-[--font-serif] leading-snug">
            Join thousands of patients managing their health with confidence.
          </h1>
          <ul className="space-y-2 text-sm opacity-80">
            <li className="flex items-center gap-2">
              <span className="text-green-300">✓</span>
              Book appointments with verified specialists
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-300">✓</span>
              Secure video consultations
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-300">✓</span>
              Manage prescriptions & medical history
            </li>
          </ul>
        </div>
        <p className="text-xs opacity-60">Free to join. Cancel anytime.</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[--color-text-primary]">Create your account</h2>
            <p className="mt-1 text-sm text-[--color-text-secondary]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onLogin}
                className="text-[--color-accent] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-focus-ring] rounded"
              >
                Sign in
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={control} name="firstName" label="First name" required>
                {(field) => (
                  <Input
                    {...field}
                    id="field-firstName"
                    placeholder="Maria"
                    autoComplete="given-name"
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
                    autoComplete="family-name"
                    error={field.error}
                  />
                )}
              </FormField>
            </div>

            <FormField control={control} name="email" label="Email address" required>
              {(field) => (
                <Input
                  {...field}
                  id="field-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  startAdornment={<Mail className="h-4 w-4" />}
                  error={field.error}
                />
              )}
            </FormField>

            <FormField control={control} name="phone" label="Phone number">
              {(field) => (
                <Input
                  {...field}
                  id="field-phone"
                  type="tel"
                  placeholder="+40 721 234 567"
                  autoComplete="tel"
                  startAdornment={<Phone className="h-4 w-4" />}
                  error={field.error}
                />
              )}
            </FormField>

            <FormField control={control} name="password" label="Password" required>
              {(field) => (
                <Input
                  {...field}
                  id="field-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  startAdornment={<Lock className="h-4 w-4" />}
                  error={field.error}
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              )}
            </FormField>

            <FormField control={control} name="confirmPassword" label="Confirm password" required>
              {(field) => (
                <Input
                  {...field}
                  id="field-confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  startAdornment={<Lock className="h-4 w-4" />}
                  error={field.error}
                />
              )}
            </FormField>

            {/* GDPR consent */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="gdpr-consent"
                {...rhfRegister('gdprConsent')}
                aria-required="true"
                aria-invalid={!!errors.gdprConsent}
              />
              <div>
                <Label htmlFor="gdpr-consent" className="cursor-pointer leading-snug">
                  I agree to the{' '}
                  <a href="/privacy" className="text-[--color-accent] hover:underline" target="_blank">
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a href="/terms" className="text-[--color-accent] hover:underline" target="_blank">
                    Terms of Service
                  </a>
                </Label>
                {errors.gdprConsent && (
                  <p className="text-xs text-[--color-danger] mt-0.5" role="alert">
                    {errors.gdprConsent.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" loading={register.isPending}>
              Create account
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
