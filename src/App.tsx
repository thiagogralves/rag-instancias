import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { clearEmail, loadState, sendOp, storedEmail, storeEmail } from "./api"
import { Dashboard } from "./Dashboard"
import { INSTANCES, SHARED_DROPS } from "./data"
import { elapsedMs, formatClock, formatDuration, formatWhen, formatZeny, personFromEmail, roleLabel } from "./format"
import type { GameState, Op, Person } from "./types"

type FilterId = "all" | "watch" | "pending" | "horas" | "diario" | "tres" | "semanal"

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "watch", label: "Prioridade" },
  { id: "pending", label: "Pendentes" },
  { id: "horas", label: "Horas" },
  { id: "diario", label: "Diárias" },
  { id: "tres", label: "3 dias" },
  { id: "semanal", label: "Semanais" },
]

function norm(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
}

function PriceField({ id, price, onSave }: { id: string; price: number; onSave: (value: number) => void }) {
  const [text, setText] = useState(price ? String(price) : "")
  const focused = useRef(false)
  const saved = useRef(price)
  const textRef = useRef(text)
  const onSaveRef = useRef(onSave)
  textRef.current = text
  onSaveRef.current = onSave

  useEffect(() => {
    saved.current = price
    if (!focused.current) setText(price ? String(price) : "")
  }, [price])

  useEffect(() => {
    if (!focused.current) return
    const value = Number(text || 0)
    if (value === saved.current) return
    const handle = window.setTimeout(() => {
      saved.current = value
      onSaveRef.current(value)
    }, 700)
    return () => window.clearTimeout(handle)
  }, [text])

  useEffect(() => {
    return () => {
      const value = Number(textRef.current || 0)
      if (value !== saved.current) onSaveRef.current(value)
    }
  }, [])

  const numeric = Number(text || 0)
  return (
    <label className="price">
      <span>Preço em zeny</span>
      <input
        inputMode="numeric"
        autoComplete="off"
        value={text}
        onFocus={() => {
          focused.current = true
        }}
        onBlur={() => {
          focused.current = false
          onSave(numeric)
        }}
        onChange={(event) => setText(event.target.value.replace(/\D/g, "").slice(0, 15))}
      />
      {numeric > 0 && <em className="hint">{formatZeny(numeric)} z</em>}
      {SHARED_DROPS.has(id) && <em className="hint">Preço único: vale nas outras instâncias com este item.</em>}
    </label>
  )
}

