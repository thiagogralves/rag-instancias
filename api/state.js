import fs from "node:fs/promises"
import path from "node:path"

const USERS = {
  "thiagogralves@gmail.com": "thiago",
  "raphaelgralves@gmail.com": "rafael",
}

const CAP_MS = 8 * 60 * 60 * 1000
const FILE = path.join(process.cwd(), "data", "state.json")
const ZONE = "America/Sao_Paulo"

function dayKey(iso) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso))
}

/** Ciclo do board: vira todo dia às 04:00 em America/Sao_Paulo. */
function cycleKey(now = Date.now()) {
  return dayKey(new Date(now - 4 * 60 * 60 * 1000).toISOString())
}

function defaultState() {
  return {
    version: 1,
    cycleDay: cycleKey(),
    completions: {},
    history: [],
    runs: [],
    active: {},
    prices: {},
    watch: { thiago: [], rafael: [] },
    watchSeed: [],
    /** Drops extras por instância (permanecem entre ciclos; qtd diária zera). */
    instanceExtras: {},
    loot: [],
    farmSessions: [],
    activeFarm: null,
  }
}

function normalizeInstanceExtras(input, loot) {
  const out = {}
  if (input && typeof input === "object") {
    for (const [instanceId, rows] of Object.entries(input)) {
      if (!validInstance(instanceId) || !Array.isArray(rows)) continue
      const list = []
      const seen = new Set()
      for (const row of rows) {
        if (!row || typeof row !== "object") continue
        const dropId = typeof row.dropId === "string" ? row.dropId : ""
        const itemName = typeof row.itemName === "string" ? row.itemName.trim() : ""
        if (!/^x-\d+$/.test(dropId) || !itemName || seen.has(dropId)) continue
        seen.add(dropId)
        const itemId = Number.isFinite(Number(row.itemId)) && Number(row.itemId) > 0 ? Math.round(Number(row.itemId)) : undefined
        list.push({ dropId, itemName: itemName.slice(0, 120), itemId })
      }
      if (list.length) out[instanceId] = list
    }
  }
  // Migra extras já registrados só no loot diário.
  if (Array.isArray(loot)) {
    for (const row of loot) {
      if (row?.source !== "instance" || !validInstance(row.instanceId) || typeof row.dropId !== "string") continue
      if (!/^x-\d+$/.test(row.dropId)) continue
      const name = typeof row.itemName === "string" ? row.itemName.trim() : ""
      if (!name) continue
      if (!out[row.instanceId]) out[row.instanceId] = []
      if (out[row.instanceId].some((item) => item.dropId === row.dropId)) continue
      const itemId = Number.isFinite(Number(row.itemId)) && Number(row.itemId) > 0 ? Math.round(Number(row.itemId)) : undefined
      out[row.instanceId].push({ dropId: row.dropId, itemName: name.slice(0, 120), itemId })
    }
  }
  return out
}

function upsertInstanceExtra(state, instanceId, dropId, itemName, itemId) {
  if (!/^x-\d+$/.test(dropId)) return
  if (!state.instanceExtras || typeof state.instanceExtras !== "object") state.instanceExtras = {}
  if (!Array.isArray(state.instanceExtras[instanceId])) state.instanceExtras[instanceId] = []
  const list = state.instanceExtras[instanceId]
  const entry = {
    dropId,
    itemName: String(itemName || "").trim().slice(0, 120),
    itemId: Number.isFinite(Number(itemId)) && Number(itemId) > 0 ? Math.round(Number(itemId)) : undefined,
  }
  if (!entry.itemName) return
  const idx = list.findIndex((row) => row.dropId === dropId)
  if (idx >= 0) list[idx] = entry
  else list.push(entry)
}

/**
 * Novo ciclo às 4h: limpa só os selos pra poder marcar de novo.
 * Histórico, runs, loot, preços e prioridades ficam no painel.
 */
