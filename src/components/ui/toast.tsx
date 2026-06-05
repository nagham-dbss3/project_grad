import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import type { ToastMessage } from '@/store/useStore'

const config: Record<
  ToastMessage['variant'],
  { icon: typeof Info; ring: string; iconColor: string }
> = {
  success: { icon: CheckCircle2, ring: 'border-secondary/40', iconColor: 'text-secondary' },
  error: { icon: XCircle, ring: 'border-destructive/40', iconColor: 'text-destructive' },
  warning: { icon: AlertTriangle, ring: 'border-warning/50', iconColor: 'text-warning-foreground' },
  info: { icon: Info, ring: 'border-primary/40', iconColor: 'text-primary' },
}

export function Toaster() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:end-4 sm:bottom-4 z-[60] flex flex-col gap-2 sm:w-96 no-print">
      {toasts.map((t) => {
        const c = config[t.variant]
        const Icon = c.icon
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card animate-fade-in',
              c.ring,
            )}
          >
            <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', c.iconColor)} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{t.title}</p>
              {t.description && <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="إغلاق"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
