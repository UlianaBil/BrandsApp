import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../mock"
import { Icon, useAsync } from "../ui"
import { Avatar, Button, buttonVariants, Card, PageHeader, RoleChip } from "@/ui/primitives"
import { CardSkeleton, ErrorState, Field, Input, Modal, toast } from "@/ui/controls"
import { cn } from "@/ui/cn"

/**
 * Reached from the account menu, never from the brand nav (§11 worked example
 * "Account-level pages"). There is no brand context here, so the back link
 * shows at every width — outside a brand the phone top bar has no chevron of
 * its own to carry that navigation (§3.1 "Outside a brand").
 */
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

export default function AccountSettings() {
  const account = useAsync(() => api.getAccount(), [])
  const brands = useAsync(() => api.listBrands(), [])
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [signOut, setSignOut] = useState(false)

  useEffect(() => {
    if (account.data) setName(account.data.name)
  }, [account.data])

  const dirty = !!account.data && name.trim().length > 1 && name.trim() !== account.data.name

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dirty) return
    setSaving(true)
    try {
      await api.updateAccount(name.trim())
      toast("Name saved", "success")
      account.retry()
    } catch {
      toast("Couldn't save your name — try again.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-[680px] px-4 pt-6 pb-[110px] min-[900px]:px-9 min-[900px]:pt-9">
      <BackLink />
      <PageHeader title="Account settings" subtitle="Manage your account and brand details." />

      <div className="flex flex-col gap-3.5">
        {account.loading && <CardSkeleton lines={2} />}
        {account.error && <ErrorState what="your account" onRetry={account.retry} />}
        {account.data && (
          <Card aria-label="Profile">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-body)]">
                <Icon name="user" size={16} />
              </span>
              <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Profile</h2>
            </div>
            <form onSubmit={save} noValidate className="flex flex-col gap-3.5">
              <Field label="Your name" htmlFor="ac-name" help="Shown to your team on every brand you belong to.">
                <div className="flex flex-wrap items-start gap-2.5">
                  <Input
                    id="ac-name"
                    className="min-w-[220px] flex-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                  {/* §6.4: the button wraps to full width under 560px in an inline-form. */}
                  <Button type="submit" disabled={!dirty || saving} className="w-full min-[560px]:w-auto">
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </Field>
              <Field label="Sign-in email" htmlFor="ac-email" help="This is how you sign in. To change it, contact support.">
                <Input id="ac-email" value={account.data.email} disabled readOnly />
              </Field>
            </form>
          </Card>
        )}

        <Card flush aria-label="Your brands">
          <div className="flex items-start justify-between gap-3 px-[22px] pt-5">
            <div>
              <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Your brands</h2>
              <p className="mt-0.5 text-[0.88rem] text-[var(--ba-body)]">Every brand this account can manage.</p>
            </div>
            <Link to="/dashboard/create" className={cn(buttonVariants({ variant: "white", size: "sm" }))}>
              <Icon name="plus" size={15} />
              New brand
            </Link>
          </div>
          {brands.loading && <div className="px-[22px] pt-3.5 pb-[18px]"><CardSkeleton lines={1} /></div>}
          {brands.error && <div className="px-[22px] pt-3.5 pb-[18px]"><ErrorState what="your brands" onRetry={brands.retry} /></div>}
          {brands.data && (
            <div className="mt-3.5 flex flex-col [&>*+*]:border-t [&>*+*]:border-[var(--ba-line)]">
              {brands.data.map((b) => (
                <div key={b.slug} className="flex items-center gap-3 px-[22px] py-3.5">
                  <Avatar name={b.name} kind="brand" size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.94rem] font-semibold [overflow-wrap:anywhere]">{b.name}</div>
                    <div className="text-[0.83rem] text-[var(--ba-muted)] [overflow-wrap:anywhere]">{b.domain}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <RoleChip role={b.role} />
                    <Link to={`/dashboard/${b.slug}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card aria-label="Session">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Signed in on this device</h2>
              <p className="mt-0.5 text-[0.88rem] text-[var(--ba-body)]">You&apos;ll need to sign in again to manage your brands.</p>
            </div>
            <Button variant="secondary" onClick={() => setSignOut(true)}>
              <Icon name="logout" size={15} />
              Sign out
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        open={signOut}
        onClose={() => setSignOut(false)}
        title="Sign out of BrandsApp?"
        body="You'll need to sign in again to manage your brands."
        confirmLabel="Sign out"
        onConfirm={() => {
          setSignOut(false)
          toast("Sign-out isn't wired up in this prototype")
        }}
        cancelLabel="Stay signed in"
      />
    </main>
  )
}