function rollCycle(state) {
  const current = cycleKey()
  if (!state.cycleDay) {
    state.cycleDay = current
    return true
  }
  if (state.cycleDay === current) return false
  state.completions = {}
  state.cycleDay = current
  return true
}

function activeKey(instanceId, user) {
  return `${instanceId}:${user}`
}

function normalizeActive(input) {
  const out = {}
  if (!input || typeof input !== "object") return out
  for (const [key, value] of Object.entries(input)) {
    if (!value || typeof value !== "object") continue
    const startedAt = Number(value.startedAt)
    const elapsedMs = Number(value.elapsedMs) || 0
    const person = value.user === "rafael" ? "rafael" : value.user === "thiago" ? "thiago" : null
    if (!person || !Number.isFinite(startedAt)) continue
    // Novo: "inst_24:thiago" — legado: "inst_24" com user no valor
    const instanceId = key.includes(":") ? key.slice(0, key.lastIndexOf(":")) : key
    if (!validInstance(instanceId)) continue
    out[activeKey(instanceId, person)] = { startedAt, elapsedMs, user: person }
  }
  return out
}

function normalize(input) {
  const base = defaultState()
  if (!input || typeof input !== "object") return base
  const loot = Array.isArray(input.loot) ? input.loot : []
  return {
    version: Number(input.version) || 1,
    cycleDay: typeof input.cycleDay === "string" ? input.cycleDay : "",
    completions: input.completions && typeof input.completions === "object" ? input.completions : {},
    history: Array.isArray(input.history) ? input.history : [],
    runs: Array.isArray(input.runs) ? input.runs : [],
    active: normalizeActive(input.active),
    prices: input.prices && typeof input.prices === "object" ? input.prices : {},
    watch: {
      thiago: Array.isArray(input.watch?.thiago) ? input.watch.thiago : [],
      rafael: Array.isArray(input.watch?.rafael) ? input.watch.rafael : [],
    },
    watchSeed: Array.isArray(input.watchSeed) ? input.watchSeed : [],
    instanceExtras: normalizeInstanceExtras(input.instanceExtras, loot),
    loot,
    farmSessions: Array.isArray(input.farmSessions) ? input.farmSessions : [],
    activeFarm: input.activeFarm && typeof input.activeFarm === "object" ? input.activeFarm : null,
  }
}

function trimState(state) {
  if (state.history.length > 1000) state.history = state.history.slice(-1000)
  if (state.runs.length > 1000) state.runs = state.runs.slice(-1000)
  if (state.loot.length > 2000) state.loot = state.loot.slice(-2000)
  if (state.farmSessions.length > 1000) state.farmSessions = state.farmSessions.slice(-1000)
}

function redisEnv() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return { url, token }
}

