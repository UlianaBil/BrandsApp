import { useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { api, fmtDate, ngn, type CatalogApp, type OwnedApp } from "../mock"
import { CardSkeleton, ErrorState, Icon, Modal, PageHeader, Segmented, useAsync, useToast, type IconName } from "../ui"

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

const paidWithLabel: Record<OwnedApp["paidWith"], string> = {
  credits: "Paid with app credits",
  wallet: "Paid from your wallet",
  card: "Paid by card",
  plan: "Included in your plan",
}

export default function Finances() {
  const { slug = "" } = useParams()
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const wallet = useAsync(() => api.getWallet(slug), [slug])
  const apps = useAsync(() => api.listOwnedApps(slug), [slug])
  const brand = useAsync(() => api.getBrand(slug), [slug])

  // Buy-an-app dialog (M6): the app store sends the owner here with ?buy=<appId>.
  const buyId = params.get("buy")
  const [app, setApp] = useState<CatalogApp | null>(null)
  const [appError, setAppError] = useState<string | null>(null)
  const [payWith, setPayWith] = useState<"credits" | "wallet">("credits")
  const [buying, setBuying] = useState(false)
  const [bought, setBought] = useState<OwnedApp | null>(null)

  useEffect(() => {
    if (!buyId) {
      setApp(null)
      setAppError(null)
      setBought(null)
      return
    }
    api.getCatalogApp(buyId).then(setApp, (e: Error) => setAppError(e.message))
  }, [buyId])

  const closeBuy = () => setParams({}, { replace: true })
  const alreadyOwned = !!app && !!apps.data?.some((o) => o.id === app.id)
  const canAfford = !!app && !!wallet.data && (payWith === "credits" ? wallet.data.appCredits >= app.priceCr : wallet.data.balanceNgn >= app.priceCr)

  const buy = async () => {
    if (!app) return
    setBuying(true)
    try {
      const rec = await api.buyApp(slug, app.id, payWith)
      setBought(rec)
      wallet.retry()
      apps.retry()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't complete the purchase. Try again.", "error")
    } finally {
      setBuying(false)
    }
  }

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
              <Link to={`/dashboard/${slug}/billing#plans`} className="btn btn-primary btn-sm">Pay for a plan <Icon name="arrow-right" size={14} /></Link>
              {brand.data && (
                <a className="btn btn-secondary btn-sm" href={`${brand.data.adminUrl}/app-store`} target="_blank" rel="noreferrer">Browse apps <Icon name="external" size={13} /></a>
              )}
            </div>
          </section>

          <div className="grid-3">
            <Stat icon="trend-up" label="Money in" value={ngn(wallet.data.earnedNgn)} hint="Everything paid into your wallet so far." />
            <Stat icon="trend-down" label="Money out" value={ngn(wallet.data.spentNgn)} hint="Plan payments, top-ups and apps that went through." />
            <Stat icon="coins" label="App credits" value={wallet.data.appCredits.toLocaleString()} hint="Credit for buying apps. 1 credit is ₦1." />
          </div>

          {/* Apps and bundles you own (M6) */}
          {apps.loading && <CardSkeleton lines={2} />}
          {apps.error && <ErrorState message={apps.error} onRetry={apps.retry} />}
          {apps.data && (
            <section className="card flush" aria-label="Apps and bundles you own">
              <div className="card-head">
                <div>
                  <h2>Apps and bundles you own</h2>
                  <p className="hint">Yours for good. Install any of them from your app store whenever you're ready.</p>
                </div>
                {apps.data.length > 0 && <span className="chip chip-neutral">{apps.data.length}</span>}
              </div>
              {apps.data.length === 0 ? (
                <p className="hint" style={{ padding: "0 22px 20px" }}>No apps bought yet. Apps and bundles you buy from your app store appear here, with how each one was paid for.</p>
              ) : (
                <div className="rowlist">
                  {apps.data.map((a) => (
                    <div key={a.id} className="row-item">
                      <div className="avatar soft" aria-hidden="true"><Icon name={a.kind === "bundle" ? "box" : "grid"} size={16} /></div>
                      <div className="grow">
                        <div className="title">{a.name}</div>
                        <div className="meta">{paidWithLabel[a.paidWith]} on {fmtDate(a.purchasedAt)}</div>
                      </div>
                      <div className="r-actions">
                        <span className="chip chip-neutral">{a.kind === "bundle" ? "Bundle" : "App"}</span>
                        <span className="money">{a.priceCr.toLocaleString()} cr</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {wallet.data.spentNgn === 0 && (
            <p className="member-note block">
              <span className="ico"><Icon name="info" size={14} /></span>
              <span>
                Nothing spent yet. Your payment history will appear on the{" "}
                <Link to={`/dashboard/${slug}/billing#payments`} className="text-link">Billing page</Link> once you're on a paid plan.
              </span>
            </p>
          )}

          <details className="explainer">
            <summary><span className="ico"><Icon name="chevron-down" size={14} /></span>How the two kinds of credit work</summary>
            <p><b>App credits</b> buy apps and bundles from the app store. A typical app costs 5,000 credits (₦5,000) and an industry bundle 50,000.</p>
            <p><b>Usage credits</b> (on the Billing page) cover usage beyond your plan, such as extra visits, storage or emails.</p>
            <p>Your wallet balance can pay for either.</p>
          </details>
        </div>
      )}

      {/* Buy an app */}
      <Modal
        open={!!buyId}
        onClose={closeBuy}
        title={bought ? "It's yours" : app ? `Buy ${app.name}` : appError ? "Couldn't load this app" : "Loading…"}
        icon={bought ? "check" : "box"}
        footer={
          bought ? (
            <button className="btn btn-primary" onClick={closeBuy}>Done</button>
          ) : app ? (
            <>
              <button className="btn btn-secondary" onClick={closeBuy} disabled={buying}>Not now</button>
              <button className="btn btn-primary" onClick={buy} disabled={buying || alreadyOwned || !canAfford}>
                {buying ? "Buying…" : `Buy for ${app.priceCr.toLocaleString()} cr`}
              </button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={closeBuy}>Close</button>
          )
        }
      >
        {bought && <p>{bought.name} is on your brand for good. Install it from your app store whenever you're ready.</p>}
        {!bought && appError && <p>{appError}</p>}
        {!bought && app && wallet.data && (
          <>
            <p>{app.blurb}</p>
            {alreadyOwned ? (
              <p className="member-note block" style={{ marginTop: 12 }}>
                <span className="ico"><Icon name="check" size={14} /></span>
                This is already on your brand. Install it from your app store whenever you're ready.
              </p>
            ) : (
              <div className="field" style={{ marginTop: 14 }}>
                <span className="label">Pay with</span>
                <Segmented<"credits" | "wallet">
                  label="Pay with"
                  value={payWith}
                  onChange={setPayWith}
                  options={[
                    { value: "credits", label: `App credits, ${wallet.data.appCredits.toLocaleString()}` },
                    { value: "wallet", label: `Wallet, ${ngn(wallet.data.balanceNgn)}` },
                  ]}
                />
                {!canAfford && (
                  <p className="error-text"><Icon name="warning" size={14} />Not enough {payWith === "credits" ? "app credits" : "in your wallet"} for this. Try the other balance or top up first.</p>
                )}
              </div>
            )}
            <div className="summary">
              <div className="li"><span className="k">{app.kind === "bundle" ? "Bundle" : "App"}</span><span className="v">{app.name}</span></div>
              <div className="li"><span className="k">Price</span><span className="v">{app.priceCr.toLocaleString()} cr ({ngn(app.priceCr)})</span></div>
            </div>
          </>
        )}
      </Modal>
    </main>
  )
}
