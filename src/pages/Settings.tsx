import { useState } from "react"
import { useParams } from "react-router-dom"
import { api, fmtDate } from "../mock"
import { CardSkeleton, EmptyState, ErrorState, Icon, PageHeader, SectionHead, useAsync, useToast } from "../ui"

const HOSTNAME_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/

export default function Settings() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const domains = useAsync(() => api.listDomains(slug), [slug])

  const [hostname, setHostname] = useState("")
  const [hostError, setHostError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const canManage = brand.data?.role === "owner" || brand.data?.role === "admin"

  const addDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    const h = hostname.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
    if (!HOSTNAME_RE.test(h)) {
      setHostError("Enter just the domain, like shop.mybrand.com.")
      return
    }
    setHostError(null)
    setAdding(true)
    try {
      await api.addDomain(slug, h)
      toast(`${h} added — point its DNS at BrandsApp to finish`, "success")
      setHostname("")
      domains.retry()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't add that domain — try again.", "error")
    } finally {
      setAdding(false)
    }
  }

  return (
    <main className="page">
      <PageHeader slug={slug} title="Settings" sub="Domains and brand-level configuration." />

      <div className="stack">
        {brand.loading && <CardSkeleton lines={2} />}
        {brand.error && <ErrorState message={brand.error} onRetry={brand.retry} />}
        {/* Domains */}
        {brand.data && (
          <section aria-label="Domains">
            <SectionHead title="Domains" hint="Your brand stays reachable at its brandsapp.io address either way" />

            {canManage && (
              <form className="card" onSubmit={addDomain} noValidate style={{ marginBottom: 14 }}>
                <div className="card-head" style={{ marginBottom: 12 }}>
                  <div>
                    <h2>Add a domain</h2>
                    <p className="hint">Connect a domain you already own.</p>
                  </div>
                </div>
                <div className="inline-form">
                  <div className={`input-group${hostError ? " invalid" : ""}`}>
                    <span className="addon lead" aria-hidden="true"><Icon name="globe" size={16} /></span>
                    <input
                      className="input"
                      placeholder="shop.mybrand.com"
                      value={hostname}
                      onChange={(e) => { setHostname(e.target.value); setHostError(null) }}
                      aria-invalid={!!hostError}
                      aria-label="Domain to add"
                    />
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={adding || !hostname.trim()}>
                    {adding ? "Adding…" : (<><Icon name="plus" size={15} />Add domain</>)}
                  </button>
                </div>
                {hostError && <p className="error-text"><Icon name="warning" size={14} />{hostError}</p>}
                <p className="hint quiet" style={{ marginTop: 10 }}>Don't own one yet? Buying a domain through BrandsApp is coming soon.</p>
              </form>
            )}

            {domains.loading && <CardSkeleton lines={1} />}
            {domains.error && <ErrorState message={domains.error} onRetry={domains.retry} />}
            {domains.data && domains.data.length === 0 && (
              <EmptyState
                icon="globe"
                title="No custom domains yet"
                body={canManage ? "Your brand is live at its brandsapp.io address. Add a domain above when you're ready." : "Your brand is live at its brandsapp.io address. An owner or admin can connect a custom domain."}
              />
            )}
            {domains.data && domains.data.length > 0 && (
              <div className="card flush">
                <div className="card-head"><h2>Connected domains</h2></div>
                <div className="table" style={{ ["--cols" as string]: "minmax(0,2fr) minmax(0,1fr) 150px" }}>
                  <div className="tr th"><span>Domain</span><span>Added</span><span style={{ textAlign: "right" }}>Status</span></div>
                  {domains.data.map((d) => (
                    <div key={d.id} className="tr">
                      <span className="td strong" style={{ overflowWrap: "anywhere" }}>{d.hostname}</span>
                      <span className="td muted"><span className="lbl">Added</span>{fmtDate(d.addedAt)}</span>
                      <span className="td end">
                        {d.status === "active"
                          ? <span className="chip chip-good"><span className="dot" />Active</span>
                          : <span className="chip chip-warn"><span className="dot" />Waiting for DNS</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