async function redisCommand(command) {
  const env = redisEnv()
  const res = await fetch(env.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error("redis")
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.result
}

async function readState() {
  let parsed = null
  if (redisEnv()) {
    const raw = await redisCommand(["GET", "rag:state"])
    if (!raw) return defaultState()
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw
  } else {
    try {
      parsed = JSON.parse(await fs.readFile(FILE, "utf8"))
    } catch {
      return defaultState()
    }
  }
  const state = normalize(parsed)
  // Persiste migração de extras que só existiam no loot diário.
  if (JSON.stringify(parsed?.instanceExtras || {}) !== JSON.stringify(state.instanceExtras || {})) {
    state._persist = true
  }
  return state
}

async function writeState(state) {
  delete state._persist
  if (redisEnv()) {
    await redisCommand(["SET", "rag:state", JSON.stringify(state)])
    return
  }
  if (process.env.VERCEL) {
    const err = new Error("store")
    err.code = "STORE"
    throw err
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  const tmp = `${FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(state))
  await fs.rename(tmp, FILE)
}

let chain = Promise.resolve()
function enqueue(fn) {
  const run = chain.then(fn, fn)
  chain = run.then(
    () => {},
    () => {},
  )
  return run
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withLock(fn) {
  if (!redisEnv()) return fn()
  for (let i = 0; i < 8; i += 1) {
    const got = await redisCommand(["SET", "rag:lock", "1", "NX", "PX", "5000"])
    if (got === "OK") {
      try {
        return await fn()
      } finally {
        await redisCommand(["DEL", "rag:lock"]).catch(() => {})
      }
    }
    await sleep(70 * (i + 1))
  }
  const err = new Error("busy")
  err.code = "BUSY"
  throw err
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function validInstance(instanceId) {
  return typeof instanceId === "string" && /^inst_\d+$/.test(instanceId)
}

function cleanIds(ids) {
  if (!Array.isArray(ids)) return []
  return [...new Set(ids.filter((id) => typeof id === "string" && id.length > 0 && id.length < 80))]
}

function clampMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 1e15) return null
  return Math.round(n)
}

function clampQty(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 1e9) return null
  return Math.round(n)
}

function apply(state, op, user) {
  if (!op || typeof op !== "object") return false

  if (op.op === "toggleWatch") {
    // Fruto de Ygg: prioridade da party (os dois).
    if (!validInstance(op.instanceId)) return false
    const id = op.instanceId
    const on = state.watch.thiago.includes(id) || state.watch.rafael.includes(id)
    if (on) {
      state.watch.thiago = state.watch.thiago.filter((item) => item !== id)
      state.watch.rafael = state.watch.rafael.filter((item) => item !== id)
    } else {
      state.watch.thiago = [...new Set([...state.watch.thiago, id])]
      state.watch.rafael = [...new Set([...state.watch.rafael, id])]
    }
    return true
  }

  if (op.op === "toggleSeed") {
    // Semente de Ygg: prioridade só do Thiago.
    if (user !== "thiago") return false
    if (!validInstance(op.instanceId)) return false
    if (!Array.isArray(state.watchSeed)) state.watchSeed = []
    const list = new Set(state.watchSeed)
    if (list.has(op.instanceId)) list.delete(op.instanceId)
    else list.add(op.instanceId)
    state.watchSeed = [...list]
    return true
  }

  if (op.op === "toggleDone") {
    if (!validInstance(op.instanceId)) return false
    const row = { ...(state.completions[op.instanceId] || {}) }
    if (row[user]) {
      delete row[user]
      if (!row.thiago && !row.rafael) delete state.completions[op.instanceId]
      else state.completions[op.instanceId] = row
      return true
    }
    const at = new Date().toISOString()
    row[user] = at
    state.completions[op.instanceId] = row
    state.history.push({ id: makeId(), instanceId: op.instanceId, user, at })
    return true
  }

  if (op.op === "resetSeals") {
    state.completions = {}
    return true
  }

  if (op.op === "clearHistory") {
    state.history = []
    return true
  }

  if (op.op === "timerStart") {
    if (!validInstance(op.instanceId)) return false
    const key = activeKey(op.instanceId, user)
    if (state.active[key]) return false
    state.active[key] = { startedAt: Date.now(), elapsedMs: 0, user }
    return true
  }

  if (op.op === "timerStop") {
    if (!validInstance(op.instanceId)) return false
    const key = activeKey(op.instanceId, user)
    const active = state.active[key]
    if (!active) return false
    const raw = Math.max(0, active.elapsedMs + (Date.now() - active.startedAt))
    state.runs.push({
      id: makeId(),
      instanceId: op.instanceId,
      user: active.user,
      ms: Math.min(raw, CAP_MS),
      at: new Date().toISOString(),
      capped: raw > CAP_MS,
    })
    delete state.active[key]
    return true
  }

  if (op.op === "setPrice") {
    if (typeof op.dropId !== "string" || !/^[a-z0-9-]{1,64}$/.test(op.dropId)) return false
    const rounded = clampMoney(op.price)
    if (rounded === null) return false
    if (rounded <= 0) delete state.prices[op.dropId]
    else state.prices[op.dropId] = rounded
    return true
  }

  if (op.op === "setPrices") {
    if (!Array.isArray(op.items) || op.items.length === 0 || op.items.length > 200) return false
    let changed = false
    for (const item of op.items) {
      if (!item || typeof item.dropId !== "string" || !/^[a-z0-9-]{1,64}$/.test(item.dropId)) continue
      const rounded = clampMoney(item.price)
      if (rounded === null) continue
      if (rounded <= 0) {
        if (state.prices[item.dropId] != null) {
          delete state.prices[item.dropId]
          changed = true
        }
        continue
      }
      if (state.prices[item.dropId] !== rounded) {
        state.prices[item.dropId] = rounded
        changed = true
      }
    }
    return changed
  }

  if (op.op === "upsertDailyLoot") {
    if (typeof op.dropId !== "string" || !/^[a-z0-9-]{1,64}$/.test(op.dropId)) return false
    if (!validInstance(op.instanceId)) return false
    if (typeof op.itemName !== "string" || op.itemName.trim().length < 1 || op.itemName.length > 120) return false
    const qty = clampQty(op.qty)
    const price = clampMoney(op.price)
    if (qty === null || price === null) return false
    const at = typeof op.at === "string" && !Number.isNaN(Date.parse(op.at)) ? new Date(op.at).toISOString() : new Date().toISOString()
    const day = cycleKey(new Date(at).getTime())
    const itemId = Number.isFinite(Number(op.itemId)) && Number(op.itemId) > 0 ? Math.round(Number(op.itemId)) : undefined
    if (price > 0) state.prices[op.dropId] = price
    // Extra (x-*) fica cadastrado na instância entre ciclos; só a qtd do dia zera.
    upsertInstanceExtra(state, op.instanceId, op.dropId, op.itemName, itemId)
    const idx = state.loot.findIndex(
      (row) => row.source === "instance" && row.user === user && row.dropId === op.dropId && row.day === day,
    )
    if (qty <= 0) {
      if (idx >= 0) state.loot.splice(idx, 1)
      return true
    }
    const entry = {
      id: idx >= 0 ? state.loot[idx].id : makeId(),
      source: "instance",
      user,
      itemName: op.itemName.trim(),
      itemId,
      dropId: op.dropId,
      instanceId: op.instanceId,
      qty,
      price,
      at,
      day,
    }
    if (idx >= 0) state.loot[idx] = entry
    else state.loot.push(entry)
    return true
  }

  if (op.op === "removeInstanceExtra") {
    if (!validInstance(op.instanceId)) return false
    if (typeof op.dropId !== "string" || !/^x-\d+$/.test(op.dropId)) return false
    const list = state.instanceExtras?.[op.instanceId]
    if (!Array.isArray(list) || !list.length) return false
    const next = list.filter((row) => row.dropId !== op.dropId)
    if (next.length === list.length) return false
    if (next.length) state.instanceExtras[op.instanceId] = next
    else delete state.instanceExtras[op.instanceId]
    return true
  }

  if (op.op === "addFarmLoot") {
    if (typeof op.itemName !== "string" || op.itemName.trim().length < 1 || op.itemName.length > 120) return false
    const qty = clampQty(op.qty)
    const price = clampMoney(op.price)
    if (qty === null || price === null || qty <= 0) return false
    const at = typeof op.at === "string" && !Number.isNaN(Date.parse(op.at)) ? new Date(op.at).toISOString() : new Date().toISOString()
    const location = typeof op.location === "string" ? op.location.trim().slice(0, 80) : ""
    const itemId = Number.isFinite(Number(op.itemId)) && Number(op.itemId) > 0 ? Math.round(Number(op.itemId)) : undefined
    state.loot.push({
      id: makeId(),
      source: "farm",
      user,
      itemName: op.itemName.trim(),
      itemId,
      location: location || undefined,
      qty,
      price,
      at,
      day: cycleKey(new Date(at).getTime()),
    })
    return true
  }

  if (op.op === "deleteHistory") {
    const ids = new Set(cleanIds(op.ids))
    if (!ids.size) return false
    const before = state.history.length
    state.history = state.history.filter((row) => !ids.has(row.id))
    return state.history.length !== before
  }

  if (op.op === "deleteRuns") {
    const ids = new Set(cleanIds(op.ids))
    if (!ids.size) return false
    const before = state.runs.length
    state.runs = state.runs.filter((row) => !ids.has(row.id))
    return state.runs.length !== before
  }

  if (op.op === "deleteLoot") {
    const ids = new Set(cleanIds(op.ids))
    if (!ids.size) return false
    const before = state.loot.length
    state.loot = state.loot.filter((row) => !ids.has(row.id))
    return state.loot.length !== before
  }

  if (op.op === "deleteFarmSessions") {
    const ids = new Set(cleanIds(op.ids))
    if (!ids.size) return false
    const before = state.farmSessions.length
    state.farmSessions = state.farmSessions.filter((row) => !ids.has(row.id))
    return state.farmSessions.length !== before
  }

  if (op.op === "farmTimerStart") {
    if (state.activeFarm) return false
    const location = typeof op.location === "string" ? op.location.trim().slice(0, 80) : ""
    if (!location) return false
    state.activeFarm = { startedAt: Date.now(), elapsedMs: 0, user, location }
    return true
  }

  if (op.op === "farmTimerStop") {
    const active = state.activeFarm
    if (!active) return false
    const raw = Math.max(0, active.elapsedMs + (Date.now() - active.startedAt))
    state.farmSessions.push({
      id: makeId(),
      location: active.location,
      user: active.user,
      ms: Math.min(raw, CAP_MS),
      at: new Date().toISOString(),
      startedAt: active.startedAt,
      capped: raw > CAP_MS,
    })
    state.activeFarm = null
    return true
  }

  return false
}

export function resolveUser(email) {
  return USERS[String(email || "").trim().toLowerCase()] || null
}

export async function handleState(method, emailHeader, body) {
  const user = resolveUser(emailHeader)
  if (!user) return { status: 401, data: { error: "unauthorized" } }

  try {
    if (method === "GET") {
      const state = await enqueue(() =>
        withLock(async () => {
          const current = await readState()
          const dirty = rollCycle(current) || Boolean(current._persist)
          if (dirty) {
            current.version = (Number(current.version) || 1) + 1
            await writeState(current)
          }
          return current
        }),
      )
      return { status: 200, data: { user, state } }
    }
    if (method !== "POST") return { status: 405, data: { error: "method" } }

    const result = await enqueue(() =>
      withLock(async () => {
        const current = await readState()
        const rolled = rollCycle(current) || Boolean(current._persist)
        const changed = apply(current, body, user)
        if (!rolled && !changed) return { state: current, changed: false }
        current.version = (Number(current.version) || 1) + 1
        trimState(current)
        await writeState(current)
        return { state: current, changed: rolled || changed }
      }),
    )
    return { status: 200, data: { user, state: result.state, changed: result.changed } }
  } catch (error) {
    if (error && error.code === "STORE") return { status: 503, data: { error: "store" } }
    if (error && error.code === "BUSY") return { status: 503, data: { error: "busy" } }
    return { status: 500, data: { error: "fail" } }
  }
}

export default async function handler(req, res) {
  try {
    const email = req.headers["x-user-email"]
    let body = req.body
    if (typeof body === "string") body = body ? JSON.parse(body) : {}
    if (!body || typeof body !== "object") body = {}
    const result = await handleState(req.method, Array.isArray(email) ? email[0] : email, body)
    res.setHeader("cache-control", "no-store")
    res.status(result.status).json(result.data)
  } catch {
    res.status(500).json({ error: "fail" })
  }
}
