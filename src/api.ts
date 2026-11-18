import type { GameState, Op, Person } from "./types"

const KEY = "rag-email"

export function storedEmail() {
  return localStorage.getItem(KEY) || ""
}

export function storeEmail(email: string) {
  localStorage.setItem(KEY, email.trim().toLowerCase())
}

export function clearEmail() {
  localStorage.removeItem(KEY)
}

async function call(method: "GET" | "POST", email: string, body?: Op) {
  const headers: Record<string, string> = { "x-user-email": email }
  if (method === "POST") headers["content-type"] = "application/json"
  const res = await fetch("/api/state", {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string; user?: Person; state?: GameState }
  if (res.status === 401) throw new Error("unauthorized")
  if (!res.ok || !data.state || !data.user) throw new Error(data.error || "sync")
  return { user: data.user, state: data.state }
}

export function loadState(email: string) {
  return call("GET", email)
}

export function sendOp(email: string, op: Op) {
  return call("POST", email, op)
}
