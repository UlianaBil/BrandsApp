import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { api, fmtDate, type DomainRecord } from "../mock"
import { Icon, useAsync } from "../ui"
import { Avatar, Button, Card, Chip, PageHeader, SectionHead } from "@/ui/primitives"
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  Field,
  Input,
  InputGroup,
  Modal,
  RowMenu,
  Skeleton,
  Textarea,
  toast,
} from "@/ui/controls"

const HOSTNAME_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function DomainStatusChip({ status }: { status: DomainRecord["status"] }) {
  if (status === "active") return <Chip tone="good">Live</Chip>
  if (status === "failed") return <Chip tone="bad">Failed</Chip>
  return <Chip tone="warn">Waiting for DNS</Chip>
}

export default function Settings() {
  const { slug = "" } = useParams()
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
    <main className="mx-auto max-w-[1240px] px-4 pt-6 pb-[110px] min-[900px]:px-9 min-[900px]:pt-9">
      {/* §3.2: desktop-only identity chip back to Overview — the phone top bar
          already carries the brand name and back chevron on every brand page. */}
      {brand.data ? (
        <Link
          to={`/dashboard/${slug}`}
          aria-label={`${brand.data.name} overview`}
          className="mb-3 hidden max-w-full items-center gap-2 rounded-full border border-[var(--ba-line)] bg-[var(--ba-paper)] py-[3px] pr-3 pl-[3px] text-[0.82rem] font-semibold text-[var(--ba-body)] transition-colors hover:bg-[var(--ba-soft)] hover:text-[var(--ba-ink)] min-[900px]:inline-flex"
        >
          <Avatar name={brand.data.name} kind="brand" size={24} />
          <span className="truncate">{brand.data.name}</span>
        </Link>
      ) : !brand.error ? (
        <div className="mb-3 hidden items-center gap-2 min-[900px]:flex">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      ) : null}

      <PageHeader title="Settings" subtitle="Brand details, domains and brand-level configuration." />

      <div className="flex flex-col gap-3.5">
        {brand.loading && <CardSkeleton lines={3} />}
        {brand.error && <ErrorState what="the brand" onRetry={brand.retry} />}

        {brand.data && (
          <Card aria-label="Brand details">
            <div className="mb-3.5">
              <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Brand details</h2>
              <p className="mt-0.5 max-w-[60ch] text-[0.88rem] text-[var(--ba-body)]">
                Shown across your dashboard and to your customers. Your web address stays{" "}
                <span className="font-semibold text-[var(--ba-ink)] [overflow-wrap:anywhere]">{brand.data.domain}</span>.
              </p>
            </div>
            <form onSubmit={saveDetails} noValidate>
              <div className="mb-[18px]">
                <Field label="Brand name" htmlFor="bd-name">
                  <Input id="bd-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="organization" />
                </Field>
              </div>
              <div className="mb-[18px]">
                <Field
                  label="Description"
                  optional
                  htmlFor="bd-desc"
                  help="Used on your public brand profile and to help us set up your site."
                >
                  <Textarea id="bd-desc" rows={3} placeholder="What does this brand do?" value={description} onChange={(e) => setDescription(e.target.value)} />
                </Field>
              </div>
              <div className="mb-[18px]">
                <Field
                  label="Contact email"
                  optional
                  htmlFor="bd-email"
                  error={emailInvalid ? "That doesn't look like an email address." : undefined}
                  help={emailInvalid ? undefined : "Where customers and BrandsApp can reach this brand."}
                >
                  <Input
                    id="bd-email"
                    type="email"
                    placeholder="hello@yourbrand.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    aria-invalid={emailInvalid}
                  />
                </Field>
              </div>
              <Button type="submit" variant="primary" disabled={!canSave}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </Card>
        )}

        {brand.data && (
          <section aria-label="Domains">
            <SectionHead title="Domains" hint="Your brand stays reachable at its brandsapp.io address either way" />

            <Card className="mb-3.5">
              <div className="mb-3">
                <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Add a domain</h2>
                <p className="mt-0.5 max-w-[60ch] text-[0.88rem] text-[var(--ba-body)]">
                  Connect a domain you already own. We'll show you the DNS records to add next.
                </p>
              </div>
              <form onSubmit={addDomain} noValidate>
                <div className="flex flex-wrap items-start gap-2.5">
                  <div className="min-w-0 flex-1 basis-[220px]">
                    <InputGroup prefix={<Icon name="globe" size={16} />}>
                      <Input
                        placeholder="shop.mybrand.com"
                        value={hostname}
                        onChange={(e) => { setHostname(e.target.value); setHostError(null) }}
                        aria-invalid={!!hostError}
                        aria-label="Domain to add"
                      />
                    </InputGroup>
                  </div>
                  <Button type="submit" variant="primary" disabled={adding || !hostname.trim()} className="max-[560px]:w-full">
                    {adding ? "Adding…" : (<><Icon name="plus" size={15} />Add domain</>)}
                  </Button>
                </div>
                {hostError && (
                  <p className="mt-2 flex items-center gap-1.5 text-[0.82rem] text-[var(--ba-bad)]">
                    <Icon name="warning" size={14} />{hostError}
                  </p>
                )}
                <p className="mt-2.5 text-[0.83rem] text-[var(--ba-muted)]">
                  Don't own one yet? Buying a domain through BrandsApp is coming soon.
                </p>
              </form>
            </Card>

            {domains.loading && <CardSkeleton lines={1} />}
            {domains.error && <ErrorState what="your domains" onRetry={domains.retry} />}
            {domains.data && domains.data.length === 0 && (
              <EmptyState
                title="No custom domains yet"
                body="Your brand is live at its brandsapp.io address. Add a domain above when you're ready."
              />
            )}
            {domains.data && domains.data.length > 0 && (
              <Card flush className="overflow-hidden">
                <div className="px-[22px] pt-5">
                  <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Connected domains</h2>
                  <p className="mt-0.5 text-[0.88rem] text-[var(--ba-body)]">Open a domain to see the DNS records it needs.</p>
                </div>
                <div className="mt-3.5 hidden gap-4 border-b border-[var(--ba-line)] px-[22px] pb-2.5 text-[0.72rem] font-semibold tracking-[0.06em] text-[var(--ba-muted)] uppercase min-[700px]:flex">
                  <span className="basis-[45%]">Domain</span>
                  <span className="basis-[20%]">Added</span>
                  <span className="ml-auto">Status</span>
                </div>
                <div className="flex flex-col divide-y divide-[var(--ba-line)] min-[700px]:mt-0 mt-3.5">
                  {domains.data.map((d) => (
                    <div key={d.id} className="flex flex-col gap-2 px-[22px] py-3.5 min-[700px]:flex-row min-[700px]:items-center min-[700px]:gap-4">
                      <div className="min-w-0 flex-1 text-[0.92rem] font-semibold [overflow-wrap:anywhere] min-[700px]:basis-[45%]">
                        <Link
                          to={`/dashboard/${slug}/settings/domains/${d.id}`}
                          className="text-[var(--ba-ink)] underline decoration-[var(--ba-line-strong)] underline-offset-[3px] transition-colors hover:decoration-[var(--ba-ink)]"
                        >
                          {d.hostname}
                        </Link>
                      </div>
                      <div className="flex items-center justify-between gap-3 min-[700px]:basis-[20%] min-[700px]:justify-start">
                        <span className="text-[0.86rem] text-[var(--ba-muted)]">
                          <span className="mr-1.5 font-medium min-[700px]:hidden">Added</span>
                          {fmtDate(d.addedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <DomainStatusChip status={d.status} />
                        <RowMenu
                          label={`Actions for ${d.hostname}`}
                          items={[
                            { label: "DNS records", onSelect: () => navigate(`/dashboard/${slug}/settings/domains/${d.id}`) },
                            ...(d.status !== "active" ? [{ label: "Check DNS", onSelect: () => check(d) }] : []),
                            { label: "Remove domain", danger: true, sep: true, onSelect: () => setRemoving(d) },
                          ]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </section>
        )}
      </div>

      <Modal
        open={removing != null}
        onClose={() => !busy && setRemoving(null)}
        title={`Remove ${removing?.hostname}?`}
        danger
        cancelLabel="Keep"
        confirmLabel={busy ? "Removing…" : "Remove domain"}
        onConfirm={confirmRemove}
        pending={busy}
      >
        <p>Visitors to {removing?.hostname} will no longer reach your site. Your brandsapp.io address keeps working. You can connect the domain again later.</p>
      </Modal>
    </main>
  )
}
