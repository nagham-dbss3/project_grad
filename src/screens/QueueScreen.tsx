import { useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ListSkeleton, ErrorState } from '@/components/ui/states'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { DepartmentLane, deptIcon } from '@/components/DepartmentLane'
import { useStore } from '@/store/useStore'
import { useMockLoad } from '@/lib/useMockLoad'
import { buildQueues } from '@/lib/selectors'
import { ar } from '@/i18n/ar'
import type { Department } from '@/mock/types'

const departments: Department[] = ['clinic', 'dayCare', 'inpatient']

export function QueueScreen() {
  const { state, reload } = useMockLoad(500)
  const tokens = useStore((s) => s.tokens)
  const patients = useStore((s) => s.patients)
  const checkIns = useStore((s) => s.checkIns)
  const [tab, setTab] = useState<Department>('clinic')
  const queues = useMemo(() => buildQueues(tokens, patients, checkIns), [tokens, patients, checkIns])

  return (
    <div>
      <PageHeader title={ar.nav.queue} description="استدعِ المرضى وحدّث حالاتهم — التحديثات تظهر على شاشة الانتظار." />

      {state === 'loading' ? (
        <div className="grid lg:grid-cols-3 gap-4">{departments.map((d) => <div key={d} className="rounded-2xl border p-3"><ListSkeleton rows={2} /></div>)}</div>
      ) : state === 'error' ? (
        <Card><ErrorState onRetry={reload} /></Card>
      ) : (
        <>
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            {departments.map((d) => <DepartmentLane key={d} department={d} rows={queues[d]} />)}
          </div>
          <div className="md:hidden">
            <Tabs value={tab} onValueChange={(v) => setTab(v as Department)}>
              <TabsList className="w-full">
                {departments.map((d) => {
                  const Icon = deptIcon[d]
                  return <TabsTrigger key={d} value={d}><Icon className="h-4 w-4" />{ar.dept[d]}</TabsTrigger>
                })}
              </TabsList>
              {departments.map((d) => <TabsContent key={d} value={d} className="mt-3"><DepartmentLane department={d} rows={queues[d]} /></TabsContent>)}
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}
