import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../mock"
import { BrandHeader } from "../layout"
import { CardSkeleton, EmptyState, ErrorState, useAsync, useToast } from "../ui"

const HOSTNAME_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/

export default function Settings() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const domains = useAsync(() => api.listDomains(slug), [slug])

  const [name, setName] = useState("")
  const [savingName, setSavingName] = useState(false)
  useEffect(() => {
    if (brand.data) setName(brand.data.name)
  }, [brand.data])

  const [hostname, setHostname] = useState("")
  const [hostError, setHostError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const canManage = brand.data?.role === "owner" || brand.data?.role === "admin"

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || name.trim() === brand.data?.name) return
    setSavingName(true)
    try {
      await api.renameBrand(slug, name.trim())
      toast("Brand name saved")
      brand.retry()
    } catch {
      toast("Couldn't save the name — try again.")
    } finally {
      setSavingName(false)
    }
  }

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
      toast(`${h} added — point its DNS at BrandsApp to finish`)
      setHostname("")
      domains.retry()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't add that domain — try again.")
    } finally {
      setAdding(false)
    }
  }

  return (
    <main className="page">
      <BrandHeader slug={slug} title="Settings" />

      <div className="stack">
        {/* Brand profile */}
        {brand.loading && <CardSkeleton lines={2} />}
        {brand.error && <ErrorState message={brand.error} onRetry={brand.retry} />}
        {brand.data && (
          <section className="card" aria-label="Brand profile">
            <h2>Brand name</h2>
            <p className="hint" style={{ marginBottom: 10 }}>
              Shown across your dashboard and to your customers. Your web address stays{" "}
              <span style={{ overflowWrap: "anywhere" }}>{brand.data.domain}</span>.
            </p>
            <form onSubmit={saveName} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 220 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Brand name"
                disabled={!canManage}
              />
              <button
                className="btn btn-primary btn-sm"
                type="submit"
                disabled={!canManage || savingName || !name.trim() || name.trim() === brand.data.name}
              >
                {savingName ? "Saving…" : "Save"}
              </button>
            </form>
          </section>
        )}

        {/* Domains */}
        <section aria-label="Domains">
          <h2 className="section-label" style={{ margin: "12px 0 6px" }}>Domains</h2>
          <p className="hint" style={{ marginBottom: 12 }}>
            Connect a domain you already own. Your brand stays reachable at its brandsapp.io address
            either way.
          </p>

          {canManage && (
            <form className="card" onSubmit={addDomain} noValidate>
              <h2>Add a domain</h2>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                <input
                  className="input"
                  style={{ flex: 1, minWidth: 220 }}
                  placeholder="shop.mybrand.com"
                  value={hostname}
                  onChange={(e) => {
                    setHostname(e.target.value)
                    setHostError(null)
                  }}
                  aria-invalid={!!hostError}
                  aria-label="Domain to add"
                />
                <button className="btn btn-primary btn-sm" type="submit" disabled={adding || !hostname.trim()}>
                  {adding ? "Adding…" : "Add domain"}
                </button>
              </div>
              {hostError && <p className="error-text">{hostError}</p>}
              <p className="help" style={{ marginTop: 8 }}>
                Don't own one yet? Buying a domain through BrandsApp is coming soon.
              </p>
            </form>
          )}

          <div style={{ marginTop: 14 }}>
            {domains.loading && <CardSkeleton lines={1} />}
            {domains.error && <ErrorState message={domains.error} onRetry={domains.retry} />}
            {domains.data && domains.data.length === 0 && (
              <EmptyState
                icon="globe"
                title="No custom domains yet"
                body={`Your brand is live at its brandsapp.io address. Add a domain above when you're ready.`}
              />
            )}
            {domains.data && domains.data.length > 0 && (
              <div className="card">
                <h2>Connected domains</h2>
                <div className="rowlist" style={{ marginTop: 6 }}>
                  {domains.data.map((d) => (
                    <div key={d.id} className="row-item">
                      <div className="grow">
                        <div className="title" style={{ overflowWrap: "anywhere" }}>
                          {d.hostname}
                        </div>
                        <div className="meta">Added {d.addedAt}</div>
                      </div>
                      {d.status === "active" ? (
                        <span className="chip chip-good">Active</span>
                      ) : (
                        <span className="chip chip-warn">Waiting for DNS</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
