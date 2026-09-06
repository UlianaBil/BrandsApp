import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { cva } from "class-variance-authority";

/**
 * Dashboard v2 primitives.
 *
 * Ula's design system (BrandsApp-Dashboard-from-Ula/Dashboard-Design-Rules.md)
 * expressed as shadcn-shaped components: `cva` variants over Tailwind classes,
 * reading the scoped tokens in styles/dashboard-v2.css.
 *
 * The section numbers in the comments are hers. Where a rule says something a
 * component could easily get wrong — "never white on a coloured chip", "one
 * primary per view" — it is quoted, because the next person to touch this will
 * not have the document open.
 */

/* ── Buttons (§5.1) ───────────────────────────────────────────────────────── */

export const buttonVariants = cva(
  // Every control is a full pill (§2.3). 600 weight, -0.005em (§2.2).
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
    "tracking-[-0.005em] whitespace-nowrap transition-all duration-200 " +
    "[transition-timing-function:var(--ba-ease)] " +
    "focus-visible:ring-[3px] focus-visible:outline-none " +
    "focus-visible:ring-[var(--ba-accent)]/30 " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** The ONE main action of a view. */
        primary:
          "bg-[var(--ba-dark)] text-white hover:bg-[var(--ba-dark-lift)]",
        /** Supporting action beside a primary; the default on populated screens. */
        secondary:
          "bg-[var(--ba-soft)] text-[var(--ba-ink)] hover:bg-[var(--ba-soft-lift)]",
        /** A secondary that sits on the grey ground — page-header actions. */
        white:
          "border border-[var(--ba-line-strong)] bg-[var(--ba-paper)] text-[var(--ba-ink)] " +
          "shadow-[var(--ba-shadow-card)] hover:shadow-[var(--ba-shadow-hover)]",
        /** Rare — a secondary inside a coloured tile. */
        outline:
          "border border-[var(--ba-line-strong)] bg-transparent text-[var(--ba-ink)] " +
          "hover:bg-[var(--ba-soft)]",
        /** Tertiary/inline: "Try again", "Show 6 more". */
        ghost: "bg-transparent text-[var(--ba-ink)] hover:bg-[var(--ba-soft)]",
        /**
         * Orange is rationed (§2.1): empty-state primary and upgrade CTAs ONLY.
         * A routine button is never orange.
         */
        accent:
          "bg-[var(--ba-accent)] text-white hover:bg-[var(--ba-accent-lift)]",
        /** Confirming a destructive action INSIDE A MODAL — never on the page. */
        danger: "bg-[var(--ba-bad)] text-white hover:brightness-110",
        dangerGhost:
          "bg-transparent text-[var(--ba-bad)] hover:bg-[var(--ba-bad-bg)]",
      },
      size: {
        // §5.1: default 42, sm 36 (inside cards and rows), lg 48 (a form's submit).
        default: "h-[42px] px-[18px] text-[0.9rem]",
        sm: "h-9 px-[14px] text-[0.85rem]",
        lg: "h-12 px-[22px] text-[0.9rem]",
        /** Icon-only, 40px circle, needs an aria-label (§5.1 `iconbtn`). */
        icon: "size-10 p-0",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "secondary", size: "default", block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  block,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

/* ── Cards (§6.1) ─────────────────────────────────────────────────────────── */

/** White, 20px radius, hairline, one soft shadow, 22px padding. */
export function Card({
  className,
  flush,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { flush?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--ba-r-card)] border border-[var(--ba-line)] bg-[var(--ba-paper)]",
        "shadow-[var(--ba-shadow-card)]",
        // Flush = zero padding so a table runs edge to edge (§6.1).
        flush ? "p-0" : "p-[22px]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Title + hint + an optional right-side control. */
export function CardHead({
  title,
  hint,
  action,
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-[14px] flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[1rem] font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {hint ? (
          <p className="mt-1 max-w-[60ch] text-[0.88rem] text-[var(--ba-body)]">
            {hint}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ── Chips (§6.2) ─────────────────────────────────────────────────────────── */

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 " +
    "text-[0.74rem] font-semibold tracking-[0.01em] whitespace-nowrap",
  {
    variants: {
      // Tone mapping is FIXED (§6.2). Text uses the chip's ink token, never
      // white — except on the dark and accent fills.
      tone: {
        good: "bg-[var(--ba-good-bg)] text-[var(--ba-good)]",
        warn: "bg-[var(--ba-warn-bg)] text-[var(--ba-warn)]",
        bad: "bg-[var(--ba-bad-bg)] text-[var(--ba-bad)]",
        neutral: "bg-[var(--ba-soft)] text-[var(--ba-body)]",
        dark: "bg-[var(--ba-dark)] text-white",
        accent: "bg-[var(--ba-accent-soft)] text-[var(--ba-accent-ink)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

/**
 * A chip WITH a dot is a state (Live, Paid, Failed). Without one it is a label
 * (a category, a period, "Current plan"). Status is always worded — never a
 * bare coloured dot, never colour alone (§6.2).
 */
export function Chip({
  tone,
  dot = true,
  children,
  className,
}: VariantProps<typeof chipVariants> & {
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(chipVariants({ tone }), className)}>
      {dot ? (
        <span className="size-1.5 shrink-0 rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  );
}

/**
 * There are exactly two roles (§6.2, owner decision 5 Sep 2026). Soft tints
 * with darkish ink, never solid fills — a role is a label, not an alert.
 */
export function RoleChip({ role }: { role: "owner" | "admin" }) {
  return role === "owner" ? (
    <Chip tone="accent" dot={false}>
      Owner
    </Chip>
  ) : (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1",
        "bg-[rgba(28,28,28,0.08)] text-[var(--ba-ink)]",
        "text-[0.74rem] font-semibold tracking-[0.01em]",
      )}
    >
      Admin
    </span>
  );
}

/* ── Avatars (§6.3) ───────────────────────────────────────────────────────── */

/** First letters of the first two words. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Avatar({
  name,
  kind = "brand",
  size = 40,
  soft,
  src,
  className,
}: {
  name: string;
  /** Brand = orange circle. Person = dark circle (§6.3). */
  kind?: "brand" | "person";
  size?: number;
  /** Invited people are grey until they accept. */
  soft?: boolean;
  src?: string | null;
  className?: string;
}) {
  const bg = soft
    ? "var(--ba-soft)"
    : kind === "brand"
      ? "var(--ba-accent)"
      : "var(--ba-dark)";
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full",
        "font-semibold",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: bg,
        // Initials remain the fallback whenever an image is missing (§6.3).
        color: soft ? "var(--ba-body)" : "#fff",
        fontSize: Math.max(11, Math.round(size * 0.36)),
      }}
      aria-hidden
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/* ── Page furniture (§3.2) ────────────────────────────────────────────────── */

/** h1, a one-line subtitle (≤ 60ch), actions right. One per screen. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-[22px] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.025em]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-[60ch] text-[0.92rem] text-[var(--ba-body)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {/* Actions wrap under the title and go full-width on phones (§3.2). */}
      {actions ? (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

/** Sits 30px above its group, 14px above its first card. Never a card. */
export function SectionHead({
  title,
  hint,
  actions,
}: {
  title: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mt-[30px] mb-[14px] flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
      <h2 className="text-[1.05rem] font-semibold tracking-[-0.015em]">
        {title}
      </h2>
      {hint ? (
        <span className="text-[0.84rem] text-[var(--ba-muted)]">{hint}</span>
      ) : null}
      {actions}
    </div>
  );
}

/* ── Meters (§6.7) ────────────────────────────────────────────────────────── */

/**
 * Six-pixel track. The fill follows the SEMANTIC scale — green healthy, amber
 * at 80%, red at 95%. Never the brand orange: in this system orange means
 * "needs action", so a healthy bar in orange would read as a warning.
 *
 * Progress toward a goal (an onboarding checklist) has no danger threshold, so
 * it uses --ba-dark instead.
 */
export function Meter({
  value,
  max,
  goal,
  label,
  right,
}: {
  value: number;
  max: number;
  /** True = progress toward a goal, not usage against a limit. */
  goal?: boolean;
  label?: ReactNode;
  right?: ReactNode;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const fill = goal
    ? "var(--ba-dark)"
    : pct >= 95
      ? "var(--ba-bad)"
      : pct >= 80
        ? "var(--ba-warn)"
        : "var(--ba-good)";
  return (
    <div>
      {label || right ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[0.84rem]">
          <span className="text-[var(--ba-ink)]">{label}</span>
          <span className="ba-num text-[var(--ba-muted)]">{right}</span>
        </div>
      ) : null}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ba-soft)]"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>
    </div>
  );
}
