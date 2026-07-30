import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/** Real QR code encoding the patient Basma file number (`file_no_basma`). */
export function PatientQR({ value, size = 132 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!value.trim()) {
      setDataUrl(null)
      return
    }
    void QRCode.toDataURL(value.trim(), {
      width: size * 2,
      margin: 1,
      color: { dark: '#112438', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then((url) => {
      if (!cancelled) setDataUrl(url)
    }).catch(() => {
      if (!cancelled) setDataUrl(null)
    })
    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!dataUrl) {
    return (
      <div
        className="rounded-md bg-muted animate-pulse shrink-0"
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  return (
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt={`رمز QR — ${value}`}
      className="rounded-md bg-white shrink-0"
    />
  )
}
