import { useEffect, useState, type ReactNode } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { api } from "./mock"
import { DemoPanel, Icon, initials, useAsync, type IconName } from "./ui"

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
            <span className="sec-avatar" title={name ?? "This brand"} aria-hidden="true">{name ? initials(name) : "··"}</span>
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

function Account() {
  return (
    <div className="sidebar-account" title="Uliana Bilenkiy · ulianabilenkiy@gmail.com">
      <div className="avatar" aria-hidden="true">UB</div>
      <div className="acct-text">
        <div className="n">Uliana Bilenkiy</div>
        <div className="e">ulianabilenkiy@gmail.com</div>
      </div>
    </div>
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
    window.scrollTo(0, 0)
    setDrawerOpen(false)
  }, [location.pathname])

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
              <div className="sidebar-foot"><Account /></div>
            </div>
          </>
        )}

        {children}
      </div>

      <DemoPanel slug={slug} onSwitchBrand={(s) => navigate(s ? `/dashboard/${s}` : "/dashboard")} />
    </div>
  )
}
