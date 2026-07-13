import { Heart, Brain, Eye, Ear, Scissors, Stethoscope, type LucideIcon } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Tooltip } from '@/components/ui/misc'
import { consultLabel } from '@/i18n/enums'
import { ar } from '@/i18n/ar'
import { cn } from '@/lib/utils'
import type { ConsultationType, Patient } from '@/mock/types'

export const consultMeta: Record<ConsultationType, { icon: LucideIcon; tone: string }> = {
  cardiac: { icon: Heart, tone: 'bg-destructive/10 text-destructive' },
  neurological: { icon: Brain, tone: 'bg-accent-soft text-accent' },
  ophthalmic: { icon: Eye, tone: 'bg-primary-soft text-primary' },
  ent: { icon: Ear, tone: 'bg-highlight-soft text-highlight-foreground' },
  surgery: { icon: Scissors, tone: 'bg-secondary-soft text-secondary-foreground' },
  other: { icon: Stethoscope, tone: 'bg-muted text-muted-foreground' },
}

/** Color-coded, tooltip-labeled consult badges beside a patient name. */
export function ConsultIcons({
  needs,
  patient,
  size = 'sm',
}: {
  needs: ConsultationType[]
  patient?: Patient
  size?: 'sm' | 'md'
}) {
  const pushToast = useStore((s) => s.pushToast)
  const pushNotification = useStore((s) => s.pushNotification)
  if (!needs.length) return null

  const dim = size === 'md' ? 'h-9 w-9' : 'h-7 w-7'
  const iconDim = size === 'md' ? 'h-5 w-5' : 'h-4 w-4'

  return (
    <div className="inline-flex items-center gap-1">
      {needs.map((n) => {
        const meta = consultMeta[n]
        const Icon = meta.icon
        const label = consultLabel[n]
        return (
          <Tooltip key={n} label={`${ar.consult.contact} — ${label}`}>
            <button
              type="button"
              aria-label={`${ar.consult.contact} — ${label}`}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (patient) {
                  pushNotification({
                    type: 'info',
                    message: `طلب تنسيق استشارة ${label} — ${patient.firstName} ${patient.familyName}`,
                    relatedPatientFileNo: patient.fileNoBasma,
                    timestamp: new Date().toISOString(),
                  })
                }
                pushToast({
                  variant: 'info',
                  title: ar.consult.contact,
                  description: `استشارة ${label}${patient ? ` — ${patient.firstName} ${patient.familyName}` : ''}`,
                })
              }}
              className={cn(
                'inline-flex items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                dim,
                meta.tone,
              )}
            >
              <Icon className={iconDim} />
            </button>
          </Tooltip>
        )
      })}
    </div>
  )
}

/** Legend for the consult icons (§6.4). */
export function ConsultLegend({ types }: { types: ConsultationType[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {types.map((t) => {
        const meta = consultMeta[t]
        const Icon = meta.icon
        return (
          <span key={t} className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full', meta.tone)}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            {consultLabel[t]}
          </span>
        )
      })}
    </div>
  )
}
