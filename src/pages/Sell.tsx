import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { api, LISTING_CATEGORIES } from "../mock"
import { Icon, PageHeader, useAsync, useToast } from "../ui"

/** Sell a section (M7): a sub-flow of the Marketplace. Nigerian brands only; 80/20 split. */
export default function Sell() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const navigate = useNavigate()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>(LISTING_CATEGORIES[0])
  const [priceNgn, setPriceNgn] = useState("")
  const [priceUsd, setPriceUsd] = useState("")
  const [fragment, setFragment] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const eligible = brand.data?.currency !== "USD"

  const validate = () => {
    const e: Record<string, string> = {}
    if (title.trim().length < 3) e.title = "Give it a name."
    if (!priceNgn && !priceUsd) e.price = "Set a price in Naira or US dollars."
    if (priceNgn && Number(priceNgn) < 500) e.price = "The lowest price is ₦500."
    if (!fragment.trim()) e.fragment = "Paste the section's JSON. Export it from the editor."
    else {
      try {
        JSON.parse(fragment)
      } catch {
        e.fragment = "That isn't valid JSON. Export the section again from the editor."
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await api.publishListing({ title: title.trim(), description: description.trim() || undefined, category, priceNgn: Number(priceNgn || 0), priceUsd: priceUsd ? Number(priceUsd) : undefined })
      toast("Listing published", "success")
      navigate(`/dashboard/${slug}/marketplace`)
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't publish the listing. Try again.", "error")
      setSubmitting(false)
    }
  }

  return (
    <main className="page narrow">
      <PageHeader
        slug={slug}
        title="Sell a section"
        sub="List a page section you built. Buyers install it into their own site. You keep 80% and the platform takes 20%, paid into your wallet automatically."
        backTo={`/dashboard/${slug}/marketplace`}
        backLabel="Marketplace"
      />

      {brand.data && !eligible && (
        <p className="member-note block warn" style={{ marginTop: 0, marginBottom: 14 }}>
          <span className="ico"><Icon name="info" size={14} /></span>
          Selling is open to Nigerian brands only for now. This brand is billed in US dollars, so it can buy sections but not list them yet.
        </p>
      )}

      <form className="card" onSubmit={submit} noValidate>
        <div className="card-head" style={{ marginBottom: 18 }}>
          <div>
            <h2>Listing</h2>
            <p className="hint">What buyers see in the marketplace.</p>
          </div>
        </div>

        <div className="field">
          <label htmlFor="sl-name">Name</label>
          <input id="sl-name" className="input" placeholder="e.g. Bold SaaS hero" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} disabled={!eligible} />
          {errors.title && <p className="error-text"><Icon name="warning" size={14} />{errors.title}</p>}
        </div>

        <div className="field">
          <label htmlFor="sl-desc">Description<span className="optional">Optional</span></label>
          <textarea id="sl-desc" className="input" rows={3} placeholder="What is it, and who is it for?" value={description} onChange={(e) => setDescription(e.target.value)} disabled={!eligible} />
        </div>

        <div className="field">
          <label htmlFor="sl-cat">Category</label>
          <select id="sl-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)} disabled={!eligible}>
            {LISTING_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>

        <div className="grid-2" style={{ marginBottom: 18 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="sl-ngn">Price in Naira</label>
            <div className={`input-group${errors.price ? " invalid" : ""}`}>
              <span className="addon lead" aria-hidden="true">₦</span>
              <input id="sl-ngn" className="input" inputMode="numeric" placeholder="4,000" value={priceNgn} onChange={(e) => setPriceNgn(e.target.value.replace(/\D/g, ""))} disabled={!eligible} />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="sl-usd">Price in US dollars<span className="optional">Optional</span></label>
            <div className="input-group">
              <span className="addon lead" aria-hidden="true">$</span>
              <input id="sl-usd" className="input" inputMode="decimal" placeholder="2" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value.replace(/[^\d.]/g, ""))} disabled={!eligible} />
            </div>
          </div>
        </div>
        {errors.price && <p className="error-text" style={{ marginTop: -10, marginBottom: 14 }}><Icon name="warning" size={14} />{errors.price}</p>}

        <div className="field">
          <label htmlFor="sl-json">Section JSON</label>
          <textarea id="sl-json" className="input" rows={6} placeholder='{ "type": "hero", … }' value={fragment} onChange={(e) => setFragment(e.target.value)} aria-invalid={!!errors.fragment} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: ".86rem" }} disabled={!eligible} />
          {errors.fragment ? (
            <p className="error-text"><Icon name="warning" size={14} />{errors.fragment}</p>
          ) : (
            <p className="help">Export the section from your site editor and paste it here.</p>
          )}
        </div>

        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={submitting || !eligible} style={{ marginTop: 10 }}>
          {submitting ? "Publishing…" : "Publish listing"}
        </button>
        <p className="hint quiet" style={{ textAlign: "center", marginTop: 12 }}>
          You can take a listing down at any time. Sales are paid into your wallet on this brand.
        </p>
      </form>
    </main>
  )
}
