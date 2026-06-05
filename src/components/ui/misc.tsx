import * as React from 'react'
import { cn } from '@/lib/utils'

/** Tooltip — CSS hover/focus based, RTL-aware. */
export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-1 start-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-bold text-background opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 rtl:translate-x-1/2"
      >
        {label}
      </span>
    </span>
  )
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse-soft rounded-md bg-muted', className)} />
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
  return (
    <span
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-sm shrink-0',
        className,
      )}
    >
      {initials}
    </span>
  )
}

/** Segmented control — for department assignment (one obvious choice, big targets). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-3 gap-2', className)} role="radiogroup">
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'min-h-[44px] rounded-lg border px-3 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                : 'border-input bg-background hover:bg-accent-soft hover:text-accent',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Field wrapper with label + optional error. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-bold text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {error && <p className="text-xs text-destructive mt-1 font-bold">{error}</p>}
    </div>
  )
}
