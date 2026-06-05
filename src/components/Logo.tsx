import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * BASMA brand logo.
 * Place the provided logo file at `public/logo.png` (or .svg) and it appears everywhere.
 * Until then, a branded gradient mark is shown as a graceful fallback.
 */
export function Logo({ className, alt = 'بسمة — BASMA' }: { className?: string; alt?: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <span className={cn('inline-block rounded-2xl gradient-brand shadow-card', className)} aria-label={alt} role="img" />
  }

  return (
    <img
      src="/logo.png"
      alt={alt}
      onError={() => setFailed(true)}
      className={cn('object-contain w-auto', className)}
    />
  )
}
