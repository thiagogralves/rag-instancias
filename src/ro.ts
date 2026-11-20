import type { SectionId } from "./types"

/** Local Divine-Pride assets for branding (classic Midgard icons). */
export const RO = {
  poring: "/ro/poring.png",
  poporing: "/ro/poporing.png",
  fabre: "/ro/fabre.png",
  lunatic: "/ro/lunatic.png",
  baphomet: "/ro/baphomet.png",
  goldCoin: "/ro/gold-coin.png",
  purpleBox: "/ro/old-purple-box.png",
  blueGem: "/ro/blue-gem.png",
  redGem: "/ro/red-gem.png",
  yellowGem: "/ro/yellow-gem.png",
  flyWing: "/ro/flywing.png",
  butterflyWing: "/ro/butterfly-wing.png",
  yggBerry: "/ro/ygg-berry.png",
  yggSeed: "/ro/ygg-seed.png",
  concentrated: "/ro/concentrated.png",
} as const

export const SECTION_ICON: Record<SectionId, string> = {
  horas: RO.butterflyWing,
  diario: RO.fabre,
  tres: RO.poporing,
  semanal: RO.baphomet,
}

export const FILTER_ICON: Record<string, string> = {
  all: RO.poring,
  watch: RO.yggBerry,
  pending: RO.flyWing,
  horas: RO.butterflyWing,
  diario: RO.fabre,
  tres: RO.poporing,
  semanal: RO.baphomet,
}

export function mobIcon(id: number) {
  return `https://static.divine-pride.net/images/mobs/png/${id}.png`
}

export function collectionIcon(itemId: number) {
  return `https://static.divine-pride.net/images/items/collection/${itemId}.png`
}
