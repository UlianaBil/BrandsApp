import { Link, useParams } from "react-router-dom"
import { api, ngn } from "../mock"
import { BrandHeader } from "../layout"
import { CardSkeleton, ErrorState, useAsync } from "../ui"

export default function Finances() {
  const { slug = "" } = useParams()
  const wallet = useAsync(() => api.getWallet(slug), [slug])

  return (
    <main className="page">
      <BrandHeader slug={slug} title="Finances" />
      <p className="sub" style={{ marginTop: -8, marginBottom: 20, color: "var(--body-c)" }}>
        What this brand has made, spent, and can spend right now.
      </p>

      {wallet.loading && <CardSkeleton lines={3} />}
      {wallet.error && <ErrorState message={wallet.error} onRetry={wallet.retry} />}

      {wallet.data && (
        <div className="stack">
          <section className="card" aria-label="Wallet">
            <h2>Wallet balance</h2>
            <div className="stat-num" style={{ fontSize: "1.9rem", margin: "4px 0" }}>
              {ngn(wallet.data.balanceNgn)}
            </div>
            <p className="hint">
              Sales and commissions your brand has earned. Spendable now — use it for your plan, usage
              credits or apps instead of a card.
            </p>
          </section>

          <div className="grid-3">
            <div className="card">
              <div className="stat-label">Money in</div>
              <div className="stat-num">{ngn(wallet.data.earnedNgn)}</div>
              <p className="hint" style={{ fontSize: "0.83rem" }}>
                Everything paid into your wallet so far.
              </p>
            </div>
            <div className="card">
              <div className="stat-label">Money out</div>
              <div className="stat-num">{ngn(wallet.data.spentNgn)}</div>
              <p className="hint" style={{ fontSize: "0.83rem" }}>
                Plan payments and top-ups that went through.
              </p>
            </div>
            <div className="card">
              <div className="stat-label">App credits</div>
              <div className="stat-num">{wallet.data.appCredits.toLocaleString()}</div>
              <p className="hint" style={{ fontSize: "0.83rem" }}>
                Credit for buying apps — 1 credit is ₦1 of app spend.
              </p>
            </div>
          </div>

          {wallet.data.spentNgn === 0 && (
            <p className="hint" style={{ color: "var(--muted)" }}>
              Nothing spent yet — your full payment history will appear on the{" "}
              <Link to={`/dashboard/${slug}/billing`} style={{ color: "var(--terracotta)", fontWeight: 600 }}>
                Billing page
              </Link>{" "}
              once you're on a paid plan.
            </p>
          )}

          <details className="explainer">
            <summary>How the two kinds of credit work</summary>
            <p>
              <b>App credits</b> buy apps and bundles from the app store — a typical app costs 5,000
              credits (₦5,000).
            </p>
            <p>
              <b>Usage credits</b> (on the Billing page) cover infrastructure overages — extra visits,
              storage or emails beyond your plan.
            </p>
            <p>Your wallet balance can pay for either.</p>
          </details>
        </div>
      )}
    </main>
  )
}
