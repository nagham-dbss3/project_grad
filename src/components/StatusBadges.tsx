import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Siren, Clock, PhoneCall, CheckCircle2, Ban, ClipboardPen, Heart, HeartCrack, PauseCircle, HelpCircle } from 'lucide-react'
import { ar } from '@/i18n/ar'
import type { LifeStatus, TokenStatus } from '@/mock/types'

const tokenStatusMeta: Record<
  TokenStatus,
  { variant: BadgeProps['variant']; icon: typeof Clock; label: string; className?: string }
> = {
  waiting: {
    variant: 'muted',
    icon: Clock,
    label: ar.tokenStatus.waiting,
    className: 'bg-muted text-muted-foreground',
  },
  called: {
    variant: 'default',
    icon: PhoneCall,
    label: ar.tokenStatus.called,
    className: 'bg-primary-soft text-primary',
  },
  served: { variant: 'secondary', icon: CheckCircle2, label: ar.tokenStatus.served },
  cancelled: { variant: 'muted', icon: Ban, label: ar.tokenStatus.cancelled },
}

/** Emergency-only badge — compose side-by-side with PendingCompletionBadge when needed. */
export function EmergencyBadge() {
  return (
    <Badge variant="warning" className="bg-warning/30 shrink-0 whitespace-nowrap">
      <Siren className="h-3.5 w-3.5" />
      {ar.common.emergencyTag}
    </Badge>
  )
}

/** Incomplete registration — «بانتظار استكمال البيانات». */
export function PendingCompletionBadge() {
  return (
    <Badge variant="accent" className="shrink-0 whitespace-nowrap">
      <ClipboardPen className="h-3.5 w-3.5" />
      {ar.emergency.pendingFlag}
    </Badge>
  )
}

export function TokenStatusBadge({ status, emergency }: { status: TokenStatus; emergency?: boolean }) {
  if (emergency && status !== 'served' && status !== 'cancelled') {
    return <EmergencyBadge />
  }
  const m = tokenStatusMeta[status] ?? tokenStatusMeta.waiting
  const Icon = m.icon
  return (
    <Badge variant={m.variant} className={m.className}>
      <Icon className="h-3.5 w-3.5" />
      {m.label}
    </Badge>
  )
}

export function PendingRegistrationBadge() {
  return <PendingCompletionBadge />
}

const lifeStatusMeta: Record<
  LifeStatus,
  { variant: BadgeProps['variant']; icon: typeof Heart; label: string }
> = {
  alive: { variant: 'secondary', icon: Heart, label: ar.lifeStatus.alive },
  deceased: { variant: 'muted', icon: HeartCrack, label: ar.lifeStatus.deceased },
  treatmentStopped: { variant: 'warning', icon: PauseCircle, label: ar.lifeStatus.treatmentStopped },
  lostToFollowUp: { variant: 'outline', icon: HelpCircle, label: ar.lifeStatus.lostToFollowUp },
  unknown: { variant: 'muted', icon: HelpCircle, label: ar.lifeStatus.unknown },
}

export function LifeStatusBadge({ status }: { status: LifeStatus }) {
  const m = lifeStatusMeta[status]
  const Icon = m.icon
  return (
    <Badge variant={m.variant}>
      <Icon className="h-3.5 w-3.5" />
      {m.label}
    </Badge>
  )
}
