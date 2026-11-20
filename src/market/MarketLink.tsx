import { marketUrlFor } from "./url"

type Props = {
  name: string
  className?: string
}

/** Abre o mercado Freya com o nome do item já preenchido — a busca é na lupa, logado. */
export function MarketLink({ name, className }: Props) {
  const href = marketUrlFor(name)
  if (!href) return null
  return (
    <a
      className={className || "market-link"}
      href={href}
      target="_blank"
      rel="noreferrer"
      title={`Abrir ${name} no mercado Freya`}
    >
      Mercado
    </a>
  )
}
