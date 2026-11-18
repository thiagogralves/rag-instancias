export type Person = "thiago" | "rafael"

export type SectionId = "horas" | "diario" | "tres" | "semanal"

export type Drop = {
  id: string
  name: string
  detail: string
  crafts: string[]
  itemId?: number
}

export type Instance = {
  id: string
  name: string
  section: SectionId
  sectionRank: number
  subRank: number
  nivel: string
  retorno: string
  modo: string
  requisito: string
  premiacao: string
  url: string
  blurb?: string
  drops: Drop[]
}

export type HistoryEvent = {
  id: string
  instanceId: string
  user: Person
  at: string
}

export type Run = {
  id: string
  instanceId: string
  user: Person
  ms: number
  at: string
  capped?: boolean
}

export type ActiveTimer = {
  startedAt: number
  elapsedMs: number
  user: Person
}

export type GameState = {
  version: number
  completions: Record<string, Partial<Record<Person, string>>>
  history: HistoryEvent[]
  runs: Run[]
  active: Record<string, ActiveTimer>
  prices: Record<string, number>
  watch: Record<Person, string[]>
}

export type Op =
  | { op: "toggleWatch"; instanceId: string }
  | { op: "toggleDone"; instanceId: string }
  | { op: "resetSeals" }
  | { op: "timerStart"; instanceId: string }
  | { op: "timerStop"; instanceId: string }
  | { op: "setPrice"; dropId: string; price: number }
