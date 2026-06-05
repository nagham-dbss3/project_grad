import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  /** On phone, render as a bottom sheet (§2.1). */
  asSheet?: boolean
  title?: string
  description?: string
  className?: string
}

export function Dialog({ open, onOpenChange, children, asSheet, title, description, className }: DialogProps) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 w-full bg-card shadow-card animate-fade-in max-h-[92vh] overflow-y-auto',
          asSheet
            ? 'rounded-t-3xl sm:rounded-xl sm:max-w-lg'
            : 'rounded-t-3xl sm:rounded-xl sm:max-w-lg',
          'sm:m-4',
          className,
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          aria-label="إغلاق"
          className="absolute top-4 end-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {(title || description) && (
          <div className="p-6 pb-2">
            {title && <h2 className="text-xl font-bold tracking-tight">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-2', className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-start gap-2 p-6 pt-2', className)} {...props} />
}
