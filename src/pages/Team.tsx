import { useState } from "react"
import { useParams } from "react-router-dom"
import { api, roleHelp, roleLabel, type Role, type TeamMember } from "../mock"
import { CardSkeleton, ErrorState, Icon, initials, Menu, Modal, PageHeader, RoleChip, Segmented, useAsync, useToast } from "../ui"

type Filter = "all" | "active" | "invited"

export default function Team() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const team = useAsync(() => api.listTeam(slug), [slug])

  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("admin")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [removing, setRemoving] = useState<TeamMember | null>(null)
  const [busy, setBusy] = useState(false)

  const canManage = brand.data?.role === "owner" || brand.data?.role === "admin"
  const members = team.data ?? []
  const invitedCount = members.filter((m) => m.status === "invited").length
  const visible = members.filter((m) => (filter === "all" ? true : m.status === filter))

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a full email address, like ada@business.com.")
      return
    }
    if (members.some((m) => m.email.toLowerCase() === trimmed.toLowerCase())) {
      setEmailError("That person is already on this team.")
      return
    }
    setEmailError(null)
    setInviting(true)
    try {
      await api.inviteMember(slug, trimmed, role)
      toast(`Invite sent to ${trimmed}`, "success")
      setEmail("")
      team.retry()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't send the invite — try again.", "error")
    } finally {
      setInviting(false)
    }
  }

  const confirmRemove = async () => {
    if (!removing) return
    setBusy(true)
    try {
      await api.removeMember(slug, removing.id)
      toast(`${removing.name} removed from this brand`, "success")
      setRemoving(null)
      team.retry()
    } catch {
      toast("Couldn't remove that person — try again.", "error")
    } finally {
      setBusy(false)
    }
  }

  const copyEmail = async (m: TeamMember) => {
    try {
      await navigator.clipboard.writeText(m.email)
      toast("Email copied", "success")
    } catch {
      toast("Couldn't copy the email", "error")
    }
  }

  return (
    <main className="page">
      <PageHeader
        slug={slug}
        title="Team"
        sub="Who can manage this brand's account — billing, domains and settings. Staff who work inside your apps are managed in the brand admin, not here."
      />

      <div className="split">
        {/* Members first: the page's promise is "who has access". */}
        <div>
          {team.loading && <CardSkeleton lines={3} />}
          {team.error && <ErrorState message={team.error} onRetry={team.retry} />}
          {team.data && (
            <section className="card flush" aria-label="People with access">
              <div className="card-head">
                <div>
                  <h2>People with access <span style={{ color: "var(--muted)", fontWeight: 500 }}>· {members.length}</span></h2>
                  <p className="hint">Owners and admins can change anything here; members can only view.</p>
                </div>
                {invitedCount > 0 && (
                  <Segmented<Filter>
                    label="Filter people"
                    value={filter}
                    onChange={setFilter}
                    options={[
                      { value: "all", label: "All", count: members.length },
                      { value: "active", label: "Active", count: members.length - invitedCount },
                      { value: "invited", label: "Invited", count: invitedCount },
                    ]}
                  />
                )}
              </div>
              <div className="rowlist">
                {visible.map((m) => (
                  <div key={m.id} className="row-item">
                    <div className={`avatar${m.status === "invited" ? " soft" : ""}`} aria-hidden="true">{initials(m.name)}</div>
                    <div className="grow">
                      <div className="title">
                        {m.name}
                        {m.you && <span style={{ color: "var(--muted)", fontWeight: 500 }}> (you)</span>}
                      </div>
                      <div className="meta">{m.email}</div>
                    </div>
                    <div className="r-actions">
                      {m.status === "invited" && <span className="chip chip-warn"><span className="dot" />Invited</span>}
                      <RoleChip role={m.role} />
                      <Menu
                        label={`Actions for ${m.name}`}
                        items={[
                          { label: "Copy email", icon: "copy", onSelect: () => copyEmail(m) },
                          ...(canManage && m.role !== "owner" && !m.you
                            ? [{ label: m.status === "invited" ? "Cancel invite" : "Remove from brand", icon: "trash" as const, danger: true, onSelect: () => setRemoving(m) }]
                            : []),
                        ]}
                      />
                    </div>
                  </div>
                ))}
                {visible.length === 0 && (
                  <p className="hint" style={{ padding: "18px 22px" }}>Nobody matches this filter.</p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Invite */}
        {canManage ? (
          <section className="card" aria-label="Invite someone">
            <div className="stat-headrow" style={{ marginBottom: 14 }}>
              <span className="stat-ico" aria-hidden="true"><Icon name="user-plus" size={16} /></span>
              <h2 style={{ marginBottom: 0 }}>Invite someone</h2>
            </div>
            <form onSubmit={invite} noValidate>
              <div className="field">
                <label htmlFor="tm-email">Email address</label>
                <input
                  id="tm-email"
                  className="input"
                  type="email"
                  placeholder="colleague@business.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "tm-email-error" : undefined}
                />
                {emailError && <p id="tm-email-error" className="error-text"><Icon name="warning" size={14} />{emailError}</p>}
              </div>
              <div className="field">
                <label htmlFor="tm-role">Role</label>
                <select id="tm-role" className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  {(["admin", "member"] as Role[]).map((r) => (<option key={r} value={r}>{roleLabel[r]}</option>))}
                </select>
                <p className="help">{roleHelp[role]}</p>
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={inviting || !email.trim()} style={{ marginTop: 6 }}>
                {inviting ? "Sending invite…" : (<>Send invite <Icon name="mail" size={15} /></>)}
              </button>
            </form>
          </section>
        ) : brand.error ? (
          <p className="member-note block" style={{ marginTop: 0 }}>
            <span className="ico"><Icon name="warning" size={14} /></span>
            <span>
              We couldn't confirm your role on this brand, so managing the team is hidden.{" "}
              <button className="text-link" style={{ background: "none", border: "none", padding: 0 }} onClick={brand.retry}>Try again</button>
            </span>
          </p>
        ) : brand.data ? (
          <p className="member-note block" style={{ marginTop: 0 }}>
            <span className="ico"><Icon name="lock" size={14} /></span>
            Only an owner or admin can invite or remove people.
          </p>
        ) : null}
      </div>

      <Modal
        open={removing != null}
        onClose={() => !busy && setRemoving(null)}
        title={removing?.status === "invited" ? `Cancel the invite for ${removing.name}?` : `Remove ${removing?.name}?`}
        icon="trash"
        danger
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRemoving(null)} disabled={busy}>Keep</button>
            <button className="btn btn-danger" onClick={confirmRemove} disabled={busy}>
              {busy ? "Removing…" : removing?.status === "invited" ? "Cancel invite" : "Remove"}
            </button>
          </>
        }
      >
        <p>
          {removing?.status === "invited"
            ? `${removing.email} won't be able to accept the invite. You can invite them again later.`
            : `${removing?.email} will lose access to this brand's dashboard right away. Anything they set up stays in place.`}
        </p>
      </Modal>
    </main>
  )
}
