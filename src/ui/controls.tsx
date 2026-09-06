import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "./cn";
import { createPortal } from "react-dom";

import { Button } from "./primitives";

/**
 * Dashboard v2 — forms, overlays and states.
 *
 * Split from primitives.tsx purely so several people can work on the dashboard
 * at once without fighting over one file. Same rules, same document:
 * docs/dashboard-design-rules.md, section numbers cited throughout.
 */

/* ── Fields (§6.4) ────────────────────────────────────────────────────────── */

/**
 * Label above the control, 7px gap. "Optional" is a muted suffix — required
 * fields are NEVER marked with an asterisk. Help text sits under the field and
 * validation replaces it in place, so nothing moves when an error appears.
 */
export function Field({
  label,
  optional,
  /** Replaces the word "Optional" — her Billing field reads "Min 500". */
  optionalLabel = "Optional",
  help,
  error,
  success,
  htmlFor,
  children,
}: {
  label: ReactNode;
  optional?: boolean;
  optionalLabel?: string;
  help?: ReactNode;
  error?: ReactNode;
  success?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-[7px]">
      <label
        htmlFor={htmlFor}
        className="text-[0.88rem] font-semibold text-[var(--ba-ink)]"
      >
        {label}
        {optional ? (
          <span className="ml-1.5 font-normal text-[var(--ba-muted)]">
            {optionalLabel}
          </span>
        ) : null}
      </label>
      {children}
      {/* One slot: error replaces success replaces help, so the layout is stable. */}
      {error ? (
        <p className="flex items-center gap-1.5 text-[0.82rem] text-[var(--ba-bad)]">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.9}
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M12 8v5M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
          {error}
        </p>
      ) : success ? (
        <p className="flex items-center gap-1.5 text-[0.82rem] text-[var(--ba-good)]">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {success}
        </p>
      ) : help ? (
        <p className="text-[0.82rem] text-[var(--ba-muted)]">{help}</p>
      ) : null}
    </div>
  );
}

/** 46px pill, --line-strong border; focus turns it ink with a 3px soft ring. */
export const inputClass = cn(
  "h-[46px] w-full rounded-full border border-[var(--ba-line-strong)]",
  "bg-[var(--ba-paper)] px-[16px] text-[0.92rem] text-[var(--ba-ink)]",
  "transition-colors outline-none placeholder:text-[var(--ba-muted)]",
  "hover:border-[rgba(28,28,28,0.24)]",
  "focus:border-[var(--ba-ink)] focus:ring-[3px] focus:ring-[rgba(28,28,28,0.08)]",
  "disabled:cursor-not-allowed disabled:bg-[var(--ba-soft)]",
  "aria-[invalid=true]:border-[var(--ba-bad)]",
);

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

/** Textareas are 14px radius and resize vertically only (§6.4). */
export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cn(
        inputClass,
        "h-auto min-h-[104px] resize-y rounded-[var(--ba-r-field)] py-3",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(inputClass, "appearance-none pr-11", props.className)}
      />
      <span
        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[var(--ba-muted)]"
        aria-hidden
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}

