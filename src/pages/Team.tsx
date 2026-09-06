import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api, roleHelp, roleOption, type Role, type TeamMember } from "../mock"
import { Icon, useAsync } from "../ui"
import { Avatar, Button, Card, Chip, PageHeader, RoleChip } from "@/ui/primitives"
import {
  Field,
  Input,
  Modal,
  Note,
  RowMenu,
  Segmented,
  Select,
  Skeleton,
  CardSkeleton,
  ErrorState,
  toast,
} from "@/ui/controls"

type Filter = "all" | "active" | "invited"

export default function Team() {
  const { slug = "" } = useParams()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const team = useAsync(() => api.listTeam(slug), [slug])

  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("admin")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [removing, setRemoving] = useState<TeamMember | null>(null)
  const [changing, setChanging] = useState<TeamMember | null>(null)
  const [newRole, setNewRole] = useState<Role>("admin")
  const [busy, setBusy] = useState(false)

  const canManage = !!brand.data
  const isOwner = brand.data?.role === "owner"
  // An admin can do everything an owner can, except touch an owner.
  const canTouch = (m: TeamMember) => canManage && !m.you && (m.role !== "owner" || isOwner)
  // Roles are Owner or Admin only; an admin can only invite admins, so only owners get a choice.
  const roleChoices: Role[] = isOwner ? ["admin", "owner"] : ["admin"]
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

  const saveRole = async () => {
    // The primitive Modal disables Cancel and Save from one shared `pending`
    // flag, so there's no way to keep Save alone disabled while unchanged
    // (§5.2's "not yet valid" case). Treat "no change" as a quiet close
    // instead of a no-op API call.
    if (!changing || newRole === changing.role) {
      setChanging(null)
      return
    }
    setBusy(true)
    try {
      await api.setRole(slug, changing.id, newRole)
      toast("Role updated", "success")
      setChanging(null)
      team.retry()
    } catch {
      toast("Couldn't change that role — try again.", "error")
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
    <main className="mx-auto max-w-[1240px] px-4 pt-6 pb-[110px] min-[900px]:px-9 min-[900px]:pt-9">
      {/* §3.2: a small identity chip back to Overview, desktop only — the phone
          top bar already carries brand name + back chevron on every brand page. */}
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

      <PageHeader
        title="Team"
        subtitle="Who can manage this brand's account: billing, verification, domains and settings. Staff who work inside your apps are managed in the brand admin, not here."
      />

      <div className="grid grid-cols-1 items-start gap-3.5 min-[1000px]:grid-cols-[minmax(0,1fr)_380px]">
        {/* Members first: the page's promise is "who has access". */}
        <div>
          {team.loading && <CardSkeleton lines={3} />}
          {team.error && <ErrorState what="the team" onRetry={team.retry} />}
          {team.data && (
            <Card flush className="overflow-hidden" aria-label="People with access">
              <div className="flex flex-wrap items-start justify-between gap-3 px-[22px] pt-5">
                <div>
                  <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">
                    People with access <span className="font-medium text-[var(--ba-muted)]">· {members.length}</span>
                  </h2>
                  <p className="mt-1 max-w-[60ch] text-[0.88rem] text-[var(--ba-body)]">
                    Everyone here can manage the brand; only an owner can add or remove other owners.
                  </p>
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
              <div className="mt-3.5 flex flex-col divide-y divide-[var(--ba-line)]">
                {visible.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-[22px] py-3.5 sm:flex-nowrap">
                    <Avatar name={m.name} kind="person" size={36} soft={m.status === "invited"} />
                    <div className="min-w-0 flex-1 basis-[calc(100%-52px)] sm:basis-auto">
                      <div className="text-[0.94rem] font-semibold [overflow-wrap:anywhere]">
                        {m.name}
                        {m.you && <span className="font-medium text-[var(--ba-muted)]"> (you)</span>}
                      </div>
                      <div className="text-[0.83rem] text-[var(--ba-muted)] [overflow-wrap:anywhere]">{m.email}</div>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      {m.status === "invited" && <Chip tone="warn">Invited</Chip>}
                      <RoleChip role={m.role} />
                      <RowMenu
                        label={`Actions for ${m.name}`}
                        items={[
                          { label: "Copy email", onSelect: () => copyEmail(m) },
                          ...(canTouch(m) && m.status === "active" && roleChoices.length > 1
                            ? [{ label: "Change role…", onSelect: () => { setNewRole(m.role); setChanging(m) } }]
                            : []),
                          ...(canTouch(m)
                            ? [{ label: m.status === "invited" ? "Cancel invite" : "Remove from brand", danger: true, sep: true, onSelect: () => setRemoving(m) }]
                            : []),
                        ]}
                      />
                    </div>
                  </div>
                ))}
                {visible.length === 0 && (
                  <p className="px-[22px] py-[18px] text-[0.88rem] text-[var(--ba-body)]">Nobody matches this filter.</p>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Invite */}
        {canManage ? (
          <section aria-label="Invite someone">
            <Card>
              <div className="mb-3.5 flex items-center gap-2.5">
                <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-ink)]">
                  <Icon name="user-plus" size={16} />
                </span>
                <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Invite someone</h2>
              </div>
              <form onSubmit={invite} noValidate>
                <div className="mb-[18px]">
                  <Field label="Email address" htmlFor="tm-email" error={emailError}>
                    <Input
                      id="tm-email"
                      type="email"
                      placeholder="colleague@business.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? "tm-email-error" : undefined}
                    />
                  </Field>
                </div>
                <div className="mb-[18px]">
                  <Field label="Role" htmlFor="tm-role" help={roleHelp[role]}>
                    {roleChoices.length > 1 ? (
                      <Select id="tm-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                        {roleChoices.map((r) => (
                          <option key={r} value={r}>{roleOption[r]}</option>
                        ))}
                      </Select>
                    ) : (
                      <Input id="tm-role" value={roleOption.admin} disabled readOnly />
                    )}
                  </Field>
                </div>
                <Button type="submit" variant="primary" block className="mt-1.5" disabled={inviting || !email.trim()}>
                  {inviting ? "Sending invite…" : (<>Send invite <Icon name="mail" size={15} /></>)}
                </Button>
              </form>
            </Card>
          </section>
        ) : brand.error ? (
          <Note>
            <div className="flex items-start gap-2.5">
              <Icon name="warning" size={14} />
              <span>
                We couldn't confirm your role on this brand, so managing the team is hidden.{" "}
                <button type="button" className="font-semibold underline underline-offset-2" onClick={brand.retry}>
                  Try again
                </button>
              </span>
            </div>
          </Note>
        ) : null}
      </div>

      <Modal
        open={changing != null}
        onClose={() => !busy && setChanging(null)}
        title={`Change ${changing?.name}'s role`}
        confirmLabel={busy ? "Saving…" : "Save role"}
        onConfirm={saveRole}
        pending={busy}
      >
        <div className="mt-3.5">
          <Field label="Role" htmlFor="tm-newrole" help={roleHelp[newRole]}>
            <Select id="tm-newrole" value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>
              {roleChoices.map((r) => (
                <option key={r} value={r}>{roleOption[r]}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={removing != null}
        onClose={() => !busy && setRemoving(null)}
        title={removing?.status === "invited" ? `Cancel the invite for ${removing.name}?` : `Remove ${removing?.name}?`}
        danger
        cancelLabel="Keep"
        confirmLabel={busy ? "Removing…" : removing?.status === "invited" ? "Cancel invite" : "Remove"}
        onConfirm={confirmRemove}
        pending={busy}
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
