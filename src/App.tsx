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
import { MarketLink } from "./market/MarketLink"
import { CHARACTERS, itemIcon } from "./characters"
import { INSTANCES, SHARED_DROPS } from "./data"
import { elapsedMs, formatClock, formatDuration, formatWhen, formatZeny, NAMES, personFromEmail, roleLabel, todayKey } from "./format"
import { extraDropId, parseExtraItemId, resolveDropItemId } from "./itemIds"
import { ensureCatalogLoaded, searchCatalog } from "./items-catalog"
import { FILTER_ICON, RO, SECTION_ICON } from "./ro"
import type { CatalogItem, Drop, GameState, Op, Person } from "./types"

type FilterId = "all" | "watch" | "pending" | "horas" | "diario" | "tres" | "semanal"
type LevelFilterId = "all" | "lt100" | "100-129" | "130-159" | "160-179" | "180-199" | "200plus"
type TabId = "board" | "dash" | "farm"

function timerKey(instanceId: string, person: Person) {
  return `${instanceId}:${person}`
}

function instanceIdFromTimerKey(key: string) {
  const at = key.lastIndexOf(":")
  return at > 0 ? key.slice(0, at) : key
}

type SealConfirm = {
  instanceId: string
  name: string
}

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "watch", label: "Prioridade" },
  { id: "pending", label: "Pendentes" },
  { id: "horas", label: "Horas" },
  { id: "diario", label: "Diárias" },
  { id: "tres", label: "3 dias" },
  { id: "semanal", label: "Semanais" },
]

const LEVEL_FILTERS: { id: LevelFilterId; label: string; match: (nivel: number) => boolean }[] = [
  { id: "all", label: "Nv. todos", match: () => true },
  { id: "lt100", label: "≤99", match: (n) => n <= 99 },
  { id: "100-129", label: "100–129", match: (n) => n >= 100 && n <= 129 },
  { id: "130-159", label: "130–159", match: (n) => n >= 130 && n <= 159 },
  { id: "160-179", label: "160–179", match: (n) => n >= 160 && n <= 179 },
  { id: "180-199", label: "180–199", match: (n) => n >= 180 && n <= 199 },
  { id: "200plus", label: "200+", match: (n) => n >= 200 },
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
  onRemove,
}: {
  drop: Drop
  price: number
  qty: number
  onSavePrice: (value: number) => void
  onSaveQty: (value: number) => void
  onRemove?: () => void
}) {
  const [qtyText, setQtyText] = useState(qty ? String(qty) : "")
  const itemId = resolveDropItemId(drop.id, drop.itemId) || parseExtraItemId(drop.id)
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
        <strong>
          {drop.name}
          <MarketLink name={drop.name} />
        </strong>
        <span>{drop.crafts[0] || drop.detail}</span>
        {onRemove && (
          <button className="ghost slim danger-text" type="button" onClick={onRemove}>
            Tirar da instância
          </button>
        )}
      </div>
      <label className="qty-mini">
        <span className="sr">Quantidade hoje</span>
        <input
          inputMode="numeric"
          placeholder="qtd"
          value={qtyText}
          title="Quantidade dropada hoje (zera no próximo ciclo)"
          onChange={(event) => setQtyText(event.target.value.replace(/\D/g, "").slice(0, 8))}
          onBlur={() => onSaveQty(Number(qtyText || 0))}
        />
      </label>
      <PriceField id={drop.id} price={price} onSave={onSavePrice} />
    </div>
  )
}

