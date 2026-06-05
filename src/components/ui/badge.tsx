import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-soft text-primary',
        secondary: 'border-transparent bg-secondary-soft text-secondary-foreground',
        accent: 'border-transparent bg-accent-soft text-accent',
        highlight: 'border-transparent bg-highlight-soft text-highlight-foreground',
        warning: 'border-transparent bg-warning/25 text-warning-foreground',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
        success: 'border-transparent bg-secondary-soft text-secondary-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
