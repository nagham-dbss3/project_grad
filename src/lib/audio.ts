const LETTER_NAMES: Record<string, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
  H: 'H',
  I: 'I',
  J: 'J',
  K: 'K',
  L: 'L',
  M: 'M',
  N: 'N',
  O: 'O',
  P: 'P',
  Q: 'Q',
  R: 'R',
  S: 'S',
  T: 'T',
  U: 'U',
  V: 'V',
  W: 'W',
  X: 'X',
  Y: 'Y',
  Z: 'Z',
}

const DIGIT_NAMES: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '٠': 'zero',
  '١': 'one',
  '٢': 'two',
  '٣': 'three',
  '٤': 'four',
  '٥': 'five',
  '٦': 'six',
  '٧': 'seven',
  '٨': 'eight',
  '٩': 'nine',
}

const DEPARTMENT_SPEECH_EN: Record<string, string> = {
  clinic: 'clinic',
  dayCare: 'day care',
  daycare: 'day care',
  day_care: 'day care',
  inpatient: 'inpatient',
}

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext }

let audioCtx: AudioContext | null = null
let primedHtmlAudio: HTMLAudioElement | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!AC) return null
  if (!audioCtx) audioCtx = new AC()
  return audioCtx
}

function canSpeak(): boolean {
  return (
    typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof SpeechSynthesisUtterance !== 'undefined'
  )
}

function silentWavDataUri(): string {
  const sampleRate = 8000
  const samples = 80
  const dataSize = samples * 2
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, dataSize, true)
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!)
  return `data:audio/wav;base64,${btoa(binary)}`
}

/** Must run in the same click as "استدعاء" so the browser allows sound after the API. */
export function unlockAudio(): void {
  if (typeof window === 'undefined') return
  const ctx = getAudioContext()
  void ctx?.resume()

  if (!primedHtmlAudio) {
    primedHtmlAudio = new Audio(silentWavDataUri())
    primedHtmlAudio.volume = 0.01
  }
  void primedHtmlAudio.play().then(() => {
    primedHtmlAudio?.pause()
    if (primedHtmlAudio) primedHtmlAudio.currentTime = 0
  }).catch(() => {})

  if (!canSpeak()) return
  try {
    const warm = new SpeechSynthesisUtterance('.')
    warm.volume = 0
    warm.lang = 'en-US'
    window.speechSynthesis.speak(warm)
    window.speechSynthesis.cancel()
    window.speechSynthesis.getVoices()
  } catch {
    // ignore
  }
}

/** Spell a token like `A-102` as separate English letters and digits. */
export function spellTokenDisplay(tokenDisplay: string): string {
  const parts: string[] = []
  for (const raw of String(tokenDisplay ?? '').trim().toUpperCase()) {
    if (/\s/.test(raw) || raw === '-' || raw === '_' || raw === '/' || raw === '–' || raw === '—') {
      continue
    }
    const letter = LETTER_NAMES[raw]
    if (letter) {
      parts.push(letter)
      continue
    }
    const digit = DIGIT_NAMES[raw]
    if (digit) {
      parts.push(digit)
      continue
    }
  }
  return parts.join(', ')
}

function departmentSpeechName(departmentName?: string): string {
  const raw = String(departmentName ?? '').trim()
  if (!raw || raw === '—') return ''
  return DEPARTMENT_SPEECH_EN[raw] ?? (/^[A-Za-z]/.test(raw) ? raw : '')
}

function buildAnnouncement(tokenDisplay: string, departmentName?: string): string {
  const spokenToken = spellTokenDisplay(tokenDisplay) || String(tokenDisplay ?? '').trim()
  const dept = departmentSpeechName(departmentName)
  const phrase = `Calling. Patient number ${spokenToken}.`
  return dept ? `${phrase} ${dept}.` : phrase
}

function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang.startsWith('en-US'))
    ?? voices.find((v) => v.lang.startsWith('en'))
  )
}

function playChime(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const start = () => {
    const now = ctx.currentTime
    const notes = [880, 1174.66, 1567.98]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = now + i * 0.14
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02)
      gain.gain.linearRampToValueAtTime(0, t + 0.28)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.3)
    })
  }
  if (ctx.state === 'suspended') {
    void ctx.resume().then(start).catch(() => {})
    return
  }
  start()
}

function speakEnglish(text: string): void {
  if (!canSpeak()) return

  const speakNow = () => {
    try {
      window.speechSynthesis.cancel()
      window.speechSynthesis.resume()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'en-US'
      utter.rate = 0.85
      utter.pitch = 1
      utter.volume = 1
      const voice = pickEnglishVoice()
      if (voice) utter.voice = voice
      window.speechSynthesis.speak(utter)
    } catch {
      // chime already played
    }
  }

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', speakNow, { once: true })
    window.setTimeout(speakNow, 400)
    return
  }
  speakNow()
}

/** Chime always plays; English speech follows when the browser supports it. */
export function announcePatientToken(tokenDisplay: string, departmentName?: string): void {
  if (typeof window === 'undefined') return
  playChime()
  const phrase = buildAnnouncement(tokenDisplay, departmentName)
  window.setTimeout(() => speakEnglish(phrase), 350)
}