function ExtraDropPicker({
  instanceId,
  knownDropIds,
  onPick,
}: {
  instanceId: string
  knownDropIds: Set<string>
  onPick: (item: CatalogItem) => void
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  useEffect(() => {
    void ensureCatalogLoaded()
  }, [])
  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return []
    return searchCatalog(query, 12).filter((item) => !knownDropIds.has(extraDropId(item.id)))
  }, [knownDropIds, query])

  if (!open) {
    return (
      <button className="ghost slim extra-drop-toggle" type="button" onClick={() => setOpen(true)}>
        + Outro drop (carta, álbum, caixa…)
      </button>
    )
  }

  return (
    <div className="extra-drop">
      <label>
        Buscar outro drop
        <input
          value={query}
          autoFocus
          placeholder="Ex.: Velho Álbum, Carta Celine, Caixa Roxa…"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="item-suggest compact" role="listbox">
        {suggestions.map((item) => (
          <button
            key={`${instanceId}-${item.id}`}
            type="button"
            className="item-opt"
            onClick={() => {
              onPick(item)
              setQuery("")
              setOpen(false)
            }}
          >
            {itemIcon(item.id) ? (
              <img className="pixel-icon" src={itemIcon(item.id)!} alt="" width={20} height={20} />
            ) : (
              <PixelIcon src={RO.purpleBox} size={20} />
            )}
            <span>{item.name}</span>
            <small>#{item.id}</small>
          </button>
        ))}
      </div>
      <button className="ghost slim" type="button" onClick={() => setOpen(false)}>Fechar busca</button>
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
  const [levelFilter, setLevelFilter] = useState<LevelFilterId>("all")
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmSeal, setConfirmSeal] = useState<SealConfirm | null>(null)
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

  const liveTimerCount = state
    ? Object.keys(state.active).length + Object.keys(state.activeFarms || {}).length
    : 0
  useEffect(() => {
    if (!liveTimerCount) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [liveTimerCount])

  useEffect(() => {
    document.body.style.overflow = confirmReset || confirmSeal || wiki ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [confirmReset, confirmSeal, wiki])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConfirmReset(false)
        setConfirmSeal(null)
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
    if (!state || !emailRef.current || inflight.current.has(key)) return false
    inflight.current.add(key)
    saving.current += 1
    const prev = state
    try {
      const result = await sendOp(emailRef.current, op)
      accept(result.state)
      if (!result.changed) {
        setBanner("A ação não foi aplicada. Confere os dados e tenta de novo.")
        return false
      }
      setStatus(message)
      setBanner("")
      return true
    } catch {
      setState(prev)
      version.current = prev.version
      setBanner("Não consegui sincronizar. Tenta de novo.")
      return false
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

  const today = todayKey()

  const levelRule = LEVEL_FILTERS.find((item) => item.id === levelFilter) || LEVEL_FILTERS[0]

  const filtered = useMemo(() => {
    if (!state || !user) return []
    const q = norm(query.trim())
    return INSTANCES.filter((item) => {
      const seeded = user === "thiago" && (state.watchSeed || []).includes(item.id)
      const fruited = state.watch[user].includes(item.id)
      if (filter === "watch" && !fruited && !seeded) return false
      if (filter === "pending" && state.completions[item.id]?.[user]) return false
      if (filter !== "all" && filter !== "watch" && filter !== "pending" && item.section !== filter) return false
      const nivel = Number(item.nivel)
      if (!levelRule.match(Number.isFinite(nivel) ? nivel : 0)) return false
      if (!q) return true
      const hay = norm([item.name, item.premiacao, item.requisito, item.retorno, ...item.drops.flatMap((drop) => [drop.name, drop.detail, ...drop.crafts])].join(" "))
      return hay.includes(q)
    }).sort((a, b) => {
      const rank = (id: string) => {
        if (state.watch[user].includes(id)) return 2
        if (user === "thiago" && (state.watchSeed || []).includes(id)) return 1
        return 0
      }
      const aWatch = rank(a.id)
      const bWatch = rank(b.id)
      if (aWatch !== bWatch) return bWatch - aWatch
      if (a.sectionRank !== b.sectionRank) return a.sectionRank - b.sectionRank
      if (a.subRank !== b.subRank) return a.subRank - b.subRank
      return a.name.localeCompare(b.name, "pt-BR")
    })
  }, [filter, levelRule, query, state, user])

  const running = useMemo(() => {
    if (!state) return []
    return Object.entries(state.active)
      .map(([key, active]) => {
        const id = instanceIdFromTimerKey(key)
        return {
          key,
          id,
          active,
          mine: Boolean(user && active.user === user),
          name: INSTANCES.find((item) => item.id === id)?.name || id,
        }
      })
      .sort((a, b) => a.active.startedAt - b.active.startedAt)
  }, [state, user])

  const doneMine = useMemo(() => {
    if (!state || !user) return 0
    return INSTANCES.filter((item) => state.completions[item.id]?.[user]).length
  }, [state, user])

  const bestMsByInstance = useMemo(() => {
    if (!user) return new Map<string, number>()
    const out = new Map<string, number>()
    for (const run of state?.runs || []) {
      if (run.user !== user || !(run.ms > 0)) continue
      const cur = out.get(run.instanceId)
      if (cur == null || run.ms < cur) out.set(run.instanceId, run.ms)
    }
    return out
  }, [state?.runs, user])

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
            <div className="stat-pill" title="Ciclo vira todo dia às 4h (Brasília). Selos zeram; histórico fica no painel.">
              <b className="mono">{progress}%</b>
              <small>ciclo · 4h</small>
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
              <div className="filters">
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
                <nav className="zones levels" aria-label="Filtro por nível">
                  {LEVEL_FILTERS.map((item) => (
                    <button
                      key={item.id}
                      className="zone level"
                      type="button"
                      aria-pressed={levelFilter === item.id}
                      onClick={() => setLevelFilter(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

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
                      <button className="ghost" type="button" onClick={() => { setQuery(""); setFilter("all"); setLevelFilter("all") }}>Limpar</button>
                    </div>
                  )}

                  {filtered.map((item) => {
                    const done = state.completions[item.id] || {}
                    const active = state.active[timerKey(item.id, user)]
                    const otherLive = people
                      .filter((person) => person !== user)
                      .map((person) => {
                        const timer = state.active[timerKey(item.id, person)]
                        return timer ? { person, timer } : null
                      })
                      .filter(Boolean) as { person: Person; timer: NonNullable<typeof active> }[]
                    const last = [...state.runs].reverse().find((run) => run.instanceId === item.id && run.user === user)
                    const bestMs = bestMsByInstance.get(item.id)
                    const both = Boolean(done.thiago && done.rafael)
                    const fruited = state.watch.thiago.includes(item.id) || state.watch.rafael.includes(item.id)
                    const seeded = user === "thiago" && (state.watchSeed || []).includes(item.id)
                    const open = expanded === item.id
                    const live = active ? elapsedMs(active.startedAt, active.elapsedMs, now) : 0

                    return (
                      <article
                        key={item.id}
                        className={`row${fruited ? " flagged" : ""}${seeded && !fruited ? " seeded" : ""}${both ? " both" : ""}${active ? " live-card" : ""}`}
                      >
                        <div className="row-main">
                          <div className="flag-stack">
                            {user === "thiago" && (
                              <button
                                className="flag seed"
                                type="button"
                                aria-pressed={seeded}
                                aria-label={seeded ? "Tirar prioridade pessoal" : "Prioridade só pra mim"}
                                title={seeded ? "Semente: só você — tirar" : "Semente de Ygg: prioridade só pra você"}
                                onClick={() =>
                                  void act(
                                    item.id + "seed",
                                    { op: "toggleSeed", instanceId: item.id },
                                    seeded ? `${item.name} saiu da sua prioridade.` : `${item.name} na sua prioridade (semente).`,
                                  )
                                }
                              >
                                <PixelIcon src={RO.yggSeed} size={18} />
                              </button>
                            )}
                            <button
                              className="flag fruit"
                              type="button"
                              aria-pressed={fruited}
                              aria-label={fruited ? "Tirar prioridade da party" : "Prioridade da party"}
                              title={fruited ? "Fruto: party — tirar" : "Fruto de Ygg: prioridade pra vocês dois"}
                              onClick={() =>
                                void act(
                                  item.id + "watch",
                                  { op: "toggleWatch", instanceId: item.id },
                                  fruited ? `${item.name} saiu da prioridade da party.` : `${item.name} na prioridade da party.`,
                                )
                              }
                            >
                              <PixelIcon src={RO.yggBerry} size={18} />
                            </button>
                          </div>
                          <div className="row-head">
                            <div className="kicker">
                              <span className={`badge ${item.section}`}>
                                <PixelIcon src={SECTION_ICON[item.section]} size={13} />
                                {item.retorno}
                              </span>
                              <span className="pill">Nv. {item.nivel}</span>
                              <span className="pill">{item.modo}</span>
                              {bestMs != null && (
                                <span className="pill avg" title="Seu melhor tempo nesta instância">
                                  Melhor {formatDuration(bestMs)}
                                </span>
                              )}
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
                            const sealed = Boolean(done[person])
                            return (
                              <button
                                key={person}
                                className={`seal ${mineSeal ? "you" : "other"}`}
                                type="button"
                                aria-pressed={sealed}
                                disabled={!mineSeal}
                                title={mineSeal ? (sealed ? "Remover seu selo" : "Marcar como concluída") : `Selo de ${roleLabel(person)}`}
                                onClick={() => {
                                  if (!mineSeal) return
                                  if (sealed) {
                                    void act(
                                      item.id + person,
                                      { op: "toggleDone", instanceId: item.id },
                                      `Selo de ${roleLabel(person)} removido em ${item.name}.`,
                                    )
                                    return
                                  }
                                  setConfirmSeal({ instanceId: item.id, name: item.name })
                                }}
                              >
                                <i><PixelIcon src={CHARACTERS[person].gem} size={13} /></i>
                                <span>
                                  {roleLabel(person)}
                                  <small>{sealed ? formatWhen(done[person]!) : "selo"}</small>
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
                          <p className="last">Você na instância agora{live > 8 * 60 * 60 * 1000 ? " · teto 8h" : ""}{bestMs != null ? ` · melhor ${formatDuration(bestMs)}` : ""}</p>
                        )}
                        {!active && otherLive.length > 0 && (
                          <p className="last">
                            {otherLive.map(({ person, timer }) =>
                              `${roleLabel(person)} rodando ${formatClock(elapsedMs(timer.startedAt, timer.elapsedMs, now))}`,
                            ).join(" · ")}
                          </p>
                        )}
                        {!active && otherLive.length === 0 && (bestMs != null || last) && (
                          <p className="last">
                            {bestMs != null ? `Melhor ${formatDuration(bestMs)}` : null}
                            {bestMs != null && last ? " · " : null}
                            {last ? `Última ${formatDuration(last.ms)}${last.capped ? " · teto" : ""}` : null}
                          </p>
                        )}

                        {open && (
                          <div className="detail">
                            <div className="detail-meta">
                              <span>{item.requisito !== "-" ? `Requisito: ${item.requisito}` : "Sem requisito de missão"}</span>
                              <span className="prize">
                                <PixelIcon src={RO.purpleBox} size={15} />
                                Premiação <b>{item.premiacao}</b>
                              </span>
                              {fruited && <p className="also">Prioridade da party (fruto de Ygg)</p>}
                              {seeded && <p className="also">Sua prioridade pessoal (semente)</p>}
                              <a className="wiki" href={item.url} target="_blank" rel="noreferrer">Abrir na bROWiki</a>
                            </div>
                            <div className="drops">
                              <div className="drops-head">
                                <PixelIcon src={RO.goldCoin} size={14} />
                                Drops de hoje · qtd + preço
                              </div>
                              {item.blurb && <p className="fine">{item.blurb}</p>}
                              <p className="fine">Drops conhecidos e extras que vocês cadastraram. Extra fica na instância; a qtd zera no ciclo.</p>
                              {item.drops.map((drop) => {
                                const todayLoot = (state.loot || []).find(
                                  (row) => row.source === "instance" && row.user === user && row.dropId === drop.id && row.day === today,
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
                              })}
                              {(state.instanceExtras?.[item.id] || [])
                                .filter((extra) => !item.drops.some((drop) => drop.id === extra.dropId))
                                .map((extra) => {
                                  const todayLoot = (state.loot || []).find(
                                    (row) => row.source === "instance" && row.user === user && row.dropId === extra.dropId && row.day === today,
                                  )
                                  const drop: Drop = {
                                    id: extra.dropId,
                                    name: extra.itemName,
                                    detail: "Drop extra cadastrado nesta instância.",
                                    crafts: [],
                                    itemId: extra.itemId,
                                  }
                                  return (
                                    <DropRow
                                      key={extra.dropId}
                                      drop={drop}
                                      price={state.prices[extra.dropId] || todayLoot?.price || 0}
                                      qty={todayLoot?.qty || 0}
                                      onSavePrice={(value) => void act(extra.dropId + "price", { op: "setPrice", dropId: extra.dropId, price: value }, `Preço de ${drop.name} atualizado.`)}
                                      onSaveQty={(value) => void act(
                                        extra.dropId + "qty",
                                        {
                                          op: "upsertDailyLoot",
                                          dropId: extra.dropId,
                                          instanceId: item.id,
                                          itemName: drop.name,
                                          itemId: extra.itemId,
                                          qty: value,
                                          price: state.prices[extra.dropId] || 0,
                                        },
                                        value ? `Qtd de ${drop.name} hoje: ${value}.` : `Qtd de ${drop.name} zerada hoje.`,
                                      )}
                                      onRemove={() => void act(
                                        extra.dropId + "rm",
                                        { op: "removeInstanceExtra", instanceId: item.id, dropId: extra.dropId },
                                        `${drop.name} saiu da lista da instância.`,
                                      )}
                                    />
                                  )
                                })}
                              <ExtraDropPicker
                                instanceId={item.id}
                                knownDropIds={new Set([
                                  ...item.drops.map((drop) => drop.id),
                                  ...(state.instanceExtras?.[item.id] || []).map((extra) => extra.dropId),
                                ])}
                                onPick={(picked) => {
                                  const dropId = extraDropId(picked.id)
                                  void act(
                                    dropId + "add",
                                    {
                                      op: "upsertDailyLoot",
                                      dropId,
                                      instanceId: item.id,
                                      itemName: picked.name,
                                      itemId: picked.id,
                                      qty: 1,
                                      price: state.prices[dropId] || 0,
                                    },
                                    `${picked.name} ficou na lista desta instância.`,
                                  )
                                }}
                              />
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
                    <p className="gate-kicker">{NAMES[user]}</p>
                    <h2>{me.job}</h2>
                    <p>{me.title}</p>
                    <em>{me.motto}</em>
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
              <article key={item.key}>
                <p>
                  <PixelIcon src={RO.redGem} size={16} />
                  <strong>{item.name}</strong>
                  <small className="clock"> · {formatClock(live)} · {roleLabel(item.active.user)}</small>
                </p>
                {item.mine ? (
                  <button type="button" onClick={() => void act(item.key + "stop", { op: "timerStop", instanceId: item.id }, `Cronômetro de ${item.name} parado.`)}>
                    Parar
                  </button>
                ) : null}
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
            <p className="lede">Tira as marcas deste ciclo. Às 4h (Brasília) isso acontece sozinho — histórico, tempos e loot ficam no painel.</p>
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

      {confirmSeal && (
        <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="seal-titulo">
          <button className="sheet-backdrop" type="button" aria-label="Fechar" onClick={() => setConfirmSeal(null)} />
          <div className="sheet">
            <h2 id="seal-titulo">Marcar como concluída?</h2>
            <p className="lede">
              Confirma o selo em <strong>{confirmSeal.name}</strong>? Isso entra no histórico do Painel.
            </p>
            <button className="ghost" type="button" onClick={() => setConfirmSeal(null)}>Cancelar</button>
            <button
              className="primary"
              type="button"
              onClick={() => {
                const target = confirmSeal
                setConfirmSeal(null)
                void act(
                  target.instanceId + user,
                  { op: "toggleDone", instanceId: target.instanceId },
                  `${target.name} concluída (${roleLabel(user)}).`,
                )
              }}
            >
              Confirmar selo
            </button>
          </div>
        </div>
      )}
    </ClickSpark>
  )
}
