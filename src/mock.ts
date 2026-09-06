/**
 * Mock data layer.
 *
 * This branch is a front-end prototype: it recreates the BrandsApp
 * platform dashboard against an in-memory API so the improved UX can be
 * reviewed on Vercel without the real backend. Every call goes through
 * `call()`, which adds realistic latency and honours the demo toggles
 * (slow network / failing API) so loading, error and retry states can be
 * exercised by reviewers.
 */

/** Every role on the platform is Owner or Admin — there is no view-only role (owner decision, 2026-09-05). */
export type Role = "owner" | "admin"
export type BrandRole = Role

export interface Account {
  name: string
  email: string
}

/** Lifecycle of the brand's site, separate from its plan. */
export type BrandStatus = "provisioning" | "live" | "paused" | "suspended"
export type Currency = "NGN" | "USD"

export interface Brand {
  slug: string
  name: string
  domain: string
  role: BrandRole
  liveUrl: string
  adminUrl: string
  createdAt: string
  status: BrandStatus
  currency: Currency
  description?: string
  contactEmail?: string
  /** Set while status is "provisioning"; steps advance on the clock in the mock. */
  provisioningStartedAt?: number
}

/** What My Brands needs per card without a second round-trip per brand. */
export interface BrandSummary extends Brand {
  planLabel: string
  planStatus: Plan["status"]
}

export const PROVISION_STEPS = [
  "Creating your database",
  "Setting up email",
  "Preparing media and video",
  "Configuring file storage",
  "Deploying your store",
] as const

export interface Provisioning {
  step: number
  total: number
  done: boolean
}

export interface Credits {
  balanceCr: number
  expiringCr: number
  expiresOn?: string
}

export interface PlanDef {
  id: string
  name: string
  priceNgn: number
  priceUsd: number
  credits: number
  features: string[]
}

/** Exchange rate from pricing.md: ₦2,000 = $1. */
export const PLANS: PlanDef[] = [
  { id: "starter", name: "Starter", priceNgn: 2000, priceUsd: 1, credits: 2000, features: ["2,000 usage credits a month", "Up to 10 apps", "Custom domain"] },
  { id: "growth", name: "Growth", priceNgn: 5000, priceUsd: 2.5, credits: 5000, features: ["5,000 usage credits a month", "Unlimited apps", "Custom domain", "Priority support"] },
  { id: "scale", name: "Scale", priceNgn: 15000, priceUsd: 7.5, credits: 15000, features: ["15,000 usage credits a month", "Unlimited apps", "Built for high-volume stores", "Priority support"] },
]

export type CheckoutKind = "plan" | "credits"
export interface Checkout {
  reference: string
  slug: string
  kind: CheckoutKind
  currency: Currency
  amount: number
  planId?: string
  credits?: number
  status: "pending" | "paid" | "failed"
  description: string
}

export interface OwnedApp {
  id: string
  name: string
  kind: "app" | "bundle"
  paidWith: "credits" | "wallet" | "card" | "plan"
  purchasedAt: string
  priceCr: number
}

export interface CatalogApp {
  id: string
  name: string
  kind: "app" | "bundle"
  priceCr: number
  blurb: string
}

export interface DnsRecord {
  type: "CNAME" | "TXT"
  name: string
  value: string
}

export interface Plan {
  status: "trial" | "active" | "none"
  name: string
  daysLeft?: number
  renewsOn?: string
  priceNgn?: number
  monthlyCredits?: number
}

export interface UsageResource {
  key: string
  label: string
  used: number
  limit: number
  unit: "" | "MB" | "GB" | "min"
}

export interface Usage {
  requests: number
  storageMb: number
  emailsSent: number
  period: string
  limits: {
    requests: number
    storageMb: number
    emails: number
  }
  resources: UsageResource[]
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  you?: boolean
  status: "active" | "invited"
}

export interface Payment {
  id: string
  date: string
  description: string
  amountNgn: number
  status: "paid" | "failed"
}

export interface WalletSummary {
  balanceNgn: number
  earnedNgn: number
  spentNgn: number
  appCredits: number
}

export interface Listing {
  id: string
  title: string
  author: string
  priceNgn: number
  priceUsd?: number
  category: string
  description?: string
}

export const LISTING_CATEGORIES = ["Hero sections", "Conversion", "Food & hospitality", "Testimonials", "Menus & pricing", "Other"] as const

export type KycStatus = "not_started" | "pending" | "verified" | "rejected"

