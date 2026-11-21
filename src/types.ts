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

export type LootEntry = {
  id: string
  source: "instance" | "farm"
  user: Person
  itemName: string
  itemId?: number
  dropId?: string
  instanceId?: string
  location?: string
  qty: number
  price: number
  at: string
  day: string
}

export type FarmSession = {
  id: string
  location: string
  user: Person
  ms: number
  at: string
  startedAt: number
  capped?: boolean
}

export type ActiveFarm = {
  startedAt: number
  elapsedMs: number
  user: Person
  location: string
}

export type GameState = {
  version: number
  /** Dia do ciclo atual (YYYY-MM-DD), virando às 04:00 America/Sao_Paulo. */
  cycleDay: string
  completions: Record<string, Partial<Record<Person, string>>>
  history: HistoryEvent[]
  runs: Run[]
  /** Cronômetros ativos. Chave: `${instanceId}:${Person}` — cada um só controla o próprio. */
  active: Record<string, ActiveTimer>
  prices: Record<string, number>
  watch: Record<Person, string[]>
  /** Prioridade pessoal do Thiago (semente de Ygg). */
  watchSeed: string[]
  loot: LootEntry[]
  farmSessions: FarmSession[]
  activeFarm: ActiveFarm | null
}

export type Op =
  | { op: "toggleWatch"; instanceId: string }
  | { op: "toggleSeed"; instanceId: string }
  | { op: "toggleDone"; instanceId: string }
  | { op: "resetSeals" }
  | { op: "timerStart"; instanceId: string }
  | { op: "timerStop"; instanceId: string }
  | { op: "setPrice"; dropId: string; price: number }
  | { op: "setPrices"; items: { dropId: string; price: number }[] }
  | { op: "upsertDailyLoot"; dropId: string; instanceId: string; itemName: string; itemId?: number; qty: number; price: number; at?: string }
  | { op: "addFarmLoot"; itemName: string; itemId?: number; qty: number; price: number; location?: string; at?: string }
  | { op: "deleteHistory"; ids: string[] }
  | { op: "deleteRuns"; ids: string[] }
  | { op: "deleteLoot"; ids: string[] }
  | { op: "deleteFarmSessions"; ids: string[] }
  | { op: "farmTimerStart"; location: string }
  | { op: "farmTimerStop" }
  | { op: "clearHistory" }

export type CatalogItem = {
  id: number
  name: string
}
