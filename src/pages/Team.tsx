import { useState } from "react"
import { useParams } from "react-router-dom"
import { api, roleHelp, roleLabel, type Role } from "../mock"
import { BrandHeader } from "../layout"
import { CardSkeleton, ErrorState, initials, RoleChip, useAsync, useToast } from "../ui"

export default function Team() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const team = useAsync(() => api.listTeam(slug), [slug])

  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("admin")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)

  const canManage = brand.data?.role === "owner" || brand.data?.role === "admin"

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a full email address, like ada@business.com.")
      return
    }
    if (team.data?.some((m) => m.email.toLowerCase() === trimmed.toLowerCase())) {
      setEmailError("That person is already on this team.")
      return
    }
    setEmailError(null)
    setInviting(true)
    try {
      await api.inviteMember(slug, trimmed, role)
      toast(`Invite sent to ${trimmed}`)
      setEmail("")
      team.retry()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't send the invite — try again.")
    } finally {
      setInviting(false)
    }
  }

  const remove = async (id: string, name: string) => {
    try {
      await api.removeMember(slug, id)
      toast(`${name} removed from this brand`)
      team.retry()
    } catch {
      toast("Couldn't remove that person — try again.")
    }
  }

  return (
    <main className="page">
      <BrandHeader slug={slug} title="Team" />
      <p className="sub" style={{ marginTop: -8, marginBottom: 20, color: "var(--body-c)" }}>
        Who can manage this brand's account — billing, domains and settings. Staff who work inside
        your apps are managed in the brand admin, not here.
      </p>

      <div className="stack">
        {/* Members first: the page's promise is "who has access". */}
        {team.loading && <CardSkeleton lines={3} />}
        {team.error && <ErrorState message={team.error} onRetry={team.retry} />}
        {team.data && (
          <section className="card" aria-label="People with access">
            <h2>
              People with access{" "}
              <span style={{ color: "var(--muted)", fontWeight: 500 }}>· {team.data.length}</span>
            </h2>
            <div className="rowlist" style={{ marginTop: 6 }}>
              {team.data.map((m) => (
                <div key={m.id} className="row-item">
                  <div className="avatar" aria-hidden="true">
                    {initials(m.name)}
                  </div>
                  <div className="grow">
                    <div className="title">
                      {m.name}
                      {m.you && <span style={{ color: "var(--muted)", fontWeight: 500 }}> (you)</span>}
                    </div>
                    <div className="meta">{m.email}</div>
                  </div>
                  {m.status === "invited" && <span className="chip chip-neutral">Invited</span>}
                  <RoleChip role={m.role} />
                  {canManage && m.role !== "owner" && !m.you && (
                    <button
                      className="btn btn-danger-ghost btn-sm"
                      onClick={() => remove(m.id, m.name)}
                      aria-label={`Remove ${m.name}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Invite */}
        {canManage ? (
          <section className="card" aria-label="Invite someone">
            <h2>Invite someone</h2>
            <form onSubmit={invite} noValidate style={{ marginTop: 8 }}>
              <div className="field">
                <label htmlFor="tm-email">Email address</label>
                <input
                  id="tm-email"
                  className="input"
                  type="email"
                  placeholder="colleague@business.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError(null)
                  }}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "tm-email-error" : undefined}
                />
                {emailError && (
                  <p id="tm-email-error" className="error-text">
                    {emailError}
                  </p>
                )}
              </div>
              <div className="field">
                <label htmlFor="tm-role">Role</label>
                <select
                  id="tm-role"
                  className="input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  {(["admin", "member"] as Role[]).map((r) => (
                    <option key={r} value={r}>
                      {roleLabel[r]}
                    </option>
                  ))}
                </select>
                <p className="help">{roleHelp[role]}</p>
              </div>
              <button className="btn btn-primary btn-sm" type="submit" disabled={inviting || !email.trim()}>
                {inviting ? "Sending invite…" : "Send invite"}
              </button>
            </form>
          </section>
        ) : brand.error ? (
          <p className="hint" style={{ color: "var(--muted)" }}>
            We couldn't confirm your role on this brand, so managing the team is hidden.{" "}
            <button className="btn btn-ghost btn-sm" onClick={brand.retry}>
              Try again
            </button>
          </p>
        ) : (
          brand.data && (
            <p className="hint" style={{ color: "var(--muted)" }}>
              Only an owner or admin can invite or remove people.
            </p>
          )
        )}
      </div>
    </main>
  )
}
