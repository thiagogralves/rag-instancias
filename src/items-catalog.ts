import type { CatalogItem } from "./types"
import { DROP_ITEM_IDS } from "./itemIds"
import { INSTANCES } from "./data"

/** Seed rápido (drops + extras) até o JSON completo carregar. */
const SEED: CatalogItem[] = [
  { id: 909, name: "Jellopy" },
  { id: 938, name: "Muco Pegajoso" },
  { id: 713, name: "Garrafa Vazia" },
  { id: 512, name: "Maçã" },
  { id: 984, name: "Oridecon" },
  { id: 985, name: "Elunium" },
  { id: 717, name: "Gema Azul" },
  { id: 716, name: "Gema Vermelha" },
  { id: 715, name: "Gema Amarela" },
  { id: 607, name: "Yggdrasil Berry" },
  { id: 1000608, name: "Pétala de Flor Invernal" },
  { id: 1000811, name: "Minério Mágico da Flor de Neve" },
  { id: 1000103, name: "Vale Varmida" },
  { id: 1000226, name: "Núcleo de Autômata Quebrada" },
  { id: 25787, name: "Fragmento de Experimento" },
  { id: 25088, name: "Fragmento de Sonho" },
  { id: 25668, name: "Arma Danificada" },
  { id: 25723, name: "Núcleo COR" },
  { id: 25669, name: "Chip Misterioso" },
  { id: 25739, name: "Cristal Corrompido" },
  { id: 25740, name: "Gema Corrompida" },
  { id: 25867, name: "Fragmento Temporal" },
  { id: 25864, name: "Diadema Temporal Selado" },
  { id: 25866, name: "Poder Temporal" },
  { id: 9550, name: "Gema Temporal" },
  { id: 1000363, name: "Fragmento de Ymir" },
  { id: 100476, name: "Contas de Ymir" },
  { id: 1000405, name: "Fragmento de Ametista" },
  { id: 1000316, name: "Moeda Noturna de Geffen" },
  { id: 1000367, name: "Mineas" },
  { id: 1000373, name: "Fragmento de Meteorito" },
  { id: 1000398, name: "Pó de Meteorito" },
  { id: 1000396, name: "Alma de Naght Sieger" },
  { id: 23142, name: "Poção Menor de EXP" },
  { id: 23143, name: "Poção Menor de Classe" },
  { id: 6905, name: "Pó Espacial" },
  { id: 25627, name: "Carta Dourada" },
  { id: 28522, name: "Anel dos Orcs" },
  { id: 470073, name: "Bota Desconhecida" },
]

let catalog: CatalogItem[] = []
let loaded = false
let loading: Promise<void> | null = null

function merge(items: CatalogItem[]) {
  const byId = new Map<number, CatalogItem>()
  for (const item of catalog) byId.set(item.id, item)
  for (const item of items) {
    if (!item.id || !item.name) continue
    byId.set(item.id, item)
  }
  catalog = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
}

function seedCatalog() {
  const byId = new Map<number, CatalogItem>()
  for (const item of SEED) byId.set(item.id, item)
  for (const instance of INSTANCES) {
    for (const drop of instance.drops) {
      const id = DROP_ITEM_IDS[drop.id] || drop.itemId
      if (!id) continue
      if (!byId.has(id)) byId.set(id, { id, name: drop.name })
    }
  }
  catalog = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
}

seedCatalog()

export function ensureCatalogLoaded(): Promise<void> {
  if (loaded) return Promise.resolve()
  if (loading) return loading
  loading = fetch("/ro/items-catalog.json")
    .then((res) => (res.ok ? res.json() : []))
    .then((rows: CatalogItem[]) => {
      if (Array.isArray(rows) && rows.length) merge(rows)
      loaded = true
    })
    .catch(() => {
      loaded = true
    })
  return loading
}

export function getCatalogSize() {
  return catalog.length
}

export function searchCatalog(query: string, limit = 40): CatalogItem[] {
  void ensureCatalogLoaded()
  const q = query.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
  if (!q) return catalog.slice(0, limit)
  if (/^\d+$/.test(q)) {
    const id = Number(q)
    const hit = catalog.find((item) => item.id === id)
    return hit ? [hit] : [{ id, name: `Item #${id}` }]
  }
  return catalog
    .filter((item) => {
      const name = item.name.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
      return name.includes(q)
    })
    .slice(0, limit)
}

export const ITEM_CATALOG = catalog
