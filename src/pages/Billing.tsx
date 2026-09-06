import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { api, fmtDate, money, ngn, PLANS, type Currency, type PlanDef, type UsageResource } from "../mock"
import { Icon, useAsync } from "../ui"
import { Avatar, buttonVariants, Button, Card, Chip, Meter, PageHeader, SectionHead } from "@/ui/primitives"
import { CardSkeleton, EmptyState, ErrorState, Field, Input, InputGroup, Modal, Pagination, Segmented, toast } from "@/ui/controls"
import { cn } from "@/ui/cn"

const fmt = (v: number, unit: UsageResource["unit"]) => (unit ? `${v.toLocaleString()} ${unit}` : v.toLocaleString())
const PAGE = 5
const CREDIT_PRESETS = [1000, 2000, 5000, 10000]
const MIN_CREDITS = 500
const creditsToMoney = (cr: number, currency: Currency) => money(currency === "USD" ? cr / 2000 : cr, currency)

/**
 * Money and dates here keep mock.ts's own `money`/`ngn`/`fmtDate` rather than
 * the ones in @/ui/controls: her mock values are already in whole Naira (not
 * minor units), and her `fmtDate` pins the ISO string to local midnight before
 * formatting. Routing them through the new helpers would either divide every
 * amount by 100 or shift a date by a day in some timezones — both of which
 * this task's brief says not to do.
 */

/** Brand sub-page: desktop-only identity pill back to Overview (§3.2 item 2).
 * The mobile back link is skipped on purpose — the top bar's back chevron
 * already carries that navigation on every brand page (§3.1). */
function ContextPill({ slug, name }: { slug: string; name?: string }) {
  return (
    <Link
      to={`/dashboard/${slug}`}
      className="mb-3 hidden max-w-full min-[900px]:inline-flex items-center gap-2 rounded-full border border-[var(--ba-line)] bg-[var(--ba-paper)] py-0.5 pr-3 pl-0.5 text-[0.82rem] font-semibold text-[var(--ba-body)] hover:bg-[var(--ba-soft)] hover:text-[var(--ba-ink)]"
    >
      <Avatar name={name ?? ""} kind="brand" size={24} />
      <span className="truncate">{name}</span>
    </Link>
  )
}

