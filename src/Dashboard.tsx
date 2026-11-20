import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { INSTANCES } from "./data"
import { dayKey, formatDuration, formatWhen, formatZeny, roleLabel } from "./format"
import { KpiModal, type KpiRow } from "./KpiModal"
import { RO } from "./ro"
import type { GameState, Op, Person, SectionId } from "./types"

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "horas", label: "Horas" },
  { id: "diario", label: "Diárias" },
  { id: "tres", label: "3 dias" },
  { id: "semanal", label: "Semana" },
]

type RangeId = "7" | "30" | "all"
type KpiKind =
  | "history-you"
  | "history-other"
  | "time-you"
  | "time-other"
  | "loot-you"
  | "loot-other"
  | "farm-you"
  | "farm-other"
  | null

function inRange(iso: string, range: RangeId, now: number) {
  if (range === "all") return true
  const days = range === "7" ? 7 : 30
  return now - new Date(iso).getTime() <= days * 86_400_000
}

function money(value: number) {
  if (!value) return "sem preço"
  return `${formatZeny(value)} z`
}

function Pixel({ src, size = 18 }: { src: string; size?: number }) {
  return <img className="pixel-icon" src={src} alt="" width={size} height={size} loading="lazy" decoding="async" />
}

function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number | string; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="tip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <span key={item.name} style={{ color: item.color }}>
          {item.name}: {item.value}
        </span>
      ))}
    </div>
  )
}

