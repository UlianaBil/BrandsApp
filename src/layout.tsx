import { useEffect, useState, type ReactNode } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { api } from "./mock"
import { Icon, useAsync, type IconName } from "./ui"

function BrandMark() {
  return (
    <Link to="/dashboard" className="brandmark" aria-label="BrandsApp — My Brands">
      <img src="/brandsapp-logo.svg" alt="" />
      <span>BrandsApp</span>
    </Link>
  )
}

function NavItem({
  to,
  icon,
  label,
  end,
  onClick,
}: {
  to: string
  icon: IconName
  label: string
  end?: boolean
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => `navlink${isActive ? " active" : ""}`}
    >
      <Icon name={icon} size={19} />
      {label}
    </NavLink>
  )
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  // The shell lives outside the routed elements, so read the active brand
  // from the URL rather than useParams().
  const { pathname } = useLocation()
  const match = pathname.match(/^\/dashboard\/([^/]+)/)
  const slug = match && match[1] !== "create" ? match[1] : null

  // The section header names the brand you're inside — it replaces
  // desktop breadcrumbs as the identity signal.
  const brand = useAsync(
    () => (slug ? api.getBrand(slug) : Promise.resolve(null)),
    [slug],
  )

  return (
    <nav className="sidebar-nav" aria-label="Dashboard">
      <NavItem to="/dashboard" icon="grid" label="My Brands" end onClick={onNavigate} />
      {slug && (
        <>
          <div className="nav-section">{brand.data?.name ?? "This brand"}</div>
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

function AccountFooter() {
  return (
    <div className="sidebar-footer">
      <div className="avatar" aria-hidden="true">
        UB
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Uliana Bilenkiy</div>
        <div style={{ fontSize: "0.8rem", color: "var(--muted)", overflowWrap: "anywhere" }}>
          ulianabilenkiy@gmail.com
        </div>
      </div>
    </div>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  // Always open a new page at the top (live product sometimes kept the
  // previous scroll position and landed users on a footer).
  useEffect(() => {
    window.scrollTo(0, 0)
    setDrawerOpen(false)
  }, [location.pathname])

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
        <div className="sidebar-head">
          <BrandMark />
        </div>
        <NavContent />
        <AccountFooter />
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            className="iconbtn"
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Icon name="menu" size={22} />
          </button>
          <Link to="/dashboard" className="topbar-mark" aria-label="BrandsApp — My Brands">
            <img src="/brandsapp-logo.svg" alt="" />
          </Link>
        </header>

        {drawerOpen && (
          <>
            <div className="drawer-scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
            <div className="drawer" role="dialog" aria-label="Navigation">
              <div className="sidebar-head" style={{ justifyContent: "space-between", display: "flex" }}>
                <BrandMark />
                <button className="iconbtn" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}>
                  <Icon name="close" size={20} />
                </button>
              </div>
              <NavContent onNavigate={() => setDrawerOpen(false)} />
              <AccountFooter />
            </div>
          </>
        )}

        {children}
      </div>
    </div>
  )
}

/**
 * Brand page header: breadcrumb back to My Brands, the brand's display
 * name (never the raw slug — the slug only ever appears as part of the
 * domain), and the domain on a line that wraps cleanly.
 */
export function BrandHeader({ slug, title }: { slug: string; title?: string }) {
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const name = brand.data?.name

  return (
    <>
      <Link className="back-link" to={title ? `/dashboard/${slug}` : "/dashboard"}>
        <Icon name="back" size={16} />
        <span>{title ? (name ?? "Back") : "My Brands"}</span>
      </Link>
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <h1>{title ?? name ?? " "}</h1>
          {!title && <p className="domain-line">{brand.data?.domain}</p>}
        </div>
      </div>
    </>
  )
}