/** A fact card (§6.1): label over a single value, for a short "current state" fact. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-2 px-5 py-[18px]">
      <span className="text-[0.8rem] font-medium text-[var(--ba-body)]">{label}</span>
      <span className="ba-num text-[1.15rem] font-semibold tracking-[-0.02em]">{children}</span>
    </Card>
  )
}

export default function Billing() {
  const { slug = "" } = useParams()
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
    <main className="mx-auto max-w-[1240px] px-4 pt-6 pb-[110px] min-[900px]:px-9 min-[900px]:pt-9">
      <ContextPill slug={slug} name={brand.data?.name} />
      <PageHeader title="Billing" subtitle="Your plan, usage credits, payments and buying apps for this brand." />

      <div className="flex flex-col gap-3.5">
        {/* Current subscription: facts as individual cards */}
        {(plan.loading || credits.loading) && (
          <div className="grid grid-cols-2 gap-2.5 min-[700px]:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] min-[700px]:gap-3.5" aria-label="Loading" role="status">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="flex flex-col gap-2 px-5 py-[18px]">
                <div className="h-[11px] w-[40%] animate-pulse rounded-full bg-[var(--ba-soft)]" />
                <div className="h-5 w-[60%] animate-pulse rounded-full bg-[var(--ba-soft)]" />
              </Card>
            ))}
          </div>
        )}
        {plan.error && <ErrorState what="your plan" onRetry={plan.retry} />}
        {plan.data && credits.data && (
          <section aria-label="Current subscription">
            <div className="grid grid-cols-2 gap-2.5 min-[700px]:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] min-[700px]:gap-3.5">
              <Fact label="Plan">{plan.data.status === "none" ? "No plan" : plan.data.name}</Fact>
              <Fact label="Status">
                {plan.data.status === "trial" && <Chip tone="warn">Free trial</Chip>}
                {plan.data.status === "active" && <Chip tone="good">Active</Chip>}
                {plan.data.status === "none" && <Chip tone="neutral">Inactive</Chip>}
              </Fact>
              {plan.data.status === "trial" && <Fact label="Trial ends">in {plan.data.daysLeft} days</Fact>}
              {plan.data.status === "active" && <Fact label="Renews">{plan.data.renewsOn && fmtDate(plan.data.renewsOn)}</Fact>}
              {/* Usage credits (M4) */}
              <Card className="flex flex-col gap-2 px-5 py-[18px]" id="credits">
                <span className="text-[0.8rem] font-medium text-[var(--ba-body)]">Usage credits</span>
                <span className="ba-num text-[1.15rem] font-semibold tracking-[-0.02em]">{credits.data.balanceCr.toLocaleString()} cr</span>
                {credits.data.expiringCr > 0 && credits.data.expiresOn ? (
                  <span className="text-[0.78rem] text-[var(--ba-muted)]">{credits.data.expiringCr.toLocaleString()} from your plan expire {fmtDate(credits.data.expiresOn)}</span>
                ) : plan.data.monthlyCredits != null ? (
                  <span className="text-[0.78rem] text-[var(--ba-muted)]">{plan.data.monthlyCredits.toLocaleString()} a month from your plan</span>
                ) : null}
                {canBuyCredits ? (
                  <button className="w-fit text-[0.84rem] font-semibold text-[var(--ba-ink)] after:ml-1 after:content-['→']" onClick={() => setBuying(true)}>
                    Buy credits
                  </button>
                ) : (
                  <span className="text-[0.78rem] text-[var(--ba-muted)]">Upgrade to a paid plan to buy usage credits.</span>
                )}
              </Card>
            </div>
            {plan.data.status === "trial" && (
              <div className="mt-3.5 flex w-fit max-w-full items-start gap-2.5 rounded-2xl border border-[var(--ba-line)] bg-[var(--ba-paper)] px-4 py-2.5 text-[0.88rem] text-[var(--ba-body)]">
                <span className="mt-[-1px] grid size-[26px] shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-ink)]">
                  <Icon name="info" size={14} />
                </span>
                Your brand stays online through the trial. Pick a plan below and you won&apos;t be charged until the trial ends.
              </div>
            )}
          </section>
        )}

        {/* Business verification gates taking money from customers, not the plan itself. */}
        {kyc.data && kyc.data.status !== "verified" && (
          <Card
            aria-label="Business verification"
            className={cn(
              "flex min-h-0 flex-col",
              // §7.7 needs-action: peach only for not-started/rejected; a pending review stays plain with a warn chip.
              kyc.data.status !== "pending" && "border-transparent bg-[var(--ba-tile)] text-[var(--ba-ink)] shadow-[0_14px_34px_-16px_rgba(234,84,45,0.35)]",
            )}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  kyc.data.status !== "pending" ? "bg-white/55 text-[var(--ba-ink)]" : "bg-[var(--ba-soft)] text-[var(--ba-body)]",
                )}
              >
                <Icon name="shield" size={16} />
              </span>
              <span className={cn("text-[0.8rem] font-medium", kyc.data.status !== "pending" ? "text-[rgba(28,28,28,0.72)]" : "text-[var(--ba-body)]")}>
                Business verification
              </span>
              <span className="ml-auto">
                {kyc.data.status === "pending" && <Chip tone="warn">Pending review</Chip>}
                {/*
                  Rejected/Not started render as a bare, uncoloured label in
                  Ula's original CSS (plain `.chip`, no tone modifier, no dot)
                  — kept as-is rather than "corrected" to chip-bad/neutral,
                  since this is a restyle, not a fix to the source design.
                */}
                {kyc.data.status === "rejected" && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[0.74rem] font-semibold tracking-[0.01em] whitespace-nowrap">Rejected</span>
                )}
                {kyc.data.status === "not_started" && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[0.74rem] font-semibold tracking-[0.01em] whitespace-nowrap">Not started</span>
                )}
              </span>
            </div>
            <h2 className="mt-3.5 text-[1.1rem] font-semibold tracking-[-0.01em]">
              {kyc.data.status === "pending" ? "Your verification is under review" : "Verify your business to accept payments"}
            </h2>
            <p className={cn("mt-1.5 max-w-[60ch] text-[0.86rem]", kyc.data.status !== "pending" ? "text-[rgba(28,28,28,0.78)]" : "text-[var(--ba-body)]")}>
              {kyc.data.status === "pending"
                ? "We're confirming your business and settlement account. Card and bank payments switch on as soon as it's approved."
                : kyc.data.status === "rejected"
                  ? `${kyc.data.reason ?? "Something didn't match on your last submission."} Check your details and submit again.`
                  : "Complete KYC (business + bank verification) to take card and bank payments from your customers. Your own plan doesn't need it."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link
                to={`/dashboard/${slug}/kyc`}
                className={cn(buttonVariants({ variant: kyc.data.status === "pending" ? "secondary" : "primary", size: "sm" }))}
              >
                {kyc.data.status === "pending" ? "View submission" : kyc.data.status === "rejected" ? "Fix and resubmit" : "Complete KYC"}
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>
          </Card>
        )}

        {/* Usage vs allowance */}
        {usage.loading && <CardSkeleton lines={3} />}
        {usage.error && <ErrorState what="usage" onRetry={usage.retry} />}
        {usage.data && (
          <Card className="scroll-mt-4 max-[899px]:scroll-mt-[72px]" id="usage" aria-label="Usage this month">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Usage this month</h2>
                <p className="text-[0.88rem] text-[var(--ba-body)]">Sorted by how close each is to its limit.</p>
              </div>
              <Chip tone="neutral" dot={false}>{usage.data.period}</Chip>
            </div>
            <div className="flex flex-col gap-3.5">
              {visibleResources.map((r) => (
                <Meter key={r.key} value={r.used} max={r.limit} label={r.label} right={`${fmt(r.used, r.unit)} of ${fmt(r.limit, r.unit)}`} />
              ))}
            </div>
            {hiddenCount > 0 && (
              <Button variant="secondary" size="sm" className="mt-3" aria-expanded={showAllUsage} onClick={() => setShowAllUsage((v) => !v)}>
                {showAllUsage ? "Show less" : `Show ${hiddenCount} more`}
                <Icon name="chevron-down" size={14} />
              </Button>
            )}
            <p className="mt-3.5 text-[0.83rem] text-[var(--ba-muted)]">
              Past an allowance, extra usage draws down your plan&apos;s credits (1 credit = ₦1). If credits run out, usage pauses until you top up or upgrade.
            </p>
          </Card>
        )}

        {/* Plans */}
        <section aria-label="Plans" id="plans" className="scroll-mt-4 max-[899px]:scroll-mt-[72px]">
          <SectionHead
            title="Plans"
            hint={`Billed yearly and prepaid in ${currency === "USD" ? "US dollars" : "Naira"}. Pay by card, transfer, USSD or from your wallet.`}
          />
          <div className="grid grid-cols-1 gap-3.5 min-[700px]:grid-cols-3">
            {PLANS.map((p) => {
              const isCurrent = isActive && plan.data?.name === p.name
              const price = currency === "USD" ? p.priceUsd : p.priceNgn
              return (
                <Card key={p.id} className={cn("flex flex-col", isCurrent && "shadow-[var(--ba-shadow-card),inset_0_0_0_1px_var(--ba-dark)]")}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">{p.name}</h2>
                    {isCurrent && <Chip tone="dark" dot={false}>Current plan</Chip>}
                  </div>
                  <div className="mt-2.5 mb-1 flex items-baseline gap-1">
                    <span className="ba-num text-[1.7rem] font-semibold tracking-[-0.03em]">{money(price, currency)}</span>
                    <span className="text-[0.85rem] text-[var(--ba-muted)]">/ year</span>
                  </div>
                  <ul className="my-3 mb-[18px] flex flex-col gap-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[0.88rem] text-[var(--ba-body)]">
                        <span className="mt-px grid size-[18px] shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-ink)]">
                          <Icon name="check" size={11} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={isCurrent ? "secondary" : "primary"}
                    className="mt-auto"
                    disabled={isCurrent || plan.loading || brand.loading}
                    onClick={() => setChoosing(p)}
                  >
                    {isCurrent ? "Current plan" : isActive ? "Switch plan" : "Choose plan"}
                  </Button>
                </Card>
              )
            })}
          </div>
          <p className="mt-3 text-[0.83rem] text-[var(--ba-muted)]">One payment a year. We don&apos;t keep a card on file.</p>
        </section>

        {/* Payment history */}
        <div id="payments" className="scroll-mt-4 max-[899px]:scroll-mt-[72px]" />
        <SectionHead title="Payment history" />
        {payments.loading && <CardSkeleton lines={2} />}
        {payments.error && <ErrorState what="your payment history" onRetry={payments.retry} />}
        {payments.data && payments.data.length === 0 && (
          // The new EmptyState has one fixed icon (no per-screen `icon` prop like
          // the old one), so this loses the "receipt" glyph in favour of the
          // primitive's generic empty-state icon.
          <EmptyState title="No payments yet" body="Once you're on a paid plan, every charge shows up here with a receipt." />
        )}
        {payments.data && payments.data.length > 0 && (
          <Card flush aria-label="Payment history">
            <div className="flex flex-col pt-[18px]">
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_110px] items-center gap-4 px-[22px] py-3.5 text-[0.72rem] font-semibold tracking-[0.06em] text-[var(--ba-muted)] uppercase">
                <span>Description</span>
                <span>Date</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Status</span>
              </div>
              {pagedPayments.map((p) => (
                <div key={p.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_110px] items-center gap-4 border-t border-[var(--ba-line)] px-[22px] py-3.5">
                  <span className="min-w-0 truncate text-[0.92rem] font-semibold">{p.description}</span>
                  <span className="min-w-0 text-[0.86rem] text-[var(--ba-muted)]">{fmtDate(p.date)}</span>
                  <span className="ba-num text-right text-[0.92rem] font-semibold">{ngn(p.amountNgn)}</span>
                  <span className="flex justify-end">
                    <Chip tone={p.status === "paid" ? "good" : "bad"}>{p.status === "paid" ? "Paid" : "Failed"}</Chip>
                  </span>
                </div>
              ))}
            </div>
            {payments.data.length > PAGE && (
              <Pagination page={page} pageSize={PAGE} total={payments.data.length} onChange={setPage} noun="payments" />
            )}
          </Card>
        )}
      </div>

      {/* Confirm plan, then hand off to payment */}
      <Modal
        open={choosing != null}
        onClose={() => !starting && setChoosing(null)}
        title={isActive ? `Switch to ${choosing?.name}` : `Choose ${choosing?.name}`}
        body={
          plan.data?.status === "trial"
            ? "You won't be charged until your trial ends."
            : isActive
              ? "Your new allowance starts right away. The unused part of your current year is credited."
              : "Your brand goes live on this plan as soon as payment clears."
        }
        confirmLabel={starting ? "Starting…" : "Continue to payment"}
        onConfirm={startPlanCheckout}
        pending={starting}
      >
        {choosing && (
          <div className="mt-3.5 flex flex-col gap-2 rounded-[var(--ba-r-field)] bg-[var(--ba-soft)] p-3.5 text-[0.88rem]">
            <div className="flex justify-between gap-3"><span className="text-[var(--ba-body)]">Plan</span><span className="font-semibold">{choosing.name}</span></div>
            <div className="flex justify-between gap-3"><span className="text-[var(--ba-body)]">Monthly credits</span><span className="font-semibold">{choosing.credits.toLocaleString()} cr</span></div>
            <div className="flex justify-between gap-3"><span className="text-[var(--ba-body)]">Billing</span><span className="font-semibold">Yearly, in {currency === "USD" ? "US dollars" : "Naira"}</span></div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--ba-body)]">Due today</span>
              <span className="font-semibold">{plan.data?.status === "trial" ? money(0, currency) : money(currency === "USD" ? choosing.priceUsd : choosing.priceNgn, currency)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Buy usage credits (M4) */}
      <Modal
        open={buying}
        onClose={() => !starting && setBuying(false)}
        title="Buy usage credits"
        body="Covers usage past what your plan includes. Most brands never touch it. Nothing is charged automatically. 1 credit is ₦1."
        confirmLabel={starting ? "Starting…" : `Pay ${creditsValid ? creditsToMoney(chosenCredits, currency) : ""}`}
        onConfirm={startCreditsCheckout}
        pending={starting || !creditsValid}
      >
        <div className="mt-3.5 grid gap-[7px]">
          <span className="text-[0.88rem] font-semibold text-[var(--ba-ink)]">Amount</span>
          <Segmented
            label="Credit amount"
            value={customCredits ? "custom" : String(creditAmount)}
            onChange={(v) => {
              if (v !== "custom") {
                setCreditAmount(Number(v))
                setCustomCredits("")
              }
            }}
            options={[
              ...CREDIT_PRESETS.map((c) => ({ value: String(c), label: c.toLocaleString() })),
              ...(customCredits ? [{ value: "custom", label: "Custom" }] : []),
            ]}
          />
        </div>
        {/*
          Ula's label put "Min 500" where Field's `optional` suffix always says
          the literal word "Optional" — not customisable — so the minimum is
          carried in the help line instead, and only replaced by the error.
        */}
        <Field label="Or a custom amount" htmlFor="cr-custom" help={`Min ${MIN_CREDITS.toLocaleString()}`} error={customCredits && !creditsValid ? `Enter at least ${MIN_CREDITS.toLocaleString()} credits.` : undefined}>
          <InputGroup suffix="credits">
            <Input
              id="cr-custom"
              inputMode="numeric"
              placeholder={`e.g. ${(3500).toLocaleString()}`}
              value={customCredits}
              onChange={(e) => setCustomCredits(e.target.value.replace(/\D/g, ""))}
            />
          </InputGroup>
        </Field>
        <div className="mt-3.5 flex flex-col gap-2 rounded-[var(--ba-r-field)] bg-[var(--ba-soft)] p-3.5 text-[0.88rem]">
          <div className="flex justify-between gap-3"><span className="text-[var(--ba-body)]">Credits</span><span className="font-semibold">{creditsValid ? chosenCredits.toLocaleString() : "0"} cr</span></div>
          <div className="flex justify-between gap-3"><span className="text-[var(--ba-body)]">Total</span><span className="font-semibold">{creditsValid ? creditsToMoney(chosenCredits, currency) : money(0, currency)}</span></div>
        </div>
      </Modal>
    </main>
  )
}
