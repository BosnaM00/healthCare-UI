import React, { useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { mfaSchema, type MfaInput } from '../schemas/auth.schema'
import { useMfaVerify } from '../hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { ApiError } from '@/lib/api-client'

interface MfaPageProps {
  onSuccess?: () => void
  onBack?: () => void
}

export function MfaPage({ onSuccess, onBack }: MfaPageProps) {
  const verify = useMfaVerify()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const { control, handleSubmit, setValue, watch } = useForm<MfaInput>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: '' },
  })

  const code = watch('code')
  const digits = (code + '      ').slice(0, 6).split('')

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const current = code.padEnd(6, ' ').split('')
    current[index] = value.slice(-1) || ' '
    const newCode = current.join('').replace(/\s+$/, '')
    setValue('code', newCode)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const onSubmit = (data: MfaInput) => {
    verify.mutate({ code: data.code }, {
      onSuccess: () => {
        toast({ title: 'Verified!', description: 'MFA verification successful.', variant: 'default' })
        onSuccess?.()
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          toast({ title: error.problem.title, description: error.problem.detail, variant: 'destructive' })
        }
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[--color-background]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[--color-accent-subtle]">
            <ShieldCheck className="h-7 w-7 text-[--color-accent]" />
          </div>
          <h1 className="text-2xl font-bold text-[--color-text-primary]">
            Two-factor verification
          </h1>
          <p className="text-sm text-[--color-text-secondary]">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <Controller
            control={control}
            name="code"
            render={({ fieldState }) => (
              <div>
                <div
                  className="flex gap-2 justify-center"
                  role="group"
                  aria-label="One-time password"
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digits[i]?.trim() ?? ''}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-11 h-12 text-center text-lg font-semibold p-0"
                      aria-label={`Digit ${i + 1}`}
                      error={!!fieldState.error}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                {fieldState.error && (
                  <p className="mt-2 text-center text-xs text-[--color-danger]" role="alert">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {import.meta.env.DEV && (
            <p className="text-center text-xs text-[--color-text-secondary]">
              Dev hint: use code <strong>123456</strong>
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" loading={verify.isPending}>
              Verify
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
              Back to login
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
