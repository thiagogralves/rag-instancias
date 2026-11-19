import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { clearEmail, loadState, sendOp, storedEmail, storeEmail } from "./api"
import ClickSpark from "./bits/ClickSpark/ClickSpark"
import CountUp from "./bits/CountUp/CountUp"
import DecryptedText from "./bits/DecryptedText/DecryptedText"
import ElectricBorder from "./bits/ElectricBorder"
import GooeyNav from "./bits/GooeyNav"
import ShinyText from "./bits/ShinyText"
import { BoardFx, GateFx } from "./FxLayer"
import { Dashboard } from "./Dashboard"
import { Farm } from "./Farm"
import { WikiModal } from "./WikiModal"
import { CHARACTERS, itemIcon } from "./characters"
import { INSTANCES, SHARED_DROPS } from "./data"
import { dayKey, elapsedMs, formatClock, formatDuration, formatWhen, formatZeny, NAMES, personFromEmail, roleLabel } from "./format"
import { resolveDropItemId } from "./itemIds"
import { FILTER_ICON, RO, SECTION_ICON } from "./ro"
import type { Drop, GameState, Op, Person } from "./types"

type FilterId = "all" | "watch" | "pending" | "horas" | "diario" | "tres" | "semanal"
type TabId = "board" | "dash" | "farm"

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "watch", label: "Prioridade" },
  { id: "pending", label: "Pendentes" },
  { id: "horas", label: "Horas" },
  { id: "diario", label: "Diárias" },
  { id: "tres", label: "3 dias" },
  { id: "semanal", label: "Semanais" },
]

const NAV = [
  { label: "Instâncias" },
  { label: "Farm" },
  { label: "Painel" },
]

function tabFromIndex(index: number): TabId {
  if (index === 1) return "farm"
  if (index === 2) return "dash"
  return "board"
}

function indexFromTab(tab: TabId) {
  if (tab === "farm") return 1
  if (tab === "dash") return 2
  return 0
}

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

function DropRow({
  drop,
  price,
  qty,
  onSavePrice,
  onSaveQty,
}: {
  drop: Drop
  price: number
  qty: number
  onSavePrice: (value: number) => void
  onSaveQty: (value: number) => void
}) {
  const [qtyText, setQtyText] = useState(qty ? String(qty) : "")
  const itemId = resolveDropItemId(drop.id, drop.itemId)
  const icon = itemIcon(itemId)
  useEffect(() => {
    setQtyText(qty ? String(qty) : "")
  }, [qty])
  return (
    <div className="drop-row rich">
      <div className="drop-icon" aria-hidden="true">
        {icon ? <PixelIcon src={icon} size={24} /> : <PixelIcon src={RO.purpleBox} size={22} />}
      </div>
      <div className="drop-copy">
        <strong>{drop.name}</strong>
        <span>{drop.crafts[0] || drop.detail}</span>
      </div>
      <label className="qty-mini">
        <span className="sr">Quantidade hoje</span>
        <input
          inputMode="numeric"
          placeholder="qtd"
          value={qtyText}
          title="Quantidade dropada hoje (zera amanhã na lista)"
          onChange={(event) => setQtyText(event.target.value.replace(/\D/g, "").slice(0, 8))}
          onBlur={() => onSaveQty(Number(qtyText || 0))}
        />
      </label>
      <PriceField id={drop.id} price={price} onSave={onSavePrice} />
    </div>
  )
}

