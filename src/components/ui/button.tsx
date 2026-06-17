import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[--radius-md] text-sm font-medium transition-[color,background-color,border-color,opacity,transform] duration-[--duration-normal] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-focus-ring] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[--color-accent] text-[--color-text-on-brand] hover:bg-[--color-accent-hover] active:bg-[--color-accent-active]',
        destructive:
          'bg-[--color-danger] text-white hover:opacity-90 active:opacity-80',
        outline:
          'border border-[--color-border-strong] bg-transparent text-[--color-text-primary] hover:bg-[--color-surface-raised]',
        secondary:
          'bg-[--color-surface-raised] text-[--color-text-primary] hover:bg-[--color-neutral-200]',
        ghost:
          'text-[--color-text-primary] hover:bg-[--color-surface-raised]',
        link:
          'text-[--color-accent] underline-offset-4 hover:underline',
      },
      size: {
        sm:      'h-8 px-3 text-xs',
        default: 'h-10 px-4 py-2',
        lg:      'h-11 px-8 text-base',
        icon:    'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled ?? loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="sr-only">Loading</span>
            <svg
              className="animate-spin size-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
