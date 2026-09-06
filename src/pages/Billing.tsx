import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api, fmtDate, ngn, type UsageResource } from "../mock"
import { CardSkeleton, EmptyState, ErrorState, Icon, Modal, PageHeader, Pagination, SectionHead, Skeleton, useAsync, useToast } from "../ui"

// Paid tiers from the platform rate card (pricing.md): 1 credit = ₦1.
const PLANS = [
  { id: "starter", name: "Starter", priceNgn: 2000, credits: 2000, features: ["2,000 usage credits a month", "Up to 10 apps", "Custom domain"] },
  { id: "growth", name: "Growth", priceNgn: 5000, credits: 5000, features: ["5,000 usage credits a month", "Unlimited apps", "Custom domain", "Priority support"] },
  { id: "scale", name: "Scale", priceNgn: 15000, credits: 15000, features: ["15,000 usage credits a month", "Unlimited apps", "Built for high-volume stores", "Priority support"] },
]
type PlanDef = (typeof PLANS)[number]

const fmt = (v: number, unit: UsageResource["unit"]) => (unit ? `${v.toLocaleString()} ${unit}` : v.toLocaleString())
const PAGE = 5

function Meter({ r }: { r: UsageResource }) {
  const pct = r.limit > 0 ? Math.min(100, (r.used / r.limit) * 100) : 0
  const tone = pct >= 95 ? "bad" : pct >= 80 ? "warn" : ""
  return (
    <div className="meter-row">
      <div className="meter-head">
        <span className="meter-label">{r.label}</span>
        <span className="meter-value">{fmt(r.used, r.unit)} of {fmt(r.limit, r.unit)}</span>
      </div>
      <div className="meter" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${r.label}: ${fmt(r.used, r.unit)} of ${fmt(r.limit, r.unit)} used`}>
        <div className={`meter-fill ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Billing() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const plan = useAsync(() => api.getPlan(slug), [slug])
  const usage = useAsync(() => api.getUsage(slug), [slug])
  const payments = useAsync(() => api.listPayments(slug), [slug])
  const kyc = useAsync(() => api.getKyc(slug), [slug])
  const [showAllUsage, setShowAllUsage] = useState(false)
  const [page, setPage] = useState(1)
  const [choosing, setChoosing] = useState<PlanDef | null>(null)

  const sortedResources = usage.data ? [...usage.data.resources].sort((a, b) => b.used / b.limit - a.used / a.limit) : []
  const visibleResources = showAllUsage ? sortedResources : sortedResources.slice(0, 3)
  const hiddenCount = sortedResources.length - 3
  const pagedPayments = payments.data ? payments.data.slice((page - 1) * PAGE, page * PAGE) : []

  const isActive = plan.data?.status === "active"

  return (
    <main className="page">
      <PageHeader slug={slug} title="Billing" sub="Your plan, payments, and buying apps for this brand." />

      <div className="stack">
        {/* Current subscription — facts as individual cards */}
        {plan.loading && (
          <div className="facts" aria-label="Loading" role="status">
            {[0, 1, 2].map((i) => (<div key={i} className="card"><Skeleton h={11} w="40%" /><Skeleton h={20} w="60%" /></div>))}
          </div>
        )}
        {plan.error && <ErrorState message={plan.error} onRetry={plan.retry} />}
        {plan.data && (
          <section aria-label="Current subscription">
            <div className="facts">
              <div className="card">
                <span className="stat-title">Plan</span>
                <span className="fact-v">{plan.data.status === "none" ? "No plan" : plan.data.name}</span>
              </div>
              <div className="card">
                <span className="stat-title">Status</span>
                <span className="fact-v chip-row">
                  {plan.data.status === "trial" && <span className="chip chip-warn"><span className="dot" />Free trial</span>}
                  {plan.data.status === "active" && <span className="chip chip-good"><span className="dot" />Active</span>}
                  {plan.data.status === "none" && <span className="chip chip-neutral"><span className="dot" />Inactive</span>}
                </span>
              </div>
              {plan.data.status === "trial" && (
                <div className="card">
                  <span className="stat-title">Trial ends</span>
                  <span className="fact-v">in {plan.data.daysLeft} days</span>
                </div>
              )}
              {plan.data.status === "active" && (
                <div className="card">
                  <span className="stat-title">Renews</span>
                  <span className="fact-v">{plan.data.renewsOn && fmtDate(plan.data.renewsOn)}</span>
                </div>
              )}
              {plan.data.status === "active" && plan.data.monthlyCredits != null && (
                <div className="card">
                  <span className="stat-title">Monthly credits</span>
                  <span className="fact-v">{plan.data.monthlyCredits.toLocaleString()} cr</span>
                  <button className="link-cta sm" onClick={() => toast("Top-ups aren't wired up in this prototype")}>Top up</button>
                </div>
              )}
            </div>
            {plan.data.status === "trial" && (
              <p className="member-note block" style={{ marginTop: 14 }}>
                <span className="ico"><Icon name="info" size={14} /></span>
                Your brand stays online through the trial. Pick a plan below and you won't be charged until the trial ends.
              </p>
            )}
          </section>
        )}

        {/* Business verification — gates taking money from customers, not the plan itself. */}
        {kyc.data && kyc.data.status !== "verified" && (
          <section
            className={`card stat-card compact${kyc.data.status === "pending" ? "" : " tile-accent"}`}
            aria-label="Business verification"
          >
            <div className="stat-headrow">
              <span className="stat-ico" aria-hidden="true"><Icon name="shield" size={16} /></span>
              <span className="stat-title">Business verification</span>
              {kyc.data.status === "pending" && <span className="chip chip-warn stat-corner"><span className="dot" />Pending review</span>}
              {kyc.data.status === "rejected" && <span className="chip stat-corner">Rejected</span>}
              {kyc.data.status === "not_started" && <span className="chip stat-corner">Not started</span>}
            </div>
            <h2 style={{ marginTop: 14, fontSize: "1.1rem" }}>
              {kyc.data.status === "pending" ? "Your verification is under review" : "Verify your business to accept payments"}
            </h2>
            <p className="ov-sub" style={{ maxWidth: "60ch" }}>
              {kyc.data.status === "pending"
                ? "We're confirming your business and settlement account. Card and bank payments switch on as soon as it's approved."
                : kyc.data.status === "rejected"
                  ? `${kyc.data.reason ?? "Something didn't match on your last submission."} Check your details and submit again.`
                  : "Complete KYC (business + bank verification) to take card and bank payments from your customers. Your own plan doesn't need it."}
            </p>
            <div className="stat-actions">
              <Link to={`/dashboard/${slug}/kyc`} className={`btn btn-sm ${kyc.data.status === "pending" ? "btn-secondary" : "btn-primary"}`}>
                {kyc.data.status === "pending" ? "View submission" : kyc.data.status === "rejected" ? "Fix and resubmit" : "Complete KYC"}
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>
          </section>
        )}

        {/* Usage vs allowance */}
        {usage.loading && <CardSkeleton lines={3} />}
        {usage.error && <ErrorState message={usage.error} onRetry={usage.retry} />}
        {usage.data && (
          <section className="card" aria-label="Usage this month">
            <div className="card-head" style={{ marginBottom: 4 }}>
              <div>
                <h2>Usage this month</h2>
                <p className="hint">Sorted by how close each is to its limit.</p>
              </div>
              <span className="chip chip-neutral">{usage.data.period}</span>
            </div>
            <div>{visibleResources.map((r) => <Meter key={r.key} r={r} />)}</div>
            {hiddenCount > 0 && (
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} aria-expanded={showAllUsage} onClick={() => setShowAllUsage((v) => !v)}>
                {showAllUsage ? "Show less" : `Show ${hiddenCount} more`}
                <Icon name="chevron-down" size={14} />
              </button>
            )}
            <p className="hint quiet" style={{ marginTop: 14 }}>
              Past an allowance, extra usage draws down your plan's credits (1 credit = ₦1). If credits run out, usage pauses until you top up or upgrade.
            </p>
          </section>
        )}

        {/* Plans */}
        <section aria-label="Plans">
          <SectionHead title="Plans" hint="Billed yearly, prepaid in Naira · pay by card, transfer, USSD or from your wallet" />
          <div className="grid-3">
            {PLANS.map((p) => {
              const isCurrent = isActive && plan.data?.name === p.name
              return (
                <div key={p.id} className={`card plancard${isCurrent ? " current" : ""}`}>
                  <div className="card-row">
                    <h2>{p.name}</h2>
                    {isCurrent && <span className="chip chip-dark">Current plan</span>}
                  </div>
                  <div className="price">
                    <span className="n">{ngn(p.priceNgn)}</span>
                    <span className="per">/ year</span>
                  </div>
                  <ul>
                    {p.features.map((f) => (
                      <li key={f}><span className="tick"><Icon name="check" size={11} /></span>{f}</li>
                    ))}
                  </ul>
                  <button className={`btn ${isCurrent ? "btn-secondary" : "btn-primary"}`} disabled={isCurrent || plan.loading} onClick={() => setChoosing(p)}>
                    {isCurrent ? "Current plan" : isActive ? "Switch plan" : "Choose plan"}
                  </button>
                </div>
              )
            })}
          </div>
          <p className="hint quiet" style={{ marginTop: 12 }}>One payment a year. No card is kept on file — each payment is a one-off.</p>
        </section>

        {/* Payment history */}
        <SectionHead title="Payment history" />
        {payments.loading && <CardSkeleton lines={2} />}
        {payments.error && <ErrorState message={payments.error} onRetry={payments.retry} />}
        {payments.data && payments.data.length === 0 && (
          <EmptyState icon="receipt" title="No payments yet" body="Once you're on a paid plan, every charge shows up here with a receipt." />
        )}
        {payments.data && payments.data.length > 0 && (
          <section className="card flush" aria-label="Payment history">
            <div className="table" style={{ ["--cols" as string]: "minmax(0,2fr) minmax(0,1fr) 110px 110px", paddingTop: 18 }}>
              <div className="tr th"><span>Description</span><span>Date</span><span style={{ textAlign: "right" }}>Amount</span><span style={{ textAlign: "right" }}>Status</span></div>
              {pagedPayments.map((p) => (
                <div key={p.id} className="tr">
                  <span className="td strong span">{p.description}</span>
                  <span className="td muted"><span className="lbl">Date</span>{fmtDate(p.date)}</span>
                  <span className="td num">{ngn(p.amountNgn)}</span>
                  <span className="td end span">
                    <span className={`chip ${p.status === "paid" ? "chip-good" : "chip-bad"}`}><span className="dot" />{p.status === "paid" ? "Paid" : "Failed"}</span>
                  </span>
                </div>
              ))}
            </div>
            {payments.data.length > PAGE && (
              <div className="card-foot">
                <Pagination page={page} pageSize={PAGE} total={payments.data.length} onChange={setPage} noun="payments" />
              </div>
            )}
          </section>
        )}
      </div>

      {/* Confirm plan */}
      <Modal
        open={choosing != null}
        onClose={() => setChoosing(null)}
        title={isActive ? `Switch to ${choosing?.name}` : `Choose ${choosing?.name}`}
        icon="card"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setChoosing(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setChoosing(null); toast("Checkout isn't wired up in this prototype") }}>
              Continue to payment <Icon name="arrow-right" size={15} />
            </button>
          </>
        }
      >
        {choosing && (
          <>
            <p>{plan.data?.status === "trial" ? "You won't be charged until your trial ends." : isActive ? "Your new allowance starts right away; the unused part of your current year is credited." : "Your brand goes live on this plan as soon as payment clears."}</p>
            <div className="summary">
              <div className="li"><span className="k">Plan</span><span className="v">{choosing.name}</span></div>
              <div className="li"><span className="k">Monthly credits</span><span className="v">{choosing.credits.toLocaleString()} cr</span></div>
              <div className="li"><span className="k">Billing</span><span className="v">Yearly</span></div>
              <div className="li"><span className="k">Due today</span><span className="v">{plan.data?.status === "trial" ? "₦0" : ngn(choosing.priceNgn)}</span></div>
            </div>
          </>
        )}
      </Modal>
    </main>
  )
}
