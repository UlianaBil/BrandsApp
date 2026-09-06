import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { api, money, type Checkout } from "../mock"
import { Icon } from "../ui"
import { Card, buttonVariants } from "@/ui/primitives"
import { cn } from "@/ui/cn"

type Phase = "confirming" | "paid" | "failed" | "error"

// Tone -> icon-circle colours (Design Rules §6.11 spinner card / §2.1 semantic tones).
const toneClass: Record<Phase, string> = {
  confirming: "bg-[var(--ba-soft)] text-[var(--ba-body)]",
  paid: "bg-[var(--ba-good-bg)] text-[var(--ba-good)]",
  failed: "bg-[var(--ba-warn-bg)] text-[var(--ba-warn)]",
  error: "bg-[var(--ba-bad-bg)] text-[var(--ba-bad)]",
}

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
    <main className="mx-auto max-w-[680px] px-4 pt-6 pb-[110px] min-[900px]:px-9 min-[900px]:pt-9">
      <Card className="mt-6 py-9 text-center" role="status" aria-live="polite">
        {phase === "confirming" && (
          <>
            <span className={cn("mx-auto grid size-12 place-items-center rounded-full", toneClass.confirming)}>
              <span className="size-[18px] animate-spin rounded-full border-2 border-[rgba(28,28,28,0.18)] border-t-[currentColor]" />
            </span>
            <h3 className="mt-3 text-[1rem] font-semibold tracking-[-0.01em]">Confirming your payment…</h3>
            <p className="mx-auto mt-1 max-w-[42ch] text-[0.9rem] text-[var(--ba-body)]">
              Don&apos;t pay again. If the charge went through it will apply on its own.
            </p>
          </>
        )}
        {phase === "paid" && checkout && (
          <>
            <span className={cn("mx-auto grid size-12 place-items-center rounded-full", toneClass.paid)}>
              <Icon name="check" size={22} />
            </span>
            <h3 className="mt-3 text-[1rem] font-semibold tracking-[-0.01em]">Payment confirmed</h3>
            <p className="mx-auto mt-1 max-w-[42ch] text-[0.9rem] text-[var(--ba-body)]">
              {checkout.description} for {money(checkout.amount, checkout.currency)}.{" "}
              {checkout.kind === "plan" ? "Your plan is active and your brand stays online." : "The credits are in your balance."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              <Link to={back} className={cn(buttonVariants({ variant: "primary" }))}>Back to Billing</Link>
              {slug && <Link to={`/dashboard/${slug}`} className={cn(buttonVariants({ variant: "secondary" }))}>Overview</Link>}
            </div>
          </>
        )}
        {phase === "failed" && (
          <>
            <span className={cn("mx-auto grid size-12 place-items-center rounded-full", toneClass.failed)}>
              <Icon name="warning" size={22} />
            </span>
            <h3 className="mt-3 text-[1rem] font-semibold tracking-[-0.01em]">Not confirmed yet</h3>
            <p className="mx-auto mt-1 max-w-[42ch] text-[0.9rem] text-[var(--ba-body)]">
              Your bank hasn&apos;t confirmed this payment. If money left your account it will apply on its own, usually within a few minutes. Don&apos;t pay again.
            </p>
            <div className="mt-4 flex justify-center">
              <Link to={back} className={cn(buttonVariants({ variant: "secondary" }))}>Back to Billing</Link>
            </div>
          </>
        )}
        {phase === "error" && (
          <>
            <span className={cn("mx-auto grid size-12 place-items-center rounded-full", toneClass.error)}>
              <Icon name="warning" size={22} />
            </span>
            <h3 className="mt-3 text-[1rem] font-semibold tracking-[-0.01em]">We couldn&apos;t confirm that</h3>
            <p className="mx-auto mt-1 max-w-[42ch] text-[0.9rem] text-[var(--ba-body)]">
              {message ?? "Something went wrong while confirming the payment."} Don&apos;t pay again. If the charge went through it will apply on its own.
            </p>
            <div className="mt-4 flex justify-center">
              <Link to={back} className={cn(buttonVariants({ variant: "secondary" }))}>Back to Billing</Link>
            </div>
          </>
        )}
      </Card>
    </main>
  )
}
