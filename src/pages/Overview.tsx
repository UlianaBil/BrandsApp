import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api, fmtDate, ngn, PROVISION_STEPS, type Provisioning } from "../mock"
import { CardSkeleton, ErrorState, Icon, InlineError, initials, SectionHead, Skeleton, useAsync, useToast, type IconName } from "../ui"
import { BrandStatusChip } from "./MyBrands"

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

/** Provisioning card (M3): polls until the brand is live, then hands back to the normal Overview. */
function ProvisioningCard({ slug, name, onDone }: { slug: string; name: string; onDone: () => void }) {
  const [state, setState] = useState<Provisioning>({ step: 0, total: PROVISION_STEPS.length, done: false })
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const p = await api.getProvisioning(slug)
        if (!alive) return
        setState(p)
        if (p.done) onDone()
      } catch {
        /* keep polling */
      }
    }
    tick()
    const t = setInterval(tick, 1200)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [slug, onDone])

  return (
    <section className="card" aria-label="Setting up your brand" aria-live="polite">
      <div className="stat-headrow" style={{ marginBottom: 14 }}>
        <span className="stat-ico" aria-hidden="true"><span className="spin" /></span>
        <div>
          <h2 style={{ marginBottom: 0 }}>Setting up {name}</h2>
          <p className="hint">This usually takes under a minute. You can leave this page. It keeps going.</p>
        </div>
      </div>
      <ol className="steps">
        {PROVISION_STEPS.map((label, i) => {
          const status = i < state.step ? "done" : i === state.step ? "current" : "todo"
          return (
            <li key={label} className={status}>
              <span className="st-ico" aria-hidden="true">
                {status === "done" ? <Icon name="check" size={13} /> : status === "current" ? <span className="spin" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> : null}
              </span>
              <span>{label}</span>
              {status === "done" && <span className="visually-hidden">done</span>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default function Overview() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const plan = useAsync(() => api.getPlan(slug), [slug])
  const usage = useAsync(() => api.getUsage(slug), [slug])
  const wallet = useAsync(() => api.getWallet(slug), [slug])
  const domains = useAsync(() => api.listDomains(slug), [slug])

  const copyLink = async () => {
    if (!brand.data) return
    try {
      await navigator.clipboard.writeText(brand.data.liveUrl)
      toast("Link copied", "success")
    } catch {
      toast("Couldn't copy. Long-press the link instead.", "error")
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

  const b = brand.data
  const status = b?.status ?? "live"
  const isLive = status === "live"
  const planTrial = plan.data?.status === "trial"
  // Colour is a signal, not decoration: the tile turns peach only when the plan needs action soon.
  const needsAction = plan.data?.status === "none" || (planTrial && (plan.data?.daysLeft ?? 0) <= 7)
  const pendingDomain = domains.data?.find((d) => d.status === "pending-dns")
  const failedDomain = domains.data?.find((d) => d.status === "failed")
  const planLabel = plan.data?.status === "trial" ? `Free trial, ${plan.data.daysLeft} days left` : undefined

  return (
    <main className="page">
      <Link className="back-link" to="/dashboard">
        <span className="ico"><Icon name="back" size={16} /></span>
        <span>My Brands</span>
      </Link>

      {/* Identity pill + free-standing actions. The live-site button only appears when the site is reachable. */}
      <header className="brand-head" aria-label="Your brand">
        {brand.loading ? (
          <div className="id-pill" style={{ minWidth: 320 }}>
            <Skeleton h={40} w={40} round />
            <div style={{ flex: 1 }}>
              <Skeleton h={14} w="60%" />
              <Skeleton h={11} w="45%" style={{ marginTop: 8 }} />
            </div>
          </div>
        ) : b ? (
          <>
            <div className="id-pill">
              <div className="brand-avatar" aria-hidden="true">{initials(b.name)}</div>
              <div className="id-text">
                <h1 title={b.name}>{b.name}</h1>
                <p className="domain-line">
                  <span className="dom">{b.domain}</span>
                  {isLive && <button className="copy-btn" onClick={copyLink} aria-label="Copy link to your live site"><Icon name="copy" size={14} /></button>}
                </p>
              </div>
              <span className="sep" aria-hidden="true" />
              <span className="head-badge" style={{ display: "inline-flex" }}><BrandStatusChip status={status} planLabel={planLabel} /></span>
            </div>
            <div className="brand-head-actions">
              {status !== "suspended" && (
                <a className="btn btn-primary" href={b.adminUrl} target="_blank" rel="noreferrer">
                  Open brand admin <Icon name="arrow-right" size={16} />
                </a>
              )}
              {isLive && (
                <a className="btn btn-secondary" href={b.liveUrl} target="_blank" rel="noreferrer">
                  View live site <Icon name="external" size={15} />
                </a>
              )}
            </div>
          </>
        ) : null}
      </header>

      {/* Lifecycle notices (M2). One at a time, most severe first. */}
      {b && status === "suspended" && (
        <p className="member-note block" style={{ marginTop: 0, marginBottom: 16, background: "var(--bad-bg)", borderColor: "transparent", color: "var(--bad)" }}>
          <span className="ico" style={{ background: "rgba(255,255,255,.6)", color: "var(--bad)" }}><Icon name="warning" size={14} /></span>
          <span>This brand is suspended and visitors can't reach your site. Contact support to sort it out.</span>
        </p>
      )}
      {b && status === "paused" && (
        <p className="member-note block warn" style={{ marginTop: 0, marginBottom: 16 }}>
          <span className="ico"><Icon name="warning" size={14} /></span>
          <span>
            Visitors can't reach your site right now. Your plan has lapsed.{" "}
            <Link to={`/dashboard/${slug}/billing#plans`} className="text-link">Choose a plan</Link> to bring it back online.
          </span>
        </p>
      )}
      {b && isLive && (failedDomain || pendingDomain) && (
        <p className={`member-note block${failedDomain ? "" : " warn"}`} style={{ marginTop: 0, marginBottom: 16 }}>
          <span className="ico"><Icon name="globe" size={14} /></span>
          <span>
            {failedDomain
              ? <>{failedDomain.hostname} isn't pointing at BrandsApp yet. </>
              : <>{pendingDomain!.hostname} is connected but still waiting on DNS. </>}
            <Link to={`/dashboard/${slug}/settings/domains/${(failedDomain ?? pendingDomain)!.id}`} className="text-link">See the records</Link>
          </span>
        </p>
      )}

      {b && status === "provisioning" ? (
        <ProvisioningCard slug={slug} name={b.name} onDone={brand.retry} />
      ) : (
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
                <p className="ov-sub">left in your free trial. Pick a plan to keep your brand online.</p>
                <div className="stat-actions"><Link to={`/dashboard/${slug}/billing#plans`} className="link-cta">Choose a plan</Link></div>
              </>
            )}
            {plan.data?.status === "active" && (
              <>
                <div className="ov-num">{plan.data.priceNgn ? ngn(plan.data.priceNgn) : plan.data.name}</div>
                <p className="ov-sub">{plan.data.name}, renews {plan.data.renewsOn && fmtDate(plan.data.renewsOn)}.</p>
                <div className="stat-actions"><Link to={`/dashboard/${slug}/billing#plans`} className="link-cta">Manage plan</Link></div>
              </>
            )}
            {plan.data?.status === "none" && (
              <>
                <div className="ov-num">No plan</div>
                <p className="ov-sub">{status === "paused" ? "Choose one to bring this brand back online." : "Choose one to keep this brand online."}</p>
                <div className="stat-actions"><Link to={`/dashboard/${slug}/billing#plans`} className="link-cta">Choose a plan</Link></div>
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
                <p className="ov-sub">visits this month, {usage.data.storageMb} MB of storage and {usage.data.emailsSent.toLocaleString()} emails sent</p>
                <div className="stat-actions"><Link to={`/dashboard/${slug}/billing#usage`} className="link-cta">Usage &amp; credits</Link></div>
              </>
            )}
            {!usage.loading && !usage.error && !usage.data && (
              <p className="ov-sub" style={{ marginTop: 12 }}>No usage yet. It appears once your site gets its first visits.</p>
            )}
          </section>

          {/* Wallet: one number only. The breakdown lives on Finances. */}
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
                <p className="ov-sub">Earned by your brand. Spend it on your plan, credits or apps.</p>
                <div className="stat-actions"><Link to={`/dashboard/${slug}/finances`} className="link-cta">View finances</Link></div>
              </>
            )}
          </section>
        </div>
      )}

      <SectionHead title="Manage this brand" />
      {brand.loading ? (
        <CardSkeleton lines={2} />
      ) : (
        <div className="grid-manage">
          <ManageCard to={`/dashboard/${slug}/billing`} icon="card" title="Billing" body="Your plan, usage credits and app purchases." />
          <ManageCard to={`/dashboard/${slug}/finances`} icon="wallet" title="Finances" body="Money made, money spent, and your wallet." />
          <ManageCard to={`/dashboard/${slug}/team`} icon="team" title="Team" body="Who has access to this brand, and what they can do." />
          <ManageCard to={`/dashboard/${slug}/marketplace`} icon="store" title="Marketplace" body="Page sections built by other creators." />
          <ManageCard to={`/dashboard/${slug}/settings`} icon="gear" title="Settings" body="Brand details, domains and brand-level configuration." />
        </div>
      )}
    </main>
  )
}
