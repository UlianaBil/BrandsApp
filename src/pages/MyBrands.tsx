import { Link } from "react-router-dom"
import { api, type BrandStatus } from "../mock"
import { Icon, useAsync } from "../ui"
import { Avatar, buttonVariants, Card, Chip, PageHeader, RoleChip } from "@/ui/primitives"
import { EmptyState, ErrorState, Skeleton } from "@/ui/controls"

function BrandCardSkeleton() {
  return (
    <Card aria-hidden="true" className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3.5 w-3/5" />
          <Skeleton className="mt-2 h-2.5 w-2/5" />
        </div>
      </div>
      <div className="border-t border-[var(--ba-line)] pt-3.5">
        <Skeleton className="h-2.5 w-2/5" />
      </div>
    </Card>
  )
}

/** Lifecycle chip, shared by brand cards and the Overview header. */
export function BrandStatusChip({ status, planLabel }: { status: BrandStatus; planLabel?: string }) {
  if (status === "provisioning") {
    return (
      <Chip tone="neutral" dot={false}>
        <span
          className="size-2.5 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
          aria-hidden="true"
        />
        Setting up
      </Chip>
    )
  }
  if (status === "paused") return <Chip tone="warn">Paused</Chip>
  if (status === "suspended") return <Chip tone="bad">Suspended</Chip>
  if (planLabel && planLabel.startsWith("Free trial")) return <Chip tone="warn">{planLabel.replace("Free trial, ", "Trial, ")}</Chip>
  return <Chip tone="good">Live</Chip>
}

export default function MyBrands() {
  const brands = useAsync(() => api.listBrands(), [])

  return (
    <main className="mx-auto max-w-[1240px] px-4 pt-6 pb-[110px] min-[900px]:px-9 min-[900px]:pt-9">
      <PageHeader
        title="My Brands"
        subtitle="Every brand you own or help run, in one place."
        actions={
          // §5.2: empty state carries the primary CTA; once brands exist it
          // moves to the header as a plain white pill.
          brands.data && brands.data.length > 0 ? (
            <Link to="/dashboard/create" className={buttonVariants({ variant: "white" })}>
              <Icon name="plus" size={16} />
              New brand
            </Link>
          ) : undefined
        }
      />

      {brands.loading && (
        <div role="status" aria-label="Loading" className="grid grid-cols-1 gap-3.5 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-3">
          <BrandCardSkeleton />
          <BrandCardSkeleton />
        </div>
      )}

      {brands.error && <ErrorState what="your brands" onRetry={brands.retry} />}

      {brands.data && brands.data.length === 0 && (
        <EmptyState
          title="No brands yet"
          body="Create your first brand and get your website, storefront and business apps, all in one place."
          action={
            <Link to="/dashboard/create" className={buttonVariants({ variant: "accent" })}>
              Create your first brand
            </Link>
          }
        />
      )}

      {brands.data && brands.data.length > 0 && (
        <div className="grid grid-cols-1 gap-3.5 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-3">
          {brands.data.map((b) => (
            <Link
              key={b.slug}
              to={`/dashboard/${b.slug}`}
              aria-label={`${b.name}, open overview`}
              // Link card (§6.1): the whole card is the link; press feedback on touch.
              className="group relative flex flex-col gap-3.5 rounded-[var(--ba-r-card)] border border-[var(--ba-line)] bg-[var(--ba-paper)] p-5 shadow-[var(--ba-shadow-card)] transition-[transform,box-shadow] duration-200 [transition-timing-function:var(--ba-ease)] hover:-translate-y-0.5 hover:shadow-[var(--ba-shadow-hover)] active:scale-[0.985] active:shadow-[var(--ba-shadow-card)]"
            >
              <div className="flex items-center gap-3">
                <Avatar kind="brand" name={b.name} />
                <div className="min-w-0 flex-1">
                  <h2 title={b.name} className="truncate text-[1.02rem] font-semibold">
                    {b.name}
                  </h2>
                  <p className="truncate text-[0.8rem] text-[var(--ba-muted)]">{b.domain}</p>
                </div>
                <RoleChip role={b.role} />
              </div>
              <div className="flex items-center justify-between gap-2.5 border-t border-[var(--ba-line)] pt-3.5">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <BrandStatusChip status={b.status} planLabel={b.planLabel} />
                  {b.status === "live" && b.planStatus === "active" && (
                    <span className="text-[0.8rem] text-[var(--ba-muted)]">{b.planLabel}</span>
                  )}
                  {b.status === "paused" && <span className="text-[0.8rem] text-[var(--ba-muted)]">No plan</span>}
                </span>
                <span
                  aria-hidden="true"
                  className="grid size-[30px] shrink-0 place-items-center rounded-full text-[var(--ba-muted)] transition-colors group-hover:bg-[var(--ba-soft)] group-hover:text-[var(--ba-ink)]"
                >
                  <Icon name="arrow-up-right" size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
