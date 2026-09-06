import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Link } from "react-router-dom"
import { api, demo, roleLabel, type Role } from "./mock"

/* ------------------------------------------------------------------ */
/* Data fetching: every query gets loading / error+retry / data states */
/* ------------------------------------------------------------------ */

export interface Async<T> {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => void
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): Async<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    fn().then(
      (d) => {
        if (!alive) return
        setData(d)
        setLoading(false)
      },
      (e: Error) => {
        if (!alive) return
        setError(e.message || "Something went wrong.")
        setLoading(false)
      },
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const retry = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, retry }
}

/* ------------------------------------------------------------------ */
/* Icons (inline, stroke = currentColor)                               */
/* ------------------------------------------------------------------ */

export type IconName =
  | "grid" | "card" | "wallet" | "team" | "store" | "gear" | "globe" | "plus"
  | "arrow-right" | "arrow-up-right" | "external" | "copy" | "warning" | "sparkle"
  | "menu" | "close" | "back" | "check" | "layout" | "chevrons-left" | "chevron-down"
  | "chevron-left" | "chevron-right" | "lock" | "search" | "more" | "trash" | "mail"
  | "info" | "receipt" | "trend-up" | "trend-down" | "coins" | "user-plus" | "link" | "shield" | "bank"
  | "logout" | "user" | "chevron-up-down" | "swap"

