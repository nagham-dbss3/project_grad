import { Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConsultIcons } from './ConsultIcons'
import { LifeStatusBadge } from './StatusBadges'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import { departmentLabel } from '@/i18n/enums'
import { formatAge, formatDate } from '@/lib/utils'
import type { Patient } from '@/mock/types'

/** Sticky context bar at the top of patient-scoped screens (§6.5). */
export function PatientContextBar({ patient }: { patient: Patient }) {
  const tokens = useStore((s) => s.tokens)
  const pushToast = useStore((s) => s.pushToast)
  const todayToken = tokens.find(
    (t) => t.patientFileNo === patient.fileNoBasma && t.status !== 'served' && t.status !== 'cancelled',
  )
  const phone = patient.phones.father || patient.phones.mother || patient.phones.caregiver

  return (
    <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-card/90 backdrop-blur border-b">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">
              {patient.firstName} {patient.familyName}
            </h1>
            <LifeStatusBadge status={patient.lifeStatus} />
            <ConsultIcons needs={patient.consultationNeeds} patient={patient} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="font-bold text-primary">{ar.common.fileNo}: {patient.fileNoBasma}</span>
            <span>البيروني: {patient.fileNoBiruni}</span>
            <span>{formatDate(patient.dob)} · {formatAge(patient.dob)}</span>
            <span>{patient.gender === 'male' ? ar.common.male : ar.common.female}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ms-auto">
          {todayToken && (
            <Badge variant="default">
              {departmentLabel[todayToken.department]} · {todayToken.number}
            </Badge>
          )}
          {phone && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                pushToast({ variant: 'info', title: ar.record.guardianContact, description: phone })
              }
            >
              <Phone className="h-4 w-4" />
              {phone}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
