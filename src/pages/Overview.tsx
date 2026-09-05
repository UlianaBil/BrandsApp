import { Link, useParams } from "react-router-dom"
import { api, fmtDate, ngn } from "../mock"
import { CardSkeleton, ErrorState, Icon, InlineError, initials, SectionHead, Skeleton, useAsync, useToast, type IconName } from "../ui"

function ManageCard({ to, icon, title, body }: { to: string; icon: IconName; title: string; body: string }) {
  return (
    <Link to={to} className="card managecard">
      <div className="mc-icon" aria-hidden="true"><Icon name={icon} size={20} /></div>
      <span className="mc-arrow" aria-hidden="true"><Icon name="arrow-up-right" size={16} /></span>
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
      toast("Link copied", "success")
    } catch {
      toast("Couldn't copy — long-press the link instead", "error")
    }
  }

  if (brand.error) {
    return (
      <main className="page">
        <Link className="back-link always" to="/dashboard">
          <span className="ico"><Icon name="back" size={16} /></span>
          <span>My Brands</span>
        </Link>
        <ErrorState message={brand.error} onRetry={brand.retry} />
      </main>
    )
  }

  const isOwnerOrAdmin = brand.data?.role === "owner" || brand.data?.role === "admin"
  const planTrial = plan.data?.status === "trial"
  // Colour is a signal, not decoration: the tile turns peach only when the plan needs action soon.
  const needsAction = plan.data?.status === "none" || (planTrial && (plan.data?.daysLeft ?? 0) <= 7)

  return (
    <main className="page">
      <Link className="back-link" to="/dashboard">
        <span className="ico"><Icon name="back" size={16} /></span>
        <span>My Brands</span>
      </Link>

      {/* Identity pill + free-standing actions */}
      <header className="brand-head" aria-label="Your brand">
        {brand.loading ? (
          <div className="id-pill" style={{ minWidth: 320 }}>
            <Skeleton h={40} w={40} round />
            <div style={{ flex: 1 }}>
              <Skeleton h={14} w="60%" />
              <Skeleton h={11} w="45%" style={{ marginTop: 8 }} />
            </div>
          </div>
        ) : brand.data ? (
          <>
            <div className="id-pill">
              <div className="brand-avatar" aria-hidden="true">{initials(brand.data.name)}</div>
              <div className="id-text">
                <h1 title={brand.data.name}>{brand.data.name}</h1>
                <p className="domain-line">
                  <span className="dom">{brand.data.domain}</span>
                  <button className="copy-btn" onClick={copyLink} aria-label="Copy link to your live site"><Icon name="copy" size={14} /></button>
                </p>
              </div>
              <span className="sep" aria-hidden="true" />
              <span className="chip chip-good head-badge"><span className="dot" />Live</span>
            </div>
            <div className="brand-head-actions">
              <a className="btn btn-primary" href={brand.data.adminUrl} target="_blank" rel="noreferrer">
                Open brand admin <Icon name="arrow-right" size={16} />
              </a>
              <a className="btn btn-secondary" href={brand.data.liveUrl} target="_blank" rel="noreferrer">
                View live site <Icon name="external" size={15} />
              </a>
            </div>
          </>
        ) : null}
      </header>

      <div className="grid-3">
        {/* Plan */}
        <section className={`card stat-card${needsAction ? " tile-accent" : ""}`} aria-label="Plan">
          <div className="stat-headrow">
            <span className="stat-ico" aria-hidden="true"><Icon name="card" size={16} /></span>
            <span className="stat-title">Plan</span>
            {planTrial && <span className={`chip stat-corner${needsAction ? "" : " chip-neutral"}`}>Free trial</span>}
            {plan.data?.status === "active" && <span className="chip chip-good stat-corner"><span className="dot" />Active</span>}
          </div>
          {plan.loading && (<><Skeleton h={30} w="55%" style={{ marginTop: 16 }} /><Skeleton h={13} w="80%" style={{ marginTop: 12 }} /></>)}
          {plan.error && <InlineError what="your plan" onRetry={plan.retry} />}
          {plan.data?.status === "trial" && (
            <>
              <div className="ov-num">{plan.data.daysLeft} days</div>
              <p className="ov-sub">left in your free trial — pick a plan to keep your brand online.</p>
              <div className="stat-actions"><Link to={`/dashboard/${slug}/billing`} className="link-cta">Choose a plan</Link></div>
            </>
          )}
          {plan.data?.status === "active" && (
            <>
              <div className="ov-num">{plan.data.priceNgn ? ngn(plan.data.priceNgn) : plan.data.name}</div>
              <p className="ov-sub">{plan.data.name} · renews {plan.data.renewsOn && fmtDate(plan.data.renewsOn)}.</p>
              <div className="stat-actions"><Link to={`/dashboard/${slug}/billing`} className="link-cta">Manage plan</Link></div>
            </>
          )}
          {plan.data?.status === "none" && (
            <>
              <div className="ov-num">No plan</div>
              <p className="ov-sub">Choose one to keep this brand online.</p>
              <div className="stat-actions"><Link to={`/dashboard/${slug}/billing`} className="link-cta">Choose a plan</Link></div>
            </>
          )}
        </section>

        {/* Usage */}
        <section className="card stat-card" aria-label="Usage">
          <div className="stat-headrow">
            <span className="stat-ico" aria-hidden="true"><Icon name="globe" size={16} /></span>
            <span className="stat-title">Usage</span>
            {usage.data && <span className="stat-corner">{usage.data.period}</span>}
          </div>
          {usage.loading && (<><Skeleton h={30} w="55%" style={{ marginTop: 16 }} /><Skeleton h={13} w="80%" style={{ marginTop: 12 }} /></>)}
          {usage.error && <InlineError what="usage" onRetry={usage.retry} />}
          {usage.data && (
            <>
              <div className="ov-num">{usage.data.requests.toLocaleString()}</div>
              <p className="ov-sub">visits to your site this month · {usage.data.storageMb} MB storage · {usage.data.emailsSent} emails sent</p>
              <div className="stat-actions"><Link to={`/dashboard/${slug}/billing`} className="link-cta">Usage &amp; credits</Link></div>
            </>
          )}
          {!usage.loading && !usage.error && !usage.data && (
            <p className="ov-sub" style={{ marginTop: 12 }}>No usage recorded yet — it appears once your site gets its first visits.</p>
          )}
        </section>

        {/* Wallet: one number only — the breakdown lives on Finances. */}
        <section className="card stat-card" aria-label="Wallet balance">
          <div className="stat-headrow">
            <span className="stat-ico" aria-hidden="true"><Icon name="wallet" size={16} /></span>
            <span className="stat-title">Wallet balance</span>
          </div>
          {wallet.loading && (<><Skeleton h={30} w="55%" style={{ marginTop: 16 }} /><Skeleton h={13} w="80%" style={{ marginTop: 12 }} /></>)}
          {wallet.error && <InlineError what="your wallet" onRetry={wallet.retry} />}
          {wallet.data && (
            <>
              <div className="ov-num">{ngn(wallet.data.balanceNgn)}</div>
              <p className="ov-sub">Earned by your brand — spendable on your plan, credits or apps.</p>
              <div className="stat-actions"><Link to={`/dashboard/${slug}/finances`} className="link-cta">View finances</Link></div>
            </>
          )}
        </section>
      </div>

      <SectionHead title="Manage this brand" hint="Billing, money, people, marketplace and settings" />
      {brand.loading ? (
        <CardSkeleton lines={2} />
      ) : (
        <div className="grid-manage">
          <ManageCard to={`/dashboard/${slug}/billing`} icon="card" title="Billing" body="Your plan, usage credits and app purchases." />
          <ManageCard to={`/dashboard/${slug}/finances`} icon="wallet" title="Finances" body="Money made, money spent, and your wallet." />
          <ManageCard to={`/dashboard/${slug}/team`} icon="team" title="Team" body="Who has access to this brand, and what they can do." />
          <ManageCard to={`/dashboard/${slug}/marketplace`} icon="store" title="Marketplace" body="Page sections built by other creators." />
          <ManageCard to={`/dashboard/${slug}/settings`} icon="gear" title="Settings" body="Brand name, domains and brand-level configuration." />
        </div>
      )}

      {brand.data && !isOwnerOrAdmin && (
        <p className="member-note">
          <span className="ico"><Icon name="lock" size={14} /></span>
          You're a member of this brand — billing, team and settings are read-only for you.
        </p>
      )}
    </main>
  )
}
