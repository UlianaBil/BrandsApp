import { useParams } from "react-router-dom"
import { api, ngn } from "../mock"
import { BrandHeader } from "../layout"
import { CardSkeleton, EmptyState, ErrorState, useAsync, useToast } from "../ui"

export default function Marketplace() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const listings = useAsync(() => api.listListings(), [])

  return (
    <main className="page">
      <BrandHeader slug={slug} title="Marketplace" />
      <div className="page-head" style={{ marginTop: -8 }}>
        <p className="sub" style={{ color: "var(--body-c)" }}>
          Page sections built by other creators. They install straight into your site.
        </p>
        <button className="btn btn-secondary btn-sm" onClick={() => toast("Selling isn't wired up in this prototype")}>
          Sell a section
        </button>
      </div>

      {listings.loading && (
        <div className="stack">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
        </div>
      )}
      {listings.error && <ErrorState message={listings.error} onRetry={listings.retry} />}

      {listings.data && listings.data.length === 0 && (
        <EmptyState
          icon="store"
          title="Nothing for sale yet"
          body="The marketplace is new — sections from other creators will appear here. You could be first: sell one of yours."
        />
      )}

      {listings.data && listings.data.length > 0 && (
        <div className="grid-2">
          {listings.data.map((l) => (
            <div key={l.id} className="card">
              <span className="chip chip-neutral" style={{ marginBottom: 8 }}>
                {l.category}
              </span>
              <h2>{l.title}</h2>
              <p className="hint">by {l.author}</p>
              <div className="card-row" style={{ marginTop: 12 }}>
                <span className="money">{ngn(l.priceNgn)}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => toast("Purchases aren't wired up in this prototype")}
                >
                  Preview & buy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
