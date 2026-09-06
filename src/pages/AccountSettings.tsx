import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../mock"
import { CardSkeleton, ErrorState, Icon, initials, Modal, PageHeader, RoleChip, useAsync, useToast } from "../ui"

export default function AccountSettings() {
  const toast = useToast()
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
    <main className="page narrow">
      <PageHeader title="Account settings" sub="Manage your account and brand details." backTo="/dashboard" backLabel="My Brands" />

      <div className="stack">
        {account.loading && <CardSkeleton lines={2} />}
        {account.error && <ErrorState message={account.error} onRetry={account.retry} />}
        {account.data && (
          <section className="card" aria-label="Profile">
            <div className="card-head">
              <div className="stat-headrow">
                <span className="stat-ico" aria-hidden="true"><Icon name="user" size={16} /></span>
                <h2 style={{ marginBottom: 0 }}>Profile</h2>
              </div>
            </div>
            <form onSubmit={save} noValidate>
              <div className="field">
                <label htmlFor="ac-name">Your name</label>
                <div className="inline-form">
                  <input id="ac-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  <button className="btn btn-primary" type="submit" disabled={!dirty || saving}>{saving ? "Saving…" : "Save"}</button>
                </div>
                <p className="help">Shown to your team on every brand you belong to.</p>
              </div>
              <div className="field">
                <label htmlFor="ac-email">Sign-in email</label>
                <input id="ac-email" className="input" value={account.data.email} disabled readOnly />
                <p className="help">This is how you sign in. To change it, contact support.</p>
              </div>
            </form>
          </section>
        )}

        <section className="card flush" aria-label="Your brands">
          <div className="card-head">
            <div>
              <h2>Your brands</h2>
              <p className="hint">Every brand this account can manage.</p>
            </div>
            <Link to="/dashboard/create" className="btn btn-white btn-sm"><Icon name="plus" size={15} />New brand</Link>
          </div>
          {brands.loading && <div style={{ padding: "0 22px 18px" }}><CardSkeleton lines={1} /></div>}
          {brands.error && <div style={{ padding: "0 22px 18px" }}><ErrorState message={brands.error} onRetry={brands.retry} /></div>}
          {brands.data && (
            <div className="rowlist">
              {brands.data.map((b) => (
                <div key={b.slug} className="row-item">
                  <div className="brand-avatar" style={{ width: 36, height: 36, fontSize: ".78rem" }} aria-hidden="true">{initials(b.name)}</div>
                  <div className="grow">
                    <div className="title">{b.name}</div>
                    <div className="meta">{b.domain}</div>
                  </div>
                  <div className="r-actions">
                    <RoleChip role={b.role} />
                    <Link to={`/dashboard/${b.slug}`} className="btn btn-secondary btn-sm">Open</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card" aria-label="Session">
          <div className="card-row">
            <div>
              <h2>Signed in on this device</h2>
              <p className="hint">You'll need to sign in again to manage your brands.</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setSignOut(true)}><Icon name="logout" size={15} />Sign out</button>
          </div>
        </section>
      </div>

      <Modal
        open={signOut}
        onClose={() => setSignOut(false)}
        title="Sign out of BrandsApp?"
        icon="logout"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setSignOut(false)}>Stay signed in</button>
            <button className="btn btn-primary" onClick={() => { setSignOut(false); toast("Sign-out isn't wired up in this prototype") }}>Sign out</button>
          </>
        }
      >
        <p>You'll need to sign in again to manage your brands.</p>
      </Modal>
    </main>
  )
}
