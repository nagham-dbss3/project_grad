import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ConsultIcons } from './ConsultIcons'
import { useStore } from '@/store/useStore'
import { patientConsultNeeds } from '@/lib/consultRequests'
import { ar } from '@/i18n/ar'
import { formatAge } from '@/lib/utils'
import { PendingRegistrationBadge } from './StatusBadges'

/** File-number-first global search (§5). Names are secondary. */
export function CommandSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const patients = useStore((s) => s.patients)
  const consultRequests = useStore((s) => s.consultRequests)
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const results = useMemo(() => {
    const query = q.trim()
    if (!query) return patients.slice(0, 6)
    return patients
      .filter(
        (p) =>
          p.fileNoBasma.includes(query) ||
          p.nationalIdPatient.includes(query) ||
          `${p.firstName} ${p.familyName} ${p.fatherName}`.includes(query),
      )
      .slice(0, 12)
  }, [q, patients])

  const go = (fileNo: string) => {
    onOpenChange(false)
    setQ('')
    navigate(`/patients/${fileNo}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="sm:max-w-xl">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ar.common.searchByFile}
            className="ps-9"
          />
        </div>
      </div>
      <div className="max-h-[55vh] overflow-y-auto p-2">
        {results.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">{ar.patients.empty}</p>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                navigate('/patients/new')
              }}
            >
              <UserPlus className="h-4 w-4" />
              {ar.patients.registerNew}
            </Button>
          </div>
        ) : (
          results.map((p) => (
            <button
              key={p.fileNoBasma}
              onClick={() => go(p.fileNoBasma)}
              className="w-full flex items-center gap-3 rounded-lg p-2.5 text-start hover:bg-muted transition-colors"
            >
              <span className="flex flex-col items-center justify-center rounded-lg bg-primary-soft text-primary px-2 py-1 min-w-[3.5rem]">
                <span className="text-[10px]">{ar.common.fileNo}</span>
                <span className="font-bold text-sm leading-none">{p.fileNoBasma}</span>
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold truncate">{p.firstName} {p.familyName}</span>
                  {(() => {
                    const needs = patientConsultNeeds(p, consultRequests)
                    return needs.length > 0 ? <ConsultIcons needs={needs} patient={p} /> : null
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {[formatAge(p.dob), p.fatherName, p.residence.city].filter(Boolean).join(' · ')}
                </p>
              </div>
              {p.unregistered && <PendingRegistrationBadge />}
            </button>
          ))
        )}
      </div>
    </Dialog>
  )
}
