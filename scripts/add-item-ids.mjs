import fs from "node:fs"

const map = {
  "ira-deus-mar": 6423,
  "moeda-classe-a": 6418,
  "moedas-classe-b": 6419,
  "po-espacial": 6905,
  "carta-dourada": 25627,
  "componente-charleston": 6752,
  "anel-orcs": 28522,
  "marca-heroi": 6684,
  "pele-rainha-verme": 20717,
  "moeda-sangrenta": 7642,
  "fragmento-cinzas": 6672,
  "peca-intacta": 6827,
  "moeda-magica-geffen": 6671,
  "cebolinha": 19238,
  "cenourinha": 19239,
  "moeda-noturna": 1000316,
  "fragmento-meteorito": 1000373,
  "alma-naght": 1000396,
  "mineas": 1000367,
  "fragmento-gigantes": 6803,
  "pedra-bruta": 25235,
  "dente-marfim": 6719,
  "premio-esquadrao": 22567,
}

let source = fs.readFileSync("src/data.ts", "utf8")

source = source.replace(
  /function drop\(id: string, name: string, detail: string, crafts: string\[\] = \[\]\): Drop \{\r?\n  return \{ id, name, detail, crafts \}\r?\n\}/,
  "function drop(id: string, name: string, detail: string, crafts: string[] = [], itemId?: number): Drop {\n  return { id, name, detail, crafts, itemId }\n}",
)

let count = 0
for (const [id, itemId] of Object.entries(map)) {
  const pattern = new RegExp(`drop\\(\\s*"${id}"([\\s\\S]*?)\\)(?=\\s*(?:const|export|$))`)
  const next = source.replace(pattern, (full, rest) => {
    let body = String(rest).replace(/\s+$/, "")
    if (/,\s*\d+$/.test(body)) return full
    const hasArray = body.includes("[")
    if (!hasArray) body += ", []"
    if (body.endsWith(",")) {
      count += 1
      return `drop("${id}"${body} ${itemId})`
    }
    count += 1
    return `drop("${id}"${body}, ${itemId})`
  })
  if (next === source) console.warn("miss", id)
  source = next
}

fs.writeFileSync("src/data.ts", source)
console.log("updated", count)
