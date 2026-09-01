import { Link, useParams } from "react-router-dom"
import { api, ngn } from "../mock"
import { BrandHeader } from "../layout"
import { CardSkeleton, ErrorState, Icon, RoleChip, Skeleton, useAsync, useToast, type IconName } from "../ui"

function ManageCard({ to, icon, title, body }: { to: string; icon: IconName; title: string; body: string }) {
  return (
    <Link to={to} className="card linkcard">
      <div className="lc-icon">
        <Icon name={icon} />
      </div>
      <div>
        <h2>{title}</h2>
        <p className="hint">{body}</p>
      </div>
    </Link>
  )
}

export default function Overview() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const plan = useAsync(() => api.getPlan(slug), [slug])
  const usage = useAsync(() => api.getUsage(slug), [slug])

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
        <div className="crumbs">
          <Link to="/dashboard">My Brands</Link>
        </div>
        <ErrorState message={brand.error} onRetry={brand.retry} />
      </main>
    )
  }

  const isOwnerOrAdmin = brand.data?.role === "owner" || brand.data?.role === "admin"

  return (
    <main className="page">
      <BrandHeader slug={slug} />

      {/* The single most important action: run the business. */}
      <section className="card" aria-label="Your brand">
        {brand.loading ? (
          <>
            <Skeleton h={16} w="55%" />
            <div style={{ height: 10 }} />
            <Skeleton h={38} w="70%" />
          </>
        ) : brand.data ? (
          <>
            <div className="card-row">
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="chip chip-good">
                    <Icon name="check" size={11} />
                    Live
                  </span>
                  <RoleChip role={brand.data.role} />
                </div>
                <p className="domain-line" style={{ marginTop: 8 }}>
                  {brand.data.domain}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <a className="btn btn-primary" href={brand.data.adminUrl} target="_blank" rel="noreferrer">
                Open brand admin
                <Icon name="arrow-right" size={16} />
              </a>
              <a className="btn btn-secondary" href={brand.data.liveUrl} target="_blank" rel="noreferrer">
                View live site
                <Icon name="external" size={15} />
              </a>
              <button className="btn btn-ghost" onClick={copyLink}>
                <Icon name="copy" size={16} />
                Copy link
              </button>
            </div>
            <p className="hint" style={{ marginTop: 10 }}>
              Products, orders, pages and apps are managed in your brand admin.
            </p>
          </>
        ) : null}
      </section>

      <div className="grid-2" style={{ marginTop: 14 }}>
        {/* Plan */}
        <section className="card" aria-label="Plan">
          <h2>Plan</h2>
          {plan.loading && (
            <>
              <div style={{ height: 8 }} />
              <Skeleton h={14} w="70%" />
            </>
          )}
          {plan.error && (
            <p className="hint">
              Couldn't load your plan.{" "}
              <button className="btn btn-ghost btn-sm" onClick={plan.retry}>
                Try again
              </button>
            </p>
          )}
          {plan.data && plan.data.status === "trial" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
                <span className="chip chip-warn">Free trial</span>
                <span className="hint">{plan.data.daysLeft} days left</span>
              </div>
              <p className="hint">Pick a plan before your trial ends to keep your brand online.</p>
              <Link to={`/dashboard/${slug}/billing`} className="btn btn-secondary btn-sm" style={{ marginTop: 10 }}>
                Choose a plan
              </Link>
            </>
          )}
          {plan.data && plan.data.status === "active" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
                <span className="chip chip-good">{plan.data.name}</span>
                <span className="hint">{plan.data.priceNgn ? `${ngn(plan.data.priceNgn)}/month` : ""}</span>
              </div>
              <p className="hint">Renews on {plan.data.renewsOn}.</p>
            </>
          )}
          {plan.data && plan.data.status === "none" && (
            <>
              <p className="hint" style={{ margin: "6px 0 10px" }}>
                This brand doesn't have a plan yet.
              </p>
              <Link to={`/dashboard/${slug}/billing`} className="btn btn-secondary btn-sm">
                Choose a plan
              </Link>
            </>
          )}
        </section>

        {/* Usage */}
        <section className="card" aria-label="Usage">
          <h2>Usage · {usage.data?.period ?? "this month"}</h2>
          {usage.loading && (
            <>
              <div style={{ height: 8 }} />
              <Skeleton h={14} w="80%" />
            </>
          )}
          {usage.error && (
            <p className="hint">
              Couldn't load usage.{" "}
              <button className="btn btn-ghost btn-sm" onClick={usage.retry}>
                Try again
              </button>
            </p>
          )}
          {usage.data && (
            <div style={{ display: "flex", gap: 24, marginTop: 8, flexWrap: "wrap" }}>
              <div>
                <div className="stat-num">{usage.data.requests.toLocaleString()}</div>
                <div className="stat-label">visits</div>
              </div>
              <div>
                <div className="stat-num">{usage.data.storageMb} MB</div>
                <div className="stat-label">storage</div>
              </div>
              <div>
                <div className="stat-num">{usage.data.emailsSent}</div>
                <div className="stat-label">emails sent</div>
              </div>
            </div>
          )}
          {!usage.loading && !usage.error && !usage.data && (
            <p className="hint" style={{ marginTop: 6 }}>
              No usage recorded yet — it appears once your site gets its first visits.
            </p>
          )}
        </section>
      </div>

      <h2 style={{ fontSize: "1.05rem", margin: "26px 0 12px" }}>Manage this brand</h2>
      {brand.loading ? (
        <CardSkeleton lines={2} />
      ) : (
        <div className="grid-2">
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
            body="Money made, money spent, and your wallet."
          />
          <ManageCard
            to={`/dashboard/${slug}/team`}
            icon="team"
            title="Team"
            body="Who has access to this brand, and what they can do."
          />
          <ManageCard
            to={`/dashboard/${slug}/marketplace`}
            icon="store"
            title="Marketplace"
            body="Page sections built by other creators."
          />
          <ManageCard
            to={`/dashboard/${slug}/settings`}
            icon="gear"
            title="Settings"
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
