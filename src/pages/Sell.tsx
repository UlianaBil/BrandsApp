import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { api, LISTING_CATEGORIES } from "../mock"
import { Icon, useAsync } from "../ui"
import { Button, Card, PageHeader } from "@/ui/primitives"
import { Field, Input, InputGroup, Note, Select, Textarea, toast } from "@/ui/controls"

/** Sell a section (M7): a sub-flow of the Marketplace. Nigerian brands only; 80/20 split. */
export default function Sell() {
  const { slug = "" } = useParams()
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
    <main className="mx-auto max-w-[680px] px-4 pt-6 pb-[110px] min-[900px]:px-9 min-[900px]:pt-9">
      {/* Sub-flow of Marketplace: this back link shows at every width (§3.2). */}
      <Link
        to={`/dashboard/${slug}/marketplace`}
        className="mb-3.5 inline-flex max-w-full items-center gap-2 text-[0.9rem] font-semibold text-[var(--ba-body)] transition-colors hover:text-[var(--ba-ink)]"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--ba-line)] bg-[var(--ba-paper)]">
          <Icon name="back" size={16} />
        </span>
        <span className="truncate">Marketplace</span>
      </Link>

      <PageHeader
        title="Sell a section"
        subtitle="List a page section you built. Buyers install it into their own site. You keep 80% and the platform takes 20%, paid into your wallet automatically."
      />

      {brand.data && !eligible && (
        <div className="mb-3.5">
          <Note tone="warn">
            <div className="flex items-start gap-2.5">
              <Icon name="info" size={14} />
              <span>Selling is open to Nigerian brands only for now. This brand is billed in US dollars, so it can buy sections but not list them yet.</span>
            </div>
          </Note>
        </div>
      )}

      <Card>
        <form onSubmit={submit} noValidate>
          <div className="mb-[18px]">
            <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Listing</h2>
            <p className="mt-0.5 text-[0.88rem] text-[var(--ba-body)]">What buyers see in the marketplace.</p>
          </div>

          <div className="mb-[18px]">
            <Field label="Name" htmlFor="sl-name" error={errors.title}>
              <Input
                id="sl-name"
                placeholder="e.g. Bold SaaS hero"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={!!errors.title}
                disabled={!eligible}
              />
            </Field>
          </div>

          <div className="mb-[18px]">
            <Field label="Description" optional htmlFor="sl-desc">
              <Textarea
                id="sl-desc"
                rows={3}
                placeholder="What is it, and who is it for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!eligible}
              />
            </Field>
          </div>

          <div className="mb-[18px]">
            <Field label="Category" htmlFor="sl-cat">
              <Select id="sl-cat" value={category} onChange={(e) => setCategory(e.target.value)} disabled={!eligible}>
                {LISTING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mb-[18px] grid grid-cols-1 gap-3.5 min-[700px]:grid-cols-2">
            <Field label="Price in Naira" htmlFor="sl-ngn">
              <InputGroup prefix="₦">
                <Input
                  id="sl-ngn"
                  inputMode="numeric"
                  placeholder="4,000"
                  value={priceNgn}
                  onChange={(e) => setPriceNgn(e.target.value.replace(/\D/g, ""))}
                  disabled={!eligible}
                />
              </InputGroup>
            </Field>
            <Field label="Price in US dollars" optional htmlFor="sl-usd">
              <InputGroup prefix="$">
                <Input
                  id="sl-usd"
                  inputMode="decimal"
                  placeholder="2"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value.replace(/[^\d.]/g, ""))}
                  disabled={!eligible}
                />
              </InputGroup>
            </Field>
          </div>
          {errors.price && (
            <p className="-mt-2.5 mb-[18px] flex items-center gap-1.5 text-[0.82rem] text-[var(--ba-bad)]">
              <Icon name="warning" size={14} />{errors.price}
            </p>
          )}

          <div className="mb-[18px]">
            <Field
              label="Section JSON"
              htmlFor="sl-json"
              error={errors.fragment}
              help={errors.fragment ? undefined : "Export the section from your site editor and paste it here."}
            >
              <Textarea
                id="sl-json"
                rows={6}
                placeholder='{ "type": "hero", … }'
                value={fragment}
                onChange={(e) => setFragment(e.target.value)}
                aria-invalid={!!errors.fragment}
                className="font-mono text-[0.86rem]"
                disabled={!eligible}
              />
            </Field>
          </div>

          <Button type="submit" variant="primary" size="lg" block className="mt-1.5" disabled={submitting || !eligible}>
            {submitting ? "Publishing…" : "Publish listing"}
          </Button>
          <p className="mt-3 text-center text-[0.83rem] text-[var(--ba-muted)]">
            You can take a listing down at any time. Sales are paid into your wallet on this brand.
          </p>
        </form>
      </Card>
    </main>
  )
}
