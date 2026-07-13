import { useCallback, useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ListSkeleton, ErrorState } from '@/components/ui/states'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { DepartmentLane, deptIcon } from '@/components/DepartmentLane'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import type { Department } from '@/mock/types'

const departments: Department[] = ['clinic', 'dayCare', 'inpatient']

export function QueueScreen() {
  const queues = useStore((s) => s.queues)
  const queuesLoading = useStore((s) => s.queuesLoading)
  const queuesError = useStore((s) => s.queuesError)
  const fetchQueues = useStore((s) => s.fetchQueues)
  const fetchPatients = useStore((s) => s.fetchPatients)
  const getPatient = useStore((s) => s.getPatient)
  const callToken = useStore((s) => s.callToken)
  const pushToast = useStore((s) => s.pushToast)
  const [tab, setTab] = useState<Department>('clinic')

  const handleCallToken = useCallback(
    async (tokenId: string) => {
      const row = Object.values(queues).flat().find((r) => r.token.id === tokenId)
      if (!row) return
      const ok = await callToken(tokenId)
      if (!ok) return
      const p = row.patient ?? getPatient(row.token.patientFileNo)
      const name = p ? `${p.firstName} ${p.familyName}`.trim() : row.token.patientFileNo
      pushToast({ variant: 'info', title: ar.common.call, description: `${row.token.number} — ${name}` })
    },
    [queues, callToken, pushToast, getPatient],
  )

  useEffect(() => {
    fetchQueues()
    fetchPatients()
  }, [fetchQueues, fetchPatients])

  return (
    <div>
      <PageHeader title={ar.nav.queue} description="استدعِ المرضى وحدّث حالاتهم — التحديثات تظهر على شاشة الانتظار." />

      {queuesLoading ? (
        <div className="grid lg:grid-cols-3 gap-4">{departments.map((d) => <div key={d} className="rounded-2xl border p-3"><ListSkeleton rows={2} /></div>)}</div>
      ) : queuesError ? (
        <Card><ErrorState onRetry={() => fetchQueues()} /></Card>
      ) : (
        <>
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            {departments.map((d) => <DepartmentLane key={d} department={d} rows={queues[d]} onCallToken={handleCallToken} />)}
          </div>
          <div className="md:hidden">
            <Tabs value={tab} onValueChange={(v) => setTab(v as Department)}>
              <TabsList className="w-full">
                {departments.map((d) => {
                  const Icon = deptIcon[d]
                  return <TabsTrigger key={d} value={d}><Icon className="h-4 w-4" />{ar.dept[d]}</TabsTrigger>
                })}
              </TabsList>
              {departments.map((d) => <TabsContent key={d} value={d} className="mt-3"><DepartmentLane department={d} rows={queues[d]} onCallToken={handleCallToken} /></TabsContent>)}
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}
