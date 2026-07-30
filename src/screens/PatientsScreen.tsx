import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, UserPlus, Stethoscope, IdCard, CalendarPlus, ChevronLeft, CheckCircle2, X } from 'lucide-react'
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
import { isNewForRegistration } from '@/lib/selectors'
import { ar } from '@/i18n/ar'
import { consultTypes } from '@/i18n/enums'
import { formatAge, formatTime } from '@/lib/utils'
import type { ConsultationType, Department, Patient, Token, CheckIn } from '@/mock/types'

export function PatientsScreen() {
  const navigate = useNavigate()
  const [params, setSearchParams] = useSearchParams()
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

  const filterParam = params.get('filter')
  const [q, setQ] = useState('')
  const [dept, setDept] = useState<Department | ''>('')
  const [consult, setConsult] = useState<ConsultationType | ''>('')
  const [onlyConsult, setOnlyConsult] = useState(filterParam === 'consult')
  const [onlyNew, setOnlyNew] = useState(filterParam === 'new')
  const [sort, setSort] = useState<'arrival' | 'name'>('arrival')
  const [coordinatingId, setCoordinatingId] = useState<string | null>(null)

  useEffect(() => {
    setOnlyConsult(filterParam === 'consult')
    setOnlyNew(filterParam === 'new')
  }, [filterParam])

  const clearRouteFilter = () => {
    setOnlyNew(false)
    setOnlyConsult(false)
    const next = new URLSearchParams(params)
    next.delete('filter')
    setSearchParams(next, { replace: true })
  }

  const toggleNewFilter = () => {
    const next = !onlyNew
    setOnlyNew(next)
    if (next) setOnlyConsult(false)
    const sp = new URLSearchParams(params)
    if (next) sp.set('filter', 'new')
    else sp.delete('filter')
    setSearchParams(sp, { replace: true })
  }

  const toggleConsultFilter = () => {
    const next = !onlyConsult
    setOnlyConsult(next)
    if (next) setOnlyNew(false)
    const sp = new URLSearchParams(params)
    if (next) sp.set('filter', 'consult')
    else sp.delete('filter')
    setSearchParams(sp, { replace: true })
  }

  const handleCoordinate = async (id: string) => {
    setCoordinatingId(id)
    await coordinateConsultRequest(id)
    setCoordinatingId(null)
  }

  useEffect(() => {
    if (onlyConsult) void fetchPendingConsultRequests()
  }, [onlyConsult, fetchPendingConsultRequests])

  const tokenByFile = useMemo(
    () => new Map(tokens.filter((t) => t.status !== 'served' && t.status !== 'cancelled').map((t) => [t.patientFileNo, t])),
    [tokens],
  )
  const checkInByFile = useMemo(() => new Map(checkIns.map((c) => [c.patientFileNo, c])), [checkIns])
  const pendingFiles = useMemo(() => pendingConsultFileNos(consultRequests), [consultRequests])

  const rows = useMemo(() => {
    const query = q.trim()
    let list = patients.filter((p) => {
      if (
        query
        && !(
          p.fileNoBasma.includes(query)
          || `${p.firstName} ${p.familyName} ${p.fatherName}`.includes(query)
          || p.nationalIdPatient.includes(query)
        )
      ) {
        return false
      }
      if (onlyNew) {
        const tk = tokenByFile.get(p.fileNoBasma)
        if (
          !isNewForRegistration(p, {
            hasPendingTokenData: Boolean(tk?.pendingData || (tk?.isEmergency && p.unregistered)),
          })
        ) {
          return false
        }
      }
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
  }, [patients, q, dept, consult, onlyConsult, onlyNew, sort, checkInByFile, consultRequests, pendingFiles, tokenByFile])

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

      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ar.patients.searchPh} className="ps-9" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={dept} onChange={(e) => setDept(e.target.value as Department | '')} placeholder={ar.patients.filterDept}>
              <option value="">{ar.common.all}</option>
              {departmentOptions.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </Select>
            <Select value={consult} onChange={(e) => setConsult(e.target.value as ConsultationType | '')} placeholder={ar.patients.filterConsult}>
              <option value="">{ar.common.all}</option>
              {consultTypes.map((c) => (
                <option key={c} value={c}>{ar.consult[c]}</option>
              ))}
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value as 'arrival' | 'name')}>
              <option value="arrival">{ar.patients.sortArrival}</option>
              <option value="name">{ar.patients.sortName}</option>
            </Select>
            <div className="flex gap-2">
              <FilterChip active={onlyNew} onClick={toggleNewFilter} label={ar.patients.filterNew} />
              <FilterChip active={onlyConsult} onClick={toggleConsultFilter} label={ar.consult.title} />
            </div>
          </div>
          {(onlyNew || onlyConsult || activeDeptLabel) && (
            <div className="flex items-center gap-2 flex-wrap">
              {onlyNew && (
                <Badge variant="secondary" className="gap-1.5 pe-1">
                  {ar.patients.filterNew}
                  <button
                    type="button"
                    onClick={clearRouteFilter}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-muted"
                    aria-label={ar.patients.clearFilter}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {onlyConsult && (
                <Badge variant="secondary" className="gap-1.5 pe-1">
                  {ar.consult.title}
                  <button
                    type="button"
                    onClick={clearRouteFilter}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-muted"
                    aria-label={ar.patients.clearFilter}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {activeDeptLabel && (
                <>
                  <Badge variant="secondary">{ar.common.department}: {activeDeptLabel}</Badge>
                  <button type="button" onClick={() => setDept('')} className="text-xs text-muted-foreground hover:text-foreground font-bold">
                    {ar.common.all}
                  </button>
                </>
              )}
            </div>
          )}
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-1.5 font-bold">{ar.consult.legend}:</p>
            <ConsultLegend types={consultTypes} />
          </div>
        </CardContent>
      </Card>

      {patientsLoading || (onlyConsult && consultRequestsLoading && patients.length === 0) ? (
        <ListSkeleton rows={6} />
      ) : patientsError ? (
        <Card>
          <ErrorState
            onRetry={() => {
              void fetchPatients()
              void fetchPendingConsultRequests()
            }}
          />
        </Card>
      ) : onlyConsult && consultRequestsError && pendingFiles.size === 0 ? (
        <Card>
          <ErrorState onRetry={() => void fetchPendingConsultRequests()} />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            title={ar.patients.empty}
            action={(
              <Button variant="outline" onClick={() => navigate('/patients/new')}>
                <UserPlus className="h-4 w-4" />
                {ar.patients.registerNew}
              </Button>
            )}
          />
        </Card>
      ) : (
        <>
          {/* Desktop table — matches reference: icons beside name, no complete btn unless consult filter */}
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
                  <Th>{ar.common.status}</Th>
                  <Th>{ar.common.actions}</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((p) => (
                  <PatientTableRow
                    key={p.fileNoBasma}
                    patient={p}
                    token={tokenByFile.get(p.fileNoBasma)}
                    checkIn={checkInByFile.get(p.fileNoBasma)}
                    needs={patientConsultNeeds(p, consultRequests)}
                    pendingRequests={consultRequestsForPatient(consultRequests, p.fileNoBasma)}
                    showCompleteActions={onlyConsult}
                    coordinatingId={coordinatingId}
                    onCoordinate={handleCoordinate}
                    getDepartmentLabel={getDepartmentLabel}
                    navigate={navigate}
                  />
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
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
                      {tk ? (
                        <Badge variant="default" className="shrink-0 font-display">{tk.number}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0">—</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => navigate(`/patients/${p.fileNoBasma}`)}
                            className="font-bold hover:text-primary"
                          >
                            {p.firstName} {p.familyName}
                          </button>
                          {needs.length > 0 && <ConsultIcons needs={needs} patient={p} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-bold text-primary">{p.fileNoBasma}</span>
                          {' · '}
                          {[formatAge(p.dob), p.department ? getDepartmentLabel(p.department) : null, ci ? formatTime(ci.arrivalTime) : null]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </p>
                        <div className="mt-2">
                          <PatientStatus patient={p} token={tk} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {onlyConsult && pendingRequests.length > 0 && (
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
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/patients/${p.fileNoBasma}/id-card`)}>
                          <IdCard className="h-4 w-4" />
                          {ar.patients.printId}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => navigate(`/appointments?patient_file_no=${encodeURIComponent(p.fileNoBasma)}`)}
                        >
                          <CalendarPlus className="h-4 w-4" />
                          {ar.patients.schedule}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/patients/${p.fileNoBasma}`)}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
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

function PatientStatus({ patient: p, token: tk }: { patient: Patient; token?: Token }) {
  if (p.unregistered || p.registrationStatus === 'partial' || p.registrationStatus === 'pending' || tk?.pendingData) {
    return <PendingRegistrationBadge />
  }
  if (tk) return <TokenStatusBadge status={tk.status} emergency={tk.isEmergency} />
  return <LifeStatusBadge status={p.lifeStatus} />
}

function PatientTableRow({
  patient: p,
  token: tk,
  checkIn: ci,
  needs,
  pendingRequests,
  showCompleteActions,
  coordinatingId,
  onCoordinate,
  getDepartmentLabel,
  navigate,
}: {
  patient: Patient
  token?: Token
  checkIn?: CheckIn
  needs: ConsultationType[]
  pendingRequests: ReturnType<typeof consultRequestsForPatient>
  showCompleteActions: boolean
  coordinatingId: string | null
  onCoordinate: (id: string) => void
  getDepartmentLabel: (d: Department | string) => string
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <tr className="hover:bg-muted/40 transition-colors">
      <Td>
        {tk ? <Badge variant="default" className="font-display">{tk.number}</Badge> : <span className="text-muted-foreground">—</span>}
      </Td>
      <Td>
        <span className="font-bold text-primary">{p.fileNoBasma}</span>
      </Td>
      <Td>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/patients/${p.fileNoBasma}`)}
            className="font-bold hover:text-primary"
          >
            {p.firstName} {p.familyName}
          </button>
          {needs.length > 0 && <ConsultIcons needs={needs} patient={p} />}
        </div>
      </Td>
      <Td>{formatAge(p.dob) || '—'}</Td>
      <Td>{p.department ? getDepartmentLabel(p.department) : <span className="text-muted-foreground">—</span>}</Td>
      <Td>{ci ? formatTime(ci.arrivalTime) : <span className="text-muted-foreground">—</span>}</Td>
      <Td>
        <PatientStatus patient={p} token={tk} />
      </Td>
      <Td>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {/* Complete consult — only when "استشارات مطلوبة" filter is active */}
          {showCompleteActions
            && pendingRequests.map((r) => (
              <Button
                key={r.id}
                size="sm"
                variant="outline"
                disabled={coordinatingId === r.id}
                onClick={() => void onCoordinate(r.id)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {ar.consult.complete}
              </Button>
            ))}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate(`/patients/${p.fileNoBasma}/id-card`)}
            aria-label={ar.patients.printId}
          >
            <IdCard className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate(`/appointments?patient_file_no=${encodeURIComponent(p.fileNoBasma)}`)}
            aria-label={ar.patients.schedule}
          >
            <CalendarPlus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate(`/patients/${p.fileNoBasma}`)}
            aria-label={ar.common.open}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </Td>
    </tr>
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
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background hover:bg-muted'
      }`}
    >
      {label}
    </button>
  )
}
