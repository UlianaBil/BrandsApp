import { useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { api, fmtDate, ngn, type CatalogApp, type OwnedApp } from "../mock"
import { Icon, useAsync, type IconName } from "../ui"
import { Avatar, buttonVariants, Card, Chip, PageHeader } from "@/ui/primitives"
import { CardSkeleton, ErrorState, Modal, Segmented, toast } from "@/ui/controls"
import { cn } from "@/ui/cn"

/**
 * Ula's stat card (§6.1): icon circle + label, hero number, one support line,
 * min-height 190px so a row aligns. No primitive for this shape exists yet, so
 * it's built here from `Card` + tokens rather than added to primitives.tsx.
 */
function Stat({ icon, label, value, hint, tag }: { icon: IconName; label: string; value: string; hint: string; tag?: React.ReactNode }) {
  return (
    <Card className="flex min-h-[190px] flex-col" aria-label={label}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-body)]">
          <Icon name={icon} size={16} />
        </span>
        <span className="text-[0.8rem] font-medium text-[var(--ba-body)]">{label}</span>
        {tag ? <span className="ml-auto">{tag}</span> : null}
      </div>
      <div className="ba-num mt-4 text-[1.4rem] font-semibold tracking-[-0.03em]">{value}</div>
      <p className="mt-1.5 max-w-[34ch] text-[0.86rem] text-[var(--ba-body)]">{hint}</p>
    </Card>
  )
}

const paidWithLabel: Record<OwnedApp["paidWith"], string> = {
  credits: "Paid with app credits",
  wallet: "Paid from your wallet",
  card: "Paid by card",
  plan: "Included in your plan",
}

/** Brand sub-page: desktop-only identity pill back to Overview (§3.2 item 2).
 * The mobile back link is skipped here on purpose — the top bar's back
 * chevron already carries that navigation on every brand page (§3.1). */
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

