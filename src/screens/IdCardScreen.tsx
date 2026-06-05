import { useNavigate, useParams } from 'react-router-dom'
import { Printer, ScanLine } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/states'
import { Logo } from '@/components/Logo'
import { PageHeader } from '@/components/PageHeader'
import { MockQR } from '@/components/MockQR'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import { formatAge, formatDate } from '@/lib/utils'

export function IdCardScreen() {
  const { fileNo } = useParams()
  const navigate = useNavigate()
  const getPatient = useStore((s) => s.getPatient)
  const patient = fileNo ? getPatient(fileNo) : undefined

  if (!patient) {
    return <Card className="mt-6"><EmptyState title="لم يُعثر على المريض" action={<Button variant="outline" onClick={() => navigate('/patients')}>{ar.patients.title}</Button>} /></Card>
  }

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader
        title={ar.idCard.title}
        back
        action={<Button className="no-print" onClick={() => window.print()}><Printer className="h-4 w-4" />{ar.idCard.printPreview}</Button>}
      />

      {/* The card */}
      <div className="rounded-2xl overflow-hidden shadow-card border print:shadow-none">
        <div className="gradient-brand p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-white px-2 py-1 shadow-sm">
                <Logo className="h-8" />
              </span>
              <p className="text-xs text-white/90">منصة أورام الأطفال</p>
            </div>
            <span className="text-xs bg-white/20 rounded-full px-3 py-1 font-bold">{ar.idCard.title}</span>
          </div>
        </div>

        <CardContent className="p-6 bg-card">
          <div className="flex items-center gap-5">
            <MockQR value={patient.fileNoBasma} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{ar.common.fileNo}</p>
              <p className="font-display text-3xl font-bold text-primary leading-none">{patient.fileNoBasma}</p>
              <p className="font-bold text-lg mt-3">{patient.firstName} {patient.familyName}</p>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex gap-2"><dt className="text-muted-foreground">{ar.common.age}:</dt><dd className="font-bold">{formatAge(patient.dob)}</dd></div>
                <div className="flex gap-2"><dt className="text-muted-foreground">تاريخ الميلاد:</dt><dd className="font-bold">{formatDate(patient.dob)}</dd></div>
                <div className="flex gap-2"><dt className="text-muted-foreground">{ar.common.gender}:</dt><dd className="font-bold">{patient.gender === 'male' ? ar.common.male : ar.common.female}</dd></div>
              </dl>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <ScanLine className="h-4 w-4 text-primary" />
            {ar.idCard.scanHint}
          </div>
        </CardContent>
      </div>
    </div>
  )
}
