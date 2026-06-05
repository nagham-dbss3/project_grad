import { useState } from 'react'
import { ScanLine, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/misc'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import { cn } from '@/lib/utils'

/** Mock scanner: resolves a file number (random known patient on "scan",
 *  or an exact match on manual entry). Drives the check-in / emergency loops. */
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
  const [scanning, setScanning] = useState(false)
  const [manual, setManual] = useState(startManual)
  const [value, setValue] = useState('')

  const scan = () => {
    setScanning(true)
    // Resolve a random patient who isn't currently queued (prefers a realistic arrival).
    setTimeout(() => {
      setScanning(false)
      const pool = patients.filter((p) => !p.unregistered)
      // Deterministic-ish pick based on current queue length feel
      const pick = pool[(pool.length * 7) % pool.length] ?? pool[0]
      onResolved(pick.fileNoBasma, 'scan')
    }, 1100)
  }

  const resolveManual = () => {
    const fileNo = value.trim()
    if (!fileNo) return
    const found = patients.find((p) => p.fileNoBasma === fileNo)
    if (found) onResolved(found.fileNoBasma, 'manual')
    else onUnknown(fileNo)
  }

  return (
    <div className="space-y-4">
      {!manual ? (
        <div className="flex flex-col items-center text-center">
          <button
            onClick={scan}
            disabled={scanning}
            className={cn(
              'relative flex h-44 w-full max-w-sm items-center justify-center rounded-2xl border-2 border-dashed transition-colors',
              scanning ? 'border-primary bg-primary-soft/50' : 'border-primary/40 bg-primary-soft/30 hover:bg-primary-soft/60',
            )}
          >
            {scanning ? (
              <div className="flex flex-col items-center text-primary">
                <Loader2 className="h-12 w-12 animate-spin mb-2" />
                <span className="font-bold">{ar.checkin.scanning}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-primary">
                <ScanLine className="h-14 w-14 mb-2" />
                <span className="font-bold">{ar.checkin.scanPrompt}</span>
              </div>
            )}
            {scanning && (
              <span className="absolute inset-x-6 top-1/2 h-0.5 bg-primary animate-pulse-soft" />
            )}
          </button>
          <Button size="lg" className="mt-4 w-full max-w-sm" onClick={scan} disabled={scanning}>
            <ScanLine className="h-5 w-5" />
            {ar.checkin.scanBtn}
          </Button>
          <button onClick={() => setManual(true)} className="mt-3 text-sm font-bold text-primary hover:underline">
            {ar.checkin.manualLabel}
          </button>
        </div>
      ) : (
        <div className="max-w-sm mx-auto">
          <Field label={ar.common.fileNo} htmlFor="manual-file">
            <div className="flex gap-2">
              <Input
                id="manual-file"
                inputMode="numeric"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && resolveManual()}
                placeholder={ar.checkin.manualPlaceholder}
              />
              <Button onClick={resolveManual}>
                <Search className="h-4 w-4" />
                {ar.checkin.resolve}
              </Button>
            </div>
          </Field>
          <button onClick={() => setManual(false)} className="mt-3 text-sm font-bold text-primary hover:underline">
            <ScanLine className="inline h-4 w-4 me-1" />
            {ar.checkin.scanBtn}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            جرّب رقماً موجوداً (مثل 10247) أو رقماً غير موجود (مثل 99999) لتجربة تفرّع التسجيل.
          </p>
        </div>
      )}
    </div>
  )
}