const paths: Record<IconName, ReactNode> = {
  grid: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  card: (<><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 9.5h19" /></>),
  wallet: (<><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><path d="M16 12h3.5" /><path d="M2.5 8.5h14" /></>),
  team: (<><circle cx="9" cy="8.5" r="3.2" /><path d="M2.8 19.2c.8-3 3.2-4.7 6.2-4.7s5.4 1.7 6.2 4.7" /><circle cx="17" cy="9.5" r="2.4" /><path d="M16.2 14.6c2.5.2 4.3 1.7 5 4.1" /></>),
  store: (<><path d="M7 3.5 4.5 7v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7L17 3.5Z" /><path d="M4.5 7h15" /><path d="M15.5 10.5a3.5 3.5 0 0 1-7 0" /></>),
  gear: (<><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.6-4-9s1.4-6.5 4-9Z" /></>),
  plus: <path d="M12 5v14M5 12h14" />,
  "arrow-right": <path d="M4 12h16m0 0-6-6m6 6-6 6" />,
  "arrow-up-right": (<><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>),
  external: (<><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M19 14v5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V6.5A1.5 1.5 0 0 1 5.5 5H10" /></>),
  copy: (<><rect x="8.5" y="8.5" width="12" height="12" rx="2" /><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" /></>),
  warning: (<><path d="M12 3.5 21.5 20h-19L12 3.5Z" /><path d="M12 10v4.5" /><path d="M12 17.2v.3" /></>),
  sparkle: <path d="M12 3.5c.7 3.8 2.6 5.8 6.5 6.5-3.9.7-5.8 2.7-6.5 6.5-.7-3.8-2.6-5.8-6.5-6.5 3.9-.7 5.8-2.7 6.5-6.5ZM18.7 15.5c.3 1.7 1.2 2.6 2.9 2.9-1.7.3-2.6 1.2-2.9 2.9-.3-1.7-1.2-2.6-2.9-2.9 1.7-.3 2.6-1.2 2.9-2.9Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  back: <path d="M20 12H4m0 0 6-6m-6 6 6 6" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  layout: (<><rect x="3" y="3.5" width="18" height="17" rx="2.5" /><path d="M3 9h18M9.5 9v11.5" /></>),
  "chevrons-left": <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  lock: (<><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>),
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>),
  more: (<><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>),
  trash: (<><path d="M4 7h16" /><path d="M9 7V4.5h6V7" /><path d="M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12" /><path d="M10 11v6M14 11v6" /></>),
  mail: (<><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m3.5 7 8.5 6 8.5-6" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.6v.3" /></>),
  receipt: (<><path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" /><path d="M9 8.5h6M9 12h6" /></>),
  "trend-up": (<><path d="M3.5 17 9.5 11l4 4 7-7.5" /><path d="M15 7.5h5.5V13" /></>),
  "trend-down": (<><path d="M3.5 7 9.5 13l4-4 7 7.5" /><path d="M15 16.5h5.5V11" /></>),
  coins: (<><ellipse cx="9" cy="7.5" rx="6" ry="3" /><path d="M3 7.5v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /><path d="M3 12.5v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4" /><path d="M15 10.2c3.4-.2 6-1.6 6-3.2v9c0 1.4-1.8 2.6-4.5 3" /></>),
  "user-plus": (<><circle cx="10" cy="8.5" r="3.5" /><path d="M3.5 19.5c.9-3.2 3.5-5 6.5-5s5.6 1.8 6.5 5" /><path d="M19 8v6M16 11h6" /></>),
  shield: (<><path d="M12 3.5 4.5 6.5v5c0 4.3 3.2 7.6 7.5 9 4.3-1.4 7.5-4.7 7.5-9v-5L12 3.5Z" /><path d="m9 12 2 2 4-4.5" /></>),
  bank: (<><path d="M3.5 9.5 12 4.5l8.5 5" /><path d="M5 9.5v8M9.5 9.5v8M14.5 9.5v8M19 9.5v8" /><path d="M3.5 20h17" /></>),
  logout: (<><path d="M10 4.5H6.5A2 2 0 0 0 4.5 6.5v11a2 2 0 0 0 2 2H10" /><path d="M15 8l4 4-4 4" /><path d="M19 12H9.5" /></>),
  user: (<><circle cx="12" cy="8.5" r="3.6" /><path d="M4.5 20c.9-3.5 3.9-5.5 7.5-5.5s6.6 2 7.5 5.5" /></>),
  "chevron-up-down": (<><path d="m8 9.5 4-4 4 4" /><path d="m8 14.5 4 4 4-4" /></>),
  swap: (<><path d="M4 7h13l-3-3" /><path d="M20 17H7l3 3" /></>),
  link: (<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" /></>),
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* State cards & skeletons                                             */
/* ------------------------------------------------------------------ */

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="card state-card state-error" role="alert">
      <div className="state-icon" aria-hidden="true"><Icon name="warning" size={22} /></div>
      <h3>We couldn't load this</h3>
      <p>{message ?? "The server couldn't be reached."} Check your connection and try again.</p>
      <div className="state-actions">
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>Try again</button>
      </div>
    </div>
  )
}

export function EmptyState({ icon = "sparkle", title, body, action }: { icon?: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card state-card state-empty">
      <div className="state-icon" aria-hidden="true"><Icon name={icon} size={22} /></div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action && <div className="state-actions">{action}</div>}
    </div>
  )
}

export function Skeleton({ h = 16, w = "100%", round, style }: { h?: number; w?: string | number; round?: boolean; style?: React.CSSProperties }) {
  return <div className={`skeleton${round ? " round" : ""}`} style={{ height: h, width: w, ...style }} aria-hidden="true" />
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card" aria-label="Loading" role="status">
      <Skeleton h={18} w="40%" />
      <div style={{ height: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ marginBottom: 8 }}><Skeleton h={13} w={`${90 - i * 15}%`} /></div>
      ))}
    </div>
  )
}

/** Inline error inside a card that must keep its frame (stat cards). */
export function InlineError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <>
      <p className="hint" style={{ marginTop: 12 }}>The server couldn't be reached — couldn't load {what}.</p>
      <div className="stat-actions"><button className="btn btn-ghost btn-sm" onClick={onRetry}>Try again</button></div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

