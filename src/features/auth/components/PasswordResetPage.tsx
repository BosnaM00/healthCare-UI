import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, CheckCircle2, Lock } from 'lucide-react'
import {
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  type PasswordResetRequestInput,
  type PasswordResetConfirmInput,
} from '../schemas/auth.schema'
import { usePasswordResetRequest, usePasswordResetConfirm } from '../hooks/use-auth'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { ApiError } from '@/lib/api-client'

type Step = 'request' | 'confirm' | 'done'

interface PasswordResetPageProps {
  token?: string
  onBack?: () => void
  onSuccess?: () => void
}

export function PasswordResetPage({ token, onBack, onSuccess }: PasswordResetPageProps) {
  const [step, setStep] = useState<Step>(token ? 'confirm' : 'request')

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[--color-background]">
      <div className="w-full max-w-sm">
        {step === 'request' && (
          <RequestStep onSent={() => setStep('done')} onBack={onBack} />
        )}
        {step === 'confirm' && token && (
          <ConfirmStep token={token} onSuccess={() => { setStep('done'); onSuccess?.() }} />
        )}
        {step === 'done' && (
          <DoneStep onBack={onBack} />
        )}
      </div>
    </div>
  )
}

function RequestStep({ onSent, onBack }: { onSent: () => void; onBack?: () => void }) {
  const request = usePasswordResetRequest()
  const { control, handleSubmit } = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = (data: PasswordResetRequestInput) => {
    request.mutate(data, {
      onSuccess: () => onSent(),
      onError: (error) => {
        if (error instanceof ApiError) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[--color-text-primary]">Reset password</h1>
        <p className="text-sm text-[--color-text-secondary]">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

        <Button type="submit" className="w-full" loading={request.isPending}>
          Send reset link
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          Back to login
        </Button>
      </form>
    </div>
  )
}

function ConfirmStep({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const confirm = usePasswordResetConfirm()
  const { control, handleSubmit } = useForm<PasswordResetConfirmInput>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = (data: PasswordResetConfirmInput) => {
    confirm.mutate({ token, password: data.password }, {
      onSuccess: () => onSuccess(),
      onError: (error) => {
        if (error instanceof ApiError) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[--color-text-primary]">New password</h1>
        <p className="text-sm text-[--color-text-secondary]">
          Choose a strong password with at least 8 characters.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField control={control} name="password" label="New password" required>
          {(field) => (
            <Input
              {...field}
              id="field-password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              startAdornment={<Lock className="h-4 w-4" />}
              error={field.error}
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

        <Button type="submit" className="w-full" loading={confirm.isPending}>
          Reset password
        </Button>
      </form>
    </div>
  )
}

function DoneStep({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--color-success]/15">
        <CheckCircle2 className="h-8 w-8 text-[--color-success]" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[--color-text-primary]">Check your email</h2>
        <p className="text-sm text-[--color-text-secondary]">
          If that email address is registered, we sent a link to reset your password.
        </p>
      </div>
      <Button variant="outline" onClick={onBack}>
        Back to login
      </Button>
    </div>
  )
}
