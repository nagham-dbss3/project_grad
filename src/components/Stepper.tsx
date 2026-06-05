import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Horizontal step indicator for guided flows (RTL-aware). */
export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <ol className={cn('flex items-center gap-1 overflow-x-auto no-scrollbar', className)}>
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors shrink-0',
                  done && 'bg-secondary text-secondary-foreground',
                  active && 'bg-primary text-primary-foreground',
                  !done && !active && 'bg-muted text-muted-foreground',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-xs font-bold whitespace-nowrap',
                  active ? 'text-foreground' : 'text-muted-foreground',
                  'hidden sm:inline',
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <span className="w-4 sm:w-8 h-0.5 bg-border mx-1" />}
          </li>
        )
      })}
    </ol>
  )
}
