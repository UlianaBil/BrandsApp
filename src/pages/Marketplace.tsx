import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { api, ngn } from "../mock"
import { CardSkeleton, EmptyState, ErrorState, Icon, PageHeader, SearchField, Segmented, useAsync, useToast } from "../ui"

export default function Marketplace() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const listings = useAsync(() => api.listListings(), [])
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("all")

  const categories = useMemo(() => Array.from(new Set((listings.data ?? []).map((l) => l.category))), [listings.data])
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (listings.data ?? []).filter(
      (l) => (cat === "all" || l.category === cat) && (!needle || `${l.title} ${l.author} ${l.category}`.toLowerCase().includes(needle)),
    )
  }, [listings.data, q, cat])

  return (
    <main className="page">
      <PageHeader
        slug={slug}
        title="Marketplace"
        sub="Page sections built by other creators. They install straight into your site. Listing cards below are layout examples — the final card design is still to be decided."
        actions={
          <button className="btn btn-secondary" onClick={() => toast("Selling isn't wired up in this prototype")}>
            <Icon name="sparkle" size={15} /> Sell a section
          </button>
        }
      />

      {listings.data && listings.data.length > 0 && (
        <div className="toolbar">
          <SearchField value={q} onChange={setQ} placeholder="Search sections or creators" label="Search the marketplace" />
          <Segmented
            label="Filter by category"
            value={cat}
            onChange={setCat}
            options={[{ value: "all", label: "All" }, ...categories.map((c) => ({ value: c, label: c }))]}
          />
        </div>
      )}

      {listings.loading && (<div className="grid-3"><CardSkeleton lines={2} /><CardSkeleton lines={2} /><CardSkeleton lines={2} /></div>)}
      {listings.error && <ErrorState message={listings.error} onRetry={listings.retry} />}

      {listings.data && listings.data.length === 0 && (
        <EmptyState
          icon="store"
          title="Nothing for sale yet"
          body="The marketplace is new — sections from other creators will appear here. You could be first: sell one of yours."
          action={<button className="btn btn-primary" onClick={() => toast("Selling isn't wired up in this prototype")}>Sell a section</button>}
        />
      )}

      {listings.data && listings.data.length > 0 && filtered.length === 0 && (
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
                <span className="stat-corner money" style={{ color: "var(--ink)", fontSize: ".95rem" }}>{ngn(l.priceNgn)}</span>
              </div>
              <h2 style={{ marginTop: 16 }}>{l.title}</h2>
              <p className="hint">by {l.author}</p>
            </div>
          ))}
        </div>
      )}

    </main>
  )
}
