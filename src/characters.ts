import type { Person } from "./types"
import { RO } from "./ro"

export const CHARACTERS: Record<
  Person,
  { job: string; title: string; image: string; accent: string; gem: string; motto: string }
> = {
  thiago: {
    job: "Magus",
    title: "4ª classe · linha do Mago",
    image: "/art/char-magus.jpg",
    accent: "#4ef0d3",
    gem: RO.blueGem,
    motto: "Runas, portais e DPS mágico.",
  },
  rafael: {
    job: "Cardeal",
    title: "4ª classe · linha do Clérigo",
    image: "/art/char-cardinal.jpg",
    accent: "#ffb4c8",
    gem: RO.redGem,
    motto: "Curas, buffs e o ritmo da party.",
  },
}

export function itemIcon(itemId?: number) {
  if (!itemId) return null
  return `https://static.divine-pride.net/images/items/item/${itemId}.png`
}
