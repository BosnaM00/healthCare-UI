import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { loginSchema, type LoginInput } from '../schemas/auth.schema'
import { useLogin } from '../hooks/use-auth'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface LoginPageProps {
  onSuccess?: () => void
  onForgotPassword?: () => void
  onRegister?: () => void
  onMfaRequired?: (tempToken: string) => void
}

export function LoginPage({ onSuccess, onForgotPassword, onRegister }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)

  const { control, handleSubmit } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const login = useLogin()

  const onSubmit = (data: LoginInput) => {
    login.mutate(data, {
      onSuccess: () => onSuccess?.(),
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Hero panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[--color-accent] p-12 text-[--color-text-on-brand]">
        <div className="flex items-center gap-3 text-xl font-bold">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14v-4H7l5-8v4h4l-5 8z" />
          </svg>
          MediConnect
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold font-[--font-serif] leading-tight">
            Your health, <br />connected.
          </h1>
          <p className="text-lg opacity-80 max-w-md">
            Book consultations, manage prescriptions, and connect with verified specialists —
            all in one secure platform.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm opacity-70">
          <span>HIPAA compliant</span>
          <span>·</span>
          <span>End-to-end encrypted</span>
          <span>·</span>
          <span>GDPR ready</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm mx-auto space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 text-lg font-bold text-[--color-accent] lg:hidden">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14v-4H7l5-8v4h4l-5 8z" />
            </svg>
            MediConnect
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[--color-text-primary]">Sign in</h2>
            <p className="mt-1 text-sm text-[--color-text-secondary]">
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={control}
              name="email"
              label="Email address"
              required
            >
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

            <FormField
              control={control}
              name="password"
              label="Password"
              required
            >
              {(field) => (
                <Input
                  {...field}
                  id="field-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-[--color-accent] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-focus-ring] rounded"
                onClick={onForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={login.isPending}
            >
              Sign in
            </Button>
          </form>

          {/* Dev hint */}
          {import.meta.env.DEV && (
            <div className="rounded-[--radius-md] border border-[--color-border] bg-[--color-neutral-50] p-3 text-xs text-[--color-text-secondary]">
              <p className="font-medium mb-1">Dev credentials:</p>
              <p>Patient: maria.popescu@example.com / password</p>
              <p>Medic: dr.ionescu@clinic.ro / password</p>
            </div>
          )}

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[--color-background] px-2 text-xs text-[--color-text-secondary]">
              New to MediConnect?
            </span>
          </div>

          <Button variant="outline" className="w-full" onClick={onRegister}>
            Create an account
          </Button>
        </div>
      </div>
    </div>
  )
}
