import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { clearEmail, loadState, sendOp, storedEmail, storeEmail } from "./api"
import BlurText from "./bits/BlurText/BlurText"
import ClickSpark from "./bits/ClickSpark/ClickSpark"
import CountUp from "./bits/CountUp/CountUp"
import GlareHover from "./bits/GlareHover"
import GradientText from "./bits/GradientText"
import { BoardFx, GateFx } from "./FxLayer"
import { Dashboard } from "./Dashboard"
import { CHARACTERS, itemIcon } from "./characters"
import { INSTANCES, SHARED_DROPS } from "./data"
import { elapsedMs, formatClock, formatDuration, formatWhen, formatZeny, NAMES, personFromEmail, roleLabel } from "./format"
import { FILTER_ICON, RO, SECTION_ICON } from "./ro"
import type { Drop, GameState, Op, Person } from "./types"

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

function PixelIcon({ src, alt = "", size = 22 }: { src: string; alt?: string; size?: number }) {
  return (
    <img
      className="pixel-icon"
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={(event) => {
        event.currentTarget.style.visibility = "hidden"
      }}
    />
  )
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
    <label className="price-mini">
      <span className="sr">Preço em zeny</span>
      <span className="price-field">
        <PixelIcon src={RO.goldCoin} size={14} />
        <input
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={text}
          title={SHARED_DROPS.has(id) ? "Preço único em todas as instâncias deste item" : "Preço em zeny"}
          onFocus={() => {
            focused.current = true
          }}
          onBlur={() => {
            focused.current = false
            onSave(numeric)
          }}
          onChange={(event) => setText(event.target.value.replace(/\D/g, "").slice(0, 15))}
        />
      </span>
      {numeric > 0 && <em>{formatZeny(numeric)} z</em>}
    </label>
  )
}

