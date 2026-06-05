import type { LucideIcon } from 'lucide-react'
import { AlertCircle, Inbox } from 'lucide-react'
import { Button } from './button'
import { Skeleton } from './misc'
import { ar } from '@/i18n/ar'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  tone = 'muted',
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  tone?: 'muted' | 'success'
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-10 px-6', className)}>
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full mb-3',
          tone === 'success' ? 'bg-secondary-soft text-secondary' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <p className="font-bold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-10 px-6', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
        <AlertCircle className="h-7 w-7" />
      </div>
      <p className="font-bold text-foreground">{ar.common.errorTitle}</p>
      <p className="text-sm text-muted-foreground mt-1">{ar.common.errorBody}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          {ar.common.retry}
        </Button>
      )}
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      ))}
    </div>
  )
}