export function App() {
  const [email, setEmail] = useState(storedEmail)
  const [draft, setDraft] = useState("")
  const [phase, setPhase] = useState<"boot" | "anon" | "in">("boot")
  const [user, setUser] = useState<Person | null>(null)
  const [state, setState] = useState<GameState | null>(null)
  const [tab, setTab] = useState<"board" | "dash">(() => (sessionStorage.getItem("rag-tab") === "dash" ? "dash" : "board"))
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<FilterId>("all")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [banner, setBanner] = useState("")
  const [status, setStatus] = useState("")
  const [loginError, setLoginError] = useState("")
  const [busyLogin, setBusyLogin] = useState(false)
  const [now, setNow] = useState(Date.now())
  const version = useRef(0)
  const saving = useRef(0)
  const inflight = useRef(new Set<string>())
  const emailRef = useRef(email)
  emailRef.current = email

  function accept(next: GameState) {
    if (next.version < version.current) return
    version.current = next.version
    setState(next)
  }

  async function refresh() {
    const current = emailRef.current
    if (!personFromEmail(current)) return
    try {
      const result = await loadState(current)
      accept(result.state)
      setUser(result.user)
      setBanner("")
    } catch (error) {
      if (error instanceof Error && error.message === "unauthorized") {
        clearEmail()
        setPhase("anon")
        return
      }
      setBanner("Não consegui sincronizar.")
    }
  }

  useEffect(() => {
    const saved = storedEmail()
    if (!personFromEmail(saved)) {
      setPhase("anon")
      return
    }
    setEmail(saved)
    emailRef.current = saved
    void loadState(saved)
      .then((result) => {
        accept(result.state)
        setUser(result.user)
        setPhase("in")
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "sync"
        if (message === "unauthorized") clearEmail()
        setLoginError(message === "store" ? "O cofre compartilhado ainda não está ligado." : "Não consegui falar com o servidor.")
        setPhase("anon")
      })
  }, [])

  useEffect(() => {
    if (phase !== "in") return
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible" || saving.current > 0) return
      void refresh()
    }, 8000)
    return () => window.clearInterval(id)
  }, [phase])

  const activeCount = state ? Object.keys(state.active).length : 0
  useEffect(() => {
    if (!activeCount) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [activeCount])

  useEffect(() => {
    document.body.style.overflow = filtersOpen || confirmReset ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [confirmReset, filtersOpen])

  async function enter(event: FormEvent) {
    event.preventDefault()
    const next = draft.trim().toLowerCase()
    if (!personFromEmail(next)) {
      setLoginError("Esse Gmail não tem acesso.")
      return
    }
    setBusyLogin(true)
    setLoginError("")
    storeEmail(next)
    setEmail(next)
    emailRef.current = next
    try {
      const result = await loadState(next)
      accept(result.state)
      setUser(result.user)
      setPhase("in")
    } catch (error) {
      clearEmail()
      setLoginError(error instanceof Error && error.message === "store" ? "O cofre compartilhado ainda não está ligado." : "Não consegui falar com o servidor.")
    } finally {
      setBusyLogin(false)
    }
  }

  async function act(key: string, op: Op, message: string) {
    if (!state || !emailRef.current || inflight.current.has(key)) return
    inflight.current.add(key)
    saving.current += 1
    const prev = state
    try {
      const result = await sendOp(emailRef.current, op)
      accept(result.state)
      setStatus(message)
      setBanner("")
    } catch {
      setState(prev)
      version.current = prev.version
      setBanner("Não consegui sincronizar. Tenta de novo.")
    } finally {
      saving.current -= 1
      inflight.current.delete(key)
    }
  }

  function selectTab(next: "board" | "dash") {
    setTab(next)
    sessionStorage.setItem("rag-tab", next)
    window.scrollTo(0, 0)
  }

  const filtered = useMemo(() => {
    if (!state || !user) return []
    const q = norm(query.trim())
    return INSTANCES.filter((item) => {
      if (filter === "watch" && !state.watch[user].includes(item.id)) return false
      if (filter === "pending" && state.completions[item.id]?.[user]) return false
      if (filter !== "all" && filter !== "watch" && filter !== "pending" && item.section !== filter) return false
      if (!q) return true
      const hay = norm([item.name, item.premiacao, item.requisito, item.retorno, ...item.drops.flatMap((drop) => [drop.name, drop.detail, ...drop.crafts])].join(" "))
      return hay.includes(q)
    }).sort((a, b) => {
      const aWatch = state.watch[user].includes(a.id) ? 1 : 0
      const bWatch = state.watch[user].includes(b.id) ? 1 : 0
      if (aWatch !== bWatch) return bWatch - aWatch
      if (a.sectionRank !== b.sectionRank) return a.sectionRank - b.sectionRank
      if (a.subRank !== b.subRank) return a.subRank - b.subRank
      return a.name.localeCompare(b.name, "pt-BR")
    })
  }, [filter, query, state, user])

  const running = useMemo(() => {
    if (!state) return []
    return Object.entries(state.active)
      .map(([id, active]) => ({ id, active, name: INSTANCES.find((item) => item.id === id)?.name || id }))
      .sort((a, b) => a.active.startedAt - b.active.startedAt)
  }, [state])

  if (phase === "boot" || (phase === "in" && !state)) {
    return <div className="boot">Abrindo o board…</div>
  }

  if (phase === "anon" || !user || !state) {
    return (
      <main className="gate">
        <section className="gate-visual" aria-hidden="true" style={{ backgroundImage: "url(/art/login-hero.jpg)" }}>
          <img src="/art/login-hero.jpg" alt="" />
          <div className="gate-copy">
            <p>Portais, runas e o ritmo das corridas. Um board privado para a party.</p>
          </div>
        </section>
        <section className="gate-panel">
          <form className="gate-card" onSubmit={enter}>
            <div className="gate-kicker">board privado</div>
            <h1>
              <span>RUNE</span>
            </h1>
            <p className="lede">Instâncias, drops, preços e tempo. Entra com o Gmail autorizado.</p>
            <label htmlFor="email">Gmail</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="nome@gmail.com"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <p className="form-error" role="alert">{loginError}</p>
            <button className="primary" type="submit" disabled={busyLogin}>
              {busyLogin ? "Entrando…" : "Entrar"}
            </button>
            <p className="fine">Sem senha. Só os dois Gmails liberados passam.</p>
          </form>
        </section>
      </main>
    )
  }

  const partner: Person = user === "thiago" ? "rafael" : "thiago"
  const filterLabel = FILTERS.find((item) => item.id === filter)?.label || "Todas"
  const mine = state.history.filter((event) => event.user === user).length
  const people: Person[] = user === "thiago" ? ["thiago", "rafael"] : ["rafael", "thiago"]

  return (
    <>
      <a className="skip" href="#conteudo">Ir para o conteúdo</a>
      <span className="sr" aria-live="polite">{status}</span>
      <div className="shell">
        <header className="hero" style={{ backgroundImage: "url(/art/world-map.jpg)" }}>
          <img src="/art/world-map.jpg" alt="" />
          <div className="hero-copy">
            <h1>RUNE</h1>
            <p>Board de instâncias com drops, crafts, selos e cronômetro compartilhado.</p>
          </div>
        </header>

        <div className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">R</div>
            <div>
              <strong>RUNE</strong>
              <p>{mine === 1 ? "1 selo no histórico" : `${mine} selos no histórico`}</p>
            </div>
          </div>
          <div className="who">
            <div className="tabs" role="tablist" aria-label="Seções">
              <button type="button" role="tab" aria-selected={tab === "board"} onClick={() => selectTab("board")}>Instâncias</button>
              <button type="button" role="tab" aria-selected={tab === "dash"} onClick={() => selectTab("dash")}>Painel</button>
            </div>
            <button
              className="ghost"
              type="button"
              onClick={() => {
                clearEmail()
                setPhase("anon")
                setUser(null)
                setState(null)
              }}
            >
              Sair
            </button>
          </div>
        </div>

        {banner && (
          <div className="banner" role="status">
            <span>{banner}</span>
            <button type="button" onClick={() => void refresh()}>Tentar</button>
          </div>
        )}

        <main id="conteudo">
          {tab === "dash" ? (
            <Dashboard state={state} now={now} viewer={user} />
          ) : (
            <div className="layout">
              <div>
                <div className="toolbar">
                  <div className="search">
                    <label className="sr" htmlFor="busca">Buscar instância</label>
                    <input id="busca" value={query} placeholder="Buscar instância, drop, craft…" onChange={(event) => setQuery(event.target.value)} />
                    {query && (
                      <button className="clear" type="button" aria-label="Limpar busca" onClick={() => setQuery("")}>×</button>
                    )}
                  </div>
                  <div className="chips" role="toolbar" aria-label="Filtros">
                    {FILTERS.map((item) => (
                      <button key={item.id} className="chip" type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
                        {item.label}
                      </button>
                    ))}
                    <button className="chip" type="button" onClick={() => setConfirmReset(true)}>Limpar selos</button>
                  </div>
                  <button className="filter-launch" type="button" onClick={() => setFiltersOpen(true)}>
                    <span>{filterLabel}</span>
                    <span>Filtros</span>
                  </button>
                  <p className="statline">Exibindo {filtered.length} · o progresso sincroniza com a party</p>
                </div>

                <div className="list">
                  {filtered.length === 0 && (
                    <div className="empty">
                      <p>Nada com esse filtro.</p>
                      <button className="ghost" type="button" onClick={() => { setQuery(""); setFilter("all") }}>Limpar</button>
                    </div>
                  )}
                  {filtered.map((item) => {
                    const done = state.completions[item.id] || {}
                    const active = state.active[item.id]
                    const last = [...state.runs].reverse().find((run) => run.instanceId === item.id)
                    const both = Boolean(done.thiago && done.rafael)
                    const flagged = state.watch[user].includes(item.id)
                    const live = active ? elapsedMs(active.startedAt, active.elapsedMs, now) : 0
                    return (
                      <article key={item.id} className={`card${flagged ? " flagged" : ""}${both ? " both" : ""}`}>
                        <div className="card-top">
                          <div>
                            <div className="title-row">
                              <button
                                className="flag"
                                type="button"
                                aria-pressed={flagged}
                                aria-label={flagged ? "Tirar da prioridade" : "Marcar prioridade"}
                                onClick={() => void act(item.id + "watch", { op: "toggleWatch", instanceId: item.id }, flagged ? `${item.name} saiu da prioridade.` : `${item.name} ficou na prioridade.`)}
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3v18M5 4h11l-2.2 4L16 12H5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                              </button>
                              <div>
                                <div className="kicker">
                                  <span className={`badge ${item.section}`}>{item.retorno}</span>
                                  <span className="pill">Nv. {item.nivel}</span>
                                  <span className="pill">{item.modo}</span>
                                </div>
                                <h2>{item.name}</h2>
                              </div>
                            </div>
                            <p className="meta">
                              {item.requisito !== "-" ? `Requisito: ${item.requisito}` : "Sem requisito de missão"}
                            </p>
                            <p className="prize">Premiação <b>{item.premiacao}</b></p>
                            <a className="wiki" href={item.url} target="_blank" rel="noreferrer">Abrir na bROWiki</a>
                            {state.watch[partner].includes(item.id) && <p className="also">Parceiro também marcou prioridade</p>}
                          </div>
                          <div className="actions">
                            {people.map((person) => {
                              const mineSeal = person === user
                              return (
                                <button
                                  key={person}
                                  className={`seal ${mineSeal ? "you" : "partner"}`}
                                  type="button"
                                  aria-pressed={Boolean(done[person])}
                                  onClick={() => void act(
                                    item.id + person,
                                    { op: "toggleDone", instanceId: item.id },
                                    done[person] ? `Selo de ${roleLabel(person, user)} removido em ${item.name}.` : `${item.name} concluída (${roleLabel(person, user)}).`,
                                  )}
                                >
                                  <i>{mineSeal ? "V" : "P"}</i>
                                  <span>
                                    {roleLabel(person, user)}
                                    <small>{done[person] ? formatWhen(done[person]!) : mineSeal ? "seu selo" : "selo"}</small>
                                  </span>
                                </button>
                              )
                            })}
                            <button
                              className={`timer${active ? " on" : ""}`}
                              type="button"
                              onClick={() => void act(
                                item.id + "timer",
                                { op: active ? "timerStop" : "timerStart", instanceId: item.id },
                                active ? `Cronômetro de ${item.name} parado.` : `Cronômetro de ${item.name} iniciado.`,
                              )}
                            >
                              <span>{active ? "Parar" : "Iniciar"}</span>
                              <b className="clock">{active ? formatClock(live) : "0:00"}</b>
                            </button>
                            {active && <p className="last">{roleLabel(active.user, user)} está nesta instância.{live > 8 * 60 * 60 * 1000 ? " Passou de 8h; ao parar, conto só o teto." : ""}</p>}
                            {!active && last && <p className="last">Última: {formatDuration(last.ms)} · {roleLabel(last.user, user)}{last.capped ? " · teto de 8h" : ""}</p>}
                            <button className="more" type="button" aria-expanded={open === item.id} aria-controls={`drops-${item.id}`} onClick={() => setOpen(open === item.id ? null : item.id)}>
                              {open === item.id ? "Fechar drops" : "Drops e craft"}
                            </button>
                          </div>
                        </div>
                        {open === item.id && (
                          <div className="drops" id={`drops-${item.id}`}>
                            {item.blurb && <p className="blurb">{item.blurb}</p>}
                            {item.drops.length === 0 && <p className="blurb">Esta instância não tem item de craft para precificar.</p>}
                            {item.drops.map((drop) => (
                              <section className="drop" key={drop.id}>
                                <h3>{drop.name}</h3>
                                <p>{drop.detail}</p>
                                {drop.crafts.length > 0 && (
                                  <ul className="craft">
                                    {drop.crafts.map((craft) => <li key={craft}>{craft}</li>)}
                                  </ul>
                                )}
                                <PriceField id={drop.id} price={state.prices[drop.id] || 0} onSave={(value) => void act(drop.id + "price", { op: "setPrice", dropId: drop.id, price: value }, `Preço de ${drop.name} atualizado.`)} />
                              </section>
                            ))}
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </div>

              <aside className="side" aria-label="Arte">
                <div className="side-card">
                  <img src="/art/panel-warrior.jpg" alt="Aventureira com lâmina rúnica, arte original do board" />
                  <div className="cap">
                    <h2>Corridas sincronizadas</h2>
                    <p>Selos, preços e cronômetros ficam na mesma crônica para a party toda.</p>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>

      {running.length > 0 && (
        <div className="live" aria-label="Cronômetros ativos">
          {running.map((item) => {
            const live = elapsedMs(item.active.startedAt, item.active.elapsedMs, now)
            return (
              <article key={item.id}>
                <p>
                  <strong>{item.name}</strong>
                  <small className="clock"> · {formatClock(live)} · {roleLabel(item.active.user, user)}</small>
                </p>
                <button type="button" onClick={() => void act(item.id + "stop", { op: "timerStop", instanceId: item.id }, `Cronômetro de ${item.name} parado.`)}>Parar</button>
              </article>
            )
          })}
        </div>
      )}

      <nav className="dock" aria-label="Seções">
        <button type="button" aria-current={tab === "board" ? "page" : undefined} onClick={() => selectTab("board")}>Instâncias</button>
        <button type="button" aria-current={tab === "dash" ? "page" : undefined} onClick={() => selectTab("dash")}>Painel</button>
      </nav>

      {filtersOpen && (
        <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="filtros-titulo">
          <button className="sheet-backdrop" type="button" aria-label="Fechar filtros" onClick={() => setFiltersOpen(false)} />
          <div className="sheet" tabIndex={-1}>
            <h2 id="filtros-titulo">Filtros</h2>
            {FILTERS.map((item) => (
              <button key={item.id} className="choice" type="button" aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setFiltersOpen(false) }}>
                {item.label}
              </button>
            ))}
            <button className="danger" type="button" onClick={() => { setFiltersOpen(false); setConfirmReset(true) }}>Limpar selos do ciclo</button>
          </div>
        </div>
      )}

      {confirmReset && (
        <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="reset-titulo">
          <button className="sheet-backdrop" type="button" aria-label="Fechar" onClick={() => setConfirmReset(false)} />
          <div className="sheet">
            <h2 id="reset-titulo">Limpar os selos?</h2>
            <p className="lede">Isso tira as marcas de concluído da party. O histórico do painel continua.</p>
            <button className="ghost" type="button" onClick={() => setConfirmReset(false)}>Cancelar</button>
            <button
              className="danger"
              type="button"
              onClick={() => {
                setConfirmReset(false)
                void act("reset", { op: "resetSeals" }, "Selos do ciclo limpos.")
              }}
            >
              Limpar selos
            </button>
          </div>
        </div>
      )}
    </>
  )
}