export function Dashboard({
  state,
  now,
  viewer,
  act,
}: {
  state: GameState
  now: number
  viewer: Person
  act: (key: string, op: Op, message: string) => Promise<boolean>
}) {
  const [range, setRange] = useState<RangeId>("7")
  const [kpi, setKpi] = useState<KpiKind>(null)
  const byId = useMemo(() => new Map(INSTANCES.map((item) => [item.id, item])), [])
  const other: Person = viewer === "thiago" ? "rafael" : "thiago"
  const youKey = roleLabel(viewer)
  const otherKey = roleLabel(other)
  const today = dayKey(new Date(now).toISOString())

  const view = useMemo(() => {
    const history = state.history.filter((event) => inRange(event.at, range, now))
    const runs = state.runs.filter((run) => inRange(run.at, range, now))
    const loot = (state.loot || []).filter((row) => inRange(row.at, range, now))
    const farmSessions = (state.farmSessions || []).filter((row) => inRange(row.at, range, now))
    const lootYou = loot.filter((row) => row.user === viewer)
    const lootOther = loot.filter((row) => row.user === other)
    const farmYou = farmSessions.filter((row) => row.user === viewer)
    const farmOther = farmSessions.filter((row) => row.user === other)
    const counts: Record<Person, number> = { thiago: 0, rafael: 0 }
    const time: Record<Person, number> = { thiago: 0, rafael: 0 }
    const zeny: Record<Person, number> = { thiago: 0, rafael: 0 }
    const farmCount: Record<Person, number> = { thiago: 0, rafael: 0 }
    const bySection = SECTIONS.map((section) => ({
      name: section.label,
      [youKey]: 0,
      [otherKey]: 0,
      id: section.id,
    }))

    for (const event of history) {
      counts[event.user] += 1
      const instance = byId.get(event.instanceId)
      if (!instance) continue
      const section = bySection.find((item) => item.id === instance.section)
      if (section) {
        const key = event.user === viewer ? youKey : otherKey
        section[key] = Number(section[key] || 0) + 1
      }
    }
    for (const row of loot) zeny[row.user] += row.qty * row.price
    for (const row of farmSessions) farmCount[row.user] += 1
    for (const run of runs) time[run.user] += run.ms
    for (const active of Object.values(state.active)) {
      if (!inRange(new Date(active.startedAt).toISOString(), range, now)) continue
      time[active.user] += Math.max(0, active.elapsedMs + (now - active.startedAt))
    }

    const dayMs = 86_400_000
    function zenyFor(rows: typeof loot, windowMs?: number) {
      return rows
        .filter((row) => {
          if (windowMs == null) return dayKey(row.at) === today
          return now - new Date(row.at).getTime() <= windowMs
        })
        .reduce((sum, row) => sum + row.qty * row.price, 0)
    }

    const zenyDay: Record<Person, number> = {
      thiago: zenyFor(loot.filter((row) => row.user === "thiago")),
      rafael: zenyFor(loot.filter((row) => row.user === "rafael")),
    }
    const zenyWeek: Record<Person, number> = {
      thiago: zenyFor(loot.filter((row) => row.user === "thiago"), 7 * dayMs),
      rafael: zenyFor(loot.filter((row) => row.user === "rafael"), 7 * dayMs),
    }
    const zenyMonth: Record<Person, number> = {
      thiago: zenyFor(loot.filter((row) => row.user === "thiago"), 30 * dayMs),
      rafael: zenyFor(loot.filter((row) => row.user === "rafael"), 30 * dayMs),
    }

    function bestDropsFor(rows: typeof loot) {
      const byItem = new Map<string, { name: string; qty: number; zeny: number }>()
      for (const row of rows) {
        const key = row.itemId ? String(row.itemId) : row.itemName
        const cur = byItem.get(key) || { name: row.itemName, qty: 0, zeny: 0 }
        cur.qty += row.qty
        cur.zeny += row.qty * row.price
        byItem.set(key, cur)
      }
      return [...byItem.values()].sort((a, b) => b.zeny - a.zeny).slice(0, 8)
    }

    function bestPlacesFor(person: Person) {
      const personLoot = loot.filter((row) => row.user === person)
      const personFarm = farmSessions.filter((row) => row.user === person)
      const locStats = new Map<string, { ms: number; zeny: number; drops: number }>()
      for (const session of personFarm) {
        const cur = locStats.get(session.location) || { ms: 0, zeny: 0, drops: 0 }
        cur.ms += session.ms
        locStats.set(session.location, cur)
      }
      for (const row of personLoot) {
        if (!row.location) continue
        const cur = locStats.get(row.location) || { ms: 0, zeny: 0, drops: 0 }
        cur.zeny += row.qty * row.price
        cur.drops += row.qty
        locStats.set(row.location, cur)
      }
      return [...locStats.entries()]
        .map(([name, row]) => ({
          name,
          zeny: row.zeny,
          ms: row.ms,
          zenyPerHour: row.ms > 0 ? Math.round((row.zeny / row.ms) * 3_600_000) : row.zeny,
          drops: row.drops,
        }))
        .sort((a, b) => b.zenyPerHour - a.zenyPerHour)
        .slice(0, 8)
    }

    const lineDays = range === "7" ? 7 : 30
    const keys = Array.from({ length: lineDays }, (_, index) =>
      dayKey(new Date(now - (lineDays - 1 - index) * dayMs).toISOString()),
    )
    const line = keys.map((key) => ({
      name: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
      [youKey]: history.filter((event) => event.user === viewer && dayKey(event.at) === key).length,
      [otherKey]: history.filter((event) => event.user === other && dayKey(event.at) === key).length,
    }))

    const bySectionZeny = keys.map((key) => ({
      name: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
      [youKey]: lootYou.filter((row) => dayKey(row.at) === key).reduce((sum, row) => sum + row.qty * row.price, 0),
      [otherKey]: lootOther.filter((row) => dayKey(row.at) === key).reduce((sum, row) => sum + row.qty * row.price, 0),
    }))

    return {
      counts,
      time,
      zeny,
      farmCount,
      bySection,
      line,
      bySectionZeny,
      bestDropsYou: bestDropsFor(lootYou),
      bestDropsOther: bestDropsFor(lootOther),
      bestPlacesYou: bestPlacesFor(viewer),
      bestPlacesOther: bestPlacesFor(other),
      zenyDay,
      zenyWeek,
      zenyMonth,
      history,
      runs,
      loot,
      lootYou,
      lootOther,
      farmSessions,
      farmYou,
      farmOther,
    }
  }, [byId, now, other, otherKey, range, state, today, viewer, youKey])

  const axis = { fill: "#8f8f8f", fontSize: 11 }
  const hasWork =
    view.history.length > 0 ||
    view.runs.length > 0 ||
    view.loot.length > 0 ||
    view.farmSessions.length > 0 ||
    Object.keys(state.active).length > 0

  const modal = useMemo(() => {
    if (kpi === "history-you" || kpi === "history-other") {
      const person = kpi === "history-you" ? viewer : other
      const rows: KpiRow[] = view.history
        .filter((row) => row.user === person)
        .map((row) => ({
          id: row.id,
          title: byId.get(row.instanceId)?.name || row.instanceId,
          meta: `${roleLabel(row.user)} · ${formatWhen(row.at)}`,
        }))
      return {
        title: `Conclusões · ${roleLabel(person)}`,
        subtitle: "Excluir entradas de teste remove do histórico e dos gráficos.",
        rows,
        deleteOp: (ids: string[]) => ({ op: "deleteHistory" as const, ids }),
      }
    }
    if (kpi === "time-you" || kpi === "time-other") {
      const person = kpi === "time-you" ? viewer : other
      const rows: KpiRow[] = view.runs
        .filter((row) => row.user === person)
        .map((row) => ({
          id: row.id,
          title: byId.get(row.instanceId)?.name || row.instanceId,
          meta: `${roleLabel(row.user)} · ${formatWhen(row.at)}`,
          value: formatDuration(row.ms),
        }))
      return {
        title: `Tempo · ${roleLabel(person)}`,
        subtitle: "Corridas cronometradas neste período.",
        rows,
        deleteOp: (ids: string[]) => ({ op: "deleteRuns" as const, ids }),
      }
    }
    if (kpi === "loot-you" || kpi === "loot-other") {
      const person = kpi === "loot-you" ? viewer : other
      // Lista completa (sem filtro de período) pra conseguir apagar teste preso.
      const rows: KpiRow[] = [...(state.loot || [])]
        .filter((row) => row.user === person)
        .reverse()
        .map((row) => ({
          id: row.id,
          title: row.itemName,
          meta: `${row.source === "farm" ? "Farm" : "Instância"} · ${formatWhen(row.at)}${row.location ? ` · ${row.location}` : ""}`,
          value: `${row.qty} × ${formatZeny(row.price)} z`,
        }))
      return {
        title: `Drops & zeny · ${roleLabel(person)}`,
        subtitle: "Todos os registros desta pessoa. Exclua o que for teste.",
        rows,
        deleteOp: (ids: string[]) => ({ op: "deleteLoot" as const, ids }),
      }
    }
    if (kpi === "farm-you" || kpi === "farm-other") {
      const person = kpi === "farm-you" ? viewer : other
      const rows: KpiRow[] = [...(state.farmSessions || [])]
        .filter((row) => row.user === person)
        .reverse()
        .map((row) => ({
          id: row.id,
          title: row.location,
          meta: formatWhen(row.at),
          value: formatDuration(row.ms),
        }))
      return {
        title: `Sessões de farm · ${roleLabel(person)}`,
        subtitle: "Todas as sessões desta pessoa.",
        rows,
        deleteOp: (ids: string[]) => ({ op: "deleteFarmSessions" as const, ids }),
      }
    }
    return null
  }, [byId, kpi, other, state.farmSessions, state.loot, view.history, view.runs, viewer])

  return (
    <div className="dash">
      <div className="range" role="radiogroup" aria-label="Período do painel">
        {(
          [
            ["7", "7 dias"],
            ["30", "30 dias"],
            ["all", "Tudo"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={range === id} onClick={() => setRange(id)}>
            <Pixel src={id === "all" ? RO.poring : RO.butterflyWing} size={16} />
            {label}
          </button>
        ))}
        {state.history.length > 0 && (
          <button
            className="ghost"
            type="button"
            onClick={() => {
              if (window.confirm(`Apagar as ${state.history.length} conclusões do histórico?`)) {
                void act("clear-history", { op: "clearHistory" }, "Histórico de conclusões limpo.")
              }
            }}
          >
            Limpar conclusões ({state.history.length})
          </button>
        )}
      </div>

      <section className="kpis" aria-label="Indicadores">
        <button type="button" className="kpi you clickable" onClick={() => setKpi("history-you")}>
          <span><Pixel src={RO.yggBerry} size={14} /> Conclusões</span>
          <strong>{view.counts[viewer]}</strong>
          <em>{youKey}</em>
          <p className="fine">toque pra gerenciar</p>
        </button>
        <button type="button" className="kpi other clickable" onClick={() => setKpi("history-other")}>
          <span><Pixel src={RO.yggBerry} size={14} /> Conclusões</span>
          <strong>{view.counts[other]}</strong>
          <em>{otherKey}</em>
          <p className="fine">toque pra gerenciar</p>
        </button>
        <button type="button" className="kpi you clickable" onClick={() => setKpi("time-you")}>
          <span><Pixel src={RO.flyWing} size={14} /> Tempo</span>
          <strong>{formatDuration(view.time[viewer])}</strong>
          <em>{youKey}</em>
          <p className="fine">toque pra gerenciar</p>
        </button>
        <button type="button" className="kpi other clickable" onClick={() => setKpi("time-other")}>
          <span><Pixel src={RO.flyWing} size={14} /> Tempo</span>
          <strong>{formatDuration(view.time[other])}</strong>
          <em>{otherKey}</em>
          <p className="fine">toque pra gerenciar</p>
        </button>
        <button type="button" className="kpi you clickable" onClick={() => setKpi("loot-you")}>
          <span><Pixel src={RO.goldCoin} size={14} /> Zeny hoje</span>
          <strong>{formatZeny(view.zenyDay[viewer])}</strong>
          <em>{youKey} · sem {formatZeny(view.zenyWeek[viewer])} · mês {formatZeny(view.zenyMonth[viewer])}</em>
          <p className="fine">toque pra gerenciar</p>
        </button>
        <button type="button" className="kpi other clickable" onClick={() => setKpi("loot-other")}>
          <span><Pixel src={RO.goldCoin} size={14} /> Zeny hoje</span>
          <strong>{formatZeny(view.zenyDay[other])}</strong>
          <em>{otherKey} · sem {formatZeny(view.zenyWeek[other])} · mês {formatZeny(view.zenyMonth[other])}</em>
          <p className="fine">toque pra gerenciar</p>
        </button>
        <button type="button" className="kpi you clickable" onClick={() => setKpi("farm-you")}>
          <span><Pixel src={RO.butterflyWing} size={14} /> Farm</span>
          <strong>{view.farmCount[viewer]}</strong>
          <em>{youKey} · sessões no período</em>
          <p className="fine">toque pra gerenciar</p>
        </button>
        <button type="button" className="kpi other clickable" onClick={() => setKpi("farm-other")}>
          <span><Pixel src={RO.butterflyWing} size={14} /> Farm</span>
          <strong>{view.farmCount[other]}</strong>
          <em>{otherKey} · sessões no período</em>
          <p className="fine">toque pra gerenciar</p>
        </button>
      </section>

      {!hasWork ? (
        <div className="empty">
          <Pixel src={RO.poring} size={40} />
          <p>Quando houver selos, drops ou farm, os gráficos aparecem aqui.</p>
          {state.history.length > 0 && (
            <button
              className="danger"
              type="button"
              onClick={() => void act("clear-history", { op: "clearHistory" }, "Histórico de conclusões limpo.")}
            >
              Limpar histórico de testes ({state.history.length})
            </button>
          )}
        </div>
      ) : (
        <>
          <section className="panel">
            <h2>Zeny por dia</h2>
            <p className="fine">Qty × preço, separado por pessoa (instância + farm).</p>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view.bySectionZeny} accessibilityLayer>
                  <CartesianGrid stroke="rgba(218,250,156,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} interval={range === "7" ? 0 : 4} />
                  <YAxis tick={axis} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Legend wrapperStyle={{ color: "#8f8f8f", fontSize: 12 }} />
                  <Bar dataKey={youKey} fill="#dafa9c" radius={[6, 6, 0, 0]} />
                  <Bar dataKey={otherKey} fill="#ff9b7a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="panel">
            <h2>Melhores drops · {youKey}</h2>
            {view.bestDropsYou.length === 0 ? (
              <p className="fine">Sem drops precificados seus neste período.</p>
            ) : (
              <ul className="runs">
                {view.bestDropsYou.map((row) => (
                  <li key={row.name}>
                    <strong>{row.name}</strong>
                    <b>{money(row.zeny)}</b>
                    <span>{row.qty} unidades no período</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <h2>Melhores drops · {otherKey}</h2>
            {view.bestDropsOther.length === 0 ? (
              <p className="fine">Sem drops precificados do parceiro neste período.</p>
            ) : (
              <ul className="runs">
                {view.bestDropsOther.map((row) => (
                  <li key={row.name}>
                    <strong>{row.name}</strong>
                    <b>{money(row.zeny)}</b>
                    <span>{row.qty} unidades no período</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <h2>Melhores locais · {youKey}</h2>
            <p className="fine">Ordenado por zeny/hora (suas sessões + drops com local).</p>
            {view.bestPlacesYou.length === 0 ? (
              <p className="fine">Registre sessões e drops com local na aba Farm.</p>
            ) : (
              <ul className="runs">
                {view.bestPlacesYou.map((row) => (
                  <li key={row.name}>
                    <strong>{row.name}</strong>
                    <b>{formatZeny(row.zenyPerHour)} z/h</b>
                    <span>{money(row.zeny)} · {formatDuration(row.ms)} · {row.drops} drops</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <h2>Melhores locais · {otherKey}</h2>
            <p className="fine">Ordenado por zeny/hora do parceiro.</p>
            {view.bestPlacesOther.length === 0 ? (
              <p className="fine">Ainda sem farm do parceiro neste período.</p>
            ) : (
              <ul className="runs">
                {view.bestPlacesOther.map((row) => (
                  <li key={row.name}>
                    <strong>{row.name}</strong>
                    <b>{formatZeny(row.zenyPerHour)} z/h</b>
                    <span>{money(row.zeny)} · {formatDuration(row.ms)} · {row.drops} drops</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <h2>Conclusões por ritmo</h2>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view.bySection} accessibilityLayer>
                  <CartesianGrid stroke="rgba(218,250,156,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Legend wrapperStyle={{ color: "#8f8f8f", fontSize: 12 }} />
                  <Bar dataKey={youKey} fill="#dafa9c" radius={[6, 6, 0, 0]} />
                  <Bar dataKey={otherKey} fill="#ff9b7a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="panel">
            <h2>Conclusões por dia</h2>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={view.line} accessibilityLayer margin={{ right: 16, left: 0 }}>
                  <CartesianGrid stroke="rgba(218,250,156,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} interval={range === "7" ? 0 : 4} />
                  <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ color: "#8f8f8f", fontSize: 12 }} />
                  <Line type="monotone" dataKey={youKey} stroke="#dafa9c" strokeWidth={2.6} dot={false} />
                  <Line type="monotone" dataKey={otherKey} stroke="#ff9b7a" strokeWidth={2.6} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      {modal && (
        <KpiModal
          title={modal.title}
          subtitle={modal.subtitle}
          rows={modal.rows}
          onClose={() => setKpi(null)}
          onDelete={async (ids) => {
            await act(`kpi-del-${Date.now()}-${ids.length}`, modal.deleteOp(ids), `${ids.length} registro(s) excluído(s).`)
          }}
        />
      )}
    </div>
  )
}