export function App() {
  const [email, setEmail] = useState(storedEmail)
  const [draft, setDraft] = useState("")
  const [phase, setPhase] = useState<"boot" | "anon" | "in">("boot")
  const [user, setUser] = useState<Person | null>(null)
  const [state, setState] = useState<GameState | null>(null)
  const [tab, setTab] = useState<TabId>(() => {
    const saved = sessionStorage.getItem("rag-tab")
    if (saved === "dash" || saved === "farm" || saved === "board") return saved
    return "board"
  })
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<FilterId>("all")
  const [confirmReset, setConfirmReset] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [wiki, setWiki] = useState<{ title: string; url: string } | null>(null)
  const [banner, setBanner] = useState("")
  const [status, setStatus] = useState("")
  const [loginError, setLoginError] = useState("")
  const [busyLogin, setBusyLogin] = useState(false)
  const [now, setNow] = useState(Date.now())
  const searchRef = useRef<HTMLInputElement>(null)
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
    document.body.style.overflow = confirmReset || wiki ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [confirmReset, wiki])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConfirmReset(false)
        setExpanded(null)
        setWiki(null)
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

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

  function selectTab(next: TabId) {
    setTab(next)
    sessionStorage.setItem("rag-tab", next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const todayKey = dayKey(new Date().toISOString())

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
      <ClickSpark sparkColor={["#dafa9c", "#ffffff", "#ffe08a"]} sparkCount={10} shape="star" glow={1.8}>
        <main className="gate">
          <GateFx />
          <ElectricBorder color="#dafa9c" glowColor="#dafa9c" borderRadius={28} thickness={1.5} chaos={0.35} speed={0.8} className="gate-electric">
            <form className="gate-card" onSubmit={enter}>
              <div className="gate-mascots" aria-hidden="true">
                <PixelIcon src={RO.poring} size={34} />
                <PixelIcon src={RO.poporing} size={30} />
                <PixelIcon src={RO.lunatic} size={32} />
              </div>
              <div className="gate-kicker">
                <PixelIcon src={RO.yggBerry} size={14} />
                midgard · acesso privado
              </div>
              <h1>
                <DecryptedText text="RUNE" animateOn="view" speed={35} sequential revealDirection="start" />
              </h1>
              <p className="lede">Board de instâncias no ritmo do Ragnarok — selos, drops e tempo da party.</p>
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
          </ElectricBorder>
        </main>
      </ClickSpark>
    )
  }

  const other: Person = user === "thiago" ? "rafael" : "thiago"
  const mine = state.history.filter((event) => event.user === user).length
  const people: Person[] = user === "thiago" ? ["thiago", "rafael"] : ["rafael", "thiago"]
  const me = CHARACTERS[user]
  const progress = Math.round((doneMine / INSTANCES.length) * 100)
  const navIndex = indexFromTab(tab)

  return (
    <ClickSpark sparkColor={[me.accent, "#dafa9c", "#ffe08a"]} sparkCount={8} shape="star" glow={1.4}>
      <a className="skip" href="#conteudo">Ir para o conteúdo</a>
      <span className="sr" aria-live="polite">{status}</span>
      <BoardFx />

      <div className="shell">
        <header className="hud" style={{ ["--job-accent" as string]: me.accent }}>
          <div className="hud-avatar">
            <img className="char-cut" src={me.image} alt="" />
          </div>
          <div className="hud-copy">
            <strong>
              <ShinyText text={`${NAMES[user]} · ${me.job}`} speed={3} />
            </strong>
            <span>{me.title}</span>
            <em>{me.motto}</em>
          </div>
          <div className="hud-stats">
            <div className="stat-pill">
              <b><CountUp to={doneMine} duration={0.7} trigger="load" /></b>
              <small>selos / {INSTANCES.length}</small>
            </div>
            <div className="stat-pill">
              <b className="mono">{progress}%</b>
              <small>ciclo</small>
            </div>
            <div className="stat-pill">
              <b><CountUp to={mine} duration={0.7} trigger="load" /></b>
              <small>histórico</small>
            </div>
          </div>
        </header>

        <div className="topbar">
          <div className="brand-mark">
            <PixelIcon src={RO.poring} size={26} />
            RUNE
            <span>party board</span>
          </div>
          <div className="who">
            <div className="gooey-wrap">
              <GooeyNav
                items={NAV}
                activeIndex={navIndex}
                onChange={(index) => selectTab(tabFromIndex(index))}
                theme="dark"
                color="#dafa9c"
                activeTextColor="#0f0f0f"
                size="sm"
                particleCount={8}
              />
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
            <Dashboard state={state} now={now} viewer={user} act={act} />
          ) : tab === "farm" ? (
            <Farm state={state} now={now} viewer={user} act={act} />
          ) : (
            <div className="board">
              <nav className="zones" aria-label="Filtros">
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    className="zone"
                    type="button"
                    aria-pressed={filter === item.id}
                    onClick={() => setFilter(item.id)}
                  >
                    <PixelIcon src={FILTER_ICON[item.id]} size={16} />
                    {item.label}
                  </button>
                ))}
                <button className="zone danger" type="button" onClick={() => setConfirmReset(true)}>
                  Limpar selos
                </button>
              </nav>

              <div className="main-col">
                <div className="command">
                  <PixelIcon src={RO.concentrated} size={18} />
                  <label className="sr" htmlFor="busca">Buscar</label>
                  <input
                    id="busca"
                    ref={searchRef}
                    value={query}
                    placeholder="Buscar instância, drop, craft…"
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <kbd>Ctrl K</kbd>
                  {query && (
                    <button className="clear" type="button" aria-label="Limpar busca" onClick={() => setQuery("")}>×</button>
                  )}
                </div>
                <p className="meta-line">
                  <span>{filtered.length} instâncias</span>
                  <span>toque na linha pra expandir drops</span>
                </p>

                <div className="rail">
                  {filtered.length === 0 && (
                    <div className="empty">
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
                    const open = expanded === item.id
                    const live = active ? elapsedMs(active.startedAt, active.elapsedMs, now) : 0

                    return (
                      <article
                        key={item.id}
                        className={`row${flagged ? " flagged" : ""}${both ? " both" : ""}${active ? " live-card" : ""}`}
                      >
                        <div className="row-main">
                          <button
                            className="flag"
                            type="button"
                            aria-pressed={flagged}
                            aria-label={flagged ? "Tirar da prioridade" : "Marcar prioridade"}
                            onClick={() => void act(item.id + "watch", { op: "toggleWatch", instanceId: item.id }, flagged ? `${item.name} saiu da prioridade.` : `${item.name} ficou na prioridade.`)}
                          >
                            <PixelIcon src={RO.yggBerry} size={18} />
                          </button>
                          <div className="row-head">
                            <div className="kicker">
                              <span className={`badge ${item.section}`}>
                                <PixelIcon src={SECTION_ICON[item.section]} size={13} />
                                {item.retorno}
                              </span>
                              <span className="pill">Nv. {item.nivel}</span>
                              <span className="pill">{item.modo}</span>
                            </div>
                            <h2>
                              <button
                                type="button"
                                className="wiki-link"
                                onClick={() => setWiki({ title: item.name, url: item.url })}
                              >
                                {item.name}
                              </button>
                            </h2>
                          </div>
                        </div>

                        <div className="row-actions">
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
                                <i><PixelIcon src={CHARACTERS[person].gem} size={13} /></i>
                                <span>
                                  {roleLabel(person)}
                                  <small>{done[person] ? formatWhen(done[person]!) : "selo"}</small>
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
                            <span className="timer-label">
                              <PixelIcon src={active ? RO.redGem : RO.flyWing} size={15} />
                              {active ? "Parar" : "Timer"}
                            </span>
                            <b className="clock">{active ? formatClock(live) : "0:00"}</b>
                          </button>
                          <button
                            className="expand"
                            type="button"
                            aria-expanded={open}
                            onClick={() => setExpanded(open ? null : item.id)}
                          >
                            {open ? "Fechar" : "Drops"}
                            <span aria-hidden="true">{open ? "▴" : "▾"}</span>
                          </button>
                        </div>

                        {active && (
                          <p className="last">{roleLabel(active.user)} na instância agora{live > 8 * 60 * 60 * 1000 ? " · teto 8h" : ""}</p>
                        )}
                        {!active && last && (
                          <p className="last">Última: {formatDuration(last.ms)} · {roleLabel(last.user)}{last.capped ? " · teto" : ""}</p>
                        )}

                        {open && (
                          <div className="detail">
                            <div className="detail-meta">
                              <span>{item.requisito !== "-" ? `Requisito: ${item.requisito}` : "Sem requisito de missão"}</span>
                              <span className="prize">
                                <PixelIcon src={RO.purpleBox} size={15} />
                                Premiação <b>{item.premiacao}</b>
                              </span>
                              {state.watch[other].includes(item.id) && (
                                <p className="also">{roleLabel(other)} também marcou prioridade</p>
                              )}
                              <a className="wiki" href={item.url} target="_blank" rel="noreferrer">Abrir na bROWiki</a>
                            </div>
                            <div className="drops">
                              <div className="drops-head">
                                <PixelIcon src={RO.goldCoin} size={14} />
                                Drops de hoje · qtd + preço
                              </div>
                              {item.blurb && <p className="fine">{item.blurb}</p>}
                              {item.drops.length === 0 ? (
                                <p className="fine">Sem item de craft para precificar.</p>
                              ) : (
                                item.drops.map((drop) => {
                                  const todayLoot = (state.loot || []).find(
                                    (row) => row.source === "instance" && row.user === user && row.dropId === drop.id && row.day === todayKey,
                                  )
                                  return (
                                    <DropRow
                                      key={drop.id}
                                      drop={drop}
                                      price={state.prices[drop.id] || todayLoot?.price || 0}
                                      qty={todayLoot?.qty || 0}
                                      onSavePrice={(value) => void act(drop.id + "price", { op: "setPrice", dropId: drop.id, price: value }, `Preço de ${drop.name} atualizado.`)}
                                      onSaveQty={(value) => void act(
                                        drop.id + "qty",
                                        {
                                          op: "upsertDailyLoot",
                                          dropId: drop.id,
                                          instanceId: item.id,
                                          itemName: drop.name,
                                          itemId: resolveDropItemId(drop.id, drop.itemId),
                                          qty: value,
                                          price: state.prices[drop.id] || 0,
                                        },
                                        value ? `Qtd de ${drop.name} hoje: ${value}.` : `Qtd de ${drop.name} zerada hoje.`,
                                      )}
                                    />
                                  )
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </div>

              <aside className="side" aria-label="Personagem">
                <div className="char-card" style={{ ["--job-accent" as string]: me.accent }}>
                  <img className="char-cut" src={me.image} alt={`${NAMES[user]} · ${me.job}`} />
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
                <div className="tip-card">
                  <div className="tip-row">
                    <PixelIcon src={RO.poring} size={28} />
                    <div>
                      <strong>Fluxo rápido</strong>
                      <p>Selo e timer ficam na linha. Abre “Drops” só quando for precificar.</p>
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
              <article key={item.id}>
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
        <button type="button" aria-current={tab === "farm" ? "page" : undefined} onClick={() => selectTab("farm")}>
          <PixelIcon src={RO.yggBerry} size={20} />
          Farm
        </button>
        <button type="button" aria-current={tab === "dash" ? "page" : undefined} onClick={() => selectTab("dash")}>
          <PixelIcon src={RO.goldCoin} size={20} />
          Painel
        </button>
      </nav>

      {wiki && <WikiModal title={wiki.title} url={wiki.url} onClose={() => setWiki(null)} />}

      {confirmReset && (
        <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="reset-titulo">
          <button className="sheet-backdrop" type="button" aria-label="Fechar" onClick={() => setConfirmReset(false)} />
          <div className="sheet">
            <h2 id="reset-titulo">Limpar os selos?</h2>
            <p className="lede">Tira as marcas do ciclo. O histórico do painel continua.</p>
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
