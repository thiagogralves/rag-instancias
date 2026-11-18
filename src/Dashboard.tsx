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
import { RO } from "./ro"
import type { GameState, Person, SectionId } from "./types"

function Pixel({ src, size = 18 }: { src: string; size?: number }) {
  return (
    <img
      className="pixel-icon"
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  )
}

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "horas", label: "Horas" },
  { id: "diario", label: "Diárias" },
  { id: "tres", label: "3 dias" },
  { id: "semanal", label: "Semana" },
]

type RangeId = "7" | "30" | "all"

function inRange(iso: string, range: RangeId, now: number) {
  if (range === "all") return true
  const days = range === "7" ? 7 : 30
  return now - new Date(iso).getTime() <= days * 86_400_000
}

function money(value: number) {
  if (!value) return "sem preço"
  return `${formatZeny(value)} z`
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

export function Dashboard({ state, now, viewer }: { state: GameState; now: number; viewer: Person }) {
  const [range, setRange] = useState<RangeId>("7")
  const byId = useMemo(() => new Map(INSTANCES.map((item) => [item.id, item])), [])
  const other: Person = viewer === "thiago" ? "rafael" : "thiago"
  const youKey = roleLabel(viewer)
  const otherKey = roleLabel(other)

  const view = useMemo(() => {
    const history = state.history.filter((event) => inRange(event.at, range, now))
    const runs = state.runs.filter((run) => inRange(run.at, range, now))
    const counts: Record<Person, number> = { thiago: 0, rafael: 0 }
    const time: Record<Person, number> = { thiago: 0, rafael: 0 }
    const zeny: Record<Person, number> = { thiago: 0, rafael: 0 }
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
      const value = instance.drops.reduce((sum, item) => sum + (state.prices[item.id] || 0), 0)
      zeny[event.user] += value
    }
    for (const run of runs) time[run.user] += run.ms
    for (const active of Object.values(state.active)) {
      if (!inRange(new Date(active.startedAt).toISOString(), range, now)) continue
      time[active.user] += Math.max(0, active.elapsedMs + (now - active.startedAt))
    }

    const lineDays = range === "7" ? 7 : 30
    const keys = Array.from({ length: lineDays }, (_, index) =>
      dayKey(new Date(now - (lineDays - 1 - index) * 86_400_000).toISOString()),
    )
    const line = keys.map((key) => ({
      name: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
      [youKey]: history.filter((event) => event.user === viewer && dayKey(event.at) === key).length,
      [otherKey]: history.filter((event) => event.user === other && dayKey(event.at) === key).length,
    }))

    const grouped = new Map<string, { sum: number; n: number }>()
    for (const run of runs) {
      const row = grouped.get(run.instanceId) || { sum: 0, n: 0 }
      row.sum += run.ms
      row.n += 1
      grouped.set(run.instanceId, row)
    }
    const slow = [...grouped.entries()]
      .map(([id, row]) => ({
        name: byId.get(id)?.name || id,
        minutos: Math.round((row.sum / row.n / 60_000) * 10) / 10,
      }))
      .sort((a, b) => b.minutos - a.minutos)
      .slice(0, 5)

    const table = INSTANCES.map((instance) => {
      const own = history.filter((event) => event.instanceId === instance.id)
      const ownRuns = runs.filter((run) => run.instanceId === instance.id)
      return {
        id: instance.id,
        name: instance.name,
        you: own.filter((event) => event.user === viewer).length,
        other: own.filter((event) => event.user === other).length,
        avg: ownRuns.length ? ownRuns.reduce((sum, run) => sum + run.ms, 0) / ownRuns.length : 0,
      }
    }).filter((row) => row.you || row.other || row.avg)

    return { counts, time, zeny, bySection, line, slow, table, runs: [...runs].reverse().slice(0, 8), history }
  }, [byId, now, other, otherKey, range, state, viewer, youKey])

  const axis = { fill: "#a9b6cf", fontSize: 11 }
  const hasWork = view.history.length > 0 || view.runs.length > 0 || Object.keys(state.active).length > 0

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
      </div>

      <section className="kpis" aria-label="Indicadores">
        <article className="kpi you">
          <span><Pixel src={RO.yggBerry} size={14} /> Conclusões</span>
          <strong>{view.counts[viewer]}</strong>
          <em>{youKey}</em>
          <p className="fine">{money(view.zeny[viewer])}</p>
        </article>
        <article className="kpi other">
          <span><Pixel src={RO.yggBerry} size={14} /> Conclusões</span>
          <strong>{view.counts[other]}</strong>
          <em>{otherKey}</em>
          <p className="fine">{money(view.zeny[other])}</p>
        </article>
        <article className="kpi you">
          <span><Pixel src={RO.flyWing} size={14} /> Tempo</span>
          <strong>{formatDuration(view.time[viewer])}</strong>
          <em>{youKey}</em>
          <p className="fine">cronômetros parados e o que ainda roda</p>
        </article>
        <article className="kpi other">
          <span><Pixel src={RO.flyWing} size={14} /> Tempo</span>
          <strong>{formatDuration(view.time[other])}</strong>
          <em>{otherKey}</em>
          <p className="fine">cronômetros parados e o que ainda roda</p>
        </article>
      </section>

      {!hasWork ? (
        <div className="empty ro-window">
          <Pixel src={RO.poring} size={40} />
          <p>Quando alguém selar uma instância ou parar um cronômetro, os gráficos aparecem aqui.</p>
        </div>
      ) : (
        <>
          <section className="panel ro-window">
            <h2>Conclusões por ritmo</h2>
            <p className="fine">Cada selo novo conta uma conclusão. Tirar o selo não apaga o histórico.</p>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view.bySection} accessibilityLayer>
                  <CartesianGrid stroke="rgba(122,215,255,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Legend wrapperStyle={{ color: "#a9b6cf", fontSize: 12 }} />
                  <Bar dataKey={youKey} fill="#4ef0d3" radius={[6, 6, 0, 0]} />
                  <Bar dataKey={otherKey} fill="#ff8f6b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="panel ro-window">
            <h2>Conclusões por dia</h2>
            <p className="fine">{range === "7" ? "Últimos 7 dias." : "Últimos 30 dias."}</p>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={view.line} accessibilityLayer margin={{ right: 16, left: 0 }}>
                  <CartesianGrid stroke="rgba(122,215,255,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} interval={range === "7" ? 0 : 4} />
                  <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ color: "#a9b6cf", fontSize: 12 }} />
                  <Line type="monotone" dataKey={youKey} stroke="#4ef0d3" strokeWidth={2.6} dot={false} />
                  <Line type="monotone" dataKey={otherKey} stroke="#ff8f6b" strokeWidth={2.6} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {view.slow.length > 0 && (
            <section className="panel ro-window">
              <h2>Onde o tempo vai</h2>
              <p className="fine">Média em minutos das corridas cronometradas.</p>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={view.slow} layout="vertical" accessibilityLayer margin={{ left: 8, right: 8 }}>
                    <CartesianGrid stroke="rgba(122,215,255,0.08)" horizontal={false} />
                    <XAxis type="number" tick={axis} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={120} tick={axis} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="minutos" fill="#7ad7ff" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <section className="panel ro-window">
            <h2>Últimas corridas</h2>
            {view.runs.length === 0 ? (
              <p className="fine">Nenhum cronômetro parado neste período.</p>
            ) : (
              <ul className="runs">
                {view.runs.map((run) => (
                  <li key={run.id}>
                    <strong>{byId.get(run.instanceId)?.name || run.instanceId}</strong>
                    <b>
                      {formatDuration(run.ms)}
                      {run.capped ? " · teto" : ""}
                    </b>
                    <span>
                      {roleLabel(run.user)} · {formatWhen(run.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel ro-window">
            <div className="table-wrap">
              <table>
                <caption>Livro do período</caption>
                <thead>
                  <tr>
                    <th scope="col">Instância</th>
                    <th scope="col">{youKey}</th>
                    <th scope="col">{otherKey}</th>
                    <th scope="col">Tempo médio</th>
                  </tr>
                </thead>
                <tbody>
                  {view.table.length === 0 ? (
                    <tr>
                      <td colSpan={4}>Ainda não há selos neste período.</td>
                    </tr>
                  ) : (
                    view.table.map((row) => (
                      <tr key={row.id}>
                        <th scope="row">{row.name}</th>
                        <td>{row.you}</td>
                        <td>{row.other}</td>
                        <td>{row.avg ? formatDuration(row.avg) : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="fine">O zeny soma os preços cadastrados da lista, uma vez por selo.</p>
          </section>
        </>
      )}
    </div>
  )
}
