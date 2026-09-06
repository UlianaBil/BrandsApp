import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { api, fmtDate } from "../mock"
import { CardSkeleton, ErrorState, Icon, Modal, PageHeader, useAsync, useToast } from "../ui"
import { DomainStatusChip } from "./Settings"

export default function Domain() {
  const { slug = "", id = "" } = useParams()
  const toast = useToast()
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
    <main className="page narrow">
      <PageHeader
        slug={slug}
        title={d?.hostname ?? "Domain"}
        sub={d ? (d.status === "active" ? "Connected and serving your site." : d.status === "failed" ? "The last check couldn't find these records. Fix them at your DNS provider and check again." : "Add the records below at your DNS provider, then check.") : undefined}
        backTo={`/dashboard/${slug}/settings`}
        backLabel="Settings"
        actions={d ? <DomainStatusChip status={d.status} /> : undefined}
      />

      {domain.loading && <CardSkeleton lines={3} />}
      {domain.error && <ErrorState message={domain.error} onRetry={domain.retry} />}

      {d && (
        <div className="stack">
          <div className="facts">
            <div className="card"><span className="stat-title">Added</span><span className="fact-v" style={{ fontSize: "1rem" }}>{fmtDate(d.addedAt)}</span></div>
            <div className="card"><span className="stat-title">Last checked</span><span className="fact-v" style={{ fontSize: "1rem" }}>{d.lastCheckedAt ? fmtDate(d.lastCheckedAt) : "Not yet"}</span></div>
          </div>

          <section className="card flush" aria-label="DNS records">
            <div className="card-head">
              <div>
                <h2>Add these records at your DNS provider</h2>
                <p className="hint">DNS changes can take a few minutes to a few hours. Press Check once you've added them.</p>
              </div>
            </div>
            <div className="table" style={{ ["--cols" as string]: "90px minmax(0,1fr) minmax(0,1.4fr) 40px" }}>
              <div className="tr th"><span>Type</span><span>Name</span><span>Value</span><span /></div>
              {d.records.map((r) => (
                <div key={r.type + r.name} className="tr">
                  <span className="td"><span className="lbl">Type</span><span className="chip chip-neutral">{r.type}</span></span>
                  <span className="td strong" style={{ overflowWrap: "anywhere" }}><span className="lbl">Name</span>{r.name}</span>
                  <span className="td muted span" style={{ overflowWrap: "anywhere", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: ".84rem" }}>{r.value}</span>
                  <span className="td end">
                    <button type="button" className="iconbtn sm" aria-label={`Copy ${r.type} value`} onClick={() => copy(r.value)}><Icon name="copy" size={15} /></button>
                  </span>
                </div>
              ))}
            </div>
            <div className="card-foot" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {d.status !== "active" ? (
                <button className="btn btn-primary" onClick={check} disabled={checking}>
                  {checking ? "Checking…" : (<><Icon name="refresh" size={15} />Check DNS</>)}
                </button>
              ) : (
                <span className="hint">Records verified. Nothing more to do here.</span>
              )}
              <button className="btn btn-danger-ghost" style={{ marginLeft: "auto" }} onClick={() => setRemoving(true)}>Remove domain</button>
            </div>
          </section>

          <p className="member-note block">
            <span className="ico"><Icon name="info" size={14} /></span>
            Your brand stays reachable at its brandsapp.io address whatever happens with this domain.
          </p>
        </div>
      )}

      <Modal
        open={removing}
        onClose={() => !busy && setRemoving(false)}
        title={`Remove ${d?.hostname}?`}
        icon="trash"
        danger
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRemoving(false)} disabled={busy}>Keep</button>
            <button className="btn btn-danger" onClick={confirmRemove} disabled={busy}>{busy ? "Removing…" : "Remove domain"}</button>
          </>
        }
      >
        <p>Visitors to {d?.hostname} will no longer reach your site. Your brandsapp.io address keeps working. You can connect the domain again later.</p>
      </Modal>
    </main>
  )
}
