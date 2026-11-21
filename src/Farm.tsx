import { useEffect, useMemo, useState } from "react"
import type { CatalogItem, GameState, Op, Person } from "./types"
import { itemIcon } from "./characters"
import { dayNoonIso, elapsedMs, formatClock, formatDuration, formatWhen, formatZeny, NAMES, todayKey } from "./format"
import { MarketLink } from "./market/MarketLink"
import { ensureCatalogLoaded, getCatalogSize, searchCatalog } from "./items-catalog"
import { RO } from "./ro"

type Props = {
  state: GameState
  now: number
  viewer: Person
  act: (key: string, op: Op, message: string) => Promise<boolean>
}

export function Farm({ state, now, viewer, act }: Props) {
  const [query, setQuery] = useState("")
  const [picked, setPicked] = useState<CatalogItem | null>(null)
  const [qty, setQty] = useState("1")
  const [price, setPrice] = useState("")
  const [at, setAt] = useState(() => todayKey())
  const active = state.activeFarms?.[viewer] || null
  const [location, setLocation] = useState(active?.location || "")
  const [remote, setRemote] = useState<CatalogItem[] | null>(null)
  const [catalogSize, setCatalogSize] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (active?.location) setLocation(active.location)
  }, [active?.location])

  useEffect(() => {
    void ensureCatalogLoaded().then(() => setCatalogSize(getCatalogSize()))
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setRemote(null)
      return
    }
    const handle = window.setTimeout(() => {
      void fetch(`/api/items?q=${encodeURIComponent(q)}&limit=40`)
        .then((res) => res.json())
        .then((data: { items?: CatalogItem[] }) => setRemote(Array.isArray(data.items) ? data.items : []))
        .catch(() => setRemote(null))
    }, 250)
    return () => window.clearTimeout(handle)
  }, [query])

  const suggestions = useMemo(() => {
    const local = searchCatalog(query, 40)
    if (!remote?.length) return local
    const byId = new Map<number, CatalogItem>()
    for (const item of [...local, ...remote]) byId.set(item.id, item)
    return [...byId.values()].slice(0, 40)
  }, [query, remote])

  const today = todayKey(now)
  const loot = state.loot || []
  const sessions = state.farmSessions || []
  const mineFarm = loot.filter((row) => row.source === "farm" && row.user === viewer)
  const mineToday = mineFarm.filter((row) => row.day === today)
  const mineRecent = [...mineFarm].reverse().slice(0, 30)
  const mineSessions = sessions.filter((row) => row.user === viewer)

  async function removeLoot(id: string, label: string) {
    await act(`farm-del-${id}`, { op: "deleteLoot", ids: [id] }, `${label} removido.`)
  }

  async function removeSession(id: string, label: string) {
    await act(`farm-sess-del-${id}`, { op: "deleteFarmSessions", ids: [id] }, `Sessão ${label} removida.`)
  }

  async function addLoot() {
    if (!picked || saving) return
    const q = Number(qty || 0)
    const p = Number(price || 0)
    if (!q || q < 0) return
    setSaving(true)
    try {
      const ok = await act(
        `farm-loot-${picked.id}-${Date.now()}`,
        {
          op: "addFarmLoot",
          itemName: picked.name,
          itemId: picked.id,
          qty: q,
          price: Number.isFinite(p) ? p : 0,
          location: location.trim() || undefined,
          at: dayNoonIso(at || today),
        },
        `${picked.name} adicionado ao farm.`,
      )
      if (ok) {
        setQty("1")
        setPrice("")
        setPicked(null)
        setQuery("")
        setRemote(null)
      }
    } finally {
      setSaving(false)
    }
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
        {active && <p className="fine">Você farmando em <b>{active.location}</b></p>}
      </section>

      <section className="panel">
        <h2>Registrar drop</h2>
        <p className="fine">
          Só conta pro seu personagem. Catálogo bRO{catalogSize ? ` (${catalogSize.toLocaleString("pt-BR")} itens)` : ""} — digite nome ou ID e toque na sugestão.
        </p>
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
        {picked && (
          <p className="fine">Selecionado: <b>{picked.name}</b> #{picked.id}</p>
        )}
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
            <input type="date" value={at} onChange={(event) => setAt(event.target.value || today)} />
          </label>
        </div>
        <button className="primary" type="button" disabled={!picked || saving || !Number(qty)} onClick={() => void addLoot()}>
          {saving ? "Salvando…" : `Adicionar ${picked ? picked.name : "item"}`}
        </button>
      </section>

      <section className="panel">
        <h2>Seus drops de farm hoje</h2>
        {mineToday.length === 0 ? (
          <p className="fine">Nada registrado hoje ({today}).</p>
        ) : (
          <ul className="runs">
            {mineToday.map((row) => (
              <li key={row.id} className="run-row">
                <div>
                  <strong>
                    {row.itemName}
                    <MarketLink name={row.itemName} />
                  </strong>
                  <b>{row.qty} × {formatZeny(row.price)} z = {formatZeny(row.qty * row.price)} z</b>
                  <span>{row.location || "sem local"} · {formatWhen(row.at)}</span>
                </div>
                <button className="ghost slim" type="button" onClick={() => void removeLoot(row.id, row.itemName)}>
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2>Seus drops recentes</h2>
        <p className="fine">Inclui outros dias — use pra apagar teste que ficou preso.</p>
        {mineRecent.length === 0 ? (
          <p className="fine">Nenhum drop de farm ainda.</p>
        ) : (
          <ul className="runs">
            {mineRecent.map((row) => (
              <li key={row.id} className="run-row">
                <div>
                  <strong>
                    {row.itemName}
                    <MarketLink name={row.itemName} />
                  </strong>
                  <b>{row.qty} × {formatZeny(row.price)} z = {formatZeny(row.qty * row.price)} z</b>
                  <span>{row.day} · {row.location || "sem local"} · {formatWhen(row.at)}</span>
                </div>
                <button className="ghost slim" type="button" onClick={() => void removeLoot(row.id, row.itemName)}>
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2>Suas últimas sessões</h2>
        {mineSessions.length === 0 ? (
          <p className="fine">Nenhuma sessão finalizada ainda.</p>
        ) : (
          <ul className="runs">
            {[...mineSessions].reverse().slice(0, 10).map((row) => (
              <li key={row.id} className="run-row">
                <div>
                  <strong>{row.location}</strong>
                  <b>{formatDuration(row.ms)}</b>
                  <span>{NAMES[row.user]} · {formatWhen(row.at)}{row.capped ? " · teto" : ""}</span>
                </div>
                <button className="ghost slim" type="button" onClick={() => void removeSession(row.id, row.location)}>
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="fine farm-note">
        Drops e sessões entram no seu Painel (zeny/dia, melhores drops e locais).
      </aside>
    </div>
  )
}
