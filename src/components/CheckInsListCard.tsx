import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import { useStore } from '@/store/useStore'
import { useMasterData } from '@/lib/useMasterData'
import { hasActiveCheckInToday } from '@/lib/patientVisit'
import { ar } from '@/i18n/ar'
import { formatDate, formatTime } from '@/lib/utils'
import type { CheckIn } from '@/mock/types'

function uniqueRows(rows: CheckIn[]): CheckIn[] {
  const best = new Map<string, CheckIn>()
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const key = String(row.patientFileNo ?? '').trim()
    if (!key) continue
    const prev = best.get(key)
    if (!prev || String(row.arrivalTime ?? '') > String(prev.arrivalTime ?? '')) best.set(key, row)
  }
  return [...best.values()]
}

export function CheckInsListCard() {
  const navigate = useNavigate()
  const rawRows = useStore((s) => s.checkInList)
  const page = useStore((s) => s.checkInListPage) ?? 1
  const lastPage = useStore((s) => s.checkInListLastPage) ?? 1
  const loading = useStore((s) => s.checkInListLoading)
  const queuesLoading = useStore((s) => s.queuesLoading)
  const error = useStore((s) => s.checkInListError)
  const fetchCheckIns = useStore((s) => s.fetchCheckIns)
  const fetchQueues = useStore((s) => s.fetchQueues)
  const tokens = useStore((s) => s.tokens)
  const checkIns = useStore((s) => s.checkIns)
  const queues = useStore((s) => s.queues)
  const { getDepartmentLabel } = useMasterData()

  const rows = useMemo(() => {
    return uniqueRows(Array.isArray(rawRows) ? rawRows : []).filter((c) =>
      hasActiveCheckInToday(c.patientFileNo, tokens, checkIns, queues),
    )
  }, [rawRows, tokens, checkIns, queues])

  const listLoading = Boolean(loading || queuesLoading)

  useEffect(() => {
    void fetchQueues?.()
    void fetchCheckIns?.(1)
  }, [fetchCheckIns, fetchQueues])

  return (
    <Card className="mt-4">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-bold">{ar.checkin.listTitle}</h3>
          <Badge variant="muted">{rows.length}</Badge>
        </div>
        {listLoading ? (
          <ListSkeleton rows={5} />
        ) : error ? (
          <ErrorState onRetry={() => { void fetchQueues(); void fetchCheckIns(page) }} />
        ) : rows.length ? (
          <>
            <div className="divide-y">
              {rows.map((c) => (
                <button
                  key={`${c.patientFileNo}-${c.id}`}
                  type="button"
                  className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 py-3 text-sm text-start hover:bg-muted/50"
                  onClick={() => {
                    if (!c.patientFileNo) return
                    navigate(`/patients/${encodeURIComponent(c.patientFileNo)}`)
                  }}
                >
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-bold">{c.patientFileNo}</span>
                  <span className="text-muted-foreground">{formatDate(c.arrivalTime)}</span>
                  <span className="text-muted-foreground">{formatTime(c.arrivalTime)}</span>
                  <Badge variant="muted">{getDepartmentLabel(c.department)}</Badge>
                  {c.isEmergency && <Badge variant="warning">{ar.common.emergencyTag}</Badge>}
                  <span className="text-muted-foreground ms-auto truncate max-w-full sm:max-w-[12rem]">
                    {c.visitReason || '—'}
                  </span>
                </button>
              ))}
            </div>
            {lastPage > 1 && (
              <div className="flex items-center justify-between gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || loading}
                  onClick={() => void fetchCheckIns(page - 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                  {ar.common.prev}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {ar.checkin.page} {page} / {lastPage}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= lastPage || loading}
                  onClick={() => void fetchCheckIns(page + 1)}
                >
                  {ar.common.next}
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState title={ar.checkin.emptyList} />
        )}
      </CardContent>
    </Card>
  )
}
