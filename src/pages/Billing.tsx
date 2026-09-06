import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { api, fmtDate, money, ngn, PLANS, type Currency, type PlanDef, type UsageResource } from "../mock"
import { CardSkeleton, EmptyState, ErrorState, Icon, Modal, PageHeader, Pagination, SectionHead, Segmented, Skeleton, useAsync, useToast } from "../ui"

const fmt = (v: number, unit: UsageResource["unit"]) => (unit ? `${v.toLocaleString()} ${unit}` : v.toLocaleString())
const PAGE = 5
const CREDIT_PRESETS = [1000, 2000, 5000, 10000]
const MIN_CREDITS = 500
const creditsToMoney = (cr: number, currency: Currency) => money(currency === "USD" ? cr / 2000 : cr, currency)

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
  const navigate = useNavigate()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const plan = useAsync(() => api.getPlan(slug), [slug])
  const usage = useAsync(() => api.getUsage(slug), [slug])
  const payments = useAsync(() => api.listPayments(slug), [slug])
  const kyc = useAsync(() => api.getKyc(slug), [slug])
  const credits = useAsync(() => api.getCredits(slug), [slug])
  const { hash } = useLocation()

  const [showAllUsage, setShowAllUsage] = useState(false)
  const [page, setPage] = useState(1)
  const [choosing, setChoosing] = useState<PlanDef | null>(null)
  const [buying, setBuying] = useState(false)
  const [creditAmount, setCreditAmount] = useState<number>(2000)
  const [customCredits, setCustomCredits] = useState("")
  const [starting, setStarting] = useState(false)

  // Deep links (#plans, #usage, #payments) land on the section, not the top of the page.
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) el.scrollIntoView({ block: "start", behavior: "auto" })
  }, [hash, plan.loading, kyc.loading, usage.loading, credits.loading])

  const currency: Currency = brand.data?.currency ?? "NGN"
  const isActive = plan.data?.status === "active"
  const canBuyCredits = isActive
  const sortedResources = usage.data ? [...usage.data.resources].sort((a, b) => b.used / b.limit - a.used / a.limit) : []
  const visibleResources = showAllUsage ? sortedResources : sortedResources.slice(0, 3)
  const hiddenCount = sortedResources.length - 3
  const pagedPayments = payments.data ? payments.data.slice((page - 1) * PAGE, page * PAGE) : []
  const chosenCredits = customCredits ? Number(customCredits) : creditAmount
  const creditsValid = Number.isFinite(chosenCredits) && chosenCredits >= MIN_CREDITS

  const startPlanCheckout = async () => {
    if (!choosing) return
    setStarting(true)
    try {
      const { reference } = await api.startCheckout({ slug, kind: "plan", currency, planId: choosing.id })
      navigate(`/checkout/callback?ref=${reference}&brand=${slug}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't start the payment. Try again.", "error")
      setStarting(false)
    }
  }

  const startCreditsCheckout = async () => {
    if (!creditsValid) return
    setStarting(true)
    try {
      const { reference } = await api.startCheckout({ slug, kind: "credits", currency, credits: chosenCredits })
      navigate(`/checkout/callback?ref=${reference}&brand=${slug}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't start the payment. Try again.", "error")
      setStarting(false)
    }
  }

  return (
    <main className="page">
      <PageHeader slug={slug} title="Billing" sub="Your plan, usage credits, payments and buying apps for this brand." />

      <div className="stack">
        {/* Current subscription: facts as individual cards */}
        {(plan.loading || credits.loading) && (
          <div className="facts" aria-label="Loading" role="status">
            {[0, 1, 2, 3].map((i) => (<div key={i} className="card"><Skeleton h={11} w="40%" /><Skeleton h={20} w="60%" /></div>))}
          </div>
        )}
        {plan.error && <ErrorState message={plan.error} onRetry={plan.retry} />}
        {plan.data && credits.data && (
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
              {/* Usage credits (M4) */}
              <div className="card" id="credits">
                <span className="stat-title">Usage credits</span>
                <span className="fact-v">{credits.data.balanceCr.toLocaleString()} cr</span>
                {credits.data.expiringCr > 0 && credits.data.expiresOn ? (
                  <span className="hint quiet">{credits.data.expiringCr.toLocaleString()} from your plan expire {fmtDate(credits.data.expiresOn)}</span>
                ) : plan.data.monthlyCredits != null ? (
                  <span className="hint quiet">{plan.data.monthlyCredits.toLocaleString()} a month from your plan</span>
                ) : null}
                {canBuyCredits ? (
                  <button className="link-cta sm" onClick={() => setBuying(true)}>Buy credits</button>
                ) : (
                  <span className="hint quiet">Upgrade to a paid plan to buy usage credits.</span>
                )}
              </div>
            </div>
            {plan.data.status === "trial" && (
              <p className="member-note block" style={{ marginTop: 14 }}>
                <span className="ico"><Icon name="info" size={14} /></span>
                Your brand stays online through the trial. Pick a plan below and you won't be charged until the trial ends.
              </p>
            )}
          </section>
        )}

        {/* Business verification gates taking money from customers, not the plan itself. */}
        {kyc.data && kyc.data.status !== "verified" && (
          <section className={`card stat-card compact${kyc.data.status === "pending" ? "" : " tile-accent"}`} aria-label="Business verification">
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
          <section className="card anchor" id="usage" aria-label="Usage this month">
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
        <section aria-label="Plans" id="plans" className="anchor">
          <SectionHead title="Plans" hint={`Billed yearly and prepaid in ${currency === "USD" ? "US dollars" : "Naira"}. Pay by card, transfer, USSD or from your wallet.`} />
          <div className="grid-3">
            {PLANS.map((p) => {
              const isCurrent = isActive && plan.data?.name === p.name
              const price = currency === "USD" ? p.priceUsd : p.priceNgn
              return (
                <div key={p.id} className={`card plancard${isCurrent ? " current" : ""}`}>
                  <div className="card-row">
                    <h2>{p.name}</h2>
                    {isCurrent && <span className="chip chip-dark">Current plan</span>}
                  </div>
                  <div className="price">
                    <span className="n">{money(price, currency)}</span>
                    <span className="per">/ year</span>
                  </div>
                  <ul>
                    {p.features.map((f) => (
                      <li key={f}><span className="tick"><Icon name="check" size={11} /></span>{f}</li>
                    ))}
                  </ul>
                  <button className={`btn ${isCurrent ? "btn-secondary" : "btn-primary"}`} disabled={isCurrent || plan.loading || brand.loading} onClick={() => setChoosing(p)}>
                    {isCurrent ? "Current plan" : isActive ? "Switch plan" : "Choose plan"}
                  </button>
                </div>
              )
            })}
          </div>
          <p className="hint quiet" style={{ marginTop: 12 }}>One payment a year. We don't keep a card on file.</p>
        </section>

        {/* Payment history */}
        <div id="payments" className="anchor" />
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

      {/* Confirm plan, then hand off to payment */}
      <Modal
        open={choosing != null}
        onClose={() => !starting && setChoosing(null)}
        title={isActive ? `Switch to ${choosing?.name}` : `Choose ${choosing?.name}`}
        icon="card"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setChoosing(null)} disabled={starting}>Cancel</button>
            <button className="btn btn-primary" onClick={startPlanCheckout} disabled={starting}>
              {starting ? "Starting…" : (<>Continue to payment <Icon name="arrow-right" size={15} /></>)}
            </button>
          </>
        }
      >
        {choosing && (
          <>
            <p>{plan.data?.status === "trial" ? "You won't be charged until your trial ends." : isActive ? "Your new allowance starts right away. The unused part of your current year is credited." : "Your brand goes live on this plan as soon as payment clears."}</p>
            <div className="summary">
              <div className="li"><span className="k">Plan</span><span className="v">{choosing.name}</span></div>
              <div className="li"><span className="k">Monthly credits</span><span className="v">{choosing.credits.toLocaleString()} cr</span></div>
              <div className="li"><span className="k">Billing</span><span className="v">Yearly, in {currency === "USD" ? "US dollars" : "Naira"}</span></div>
              <div className="li"><span className="k">Due today</span><span className="v">{plan.data?.status === "trial" ? money(0, currency) : money(currency === "USD" ? choosing.priceUsd : choosing.priceNgn, currency)}</span></div>
            </div>
          </>
        )}
      </Modal>

      {/* Buy usage credits (M4) */}
      <Modal
        open={buying}
        onClose={() => !starting && setBuying(false)}
        title="Buy usage credits"
        icon="coins"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setBuying(false)} disabled={starting}>Cancel</button>
            <button className="btn btn-primary" onClick={startCreditsCheckout} disabled={starting || !creditsValid}>
              {starting ? "Starting…" : (<>Pay {creditsValid ? creditsToMoney(chosenCredits, currency) : ""} <Icon name="arrow-right" size={15} /></>)}
            </button>
          </>
        }
      >
        <p>Covers usage past what your plan includes. Most brands never touch it. Nothing is charged automatically. 1 credit is ₦1.</p>
        <div className="field" style={{ marginTop: 14 }}>
          <span className="label">Amount</span>
          <Segmented
            label="Credit amount"
            value={customCredits ? "custom" : String(creditAmount)}
            onChange={(v) => { if (v !== "custom") { setCreditAmount(Number(v)); setCustomCredits("") } }}
            options={[...CREDIT_PRESETS.map((c) => ({ value: String(c), label: c.toLocaleString() })), ...(customCredits ? [{ value: "custom", label: "Custom" }] : [])]}
          />
        </div>
        <div className="field">
          <label htmlFor="cr-custom">Or a custom amount<span className="optional">Min {MIN_CREDITS.toLocaleString()}</span></label>
          <div className="input-group">
            <input id="cr-custom" className="input" inputMode="numeric" placeholder={`e.g. ${(3500).toLocaleString()}`} value={customCredits} onChange={(e) => setCustomCredits(e.target.value.replace(/\D/g, ""))} />
            <span className="addon">credits</span>
          </div>
          {customCredits && !creditsValid && <p className="error-text"><Icon name="warning" size={14} />Enter at least {MIN_CREDITS.toLocaleString()} credits.</p>}
        </div>
        <div className="summary">
          <div className="li"><span className="k">Credits</span><span className="v">{creditsValid ? chosenCredits.toLocaleString() : "0"} cr</span></div>
          <div className="li"><span className="k">Total</span><span className="v">{creditsValid ? creditsToMoney(chosenCredits, currency) : money(0, currency)}</span></div>
        </div>
      </Modal>
    </main>
  )
}