type ToastTone = "neutral" | "success" | "error"
type ToastFn = (msg: string, tone?: ToastTone) => void
const ToastCtx = createContext<ToastFn>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string; tone: ToastTone }[]>([])
  const idRef = useRef(0)

  const push = useCallback<ToastFn>((msg, tone = "neutral") => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, msg, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400)
  }, [])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>
            <span className="t-ico" aria-hidden="true">
              <Icon name={t.tone === "error" ? "warning" : t.tone === "success" ? "check" : "info"} size={13} />
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* ------------------------------------------------------------------ */
/* Initials, avatars, chips                                            */
/* ------------------------------------------------------------------ */

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

export function RoleChip({ role }: { role: Role }) {
  return <span className={`chip chip-${role}`}>{roleLabel[role]}</span>
}

export function StatusChip({ tone, children, dot = true }: { tone: "good" | "warn" | "bad" | "neutral" | "dark" | "accent"; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`chip chip-${tone}`}>
      {dot && <span className="dot" aria-hidden="true" />}
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Page header — one pattern for every page                            */
/* ------------------------------------------------------------------ */

export function PageHeader({
  slug,
  title,
  sub,
  actions,
  backTo,
  backLabel,
}: {
  slug?: string
  title: string
  sub?: ReactNode
  actions?: ReactNode
  backTo?: string
  backLabel?: string
}) {
  const brand = useAsync(() => (slug ? api.getBrand(slug) : Promise.resolve(null)), [slug])
  const name = brand.data?.name
  const back = backTo ?? (slug ? `/dashboard/${slug}` : "/dashboard")
  const label = backLabel ?? (slug ? name ?? "Overview" : "My Brands")

  return (
    <>
      <Link className={`back-link${backTo ? " always" : ""}`} to={back}>
        <span className="ico"><Icon name="back" size={16} /></span>
        <span>{label}</span>
      </Link>
      {slug && !backTo && (
        <Link className="context-pill" to={`/dashboard/${slug}`} aria-label={name ? `${name} overview` : "Brand overview"}>
          <span className="mini" aria-hidden="true">{name ? initials(name) : "··"}</span>
          {name ? <span className="t">{name}</span> : <Skeleton h={10} w={110} />}
        </Link>
      )}
      <div className="page-head">
        <div className="ph-text">
          <h1>{title}</h1>
          {sub && <p className="sub">{sub}</p>}
        </div>
        {actions && <div className="ph-actions">{actions}</div>}
      </div>
    </>
  )
}

export function SectionHead({ title, hint, actions }: { title: string; hint?: string; actions?: ReactNode }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {hint && <span className="hint">{hint}</span>}
      {actions && <div className="sh-actions">{actions}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Segmented control — tabs and filters                                */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string; count?: number }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="seg" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} role="tab" type="button" aria-selected={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
          {o.count != null && <span className="n">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Search field                                                        */
/* ------------------------------------------------------------------ */

export function SearchField({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder?: string; label: string }) {
  return (
    <div className="search">
      <span className="search-ico" aria-hidden="true"><Icon name="search" size={17} /></span>
      <input className="input" type="search" value={value} placeholder={placeholder} aria-label={label} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button type="button" className="iconbtn sm clear" aria-label="Clear search" onClick={() => onChange("")}>
          <Icon name="close" size={15} />
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dropdown menu                                                       */
/* ------------------------------------------------------------------ */

export interface MenuItem {
  label: string
  icon?: IconName
  danger?: boolean
  /** Renders a divider above this item. */
  sep?: boolean
  /** Optional leading node (e.g. a small avatar) instead of an icon. */
  lead?: ReactNode
  meta?: ReactNode
  onSelect: () => void
}

export function Menu({
  items,
  label = "More actions",
  up,
  trigger,
  header,
  align = "end",
}: {
  items: MenuItem[]
  label?: string
  up?: boolean
  /** Custom trigger content; defaults to a "more" icon button. */
  trigger?: ReactNode
  header?: ReactNode
  align?: "start" | "end"
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div className="menu-wrap" ref={ref}>
      {trigger ? (
        <button type="button" className="menu-trigger" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {trigger}
        </button>
      ) : (
        <button type="button" className="iconbtn" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name="more" size={18} />
        </button>
      )}
      {open && (
        <div className={`menu${up ? " up" : ""}${align === "start" ? " start" : ""}`} role="menu">
          {header && <div className="menu-head">{header}</div>}
          {items.map((it) => (
            <div key={it.label} style={{ display: "contents" }}>
              {it.sep && <div className="menu-sep" role="separator" />}
              <button type="button" role="menuitem" className={it.danger ? "danger" : ""} onClick={() => { setOpen(false); it.onSelect() }}>
                {it.lead ? <span className="mi lead">{it.lead}</span> : it.icon ? <span className="mi"><Icon name={it.icon} size={16} /></span> : null}
                <span className="ml">{it.label}</span>
                {it.meta && <span className="mm">{it.meta}</span>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal — centred dialog on desktop, bottom sheet on phones           */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  icon,
  danger,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  icon?: IconName
  danger?: boolean
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const titleId = useId()
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    document.body.classList.add("modal-open")
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    const first = boxRef.current?.querySelector<HTMLElement>("input,select,textarea,button:not([aria-label='Close'])")
    first?.focus()
    return () => {
      document.body.classList.remove("modal-open")
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={boxRef}>
        <div className="modal-head">
          {icon && <span className={`modal-icon${danger ? " danger" : ""}`} aria-hidden="true"><Icon name={icon} size={18} /></span>}
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="iconbtn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

export function Pagination({ page, pageSize, total, onChange, noun = "items" }: { page: number; pageSize: number; total: number; onChange: (p: number) => void; noun?: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pg-info">Showing {from}–{to} of {total} {noun}</span>
      <div className="pg-nav">
        <button type="button" className="iconbtn sm" aria-label="Previous page" disabled={page === 1} onClick={() => onChange(page - 1)}><Icon name="chevron-left" size={16} /></button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button key={p} type="button" className="pg-num" aria-current={p === page ? "page" : undefined} onClick={() => onChange(p)}>{p}</button>
        ))}
        <button type="button" className="iconbtn sm" aria-label="Next page" disabled={page === pages} onClick={() => onChange(page + 1)}><Icon name="chevron-right" size={16} /></button>
      </div>
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label>
      <span className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <i />
      </span>
      {label}
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Demo panel — lets reviewers exercise loading & error states         */
/* ------------------------------------------------------------------ */

export function DemoPanel({ slug, onSwitchBrand }: { slug: string | null; onSwitchBrand: (slug: string) => void }) {
  const [open, setOpen] = useState(false)
  const [, force] = useState(0)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      {open && (
        <div className="demo-panel">
          <h3>Review controls</h3>
          <p>Prototype-only switches to preview how the dashboard handles a bad connection.</p>
          <Switch checked={demo.slow} onChange={(v) => { demo.slow = v; force((x) => x + 1) }} label="Slow network" />
          <Switch checked={demo.failing} onChange={(v) => { demo.failing = v; force((x) => x + 1) }} label="API failures" />
          <label className="stack">
            Brand
            <select className="input sm" value={slug ?? ""} onChange={(e) => onSwitchBrand(e.target.value)}>
              <option value="">My Brands</option>
              <option value="acme-fashion-group">Acme Fashion Group · owner · trial</option>
              <option value="lagos-bites">Lagos Bites · admin · Starter plan</option>
              <option value="ada-interiors-and-home-styling">Ada Interiors · long name · trial</option>
              <option value="missing-brand">Unknown brand · error state</option>
            </select>
          </label>
        </div>
      )}
      <button className="demo-fab" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Icon name={open ? "close" : "sparkle"} size={15} />
        {open ? "Close" : "Demo"}
      </button>
    </>
  )
}
