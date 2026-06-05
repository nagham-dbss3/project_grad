import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, UserPlus, IdCard, CalendarPlus, ChevronLeft } from 'lucide-react'
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
import { useMockLoad } from '@/lib/useMockLoad'
import { ar } from '@/i18n/ar'
import { consultTypes, departmentOptions, departmentLabel } from '@/i18n/enums'
import { formatAge, formatTime } from '@/lib/utils'
import type { ConsultationType, Department } from '@/mock/types'

export function PatientsScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { state, reload } = useMockLoad(600)
  const patients = useStore((s) => s.patients)
  const tokens = useStore((s) => s.tokens)
  const checkIns = useStore((s) => s.checkIns)

  const [q, setQ] = useState('')
  const [dept, setDept] = useState<Department | ''>('')
  const [consult, setConsult] = useState<ConsultationType | ''>(params.get('filter') === 'consult' ? '' : '')
  const [onlyNew, setOnlyNew] = useState(params.get('filter') === 'new')
  const [onlyConsult, setOnlyConsult] = useState(params.get('filter') === 'consult')
  const [sort, setSort] = useState<'arrival' | 'name'>('arrival')

  const tokenByFile = useMemo(() => new Map(tokens.filter((t) => t.status !== 'served' && t.status !== 'cancelled').map((t) => [t.patientFileNo, t])), [tokens])
  const checkInByFile = useMemo(() => new Map(checkIns.map((c) => [c.patientFileNo, c])), [checkIns])

  const rows = useMemo(() => {
    const query = q.trim()
    let list = patients.filter((p) => {
      if (query && !(p.fileNoBasma.includes(query) || `${p.firstName} ${p.familyName} ${p.fatherName}`.includes(query) || p.nationalIdPatient.includes(query))) return false
      if (onlyNew && !p.unregistered) return false
      if (onlyConsult && p.consultationNeeds.length === 0) return false
      if (consult && !p.consultationNeeds.includes(consult)) return false
      if (dept) {
        const tk = tokenByFile.get(p.fileNoBasma)
        if (!tk || tk.department !== dept) return false
      }
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'name') return `${a.firstName} ${a.familyName}`.localeCompare(`${b.firstName} ${b.familyName}`, 'ar')
      const ca = checkInByFile.get(a.fileNoBasma)?.arrivalTime ?? ''
      const cb = checkInByFile.get(b.fileNoBasma)?.arrivalTime ?? ''
      return cb.localeCompare(ca)
    })
    return list
  }, [patients, q, dept, consult, onlyNew, onlyConsult, sort, tokenByFile, checkInByFile])

  return (
    <div>
      <PageHeader
        title={ar.patients.title}
        action={
          <Button onClick={() => navigate('/patients/new')}>
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{ar.patients.registerNew}</span>
          </Button>
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
              <FilterChip active={onlyNew} onClick={() => setOnlyNew((v) => !v)} label={ar.dash.newToRegister} />
              <FilterChip active={onlyConsult} onClick={() => setOnlyConsult((v) => !v)} label={ar.consult.title} />
            </div>
          </div>
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-1.5 font-bold">{ar.consult.legend}:</p>
            <ConsultLegend types={consultTypes} />
          </div>
        </CardContent>
      </Card>

      {state === 'loading' ? (
        <ListSkeleton rows={6} />
      ) : state === 'error' ? (
        <Card><ErrorState onRetry={reload} /></Card>
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
                  <Th>{ar.common.status}</Th>
                  <Th>{ar.common.actions}</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((p) => {
                  const tk = tokenByFile.get(p.fileNoBasma)
                  const ci = checkInByFile.get(p.fileNoBasma)
                  return (
                    <tr key={p.fileNoBasma} className="hover:bg-muted/40 transition-colors">
                      <Td>{tk ? <Badge variant="default">{tk.number}</Badge> : <span className="text-muted-foreground">—</span>}</Td>
                      <Td><span className="font-bold text-primary">{p.fileNoBasma}</span></Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/patients/${p.fileNoBasma}`)} className="font-bold hover:text-primary">{p.firstName} {p.familyName}</button>
                          <ConsultIcons needs={p.consultationNeeds} patient={p} />
                        </div>
                      </Td>
                      <Td>{formatAge(p.dob)}</Td>
                      <Td>{tk ? departmentLabel[tk.department] : <span className="text-muted-foreground">—</span>}</Td>
                      <Td>{ci ? formatTime(ci.arrivalTime) : <span className="text-muted-foreground">—</span>}</Td>
                      <Td>{p.unregistered ? <PendingRegistrationBadge /> : tk ? <TokenStatusBadge status={tk.status} emergency={tk.isEmergency} /> : <LifeStatusBadge status={p.lifeStatus} />}</Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/patients/${p.fileNoBasma}/id-card`)} aria-label={ar.patients.printId}><IdCard className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/appointments?fileNo=${p.fileNoBasma}`)} aria-label={ar.patients.schedule}><CalendarPlus className="h-4 w-4" /></Button>
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
                          <ConsultIcons needs={p.consultationNeeds} patient={p} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatAge(p.dob)} · {tk ? departmentLabel[tk.department] : '—'}{ci && ` · ${formatTime(ci.arrivalTime)}`}
                        </p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {tk && <Badge variant="default">{tk.number}</Badge>}
                          {p.unregistered ? <PendingRegistrationBadge /> : tk ? <TokenStatusBadge status={tk.status} emergency={tk.isEmergency} /> : <LifeStatusBadge status={p.lifeStatus} />}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-1.5">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/patients/${p.fileNoBasma}/id-card`)}><IdCard className="h-4 w-4" />{ar.patients.printId}</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/appointments?fileNo=${p.fileNoBasma}`)}><CalendarPlus className="h-4 w-4" />{ar.patients.schedule}</Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/patients/${p.fileNoBasma}`)}><ChevronLeft className="h-4 w-4" /></Button>
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