export default function Finances() {
  const { slug = "" } = useParams()
  const [params, setParams] = useSearchParams()
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
    <main className="mx-auto max-w-[1240px] px-4 pt-6 pb-[110px] min-[900px]:px-9 min-[900px]:pt-9">
      <ContextPill slug={slug} name={brand.data?.name} />
      <PageHeader title="Finances" subtitle="What this brand has made, spent, and can spend right now." />

      {wallet.loading && (
        <div className="flex flex-col gap-3.5">
          <CardSkeleton lines={2} />
          <div className="grid grid-cols-1 gap-3.5 min-[700px]:grid-cols-3">
            <CardSkeleton lines={1} />
            <CardSkeleton lines={1} />
            <CardSkeleton lines={1} />
          </div>
        </div>
      )}
      {wallet.error && <ErrorState what="your wallet" onRetry={wallet.retry} />}

      {wallet.data && (
        <div className="flex flex-col gap-3.5">
          <Card className="flex min-h-[190px] flex-col" aria-label="Wallet balance">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-body)]">
                <Icon name="wallet" size={16} />
              </span>
              <span className="text-[0.8rem] font-medium text-[var(--ba-body)]">Wallet balance</span>
              <Chip tone="good" className="ml-auto">Spendable now</Chip>
            </div>
            <div className="ba-num mt-4 text-[2.6rem] font-semibold tracking-[-0.03em]">{ngn(wallet.data.balanceNgn)}</div>
            <p className="mt-1.5 max-w-[52ch] text-[0.86rem] text-[var(--ba-body)]">
              Sales and commissions your brand has earned. Use it for your plan, usage credits or apps instead of a card.
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-4">
              <Link to={`/dashboard/${slug}/billing#plans`} className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
                Pay for a plan <Icon name="arrow-right" size={14} />
              </Link>
              {brand.data && (
                <a className={cn(buttonVariants({ variant: "secondary", size: "sm" }))} href={`${brand.data.adminUrl}/app-store`} target="_blank" rel="noreferrer">
                  Browse apps <Icon name="external" size={13} />
                </a>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-3.5 min-[700px]:grid-cols-3">
            <Stat icon="trend-up" label="Money in" value={ngn(wallet.data.earnedNgn)} hint="Everything paid into your wallet so far." />
            <Stat icon="trend-down" label="Money out" value={ngn(wallet.data.spentNgn)} hint="Plan payments, top-ups and apps that went through." />
            <Stat icon="coins" label="App credits" value={wallet.data.appCredits.toLocaleString()} hint="Credit for buying apps. 1 credit is ₦1." />
          </div>

          {/* Apps and bundles you own (M6) */}
          {apps.loading && <CardSkeleton lines={2} />}
          {apps.error && <ErrorState what="your owned apps" onRetry={apps.retry} />}
          {apps.data && (
            <Card flush aria-label="Apps and bundles you own">
              <div className="flex items-start justify-between gap-3 px-[22px] pt-5">
                <div>
                  <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Apps and bundles you own</h2>
                  <p className="mt-0.5 text-[0.88rem] text-[var(--ba-body)]">Yours for good. Install any of them from your app store whenever you're ready.</p>
                </div>
                {apps.data.length > 0 && <Chip tone="neutral" dot={false}>{apps.data.length}</Chip>}
              </div>
              {apps.data.length === 0 ? (
                <p className="px-[22px] pt-3.5 pb-5 text-[0.88rem] text-[var(--ba-body)]">
                  No apps bought yet. Apps and bundles you buy from your app store appear here, with how each one was paid for.
                </p>
              ) : (
                <div className="mt-3.5 flex flex-col [&>*+*]:border-t [&>*+*]:border-[var(--ba-line)]">
                  {apps.data.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 px-[22px] py-3.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-body)]">
                        <Icon name={a.kind === "bundle" ? "box" : "grid"} size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[0.94rem] font-semibold [overflow-wrap:anywhere]">{a.name}</div>
                        <div className="text-[0.83rem] text-[var(--ba-muted)] [overflow-wrap:anywhere]">{paidWithLabel[a.paidWith]} on {fmtDate(a.purchasedAt)}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Chip tone="neutral" dot={false}>{a.kind === "bundle" ? "Bundle" : "App"}</Chip>
                        <span className="ba-num font-semibold">{a.priceCr.toLocaleString()} cr</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {wallet.data.spentNgn === 0 && (
            <div className="flex w-fit max-w-full items-center gap-2.5 rounded-2xl border border-[var(--ba-line)] bg-[var(--ba-paper)] px-4 py-2.5 text-[0.88rem] text-[var(--ba-body)]">
              <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-ink)]">
                <Icon name="info" size={14} />
              </span>
              <span>
                Nothing spent yet. Your payment history will appear on the{" "}
                <Link to={`/dashboard/${slug}/billing#payments`} className="font-semibold text-[var(--ba-ink)] underline underline-offset-2">
                  Billing page
                </Link>{" "}
                once you&apos;re on a paid plan.
              </span>
            </div>
          )}

          <details className="group rounded-2xl border border-[var(--ba-line)] bg-[var(--ba-paper)] px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 text-[0.9rem] font-semibold text-[var(--ba-ink)] marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] transition-transform duration-200 group-open:rotate-180">
                <Icon name="chevron-down" size={14} />
              </span>
              How the two kinds of credit work
            </summary>
            <div className="mt-2.5 ml-9 flex flex-col gap-1.5 text-[0.87rem] text-[var(--ba-body)]">
              <p><b>App credits</b> buy apps and bundles from the app store. A typical app costs 5,000 credits (₦5,000) and an industry bundle 50,000.</p>
              <p><b>Usage credits</b> (on the Billing page) cover usage beyond your plan, such as extra visits, storage or emails.</p>
              <p>Your wallet balance can pay for either.</p>
            </div>
          </details>
        </div>
      )}

      {/*
        Buy an app. Modal's built-in footer only has two shapes (a Cancel/Confirm
        pair, or a single "Close"), so the original single primary "Done" button
        on success falls back to that default "Close" — a copy difference noted
        in the handoff, not a behaviour one (both just dismiss the dialog).
        Likewise `pending` disables Cancel too while the purchase is blocked
        (already owned / can't afford), where the original only disabled Buy;
        Escape and the scrim still close the dialog either way.
      */}
      <Modal
        open={!!buyId}
        onClose={closeBuy}
        title={bought ? "It's yours" : app ? `Buy ${app.name}` : appError ? "Couldn't load this app" : "Loading…"}
        body={
          bought ? `${bought.name} is on your brand for good. Install it from your app store whenever you're ready.` :
          !app && appError ? appError : undefined
        }
        confirmLabel={!bought && app ? (buying ? "Buying…" : `Buy for ${app.priceCr.toLocaleString()} cr`) : undefined}
        onConfirm={!bought && app ? buy : undefined}
        pending={buying || (!!app && (alreadyOwned || !canAfford))}
        cancelLabel="Not now"
      >
        {!bought && app && wallet.data ? (
          <>
            <p className="text-[0.9rem] text-[var(--ba-body)]">{app.blurb}</p>
            {alreadyOwned ? (
              <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-[var(--ba-line)] bg-[var(--ba-paper)] px-4 py-3 text-[0.88rem] text-[var(--ba-body)]">
                <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-ink)]">
                  <Icon name="check" size={14} />
                </span>
                This is already on your brand. Install it from your app store whenever you&apos;re ready.
              </div>
            ) : (
              <div className="mt-3.5 grid gap-[7px]">
                <span className="text-[0.88rem] font-semibold text-[var(--ba-ink)]">Pay with</span>
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
                  <p className="flex items-center gap-1.5 text-[0.82rem] text-[var(--ba-bad)]">
                    <Icon name="warning" size={14} />
                    Not enough {payWith === "credits" ? "app credits" : "in your wallet"} for this. Try the other balance or top up first.
                  </p>
                )}
              </div>
            )}
            <div className="mt-3.5 flex flex-col gap-2 rounded-[var(--ba-r-field)] bg-[var(--ba-soft)] p-3.5 text-[0.88rem]">
              <div className="flex justify-between gap-3"><span className="text-[var(--ba-body)]">{app.kind === "bundle" ? "Bundle" : "App"}</span><span className="font-semibold">{app.name}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[var(--ba-body)]">Price</span><span className="font-semibold">{app.priceCr.toLocaleString()} cr ({ngn(app.priceCr)})</span></div>
            </div>
          </>
        ) : null}
      </Modal>
    </main>
  )
}