/** A fixed prefix/suffix lives INSIDE the pill (§6.4) — e.g. ".brandsapp.io". */
export function InputGroup({
  children,
  suffix,
  prefix,
}: {
  children: ReactNode;
  suffix?: ReactNode;
  prefix?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-[46px] items-center rounded-full border border-[var(--ba-line-strong)]",
        "bg-[var(--ba-paper)] transition-colors focus-within:border-[var(--ba-ink)]",
        "focus-within:ring-[3px] focus-within:ring-[rgba(28,28,28,0.08)]",
      )}
    >
      {prefix ? (
        <span className="pl-4 text-[0.9rem] text-[var(--ba-muted)]">
          {prefix}
        </span>
      ) : null}
      <div className="min-w-0 flex-1 [&_input]:h-full [&_input]:rounded-full [&_input]:border-0 [&_input]:ring-0 [&_input]:focus:ring-0">
        {children}
      </div>
      {suffix ? (
        <span className="pr-4 text-[0.9rem] whitespace-nowrap text-[var(--ba-muted)]">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

/* ── Segmented control (§6.5) ─────────────────────────────────────────────── */

/**
 * Tabs and filters both. A --soft track with a dark pill for the selection.
 * Use for 2–5 options; more than five is a select.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex gap-1 rounded-full bg-[var(--ba-soft)] p-1"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[0.85rem] font-semibold transition-colors",
              active
                ? "bg-[var(--ba-dark)] text-white"
                : "text-[var(--ba-body)] hover:text-[var(--ba-ink)]",
            )}
          >
            {o.label}
            {o.count !== undefined ? (
              <span
                className={cn("ml-1.5", !active && "text-[var(--ba-muted)]")}
              >
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ── Search (§6.5) ────────────────────────────────────────────────────────── */

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
}) {
  return (
    <div className="relative w-full sm:max-w-[320px]">
      <span
        className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--ba-muted)]"
        aria-hidden
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
      </span>
      <input
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "pr-11 pl-11")}
      />
      {value ? (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-[var(--ba-muted)] hover:bg-[var(--ba-soft)]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

/* ── States (§7) ──────────────────────────────────────────────────────────── */

/** Skeletons match the SHAPE of what is coming — never a spinner (§7.1). */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "block animate-pulse rounded-full bg-[var(--ba-soft)]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A failed request replaces the data it was for, and NOTHING ELSE (§7.2). One
 * failure never blanks the page; sibling cards keep theirs. Never show a raw
 * backend message — say what it means for the user.
 */
export function ErrorState({
  what = "this",
  onRetry,
}: {
  what?: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-[var(--ba-r-card)] border border-[var(--ba-line)] bg-[var(--ba-paper)] p-[22px] shadow-[var(--ba-shadow-card)]">
      <span className="grid size-10 place-items-center rounded-full bg-[var(--ba-bad-bg)] text-[var(--ba-bad)]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M12 8v5M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>
      <h2 className="mt-3 text-[1rem] font-semibold tracking-[-0.01em]">
        We couldn&apos;t load {what}
      </h2>
      <p className="mt-1 max-w-[52ch] text-[0.88rem] text-[var(--ba-body)]">
        Check your connection and try again.
      </p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-3.5"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}

/**
 * Renders ONLY after a successful response that returned nothing (§7.3). A
 * failure is never shown as empty. The CTA is primary when the user can create
 * the thing, and absent when they cannot — never a disabled button.
 */
export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  /**
   * The glyph is part of what the state SAYS: "no listings yet" and "nothing
   * matches your search" are different truths (§6.5, §7.3), and one shared
   * sparkle for both loses that distinction.
   */
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--ba-r-card)] border border-[var(--ba-line)] bg-[var(--ba-paper)] px-[22px] py-[46px] text-center shadow-[var(--ba-shadow-card)]">
      <span className="mx-auto grid size-11 place-items-center rounded-full bg-[var(--ba-soft)] text-[var(--ba-muted)]">
        {icon ?? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
        </svg>
        )}
      </span>
      <h2 className="mt-3.5 text-[1.05rem] font-semibold tracking-[-0.015em]">
        {title}
      </h2>
      <p className="mx-auto mt-1.5 max-w-[46ch] text-[0.9rem] text-[var(--ba-body)]">
        {body}
      </p>
      {action ? <div className="mt-[18px]">{action}</div> : null}
    </div>
  );
}

/** §6.10: informational notes are dark text on paper or soft. There is no blue. */
export function Note({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "warn" | "bad";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--ba-r-field)] px-4 py-3 text-[0.88rem]",
        tone === "warn" &&
          "border border-[rgba(133,90,12,0.16)] bg-[var(--ba-warn-bg)] text-[var(--ba-warn)]",
        tone === "bad" &&
          "border border-[rgba(179,55,47,0.16)] bg-[var(--ba-bad-bg)] text-[var(--ba-bad)]",
        tone === "neutral" &&
          "border border-[var(--ba-line)] bg-[var(--ba-soft)] text-[var(--ba-body)]",
      )}
    >
      {children}
    </div>
  );
}

/* ── Row menu (§6.6) ──────────────────────────────────────────────────────── */

export /**
 * The "more" dropdown that row actions live in (§6.6).
 *
 * §6.6: never more than one visible button per row — neutral actions first, a
 * divider, then destructive ones last in red. Renders nothing when it would be
 * empty, which is what makes §5.2's "users never see dead buttons" work: a
 * caller filters the items its role may take and the whole control disappears
 * rather than showing a menu with nothing in it.
 */
