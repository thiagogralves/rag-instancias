import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const catalogPath = path.join(here, "items-catalog.json")

let CATALOG = []
try {
  CATALOG = JSON.parse(fs.readFileSync(catalogPath, "utf8"))
} catch {
  CATALOG = []
}

function norm(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
}

function localSearch(q, limit) {
  const query = norm(q)
  if (!query) return CATALOG.slice(0, limit)
  if (/^\d+$/.test(query)) {
    const id = Number(query)
    const hit = CATALOG.find((item) => item.id === id)
    return hit ? [hit] : [{ id, name: `Item #${id}` }]
  }
  return CATALOG.filter((item) => norm(item.name).includes(query)).slice(0, limit)
}

async function divineSearch(q, limit) {
  const key = process.env.DIVINE_PRIDE_API_KEY
  if (!key) return null
  const url = `https://www.divine-pride.net/api/database/Item?apiKey=${encodeURIComponent(key)}&name=${encodeURIComponent(q)}`
  const res = await fetch(url, {
    headers: {
      "Accept-Language": "pt",
      "x-server": "bRO",
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  const rows = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
  return rows
    .slice(0, limit)
    .map((row) => ({
      id: Number(row.id),
      name: String(row.name || row.aegisName || `Item #${row.id}`),
    }))
    .filter((row) => Number.isFinite(row.id) && row.id > 0)
}

export default async function handler(req, res) {
  res.setHeader("cache-control", "public, max-age=60")
  if (req.method !== "GET") {
    res.status(405).json({ error: "method" })
    return
  }
  const q = String(req.query?.q || "")
  const limit = Math.min(60, Math.max(1, Number(req.query?.limit) || 30))
  try {
    const remote = q.trim() ? await divineSearch(q.trim(), limit) : null
    const items = remote && remote.length ? remote : localSearch(q, limit)
    res.status(200).json({ items })
  } catch {
    res.status(200).json({ items: localSearch(q, limit) })
  }
}
