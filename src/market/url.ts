/** Official Freya stall-shop URLs (gnjoyamericas) — same shape as latam-market item links. */

export const MARKET_ORIGIN = "https://ro.gnjoyamericas.com"
export const TRADING_PATH = "/pt/intro/shop-search/trading"

export const MIN_SEARCH_WORD = 2

const SAFE_SEARCH_CHAR = /[a-z0-9áàâãéèêíìîóòôõúùûüçñ ]/i

export function safeSegments(name: string): string[] {
  const out: string[] = []
  let current = ""
  for (const ch of name.replace(/\s*\[\d+\]\s*$/, "")) {
    if (SAFE_SEARCH_CHAR.test(ch)) current += ch
    else {
      if (current.trim()) out.push(current.trim())
      current = ""
    }
  }
  if (current.trim()) out.push(current.trim())
  return out
}

/** Maior trecho do nome que o site aceita como busca (sem hífen/slots). */
export function searchWordFor(name: string): string | null {
  let best: string | null = null
  for (const segment of safeSegments(name)) {
    if (!best || segment.length > best.length) best = segment
  }
  return best && best.length >= MIN_SEARCH_WORD ? best : null
}

/**
 * Link do mercado com o nome já no campo de busca (como no latam-tools).
 * Você abre logado e clica na lupa para consultar as lojas.
 */
export function marketUrlFor(name: string): string | null {
  const searchWord = searchWordFor(name)
  if (!searchWord) return null
  const params = new URLSearchParams({
    serverType: "FREYA",
    searchWord,
    storeType: "BUY",
    sortType: "LOW_PRICE",
    p: "1",
  })
  return `${MARKET_ORIGIN}${TRADING_PATH}?${params.toString()}`
}
