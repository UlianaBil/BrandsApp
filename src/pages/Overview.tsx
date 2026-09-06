import { useEffect, useState, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { api, fmtDate, ngn, PROVISION_STEPS, type Provisioning } from "../mock"
import { Icon, useAsync, type IconName } from "../ui"
import { Avatar, buttonVariants, Card, Chip, SectionHead } from "@/ui/primitives"
import { CardSkeleton, ErrorState, InlineError, Note, Skeleton, toast } from "@/ui/controls"
import { cn } from "@/ui/cn"
import { BrandStatusChip } from "./MyBrands"

/**
 * §9/§2.1: `money`/`fmtDate` in `@/ui/controls` are written for the platform's
 * data shape — minor-unit currency and UTC-safe date strings. This mock's
 * `Plan.priceNgn` etc. are already major-unit naira, and `renewsOn` is a bare
 * `YYYY-MM-DD` (no time), so this file keeps the mock's own `ngn`/`fmtDate` —
 * using the controls versions would silently show amounts 100x too small and
 * dates a day off in negative-UTC timezones, which is a data change, not a
 * restyle.
 */

/** Link card (§6.1 `managecard`): the whole card is the link. */
function ManageCard({ to, icon, title, body }: { to: string; icon: IconName; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="group relative block rounded-[var(--ba-r-card)] border border-[var(--ba-line)] bg-[var(--ba-paper)] p-5 shadow-[var(--ba-shadow-card)] transition-[transform,box-shadow] duration-200 [transition-timing-function:var(--ba-ease)] hover:-translate-y-0.5 hover:shadow-[var(--ba-shadow-hover)] active:scale-[0.985] active:shadow-[var(--ba-shadow-card)]"
    >
      <div
        className="grid size-11 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-ink)] transition-colors group-hover:bg-[var(--ba-accent)] group-hover:text-white"
        aria-hidden="true"
      >
        <Icon name={icon} size={20} />
      </div>
      <span
        aria-hidden="true"
        className="absolute top-5 right-5 grid size-[30px] place-items-center rounded-full text-[var(--ba-muted)] transition-colors group-hover:bg-[var(--ba-soft)] group-hover:text-[var(--ba-ink)]"
      >
        <Icon name="arrow-up-right" size={16} />
      </span>
      <h2 className="mt-3.5 mb-1 text-[1rem] font-semibold tracking-[-0.01em]">{title}</h2>
      <p className="text-[0.84rem] leading-[1.45] text-[var(--ba-body)]">{body}</p>
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
    <Card aria-label="Setting up your brand" role="status" aria-live="polite">
      <div className="mb-3.5 flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-ink)]" aria-hidden="true">
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
        <div>
          <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Setting up {name}</h2>
          <p className="mt-1 text-[0.88rem] text-[var(--ba-body)]">
            This usually takes under a minute. You can leave this page. It keeps going.
          </p>
        </div>
      </div>
      <ol className="flex flex-col gap-2.5">
        {PROVISION_STEPS.map((label, i) => {
          const stepStatus = i < state.step ? "done" : i === state.step ? "current" : "todo"
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 text-[0.92rem]",
                stepStatus === "todo" && "text-[var(--ba-muted)]",
                stepStatus === "current" && "font-semibold text-[var(--ba-ink)]",
                stepStatus === "done" && "text-[var(--ba-body)]",
              )}
            >
              <span
                className={cn(
                  "grid size-[26px] shrink-0 place-items-center rounded-full",
                  stepStatus === "done" && "bg-[var(--ba-good-bg)] text-[var(--ba-good)]",
                  stepStatus === "current" && "border border-[var(--ba-line-strong)] bg-[var(--ba-paper)]",
                  stepStatus === "todo" && "bg-[var(--ba-soft)]",
                )}
              >
                {stepStatus === "done" ? (
                  <Icon name="check" size={13} />
                ) : stepStatus === "current" ? (
                  <span className="size-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                ) : null}
              </span>
              <span>{label}</span>
              {stepStatus === "done" && <span className="sr-only">done</span>}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

/** Quiet in-card navigation (§5.1 `link-cta`): text + arrow. */
function LinkCta({ to, tileAccent, children }: { to: string; tileAccent?: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center gap-1 text-[0.9rem] font-semibold transition-colors",
        tileAccent ? "text-[var(--ba-ink)] hover:text-[var(--ba-accent-deep)]" : "text-[var(--ba-ink)] hover:text-[var(--ba-accent)]",
      )}
    >
      {children}
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  )
}

/** Stat card (§6.1): icon circle + label (+ corner), hero number, one support line, action at the bottom. */
function StatCard({
  icon,
  title,
  corner,
  tileAccent,
  ariaLabel,
  children,
}: {
  icon: IconName
  title: string
  corner?: ReactNode
  tileAccent?: boolean
  ariaLabel: string
  children: ReactNode
}) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        "flex min-h-[190px] flex-col rounded-[var(--ba-r-card)] border p-[22px] shadow-[var(--ba-shadow-card)]",
        tileAccent
          ? "border-transparent bg-[var(--ba-tile)] text-[var(--ba-ink)] shadow-[0_14px_34px_-16px_rgba(234,84,45,0.35)]"
          : "border-[var(--ba-line)] bg-[var(--ba-paper)]",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full text-[var(--ba-ink)]",
            tileAccent ? "bg-white/55" : "bg-[var(--ba-soft)]",
          )}
          aria-hidden="true"
        >
          <Icon name={icon} size={16} />
        </span>
        <span className={cn("text-[0.8rem] font-medium", tileAccent ? "text-[rgba(28,28,28,0.72)]" : "text-[var(--ba-body)]")}>
          {title}
        </span>
        {corner ? <span className="ml-auto shrink-0">{corner}</span> : null}
      </div>
      {children}
    </section>
  )
}

