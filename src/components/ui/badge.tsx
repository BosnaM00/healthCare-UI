import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[--radius-full] px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-[--color-accent] text-[--color-text-on-brand]',
        secondary:   'bg-[--color-surface-raised] text-[--color-text-secondary] border border-[--color-border]',
        success:     'bg-[--color-success]/15 text-[--color-success]',
        warning:     'bg-[--color-warning]/15 text-[--color-warning]',
        destructive: 'bg-[--color-danger]/15 text-[--color-danger]',
        info:        'bg-[--color-info]/15 text-[--color-info]',
        outline:     'border border-[--color-border-strong] text-[--color-text-primary]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
