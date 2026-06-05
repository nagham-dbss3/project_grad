import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Siren, Clock, PhoneCall, CheckCircle2, Ban, UserPlus, Heart, HeartCrack, PauseCircle, HelpCircle } from 'lucide-react'
import { ar } from '@/i18n/ar'
import type { LifeStatus, TokenStatus } from '@/mock/types'

const tokenStatusMeta: Record<
  TokenStatus,
  { variant: BadgeProps['variant']; icon: typeof Clock; label: string }
> = {
  waiting: { variant: 'warning', icon: Clock, label: ar.tokenStatus.waiting },
  called: { variant: 'default', icon: PhoneCall, label: ar.tokenStatus.called },
  served: { variant: 'secondary', icon: CheckCircle2, label: ar.tokenStatus.served },
  cancelled: { variant: 'muted', icon: Ban, label: ar.tokenStatus.cancelled },
}

export function TokenStatusBadge({ status, emergency }: { status: TokenStatus; emergency?: boolean }) {
  if (emergency && status !== 'served' && status !== 'cancelled') {
    return (
      <Badge variant="warning" className="bg-warning/30">
        <Siren className="h-3.5 w-3.5" />
        {ar.common.emergencyTag}
      </Badge>
    )
  }
  const m = tokenStatusMeta[status]
  const Icon = m.icon
  return (
    <Badge variant={m.variant}>
      <Icon className="h-3.5 w-3.5" />
      {m.label}
    </Badge>
  )
}

export function PendingRegistrationBadge() {
  return (
    <Badge variant="accent">
      <UserPlus className="h-3.5 w-3.5" />
      {ar.patientStatus.pendingRegistration}
    </Badge>
  )
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
