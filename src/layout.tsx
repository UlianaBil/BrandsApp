import { useEffect, useState, type ReactNode } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { api } from "./mock"
import { DemoPanel, Icon, initials, Menu, Modal, useAsync, useToast, type IconName } from "./ui"

function BrandMark() {
  return (
    <Link to="/dashboard" className="brandmark" aria-label="BrandsApp — My Brands">
      <img src="/brandsapp-logo.svg" alt="" />
      <span>BrandsApp</span>
    </Link>
  )
}

function NavItem({ to, icon, label, end, onClick }: { to: string; icon: IconName; label: string; end?: boolean; onClick?: () => void }) {
  return (
    <NavLink to={to} end={end} onClick={onClick} data-label={label} className={({ isActive }) => `navlink${isActive ? " active" : ""}`}>
      <span className="ico"><Icon name={icon} size={19} /></span>
      <span className="lbl">{label}</span>
    </NavLink>
  )
}

/** Reads the active brand slug from the URL (the shell sits outside the routes). */
export function useActiveSlug(): string | null {
  const { pathname } = useLocation()
  const match = pathname.match(/^\/dashboard\/([^/]+)/)
  return match && match[1] !== "create" ? match[1] : null
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const slug = useActiveSlug()
  // The section header names the brand you're inside; collapsed it becomes an initials tile.
  const brand = useAsync(() => (slug ? api.getBrand(slug) : Promise.resolve(null)), [slug])
  const name = brand.data?.name

  return (
    <nav className="sidebar-nav" aria-label="Dashboard">
      <NavItem to="/dashboard" icon="grid" label="My Brands" end onClick={onNavigate} />
      {slug && (
        <>
          <div className="nav-section">
            <span className="sec-label">{name ?? "This brand"}</span>
          </div>
          <NavItem to={`/dashboard/${slug}`} icon="layout" label="Overview" end onClick={onNavigate} />
          <NavItem to={`/dashboard/${slug}/billing`} icon="card" label="Billing" onClick={onNavigate} />
          <NavItem to={`/dashboard/${slug}/finances`} icon="wallet" label="Finances" onClick={onNavigate} />
          <NavItem to={`/dashboard/${slug}/team`} icon="team" label="Team" onClick={onNavigate} />
          <NavItem to={`/dashboard/${slug}/marketplace`} icon="store" label="Marketplace" onClick={onNavigate} />
          <NavItem to={`/dashboard/${slug}/settings`} icon="gear" label="Settings" onClick={onNavigate} />
        </>
      )}
    </nav>
  )
}

/**
 * Account menu: the avatar opens a menu with New brand, Account settings and Sign out
 * (confirmed in a modal). Production also lists brands here; ours doesn't — the
 * sidebar already shows them (owner decision, 2026-09-05).
 */
function Account({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const account = useAsync(() => api.getAccount(), [])
  const [signOut, setSignOut] = useState(false)
  const name = account.data?.name ?? "Your account"
  const email = account.data?.email ?? ""
  const go = (to: string) => {
    onNavigate?.()
    navigate(to)
  }

  return (
    <>
      <Menu
        up
        label="Account menu"
        trigger={
          <div className="sidebar-account as-trigger" title={`${name} · ${email}`}>
            <div className="avatar" aria-hidden="true">{account.data ? initials(name) : "··"}</div>
            <div className="acct-text">
              <div className="n">{name}</div>
              <div className="e">{email}</div>
            </div>
            <span className="caret" aria-hidden="true"><Icon name="chevron-up-down" size={16} /></span>
          </div>
        }
        items={[
          { label: "New brand", icon: "plus", onSelect: () => go("/dashboard/create") },
          { label: "Account settings", icon: "user", sep: true, onSelect: () => go("/settings") },
          { label: "Sign out", icon: "logout", onSelect: () => setSignOut(true) },
        ]}
      />
      <Modal
        open={signOut}
        onClose={() => setSignOut(false)}
        title="Sign out of BrandsApp?"
        icon="logout"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setSignOut(false)}>Stay signed in</button>
            <button className="btn btn-primary" onClick={() => { setSignOut(false); toast("Sign-out isn't wired up in this prototype") }}>Sign out</button>
          </>
        }
      >
        <p>You'll need to sign in again to manage your brands.</p>
      </Modal>
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

export function Shell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const location = useLocation()
  const navigate = useNavigate()
  const slug = useActiveSlug()

  // Always open a new page at the top (the live product sometimes kept the
  // previous scroll position and landed users on a footer).
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0)
    setDrawerOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    document.body.classList.toggle("collapsed", collapsed)
    try {
      localStorage.setItem("nav.collapsed", collapsed ? "1" : "0")
    } catch {
      /* private mode */
    }
  }, [collapsed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-head"><BrandMark /></div>
        <NavContent />
        <div className="sidebar-foot">
          <button
            className="collapse-btn"
            type="button"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((c) => !c)}
          >
            <span className="ico"><Icon name="chevrons-left" size={16} /></span>
            <span className="lbl">{collapsed ? "Expand" : "Collapse"}</span>
          </button>
          <Account />
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="iconbtn" aria-label="Open navigation" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
            <Icon name="menu" size={22} />
          </button>
          <Link to="/dashboard" className="topbar-mark" aria-label="BrandsApp — My Brands">
            <img src="/brandsapp-logo.svg" alt="" />
            <span>BrandsApp</span>
          </Link>
        </header>

        {drawerOpen && (
          <>
            <div className="drawer-scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
            <div className="drawer" role="dialog" aria-label="Navigation">
              <div className="sidebar-head">
                <BrandMark />
                <button className="iconbtn" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}>
                  <Icon name="close" size={20} />
                </button>
              </div>
              <NavContent onNavigate={() => setDrawerOpen(false)} />
              <div className="sidebar-foot"><Account onNavigate={() => setDrawerOpen(false)} /></div>
            </div>
          </>
        )}

        {children}
      </div>

      <DemoPanel slug={slug} onSwitchBrand={(s) => navigate(s ? `/dashboard/${s}` : "/dashboard")} />
    </div>
  )
}
