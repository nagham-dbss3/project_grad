import { useMemo } from 'react'

/** Visual QR-style pattern derived from the patient file number (display only). */
export function PatientQR({ value, size = 132 }: { value: string; size?: number }) {
  const cells = 21
  const grid = useMemo(() => {
    let seed = 0
    for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) % 2147483647
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    const g: boolean[][] = []
    for (let r = 0; r < cells; r++) {
      g[r] = []
      for (let c = 0; c < cells; c++) g[r][c] = rand() > 0.5
    }
    const place = (or: number, oc: number) => {
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 7; c++) {
          const edge = r === 0 || r === 6 || c === 0 || c === 6
          const center = r >= 2 && r <= 4 && c >= 2 && c <= 4
          g[or + r][oc + c] = edge || center
        }
    }
    place(0, 0)
    place(0, cells - 7)
    place(cells - 7, 0)
    return g
  }, [value])

  const cell = size / cells
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`رمز ${value}`} className="rounded-md bg-white">
      {grid.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#112438" /> : null,
        ),
      )}
    </svg>
  )
}
