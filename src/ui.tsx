import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { demo, roleLabel, type Role } from "./mock"

/* ------------------------------------------------------------------ */
/* Data fetching: every query gets loading / error+retry / data states */
/* ------------------------------------------------------------------ */

interface Async<T> {
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
/* State cards                                                         */
/* ------------------------------------------------------------------ */

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="card state-card state-error" role="alert">
      <div className="state-icon" aria-hidden="true">
        <Icon name="warning" />
      </div>
      <h3>We couldn't load this</h3>
      <p>{message ?? "The server couldn't be reached."} Check your connection and try again.</p>
      <button className="btn btn-secondary btn-sm" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}

export function EmptyState({
  icon = "sparkle",
  title,
  body,
  action,
}: {
  icon?: IconName
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="card state-card state-empty">
      <div className="state-icon" aria-hidden="true">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  )
}

export function Skeleton({ h = 16, w = "100%", style }: { h?: number; w?: string | number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ height: h, width: w, ...style }} aria-hidden="true" />
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card" aria-label="Loading" role="status">
      <Skeleton h={18} w="40%" />
      <div style={{ height: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <Skeleton h={13} w={`${90 - i * 15}%`} />
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

const ToastCtx = createContext<(msg: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([])
  const idRef = useRef(0)

  const push = useCallback((msg: string) => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* ------------------------------------------------------------------ */
/* Role chip                                                           */
/* ------------------------------------------------------------------ */

export function RoleChip({ role }: { role: Role }) {
  return <span className={`chip chip-${role}`}>{roleLabel[role]}</span>
}

/* ------------------------------------------------------------------ */
/* Icons (inline, stroke = currentColor)                               */
/* ------------------------------------------------------------------ */

export type IconName =
  | "grid"
  | "card"
  | "wallet"
  | "team"
  | "store"
  | "gear"
  | "globe"
  | "plus"
  | "arrow-right"
  | "external"
  | "copy"
  | "warning"
  | "sparkle"
  | "menu"
  | "close"
  | "back"
  | "check"
  | "layout"

const paths: Record<IconName, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19" />
    </>
  ),
  wallet: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M16 12h3.5" />
      <path d="M2.5 8.5h14" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M2.8 19.2c.8-3 3.2-4.7 6.2-4.7s5.4 1.7 6.2 4.7" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M16.2 14.6c2.5.2 4.3 1.7 5 4.1" />
    </>
  ),
  store: (
    <>
      <path d="M4 9.5 5.2 4h13.6L20 9.5" />
      <path d="M4 9.5a2.6 2.6 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.6 2.6 0 0 0 5.3 0" />
      <path d="M5 12v8h14v-8" />
      <path d="M9.5 20v-5h5v5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.6-4-9s1.4-6.5 4-9Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  "arrow-right": <path d="M4 12h16m0 0-6-6m6 6-6 6" />,
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M19 14v5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V6.5A1.5 1.5 0 0 1 5.5 5H10" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 10v4.5" />
      <path d="M12 17.2v.3" />
    </>
  ),
  sparkle: (
    <path d="M12 3.5c.7 3.8 2.6 5.8 6.5 6.5-3.9.7-5.8 2.7-6.5 6.5-.7-3.8-2.6-5.8-6.5-6.5 3.9-.7 5.8-2.7 6.5-6.5ZM18.7 15.5c.3 1.7 1.2 2.6 2.9 2.9-1.7.3-2.6 1.2-2.9 2.9-.3-1.7-1.2-2.6-2.9-2.9 1.7-.3 2.6-1.2 2.9-2.9Z" />
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  back: <path d="M20 12H4m0 0 6-6m-6 6 6 6" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  layout: (
    <>
      <rect x="3" y="3.5" width="18" height="17" rx="2.5" />
      <path d="M3 9h18M9.5 9v11.5" />
    </>
  ),
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Demo panel — lets reviewers exercise loading & error states         */
/* ------------------------------------------------------------------ */

export function DemoPanel() {
  const [open, setOpen] = useState(false)
  const [, force] = useState(0)

  return (
    <>
      {open && (
        <div className="demo-panel">
          <h3>Review controls</h3>
          <p>Prototype-only switches to preview how the dashboard handles a bad connection.</p>
          <label>
            <input
              type="checkbox"
              checked={demo.slow}
              onChange={(e) => {
                demo.slow = e.target.checked
                force((x) => x + 1)
              }}
            />
            Slow network
          </label>
          <label>
            <input
              type="checkbox"
              checked={demo.failing}
              onChange={(e) => {
                demo.failing = e.target.checked
                force((x) => x + 1)
              }}
            />
            API failures
          </label>
        </div>
      )}
      <button className="demo-fab" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? "Close" : "Demo"}
      </button>
    </>
  )
}
