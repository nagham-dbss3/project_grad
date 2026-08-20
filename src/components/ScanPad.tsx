import { useCallback, useEffect, useRef, useState } from 'react'
import { ScanLine, Loader2, Search, Camera, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/misc'
import { useStore } from '@/store/useStore'
import { fetchPatientRequest, ApiError } from '@/lib/api'
import { ar } from '@/i18n/ar'
import { cn } from '@/lib/utils'

const CAMERA_REGION_ID = 'scan-pad-camera-region'
const SCANNER_CHAR_GAP_MS = 80
const SCANNER_MIN_LENGTH = 3

type Mode = 'idle' | 'manual' | 'camera'

/** Scanner pad — USB/Bluetooth keyboard wedge, webcam QR, and manual file lookup. */
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
  const pushToast = useStore((s) => s.pushToast)
  const [mode, setMode] = useState<Mode>(startManual ? 'manual' : 'idle')
  const [value, setValue] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const lookingUpRef = useRef(false)
  const bufferRef = useRef('')
  const lastKeyAtRef = useRef(0)
  const scannerRef = useRef<{ isScanning?: boolean; stop: () => Promise<void> } | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const lookupFile = useCallback(async (fileNo: string): Promise<boolean> => {
    if (patients.some((p) => p.fileNoBasma === fileNo)) return true
    if (!token) return false
    try {
      await fetchPatientRequest(token, fileNo)
      return true
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return false
      return false
    }
  }, [patients, token])

  const resolveFile = useCallback(async (raw: string, method: 'scan' | 'manual') => {
    const fileNo = raw.trim()
    if (!fileNo || lookingUpRef.current) return
    lookingUpRef.current = true
    setLookingUp(true)
    setValue(fileNo)
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
      lookingUpRef.current = false
      setLookingUp(false)
    }
  }, [lookupFile, onResolved, onUnknown, patients])

  // USB / Bluetooth scanner (keyboard emulation)
  useEffect(() => {
    if (mode === 'camera') return

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isTypingField =
        tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable

      if (isTypingField && mode === 'manual') return

      const now = Date.now()
      if (now - lastKeyAtRef.current > SCANNER_CHAR_GAP_MS) bufferRef.current = ''
      lastKeyAtRef.current = now

      if (e.key === 'Enter') {
        const scanned = bufferRef.current.trim()
        bufferRef.current = ''
        if (scanned.length >= SCANNER_MIN_LENGTH) {
          e.preventDefault()
          void resolveFile(scanned, 'scan')
        }
        return
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingField) {
        bufferRef.current += e.key
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, resolveFile])

  // Webcam QR via html5-qrcode (loaded only when the camera is opened)
  useEffect(() => {
    if (mode !== 'camera') return

    let cancelled = false

    const start = async () => {
      try {
        const el = document.getElementById(CAMERA_REGION_ID)
        if (!el) {
          setMode('manual')
          return
        }
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return
        const scanner = new Html5Qrcode(CAMERA_REGION_ID)
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (cancelled || !decoded.trim()) return
            void (async () => {
              try {
                await scanner.stop()
              } catch {
                /* already stopped */
              }
              if (!cancelled) {
                setMode('manual')
                void resolveFile(decoded.trim(), 'scan')
              }
            })()
          },
          () => undefined,
        )
      } catch (err) {
        console.warn('[ScanPad] تعذّر تهيئة الكاميرا', err)
        if (!cancelled) {
          pushToast({
            variant: 'warning',
            title: ar.checkin.title,
            description: ar.checkin.cameraUnavailable,
          })
          setMode('manual')
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      const active = scannerRef.current
      scannerRef.current = null
      if (active?.isScanning) {
        void active.stop().catch(() => undefined)
      }
    }
  }, [mode, pushToast, resolveFile])

  return (
    <div className="space-y-4">
      {mode === 'camera' ? (
        <div className="space-y-3">
          <div
            id={CAMERA_REGION_ID}
            className="overflow-hidden rounded-xl border bg-black/5 min-h-[260px]"
          />
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" onClick={() => setMode('idle')}>
              {ar.checkin.closeCamera}
            </Button>
            <Button variant="ghost" onClick={() => setMode('manual')}>
              <Keyboard className="h-4 w-4" />
              إدخال يدوي
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Scan target + camera CTA — always visible */}
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                'relative flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary-soft/50',
              )}
              aria-label={ar.checkin.scanBtn}
            >
              <ScanLine className="h-16 w-16 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mt-3 max-w-xs">
              وجّه رمز هوية المريض إلى الماسح أو افتح الكاميرا
            </p>

            {/* Explicit camera button under the scan box */}
            <Button
              type="button"
              size="lg"
              className="mt-4 w-full max-w-sm"
              onClick={() => setMode('camera')}
            >
              <Camera className="h-5 w-5" />
              فتح الكاميرا للمسح
            </Button>

            <Button
              type="button"
              variant="link"
              className="mt-1"
              onClick={() => setMode('manual')}
            >
              أو أدخل رقم الإضبارة يدوياً
            </Button>
          </div>

          {mode === 'manual' && (
            <Field label={ar.common.fileNo}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void resolveFile(value, 'manual')}
                    placeholder={ar.common.searchByFile}
                    className="ps-9"
                    autoFocus
                  />
                </div>
                <Button disabled={!value.trim() || lookingUp} onClick={() => void resolveFile(value, 'manual')}>
                  {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : ar.checkin.resolve}
                </Button>
              </div>
            </Field>
          )}
        </>
      )}
    </div>
  )
}
