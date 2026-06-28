import React, { useState } from 'react'
import {
  Pill, AlertTriangle, Printer, FileDown, Plus, Trash2, ChevronDown, ChevronUp,
  Sparkles, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Prescription, PrescriptionMedication } from '@/types'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormField } from '@/components/forms/FormField'
import { useInferDiagnosis, type DiagnosisSuggestion } from '../hooks/use-consultation'

// ─── Read-only Card ──────────────────────────────────────────────────────────
interface PrescriptionCardProps {
  prescription: Prescription
  onReissue?: (id: string) => void
  onDownloadPdf?: (id: string) => void
  compact?: boolean
  /** Show the "Suggest diagnosis (AI)" action — medic decision-support only. */
  aiDiagnosis?: boolean
  className?: string
}

export function PrescriptionCard({
  prescription,
  onReissue,
  onDownloadPdf,
  compact = false,
  aiDiagnosis = false,
  className,
}: PrescriptionCardProps) {
  const [expanded, setExpanded] = useState(!compact)
  const [suggestion, setSuggestion] = useState<DiagnosisSuggestion | null>(null)
  const inferDiagnosis = useInferDiagnosis()

  const handleSuggest = () => {
    inferDiagnosis.mutate(prescription.medications, {
      onSuccess: (data) => setSuggestion(data),
    })
  }

  const issued = new Date(prescription.issuedAt).toLocaleDateString('ro-RO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <article
      className={cn(
        'rounded-[--radius-md] border border-[--color-border] bg-[--color-surface] overflow-hidden',
        className
      )}
      aria-label={`Prescription issued ${issued}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-[--color-surface-raised] cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-[--color-accent]" aria-hidden="true" />
          <span className="text-sm font-medium text-[--color-text-primary]">
            Prescription — {issued}
          </span>
          {prescription.medications.some((m) => m.interactionWarning) && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" aria-hidden="true" />
              Interaction warning
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[--color-text-tertiary]" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[--color-text-tertiary]" aria-hidden="true" />
          )}
        </div>
      </div>

      {expanded && (
        <>
          {prescription.diagnosis && (
            <div className="px-4 pt-3 pb-0">
              <p className="text-xs text-[--color-text-secondary] font-medium uppercase tracking-wide mb-1">
                Diagnosis
              </p>
              <p className="text-sm text-[--color-text-primary]">{prescription.diagnosis}</p>
            </div>
          )}

          {suggestion && (
            <div
              className="mx-4 mt-3 rounded-[--radius-md] border border-[--color-accent] bg-[--color-surface-raised] p-3"
              role="status"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-[--color-accent]" aria-hidden="true" />
                <span className="text-xs font-medium uppercase tracking-wide text-[--color-accent]">
                  AI suggested diagnosis
                </span>
                <Badge variant="outline" className="text-[10px] ml-1">
                  {suggestion.mock ? 'offline estimate' : `confidence: ${suggestion.confidence}`}
                </Badge>
              </div>
              <p className="text-sm text-[--color-text-primary]">{suggestion.diagnosis}</p>
              {suggestion.reasoning && (
                <p className="text-xs text-[--color-text-secondary] mt-1">{suggestion.reasoning}</p>
              )}
              <p className="text-[11px] text-[--color-text-tertiary] mt-2 italic">
                {suggestion.disclaimer}
              </p>
            </div>
          )}

          {/* Medications */}
          <ul className="divide-y divide-[--color-border] mt-3" aria-label="Medications">
            {prescription.medications.map((med) => (
              <li key={med.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[--color-text-primary]">{med.name}</p>
                    <p className="font-mono text-sm text-[--color-text-secondary] mt-0.5">
                      <span className="tabular-nums">{med.dosage} {med.unit}</span>
                      <span className="mx-1.5 text-[--color-text-tertiary]">·</span>
                      {med.frequency}
                      <span className="mx-1.5 text-[--color-text-tertiary]">·</span>
                      {med.durationDays} days
                    </p>
                    {med.instructions && (
                      <p className="text-xs text-[--color-text-tertiary] mt-1">{med.instructions}</p>
                    )}
                    {med.interactionWarning && (
                      <div className="flex items-start gap-1 mt-1.5 text-danger text-xs">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{med.interactionWarning}</span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {prescription.notes && (
            <div className="px-4 pb-3 pt-2">
              <p className="text-xs text-[--color-text-secondary] font-medium uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm text-[--color-text-secondary]">{prescription.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 px-4 pb-4 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onDownloadPdf?.(prescription.id)}
            >
              <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
              PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              Print
            </Button>
            {aiDiagnosis && prescription.medications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={handleSuggest}
                disabled={inferDiagnosis.isPending}
              >
                {inferDiagnosis.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {inferDiagnosis.isPending ? 'Analyzing…' : 'Suggest diagnosis (AI)'}
              </Button>
            )}
            {onReissue && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 ml-auto"
                onClick={() => onReissue(prescription.id)}
              >
                Reissue
              </Button>
            )}
          </div>
        </>
      )}
    </article>
  )
}

// ─── New Prescription Form ───────────────────────────────────────────────────
const medicationSchema = z.object({
  name: z.string().min(1, 'Required'),
  dosage: z.string().min(1, 'Required'),
  unit: z.string().min(1, 'Required'),
  frequency: z.string().min(1, 'Required'),
  durationDays: z.coerce.number().int().positive('Must be positive'),
  instructions: z.string().optional(),
})

const prescriptionFormSchema = z.object({
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  notes: z.string().optional(),
  medications: z.array(medicationSchema).min(1, 'Add at least one medication'),
})

type PrescriptionFormData = z.infer<typeof prescriptionFormSchema>

interface NewPrescriptionFormProps {
  consultationId: string
  onSubmit: (data: PrescriptionFormData) => Promise<void>
  onCancel: () => void
}

export function NewPrescriptionForm({ consultationId, onSubmit, onCancel }: NewPrescriptionFormProps) {
  const [medications, setMedications] = useState<Array<Partial<PrescriptionMedication>>>([
    { id: crypto.randomUUID() },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: { medications: medications as PrescriptionMedication[] },
  })

  async function submit(data: PrescriptionFormData) {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <div>
        <label className="text-xs font-medium text-[--color-text-secondary] uppercase tracking-wide">
          Diagnosis
        </label>
        <Input
          {...register('diagnosis')}
          placeholder="ICD-10 code or description"
          className="mt-1"
        />
        {errors.diagnosis && (
          <p className="text-xs text-danger mt-1">{errors.diagnosis.message}</p>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[--color-text-secondary] uppercase tracking-wide">
            Medications
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 h-7 text-xs"
            onClick={() => setMedications((m) => [...m, { id: crypto.randomUUID() }])}
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            Add medication
          </Button>
        </div>

        {medications.map((med, idx) => (
          <div key={med.id} className="rounded-[--radius-md] border border-[--color-border] p-3 space-y-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-[--color-text-tertiary]">
                Medication {idx + 1}
              </span>
              {medications.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMedications((m) => m.filter((_, i) => i !== idx))}
                  className="text-[--color-text-tertiary] hover:text-danger"
                  aria-label={`Remove medication ${idx + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Input
              {...register(`medications.${idx}.name`)}
              placeholder="Drug name"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                {...register(`medications.${idx}.dosage`)}
                placeholder="Dosage"
                className="font-mono"
              />
              <Input
                {...register(`medications.${idx}.unit`)}
                placeholder="Unit (mg, ml…)"
              />
              <Input
                {...register(`medications.${idx}.durationDays`)}
                placeholder="Days"
                type="number"
                min={1}
              />
            </div>
            <Input
              {...register(`medications.${idx}.frequency`)}
              placeholder="Frequency (e.g. twice daily)"
            />
            <Input
              {...register(`medications.${idx}.instructions`)}
              placeholder="Special instructions (optional)"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-[--color-text-secondary] uppercase tracking-wide">
          Notes
        </label>
        <Input {...register('notes')} placeholder="Additional notes (optional)" className="mt-1" />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Issuing…' : 'Issue Prescription'}
        </Button>
      </div>
    </form>
  )
}
