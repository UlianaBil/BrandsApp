import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { api, fmtDate } from "../mock"
import { Icon, useAsync } from "../ui"
import { Button, Card, Chip, PageHeader } from "@/ui/primitives"
import { CardSkeleton, ErrorState, Modal, Note, toast } from "@/ui/controls"
import { DomainStatusChip } from "./Settings"

export default function Domain() {
  const { slug = "", id = "" } = useParams()
  const navigate = useNavigate()
  const domain = useAsync(() => api.getDomain(slug, id), [slug, id])
  const [checking, setChecking] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [busy, setBusy] = useState(false)

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast("Copied", "success")
    } catch {
      toast("Couldn't copy. Long-press the value instead.", "error")
    }
  }

  const check = async () => {
    setChecking(true)
    try {
      const r = await api.refreshDomain(slug, id)
      toast(r.status === "active" ? "Your domain is live" : "Still not pointing at BrandsApp. Check the records and try again.", r.status === "active" ? "success" : "error")
      domain.retry()
    } catch {
      toast("Couldn't check the domain. Try again.", "error")
    } finally {
      setChecking(false)
    }
  }

  const confirmRemove = async () => {
    setBusy(true)
    try {
      await api.removeDomain(slug, id)
      toast(`${domain.data?.hostname} disconnected`, "success")
      navigate(`/dashboard/${slug}/settings`)
    } catch {
      toast("Couldn't remove that domain. Try again.", "error")
      setBusy(false)
    }
  }

  const d = domain.data

  return (
    <main className="mx-auto max-w-[680px] px-4 pt-6 pb-[110px] min-[900px]:px-9 min-[900px]:pt-9">
      {/* Sub-flow of Settings: this back link, unlike a top-level brand page's,
          shows at every width — the phone top bar only goes back to My Brands (§3.2). */}
      <Link
        to={`/dashboard/${slug}/settings`}
        className="mb-3.5 inline-flex max-w-full items-center gap-2 text-[0.9rem] font-semibold text-[var(--ba-body)] transition-colors hover:text-[var(--ba-ink)]"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--ba-line)] bg-[var(--ba-paper)]">
          <Icon name="back" size={16} />
        </span>
        <span className="truncate">Settings</span>
      </Link>

      <PageHeader
        title={d?.hostname ?? "Domain"}
        subtitle={
          d
            ? d.status === "active"
              ? "Connected and serving your site."
              : d.status === "failed"
                ? "The last check couldn't find these records. Fix them at your DNS provider and check again."
                : "Add the records below at your DNS provider, then check."
            : undefined
        }
        actions={d ? <DomainStatusChip status={d.status} /> : undefined}
      />

      {domain.loading && <CardSkeleton lines={3} />}
      {domain.error && <ErrorState what="this domain" onRetry={domain.retry} />}

      {d && (
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-2.5 min-[700px]:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] min-[700px]:gap-3.5">
            <Card className="flex flex-col gap-1.5 p-3.5 min-[700px]:gap-2 min-[700px]:p-[18px_20px]">
              <span className="text-[0.8rem] font-medium text-[var(--ba-body)]">Added</span>
              <span className="ba-num text-[1.05rem] font-semibold tracking-[-0.02em] min-[700px]:text-[1.15rem]">{fmtDate(d.addedAt)}</span>
            </Card>
            <Card className="flex flex-col gap-1.5 p-3.5 min-[700px]:gap-2 min-[700px]:p-[18px_20px]">
              <span className="text-[0.8rem] font-medium text-[var(--ba-body)]">Last checked</span>
              <span className="ba-num text-[1.05rem] font-semibold tracking-[-0.02em] min-[700px]:text-[1.15rem]">
                {d.lastCheckedAt ? fmtDate(d.lastCheckedAt) : "Not yet"}
              </span>
            </Card>
          </div>

          <Card flush className="overflow-hidden" aria-label="DNS records">
            <div className="px-[22px] pt-5">
              <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Add these records at your DNS provider</h2>
              <p className="mt-0.5 text-[0.88rem] text-[var(--ba-body)]">
                DNS changes can take a few minutes to a few hours. Press Check once you've added them.
              </p>
            </div>
            <div className="mt-3.5 flex flex-col divide-y divide-[var(--ba-line)]">
              {d.records.map((r) => (
                <div key={r.type + r.name} className="flex flex-col gap-2 px-[22px] py-3.5 min-[700px]:flex-row min-[700px]:items-center min-[700px]:gap-4">
                  <div className="flex items-center gap-2 min-[700px]:basis-[90px]">
                    <Chip tone="neutral" dot={false}>{r.type}</Chip>
                  </div>
                  <div className="min-w-0 text-[0.9rem] font-semibold [overflow-wrap:anywhere] min-[700px]:basis-[22%]">
                    <span className="mr-1.5 font-medium text-[var(--ba-muted)] min-[700px]:hidden">Name</span>
                    {r.name}
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="min-w-0 flex-1 font-mono text-[0.84rem] text-[var(--ba-muted)] [overflow-wrap:anywhere]">{r.value}</span>
                    <button
                      type="button"
                      aria-label={`Copy ${r.type} value`}
                      onClick={() => copy(r.value)}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--ba-muted)] transition-colors hover:bg-[var(--ba-soft)]"
                    >
                      <Icon name="copy" size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2.5 border-t border-[var(--ba-line)] px-[22px] py-3.5">
              {d.status !== "active" ? (
                <Button variant="primary" onClick={check} disabled={checking}>
                  {checking ? "Checking…" : (<><Icon name="refresh" size={15} />Check DNS</>)}
                </Button>
              ) : (
                <span className="text-[0.88rem] text-[var(--ba-body)]">Records verified. Nothing more to do here.</span>
              )}
              <Button variant="dangerGhost" className="ml-auto" onClick={() => setRemoving(true)}>
                Remove domain
              </Button>
            </div>
          </Card>

          <Note>
            <div className="flex items-center gap-2.5">
              <Icon name="info" size={14} />
              Your brand stays reachable at its brandsapp.io address whatever happens with this domain.
            </div>
          </Note>
        </div>
      )}

      <Modal
        open={removing}
        onClose={() => !busy && setRemoving(false)}
        title={`Remove ${d?.hostname}?`}
        danger
        cancelLabel="Keep"
        confirmLabel={busy ? "Removing…" : "Remove domain"}
        onConfirm={confirmRemove}
        pending={busy}
      >
        <p>Visitors to {d?.hostname} will no longer reach your site. Your brandsapp.io address keeps working. You can connect the domain again later.</p>
      </Modal>
    </main>
  )
}