function RowMenu({
  label,
  items,
}: {
  label: string;
  items: {
    label: string;
    onSelect: () => void;
    danger?: boolean;
    sep?: boolean;
    /** A leading glyph, as the original row menus had (copy, swap, trash). */
    icon?: ReactNode;
  }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--ba-muted)] transition-colors hover:bg-[var(--ba-soft)]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="12" cy="5" r="1.3" />
          <circle cx="12" cy="12" r="1.3" />
          <circle cx="12" cy="19" r="1.3" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1.5 w-56 overflow-hidden rounded-[var(--ba-r-field)] border border-[var(--ba-line)] bg-[var(--ba-paper)] py-1.5 shadow-[var(--ba-shadow-pop)]"
        >
          {items.map((it, i) => (
            <div key={i}>
              {it.sep ? (
                <span className="my-1 block h-px bg-[var(--ba-line)]" />
              ) : null}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
                className={cn(
                  "flex w-full items-center px-3.5 py-2 text-left text-[0.88rem] transition-colors",
                  it.danger
                    ? "text-[var(--ba-bad)] hover:bg-[var(--ba-bad-bg)]"
                    : "text-[var(--ba-ink)] hover:bg-[var(--ba-soft)]",
                )}
              >
                {it.icon ? (
                  <span className="mr-2 inline-grid place-items-center align-[-2px]">
                    {it.icon}
                  </span>
                ) : null}
                {it.label}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── Modal (§6.8) ─────────────────────────────────────────────────────────── */

/**
 * Centred 460px dialog from 640px, a bottom sheet below. Escape and the scrim
 * close it, focus moves in, body scroll locks, and the confirm button is
 * disabled while its request is pending.
 *
 * Use for: destructive confirms, money, role changes, signing out, previews.
 * NOT for forms that fit on the page, and never to confirm success.
 */
export function Modal({
  open,
  onClose,
  title,
  body,
  danger,
  confirmLabel,
  onConfirm,
  pending,
  cancelLabel = "Cancel",
  children,
  icon,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: ReactNode;
  danger?: boolean;
  confirmLabel?: string;
  onConfirm?: () => void;
  pending?: boolean;
  cancelLabel?: string;
  children?: ReactNode;
  /** Overrides the generic info/danger glyph — e.g. a swap for a role change. */
  icon?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="ba2 fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-[rgba(28,28,28,0.35)]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full max-w-[460px] bg-[var(--ba-paper)] p-[22px] outline-none",
          "shadow-[var(--ba-shadow-pop)]",
          "rounded-t-[24px] sm:rounded-[var(--ba-r-card)]",
        )}
      >
        <span
          className={cn(
            "grid size-10 place-items-center rounded-full",
            danger
              ? "bg-[var(--ba-bad-bg)] text-[var(--ba-bad)]"
              : "bg-[var(--ba-soft)] text-[var(--ba-body)]",
          )}
          aria-hidden
        >
          {icon ?? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.9}
              strokeLinecap="round"
            >
              <path d={danger ? "M12 8v5M12 17h.01" : "M12 16v-5M12 8h.01"} />
              <circle cx="12" cy="12" r="9" />
            </svg>
          )}
        </span>
        <h2 className="mt-3 text-[1.05rem] font-semibold tracking-[-0.015em]">
          {title}
        </h2>
        {body ? (
          <div className="mt-1.5 text-[0.9rem] text-[var(--ba-body)]">
            {body}
          </div>
        ) : null}
        {children}
        {onConfirm ? (
          // Phones stack with the action ON TOP (§6.8).
          <div className="mt-[22px] flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              {cancelLabel}
            </Button>
            <Button
              variant={danger ? "danger" : "primary"}
              onClick={onConfirm}
              disabled={pending}
            >
              {confirmLabel}
            </Button>
          </div>
        ) : (
          /*
            §6.8 lists PREVIEWS among the things a modal is for, and a preview
            has nothing to confirm. Without this it rendered no button at all —
            leaving Escape and the scrim as the only ways out, which on a phone
            means no way out that anyone can see.
          */
          <div className="mt-[22px] flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ── Toasts (§6.9) ────────────────────────────────────────────────────────── */

type Toast = { id: number; text: string; tone: "info" | "success" | "error" };
let toastSeq = 0;
const listeners = new Set<(t: Toast[]) => void>();
let toasts: Toast[] = [];

function emit() {
  for (const l of listeners) l([...toasts]);
}

/**
 * Toasts CONFIRM what happened — "Link copied", "Invite sent". They never
 * carry actions, and never an error that has to be read carefully; that
 * belongs in the page (§6.9).
 */
export function toast(text: string, tone: Toast["tone"] = "info") {
  const t = { id: ++toastSeq, text, tone };
  toasts = [...toasts, t];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    emit();
  }, 3400);
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[86px] z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className="flex items-center gap-2.5 rounded-full bg-[var(--ba-dark)] px-4 py-2.5 text-[0.88rem] text-white shadow-[var(--ba-shadow-pop)]"
        >
          <span
            className={cn(
              "grid size-5 shrink-0 place-items-center rounded-full",
              t.tone === "success" && "bg-[var(--ba-good)]",
              t.tone === "error" && "bg-[var(--ba-bad)]",
              t.tone === "info" && "bg-white/15",
            )}
            aria-hidden
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d={
                  t.tone === "success"
                    ? "M20 6 9 17l-5-5"
                    : t.tone === "error"
                      ? "M12 8v5M12 16h.01"
                      : "M12 16v-5M12 8h.01"
                }
              />
            </svg>
          </span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

/* ── Content helpers (§9) ─────────────────────────────────────────────────── */

/**
 * Missing numbers are ZERO, formatted like every other value — "₦0", never
 * "—" or "N/A" (§9). Brands billed outside Nigeria see US dollars.
 *
 * NAMED FOR ITS UNITS, and not merely `money`, because this file is shared
 * source between the platform and the design repo and those two count money
 * differently: the platform stores kobo, the prototype's mock stores whole
 * naira. A pair of functions both called `money`, one dividing by 100 and one
 * not, is a 100x error waiting for someone to import the wrong one — it caught
 * three separate people porting these screens before the name changed.
 */
export function moneyMinor(minor: number | null | undefined, currency = "NGN") {
  const v = (minor ?? 0) / 100;
  const symbol = currency === "NGN" ? "₦" : "$";
  return (
    symbol +
    v.toLocaleString(currency === "NGN" ? "en-NG" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  );
}

/** Absolute, day month year — "24 Sep 2026". Never an ISO string (§9). */
export function fmtDate(value: Date | string | number | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ── Pagination (§6.6) ────────────────────────────────────────────────────── */

/**
 * In the card footer: the count on the left, chevrons and page numbers right,
 * current page a dark circle. Renders NOTHING under two pages — a pager for one
 * page is furniture that says "there is more" when there isn't.
 *
 * Lists truncate with this, never by clipping a cell's content (§6.6).
 */
export function Pagination({
  page,
  pageSize,
  total,
  onChange,
  noun = "items",
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (p: number) => void;
  noun?: string;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages < 2) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ba-line)] px-[22px] py-3.5">
      <p className="ba-num text-[0.82rem] text-[var(--ba-muted)]">
        Showing {from}–{to} of {total} {noun}
      </p>
      <div className="flex items-center gap-1">
        <PageChevron
          dir="prev"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        />
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "ba-num grid size-8 place-items-center rounded-full text-[0.82rem] font-semibold transition-colors",
              p === page
                ? "bg-[var(--ba-dark)] text-white"
                : "text-[var(--ba-body)] hover:bg-[var(--ba-soft)]",
            )}
          >
            {p}
          </button>
        ))}
        <PageChevron
          dir="next"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        />
      </div>
    </div>
  );
}

