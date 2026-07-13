import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, UserPlus, Stethoscope, IdCard, CalendarPlus, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ListSkeleton, EmptyState, ErrorState } from '@/components/ui/states'
import { PageHeader } from '@/components/PageHeader'
import { ConsultIcons, ConsultLegend } from '@/components/ConsultIcons'
import { TokenStatusBadge, PendingRegistrationBadge, LifeStatusBadge } from '@/components/StatusBadges'
import { useStore } from '@/store/useStore'
import { useMasterData } from '@/lib/useMasterData'
import { patientConsultNeeds, pendingConsultFileNos, consultRequestsForPatient } from '@/lib/consultRequests'
import { ar } from '@/i18n/ar'
import { consultTypes } from '@/i18n/enums'
import { formatAge, formatTime } from '@/lib/utils'
import type { ConsultationType, Department } from '@/mock/types'

export function PatientsScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const patients = useStore((s) => s.patients)
  const tokens = useStore((s) => s.tokens)
  const checkIns = useStore((s) => s.checkIns)
  const patientsLoading = useStore((s) => s.patientsLoading)
  const patientsError = useStore((s) => s.patientsError)
  const consultRequests = useStore((s) => s.consultRequests)
  const consultRequestsLoading = useStore((s) => s.consultRequestsLoading)
  const consultRequestsError = useStore((s) => s.consultRequestsError)
  const fetchPatients = useStore((s) => s.fetchPatients)
  const fetchPendingConsultRequests = useStore((s) => s.fetchPendingConsultRequests)
  const coordinateConsultRequest = useStore((s) => s.coordinateConsultRequest)
  const fetchQueues = useStore((s) => s.fetchQueues)
  const { departmentOptions, getDepartmentLabel } = useMasterData()

  useEffect(() => {
    fetchPatients()
    fetchQueues()
    void fetchPendingConsultRequests()
  }, [fetchPatients, fetchQueues, fetchPendingConsultRequests])

  const [q, setQ] = useState('')
  const [dept, setDept] = useState<Department | ''>('')
  const [consult, setConsult] = useState<ConsultationType | ''>(params.get('filter') === 'consult' ? '' : '')
  const [onlyConsult, setOnlyConsult] = useState(params.get('filter') === 'consult')
  const [sort, setSort] = useState<'arrival' | 'name'>('arrival')
  const [coordinatingId, setCoordinatingId] = useState<string | null>(null)

  const handleCoordinate = async (id: string) => {
    setCoordinatingId(id)
    await coordinateConsultRequest(id)
    setCoordinatingId(null)
  }

  useEffect(() => {
    if (onlyConsult) void fetchPendingConsultRequests()
  }, [onlyConsult, fetchPendingConsultRequests])

  const tokenByFile = useMemo(() => new Map(tokens.filter((t) => t.status !== 'served' && t.status !== 'cancelled').map((t) => [t.patientFileNo, t])), [tokens])
  const checkInByFile = useMemo(() => new Map(checkIns.map((c) => [c.patientFileNo, c])), [checkIns])

  const pendingFiles = useMemo(() => pendingConsultFileNos(consultRequests), [consultRequests])

  const rows = useMemo(() => {
    const query = q.trim()
    let list = patients.filter((p) => {
      if (query && !(p.fileNoBasma.includes(query) || `${p.firstName} ${p.familyName} ${p.fatherName}`.includes(query) || p.nationalIdPatient.includes(query))) return false
      if (onlyConsult && !pendingFiles.has(p.fileNoBasma)) return false
      const needs = patientConsultNeeds(p, consultRequests)
      if (consult && !needs.includes(consult)) return false
      if (dept && p.department !== dept) return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'name') return `${a.firstName} ${a.familyName}`.localeCompare(`${b.firstName} ${b.familyName}`, 'ar')
      const ca = checkInByFile.get(a.fileNoBasma)?.arrivalTime ?? ''
      const cb = checkInByFile.get(b.fileNoBasma)?.arrivalTime ?? ''
      return cb.localeCompare(ca)
    })
    return list
  }, [patients, q, dept, consult, onlyConsult, sort, checkInByFile, consultRequests, pendingFiles])

  const activeDeptLabel = dept ? getDepartmentLabel(dept) : null

  return (
    <div>
      <PageHeader
        title={ar.patients.title}
        description={activeDeptLabel ? `${ar.common.department}: ${activeDeptLabel}` : undefined}
        action={
          <div className="flex flex-wrap gap-2 justify-end">
            <Button onClick={() => navigate('/patients/consult')}>
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">{ar.patients.registerConsult}</span>
            </Button>
            <Button onClick={() => navigate('/patients/new')}>
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">{ar.patients.registerNew}</span>
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ar.patients.searchPh} className="ps-9" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={dept} onChange={(e) => setDept(e.target.value as Department | '')} placeholder={ar.patients.filterDept}>
              <option value="">{ar.common.all}</option>
              {departmentOptions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </Select>
            <Select value={consult} onChange={(e) => setConsult(e.target.value as ConsultationType | '')} placeholder={ar.patients.filterConsult}>
              <option value="">{ar.common.all}</option>
              {consultTypes.map((c) => <option key={c} value={c}>{ar.consult[c]}</option>)}
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value as 'arrival' | 'name')}>
              <option value="arrival">{ar.patients.sortArrival}</option>
              <option value="name">{ar.patients.sortName}</option>
            </Select>
            <div className="flex gap-2">
              <FilterChip active={onlyConsult} onClick={() => setOnlyConsult((v) => !v)} label={ar.consult.title} />
            </div>
          </div>
          {activeDeptLabel && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{ar.common.department}: {activeDeptLabel}</Badge>
              <button type="button" onClick={() => setDept('')} className="text-xs text-muted-foreground hover:text-foreground font-bold">
                {ar.common.all}
              </button>
            </div>
          )}
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-1.5 font-bold">{ar.consult.legend}:</p>
            <ConsultLegend types={consultTypes} />
          </div>
        </CardContent>
      </Card>

      {patientsLoading || (onlyConsult && consultRequestsLoading) ? (
        <ListSkeleton rows={6} />
      ) : patientsError || (onlyConsult && consultRequestsError) ? (
        <Card>
          <ErrorState onRetry={() => {
            void fetchPatients()
            if (onlyConsult) void fetchPendingConsultRequests()
          }} />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            title={ar.patients.empty}
            action={<Button variant="outline" onClick={() => navigate('/patients/new')}><UserPlus className="h-4 w-4" />{ar.patients.registerNew}</Button>}
          />
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden lg:block overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr className="text-start">
                  <Th>الرمز</Th>
                  <Th>{ar.common.fileNo}</Th>
                  <Th>{ar.common.name}</Th>
                  <Th>{ar.common.age}</Th>
                  <Th>{ar.common.department}</Th>
                  <Th>{ar.common.arrivalTime}</Th>
                  <Th>{ar.patients.filterConsult}</Th>
                  <Th>{ar.common.status}</Th>
                  <Th>{ar.common.actions}</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((p) => {
                  const tk = tokenByFile.get(p.fileNoBasma)
                  const ci = checkInByFile.get(p.fileNoBasma)
                  const needs = patientConsultNeeds(p, consultRequests)
                  const pendingRequests = consultRequestsForPatient(consultRequests, p.fileNoBasma)
                  return (
                    <tr key={p.fileNoBasma} className="hover:bg-muted/40 transition-colors">
                      <Td>{tk ? <Badge variant="default">{tk.number}</Badge> : <span className="text-muted-foreground">—</span>}</Td>
                      <Td><span className="font-bold text-primary">{p.fileNoBasma}</span></Td>
                      <Td>
                        <button onClick={() => navigate(`/patients/${p.fileNoBasma}`)} className="font-bold hover:text-primary">{p.firstName} {p.familyName}</button>
                      </Td>
                      <Td>{formatAge(p.dob)}</Td>
                      <Td>{p.department ? getDepartmentLabel(p.department) : <span className="text-muted-foreground">—</span>}</Td>
                      <Td>{ci ? formatTime(ci.arrivalTime) : <span className="text-muted-foreground">—</span>}</Td>
                      <Td>
                        {needs.length ? (
                          <ConsultIcons needs={needs} patient={p} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </Td>
                      <Td>{p.unregistered ? <PendingRegistrationBadge /> : tk ? <TokenStatusBadge status={tk.status} emergency={tk.isEmergency} /> : <LifeStatusBadge status={p.lifeStatus} />}</Td>
                      <Td>
                        <div className="flex items-center gap-1 flex-wrap">
                          {pendingRequests.map((r) => (
                            <Button
                              key={r.id}
                              size="sm"
                              variant="outline"
                              disabled={coordinatingId === r.id}
                              onClick={() => void handleCoordinate(r.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {ar.consult.complete}
                            </Button>
                          ))}
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/patients/${p.fileNoBasma}/id-card`)} aria-label={ar.patients.printId}><IdCard className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/appointments?patient_file_no=${encodeURIComponent(p.fileNoBasma)}`)} aria-label={ar.patients.schedule}><CalendarPlus className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/patients/${p.fileNoBasma}`)} aria-label={ar.common.open}><ChevronLeft className="h-4 w-4" /></Button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>

          {/* Mobile / tablet stacked cards */}
          <div className="lg:hidden space-y-3">
            {rows.map((p) => {
              const tk = tokenByFile.get(p.fileNoBasma)
              const ci = checkInByFile.get(p.fileNoBasma)
              const needs = patientConsultNeeds(p, consultRequests)
              const pendingRequests = consultRequestsForPatient(consultRequests, p.fileNoBasma)
              return (
                <Card key={p.fileNoBasma}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center justify-center rounded-lg bg-primary-soft text-primary px-2.5 py-1.5 min-w-[3.5rem]">
                        <span className="text-[10px]">{ar.common.fileNo}</span>
                        <span className="font-bold leading-none">{p.fileNoBasma}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => navigate(`/patients/${p.fileNoBasma}`)} className="font-bold hover:text-primary">{p.firstName} {p.familyName}</button>
                        </div>
                        {needs.length > 0 && (
                          <div className="mt-1.5">
                            <ConsultIcons needs={needs} patient={p} />
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatAge(p.dob)} · {p.department ? getDepartmentLabel(p.department) : '—'}{ci && ` · ${formatTime(ci.arrivalTime)}`}
                        </p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {tk && <Badge variant="default">{tk.number}</Badge>}
                          {p.unregistered ? <PendingRegistrationBadge /> : tk ? <TokenStatusBadge status={tk.status} emergency={tk.isEmergency} /> : <LifeStatusBadge status={p.lifeStatus} />}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {pendingRequests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {pendingRequests.map((r) => (
                            <Button
                              key={r.id}
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              disabled={coordinatingId === r.id}
                              onClick={() => void handleCoordinate(r.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {ar.consult.complete}
                            </Button>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/patients/${p.fileNoBasma}/id-card`)}><IdCard className="h-4 w-4" />{ar.patients.printId}</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/appointments?patient_file_no=${encodeURIComponent(p.fileNoBasma)}`)}><CalendarPlus className="h-4 w-4" />{ar.patients.schedule}</Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/patients/${p.fileNoBasma}`)}><ChevronLeft className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-start font-bold text-xs">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-middle">{children}</td>
}
function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background hover:bg-muted'}`}
    >
      {label}
    </button>
  )
}
