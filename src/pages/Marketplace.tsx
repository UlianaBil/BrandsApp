import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api, money, ngn, type Listing } from "../mock"
import { CardSkeleton, EmptyState, ErrorState, Icon, Menu, Modal, PageHeader, SearchField, Segmented, useAsync, useToast } from "../ui"

export default function Marketplace() {
  const { slug = "" } = useParams()
  const toast = useToast()
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
    <main className="page">
      <PageHeader
        slug={slug}
        title="Marketplace"
        sub="Page sections built by other creators. They install straight into your site."
        actions={hasListings ? <Link to={`/dashboard/${slug}/marketplace/sell`} className="btn btn-white"><Icon name="sparkle" size={15} /> Sell a section</Link> : undefined}
      />

      {hasListings && (
        <div className="toolbar">
          <SearchField value={q} onChange={setQ} placeholder="Search sections or creators" label="Search the marketplace" />
          <Segmented label="Filter by category" value={cat} onChange={setCat} options={[{ value: "all", label: "All" }, ...categories.map((c) => ({ value: c, label: c }))]} />
        </div>
      )}

      {listings.loading && (<div className="grid-3"><CardSkeleton lines={2} /><CardSkeleton lines={2} /><CardSkeleton lines={2} /></div>)}
      {listings.error && <ErrorState message={listings.error} onRetry={listings.retry} />}

      {listings.data && listings.data.length === 0 && (
        <EmptyState
          icon="store"
          title="Nothing for sale yet"
          body="The marketplace is new. Sections from other creators will appear here. You could be first: sell one of yours."
          action={<Link to={`/dashboard/${slug}/marketplace/sell`} className="btn btn-primary">Sell a section</Link>}
        />
      )}

      {hasListings && filtered.length === 0 && (
        <EmptyState
          icon="search"
          title="No sections match"
          body={`Nothing matches “${q.trim()}”${cat !== "all" ? ` in ${cat}` : ""}. Try a different word or clear the filters.`}
          action={<button className="btn btn-secondary btn-sm" onClick={() => { setQ(""); setCat("all") }}>Clear filters</button>}
        />
      )}

      {filtered.length > 0 && (
        <div className="grid-3">
          {filtered.map((l) => (
            <div key={l.id} className="card stat-card compact">
              <div className="stat-headrow">
                <span className="chip chip-neutral">{l.category}</span>
                <span className="stat-corner" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span className="money" style={{ color: "var(--ink)", fontSize: ".95rem" }}>{ngn(l.priceNgn)}</span>
                  <Menu label={`Actions for ${l.title}`} items={[{ label: "Report listing", icon: "flag", onSelect: () => setReporting(l) }]} />
                </span>
              </div>
              <h2 style={{ marginTop: 12 }}>{l.title}</h2>
              <p className="hint">by {l.author}</p>
              {l.description && <p className="hint quiet" style={{ marginTop: 6 }}>{l.description}</p>}
              <div className="stat-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openBuy(l)}>Buy</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Buy (M7) */}
      <Modal
        open={buying != null}
        onClose={() => !busy && setBuying(null)}
        title={`Buy “${buying?.title}”`}
        icon="store"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setBuying(null)} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" onClick={buy} disabled={busy || !pageId.trim()}>
              {busy ? "Buying…" : `Buy for ${buying ? money(currency === "USD" ? (buying.priceUsd ?? 0) : buying.priceNgn, currency) : ""}`}
            </button>
          </>
        }
      >
        {buying && (
          <>
            <p>By {buying.author}. It installs into the page you choose and picks up your brand colours and fonts.</p>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="mk-page">Install into page</label>
              <input id="mk-page" className="input" placeholder="e.g. home" value={pageId} onChange={(e) => setPageId(e.target.value)} />
              <p className="help">The page's ID from your site builder.</p>
            </div>
            {buying.priceUsd != null && brand.data?.currency === "USD" && (
              <div className="field">
                <span className="label">Pay in</span>
                <Segmented<"NGN" | "USD"> label="Currency" value={currency} onChange={setCurrency} options={[{ value: "NGN", label: `Naira, ${ngn(buying.priceNgn)}` }, { value: "USD", label: `US dollars, ${money(buying.priceUsd, "USD")}` }]} />
              </div>
            )}
            <div className="summary">
              <div className="li"><span className="k">Section</span><span className="v">{buying.title}</span></div>
              <div className="li"><span className="k">Price</span><span className="v">{money(currency === "USD" ? (buying.priceUsd ?? 0) : buying.priceNgn, currency)}, one-off</span></div>
              <div className="li"><span className="k">Pay with</span><span className="v">Wallet, card, transfer or USSD</span></div>
            </div>
          </>
        )}
      </Modal>

      {/* Report (M7) */}
      <Modal
        open={reporting != null}
        onClose={() => !busy && setReporting(null)}
        title={`Report “${reporting?.title}”?`}
        icon="flag"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setReporting(null)} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" onClick={report} disabled={busy}>{busy ? "Sending…" : "Report listing"}</button>
          </>
        }
      >
        <p>Tell us if this section copies someone's work, is misleading or breaks the marketplace rules. Our team reviews every report.</p>
      </Modal>
    </main>
  )
}
