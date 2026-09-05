import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../mock"
import { Icon, PageHeader, useToast } from "../ui"

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

export default function CreateBrand() {
  const navigate = useNavigate()
  const toast = useToast()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [region, setRegion] = useState("ng")
  const [submitting, setSubmitting] = useState(false)

  const effectiveSlug = slugTouched ? slug : slugify(name)

  const [availability, setAvailability] = useState<"idle" | "checking" | "free" | "taken">("idle")
  useEffect(() => {
    if (!effectiveSlug || effectiveSlug.length < 3) {
      setAvailability("idle")
      return
    }
    setAvailability("checking")
    let alive = true
    const t = setTimeout(() => {
      api.checkSlug(effectiveSlug).then((r) => {
        if (alive) setAvailability(r.available ? "free" : "taken")
      })
    }, 350)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [effectiveSlug])

  const emailInvalid = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const canSubmit = useMemo(
    () => name.trim().length >= 2 && effectiveSlug.length >= 3 && availability === "free" && !emailInvalid && !submitting,
    [name, effectiveSlug, availability, emailInvalid, submitting],
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const brand = await api.createBrand(name.trim(), effectiveSlug)
      toast(`${brand.name} is being set up`, "success")
      navigate(`/dashboard/${brand.slug}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong — try again.", "error")
      setSubmitting(false)
    }
  }

  return (
    <main className="page narrow">
      <PageHeader
        title="Create a new brand"
        sub="Set up a new store or website — we'll provision everything for you."
        backTo="/dashboard"
        backLabel="My Brands"
      />

      <form className="card" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="cb-name">Brand name</label>
          <input id="cb-name" className="input" placeholder="e.g. Adaeze Fashion" value={name} onChange={(e) => setName(e.target.value)} autoComplete="organization" required />
          <p className="help">This is how your brand appears everywhere — you can change it later.</p>
        </div>

        <div className="field">
          <label htmlFor="cb-slug">Web address</label>
          <div className={`input-group${availability === "taken" ? " invalid" : ""}`}>
            <input
              id="cb-slug"
              className="input"
              placeholder="adaeze-fashion"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(slugify(e.target.value))
              }}
              aria-invalid={availability === "taken"}
              aria-describedby="cb-slug-status"
            />
            <span className="addon">.brandsapp.io</span>
          </div>
          <p id="cb-slug-status" className={availability === "taken" ? "error-text" : `help${availability === "free" ? " ok" : ""}`} aria-live="polite">
            {availability === "checking" && (<><span className="spin" style={{ width: 14, height: 14, marginTop: 2 }} />Checking availability…</>)}
            {availability === "free" && (<><Icon name="check" size={14} />{effectiveSlug}.brandsapp.io is available</>)}
            {availability === "taken" && (<><Icon name="warning" size={14} />{effectiveSlug}.brandsapp.io is already taken — try another address.</>)}
            {availability === "idle" && "You can connect your own domain later."}
          </p>
        </div>

        <div className="field">
          <label htmlFor="cb-desc">Description<span className="optional">Optional</span></label>
          <textarea id="cb-desc" className="input" rows={3} placeholder="What does this brand do?" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="cb-email">Contact email<span className="optional">Optional</span></label>
          <input id="cb-email" className="input" type="email" placeholder="hello@yourbrand.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={emailInvalid} />
          {emailInvalid && <p className="error-text"><Icon name="warning" size={14} />That doesn't look like an email address.</p>}
        </div>

        <div className="field">
          <label htmlFor="cb-region">Where is this business based?</label>
          <select id="cb-region" className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="ng">Nigeria (billed in Naira)</option>
            <option value="intl">International (billed in USD)</option>
          </select>
        </div>

        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={!canSubmit} style={{ marginTop: 24 }}>
          {submitting ? (<><span className="spin" style={{ borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} />Setting up your brand…</>) : "Create brand"}
        </button>
        <p className="hint quiet" style={{ textAlign: "center", marginTop: 12 }}>
          You get a 7-day free trial. No card required to get started.
        </p>
      </form>
    </main>
  )
}
