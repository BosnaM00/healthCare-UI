import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { FormField } from '@/components/forms/FormField'
import { useFileDispute } from '../hooks/use-admin'
import type { DisputeReason } from '@/types'

const REASON_LABELS: Record<DisputeReason, string> = {
  NO_SHOW_MEDIC: 'Medic did not show up',
  NO_SHOW_PATIENT: 'Patient did not show up',
  POOR_SERVICE: 'Poor quality of service',
  TECHNICAL_ISSUE: 'Technical issue during video call',
  BILLING: 'Billing or payment dispute',
  OTHER: 'Other reason',
}

const schema = z.object({
  reason: z.enum([
    'NO_SHOW_MEDIC', 'NO_SHOW_PATIENT', 'POOR_SERVICE',
    'TECHNICAL_ISSUE', 'BILLING', 'OTHER',
  ] as const),
  description: z.string().min(20, 'Please provide at least 20 characters describing the issue'),
})

type FormData = z.infer<typeof schema>

interface DisputeFilingFormProps {
  bookingId: string
  onSuccess: () => void
  onCancel: () => void
}

export function DisputeFilingForm({ bookingId, onSuccess, onCancel }: DisputeFilingFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const { mutateAsync, isPending } = useFileDispute()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const reason = watch('reason')

  async function onSubmit(data: FormData) {
    await mutateAsync({ bookingId, ...data })
    setSubmitted(true)
    setTimeout(onSuccess, 1500)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
        <CheckCircle2 className="h-10 w-10 text-[--color-success]" aria-hidden="true" />
        <p className="font-medium text-[--color-text-primary]">Dispute filed</p>
        <p className="text-sm text-[--color-text-secondary]">
          Our team will review your case within 2 business days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Warning notice */}
      <div className="flex items-start gap-2 rounded-[--radius-md] bg-[--color-warning]/8 border border-[--color-warning]/20 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-[--color-warning] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-[--color-text-primary]">
          Filing a dispute is irreversible and will pause any pending payment release.
          Please provide accurate and detailed information.
        </p>
      </div>

      {/* Reason */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[--color-text-primary]" htmlFor="reason">
          Reason for dispute <span aria-hidden="true" className="text-danger">*</span>
        </label>
        <Select
          onValueChange={(v) => setValue('reason', v as DisputeReason)}
          value={reason}
        >
          <SelectTrigger id="reason" aria-required="true">
            <SelectValue placeholder="Select a reason…" />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(REASON_LABELS) as [DisputeReason, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.reason && (
          <p className="text-xs text-danger" role="alert">{errors.reason.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[--color-text-primary]" htmlFor="description">
          Description <span aria-hidden="true" className="text-danger">*</span>
        </label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe what happened in detail. Include dates, times, and any communications."
          className="min-h-[120px]"
          aria-required="true"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="text-xs text-danger" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={isPending}>
          {isPending ? 'Filing dispute…' : 'File dispute'}
        </Button>
      </div>
    </form>
  )
}
