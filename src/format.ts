import type { Person } from "./types"

const ZONE = "America/Sao_Paulo"

export const NAMES: Record<Person, string> = {
  thiago: "Thiago",
  rafael: "Raphael",
}

export function personFromEmail(email: string): Person | null {
  const value = email.trim().toLowerCase()
  if (value === "thiagogralves@gmail.com") return "thiago"
  if (value === "raphaelgralves@gmail.com") return "rafael"
  return null
}

export function roleLabel(person: Person) {
  return NAMES[person]
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

export function formatDuration(ms: number) {
  if (ms < 1000) return "0 min"
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m} min`
  return `${total}s`
}

export function formatZeny(value: number) {
  return Math.round(value).toLocaleString("pt-BR")
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso))
}

/** Dia civil em America/Sao_Paulo (YYYY-MM-DD). */
export function todayKey(now = Date.now()) {
  return dayKey(new Date(now).toISOString())
}

/** Meio-dia de São Paulo para um dia YYYY-MM-DD → ISO estável. */
export function dayNoonIso(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return new Date().toISOString()
  return new Date(`${day}T12:00:00-03:00`).toISOString()
}

export function elapsedMs(startedAt: number, base: number, now: number) {
  return Math.max(0, base + (now - startedAt))
}
