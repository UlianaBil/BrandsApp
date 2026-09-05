import { Link, useParams } from "react-router-dom"
import { api, ngn } from "../mock"
import { CardSkeleton, ErrorState, Icon, PageHeader, useAsync, type IconName } from "../ui"

function Stat({ icon, label, value, hint }: { icon: IconName; label: string; value: string; hint: string }) {
  return (
    <section className="card stat-card compact" aria-label={label}>
      <div className="stat-headrow">
        <span className="stat-ico" aria-hidden="true"><Icon name={icon} size={16} /></span>
        <span className="stat-title">{label}</span>
      </div>
      <div className="ov-num md">{value}</div>
      <p className="ov-sub">{hint}</p>
    </section>
  )
}

export default function Finances() {
  const { slug = "" } = useParams()
  const wallet = useAsync(() => api.getWallet(slug), [slug])

  return (
    <main className="page">
      <PageHeader slug={slug} title="Finances" sub="What this brand has made, spent, and can spend right now." />

      {wallet.loading && (<div className="stack"><CardSkeleton lines={2} /><div className="grid-3"><CardSkeleton lines={1} /><CardSkeleton lines={1} /><CardSkeleton lines={1} /></div></div>)}
      {wallet.error && <ErrorState message={wallet.error} onRetry={wallet.retry} />}

      {wallet.data && (
        <div className="stack">
          <section className="card stat-card compact" aria-label="Wallet balance">
            <div className="stat-headrow">
              <span className="stat-ico" aria-hidden="true"><Icon name="wallet" size={16} /></span>
              <span className="stat-title">Wallet balance</span>
              <span className="chip chip-good stat-corner"><span className="dot" />Spendable now</span>
            </div>
            <div className="ov-num xl">{ngn(wallet.data.balanceNgn)}</div>
            <p className="ov-sub" style={{ maxWidth: "52ch" }}>
              Sales and commissions your brand has earned. Use it for your plan, usage credits or apps instead of a card.
            </p>
            <div className="stat-actions">
              <Link to={`/dashboard/${slug}/billing`} className="btn btn-primary btn-sm">Pay for a plan <Icon name="arrow-right" size={14} /></Link>
              <Link to={`/dashboard/${slug}/marketplace`} className="btn btn-secondary btn-sm">Browse apps</Link>
            </div>
          </section>

          <div className="grid-3">
            <Stat icon="trend-up" label="Money in" value={ngn(wallet.data.earnedNgn)} hint="Everything paid into your wallet so far." />
            <Stat icon="trend-down" label="Money out" value={ngn(wallet.data.spentNgn)} hint="Plan payments and top-ups that went through." />
            <Stat icon="coins" label="App credits" value={wallet.data.appCredits.toLocaleString()} hint="Credit for buying apps — 1 credit is ₦1 of app spend." />
          </div>

          {wallet.data.spentNgn === 0 && (
            <p className="member-note block">
              <span className="ico"><Icon name="info" size={14} /></span>
              <span>
                Nothing spent yet — your full payment history will appear on the{" "}
                <Link to={`/dashboard/${slug}/billing`} className="text-link">Billing page</Link> once you're on a paid plan.
              </span>
            </p>
          )}

          <details className="explainer">
            <summary><span className="ico"><Icon name="chevron-down" size={14} /></span>How the two kinds of credit work</summary>
            <p><b>App credits</b> buy apps and bundles from the app store — a typical app costs 5,000 credits (₦5,000).</p>
            <p><b>Usage credits</b> (on the Billing page) cover infrastructure overages — extra visits, storage or emails beyond your plan.</p>
            <p>Your wallet balance can pay for either.</p>
          </details>
        </div>
      )}
    </main>
  )
}
