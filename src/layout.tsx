import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { api } from "./mock"
import { DemoPanel, Icon, useAsync, type IconName } from "./ui"
import { Avatar, RoleChip } from "@/ui/primitives"
import { Modal, Skeleton, toast } from "@/ui/controls"
import { cn } from "@/ui/cn"

function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      to="/dashboard"
      aria-label="BrandsApp — My Brands"
      className="flex min-w-0 items-center gap-2.5 rounded-xl p-1 text-[1.02rem] font-bold tracking-[-0.02em] text-[var(--ba-ink)]"
    >
      <img src="/brandsapp-logo.svg" alt="" className="size-9 shrink-0 rounded-[11px]" />
      {!collapsed && <span className="whitespace-nowrap">BrandsApp</span>}
    </Link>
  )
}

function NavItem({
  to,
  icon,
  label,
  end,
  collapsed,
}: {
  to: string
  icon: IconName
  label: string
  end?: boolean
  collapsed: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "group relative flex h-11 items-center gap-3 rounded-full px-3 text-[0.92rem] font-medium whitespace-nowrap transition-colors",
          collapsed && "mx-auto w-11 justify-center px-0",
          isActive
            ? "bg-[var(--ba-dark)] text-white"
            : "text-[var(--ba-body)] hover:bg-[var(--ba-soft)] hover:text-[var(--ba-ink)]",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full",
              !collapsed && "-ml-2",
              isActive ? "text-white" : "text-[var(--ba-muted)] group-hover:text-[var(--ba-ink)]",
            )}
          >
            <Icon name={icon} size={19} />
          </span>
          {!collapsed && <span className="truncate">{label}</span>}
          {/* Rail (§3.1): labels become tooltips when the sidebar collapses to 80px. */}
          {collapsed && (
            <span
              role="tooltip"
              className="pointer-events-none absolute left-full top-1/2 z-10 ml-2.5 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[var(--ba-dark)] px-2.5 py-1.5 text-[0.78rem] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

/** Reads the active brand slug from the URL (the shell sits outside the routes). */
export function useActiveSlug(): string | null {
  const { pathname } = useLocation()
  const match = pathname.match(/^\/dashboard\/([^/]+)/)
  return match && match[1] !== "create" ? match[1] : null
}

function NavContent({ slug, brandName, collapsed }: { slug: string | null; brandName?: string; collapsed: boolean }) {
  return (
    <nav
      aria-label="Dashboard"
      className={cn("flex flex-1 flex-col gap-1 px-3 py-1.5", collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden")}
    >
      <NavItem to="/dashboard" icon="grid" label="My Brands" end collapsed={collapsed} />
      {slug && (
        <>
          {/* Collapsed: the brand section becomes a hairline divider (§3.1). */}
          <div
            className={cn(
              "flex items-center gap-2 truncate px-3 pt-4 pb-1.5 text-[0.68rem] font-semibold tracking-[0.1em] text-[var(--ba-muted)] uppercase",
              collapsed && "my-2.5 mx-3.5 h-0 overflow-hidden border-t border-[var(--ba-line)] p-0",
            )}
          >
            {!collapsed && <span className="truncate">{brandName ?? "This brand"}</span>}
          </div>
          <NavItem to={`/dashboard/${slug}`} icon="layout" label="Overview" end collapsed={collapsed} />
          <NavItem to={`/dashboard/${slug}/billing`} icon="card" label="Billing" collapsed={collapsed} />
          <NavItem to={`/dashboard/${slug}/finances`} icon="wallet" label="Finances" collapsed={collapsed} />
          <NavItem to={`/dashboard/${slug}/team`} icon="team" label="Team" collapsed={collapsed} />
          <NavItem to={`/dashboard/${slug}/marketplace`} icon="store" label="Marketplace" collapsed={collapsed} />
          <NavItem to={`/dashboard/${slug}/settings`} icon="gear" label="Settings" collapsed={collapsed} />
        </>
      )}
    </nav>
  )
}

function SignOutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sign out of BrandsApp?"
      body="You'll need to sign in again to manage your brands."
      confirmLabel="Sign out"
      cancelLabel="Stay signed in"
      onConfirm={() => {
        onClose()
        toast("Sign-out isn't wired up in this prototype")
      }}
    />
  )
}

/** One row inside the brand switcher — shared by the desktop menu and the phone sheet. */
function BrandRow({ name, role, onSelect, size = 24 }: { name: string; role: "owner" | "admin"; onSelect: () => void; size?: number }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left text-[0.9rem] font-medium text-[var(--ba-ink)] transition-colors hover:bg-[var(--ba-soft)]"
    >
      <Avatar kind="brand" size={size} name={name} />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <RoleChip role={role} />
    </button>
  )
}

function MenuAction({ icon, label, onSelect }: { icon: IconName; label: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left text-[0.9rem] font-medium text-[var(--ba-ink)] transition-colors hover:bg-[var(--ba-soft)]"
    >
      <span className="grid size-[18px] shrink-0 place-items-center text-[var(--ba-muted)]">
        <Icon name={icon} size={16} />
      </span>
      {label}
    </button>
  )
}

/**
 * Desktop account menu (§3.1): the avatar opens a menu with a brand switcher
 * (each brand by name), New brand, Account settings and Sign out. No "All
 * brands" entry — the sidebar's My Brands already is that (owner decision).
 *
 * `RowMenu` (controls.tsx) only renders a bare "more" trigger with flat
 * label/onSelect items, so it can't carry this menu's custom trigger, header
 * or per-row avatar + role chip — this is hand-rolled the same way RowMenu is
 * (open state, click-outside, Escape) rather than bending that primitive.
 */
function Account({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate()
  const account = useAsync(() => api.getAccount(), [])
  const brands = useAsync(() => api.listBrands(), [])
  const [open, setOpen] = useState(false)
  const [signOut, setSignOut] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const name = account.data?.name ?? "Your account"
  const email = account.data?.email ?? ""

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

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  return (
    <div className="relative mt-1.5" ref={ref}>
      <button
        type="button"
        title={`${name} · ${email}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full min-w-0 items-center gap-2.5 rounded-2xl p-1.5 text-left transition-colors hover:bg-[var(--ba-soft)]",
          collapsed && "justify-center",
        )}
      >
        {account.loading ? <Skeleton className="size-9 rounded-full" /> : <Avatar kind="person" size={36} name={name} />}
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.88rem] font-semibold">{name}</div>
              <div className="truncate text-[0.78rem] text-[var(--ba-muted)]">{email}</div>
            </div>
            <span className="shrink-0 text-[var(--ba-muted)]" aria-hidden="true">
              <Icon name="chevron-up-down" size={16} />
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className={cn(
            "absolute z-20 w-64 overflow-hidden rounded-[var(--ba-r-field)] border border-[var(--ba-line)] bg-[var(--ba-paper)] py-1.5 shadow-[var(--ba-shadow-pop)]",
            // Rail: the menu opens beside the avatar rather than above it (§3.1).
            collapsed ? "bottom-0 left-full ml-2" : "bottom-full left-0 mb-1.5",
          )}
        >
          <div className="px-3.5 pt-1.5 pb-1 text-[0.68rem] font-semibold tracking-[0.08em] text-[var(--ba-muted)] uppercase">Brands</div>
          {(brands.data ?? []).map((b) => (
            <BrandRow key={b.slug} name={b.name} role={b.role} onSelect={() => go(`/dashboard/${b.slug}`)} />
          ))}
          <MenuAction icon="plus" label="New brand" onSelect={() => go("/dashboard/create")} />
          <span className="my-1 block h-px bg-[var(--ba-line)]" />
          <MenuAction icon="user" label="Account settings" onSelect={() => go("/settings")} />
          <MenuAction
            icon="logout"
            label="Sign out"
            onSelect={() => {
              setOpen(false)
              setSignOut(true)
            }}
          />
        </div>
      )}

      <SignOutModal open={signOut} onClose={() => setSignOut(false)} />
    </div>
  )
}

/**
 * Phone account sheet — opened from the avatar that sits top-right on every phone
 * screen (a fixed anchor, like Revolut or Notion). Brand switcher, New brand,
 * Account settings, Sign out. Brand pages have their own tabs.
 */
function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const account = useAsync(() => api.getAccount(), [])
  const brands = useAsync(() => api.listBrands(), [])
  const [signOut, setSignOut] = useState(false)
  const go = (to: string) => {
    onClose()
    navigate(to)
  }
  return (
    <>
      <Modal open={open} onClose={onClose} title={account.data?.name ?? "You"} body={account.data?.email}>
        <div className="-mx-1.5 mt-2 flex flex-col">
          <div className="px-3.5 pt-1.5 pb-1 text-[0.68rem] font-semibold tracking-[0.08em] text-[var(--ba-muted)] uppercase">Brands</div>
          {(brands.data ?? []).map((b) => (
            <BrandRow key={b.slug} name={b.name} role={b.role} size={30} onSelect={() => go(`/dashboard/${b.slug}`)} />
          ))}
          <MenuAction icon="plus" label="New brand" onSelect={() => go("/dashboard/create")} />
          <span className="my-1.5 block h-px bg-[var(--ba-line)]" />
          <MenuAction icon="user" label="Account settings" onSelect={() => go("/settings")} />
          <MenuAction
            icon="logout"
            label="Sign out"
            onSelect={() => {
              onClose()
              setSignOut(true)
            }}
          />
        </div>
      </Modal>
      <SignOutModal open={signOut} onClose={() => setSignOut(false)} />
    </>
  )
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem("nav.collapsed") === "1"
  } catch {
    return false
  }
}

/** One phone tab (§3.1: Overview, Billing, Finances, Team, Settings — fixed at five). */
function TabItem({ to, icon, label, end }: { to: string; icon: IconName; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex min-h-[50px] flex-1 flex-col items-center justify-center gap-[3px] rounded-xl py-1 text-[0.66rem] font-semibold tracking-[0.01em] transition-colors",
          isActive ? "text-[var(--ba-ink)]" : "text-[var(--ba-muted)]",
        )
      }
    >
      <span className="grid size-7 place-items-center">
        <Icon name={icon} size={22} />
      </span>
      {label}
    </NavLink>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [sheet, setSheet] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const slug = useActiveSlug()
  const brand = useAsync(() => (slug ? api.getBrand(slug) : Promise.resolve(null)), [slug])
  const account = useAsync(() => api.getAccount(), [])

  // Always open a new page at the top (the live product sometimes kept the
  // previous scroll position and landed users on a footer). Hash links scroll themselves.
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0)
    setSheet(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    try {
      localStorage.setItem("nav.collapsed", collapsed ? "1" : "0")
    } catch {
      /* private mode */
    }
  }, [collapsed])

  // Other, not-yet-converted pages still read this body class off `styles.css`
  // for their own bottom padding and back-link visibility — keep setting it
  // even though this file's own markup no longer depends on it.
  useEffect(() => {
    document.body.classList.toggle("has-tabbar", !!slug)
  }, [slug])

  const you = account.data?.name ?? "You"

  return (
    <div className="ba2 flex min-h-dvh">
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[var(--ba-line)] bg-[var(--ba-paper)] transition-[width] duration-300 [transition-timing-function:var(--ba-ease)] min-[900px]:flex",
          // overflow-VISIBLE in both states. The account menu is absolutely
          // positioned inside this element, so `overflow-hidden` clipped it —
          // the brand rows in it lost their role chips to the sidebar's edge.
          // The nav itself does its own scrolling, so nothing here needs to clip.
          collapsed
            ? "w-[var(--ba-rail)] overflow-visible"
            : "w-[var(--ba-sidebar)] overflow-visible",
        )}
      >
        <div className="flex min-h-[68px] items-center gap-2.5 px-4 pt-[18px] pb-3.5">
          <BrandMark collapsed={collapsed} />
        </div>
        <NavContent slug={slug} brandName={brand.data?.name} collapsed={collapsed} />
        <div className="border-t border-[var(--ba-line)] p-3">
          <button
            type="button"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-full px-1 text-[0.85rem] font-medium text-[var(--ba-muted)] transition-colors hover:text-[var(--ba-ink)]",
              collapsed && "justify-center",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-ink)] transition-transform duration-300 [transition-timing-function:var(--ba-ease)]",
                collapsed && "rotate-180",
              )}
            >
              <Icon name="chevrons-left" size={16} />
            </span>
            {!collapsed && <span className="whitespace-nowrap">Collapse</span>}
          </button>
          <Account collapsed={collapsed} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Phone top bar: back + brand name inside a brand, wordmark elsewhere; the avatar is always top-right. */}
        <header className="sticky top-0 z-30 flex h-[60px] items-center gap-2 border-b border-[var(--ba-line)] bg-[var(--ba-ground)]/85 px-3 backdrop-blur-md min-[900px]:hidden">
          {slug ? (
            <>
              <Link
                to="/dashboard"
                aria-label="Back to My Brands"
                className="grid size-10 shrink-0 place-items-center rounded-full text-[var(--ba-ink)] transition-colors hover:bg-[var(--ba-soft)]"
              >
                <Icon name="chevron-left" size={22} />
              </Link>
              <span className="min-w-0 flex-1 truncate pl-0.5 text-[1rem] font-semibold tracking-[-0.015em]" aria-live="polite">
                {brand.data?.name ?? ""}
              </span>
            </>
          ) : (
            <Link to="/dashboard" aria-label="BrandsApp — My Brands" className="flex items-center gap-2.5 font-bold tracking-[-0.02em] text-[var(--ba-ink)]">
              <img src="/brandsapp-logo.svg" alt="" className="size-[30px] rounded-[9px]" />
              <span>BrandsApp</span>
            </Link>
          )}
          <button
            type="button"
            aria-label="Account"
            aria-haspopup="dialog"
            aria-expanded={sheet}
            onClick={() => setSheet(true)}
            className="ml-auto grid size-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-[var(--ba-soft)]"
          >
            {account.loading ? <Skeleton className="size-7 rounded-full" /> : <Avatar kind="person" size={28} name={you} />}
          </button>
        </header>

        {children}

        {slug && (
          <nav
            aria-label="Brand sections"
            className="fixed inset-x-0 bottom-0 z-[35] hidden gap-1 border-t border-[var(--ba-line)] bg-[var(--ba-paper)]/92 px-2 pt-1.5 backdrop-blur-md max-[899px]:flex"
            style={{ paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <TabItem to={`/dashboard/${slug}`} end icon="layout" label="Overview" />
            <TabItem to={`/dashboard/${slug}/billing`} icon="card" label="Billing" />
            <TabItem to={`/dashboard/${slug}/finances`} icon="wallet" label="Finances" />
            <TabItem to={`/dashboard/${slug}/team`} icon="team" label="Team" />
            <TabItem to={`/dashboard/${slug}/settings`} icon="gear" label="Settings" />
          </nav>
        )}
      </div>

      <AccountSheet open={sheet} onClose={() => setSheet(false)} />
      <DemoPanel slug={slug} onSwitchBrand={(s) => navigate(s ? `/dashboard/${s}` : "/dashboard")} />
    </div>
  )
}
