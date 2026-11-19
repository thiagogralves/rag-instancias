import type { CatalogItem } from "./types"
import { DROP_ITEM_IDS } from "./itemIds"
import { INSTANCES } from "./data"

/** Catálogo em português para busca rápida no farm + drops das instâncias. */
const EXTRA: CatalogItem[] = [
  { id: 909, name: "Jellopy" },
  { id: 938, name: "Muco Pegajoso" },
  { id: 713, name: "Garrafa Vazia" },
  { id: 512, name: "Maçã" },
  { id: 515, name: "Cenoura" },
  { id: 705, name: "Clover" },
  { id: 914, name: "Casca Rija" },
  { id: 916, name: "Pena de Ave" },
  { id: 919, name: "Couro de Animal" },
  { id: 1020, name: "Cauda de Escorpião" },
  { id: 7030, name: "Esporo de Cogumelo" },
  { id: 756, name: "Oridecon Rugoso" },
  { id: 757, name: "Elunium Rugoso" },
  { id: 984, name: "Oridecon" },
  { id: 985, name: "Elunium" },
  { id: 990, name: "Sangue Escarlate" },
  { id: 991, name: "Cristal Azul" },
  { id: 992, name: "Vento Amarelo" },
  { id: 993, name: "Vida Verde" },
  { id: 994, name: "Coração Flamejante" },
  { id: 995, name: "Estrela Brilhante" },
  { id: 997, name: "Ferro" },
  { id: 998, name: "Aço" },
  { id: 999, name: "Carvão" },
  { id: 1000, name: "Frasco de Álcool" },
  { id: 1001, name: "Ácido Clorídrico" },
  { id: 1002, name: "Frasco Inflamável" },
  { id: 1061, name: "Poeira Estelar" },
  { id: 7019, name: "Osso" },
  { id: 7033, name: "Cauda de Peixe" },
  { id: 7067, name: "Poeira Mágica" },
  { id: 7071, name: "Poeira Escura" },
  { id: 7166, name: "Emblema da Bravura" },
  { id: 717, name: "Gema Azul" },
  { id: 716, name: "Gema Vermelha" },
  { id: 715, name: "Gema Amarela" },
  { id: 607, name: "Yggdrasil Berry" },
  { id: 608, name: "Semente de Yggdrasil" },
  { id: 522, name: "Mastela" },
  { id: 526, name: "Royal Jelly" },
  { id: 617, name: "Caixa Roxa Antiga" },
  { id: 603, name: "Old Blue Box" },
  { id: 604, name: "Branch of Dead Tree" },
  { id: 969, name: "Ouro" },
  { id: 7227, name: "Emblema do Herói" },
  { id: 7444, name: "Cristal da Escuridão" },
  { id: 7563, name: "Fragmento da Escuridão" },
  { id: 6608, name: "Mana Coagulada" },
  { id: 6609, name: "Cristal do Tempo" },
  { id: 6611, name: "Mana Sombria" },
  { id: 1000239, name: "Pétala de Flor Invernal" },
  { id: 1000240, name: "Minério Mágico da Flor de Neve" },
  { id: 6688, name: "Fragmento de Ymir" },
  { id: 6689, name: "Contas de Ymir" },
  { id: 25729, name: "Vale Varmida" },
  { id: 22540, name: "Caixa das Melhores Armas" },
]

function buildCatalog(): CatalogItem[] {
  const byId = new Map<number, CatalogItem>()
  for (const item of EXTRA) byId.set(item.id, item)
  for (const instance of INSTANCES) {
    for (const drop of instance.drops) {
      const id = drop.itemId || DROP_ITEM_IDS[drop.id]
      if (!id) continue
      if (!byId.has(id)) byId.set(id, { id, name: drop.name })
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
}

export const ITEM_CATALOG = buildCatalog()

export function searchCatalog(query: string, limit = 40): CatalogItem[] {
  const q = query.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
  if (!q) return ITEM_CATALOG.slice(0, limit)
  if (/^\d+$/.test(q)) {
    const id = Number(q)
    const hit = ITEM_CATALOG.find((item) => item.id === id)
    return hit ? [hit] : [{ id, name: `Item #${id}` }]
  }
  return ITEM_CATALOG.filter((item) => {
    const name = item.name.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
    return name.includes(q)
  }).slice(0, limit)
}
