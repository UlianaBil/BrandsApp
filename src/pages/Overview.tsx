import { Link, useParams } from "react-router-dom"
import { api, ngn } from "../mock"
import { CardSkeleton, ErrorState, Icon, initials, Skeleton, useAsync, useToast, type IconName } from "../ui"

function ManageCard({ to, icon, title, body, tone = "" }: { to: string; icon: IconName; title: string; body: string; tone?: string }) {
  return (
    <Link to={to} className="card managecard">
      <div className={`mc-icon ${tone}`} aria-hidden="true">
        <Icon name={icon} size={20} />
      </div>
      <h2>{title}</h2>
      <p className="hint">{body}</p>
    </Link>
  )
}

export default function Overview() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const plan = useAsync(() => api.getPlan(slug), [slug])
  const usage = useAsync(() => api.getUsage(slug), [slug])
  const wallet = useAsync(() => api.getWallet(slug), [slug])

  const copyLink = async () => {
    if (!brand.data) return
    try {
      await navigator.clipboard.writeText(brand.data.liveUrl)
      toast("Link copied")
    } catch {
      toast("Couldn't copy — long-press the link instead")
    }
  }

  if (brand.error) {
    return (
      <main className="page">
        <Link className="back-link always" to="/dashboard">
          <Icon name="back" size={16} />
          <span>My Brands</span>
        </Link>
        <ErrorState message={brand.error} onRetry={brand.retry} />
      </main>
    )
  }

  const isOwnerOrAdmin = brand.data?.role === "owner" || brand.data?.role === "admin"

  return (
    <main className="page">
      <Link className="back-link" to="/dashboard">
        <Icon name="back" size={16} />
        <span>My Brands</span>
      </Link>

      {/* One entity header: identity + status on the left, actions on the right. */}
      <header className="brand-head" aria-label="Your brand">
        {brand.loading ? (
          <div style={{ flex: 1 }}>
            <Skeleton h={26} w="45%" />
            <div style={{ height: 10 }} />
            <Skeleton h={14} w="60%" />
          </div>
        ) : brand.data ? (
          <>
            <div className="brand-avatar lg" aria-hidden="true">
              {initials(brand.data.name)}
            </div>
            <div style={{ minWidth: 0, flex: "1 1 240px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <h1>{brand.data.name}</h1>
                <span className="chip chip-good">
                  <Icon name="check" size={11} />
                  Live
                </span>
              </div>
              <p className="domain-line copy-inline" style={{ marginTop: 4 }}>
                {brand.data.domain}
                <button className="copy-btn" onClick={copyLink} aria-label="Copy link to your live site">
                  <Icon name="copy" size={15} />
                </button>
              </p>
            </div>
            <div className="brand-head-actions">
              <a className="btn btn-primary" href={brand.data.adminUrl} target="_blank" rel="noreferrer">
                Open brand admin
                <Icon name="arrow-right" size={16} />
              </a>
              <a className="btn btn-secondary" href={brand.data.liveUrl} target="_blank" rel="noreferrer">
                View live site
                <Icon name="external" size={15} />
              </a>
            </div>
          </>
        ) : null}
      </header>

      <div className="grid-3" style={{ marginTop: 14 }}>
        {/* Plan */}
        <section className="card stat-card" aria-label="Plan">
          <div className="stat-headrow">
            <span className="stat-ico" aria-hidden="true">
              <Icon name="card" size={16} />
            </span>
            <span className="stat-title">Plan</span>
            {plan.data?.status === "trial" && <span className="chip chip-warn stat-corner">Free trial</span>}
            {plan.data?.status === "active" && <span className="chip chip-good stat-corner">Active</span>}
          </div>
          {plan.loading && <Skeleton h={30} w="55%" style={{ marginTop: 12 }} />}
          {plan.error && (
            <p className="hint" style={{ marginTop: 10 }}>
              Couldn't load your plan.{" "}
              <button className="btn btn-ghost btn-sm" onClick={plan.retry}>
                Try again
              </button>
            </p>
          )}
          {plan.data && plan.data.status === "trial" && (
            <>
              <div className="ov-num">{plan.data.daysLeft} days</div>
              <p className="ov-sub">left in your free trial — pick a plan to keep your brand online.</p>
              <div className="stat-actions">
                <Link to={`/dashboard/${slug}/billing`} className="btn btn-primary btn-sm">
                  Choose a plan
                </Link>
              </div>
            </>
          )}
          {plan.data && plan.data.status === "active" && (
            <>
              <div className="ov-num">{plan.data.priceNgn ? ngn(plan.data.priceNgn) : plan.data.name}</div>
              <p className="ov-sub">
                {plan.data.name} · renews {plan.data.renewsOn}.
              </p>
              <div className="stat-actions">
                <Link to={`/dashboard/${slug}/billing`} className="link-cta">
                  Manage plan
                </Link>
              </div>
            </>
          )}
          {plan.data && plan.data.status === "none" && (
            <>
              <div className="ov-num">No plan</div>
              <p className="ov-sub">Choose one to keep this brand online.</p>
              <div className="stat-actions">
                <Link to={`/dashboard/${slug}/billing`} className="btn btn-primary btn-sm">
                  Choose a plan
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Usage */}
        <section className="card stat-card" aria-label="Usage">
          <div className="stat-headrow">
            <span className="stat-ico" aria-hidden="true">
              <Icon name="globe" size={16} />
            </span>
            <span className="stat-title">Usage</span>
            {usage.data && <span className="stat-corner hint">{usage.data.period}</span>}
          </div>
          {usage.loading && <Skeleton h={30} w="55%" style={{ marginTop: 12 }} />}
          {usage.error && (
            <p className="hint" style={{ marginTop: 10 }}>
              Couldn't load usage.{" "}
              <button className="btn btn-ghost btn-sm" onClick={usage.retry}>
                Try again
              </button>
            </p>
          )}
          {usage.data && (
            <>
              <div className="ov-num">{usage.data.requests.toLocaleString()}</div>
              <p className="ov-sub">
                visits to your site this month · {usage.data.storageMb} MB storage ·{" "}
                {usage.data.emailsSent} emails sent
              </p>
              <div className="stat-actions">
                <Link to={`/dashboard/${slug}/billing`} className="link-cta">
                  Usage &amp; credits
                </Link>
              </div>
            </>
          )}
          {!usage.loading && !usage.error && !usage.data && (
            <p className="ov-sub" style={{ marginTop: 10 }}>
              No usage recorded yet — it appears once your site gets its first visits.
            </p>
          )}
        </section>

        {/* Wallet: one number only — the breakdown lives on Finances. */}
        <section className="card stat-card" aria-label="Wallet">
          <div className="stat-headrow">
            <span className="stat-ico" aria-hidden="true">
              <Icon name="wallet" size={16} />
            </span>
            <span className="stat-title">Wallet balance</span>
          </div>
          {wallet.loading && <Skeleton h={30} w="55%" style={{ marginTop: 12 }} />}
          {wallet.error && (
            <p className="hint" style={{ marginTop: 10 }}>
              Couldn't load your wallet.{" "}
              <button className="btn btn-ghost btn-sm" onClick={wallet.retry}>
                Try again
              </button>
            </p>
          )}
          {wallet.data && (
            <>
              <div className="ov-num">{ngn(wallet.data.balanceNgn)}</div>
              <p className="ov-sub">Earned by your brand — spendable on your plan, credits or apps.</p>
              <div className="stat-actions">
                <Link to={`/dashboard/${slug}/finances`} className="link-cta">
                  View finances
                </Link>
              </div>
            </>
          )}
        </section>
      </div>

      <h2 className="section-label" style={{ margin: "28px 0 12px" }}>Manage this brand</h2>
      {brand.loading ? (
        <CardSkeleton lines={2} />
      ) : (
        <div className="grid-3">
          <ManageCard
            to={`/dashboard/${slug}/billing`}
            icon="card"
            title="Billing"
            body="Your plan, usage credits and app purchases."
          />
          <ManageCard
            to={`/dashboard/${slug}/finances`}
            icon="wallet"
            title="Finances"
            tone="mc-mint"
            body="Money made, money spent, and your wallet."
          />
          <ManageCard
            to={`/dashboard/${slug}/team`}
            icon="team"
            title="Team"
            tone="mc-lav"
            body="Who has access to this brand, and what they can do."
          />
          <ManageCard
            to={`/dashboard/${slug}/marketplace`}
            icon="store"
            title="Marketplace"
            tone="mc-sand"
            body="Page sections built by other creators."
          />
          <ManageCard
            to={`/dashboard/${slug}/settings`}
            icon="gear"
            title="Settings"
            tone="mc-stone"
            body="Brand name, domains and brand-level configuration."
          />
        </div>
      )}

      {brand.data && !isOwnerOrAdmin && (
        <p className="hint" style={{ marginTop: 14, color: "var(--muted)" }}>
          You're a member of this brand — billing, team and settings are read-only for you.
        </p>
      )}
    </main>
  )
}
