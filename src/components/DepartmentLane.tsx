import { Stethoscope, Sun, BedDouble, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/states'
import { QueueRowCard } from './QueueRowCard'
import { useMasterData } from '@/lib/useMasterData'
import { ar } from '@/i18n/ar'
import type { Department } from '@/mock/types'
import type { QueueRow } from '@/lib/selectors'
import { departmentHasCalled } from '@/lib/selectors'

export const deptIcon: Record<Department, LucideIcon> = {
  clinic: Stethoscope,
  dayCare: Sun,
  inpatient: BedDouble,
}

/** One department column/lane on the dashboard & queue screens. */
export function DepartmentLane({
  department,
  rows,
  showActions = true,
  onCallToken,
}: {
  department: Department
  rows: QueueRow[]
  showActions?: boolean
  onCallToken?: (tokenId: string) => Promise<void>
}) {
  const { getDepartmentLabel } = useMasterData()
  const Icon = deptIcon[department] ?? Stethoscope
  const waiting = rows.filter((r) => r.token.status === 'waiting').length
  const callBlocked = departmentHasCalled(rows)

  return (
    <section className="flex flex-col rounded-2xl border bg-card/60 p-3 min-w-0">
      <header className="flex items-center justify-between gap-2 px-1 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="font-bold text-base">{getDepartmentLabel(department)}</h3>
        </div>
        <Badge variant="muted">{waiting} بالانتظار</Badge>
      </header>

      <div className="flex-1 space-y-2.5 overflow-y-auto no-scrollbar max-h-[60vh] lg:max-h-[calc(100vh-22rem)] pe-0.5">
        {rows.length === 0 ? (
          <EmptyState title={ar.dash.laneEmpty} tone="success" className="py-8" />
        ) : (
          rows.map((row) => (
            <QueueRowCard key={row.token.id} row={row} showActions={showActions} onCallToken={onCallToken} callBlocked={callBlocked} />
          ))
        )}
      </div>
    </section>
  )
}
