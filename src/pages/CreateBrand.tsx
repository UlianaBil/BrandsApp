import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api } from "../mock"
import { Icon } from "../ui"
import { Button, Card, PageHeader } from "@/ui/primitives"
import { Field, Input, InputGroup, Select, Textarea, toast } from "@/ui/controls"

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

/** A flow page shows its back link at every width (§3.2 "Flow pages (Create)"). */
function BackLink() {
  return (
    <Link
      to="/dashboard"
      className="mb-3.5 inline-flex max-w-full items-center gap-2 text-[0.9rem] font-semibold text-[var(--ba-body)] hover:text-[var(--ba-ink)]"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--ba-line)] bg-[var(--ba-paper)]">
        <Icon name="back" size={16} />
      </span>
      <span className="truncate">My Brands</span>
    </Link>
  )
}

export default function CreateBrand() {
  const navigate = useNavigate()

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
      const brand = await api.createBrand(name.trim(), effectiveSlug, {
        description: description.trim() || undefined,
        contactEmail: email.trim() || undefined,
        currency: region === "intl" ? "USD" : "NGN",
      })
      toast("Brand created. Setting things up now.", "success")
      navigate(`/dashboard/${brand.slug}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong — try again.", "error")
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-[680px] px-4 pt-6 pb-[110px] min-[900px]:px-9 min-[900px]:pt-9">
      <BackLink />
      <PageHeader title="Create a new brand" subtitle="Set up a new store or website — we'll provision everything for you." />

      <Card>
        <form onSubmit={submit} noValidate className="flex flex-col gap-3.5">
          <Field label="Brand name" htmlFor="cb-name" help="This is how your brand appears everywhere — you can change it later.">
            <Input
              id="cb-name"
              placeholder="e.g. Adaeze Fashion"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="organization"
              required
            />
          </Field>

          <Field
            label="Web address"
            htmlFor="cb-slug"
            /* Field already leads its error/success text with its own icon (§6.4), so these don't repeat one. */
            error={availability === "taken" ? `${effectiveSlug}.brandsapp.io is already taken — try another address.` : undefined}
            success={availability === "free" ? `${effectiveSlug}.brandsapp.io is available` : undefined}
            help={
              availability === "checking" ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3.5 animate-spin rounded-full border-2 border-[rgba(28,28,28,0.18)] border-t-[currentColor]" />
                  Checking availability…
                </span>
              ) : availability === "idle" ? (
                "You can connect your own domain later."
              ) : undefined
            }
          >
            {/* InputGroup has no invalid variant of its own, so the taken-slug border
               is applied from outside, targeting its wrapper div directly. */}
            <div className={availability === "taken" ? "[&>div]:border-[var(--ba-bad)]" : undefined}>
              <InputGroup suffix=".brandsapp.io">
                <Input
                  id="cb-slug"
                  placeholder="adaeze-fashion"
                  value={effectiveSlug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(slugify(e.target.value))
                  }}
                  aria-invalid={availability === "taken"}
                />
              </InputGroup>
            </div>
          </Field>

          <Field label="Description" optional htmlFor="cb-desc">
            <Textarea id="cb-desc" rows={3} placeholder="What does this brand do?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <Field
            label="Contact email"
            optional
            htmlFor="cb-email"
            error={emailInvalid ? "That doesn't look like an email address." : undefined}
          >
            <Input
              id="cb-email"
              type="email"
              placeholder="hello@yourbrand.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={emailInvalid}
            />
          </Field>

          <Field label="Where is this business based?" htmlFor="cb-region">
            <Select id="cb-region" value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="ng">Nigeria (billed in Naira)</option>
              <option value="intl">International (billed in USD)</option>
            </Select>
          </Field>

          <Button type="submit" size="lg" block disabled={!canSubmit} className="mt-1.5">
            {submitting ? (
              <>
                <span className="size-[18px] animate-spin rounded-full border-2 border-[rgba(255,255,255,0.3)] border-t-white" />
                Setting up your brand…
              </>
            ) : (
              "Create brand"
            )}
          </Button>
          <p className="mt-1 text-center text-[0.83rem] text-[var(--ba-muted)]">
            You get a 7-day free trial. No card required to get started.
          </p>
        </form>
      </Card>
    </main>
  )
}