export interface Kyc {
  status: KycStatus
  businessName?: string
  bankName?: string
  bankCode?: string
  accountNumber?: string
  accountName?: string
  bvn?: string
  cacNumber?: string
  submittedAt?: string
  reason?: string
}

export interface Bank {
  code: string
  name: string
}

export interface DomainRecord {
  id: string
  hostname: string
  status: "active" | "pending-dns" | "failed"
  addedAt: string
  records: DnsRecord[]
  lastCheckedAt?: string
}

/* ------------------------------------------------------------------ */
/* Demo controls                                                       */
/* ------------------------------------------------------------------ */

export const demo = {
  get failing(): boolean {
    try {
      return localStorage.getItem("demo.fail") === "1"
    } catch {
      return false
    }
  },
  set failing(v: boolean) {
    try {
      localStorage.setItem("demo.fail", v ? "1" : "0")
    } catch {
      /* private mode — demo toggle simply won't persist */
    }
  },
  get slow(): boolean {
    try {
      return localStorage.getItem("demo.slow") === "1"
    } catch {
      return false
    }
  },
  set slow(v: boolean) {
    try {
      localStorage.setItem("demo.slow", v ? "1" : "0")
    } catch {
      /* ignore */
    }
  },
  /** Owner decision: the marketplace shows its empty state until cards are designed; reviewers can switch the sample listings on. */
  get listings(): boolean {
    try {
      return localStorage.getItem("demo.listings") === "1"
    } catch {
      return false
    }
  },
  set listings(v: boolean) {
    try {
      localStorage.setItem("demo.listings", v ? "1" : "0")
    } catch {
      /* ignore */
    }
  },
}

/** The DNS records a custom domain needs to point at BrandsApp. */
function dnsFor(hostname: string): DnsRecord[] {
  const apex = hostname.split(".").length === 2
  return [
    apex
      ? { type: "CNAME", name: "@", value: "edge.brandsapp.io" }
      : { type: "CNAME", name: hostname.split(".")[0], value: "edge.brandsapp.io" },
    { type: "TXT", name: `_brandsapp.${hostname}`, value: `brandsapp-verify=${hostname.replace(/\W/g, "").slice(0, 12)}7f3a` },
  ]
}

const today = () => new Date().toISOString().slice(0, 10)
const plusOneYear = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

function call<T>(data: T, opts?: { failable?: boolean }): Promise<T> {
  const latency = demo.slow ? 2200 : 350 + Math.random() * 350
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if ((opts?.failable ?? true) && demo.failing) {
        reject(new Error("The server couldn't be reached."))
      } else {
        // structuredClone keeps pages from mutating the shared store
        resolve(structuredClone(data))
      }
    }, latency)
  })
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

