import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api, fmtDate, type Kyc as KycRecord } from "../mock"
import { Icon, useAsync } from "../ui"
import { Button, Card, Chip, PageHeader } from "@/ui/primitives"
import { CardSkeleton, ErrorState, Field, Input, InputGroup, Note, Select, toast } from "@/ui/controls"

const STATUS: Record<KycRecord["status"], { label: string; tone: "good" | "warn" | "bad" | "neutral"; dot: boolean }> = {
  not_started: { label: "Not started", tone: "neutral", dot: false },
  pending: { label: "Pending review", tone: "warn", dot: true },
  verified: { label: "Verified", tone: "good", dot: true },
  rejected: { label: "Rejected", tone: "bad", dot: true },
}

const mask = (n?: string) => (n ? `•••• ${n.slice(-4)}` : "")

export default function Kyc() {
  const { slug = "" } = useParams()
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

  const canManage = !!brand.data
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
    <main className="mx-auto max-w-[680px] px-4 pt-6 pb-[110px] min-[900px]:px-9 min-[900px]:pt-9">
      {/* Sub-flow of Billing: this back link shows at every width (§3.2). */}
      <Link
        to={`/dashboard/${slug}/billing`}
        className="mb-3.5 inline-flex max-w-full items-center gap-2 text-[0.9rem] font-semibold text-[var(--ba-body)] transition-colors hover:text-[var(--ba-ink)]"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--ba-line)] bg-[var(--ba-paper)]">
          <Icon name="back" size={16} />
        </span>
        <span className="truncate">Billing</span>
      </Link>

      <PageHeader
        title="Business verification"
        subtitle="Verify your business and settlement bank account before you can accept payments from customers."
        actions={kyc.data ? <Chip tone={st.tone} dot={st.dot}>{st.label}</Chip> : undefined}
      />

      {kyc.loading && <CardSkeleton lines={4} />}
      {kyc.error && <ErrorState what="your verification status" onRetry={kyc.retry} />}

      {kyc.data && status === "verified" && (
        <div className="flex flex-col gap-3.5">
          <Card aria-label="Verified account">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-ink)]">
                <Icon name="shield" size={16} />
              </span>
              <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">You're verified</h2>
            </div>
            <div className="grid grid-cols-2 gap-2.5 min-[700px]:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] min-[700px]:gap-3.5">
              <div className="flex flex-col gap-1.5 rounded-[var(--ba-r-card)] border border-[var(--ba-line)] p-3.5 min-[700px]:gap-2 min-[700px]:p-[18px_20px]">
                <span className="text-[0.8rem] font-medium text-[var(--ba-body)]">Business</span>
                <span className="text-[1.05rem] font-semibold tracking-[-0.02em] min-[700px]:text-[1.15rem]">{kyc.data.businessName}</span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-[var(--ba-r-card)] border border-[var(--ba-line)] p-3.5 min-[700px]:gap-2 min-[700px]:p-[18px_20px]">
                <span className="text-[0.8rem] font-medium text-[var(--ba-body)]">Account name</span>
                <span className="text-[1.05rem] font-semibold tracking-[-0.02em] min-[700px]:text-[1.15rem]">{kyc.data.accountName}</span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-[var(--ba-r-card)] border border-[var(--ba-line)] p-3.5 min-[700px]:gap-2 min-[700px]:p-[18px_20px]">
                <span className="text-[0.8rem] font-medium text-[var(--ba-body)]">Bank</span>
                <span className="text-[1.05rem] font-semibold tracking-[-0.02em] min-[700px]:text-[1.15rem]">{kyc.data.bankName}</span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-[var(--ba-r-card)] border border-[var(--ba-line)] p-3.5 min-[700px]:gap-2 min-[700px]:p-[18px_20px]">
                <span className="text-[0.8rem] font-medium text-[var(--ba-body)]">Account number</span>
                <span className="text-[1.05rem] font-semibold tracking-[-0.02em] min-[700px]:text-[1.15rem]">{mask(kyc.data.accountNumber)}</span>
              </div>
              {kyc.data.cacNumber && (
                <div className="flex flex-col gap-1.5 rounded-[var(--ba-r-card)] border border-[var(--ba-line)] p-3.5 min-[700px]:gap-2 min-[700px]:p-[18px_20px]">
                  <span className="text-[0.8rem] font-medium text-[var(--ba-body)]">CAC/RC number</span>
                  <span className="text-[1.05rem] font-semibold tracking-[-0.02em] min-[700px]:text-[1.15rem]">{kyc.data.cacNumber}</span>
                </div>
              )}
            </div>
            <p className="mt-3.5 text-[0.83rem] text-[var(--ba-muted)]">
              Payouts settle to this account{kyc.data.submittedAt ? ` · verified ${fmtDate(kyc.data.submittedAt)}` : ""}. To change it, contact support.
            </p>
          </Card>
          <Note>
            <div className="flex items-center gap-2.5">
              <Icon name="check" size={14} />
              Card, transfer and USSD payments are switched on at checkout.
            </div>
          </Note>
        </div>
      )}

      {kyc.data && status !== "verified" && (
        <div className="flex flex-col gap-3.5">
          {status === "pending" && (
            <Note tone="warn">
              <div className="flex items-start gap-2.5">
                <Icon name="info" size={14} />
                <span>
                  Your submission{kyc.data.submittedAt ? ` from ${fmtDate(kyc.data.submittedAt)}` : ""} is under review — usually a business day. You can resubmit if anything was wrong.
                </span>
              </div>
            </Note>
          )}
          {status === "rejected" && (
            <Note tone="bad">
              <div className="flex items-start gap-2.5">
                <Icon name="warning" size={14} />
                <span>{kyc.data.reason ?? "Something didn't match on your last submission."} Check the details below and submit again.</span>
              </div>
            </Note>
          )}

          {!canManage && brand.data ? (
            <Note>
              <div className="flex items-center gap-2.5">
                <Icon name="lock" size={14} />
                Only an owner or admin can submit business verification.
              </div>
            </Note>
          ) : (
            <Card>
              <div className="mb-[18px]">
                <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">Submit your details</h2>
                <p className="mt-0.5 text-[0.88rem] text-[var(--ba-body)]">Who you are, and the bank account your earnings should settle into.</p>
              </div>
              <form onSubmit={submit} noValidate>
                <div className="mb-[18px]">
                  <Field label="Registered business name" htmlFor="kyc-name">
                    <Input id="kyc-name" placeholder="e.g. Adaeze Fashion Ltd" value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoComplete="organization" />
                  </Field>
                </div>

                <div className="mb-[18px]">
                  <Field label="Settlement bank" htmlFor="kyc-bank">
                    <Select
                      id="kyc-bank"
                      value={bankCode}
                      disabled={banks.loading}
                      onChange={(e) => { setBankCode(e.target.value); setAccountName(null); setResolveError(null) }}
                    >
                      <option value="">{banks.loading ? "Loading banks…" : "Select bank…"}</option>
                      {banks.data?.map((b) => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </Select>
                    {banks.error && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[0.82rem] text-[var(--ba-bad)]">
                        <Icon name="warning" size={14} />
                        Couldn't load the bank list.{" "}
                        <button type="button" className="font-semibold underline underline-offset-2" onClick={banks.retry}>Try again</button>
                      </p>
                    )}
                  </Field>
                </div>

                <div className="mb-[18px]">
                  <Field
                    label="Account number"
                    htmlFor="kyc-acct"
                    error={resolveError ?? undefined}
                    success={!resolveError && accountName ? accountName : undefined}
                    help={!resolveError && !accountName ? "We confirm the account name with your bank instantly." : undefined}
                  >
                    <div className="flex flex-wrap gap-2.5">
                      <div className="min-w-0 flex-1 basis-[200px]">
                        <InputGroup prefix={<Icon name="bank" size={16} />}>
                          <Input
                            id="kyc-acct"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="0123456789"
                            value={accountNumber}
                            onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "")); setAccountName(null); setResolveError(null) }}
                            aria-invalid={!!resolveError}
                            aria-describedby="kyc-acct-status"
                          />
                        </InputGroup>
                      </div>
                      <Button type="button" variant="secondary" disabled={!canResolve} onClick={resolve}>
                        {resolving ? "Checking…" : "Verify"}
                      </Button>
                    </div>
                  </Field>
                </div>

                <div className="mb-[18px]">
                  <Field label="BVN" optional htmlFor="kyc-bvn" help="Unlocks higher transaction limits. Stored securely and never shared.">
                    <Input id="kyc-bvn" inputMode="numeric" maxLength={11} placeholder="11-digit BVN" value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))} />
                  </Field>
                </div>

                <div className="mb-[18px]">
                  <Field label="CAC/RC number" optional htmlFor="kyc-cac">
                    <Input id="kyc-cac" placeholder="e.g. RC1234567" value={cac} onChange={(e) => setCac(e.target.value)} />
                  </Field>
                </div>

                {formError && (
                  <p className="mb-3 flex items-center gap-1.5 text-[0.82rem] text-[var(--ba-bad)]">
                    <Icon name="warning" size={14} />{formError}
                  </p>
                )}

                <Button type="submit" variant="primary" size="lg" block className="mt-1.5" disabled={submitting}>
                  {submitting ? "Submitting…" : status === "not_started" ? "Submit for verification" : "Resubmit for verification"}
                </Button>
                <p className="mt-3 text-center text-[0.83rem] text-[var(--ba-muted)]">
                  We verify your account with your bank via Paystack. Your BVN is stored securely and never shared.
                </p>
              </form>
            </Card>
          )}

          <details className="group rounded-2xl border border-[var(--ba-line)] bg-[var(--ba-paper)] p-4">
            <summary className="flex list-none items-center gap-2.5 text-[0.9rem] font-semibold text-[var(--ba-ink)] [&::-webkit-details-marker]:hidden">
              <span className="grid size-[26px] shrink-0 cursor-pointer place-items-center rounded-full bg-[var(--ba-soft)] transition-transform duration-200 group-open:rotate-180">
                <Icon name="chevron-down" size={14} />
              </span>
              Why we ask for a bank account
            </summary>
            <div className="mt-2.5 ml-9 flex flex-col gap-1.5 text-[0.87rem] text-[var(--ba-body)]">
              <p>So your customers' payments are paid <b className="font-semibold">directly to you</b>. BrandsApp doesn't hold your money — it settles to your bank, usually the next business day.</p>
              <p><b className="font-semibold">Basic</b> (bank account confirmed) lets you start accepting payments with a monthly limit. <b className="font-semibold">Verified</b> (plus BVN/NIN and a business-name match) raises or removes the limit.</p>
              <p>
                Your own BrandsApp plan never needs verification — this only gates money coming <em className="not-italic font-medium">in</em> from customers.{" "}
                <Link to={`/dashboard/${slug}/billing`} className="font-semibold text-[var(--ba-ink)] underline decoration-[var(--ba-line-strong)] underline-offset-[3px] hover:decoration-[var(--ba-ink)]">
                  Back to Billing
                </Link>
              </p>
            </div>
          </details>
        </div>
      )}
    </main>
  )
}
