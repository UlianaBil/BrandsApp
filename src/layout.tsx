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

function NavItem({ to, icon, label, end }: { to: string; icon: IconName; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} data-label={label} className={({ isActive }) => `navlink${isActive ? " active" : ""}`}>
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

function NavContent({ slug, brandName }: { slug: string | null; brandName?: string }) {
  return (
    <nav className="sidebar-nav" aria-label="Dashboard">
      <NavItem to="/dashboard" icon="grid" label="My Brands" end />
      {slug && (
        <>
          <div className="nav-section">
            <span className="sec-label">{brandName ?? "This brand"}</span>
          </div>
          <NavItem to={`/dashboard/${slug}`} icon="layout" label="Overview" end />
          <NavItem to={`/dashboard/${slug}/billing`} icon="card" label="Billing" />
          <NavItem to={`/dashboard/${slug}/finances`} icon="wallet" label="Finances" />
          <NavItem to={`/dashboard/${slug}/team`} icon="team" label="Team" />
          <NavItem to={`/dashboard/${slug}/marketplace`} icon="store" label="Marketplace" />
          <NavItem to={`/dashboard/${slug}/settings`} icon="gear" label="Settings" />
        </>
      )}
    </nav>
  )
}

function SignOutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sign out of BrandsApp?"
      icon="logout"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Stay signed in</button>
          <button className="btn btn-primary" onClick={() => { onClose(); toast("Sign-out isn't wired up in this prototype") }}>Sign out</button>
        </>
      }
    >
      <p>You'll need to sign in again to manage your brands.</p>
    </Modal>
  )
}

/**
 * Desktop account menu (production parity): the avatar opens a menu with a brand
 * switcher (each brand by name), New brand, Account settings and Sign out. No
 * "All brands" entry — the sidebar's My Brands already is that (owner decision).
 */
function Account() {
  const navigate = useNavigate()
  const account = useAsync(() => api.getAccount(), [])
  const brands = useAsync(() => api.listBrands(), [])
  const [signOut, setSignOut] = useState(false)
  const name = account.data?.name ?? "Your account"
  const email = account.data?.email ?? ""
  const brandItems = (brands.data ?? []).map((b) => ({
    label: b.name,
    lead: <span className="mini-avatar" aria-hidden="true">{initials(b.name)}</span>,
    meta: <span className={`chip chip-${b.role}`} style={{ fontSize: ".66rem", padding: "2px 8px" }}>{b.role === "owner" ? "Owner" : "Admin"}</span>,
    onSelect: () => navigate(`/dashboard/${b.slug}`),
  }))

  return (
    <>
      <Menu
        up
        label="Account menu"
        header="Brands"
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
          ...brandItems,
          { label: "New brand", icon: "plus", onSelect: () => navigate("/dashboard/create") },
          { label: "Account settings", icon: "user", sep: true, onSelect: () => navigate("/settings") },
          { label: "Sign out", icon: "logout", onSelect: () => setSignOut(true) },
        ]}
      />
      <SignOutModal open={signOut} onClose={() => setSignOut(false)} />
    </>
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
      <Modal open={open} onClose={onClose} title={account.data?.name ?? "You"} icon="user">
        {account.data && <p style={{ marginTop: -6, marginBottom: 10 }}>{account.data.email}</p>}
        <div className="sheet-list">
          <div className="sh-label">Brands</div>
          {(brands.data ?? []).map((b) => (
            <button key={b.slug} type="button" onClick={() => go(`/dashboard/${b.slug}`)}>
              <span className="mi brand"><span>{initials(b.name)}</span></span>
              <span className="ml">{b.name}</span>
              <span className={`chip chip-${b.role}`} style={{ fontSize: ".66rem", padding: "2px 8px" }}>{b.role === "owner" ? "Owner" : "Admin"}</span>
            </button>
          ))}
          <button type="button" onClick={() => go("/dashboard/create")}>
            <span className="mi"><Icon name="plus" size={17} /></span>New brand
          </button>
          <div className="sep" role="separator" />
          <button type="button" onClick={() => go("/settings")}>
            <span className="mi"><Icon name="user" size={17} /></span>Account settings
          </button>
          <button type="button" onClick={() => { onClose(); setSignOut(true) }}>
            <span className="mi"><Icon name="logout" size={17} /></span>Sign out
          </button>
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
    document.body.classList.toggle("collapsed", collapsed)
    try {
      localStorage.setItem("nav.collapsed", collapsed ? "1" : "0")
    } catch {
      /* private mode */
    }
  }, [collapsed])

  // Phones get the bottom tab bar only inside a brand.
  useEffect(() => {
    document.body.classList.toggle("has-tabbar", !!slug)
  }, [slug])

  const you = account.data ? initials(account.data.name) : "··"

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-head"><BrandMark /></div>
        <NavContent slug={slug} brandName={brand.data?.name} />
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
        {/* Phone top bar: back + brand name inside a brand, wordmark elsewhere; the avatar is always top-right. */}
        <header className="topbar">
          {slug ? (
            <>
              <Link to="/dashboard" className="iconbtn" aria-label="Back to My Brands"><Icon name="chevron-left" size={22} /></Link>
              <span className="tb-title" aria-live="polite">{brand.data?.name ?? ""}</span>
            </>
          ) : (
            <Link to="/dashboard" className="topbar-mark" aria-label="BrandsApp — My Brands">
              <img src="/brandsapp-logo.svg" alt="" />
              <span>BrandsApp</span>
            </Link>
          )}
          <button type="button" className="iconbtn tb-you" aria-label="Account" aria-haspopup="dialog" aria-expanded={sheet} onClick={() => setSheet(true)}>
            <span className="avatar sm" aria-hidden="true">{you}</span>
          </button>
        </header>

        {children}

        {slug && (
          <nav className="tabbar" aria-label="Brand sections">
            <NavLink to={`/dashboard/${slug}`} end className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
              <span className="ti"><Icon name="layout" size={22} /></span>Overview
            </NavLink>
            <NavLink to={`/dashboard/${slug}/billing`} className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
              <span className="ti"><Icon name="card" size={22} /></span>Billing
            </NavLink>
            <NavLink to={`/dashboard/${slug}/finances`} className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
              <span className="ti"><Icon name="wallet" size={22} /></span>Finances
            </NavLink>
            <NavLink to={`/dashboard/${slug}/team`} className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
              <span className="ti"><Icon name="team" size={22} /></span>Team
            </NavLink>
            <NavLink to={`/dashboard/${slug}/settings`} className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
              <span className="ti"><Icon name="gear" size={22} /></span>Settings
            </NavLink>
          </nav>
        )}
      </div>

      <AccountSheet open={sheet} onClose={() => setSheet(false)} />
      <DemoPanel slug={slug} onSwitchBrand={(s) => navigate(s ? `/dashboard/${s}` : "/dashboard")} />
    </div>
  )
}