function StatNumber({ children }: { children: ReactNode }) {
  return <div className="ba-num mt-4 text-[1.9rem] leading-[1.1] font-semibold tracking-[-0.03em]">{children}</div>
}

function StatSub({ tileAccent, children }: { tileAccent?: boolean; children: ReactNode }) {
  return (
    <p className={cn("mt-1.5 max-w-[34ch] text-[0.86rem]", tileAccent ? "text-[rgba(28,28,28,0.78)]" : "text-[var(--ba-body)]")}>
      {children}
    </p>
  )
}

function StatActions({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-4">{children}</div>
}

/** §6.10: an icon circle inside a `Note`, matching `member-note`'s layout. */
function NoticeIcon({ icon }: { icon: IconName }) {
  return (
    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white/60" aria-hidden="true">
      <Icon name={icon} size={14} />
    </span>
  )
}

export default function Overview() {
  const { slug = "" } = useParams()
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

  const page = "mx-auto max-w-[1240px] px-4 pt-6 pb-[calc(100px+env(safe-area-inset-bottom,0px))] min-[900px]:px-9 min-[900px]:pt-9 min-[900px]:pb-[110px]"

  if (brand.error) {
    // §7.2: "If the brand itself can't load, the page is only the back link
    // and one error card" — shown at every width (the `.always` back-link),
    // unlike the populated header below, which the tab bar + top-bar chevron
    // replace on phones (§3.1) and the sidebar replaces on desktop (§3.2).
    return (
      <main className={page}>
        <Link className="mb-3.5 inline-flex items-center gap-2 text-[0.9rem] font-semibold text-[var(--ba-body)] hover:text-[var(--ba-ink)]" to="/dashboard">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--ba-line)] bg-[var(--ba-paper)]">
            <Icon name="back" size={16} />
          </span>
          <span>My Brands</span>
        </Link>
        <ErrorState what="this brand" onRetry={brand.retry} />
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

  const planCorner = planTrial ? (
    needsAction ? (
      <span className="rounded-full bg-white/60 px-2.5 py-1 text-[0.74rem] font-semibold text-[var(--ba-ink)]">Free trial</span>
    ) : (
      <Chip tone="neutral" dot={false}>
        Free trial
      </Chip>
    )
  ) : plan.data?.status === "active" ? (
    <Chip tone="good">Active</Chip>
  ) : null

  return (
    <main className={page}>
      {/*
        No in-page back link here (§3.1): Overview always has a brand slug, so
        the phone top bar's chevron and the tab bar already carry this
        navigation, and the sidebar does the same on desktop — a plain
        back-link would be dead markup, suppressed at every width.
      */}

      {/* Identity pill + free-standing actions. The live-site button only appears when the site is reachable. */}
      <header aria-label="Your brand" className="mb-[22px] flex flex-wrap items-center gap-3">
        {brand.loading ? (
          <div className="flex min-h-[52px] min-w-[280px] items-center gap-3 rounded-full border border-[var(--ba-line)] bg-[var(--ba-paper)] py-1 pr-4 pl-1 shadow-[var(--ba-shadow-card)]">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="mt-2 h-2.5 w-2/5" />
            </div>
          </div>
        ) : b ? (
          <>
            <div className="flex max-w-full items-center gap-3 rounded-full border border-[var(--ba-line)] bg-[var(--ba-paper)] py-1 pr-4 pl-1 shadow-[var(--ba-shadow-card)]">
              <Avatar kind="brand" name={b.name} />
              <div className="min-w-0">
                <h1 title={b.name} className="max-w-[34ch] truncate text-[1.02rem] font-semibold tracking-[-0.015em]">
                  {b.name}
                </h1>
                <p className="flex min-w-0 items-center gap-0.5 text-[0.8rem] text-[var(--ba-muted)]">
                  <span className="min-w-0 truncate">{b.domain}</span>
                  {isLive && (
                    <button
                      type="button"
                      onClick={copyLink}
                      aria-label="Copy link to your live site"
                      className="grid size-6 shrink-0 place-items-center rounded-full text-[var(--ba-muted)] transition-colors hover:bg-[var(--ba-soft)] hover:text-[var(--ba-ink)]"
                    >
                      <Icon name="copy" size={14} />
                    </button>
                  )}
                </p>
              </div>
              <span className="mx-0.5 h-6 w-px shrink-0 bg-[var(--ba-line)]" aria-hidden="true" />
              <BrandStatusChip status={status} planLabel={planLabel} />
            </div>
            <div className="flex flex-1 flex-wrap gap-2.5 sm:flex-none">
              {status !== "suspended" && (
                <a href={b.adminUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "primary" }), "flex-1 sm:flex-none")}>
                  Open brand admin <Icon name="arrow-right" size={16} />
                </a>
              )}
              {isLive && (
                <a href={b.liveUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "secondary" }), "flex-1 sm:flex-none")}>
                  View live site <Icon name="external" size={15} />
                </a>
              )}
            </div>
          </>
        ) : null}
      </header>

      {/* Lifecycle notices (M2). One at a time, most severe first. */}
      {b && status === "suspended" && (
        <div className="mb-4">
          <Note tone="bad">
            <div className="flex items-start gap-2.5">
              <NoticeIcon icon="warning" />
              <span>This brand is suspended and visitors can&apos;t reach your site. Contact support to sort it out.</span>
            </div>
          </Note>
        </div>
      )}
      {b && status === "paused" && (
        <div className="mb-4">
          <Note tone="warn">
            <div className="flex items-start gap-2.5">
              <NoticeIcon icon="warning" />
              <span>
                Visitors can&apos;t reach your site right now. Your plan has lapsed.{" "}
                <Link to={`/dashboard/${slug}/billing#plans`} className="font-semibold underline underline-offset-2 hover:text-[var(--ba-ink)]">
                  Choose a plan
                </Link>{" "}
                to bring it back online.
              </span>
            </div>
          </Note>
        </div>
      )}
      {b && isLive && (failedDomain || pendingDomain) && (
        <div className="mb-4">
          <Note tone={failedDomain ? "neutral" : "warn"}>
            <div className="flex items-start gap-2.5">
              <NoticeIcon icon="globe" />
              <span>
                {failedDomain ? <>{failedDomain.hostname} isn&apos;t pointing at BrandsApp yet. </> : <>{pendingDomain!.hostname} is connected but still waiting on DNS. </>}
                <Link
                  to={`/dashboard/${slug}/settings/domains/${(failedDomain ?? pendingDomain)!.id}`}
                  className="font-semibold underline underline-offset-2 hover:text-[var(--ba-ink)]"
                >
                  See the records
                </Link>
              </span>
            </div>
          </Note>
        </div>
      )}

      {b && status === "provisioning" ? (
        <ProvisioningCard slug={slug} name={b.name} onDone={brand.retry} />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 min-[700px]:grid-cols-3">
          {/* Plan */}
          <StatCard icon="card" title="Plan" corner={planCorner} tileAccent={needsAction} ariaLabel="Plan">
            {plan.loading && (
              <>
                <Skeleton className="mt-4 h-[30px] w-[55%]" />
                <Skeleton className="mt-3 h-[13px] w-4/5" />
              </>
            )}
            {plan.error && <InlineError onRetry={plan.retry} />}
            {plan.data?.status === "trial" && (
              <>
                <StatNumber>{plan.data.daysLeft} days</StatNumber>
                <StatSub tileAccent={needsAction}>left in your free trial. Pick a plan to keep your brand online.</StatSub>
                <StatActions>
                  <LinkCta to={`/dashboard/${slug}/billing#plans`} tileAccent={needsAction}>
                    Choose a plan
                  </LinkCta>
                </StatActions>
              </>
            )}
            {plan.data?.status === "active" && (
              <>
                <StatNumber>{plan.data.priceNgn ? ngn(plan.data.priceNgn) : plan.data.name}</StatNumber>
                <StatSub>
                  {plan.data.name}, renews {plan.data.renewsOn && fmtDate(plan.data.renewsOn)}.
                </StatSub>
                <StatActions>
                  <LinkCta to={`/dashboard/${slug}/billing#plans`}>Manage plan</LinkCta>
                </StatActions>
              </>
            )}
            {plan.data?.status === "none" && (
              <>
                <StatNumber>No plan</StatNumber>
                <StatSub tileAccent={needsAction}>
                  {status === "paused" ? "Choose one to bring this brand back online." : "Choose one to keep this brand online."}
                </StatSub>
                <StatActions>
                  <LinkCta to={`/dashboard/${slug}/billing#plans`} tileAccent={needsAction}>
                    Choose a plan
                  </LinkCta>
                </StatActions>
              </>
            )}
          </StatCard>

          {/* Usage */}
          <StatCard
            icon="globe"
            title="Usage"
            corner={usage.data ? <span className="text-[0.78rem] text-[var(--ba-muted)]">{usage.data.period}</span> : null}
            ariaLabel="Usage"
          >
            {usage.loading && (
              <>
                <Skeleton className="mt-4 h-[30px] w-[55%]" />
                <Skeleton className="mt-3 h-[13px] w-4/5" />
              </>
            )}
            {usage.error && <InlineError onRetry={usage.retry} />}
            {usage.data && (
              <>
                <StatNumber>{usage.data.requests.toLocaleString()}</StatNumber>
                <StatSub>
                  visits this month, {usage.data.storageMb} MB of storage and {usage.data.emailsSent.toLocaleString()} emails sent
                </StatSub>
                <StatActions>
                  <LinkCta to={`/dashboard/${slug}/billing#usage`}>Usage &amp; credits</LinkCta>
                </StatActions>
              </>
            )}
            {!usage.loading && !usage.error && !usage.data && (
              <p className="mt-3 text-[0.86rem] text-[var(--ba-body)]">No usage yet. It appears once your site gets its first visits.</p>
            )}
          </StatCard>

          {/* Wallet: one number only. The breakdown lives on Finances. */}
          <StatCard icon="wallet" title="Wallet balance" ariaLabel="Wallet balance">
            {wallet.loading && (
              <>
                <Skeleton className="mt-4 h-[30px] w-[55%]" />
                <Skeleton className="mt-3 h-[13px] w-4/5" />
              </>
            )}
            {wallet.error && <InlineError onRetry={wallet.retry} />}
            {wallet.data && (
              <>
                <StatNumber>{ngn(wallet.data.balanceNgn)}</StatNumber>
                <StatSub>Earned by your brand. Spend it on your plan, credits or apps.</StatSub>
                <StatActions>
                  <LinkCta to={`/dashboard/${slug}/finances`}>View finances</LinkCta>
                </StatActions>
              </>
            )}
          </StatCard>
        </div>
      )}

      <SectionHead title="Manage this brand" />
      {brand.loading ? (
        <CardSkeleton lines={2} />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 min-[520px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1240px]:grid-cols-5">
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
