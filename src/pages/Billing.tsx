import { useState } from "react"
import { useParams } from "react-router-dom"
import { api, ngn, type UsageResource } from "../mock"
import { BrandHeader } from "../layout"
import { CardSkeleton, EmptyState, ErrorState, useAsync, useToast } from "../ui"

// Paid tiers from the platform rate card (pricing.md): 1 credit = ₦1.
const PLANS = [
  { id: "starter", name: "Starter", priceNgn: 2000, credits: 2000, blurb: "2,000 credits · 10 apps · custom domain" },
  { id: "growth", name: "Growth", priceNgn: 5000, credits: 5000, blurb: "5,000 credits · unlimited apps" },
  { id: "scale", name: "Scale", priceNgn: 15000, credits: 15000, blurb: "15,000 credits · unlimited apps, for high volume" },
]

const fmt = (v: number, unit: UsageResource["unit"]) =>
  unit ? `${v.toLocaleString()} ${unit}` : v.toLocaleString()

function Meter({ r }: { r: UsageResource }) {
  const pct = r.limit > 0 ? Math.min(100, (r.used / r.limit) * 100) : 0
  const tone = pct >= 95 ? "bad" : pct >= 80 ? "warn" : ""
  return (
    <div className="meter-row">
      <div className="meter-head">
        <span className="meter-label">{r.label}</span>
        <span className="meter-value">
          {fmt(r.used, r.unit)} of {fmt(r.limit, r.unit)}
        </span>
      </div>
      <div
        className="meter"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${r.label}: ${fmt(r.used, r.unit)} of ${fmt(r.limit, r.unit)} used`}
      >
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
  const [showAllUsage, setShowAllUsage] = useState(false)

  const sortedResources = usage.data
    ? [...usage.data.resources].sort((a, b) => b.used / b.limit - a.used / a.limit)
    : []
  const visibleResources = showAllUsage ? sortedResources : sortedResources.slice(0, 3)
  const hiddenCount = sortedResources.length - 3

  return (
    <main className="page">
      <BrandHeader slug={slug} title="Billing" />
      <p className="sub" style={{ marginTop: -8, marginBottom: 20, color: "var(--body-c)" }}>
        Your plan, payments, and buying apps for this brand.
      </p>

      <div className="stack">
        {/* Current subscription — labeled columns, as in the reference. */}
        {plan.loading && <CardSkeleton lines={2} />}
        {plan.error && <ErrorState message={plan.error} onRetry={plan.retry} />}
        {plan.data && (
          <section aria-label="Current subscription">
            <div className="sub-cards">
              <div className="card">
                <span className="stat-title">Plan</span>
                <span className="sub-value">
                  {plan.data.status === "none" ? "No plan" : plan.data.name}
                </span>
              </div>
              <div className="card">
                <span className="stat-title">Status</span>
                {plan.data.status === "trial" && <span className="chip chip-warn">Free trial</span>}
                {plan.data.status === "active" && <span className="chip chip-good">Active</span>}
                {plan.data.status === "none" && <span className="chip chip-neutral">Inactive</span>}
              </div>
              {plan.data.status === "trial" && (
                <div className="card">
                  <span className="stat-title">Trial ends</span>
                  <span className="sub-value">in {plan.data.daysLeft} days</span>
                </div>
              )}
              {plan.data.status === "active" && (
                <div className="card">
                  <span className="stat-title">Renews</span>
                  <span className="sub-value">{plan.data.renewsOn}</span>
                </div>
              )}
              {plan.data.status === "active" && plan.data.monthlyCredits != null && (
                <div className="card">
                  <span className="stat-title">Monthly credits</span>
                  <span className="sub-value">{plan.data.monthlyCredits.toLocaleString()} cr</span>
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="link-cta"
                      style={{ fontSize: "0.85rem" }}
                      onClick={() => toast("Top-ups aren't wired up in this prototype")}
                    >
                      Top up
                    </button>
                  </div>
                </div>
              )}
            </div>
            {plan.data.status === "trial" && (
              <p className="hint" style={{ marginTop: 10 }}>
                Your brand stays online through the trial. Pick a plan below and you won't be charged
                until the trial ends.
              </p>
            )}
          </section>
        )}

        {/* Usage vs allowance — top three, expandable to the full list. */}
        {usage.loading && <CardSkeleton lines={3} />}
        {usage.error && <ErrorState message={usage.error} onRetry={usage.retry} />}
        {usage.data && (
          <section className="card" aria-label="Usage this month">
            <div className="card-row">
              <h2>Usage this month</h2>
              <span className="hint">{usage.data.period}</span>
            </div>
            <div style={{ marginTop: 4 }}>
              {visibleResources.map((r) => (
                <Meter key={r.key} r={r} />
              ))}
            </div>
            {hiddenCount > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 8 }}
                aria-expanded={showAllUsage}
                onClick={() => setShowAllUsage((v) => !v)}
              >
                {showAllUsage ? "Show less" : `Show ${hiddenCount} more`}
              </button>
            )}
            <p className="hint" style={{ marginTop: 10, fontSize: "0.83rem", color: "var(--muted)" }}>
              Sorted by how close each is to its limit. Past an allowance, extra usage draws down
              your plan's credits (1 credit = ₦1). If credits run out, usage pauses until you top up
              or upgrade.
            </p>
          </section>
        )}

        {/* Plans — full cards, current one highlighted. */}
        <section aria-label="Plans">
          <h2 className="section-label" style={{ margin: "12px 0 12px" }}>Plans</h2>
          <div className="grid-3">
            {PLANS.map((p) => {
              const isCurrent = plan.data?.status === "active" && plan.data.name === p.name
              return (
                <div key={p.id} className={`card${isCurrent ? " plan-card-current" : ""}`}>
                  <div className="card-row">
                    <h2>{p.name}</h2>
                    {isCurrent && <span className="chip chip-good">Current plan</span>}
                  </div>
                  <div style={{ margin: "4px 0 6px" }}>
                    <span className="stat-num">{ngn(p.priceNgn)}</span>
                    <span className="stat-label"> /month</span>
                  </div>
                  <p className="hint" style={{ marginBottom: 12 }}>
                    {p.blurb}
                  </p>
                  <button
                    className={`btn btn-sm ${isCurrent ? "btn-secondary" : "btn-primary"}`}
                    disabled={isCurrent}
                    onClick={() => toast("Checkout isn't wired up in this prototype")}
                  >
                    {isCurrent ? "Current plan" : plan.data?.status === "active" ? "Switch plan" : "Choose plan"}
                  </button>
                </div>
              )
            })}
          </div>
          <p className="hint" style={{ color: "var(--muted)", fontSize: "0.83rem", marginTop: 10 }}>
            Prepaid and priced in Naira — pay once with card, transfer or USSD; no card kept on
            file. You can also pay from your wallet balance.
          </p>
        </section>

        {/* Payment history */}
        {payments.loading && <CardSkeleton lines={2} />}
        {payments.error && <ErrorState message={payments.error} onRetry={payments.retry} />}
        {payments.data && payments.data.length === 0 && (
          <EmptyState
            icon="card"
            title="No payments yet"
            body="Once you're on a paid plan, every charge shows up here with a receipt."
          />
        )}
        {payments.data && payments.data.length > 0 && (
          <section className="card" aria-label="Payment history">
            <h2>Payment history</h2>
            <div className="rowlist" style={{ marginTop: 6 }}>
              {payments.data.map((p) => (
                <div key={p.id} className="row-item">
                  <div className="grow">
                    <div className="title">{p.description}</div>
                    <div className="meta">{p.date}</div>
                  </div>
                  <span className="money">{ngn(p.amountNgn)}</span>
                  <span className={`chip ${p.status === "paid" ? "chip-good" : "chip-bad"}`}>
                    {p.status === "paid" ? "Paid" : "Failed"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
