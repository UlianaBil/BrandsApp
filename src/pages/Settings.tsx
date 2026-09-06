import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { api, fmtDate, type DomainRecord } from "../mock"
import { CardSkeleton, EmptyState, ErrorState, Icon, Menu, Modal, PageHeader, SectionHead, useAsync, useToast } from "../ui"

const HOSTNAME_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function DomainStatusChip({ status }: { status: DomainRecord["status"] }) {
  if (status === "active") return <span className="chip chip-good"><span className="dot" />Live</span>
  if (status === "failed") return <span className="chip chip-bad"><span className="dot" />Failed</span>
  return <span className="chip chip-warn"><span className="dot" />Waiting for DNS</span>
}

export default function Settings() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const navigate = useNavigate()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const domains = useAsync(() => api.listDomains(slug), [slug])

  // Brand details (M1): name, description, contact email.
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (!brand.data) return
    setName(brand.data.name)
    setDescription(brand.data.description ?? "")
    setContactEmail(brand.data.contactEmail ?? "")
  }, [brand.data])
  const emailInvalid = contactEmail.length > 0 && !EMAIL_RE.test(contactEmail)
  const dirty =
    !!brand.data &&
    (name.trim() !== brand.data.name || description.trim() !== (brand.data.description ?? "") || contactEmail.trim() !== (brand.data.contactEmail ?? ""))
  const canSave = dirty && name.trim().length >= 2 && !emailInvalid && !saving

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    try {
      await api.updateBrand(slug, { name: name.trim(), description: description.trim(), contactEmail: contactEmail.trim() })
      toast("Brand details saved", "success")
      brand.retry()
    } catch {
      toast("Couldn't save the details. Try again.", "error")
    } finally {
      setSaving(false)
    }
  }

  // Domains (M5)
  const [hostname, setHostname] = useState("")
  const [hostError, setHostError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<DomainRecord | null>(null)
  const [busy, setBusy] = useState(false)

  const addDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    const h = hostname.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
    if (!HOSTNAME_RE.test(h)) {
      setHostError("Enter just the domain, like shop.mybrand.com.")
      return
    }
    if (domains.data?.some((d) => d.hostname === h)) {
      setHostError("That domain is already connected to this brand.")
      return
    }
    setHostError(null)
    setAdding(true)
    try {
      const rec = await api.addDomain(slug, h)
      toast(`${h} added. Add the DNS records to finish.`, "success")
      setHostname("")
      navigate(`/dashboard/${slug}/settings/domains/${rec.id}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't add that domain. Try again.", "error")
    } finally {
      setAdding(false)
    }
  }

  const check = async (d: DomainRecord) => {
    try {
      const r = await api.refreshDomain(slug, d.id)
      toast(r.status === "active" ? `${d.hostname} is live` : `${d.hostname} still isn't pointing at BrandsApp`, r.status === "active" ? "success" : "error")
      domains.retry()
    } catch {
      toast("Couldn't check that domain. Try again.", "error")
    }
  }

  const confirmRemove = async () => {
    if (!removing) return
    setBusy(true)
    try {
      await api.removeDomain(slug, removing.id)
      toast(`${removing.hostname} disconnected`, "success")
      setRemoving(null)
      domains.retry()
    } catch {
      toast("Couldn't remove that domain. Try again.", "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page">
      <PageHeader slug={slug} title="Settings" sub="Brand details, domains and brand-level configuration." />

      <div className="stack">
        {brand.loading && <CardSkeleton lines={3} />}
        {brand.error && <ErrorState message={brand.error} onRetry={brand.retry} />}

        {brand.data && (
          <section className="card" aria-label="Brand details">
            <div className="card-head">
              <div>
                <h2>Brand details</h2>
                <p className="hint">
                  Shown across your dashboard and to your customers. Your web address stays{" "}
                  <span style={{ overflowWrap: "anywhere", fontWeight: 600, color: "var(--ink)" }}>{brand.data.domain}</span>.
                </p>
              </div>
            </div>
            <form onSubmit={saveDetails} noValidate>
              <div className="field">
                <label htmlFor="bd-name">Brand name</label>
                <input id="bd-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="organization" />
              </div>
              <div className="field">
                <label htmlFor="bd-desc">Description<span className="optional">Optional</span></label>
                <textarea id="bd-desc" className="input" rows={3} placeholder="What does this brand do?" value={description} onChange={(e) => setDescription(e.target.value)} />
                <p className="help">Used on your public brand profile and to help us set up your site.</p>
              </div>
              <div className="field">
                <label htmlFor="bd-email">Contact email<span className="optional">Optional</span></label>
                <input id="bd-email" className="input" type="email" placeholder="hello@yourbrand.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} aria-invalid={emailInvalid} />
                {emailInvalid ? (
                  <p className="error-text"><Icon name="warning" size={14} />That doesn't look like an email address.</p>
                ) : (
                  <p className="help">Where customers and BrandsApp can reach this brand.</p>
                )}
              </div>
              <button className="btn btn-primary" type="submit" disabled={!canSave}>{saving ? "Saving…" : "Save changes"}</button>
            </form>
          </section>
        )}

        {brand.data && (
          <section aria-label="Domains">
            <SectionHead title="Domains" hint="Your brand stays reachable at its brandsapp.io address either way" />

            <form className="card" onSubmit={addDomain} noValidate style={{ marginBottom: 14 }}>
              <div className="card-head" style={{ marginBottom: 12 }}>
                <div>
                  <h2>Add a domain</h2>
                  <p className="hint">Connect a domain you already own. We'll show you the DNS records to add next.</p>
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

            {domains.loading && <CardSkeleton lines={1} />}
            {domains.error && <ErrorState message={domains.error} onRetry={domains.retry} />}
            {domains.data && domains.data.length === 0 && (
              <EmptyState icon="globe" title="No custom domains yet" body="Your brand is live at its brandsapp.io address. Add a domain above when you're ready." />
            )}
            {domains.data && domains.data.length > 0 && (
              <div className="card flush">
                <div className="card-head">
                  <div>
                    <h2>Connected domains</h2>
                    <p className="hint">Open a domain to see the DNS records it needs.</p>
                  </div>
                </div>
                <div className="table" style={{ ["--cols" as string]: "minmax(0,2fr) minmax(0,1fr) 150px 48px" }}>
                  <div className="tr th"><span>Domain</span><span>Added</span><span style={{ textAlign: "right" }}>Status</span><span /></div>
                  {domains.data.map((d) => (
                    <div key={d.id} className="tr">
                      <span className="td strong span" style={{ overflowWrap: "anywhere" }}>
                        <Link to={`/dashboard/${slug}/settings/domains/${d.id}`} className="text-link" style={{ textDecoration: "none" }}>{d.hostname}</Link>
                      </span>
                      <span className="td muted"><span className="lbl">Added</span>{fmtDate(d.addedAt)}</span>
                      <span className="td end"><DomainStatusChip status={d.status} /></span>
                      <span className="td end">
                        <Menu
                          label={`Actions for ${d.hostname}`}
                          items={[
                            { label: "DNS records", icon: "link", onSelect: () => navigate(`/dashboard/${slug}/settings/domains/${d.id}`) },
                            ...(d.status !== "active" ? [{ label: "Check DNS", icon: "refresh" as const, onSelect: () => check(d) }] : []),
                            { label: "Remove domain", icon: "trash", danger: true, sep: true, onSelect: () => setRemoving(d) },
                          ]}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <Modal
        open={removing != null}
        onClose={() => !busy && setRemoving(null)}
        title={`Remove ${removing?.hostname}?`}
        icon="trash"
        danger
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRemoving(null)} disabled={busy}>Keep</button>
            <button className="btn btn-danger" onClick={confirmRemove} disabled={busy}>{busy ? "Removing…" : "Remove domain"}</button>
          </>
        }
      >
        <p>Visitors to {removing?.hostname} will no longer reach your site. Your brandsapp.io address keeps working. You can connect the domain again later.</p>
      </Modal>
    </main>
  )
}
