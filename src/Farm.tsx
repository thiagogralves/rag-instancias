import { useEffect, useMemo, useState } from "react"
import type { CatalogItem, GameState, Op, Person } from "./types"
import { CHARACTERS, itemIcon } from "./characters"
import { dayKey, elapsedMs, formatClock, formatDuration, formatWhen, formatZeny, NAMES } from "./format"
import { searchCatalog } from "./items-catalog"
import { RO } from "./ro"

type Props = {
  state: GameState
  now: number
  viewer: Person
  act: (key: string, op: Op, message: string) => Promise<void>
}

export function Farm({ state, now, viewer, act }: Props) {
  const [query, setQuery] = useState("")
  const [picked, setPicked] = useState<CatalogItem | null>(null)
  const [qty, setQty] = useState("1")
  const [price, setPrice] = useState("")
  const [at, setAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [location, setLocation] = useState(state.activeFarm?.location || "")
  const [remote, setRemote] = useState<CatalogItem[] | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setRemote(null)
      return
    }
    const handle = window.setTimeout(() => {
      void fetch(`/api/items?q=${encodeURIComponent(q)}&limit=30`)
        .then((res) => res.json())
        .then((data: { items?: CatalogItem[] }) => setRemote(Array.isArray(data.items) ? data.items : []))
        .catch(() => setRemote(null))
    }, 250)
    return () => window.clearTimeout(handle)
  }, [query])

  const suggestions = useMemo(() => remote ?? searchCatalog(query, 30), [query, remote])
  const today = dayKey(new Date().toISOString())
  const mineToday = state.loot.filter((row) => row.source === "farm" && row.user === viewer && row.day === today)
  const active = state.activeFarm

  async function addLoot() {
    if (!picked) return
    const q = Number(qty || 0)
    const p = Number(price || 0)
    if (!q || q < 0) return
    const iso = at ? new Date(`${at}T12:00:00`).toISOString() : new Date().toISOString()
    await act(
      `farm-loot-${picked.id}-${Date.now()}`,
      {
        op: "addFarmLoot",
        itemName: picked.name,
        itemId: picked.id,
        qty: q,
        price: p,
        location: location.trim() || undefined,
        at: iso,
      },
      `${picked.name} adicionado ao farm.`,
    )
    setQty("1")
  }

  return (
    <div className="farm">
      <section className="panel farm-timer">
        <h2>Sessão de farm</h2>
        <p className="fine">Informa o local, inicia a contagem e depois para pra medir o tempo por mapa.</p>
        <label>
          Local de farm
          <input
            value={location}
            placeholder="Ex.: pay_fild04, gef_dun01…"
            disabled={Boolean(active)}
            onChange={(event) => setLocation(event.target.value)}
          />
        </label>
        <div className="farm-timer-row">
          <b className="clock">
            {active ? formatClock(elapsedMs(active.startedAt, active.elapsedMs, now)) : "0:00"}
          </b>
          {!active ? (
            <button
              className="primary slim"
              type="button"
              disabled={!location.trim()}
              onClick={() => void act("farm-start", { op: "farmTimerStart", location: location.trim() }, `Farm em ${location.trim()} iniciado.`)}
            >
              Iniciar
            </button>
          ) : (
            <button
              className="danger"
              type="button"
              onClick={() => void act("farm-stop", { op: "farmTimerStop" }, "Sessão de farm finalizada.")}
            >
              Finalizar
            </button>
          )}
        </div>
        {active && <p className="fine">{NAMES[active.user]} farmando em <b>{active.location}</b></p>}
      </section>

      <section className="panel">
        <h2>Registrar drop</h2>
        <p className="fine">Busca itens em português (catálogo local + Divine-Pride se a chave estiver ligada).</p>
        <label>
          Buscar item
          <input value={query} placeholder="Nome ou ID…" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="item-suggest" role="listbox" aria-label="Itens">
          {suggestions.map((item) => {
            const icon = itemIcon(item.id)
            const selected = picked?.id === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`item-opt${selected ? " on" : ""}`}
                onClick={() => setPicked(item)}
              >
                {icon ? <img className="pixel-icon" src={icon} alt="" width={22} height={22} /> : <img className="pixel-icon" src={RO.purpleBox} alt="" width={22} height={22} />}
                <span>{item.name}</span>
                <small>#{item.id}</small>
              </button>
            )
          })}
        </div>
        <div className="farm-form">
          <label>
            Qtd
            <input inputMode="numeric" value={qty} onChange={(event) => setQty(event.target.value.replace(/\D/g, "").slice(0, 8))} />
          </label>
          <label>
            Preço unit.
            <input inputMode="numeric" value={price} placeholder="zeny" onChange={(event) => setPrice(event.target.value.replace(/\D/g, "").slice(0, 15))} />
          </label>
          <label>
            Data
            <input type="date" value={at} onChange={(event) => setAt(event.target.value)} />
          </label>
        </div>
        <button className="primary" type="button" disabled={!picked} onClick={() => void addLoot()}>
          Adicionar {picked ? picked.name : "item"}
        </button>
      </section>

      <section className="panel">
        <h2>Drops de farm hoje</h2>
        {mineToday.length === 0 ? (
          <p className="fine">Nada registrado hoje.</p>
        ) : (
          <ul className="runs">
            {mineToday.map((row) => (
              <li key={row.id}>
                <strong>{row.itemName}</strong>
                <b>{row.qty} × {formatZeny(row.price)} z = {formatZeny(row.qty * row.price)} z</b>
                <span>{row.location || "sem local"} · {formatWhen(row.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2>Últimas sessões</h2>
        {state.farmSessions.length === 0 ? (
          <p className="fine">Nenhuma sessão finalizada ainda.</p>
        ) : (
          <ul className="runs">
            {[...state.farmSessions].reverse().slice(0, 10).map((row) => (
              <li key={row.id}>
                <strong>{row.location}</strong>
                <b>{formatDuration(row.ms)}</b>
                <span>{NAMES[row.user]} · {formatWhen(row.at)}{row.capped ? " · teto" : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="fine farm-note">
        <img className="pixel-icon" src={CHARACTERS[viewer].gem} alt="" width={14} height={14} />
        Os drops e sessões entram no Painel (zeny/dia, melhores drops e melhores locais).
      </aside>
    </div>
  )
}