const store = {
  account: { name: "Uliana Bilenkiy", email: "ulianabilenkiy@gmail.com" } as Account,

  brands: [
    {
      slug: "acme-fashion-group",
      name: "Acme Fashion Group",
      domain: "acme-fashion-group.brandsapp.io",
      role: "owner" as BrandRole,
      liveUrl: "https://acme-fashion-group.brandsapp.io",
      adminUrl: "https://acme-fashion-group.brandsapp.io/admin",
      createdAt: "2026-08-12",
      status: "live" as BrandStatus,
      currency: "NGN" as Currency,
      description: "Ready-to-wear and made-to-measure fashion for women, made in Lagos.",
      contactEmail: "hello@acmefashion.ng",
    },
    {
      slug: "lagos-bites",
      name: "Lagos Bites",
      domain: "lagos-bites.brandsapp.io",
      role: "admin" as BrandRole,
      liveUrl: "https://lagos-bites.brandsapp.io",
      adminUrl: "https://lagos-bites.brandsapp.io/admin",
      createdAt: "2026-07-02",
      status: "live" as BrandStatus,
      currency: "NGN" as Currency,
      description: "Small chops, jollof trays and office lunch delivery across Lagos Island.",
      contactEmail: "orders@lagosbites.ng",
    },
    {
      slug: "ada-interiors-and-home-styling",
      name: "Ada Interiors & Home Styling Studio",
      domain: "ada-interiors-and-home-styling.brandsapp.io",
      role: "owner" as BrandRole,
      liveUrl: "https://ada-interiors-and-home-styling.brandsapp.io",
      adminUrl: "https://ada-interiors-and-home-styling.brandsapp.io/admin",
      createdAt: "2026-09-01",
      status: "live" as BrandStatus,
      currency: "USD" as Currency,
      description: "Interior styling and furniture sourcing for homes and short-let apartments.",
    },
    {
      slug: "kemi-bakes",
      name: "Kemi Bakes",
      domain: "kemi-bakes.brandsapp.io",
      role: "owner" as BrandRole,
      liveUrl: "https://kemi-bakes.brandsapp.io",
      adminUrl: "https://kemi-bakes.brandsapp.io/admin",
      createdAt: "2026-05-14",
      status: "paused" as BrandStatus,
      currency: "NGN" as Currency,
      description: "Custom cakes and pastries for birthdays, weddings and offices.",
      contactEmail: "kemi@kemibakes.ng",
    },
  ] as Brand[],

  plans: {
    "acme-fashion-group": {
      status: "trial",
      name: "Free trial",
      daysLeft: 5,
    } as Plan,
    "lagos-bites": {
      status: "active",
      name: "Starter",
      renewsOn: "2027-08-24",
      priceNgn: 2000,
      monthlyCredits: 2000,
    } as Plan,
    "ada-interiors-and-home-styling": {
      status: "trial",
      name: "Free trial",
      daysLeft: 12,
    } as Plan,
    "kemi-bakes": { status: "none", name: "" } as Plan,
  } as Record<string, Plan>,

  // Usage credits (Layer 1 billing): bought or granted by the plan; overages draw them down.
  credits: {
    "acme-fashion-group": { balanceCr: 0, expiringCr: 0 } as Credits,
    "lagos-bites": { balanceCr: 1240, expiringCr: 360, expiresOn: "2027-08-24" } as Credits,
    "ada-interiors-and-home-styling": { balanceCr: 0, expiringCr: 0 } as Credits,
    "kemi-bakes": { balanceCr: 0, expiringCr: 0 } as Credits,
  } as Record<string, Credits>,

  checkouts: {} as Record<string, Checkout>,

  appCatalog: [
    { id: "a1", name: "WhatsApp order strip", kind: "app", priceCr: 5000, blurb: "Take orders straight from WhatsApp on any page." },
    { id: "a2", name: "Bookings", kind: "app", priceCr: 5000, blurb: "Appointments, time slots and reminders." },
    { id: "b1", name: "Food & hospitality bundle", kind: "bundle", priceCr: 50000, blurb: "Menus, reservations, delivery zones and reviews in one install." },
  ] as CatalogApp[],

  ownedApps: {
    "acme-fashion-group": [] as OwnedApp[],
    "lagos-bites": [
      { id: "a1", name: "WhatsApp order strip", kind: "app", paidWith: "wallet", purchasedAt: "2026-06-02", priceCr: 5000 },
      { id: "b1", name: "Food & hospitality bundle", kind: "bundle", paidWith: "plan", purchasedAt: "2026-04-24", priceCr: 50000 },
    ] as OwnedApp[],
    "ada-interiors-and-home-styling": [] as OwnedApp[],
    "kemi-bakes": [] as OwnedApp[],
  } as Record<string, OwnedApp[]>,

  usage: {
    "acme-fashion-group": {
      requests: 1284,
      storageMb: 62,
      emailsSent: 870,
      period: "August",
      limits: { requests: 50000, storageMb: 100, emails: 1000 },
      resources: [
        { key: "requests", label: "Requests", used: 1284, limit: 50000, unit: "" },
        // Deliberately close to the limit so the amber state shows on the default brand.
        { key: "emails", label: "Emails", used: 870, limit: 1000, unit: "" },
        { key: "db", label: "Database storage", used: 62, limit: 100, unit: "MB" },
        { key: "reads", label: "Database reads", used: 84000, limit: 5000000, unit: "" },
        { key: "writes", label: "Database writes", used: 9000, limit: 50000, unit: "" },
        { key: "files", label: "File storage", used: 210, limit: 500, unit: "MB" },
        { key: "vstore", label: "Video storage", used: 40, limit: 500, unit: "MB" },
        { key: "vbw", label: "Video bandwidth", used: 0.3, limit: 2, unit: "GB" },
        { key: "realtime", label: "Realtime events", used: 350, limit: 20000, unit: "" },
        { key: "ai", label: "AI page generations", used: 3, limit: 20, unit: "" },
      ],
    } as Usage,
    "lagos-bites": {
      requests: 45210,
      storageMb: 96,
      emailsSent: 960,
      period: "August",
      limits: { requests: 50000, storageMb: 100, emails: 1000 },
      resources: [
        { key: "requests", label: "Requests", used: 45210, limit: 50000, unit: "" },
        { key: "emails", label: "Emails", used: 960, limit: 1000, unit: "" },
        { key: "db", label: "Database storage", used: 96, limit: 100, unit: "MB" },
        { key: "reads", label: "Database reads", used: 4200000, limit: 5000000, unit: "" },
        { key: "writes", label: "Database writes", used: 41000, limit: 50000, unit: "" },
        { key: "files", label: "File storage", used: 430, limit: 500, unit: "MB" },
        { key: "vstore", label: "Video storage", used: 380, limit: 500, unit: "MB" },
        { key: "vbw", label: "Video bandwidth", used: 1.7, limit: 2, unit: "GB" },
        { key: "realtime", label: "Realtime events", used: 17800, limit: 20000, unit: "" },
        { key: "ai", label: "AI page generations", used: 12, limit: 20, unit: "" },
      ],
    } as Usage,
    "ada-interiors-and-home-styling": {
      requests: 37,
      storageMb: 4,
      emailsSent: 0,
      period: "September",
      limits: { requests: 50000, storageMb: 100, emails: 1000 },
      resources: [
        { key: "requests", label: "Requests", used: 37, limit: 50000, unit: "" },
        { key: "emails", label: "Emails", used: 0, limit: 1000, unit: "" },
        { key: "db", label: "Database storage", used: 4, limit: 100, unit: "MB" },
        { key: "reads", label: "Database reads", used: 900, limit: 5000000, unit: "" },
        { key: "writes", label: "Database writes", used: 120, limit: 50000, unit: "" },
        { key: "files", label: "File storage", used: 12, limit: 500, unit: "MB" },
        { key: "vstore", label: "Video storage", used: 0, limit: 500, unit: "MB" },
        { key: "vbw", label: "Video bandwidth", used: 0, limit: 2, unit: "GB" },
        { key: "realtime", label: "Realtime events", used: 4, limit: 20000, unit: "" },
        { key: "ai", label: "AI page generations", used: 1, limit: 20, unit: "" },
      ],
    } as Usage,
  } as Record<string, Usage>,

  team: {
    "acme-fashion-group": [
      {
        id: "u1",
        name: "Uliana Bilenkiy",
        email: "ulianabilenkiy@gmail.com",
        role: "owner" as Role,
        you: true,
        status: "active" as const,
      },
      {
        id: "u2",
        name: "Tobi Adeyemi",
        email: "tobi@acmefashion.ng",
        role: "admin" as Role,
        status: "active" as const,
      },
    ],
    "lagos-bites": [
      {
        id: "u3",
        name: "Chiamaka Obi",
        email: "chiamaka@lagosbites.ng",
        role: "owner" as Role,
        status: "active" as const,
      },
      {
        id: "u1",
        name: "Uliana Bilenkiy",
        email: "ulianabilenkiy@gmail.com",
        role: "admin" as Role,
        you: true,
        status: "active" as const,
      },
      {
        id: "u5",
        name: "Femi Adewale",
        email: "femi@lagosbites.ng",
        role: "admin" as Role,
        status: "active" as const,
      },
    ],
    "ada-interiors-and-home-styling": [
      {
        id: "u1",
        name: "Uliana Bilenkiy",
        email: "ulianabilenkiy@gmail.com",
        role: "owner" as Role,
        you: true,
        status: "active" as const,
      },
      {
        id: "u4",
        name: "Ada Okonkwo",
        email: "ada@adainteriors.ng",
        role: "admin" as Role,
        status: "invited" as const,
      },
    ],
    "kemi-bakes": [
      { id: "u1", name: "Uliana Bilenkiy", email: "ulianabilenkiy@gmail.com", role: "owner" as Role, you: true, status: "active" as const },
    ],
  } as Record<string, TeamMember[]>,

  payments: {
    "acme-fashion-group": [] as Payment[],
    "lagos-bites": [
      { id: "p1", date: "2026-08-24", description: "Starter plan · yearly", amountNgn: 2000, status: "paid" as const },
      { id: "p2", date: "2026-08-22", description: "Starter plan · yearly", amountNgn: 2000, status: "failed" as const },
      { id: "p3", date: "2026-08-09", description: "Credit top-up · 1,000 credits", amountNgn: 1000, status: "paid" as const },
      { id: "p4", date: "2026-06-02", description: "App purchase · WhatsApp order strip", amountNgn: 2500, status: "paid" as const },
      { id: "p5", date: "2026-03-14", description: "Credit top-up · 2,000 credits", amountNgn: 2000, status: "paid" as const },
      { id: "p6", date: "2025-11-30", description: "App purchase · Menu grid with day tabs", amountNgn: 3500, status: "paid" as const },
      { id: "p7", date: "2025-08-24", description: "Starter plan · yearly", amountNgn: 2000, status: "paid" as const },
    ],
    "ada-interiors-and-home-styling": [] as Payment[],
    "kemi-bakes": [
      { id: "k1", date: "2025-05-14", description: "Starter plan, yearly", amountNgn: 2000, status: "paid" as const },
    ],
  } as Record<string, Payment[]>,

  wallet: {
    "acme-fashion-group": {
      balanceNgn: 12500,
      earnedNgn: 12500,
      spentNgn: 0,
      appCredits: 0,
    } as WalletSummary,
    "lagos-bites": {
      balanceNgn: 86200,
      earnedNgn: 101200,
      spentNgn: 5000,
      appCredits: 5000,
    } as WalletSummary,
    "ada-interiors-and-home-styling": {
      balanceNgn: 0,
      earnedNgn: 0,
      spentNgn: 0,
      appCredits: 0,
    } as WalletSummary,
    "kemi-bakes": { balanceNgn: 3400, earnedNgn: 9400, spentNgn: 6000, appCredits: 0 } as WalletSummary,
  } as Record<string, WalletSummary>,

  listings: [
    {
      id: "l1",
      title: "Lookbook hero with video",
      author: "Studio Nkechi",
      priceNgn: 4000,
      priceUsd: 2,
      category: "Hero sections",
      description: "Full-width hero with a looping video, headline and two buttons. Picks up your brand colours.",
    },
    {
      id: "l2",
      title: "WhatsApp order strip",
      author: "Femi builds",
      priceNgn: 2500,
      category: "Conversion",
    },
    {
      id: "l3",
      title: "Menu grid with day tabs",
      author: "Studio Nkechi",
      priceNgn: 3500,
      category: "Food & hospitality",
    },
    {
      id: "l4",
      title: "Testimonial wall",
      author: "Femi builds",
      priceNgn: 1500,
      category: "Conversion",
    },
    {
      id: "l5",
      title: "Split hero with price tag",
      author: "Kunle Design Co.",
      priceNgn: 3000,
      category: "Hero sections",
    },
    {
      id: "l6",
      title: "Reservation strip with time picker",
      author: "Kunle Design Co.",
      priceNgn: 4500,
      category: "Food & hospitality",
    },
  ] as Listing[],

  domains: {
    "acme-fashion-group": [] as DomainRecord[],
    "lagos-bites": [
      {
        id: "d1",
        hostname: "lagosbites.ng",
        status: "active" as const,
        addedAt: "2026-07-10",
        records: dnsFor("lagosbites.ng"),
        lastCheckedAt: "2026-07-10",
      },
      {
        id: "d2",
        hostname: "shop.lagosbites.ng",
        status: "pending-dns" as const,
        addedAt: "2026-09-04",
        records: dnsFor("shop.lagosbites.ng"),
      },
    ],
    "ada-interiors-and-home-styling": [] as DomainRecord[],
    "kemi-bakes": [] as DomainRecord[],
  } as Record<string, DomainRecord[]>,

  // Business verification (KYC) — gates taking money from customers through
  // the shared gateway; the brand's own plan never needs it.
  kyc: {
    "acme-fashion-group": { status: "not_started" } as Kyc,
    "lagos-bites": {
      status: "verified",
      businessName: "Lagos Bites Ltd",
      bankName: "Guaranty Trust Bank",
      bankCode: "058",
      accountNumber: "0123456789",
      accountName: "LAGOS BITES LIMITED",
      cacNumber: "RC1834412",
      submittedAt: "2026-07-05",
    } as Kyc,
    "ada-interiors-and-home-styling": {
      status: "pending",
      businessName: "Ada Interiors & Home Styling Studio",
      bankName: "Access Bank",
      bankCode: "044",
      accountNumber: "0456712398",
      accountName: "ADA OKONKWO INTERIORS",
      submittedAt: "2026-09-03",
    } as Kyc,
    "kemi-bakes": { status: "not_started" } as Kyc,
  } as Record<string, Kyc>,

  banks: [
    { code: "044", name: "Access Bank" },
    { code: "023", name: "Citibank Nigeria" },
    { code: "050", name: "Ecobank Nigeria" },
    { code: "070", name: "Fidelity Bank" },
    { code: "011", name: "First Bank of Nigeria" },
    { code: "214", name: "First City Monument Bank" },
    { code: "058", name: "Guaranty Trust Bank" },
    { code: "301", name: "Jaiz Bank" },
    { code: "082", name: "Keystone Bank" },
    { code: "50211", name: "Kuda Bank" },
    { code: "50515", name: "Moniepoint MFB" },
    { code: "999992", name: "OPay Digital Services Limited (OPay)" },
    { code: "999991", name: "PalmPay" },
    { code: "076", name: "Polaris Bank" },
    { code: "101", name: "Providus Bank" },
    { code: "221", name: "Stanbic IBTC Bank" },
    { code: "232", name: "Sterling Bank" },
    { code: "032", name: "Union Bank of Nigeria" },
    { code: "033", name: "United Bank For Africa" },
    { code: "035", name: "Wema Bank" },
    { code: "057", name: "Zenith Bank" },
  ] as Bank[],

  takenSlugs: ["acme-fashion-group", "lagos-bites", "ada-interiors-and-home-styling", "kemi-bakes", "ada-fashion"],
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

const PROVISION_STEP_MS = 1600

function provisioningFor(brand: Brand): Provisioning {
  const total = PROVISION_STEPS.length
  if (brand.status !== "provisioning" || !brand.provisioningStartedAt) return { step: total, total, done: true }
  const step = Math.min(total, Math.floor((Date.now() - brand.provisioningStartedAt) / PROVISION_STEP_MS))
  if (step >= total) {
    brand.status = "live"
    delete brand.provisioningStartedAt
    return { step: total, total, done: true }
  }
  return { step, total, done: false }
}

function planLabelFor(slug: string): { planLabel: string; planStatus: Plan["status"] } {
  const p = store.plans[slug] ?? { status: "none" as const, name: "" }
  if (p.status === "trial") return { planLabel: `Free trial, ${p.daysLeft} days left`, planStatus: "trial" }
  if (p.status === "active") return { planLabel: `${p.name} plan`, planStatus: "active" }
  return { planLabel: "No plan", planStatus: "none" }
}

export const api = {
  listBrands: () =>
    call(
      store.brands.map((b) => {
        provisioningFor(b)
        return { ...b, ...planLabelFor(b.slug) } as BrandSummary
      }),
    ),
  getBrand: (slug: string) => {
    const brand = store.brands.find((b) => b.slug === slug)
    if (brand) provisioningFor(brand)
    return brand
      ? call(brand)
      : Promise.reject(new Error("This brand doesn't exist or you no longer have access to it."))
  },

  /** Provisioning progress; polled by the Overview while a new brand is being set up. */
  getProvisioning: (slug: string) => {
    const brand = store.brands.find((b) => b.slug === slug)
    return call(brand ? provisioningFor(brand) : { step: 0, total: PROVISION_STEPS.length, done: false }, { failable: false })
  },

  updateBrand: (slug: string, patch: { name?: string; description?: string; contactEmail?: string }) => {
    const brand = store.brands.find((b) => b.slug === slug)
    if (brand) Object.assign(brand, patch)
    return call(brand!)
  },

  getCredits: (slug: string) => call(store.credits[slug] ?? { balanceCr: 0, expiringCr: 0 }),

  /** Starts a Paystack-style checkout; the callback page settles it. */
  startCheckout: (input: { slug: string; kind: CheckoutKind; currency: Currency; planId?: string; credits?: number }) => {
    const reference = `ref_${Date.now().toString(36)}`
    let amount = 0
    let description = ""
    if (input.kind === "plan") {
      const plan = PLANS.find((p) => p.id === input.planId)!
      amount = input.currency === "USD" ? plan.priceUsd : plan.priceNgn
      description = `${plan.name} plan, yearly`
    } else {
      const cr = input.credits ?? 0
      amount = input.currency === "USD" ? cr / 2000 : cr
      description = `Credit top-up, ${cr.toLocaleString()} credits`
    }
    store.checkouts[reference] = { reference, slug: input.slug, kind: input.kind, currency: input.currency, amount, planId: input.planId, credits: input.credits, status: "pending", description }
    return call({ reference })
  },

  /** Confirms a checkout with the provider and applies it. In the mock a reference containing "fail" fails. */
  settleCheckout: (reference: string) => {
    const c = store.checkouts[reference]
    if (!c) return Promise.reject(new Error("We couldn't find that payment."))
    if (c.status === "pending") {
      if (reference.includes("fail")) c.status = "failed"
      else {
        c.status = "paid"
        if (c.kind === "plan") {
          const plan = PLANS.find((p) => p.id === c.planId)!
          store.plans[c.slug] = { status: "active", name: plan.name, renewsOn: plusOneYear(), priceNgn: plan.priceNgn, monthlyCredits: plan.credits }
          const b = store.brands.find((x) => x.slug === c.slug)
          if (b && b.status === "paused") b.status = "live"
        } else {
          const cr = store.credits[c.slug] ?? (store.credits[c.slug] = { balanceCr: 0, expiringCr: 0 })
          cr.balanceCr += c.credits ?? 0
        }
        const payments = store.payments[c.slug] ?? (store.payments[c.slug] = [])
        payments.unshift({ id: `p${Date.now()}`, date: today(), description: c.description, amountNgn: c.currency === "USD" ? Math.round(c.amount * 2000) : c.amount, status: "paid" })
      }
    }
    return call(c)
  },
  getCheckout: (reference: string) => {
    const c = store.checkouts[reference]
    return c ? call(c, { failable: false }) : Promise.reject(new Error("We couldn't find that payment."))
  },

  listOwnedApps: (slug: string) => call(store.ownedApps[slug] ?? []),
  getCatalogApp: (id: string) => {
    const a = store.appCatalog.find((x) => x.id === id)
    return a ? call(a, { failable: false }) : Promise.reject(new Error("Couldn't load pricing for this app. Try again from your app store."))
  },
  buyApp: (slug: string, appId: string, payWith: "credits" | "wallet") => {
    const a = store.appCatalog.find((x) => x.id === appId)!
    const owned = store.ownedApps[slug] ?? (store.ownedApps[slug] = [])
    if (owned.some((o) => o.id === appId)) return Promise.reject(new Error("This is already on your brand. Install it from your app store whenever you're ready."))
    const w = store.wallet[slug]
    if (payWith === "credits") {
      if (!w || w.appCredits < a.priceCr) return Promise.reject(new Error("Not enough app credits for this."))
      w.appCredits -= a.priceCr
    } else {
      if (!w || w.balanceNgn < a.priceCr) return Promise.reject(new Error("Not enough in your wallet for this."))
      w.balanceNgn -= a.priceCr
      w.spentNgn += a.priceCr
    }
    const rec: OwnedApp = { id: a.id, name: a.name, kind: a.kind, paidWith: payWith, purchasedAt: today(), priceCr: a.priceCr }
    owned.unshift(rec)
    return call(rec)
  },
  getPlan: (slug: string) => call(store.plans[slug] ?? { status: "none" as const, name: "" }),
  getUsage: (slug: string) => call(store.usage[slug] ?? null),
  listTeam: (slug: string) => call(store.team[slug] ?? []),
  listPayments: (slug: string) => call(store.payments[slug] ?? []),
  getWallet: (slug: string) => call(store.wallet[slug] ?? null),
  // Owner decision (2026-09-05): the marketplace shows its empty state until listing cards are designed.
  // `store.listings` is kept so the populated layout can be switched back on later.
  listListings: () => call(demo.listings ? store.listings : ([] as Listing[])),
  publishListing: (input: Omit<Listing, "id" | "author">) => {
    const l: Listing = { id: `l${Date.now()}`, author: store.account.name, ...input }
    store.listings.unshift(l)
    return call(l)
  },
  reportListing: (_id: string) => call(true),
  purchaseListing: (slug: string, id: string, pageId: string, currency: Currency) => {
    const l = store.listings.find((x) => x.id === id)
    if (!l) return Promise.reject(new Error("That listing is no longer available."))
    void slug
    void pageId
    void currency
    return call({ installedInto: pageId })
  },
  listDomains: (slug: string) => call(store.domains[slug] ?? []),

  getKyc: (slug: string) => call(store.kyc[slug] ?? ({ status: "not_started" } as Kyc)),
  listBanks: () => call(store.banks),

  /** Resolves the account name with the bank (mock: any 10 digits resolve; 0000000000 fails). */
  resolveAccount: (bankCode: string, accountNumber: string) => {
    if (accountNumber === "0000000000") {
      return new Promise<{ accountName: string }>((_, reject) =>
        setTimeout(() => reject(new Error("We couldn't find that account with this bank. Check the number and try again.")), 700),
      )
    }
    const bank = store.banks.find((b) => b.code === bankCode)
    return call({ accountName: `${(bank?.name ?? "ACCOUNT").split(" ")[0].toUpperCase()} CUSTOMER ${accountNumber.slice(-4)}` }, { failable: false })
  },

  submitKyc: (slug: string, input: Omit<Kyc, "status" | "submittedAt" | "reason">) => {
    store.kyc[slug] = { ...input, status: "pending", submittedAt: new Date().toISOString().slice(0, 10) }
    return call(store.kyc[slug])
  },

  checkSlug: (slug: string) =>
    call({ available: !store.takenSlugs.includes(slug) && slug.length >= 3 }, { failable: false }),

  inviteMember: (slug: string, email: string, role: Role) => {
    const members = store.team[slug] ?? (store.team[slug] = [])
    const invited: TeamMember = {
      id: `i${Date.now()}`,
      name: email.split("@")[0],
      email,
      role,
      status: "invited",
    }
    members.push(invited)
    return call(invited)
  },

  setRole: (slug: string, id: string, role: Role) => {
    const m = (store.team[slug] ?? []).find((x) => x.id === id)
    if (m) m.role = role
    return call(m!)
  },

  getAccount: () => call(store.account),
  updateAccount: (name: string) => {
    store.account.name = name
    return call(store.account)
  },

  removeMember: (slug: string, id: string) => {
    store.team[slug] = (store.team[slug] ?? []).filter((m) => m.id !== id)
    return call(true)
  },

  addDomain: (slug: string, hostname: string) => {
    const list = store.domains[slug] ?? (store.domains[slug] = [])
    const record: DomainRecord = {
      id: `d${Date.now()}`,
      hostname,
      status: "pending-dns",
      addedAt: today(),
      records: dnsFor(hostname),
    }
    list.push(record)
    return call(record)
  },
  getDomain: (slug: string, id: string) => {
    const d = (store.domains[slug] ?? []).find((x) => x.id === id)
    return d ? call(d) : Promise.reject(new Error("This domain isn't connected to this brand."))
  },
  /** Re-checks DNS. Mock: hostnames containing "fail" fail, everything else goes live. */
  refreshDomain: (slug: string, id: string) => {
    const d = (store.domains[slug] ?? []).find((x) => x.id === id)
    if (!d) return Promise.reject(new Error("This domain isn't connected to this brand."))
    d.lastCheckedAt = today()
    d.status = d.hostname.includes("fail") ? "failed" : "active"
    return call(d)
  },
  removeDomain: (slug: string, id: string) => {
    store.domains[slug] = (store.domains[slug] ?? []).filter((x) => x.id !== id)
    return call(true)
  },

  renameBrand: (slug: string, name: string) => {
    const brand = store.brands.find((b) => b.slug === slug)
    if (brand) brand.name = name
    return call(brand!)
  },

  createBrand: (name: string, slug: string, extra?: { description?: string; contactEmail?: string; currency?: Currency }) => {
    const brand: Brand = {
      slug,
      name,
      domain: `${slug}.brandsapp.io`,
      role: "owner",
      liveUrl: `https://${slug}.brandsapp.io`,
      adminUrl: `https://${slug}.brandsapp.io/admin`,
      createdAt: today(),
      status: "provisioning",
      provisioningStartedAt: Date.now(),
      currency: extra?.currency ?? "NGN",
      description: extra?.description || undefined,
      contactEmail: extra?.contactEmail || undefined,
    }
    store.brands.push(brand)
    store.plans[slug] = { status: "trial", name: "Free trial", daysLeft: 7 }
    store.team[slug] = [
      {
        id: "u1",
        name: "Uliana Bilenkiy",
        email: "ulianabilenkiy@gmail.com",
        role: "owner",
        you: true,
        status: "active",
      },
    ]
    store.payments[slug] = []
    store.wallet[slug] = { balanceNgn: 0, earnedNgn: 0, spentNgn: 0, appCredits: 0 }
    store.domains[slug] = []
    store.kyc[slug] = { status: "not_started" }
    store.credits[slug] = { balanceCr: 0, expiringCr: 0 }
    store.ownedApps[slug] = []
    store.takenSlugs.push(slug)
    return call(brand)
  },
}

export const ngn = (v: number) => `₦${v.toLocaleString("en-NG")}`
export const usd = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}`
export const money = (v: number, currency: Currency) => (currency === "USD" ? usd(v) : ngn(v))

/** Absolute dates read "24 Sep 2026" everywhere (Design Rules §9). */
export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

export const roleLabel: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
}

export const roleOption: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
}

export const roleHelp: Record<Role, string> = {
  owner: "Full control of this brand, including billing, domains and removing admins.",
  admin: "Can do everything an owner can, except remove or demote an owner.",
}
