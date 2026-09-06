import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api, fmtDate, type Kyc as KycRecord } from "../mock"
import { CardSkeleton, ErrorState, Icon, PageHeader, useAsync, useToast } from "../ui"

const STATUS: Record<KycRecord["status"], { label: string; chip: string; dot: boolean }> = {
  not_started: { label: "Not started", chip: "chip-neutral", dot: false },
  pending: { label: "Pending review", chip: "chip-warn", dot: true },
  verified: { label: "Verified", chip: "chip-good", dot: true },
  rejected: { label: "Rejected", chip: "chip-bad", dot: true },
}

const mask = (n?: string) => (n ? `•••• ${n.slice(-4)}` : "")

export default function Kyc() {
  const { slug = "" } = useParams()
  const toast = useToast()
  const brand = useAsync(() => api.getBrand(slug), [slug])
  const kyc = useAsync(() => api.getKyc(slug), [slug])
  const banks = useAsync(() => api.listBanks(), [])

  const [businessName, setBusinessName] = useState("")
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bvn, setBvn] = useState("")
  const [cac, setCac] = useState("")
  const [accountName, setAccountName] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Pre-fill from a previous submission so a rejected brand fixes, not retypes.
  useEffect(() => {
    const k = kyc.data
    if (!k || k.status === "not_started") return
    setBusinessName(k.businessName ?? "")
    setBankCode(k.bankCode ?? "")
    setAccountNumber(k.accountNumber ?? "")
    setCac(k.cacNumber ?? "")
    setAccountName(k.accountName ?? null)
  }, [kyc.data])

  const canManage = brand.data?.role === "owner" || brand.data?.role === "admin"
  const bankName = useMemo(() => banks.data?.find((b) => b.code === bankCode)?.name ?? "", [banks.data, bankCode])
  const canResolve = !!bankCode && /^\d{10}$/.test(accountNumber) && !resolving
  const canSubmit = businessName.trim().length >= 2 && !!bankCode && /^\d{10}$/.test(accountNumber) && !!accountName && !submitting

  const resolve = async () => {
    if (!canResolve) return
    setResolving(true)
    setResolveError(null)
    setAccountName(null)
    try {
      const r = await api.resolveAccount(bankCode, accountNumber)
      setAccountName(r.accountName)
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : "Couldn't check that account — try again.")
    } finally {
      setResolving(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountName) {
      setFormError("Verify the account number first so we know where to pay you.")
      return
    }
    if (!canSubmit) {
      setFormError("Enter your business name, bank, and 10-digit account number.")
      return
    }
    setFormError(null)
    setSubmitting(true)
    try {
      await api.submitKyc(slug, {
        businessName: businessName.trim(),
        bankCode,
        bankName,
        accountNumber,
        accountName,
        bvn: bvn.trim() || undefined,
        cacNumber: cac.trim() || undefined,
      })
      toast("Submitted — we'll review it and let you know", "success")
      kyc.retry()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't submit — try again.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const status = kyc.data?.status ?? "not_started"
  const st = STATUS[status]

  return (
    <main className="page narrow">
      <PageHeader
        slug={slug}
        title="Business verification"
        sub="Verify your business and settlement bank account before you can accept payments from customers."
        backTo={`/dashboard/${slug}/billing`}
        backLabel="Billing"
        actions={kyc.data ? <span className={`chip ${st.chip}`}>{st.dot && <span className="dot" />}{st.label}</span> : undefined}
      />

      {kyc.loading && <CardSkeleton lines={4} />}
      {kyc.error && <ErrorState message={kyc.error} onRetry={kyc.retry} />}

      {kyc.data && status === "verified" && (
        <div className="stack">
          <section className="card" aria-label="Verified account">
            <div className="stat-headrow" style={{ marginBottom: 14 }}>
              <span className="stat-ico" aria-hidden="true"><Icon name="shield" size={16} /></span>
              <h2 style={{ marginBottom: 0 }}>You're verified</h2>
            </div>
            <div className="facts">
              <div className="card"><span className="stat-title">Business</span><span className="fact-v" style={{ fontSize: "1rem" }}>{kyc.data.businessName}</span></div>
              <div className="card"><span className="stat-title">Account name</span><span className="fact-v" style={{ fontSize: "1rem" }}>{kyc.data.accountName}</span></div>
              <div className="card"><span className="stat-title">Bank</span><span className="fact-v" style={{ fontSize: "1rem" }}>{kyc.data.bankName}</span></div>
              <div className="card"><span className="stat-title">Account number</span><span className="fact-v" style={{ fontSize: "1rem" }}>{mask(kyc.data.accountNumber)}</span></div>
              {kyc.data.cacNumber && <div className="card"><span className="stat-title">CAC/RC number</span><span className="fact-v" style={{ fontSize: "1rem" }}>{kyc.data.cacNumber}</span></div>}
            </div>
            <p className="hint quiet" style={{ marginTop: 14 }}>
              Payouts settle to this account{kyc.data.submittedAt ? ` · verified ${fmtDate(kyc.data.submittedAt)}` : ""}. To change it, contact support.
            </p>
          </section>
          <p className="member-note">
            <span className="ico"><Icon name="check" size={14} /></span>
            Card, transfer and USSD payments are switched on at checkout.
          </p>
        </div>
      )}

      {kyc.data && status !== "verified" && (
        <div className="stack">
          {status === "pending" && (
            <p className="member-note block warn" style={{ marginTop: 0 }}>
              <span className="ico"><Icon name="info" size={14} /></span>
              <span>Your submission{kyc.data.submittedAt ? ` from ${fmtDate(kyc.data.submittedAt)}` : ""} is under review — usually a business day. You can resubmit if anything was wrong.</span>
            </p>
          )}
          {status === "rejected" && (
            <p className="member-note block" style={{ marginTop: 0, background: "var(--bad-bg)", borderColor: "transparent", color: "var(--bad)" }}>
              <span className="ico" style={{ background: "rgba(255,255,255,.6)", color: "var(--bad)" }}><Icon name="warning" size={14} /></span>
              <span>{kyc.data.reason ?? "Something didn't match on your last submission."} Check the details below and submit again.</span>
            </p>
          )}

          {!canManage && brand.data ? (
            <p className="member-note block" style={{ marginTop: 0 }}>
              <span className="ico"><Icon name="lock" size={14} /></span>
              Only an owner or admin can submit business verification.
            </p>
          ) : (
            <form className="card" onSubmit={submit} noValidate>
              <div className="card-head" style={{ marginBottom: 18 }}>
                <div>
                  <h2>Submit your details</h2>
                  <p className="hint">Who you are, and the bank account your earnings should settle into.</p>
                </div>
              </div>

              <div className="field">
                <label htmlFor="kyc-name">Registered business name</label>
                <input id="kyc-name" className="input" placeholder="e.g. Adaeze Fashion Ltd" value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoComplete="organization" />
              </div>

              <div className="field">
                <label htmlFor="kyc-bank">Settlement bank</label>
                <select
                  id="kyc-bank"
                  className="input"
                  value={bankCode}
                  disabled={banks.loading}
                  onChange={(e) => { setBankCode(e.target.value); setAccountName(null); setResolveError(null) }}
                >
                  <option value="">{banks.loading ? "Loading banks…" : "Select bank…"}</option>
                  {banks.data?.map((b) => (<option key={b.code} value={b.code}>{b.name}</option>))}
                </select>
                {banks.error && <p className="error-text"><Icon name="warning" size={14} />Couldn't load the bank list. <button type="button" className="text-link" style={{ background: "none", border: "none", padding: 0 }} onClick={banks.retry}>Try again</button></p>}
              </div>

              <div className="field">
                <label htmlFor="kyc-acct">Account number</label>
                <div className="inline-form">
                  <div className={`input-group${resolveError ? " invalid" : ""}`}>
                    <span className="addon lead" aria-hidden="true"><Icon name="bank" size={16} /></span>
                    <input
                      id="kyc-acct"
                      className="input"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="0123456789"
                      value={accountNumber}
                      onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "")); setAccountName(null); setResolveError(null) }}
                      aria-invalid={!!resolveError}
                      aria-describedby="kyc-acct-status"
                    />
                  </div>
                  <button type="button" className="btn btn-secondary" disabled={!canResolve} onClick={resolve}>
                    {resolving ? "Checking…" : "Verify"}
                  </button>
                </div>
                <p id="kyc-acct-status" className={resolveError ? "error-text" : `help${accountName ? " ok" : ""}`} aria-live="polite">
                  {resolveError && (<><Icon name="warning" size={14} />{resolveError}</>)}
                  {!resolveError && accountName && (<><Icon name="check" size={14} />{accountName}</>)}
                  {!resolveError && !accountName && "We confirm the account name with your bank instantly."}
                </p>
              </div>

              <div className="field">
                <label htmlFor="kyc-bvn">BVN<span className="optional">Optional</span></label>
                <input id="kyc-bvn" className="input" inputMode="numeric" maxLength={11} placeholder="11-digit BVN" value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))} />
                <p className="help">Unlocks higher transaction limits. Stored securely and never shared.</p>
              </div>

              <div className="field">
                <label htmlFor="kyc-cac">CAC/RC number<span className="optional">Optional</span></label>
                <input id="kyc-cac" className="input" placeholder="e.g. RC1234567" value={cac} onChange={(e) => setCac(e.target.value)} />
              </div>

              {formError && <p className="error-text" style={{ marginBottom: 12 }}><Icon name="warning" size={14} />{formError}</p>}

              <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={submitting} style={{ marginTop: 12 }}>
                {submitting ? "Submitting…" : status === "not_started" ? "Submit for verification" : "Resubmit for verification"}
              </button>
              <p className="hint quiet" style={{ textAlign: "center", marginTop: 12 }}>
                We verify your account with your bank via Paystack. Your BVN is stored securely and never shared.
              </p>
            </form>
          )}

          <details className="explainer">
            <summary><span className="ico"><Icon name="chevron-down" size={14} /></span>Why we ask for a bank account</summary>
            <p>So your customers' payments are paid <b>directly to you</b>. BrandsApp doesn't hold your money — it settles to your bank, usually the next business day.</p>
            <p><b>Basic</b> (bank account confirmed) lets you start accepting payments with a monthly limit. <b>Verified</b> (plus BVN/NIN and a business-name match) raises or removes the limit.</p>
            <p>Your own BrandsApp plan never needs verification — this only gates money coming <em>in</em> from customers. <Link to={`/dashboard/${slug}/billing`} className="text-link">Back to Billing</Link></p>
          </details>
        </div>
      )}
    </main>
  )
}