function PageChevron({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous page" : "Next page"}
      className="grid size-8 place-items-center rounded-full text-[var(--ba-muted)] transition-colors hover:bg-[var(--ba-soft)] disabled:pointer-events-none disabled:opacity-40"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={dir === "prev" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
      </svg>
    </button>
  );
}

/* ── Switch ───────────────────────────────────────────────────────────────── */

/** A pill like every other control (§2.3). The label is the hit target too. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--ba-accent)]/30",
        checked ? "bg-[var(--ba-dark)]" : "bg-[var(--ba-soft-lift)]",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

/* ── Inline error (§7.2) ──────────────────────────────────────────────────── */

/**
 * The error for a stat card, where the card's FRAME and label must survive.
 * `ErrorState` replaces a whole card; this replaces only the value, so a row of
 * cards keeps its shape and the others keep their data.
 */
export function InlineError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center gap-2 text-[0.84rem] text-[var(--ba-bad)]">
      <span>Couldn&apos;t load</span>
      <button
        onClick={onRetry}
        className="font-semibold underline underline-offset-2"
      >
        Try again
      </button>
    </div>
  );
}

/* ── Card skeleton (§7.1) ─────────────────────────────────────────────────── */

/** Keeps the frame; only the value area is a skeleton. */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-[var(--ba-r-card)] border border-[var(--ba-line)] bg-[var(--ba-paper)] p-[22px] shadow-[var(--ba-shadow-card)]">
      <Skeleton className="h-8 w-8 rounded-full" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("mt-3 h-3.5", i === 0 ? "w-1/2" : "w-3/4")}
        />
      ))}
    </div>
  );
}
