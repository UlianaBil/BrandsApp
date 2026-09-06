import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api, money, ngn, type Listing } from "../mock"
import { Icon, useAsync } from "../ui"
import { Avatar, Button, buttonVariants, Card, Chip, PageHeader } from "@/ui/primitives"
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  RowMenu,
  SearchField,
  Segmented,
  Skeleton,
  toast,
} from "@/ui/controls"

export default function Marketplace() {
  const { slug = "" } = useParams()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const listings = useAsync(() => api.listListings(), [])
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("all")
  const [buying, setBuying] = useState<Listing | null>(null)
  const [reporting, setReporting] = useState<Listing | null>(null)
  const [pageId, setPageId] = useState("")
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN")
  const [busy, setBusy] = useState(false)

  const categories = useMemo(() => Array.from(new Set((listings.data ?? []).map((l) => l.category))), [listings.data])
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (listings.data ?? []).filter(
      (l) => (cat === "all" || l.category === cat) && (!needle || `${l.title} ${l.author} ${l.category}`.toLowerCase().includes(needle)),
    )
  }, [listings.data, q, cat])

  const openBuy = (l: Listing) => {
    setPageId("")
    setCurrency(brand.data?.currency === "USD" && l.priceUsd ? "USD" : "NGN")
    setBuying(l)
  }

  const buy = async () => {
    if (!buying) return
    if (!pageId.trim()) {
      toast("Enter the page to install into.", "error")
      return
    }
    setBusy(true)
    try {
      await api.purchaseListing(slug, buying.id, pageId.trim(), currency)
      toast(`${buying.title} installed into ${pageId.trim()}`, "success")
      setBuying(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't complete the purchase. Try again.", "error")
    } finally {
      setBusy(false)
    }
  }

  const report = async () => {
    if (!reporting) return
    setBusy(true)
    try {
      await api.reportListing(reporting.id)
      toast("Reported. Our team will review it.", "success")
      setReporting(null)
    } catch {
      toast("Couldn't send the report. Try again.", "error")
    } finally {
      setBusy(false)
    }
  }

  const hasListings = !!listings.data && listings.data.length > 0

  return (
    <main className="mx-auto max-w-[1240px] px-4 pt-6 pb-[110px] min-[900px]:px-9 min-[900px]:pt-9">
      {/* §3.2: desktop-only identity chip back to Overview — the phone top bar
          already carries the brand name and back chevron on every brand page. */}
      {brand.data ? (
        <Link
          to={`/dashboard/${slug}`}
          aria-label={`${brand.data.name} overview`}
          className="mb-3 hidden max-w-full items-center gap-2 rounded-full border border-[var(--ba-line)] bg-[var(--ba-paper)] py-[3px] pr-3 pl-[3px] text-[0.82rem] font-semibold text-[var(--ba-body)] transition-colors hover:bg-[var(--ba-soft)] hover:text-[var(--ba-ink)] min-[900px]:inline-flex"
        >
          <Avatar name={brand.data.name} kind="brand" size={24} />
          <span className="truncate">{brand.data.name}</span>
        </Link>
      ) : !brand.error ? (
        <div className="mb-3 hidden items-center gap-2 min-[900px]:flex">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      ) : null}

      <PageHeader
        title="Marketplace"
        subtitle="Page sections built by other creators. They install straight into your site."
        actions={
          hasListings ? (
            <Link to={`/dashboard/${slug}/marketplace/sell`} className={buttonVariants({ variant: "white" })}>
              <Icon name="sparkle" size={15} /> Sell a section
            </Link>
          ) : undefined
        }
      />

      {hasListings && (
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <SearchField value={q} onChange={setQ} placeholder="Search sections or creators" label="Search the marketplace" />
          <Segmented
            label="Filter by category"
            value={cat}
            onChange={setCat}
            options={[{ value: "all", label: "All" }, ...categories.map((c) => ({ value: c, label: c }))]}
          />
        </div>
      )}

      {listings.loading && (
        <div className="grid grid-cols-1 gap-3.5 min-[700px]:grid-cols-3">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
        </div>
      )}
      {listings.error && <ErrorState what="the marketplace" onRetry={listings.retry} />}

      {listings.data && listings.data.length === 0 && (
        <EmptyState
          title="Nothing for sale yet"
          body="The marketplace is new. Sections from other creators will appear here. You could be first: sell one of yours."
          action={
            <Link to={`/dashboard/${slug}/marketplace/sell`} className={buttonVariants({ variant: "primary" })}>
              Sell a section
            </Link>
          }
        />
      )}

      {hasListings && filtered.length === 0 && (
        <EmptyState
          title="No sections match"
          body={`Nothing matches "${q.trim()}"${cat !== "all" ? ` in ${cat}` : ""}. Try a different word or clear the filters.`}
          action={
            <Button variant="secondary" size="sm" onClick={() => { setQ(""); setCat("all") }}>
              Clear filters
            </Button>
          }
        />
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3.5 min-[700px]:grid-cols-3">
          {filtered.map((l) => (
            <Card key={l.id} className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <Chip tone="neutral" dot={false}>{l.category}</Chip>
                <span className="ml-auto flex items-center gap-1">
                  <span className="ba-num text-[0.95rem] font-semibold text-[var(--ba-ink)]">{ngn(l.priceNgn)}</span>
                  <RowMenu label={`Actions for ${l.title}`} items={[{ label: "Report listing", onSelect: () => setReporting(l) }]} />
                </span>
              </div>
              <h2 className="mt-3 text-[1rem] font-semibold tracking-[-0.01em]">{l.title}</h2>
              <p className="text-[0.88rem] text-[var(--ba-body)]">by {l.author}</p>
              {l.description && <p className="mt-1.5 text-[0.83rem] text-[var(--ba-muted)]">{l.description}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-4">
                <Button variant="secondary" size="sm" onClick={() => openBuy(l)}>Buy</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Buy (M7) */}
      <Modal
        open={buying != null}
        onClose={() => !busy && setBuying(null)}
        title={`Buy "${buying?.title}"`}
        confirmLabel={busy ? "Buying…" : `Buy for ${buying ? money(currency === "USD" ? (buying.priceUsd ?? 0) : buying.priceNgn, currency) : ""}`}
        onConfirm={buy}
        pending={busy}
        body={buying ? `By ${buying.author}. It installs into the page you choose and picks up your brand colours and fonts.` : undefined}
      >
        {buying && (
          <>
            <div className="mt-3.5">
              <Field label="Install into page" htmlFor="mk-page" help="The page's ID from your site builder.">
                <Input id="mk-page" placeholder="e.g. home" value={pageId} onChange={(e) => setPageId(e.target.value)} />
              </Field>
            </div>
            {buying.priceUsd != null && brand.data?.currency === "USD" && (
              <div className="mt-[18px]">
                <span className="mb-[7px] block text-[0.88rem] font-semibold text-[var(--ba-ink)]">Pay in</span>
                <Segmented<"NGN" | "USD">
                  label="Currency"
                  value={currency}
                  onChange={setCurrency}
                  options={[
                    { value: "NGN", label: `Naira, ${ngn(buying.priceNgn)}` },
                    { value: "USD", label: `US dollars, ${money(buying.priceUsd, "USD")}` },
                  ]}
                />
              </div>
            )}
            <div className="mt-3.5 flex flex-col gap-2 rounded-[var(--ba-r-field)] border border-[var(--ba-line)] p-4">
              <div className="flex items-center justify-between gap-3 text-[0.9rem]">
                <span className="text-[var(--ba-muted)]">Section</span>
                <span className="ba-num text-right font-semibold">{buying.title}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[0.9rem]">
                <span className="text-[var(--ba-muted)]">Price</span>
                <span className="ba-num text-right font-semibold">
                  {money(currency === "USD" ? (buying.priceUsd ?? 0) : buying.priceNgn, currency)}, one-off
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[0.9rem]">
                <span className="text-[var(--ba-muted)]">Pay with</span>
                <span className="ba-num text-right font-semibold">Wallet, card, transfer or USSD</span>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Report (M7) */}
      <Modal
        open={reporting != null}
        onClose={() => !busy && setReporting(null)}
        title={`Report "${reporting?.title}"?`}
        confirmLabel={busy ? "Sending…" : "Report listing"}
        onConfirm={report}
        pending={busy}
        body="Tell us if this section copies someone's work, is misleading or breaks the marketplace rules. Our team reviews every report."
      />
    </main>
  )
}
