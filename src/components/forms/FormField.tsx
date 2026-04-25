import React from 'react'
import { Controller, type FieldPath, type FieldValues, type Control } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>
  name: TName
  label?: string
  description?: string
  required?: boolean
  className?: string
  children: (field: {
    value: TFieldValues[TName]
    onChange: (...event: unknown[]) => void
    onBlur: () => void
    name: TName
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ref: React.Ref<any>
    error: boolean
  }) => React.ReactNode
}

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>({ control, name, label, description, required, className, children }: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${name}`
        const descId = description ? `${id}-desc` : undefined
        const errId = fieldState.error ? `${id}-err` : undefined

        return (
          <div className={cn('flex flex-col gap-1.5', className)}>
            {label && (
              <Label htmlFor={id} required={required}>
                {label}
              </Label>
            )}
            {description && (
              <p id={descId} className="text-xs text-[--color-text-secondary]">
                {description}
              </p>
            )}
            <div
              aria-describedby={[descId, errId].filter(Boolean).join(' ') || undefined}
            >
              {children({
                ...field,
                error: !!fieldState.error,
              })}
            </div>
            {fieldState.error && (
              <p
                id={errId}
                role="alert"
                className="text-xs text-[--color-danger]"
                aria-live="polite"
              >
                {fieldState.error.message}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}
