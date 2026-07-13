import { useState } from 'react'
import { ScanLine, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/misc'
import { useStore } from '@/store/useStore'
import { fetchPatientRequest, ApiError } from '@/lib/api'
import { ar } from '@/i18n/ar'
import { cn } from '@/lib/utils'

/** Scanner pad — manual file-number lookup via API; scan opens manual entry. */
export function ScanPad({
  onResolved,
  onUnknown,
  startManual = false,
}: {
  onResolved: (fileNo: string, method: 'scan' | 'manual') => void
  onUnknown: (fileNo: string) => void
  startManual?: boolean
}) {
  const patients = useStore((s) => s.patients)
  const token = useStore((s) => s.token)
  const [manual, setManual] = useState(startManual)
  const [value, setValue] = useState('')
  const [lookingUp, setLookingUp] = useState(false)

  const lookupFile = async (fileNo: string): Promise<boolean> => {
    if (patients.some((p) => p.fileNoBasma === fileNo)) return true
    if (!token) return false
    try {
      await fetchPatientRequest(token, fileNo)
      return true
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return false
      return false
    }
  }

  const resolveManual = async (method: 'scan' | 'manual') => {
    const fileNo = value.trim()
    if (!fileNo || lookingUp) return
    setLookingUp(true)
    try {
      const local = patients.find((p) => p.fileNoBasma === fileNo)
      if (local) {
        onResolved(local.fileNoBasma, method)
        return
      }
      const ok = await lookupFile(fileNo)
      if (ok) onResolved(fileNo, method)
      else onUnknown(fileNo)
    } finally {
      setLookingUp(false)
    }
  }

  return (
    <div className="space-y-4">
      {!manual ? (
        <div className="flex flex-col items-center text-center">
          <button
            type="button"
            onClick={() => setManual(true)}
            className={cn(
              'relative flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary-soft/50 transition-colors hover:bg-primary-soft',
            )}
            aria-label={ar.checkin.scanBtn}
          >
            <ScanLine className="h-16 w-16 text-primary" />
          </button>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs">{ar.checkin.scanPrompt}</p>
          <Button variant="link" className="mt-2" onClick={() => setManual(true)}>
            {ar.checkin.manualLabel}
          </Button>
        </div>
      ) : (
        <Field label={ar.common.fileNo}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void resolveManual('manual')}
                placeholder={ar.common.searchByFile}
                className="ps-9"
                autoFocus
              />
            </div>
            <Button disabled={!value.trim() || lookingUp} onClick={() => void resolveManual('manual')}>
              {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : ar.checkin.resolve}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setManual(false)}>
            {ar.common.back}
          </Button>
        </Field>
      )}
    </div>
  )
}
