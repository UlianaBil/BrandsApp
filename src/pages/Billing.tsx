import { useParams } from "react-router-dom"
import { api, ngn } from "../mock"
import { BrandHeader } from "../layout"
import { CardSkeleton, EmptyState, ErrorState, useAsync, useToast } from "../ui"

const PLANS = [
  { id: "starter", name: "Starter", priceNgn: 7500, blurb: "Website, store and 5 apps. For brands getting going." },
  { id: "growth", name: "Growth", priceNgn: 18000, blurb: "Everything in Starter plus 15 apps and priority support." },
]

export default function Billing() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const plan = useAsync(() => api.getPlan(slug), [slug])
  const payments = useAsync(() => api.listPayments(slug), [slug])

  return (
    <main className="page">
      <BrandHeader slug={slug} title="Billing" />
      <p className="sub" style={{ marginTop: -8, marginBottom: 20, color: "var(--body-c)" }}>
        Your plan, payments, and buying apps for this brand.
      </p>

      <div className="stack">
        {/* Current subscription */}
        {plan.loading && <CardSkeleton lines={2} />}
        {plan.error && <ErrorState message={plan.error} onRetry={plan.retry} />}
        {plan.data && (
          <section className="card" aria-label="Current subscription">
            <h2>Current subscription</h2>
            {plan.data.status === "trial" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
                  <span className="chip chip-warn">Free trial</span>
                  <span className="hint">{plan.data.daysLeft} days left</span>
                </div>
                <p className="hint">
                  Your brand stays online through the trial. Pick a plan below and you won't be charged
                  until the trial ends.
                </p>
              </>
            )}
            {plan.data.status === "active" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0", flexWrap: "wrap" }}>
                <span className="chip chip-good">{plan.data.name}</span>
                <span className="hint">
                  {plan.data.priceNgn ? `${ngn(plan.data.priceNgn)}/month · ` : ""}renews {plan.data.renewsOn}
                </span>
              </div>
            )}
            {plan.data.status === "none" && (
              <p className="hint" style={{ marginTop: 6 }}>
                This brand doesn't have a plan yet — choose one below to keep it online.
              </p>
            )}
          </section>
        )}

        {/* Plans */}
        <section aria-label="Available plans">
          <h2 className="section-label" style={{ margin: "12px 0 12px" }}>Plans</h2>
          <div className="grid-2">
            {PLANS.map((p) => {
              const isCurrent = plan.data?.status === "active" && plan.data.name === p.name
              return (
                <div key={p.id} className="card">
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
          <p className="hint" style={{ color: "var(--muted)", fontSize: "0.83rem", marginTop: 8 }}>
            Priced in Naira. You can pay with your wallet balance instead of a card.
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
