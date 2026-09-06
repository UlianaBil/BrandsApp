import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { api, money, type Checkout } from "../mock"
import { Icon } from "../ui"

type Phase = "confirming" | "paid" | "failed" | "error"

/**
 * Where the payment provider sends the browser back. Confirms the reference,
 * applies the purchase, and shows one of three honest outcomes. The brand shell's
 * tab bar isn't shown here on purpose: this is a moment, not a place.
 */
export default function CheckoutCallback() {
  const [params] = useSearchParams()
  const ref = params.get("ref") ?? ""
  const slug = params.get("brand") ?? ""
  const [phase, setPhase] = useState<Phase>("confirming")
  const [checkout, setCheckout] = useState<Checkout | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setPhase("confirming")
    api.settleCheckout(ref).then(
      (c) => {
        if (!alive) return
        setCheckout(c)
        setPhase(c.status === "paid" ? "paid" : "failed")
      },
      (e: Error) => {
        if (!alive) return
        setMessage(e.message)
        setPhase("error")
      },
    )
    return () => {
      alive = false
    }
  }, [ref])

  const back = slug ? `/dashboard/${slug}/billing` : "/dashboard"

  return (
    <main className="page narrow">
      <div className="card state-card" role="status" aria-live="polite" style={{ marginTop: 24 }}>
        {phase === "confirming" && (
          <>
            <div className="state-icon" style={{ background: "var(--soft)" }}><span className="spin" /></div>
            <h3>Confirming your payment…</h3>
            <p>Don't pay again. If the charge went through it will apply on its own.</p>
          </>
        )}
        {phase === "paid" && checkout && (
          <>
            <div className="state-icon" style={{ background: "var(--good-bg)", color: "var(--good)" }}><Icon name="check" size={22} /></div>
            <h3>Payment confirmed</h3>
            <p>
              {checkout.description} for {money(checkout.amount, checkout.currency)}.{" "}
              {checkout.kind === "plan" ? "Your plan is active and your brand stays online." : "The credits are in your balance."}
            </p>
            <div className="state-actions">
              <Link to={back} className="btn btn-primary">Back to Billing</Link>
              {slug && <Link to={`/dashboard/${slug}`} className="btn btn-secondary">Overview</Link>}
            </div>
          </>
        )}
        {phase === "failed" && (
          <>
            <div className="state-icon" style={{ background: "var(--warn-bg)", color: "var(--warn)" }}><Icon name="warning" size={22} /></div>
            <h3>Not confirmed yet</h3>
            <p>Your bank hasn't confirmed this payment. If money left your account it will apply on its own, usually within a few minutes. Don't pay again.</p>
            <div className="state-actions">
              <Link to={back} className="btn btn-secondary">Back to Billing</Link>
            </div>
          </>
        )}
        {phase === "error" && (
          <>
            <div className="state-icon" style={{ background: "var(--bad-bg)", color: "var(--bad)" }}><Icon name="warning" size={22} /></div>
            <h3>We couldn't confirm that</h3>
            <p>{message ?? "Something went wrong while confirming the payment."} Don't pay again. If the charge went through it will apply on its own.</p>
            <div className="state-actions">
              <Link to={back} className="btn btn-secondary">Back to Billing</Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