function DropRow({ drop, price, onSave }: { drop: Drop; price: number; onSave: (value: number) => void }) {
  const icon = itemIcon(drop.itemId)
  return (
    <div className="drop-row">
      <div className="drop-icon" aria-hidden="true">
        {icon ? <PixelIcon src={icon} size={24} /> : <PixelIcon src={RO.purpleBox} size={22} />}
      </div>
      <div className="drop-copy">
        <strong>{drop.name}</strong>
        <span>{drop.crafts[0] || drop.detail}</span>
      </div>
      <PriceField id={drop.id} price={price} onSave={onSave} />
    </div>
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

  useEffect(() => {
    if (!filtersOpen && !confirmReset) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFiltersOpen(false)
        setConfirmReset(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
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
    window.scrollTo({ top: 0, behavior: "smooth" })
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

  const doneMine = useMemo(() => {
    if (!state || !user) return 0
    return INSTANCES.filter((item) => state.completions[item.id]?.[user]).length
  }, [state, user])

  if (phase === "boot" || (phase === "in" && !state)) {
    return (
      <div className="boot">
        <PixelIcon src={RO.poring} size={48} />
        <p>Abrindo o board…</p>
      </div>
    )
  }

  if (phase === "anon" || !user || !state) {
    return (
      <ClickSpark sparkColor={["#4ef0d3", "#7ad7ff", "#ffd56a"]} sparkCount={12} sparkRadius={28} shape="star" glow={2}>
        <main className="gate gate-solo">
          <GateFx />
          <div className="noise" aria-hidden="true" />
          <section className="gate-panel">
            <form className="gate-card ro-window" onSubmit={enter} data-enter>
              <div className="window-chrome" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="gate-mascots" aria-hidden="true">
                <PixelIcon src={RO.poring} size={36} />
                <PixelIcon src={RO.poporing} size={32} />
                <PixelIcon src={RO.lunatic} size={34} />
              </div>
              <div className="gate-kicker">
                <PixelIcon src={RO.blueGem} size={14} />
                board privado · midgard
              </div>
              <h1>
                <BlurText text="RUNE" className="brand-title" animateBy="letters" direction="top" delay={36} trigger="load" />
              </h1>
              <p className="lede">Instâncias, drops, preços e tempo de corrida — no clima de Ragnarok Online.</p>
              <label htmlFor="email">Gmail autorizado</label>
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
                <PixelIcon src={RO.flyWing} size={18} />
                {busyLogin ? "Entrando…" : "Entrar no board"}
              </button>
              <p className="fine">Sem senha. Só os dois Gmails liberados passam.</p>
            </form>
          </section>
        </main>
      </ClickSpark>
    )
  }

  const other: Person = user === "thiago" ? "rafael" : "thiago"
  const filterLabel = FILTERS.find((item) => item.id === filter)?.label || "Todas"
  const mine = state.history.filter((event) => event.user === user).length
  const people: Person[] = user === "thiago" ? ["thiago", "rafael"] : ["rafael", "thiago"]
  const me = CHARACTERS[user]
  const progress = Math.round((doneMine / INSTANCES.length) * 100)

  return (
    <ClickSpark sparkColor={[me.accent, "#7ad7ff", "#ffd56a"]} sparkCount={10} sparkRadius={24} shape="star" glow={1.6}>
      <a className="skip" href="#conteudo">Ir para o conteúdo</a>
      <span className="sr" aria-live="polite">{status}</span>
      <BoardFx user={user} />
      <div className="noise" aria-hidden="true" />

      <div className="shell">
        <header className="stage ro-window">
          <div className="stage-map" aria-hidden="true" />
          <div className="stage-copy">
            <p className="gate-kicker">
              <PixelIcon src={RO.yellowGem} size={14} />
              party board · ragnarok
            </p>
            <h1>
              <GradientText colors={["#ffffff", me.accent, "#9b8cff", "#ffd56a"]} animationSpeed={4} variant="flow" glow={0.35}>
                RUNE
              </GradientText>
            </h1>
            <p>Selos, drops e cronômetro sincronizado — como um mapa de Midgard só pra party.</p>
            <div className="stage-jobs single">
              <article style={{ ["--job-accent" as string]: me.accent }}>
                <div className="job-line">
                  <PixelIcon src={me.gem} size={18} />
                  <strong>{NAMES[user]} · {me.job}</strong>
                </div>
                <span>{me.title}</span>
                <em>{me.motto}</em>
              </article>
            </div>
            <div className="progress-bar" aria-label={`Progresso do ciclo: ${progress}%`}>
              <div className="progress-meta">
                <span>
                  <PixelIcon src={RO.yggBerry} size={16} />
                  Ciclo
                </span>
                <strong>
                  <CountUp to={doneMine} duration={0.8} trigger="load" />
                  <span> / {INSTANCES.length}</span>
                </strong>
              </div>
              <div className="progress-track">
                <i style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
          <div className="stage-art solo">
            <GlareHover
              width="100%"
              height="100%"
              background="transparent"
              borderColor="transparent"
              borderRadius="0"
              glareColor={me.accent}
              glareOpacity={0.35}
              mode="follow"
              className="stage-glare"
            >
              <img className="floaty me char-cut" src={me.image} alt={`${NAMES[user]} · ${me.job}`} />
            </GlareHover>
          </div>
        </header>

        <div className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              <PixelIcon src={RO.poring} size={28} />
            </div>
            <div>
              <strong>RUNE</strong>
              <p>{mine === 1 ? "1 selo no histórico" : `${mine} selos no histórico`}</p>
            </div>
          </div>
          <div className="who">
            <div className="tabs" role="tablist" aria-label="Seções">
              <button type="button" role="tab" aria-selected={tab === "board"} onClick={() => selectTab("board")}>
                <PixelIcon src={RO.butterflyWing} size={16} />
                Instâncias
              </button>
              <button type="button" role="tab" aria-selected={tab === "dash"} onClick={() => selectTab("dash")}>
                <PixelIcon src={RO.goldCoin} size={16} />
                Painel
              </button>
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
                <div className="toolbar sticky-tools">
                  <div className="search">
                    <label className="sr" htmlFor="busca">Buscar instância</label>
                    <PixelIcon src={RO.concentrated} size={18} />
                    <input
                      id="busca"
                      value={query}
                      placeholder="Buscar instância, drop, craft…"
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    {query && (
                      <button className="clear" type="button" aria-label="Limpar busca" onClick={() => setQuery("")}>×</button>
                    )}
                  </div>
                  <div className="chips" role="toolbar" aria-label="Filtros">
                    {FILTERS.map((item) => (
                      <button
                        key={item.id}
                        className="chip"
                        type="button"
                        aria-pressed={filter === item.id}
                        onClick={() => setFilter(item.id)}
                      >
                        <PixelIcon src={FILTER_ICON[item.id]} size={16} />
                        {item.label}
                      </button>
                    ))}
                    <button className="chip danger-chip" type="button" onClick={() => setConfirmReset(true)}>
                      Limpar selos
                    </button>
                  </div>
                  <button className="filter-launch" type="button" onClick={() => setFiltersOpen(true)}>
                    <PixelIcon src={FILTER_ICON[filter]} size={18} />
                    <span>{filterLabel}</span>
                    <span>Filtros</span>
                  </button>
                  <p className="statline">
                    Exibindo {filtered.length} · progresso sincroniza com a party
                  </p>
                </div>

                <div className="list">
                  {filtered.length === 0 && (
                    <div className="empty ro-window">
                      <PixelIcon src={RO.poring} size={40} />
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
                      <article
                        key={item.id}
                        className={`card ro-window${flagged ? " flagged" : ""}${both ? " both" : ""}${active ? " live-card" : ""}`}
                      >
                        <div className="card-glow" aria-hidden="true" />
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
                                <PixelIcon src={RO.yggBerry} size={20} />
                              </button>
                              <div>
                                <div className="kicker">
                                  <span className={`badge ${item.section}`}>
                                    <PixelIcon src={SECTION_ICON[item.section]} size={14} />
                                    {item.retorno}
                                  </span>
                                  <span className="pill">Nv. {item.nivel}</span>
                                  <span className="pill">{item.modo}</span>
                                </div>
                                <h2>{item.name}</h2>
                              </div>
                            </div>
                            <p className="meta">
                              {item.requisito !== "-" ? `Requisito: ${item.requisito}` : "Sem requisito de missão"}
                            </p>
                            <p className="prize">
                              <PixelIcon src={RO.purpleBox} size={16} />
                              Premiação <b>{item.premiacao}</b>
                            </p>
                            <a className="wiki" href={item.url} target="_blank" rel="noreferrer">
                              Abrir na bROWiki
                            </a>
                            {state.watch[other].includes(item.id) && (
                              <p className="also">{roleLabel(other)} também marcou prioridade</p>
                            )}
                          </div>
                          <div className="actions">
                            {people.map((person) => {
                              const mineSeal = person === user
                              return (
                                <button
                                  key={person}
                                  className={`seal ${mineSeal ? "you" : "other"}`}
                                  type="button"
                                  aria-pressed={Boolean(done[person])}
                                  onClick={() => void act(
                                    item.id + person,
                                    { op: "toggleDone", instanceId: item.id },
                                    done[person] ? `Selo de ${roleLabel(person)} removido em ${item.name}.` : `${item.name} concluída (${roleLabel(person)}).`,
                                  )}
                                >
                                  <i>
                                    <PixelIcon src={CHARACTERS[person].gem} size={14} />
                                  </i>
                                  <span>
                                    {roleLabel(person)}
                                    <small>{done[person] ? formatWhen(done[person]!) : mineSeal ? "seu selo" : "selo"}</small>
                                  </span>
                                </button>
                              )
                            })}
                            <button
                              className={`timer${active ? " on pulse-ring" : ""}`}
                              type="button"
                              onClick={() => void act(
                                item.id + "timer",
                                { op: active ? "timerStop" : "timerStart", instanceId: item.id },
                                active ? `Cronômetro de ${item.name} parado.` : `Cronômetro de ${item.name} iniciado.`,
                              )}
                            >
                              <span className="timer-label">
                                <PixelIcon src={active ? RO.redGem : RO.flyWing} size={16} />
                                {active ? "Parar" : "Iniciar"}
                              </span>
                              <b className="clock">{active ? formatClock(live) : "0:00"}</b>
                            </button>
                            {active && (
                              <p className="last">
                                {roleLabel(active.user)} está nesta instância.
                                {live > 8 * 60 * 60 * 1000 ? " Passou de 8h; ao parar, conto só o teto." : ""}
                              </p>
                            )}
                            {!active && last && (
                              <p className="last">
                                Última: {formatDuration(last.ms)} · {roleLabel(last.user)}
                                {last.capped ? " · teto de 8h" : ""}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="drops" id={`drops-${item.id}`}>
                          <div className="drops-head">
                            <PixelIcon src={RO.goldCoin} size={14} />
                            <span>Drops & preços</span>
                          </div>
                          {item.blurb && <p className="blurb">{item.blurb}</p>}
                          {item.drops.length === 0 ? (
                            <p className="blurb">Sem item de craft para precificar.</p>
                          ) : (
                            item.drops.map((drop) => (
                              <DropRow
                                key={drop.id}
                                drop={drop}
                                price={state.prices[drop.id] || 0}
                                onSave={(value) => void act(drop.id + "price", { op: "setPrice", dropId: drop.id, price: value }, `Preço de ${drop.name} atualizado.`)}
                              />
                            ))
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>

              <aside className="side" aria-label="Personagem">
                <div className="side-card char-card ro-window" style={{ ["--job-accent" as string]: me.accent }}>
                  <img className="floaty char-cut" src={me.image} alt={`${NAMES[user]} · ${me.job}`} />
                  <div className="cap">
                    <p className="gate-kicker">
                      <PixelIcon src={me.gem} size={14} />
                      {NAMES[user]}
                    </p>
                    <h2>{me.job}</h2>
                    <p>{me.title}</p>
                    <em>{me.motto}</em>
                  </div>
                </div>
                <div className="side-card tip-card ro-window">
                  <div className="tip-row">
                    <PixelIcon src={RO.poring} size={28} />
                    <div>
                      <strong>Dica de Midgard</strong>
                      <p>Marca prioridade com a Yggdrasil Berry. Selos sincronizam a cada poucos segundos.</p>
                    </div>
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
              <article key={item.id} className="ro-window">
                <p>
                  <PixelIcon src={RO.redGem} size={16} />
                  <strong>{item.name}</strong>
                  <small className="clock"> · {formatClock(live)} · {roleLabel(item.active.user)}</small>
                </p>
                <button type="button" onClick={() => void act(item.id + "stop", { op: "timerStop", instanceId: item.id }, `Cronômetro de ${item.name} parado.`)}>
                  Parar
                </button>
              </article>
            )
          })}
        </div>
      )}

      <nav className="dock" aria-label="Seções">
        <button type="button" aria-current={tab === "board" ? "page" : undefined} onClick={() => selectTab("board")}>
          <PixelIcon src={RO.butterflyWing} size={20} />
          Instâncias
        </button>
        <button type="button" aria-current={tab === "dash" ? "page" : undefined} onClick={() => selectTab("dash")}>
          <PixelIcon src={RO.goldCoin} size={20} />
          Painel
        </button>
      </nav>

      {filtersOpen && (
        <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="filtros-titulo">
          <button className="sheet-backdrop" type="button" aria-label="Fechar filtros" onClick={() => setFiltersOpen(false)} />
          <div className="sheet ro-window" tabIndex={-1}>
            <h2 id="filtros-titulo">Filtros</h2>
            {FILTERS.map((item) => (
              <button
                key={item.id}
                className="choice"
                type="button"
                aria-pressed={filter === item.id}
                onClick={() => { setFilter(item.id); setFiltersOpen(false) }}
              >
                <PixelIcon src={FILTER_ICON[item.id]} size={20} />
                {item.label}
              </button>
            ))}
            <button className="danger" type="button" onClick={() => { setFiltersOpen(false); setConfirmReset(true) }}>
              Limpar selos do ciclo
            </button>
          </div>
        </div>
      )}

      {confirmReset && (
        <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="reset-titulo">
          <button className="sheet-backdrop" type="button" aria-label="Fechar" onClick={() => setConfirmReset(false)} />
          <div className="sheet ro-window">
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
    </ClickSpark>
  )
}
