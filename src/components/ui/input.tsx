import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startAdornment?: React.ReactNode
  endAdornment?: React.ReactNode
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startAdornment, endAdornment, error, ...props }, ref) => {
    if (startAdornment || endAdornment) {
      return (
        <div className="relative flex items-center">
          {startAdornment && (
            <span className="absolute left-3 text-[--color-text-secondary] pointer-events-none flex items-center">
              {startAdornment}
            </span>
          )}
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-[--radius-md] border bg-[--color-surface] px-3 py-2 text-sm text-[--color-text-primary]',
              'placeholder:text-[--color-text-disabled]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-focus-ring]',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[--color-neutral-100]',
              'transition-colors duration-[--duration-fast]',
              error
                ? 'border-[--color-danger] focus-visible:ring-[--color-danger]'
                : 'border-[--color-border] hover:border-[--color-border-strong] focus-visible:border-[--color-accent]',
              startAdornment && 'pl-9',
              endAdornment && 'pr-9',
              className
            )}
            ref={ref}
            aria-invalid={error}
            {...props}
          />
          {endAdornment && (
            <span className="absolute right-3 text-[--color-text-secondary] flex items-center">
              {endAdornment}
            </span>
          )}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-[--radius-md] border bg-[--color-surface] px-3 py-2 text-sm text-[--color-text-primary]',
          'placeholder:text-[--color-text-disabled]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-focus-ring]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[--color-neutral-100]',
          'transition-colors duration-[--duration-fast]',
          error
            ? 'border-[--color-danger] focus-visible:ring-[--color-danger]'
            : 'border-[--color-border] hover:border-[--color-border-strong] focus-visible:border-[--color-accent]',
          className
        )}
        ref={ref}
        aria-invalid={error}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
