import fs from "node:fs"
import path from "node:path"

const root = path.resolve("d:/Downloads/Rag")

function loadTxt(filePath) {
  const rows = []
  if (!fs.existsSync(filePath)) return rows
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^(\d+)#(.+?)#$/)
    if (!match) continue
    const id = Number(match[1])
    const name = match[2].trim()
    if (!id || !name) continue
    rows.push({ id, name })
  }
  return rows
}

function loadYml(filePath) {
  const rows = []
  if (!fs.existsSync(filePath)) return rows
  const text = fs.readFileSync(filePath, "utf8")
  for (const block of text.split(/\n  - Id: /).slice(1)) {
    const id = Number(block.match(/^(\d+)/)?.[1])
    const name = block.match(/\n    Name: (.+)/)?.[1]?.trim()
    if (!id || !name) continue
    const sellRaw = block.match(/\n    Sell: (\d+)/)?.[1]
    const buyRaw = block.match(/\n    Buy: (\d+)/)?.[1]
    const sell = sellRaw != null ? Number(sellRaw) : null
    const buy = buyRaw != null ? Number(buyRaw) : null
    let npcSell
    if (Number.isFinite(sell) && sell > 0) npcSell = sell
    else if (Number.isFinite(buy) && buy > 0) npcSell = Math.floor(buy / 2)
    const row = { id, name }
    if (npcSell && npcSell > 0) row.npcSell = npcSell
    rows.push(row)
  }
  return rows
}

function mergeItem(prev, next) {
  const out = { id: next.id, name: next.name || prev?.name }
  const npcSell = next.npcSell ?? prev?.npcSell
  if (npcSell && npcSell > 0) out.npcSell = npcSell
  return out
}

const byId = new Map()

function put(item) {
  if (!item?.id || !item.name) return
  const prev = byId.get(item.id)
  byId.set(item.id, prev ? mergeItem(prev, item) : { ...item })
}

// Base inglesa (IRO + rAthena yml — inclui Ep. 19+ e Buy/Sell)
for (const item of loadTxt(path.join(root, "tmp-ro/items-iro.txt"))) put(item)
for (const file of ["item_db_etc.yml", "item_db_usable.yml", "item_db_equip.yml", "item_db.yml"]) {
  for (const item of loadYml(path.join(root, "tmp-ro", file))) put(item)
}

// Nomes PT do client bRO sobrescrevem quando existem
for (const item of loadTxt(path.join(root, "tmp-ro/items.txt"))) put(item)

// Curadoria PT + npcSell conhecidos do client/DP quando o yml diverge
const curated = [
  { id: 7110, name: "Espada Chanfrada", npcSell: 220 },
  { id: 1000322, name: "Pó de Éter" },
  { id: 25159, name: "Selo da Caça-Coração", npcSell: 250 },
  { id: 25730, name: "Minério de Zelunium" },
  { id: 25731, name: "Zelunium" },
  { id: 1000606, name: "Casca de Ovo Rgan Superior" },
  { id: 1000608, name: "Pétala de Flor Invernal" },
  { id: 1000705, name: "Núcleo Mágico Rgan" },
  { id: 1000706, name: "Núcleo Mágico Purificado" },
  { id: 1000707, name: "Núcleo Mágico Rgan de Baixa Qualidade" },
  { id: 1000811, name: "Minério Mágico da Flor de Neve" },
  { id: 1000812, name: "Gema da Flor de Neve" },
  { id: 1000813, name: "Gema Brilhante da Flor de Neve" },
  { id: 1000814, name: "Manastone Brilhante da Flor de Neve" },
  { id: 1000822, name: "Casco Rgan" },
  { id: 1000823, name: "Célula de Criatura Estranha" },
  { id: 1000825, name: "Calapi" },
  { id: 1000826, name: "Casco Espinhoso" },
  { id: 1000828, name: "Casco Transparente" },
  { id: 1000829, name: "Flor-Sino de Isca" },
  { id: 1000830, name: "Casco Fino e Resistente" },
  { id: 1000832, name: "Casco de Inseto Congelado" },
  { id: 1001034, name: "Extrato de Magia da Flor de Neve" },
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
  { id: 25155, name: "Brasão de Honra" },
  { id: 25235, name: "Pedra Bruta" },
  { id: 7326, name: "Líquido Fluorescente" },
]

for (const item of curated) put(item)

const catalog = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
fs.writeFileSync(path.join(root, "api/items-catalog.json"), JSON.stringify(catalog))
fs.mkdirSync(path.join(root, "public/ro"), { recursive: true })
fs.writeFileSync(path.join(root, "public/ro/items-catalog.json"), JSON.stringify(catalog))
console.log("catalog", catalog.length)
for (const id of [7110, 1000322, 25159, 25730, 1000823, 1000705, 1000822]) {
  const row = byId.get(id)
  console.log(id, row?.name, row?.npcSell ?? "-")
}
