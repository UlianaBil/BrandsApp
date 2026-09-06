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

export type Role = "owner" | "admin" | "member"
/** A brand membership on the platform is Owner or Admin (owner's decision, 2026-09-05); "member" only exists as a team role. */
export type BrandRole = "owner" | "admin"

export interface Account {
  name: string
  email: string
}

export interface Brand {
  slug: string
  name: string
  domain: string
  role: BrandRole
  liveUrl: string
  adminUrl: string
  createdAt: string
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
  category: string
}

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
  status: "active" | "pending-dns"
  addedAt: string
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
    },
    {
      slug: "lagos-bites",
      name: "Lagos Bites",
      domain: "lagos-bites.brandsapp.io",
      role: "admin" as BrandRole,
      liveUrl: "https://lagos-bites.brandsapp.io",
      adminUrl: "https://lagos-bites.brandsapp.io/admin",
      createdAt: "2026-07-02",
    },
    {
      slug: "ada-interiors-and-home-styling",
      name: "Ada Interiors & Home Styling Studio",
      domain: "ada-interiors-and-home-styling.brandsapp.io",
      role: "owner" as BrandRole,
      liveUrl: "https://ada-interiors-and-home-styling.brandsapp.io",
      adminUrl: "https://ada-interiors-and-home-styling.brandsapp.io/admin",
      createdAt: "2026-09-01",
    },
  ],

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
  } as Record<string, Plan>,

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
        role: "member" as Role,
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
  } as Record<string, WalletSummary>,

  listings: [
    {
      id: "l1",
      title: "Lookbook hero with video",
      author: "Studio Nkechi",
      priceNgn: 4000,
      category: "Hero sections",
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
      },
    ],
    "ada-interiors-and-home-styling": [] as DomainRecord[],
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

  takenSlugs: ["acme-fashion-group", "lagos-bites", "ada-interiors-and-home-styling", "ada-fashion"],
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export const api = {
  listBrands: () => call(store.brands),
  getBrand: (slug: string) => {
    const brand = store.brands.find((b) => b.slug === slug)
    return brand
      ? call(brand)
      : Promise.reject(new Error("This brand doesn't exist or you no longer have access to it."))
  },
  getPlan: (slug: string) => call(store.plans[slug] ?? { status: "none" as const, name: "" }),
  getUsage: (slug: string) => call(store.usage[slug] ?? null),
  listTeam: (slug: string) => call(store.team[slug] ?? []),
  listPayments: (slug: string) => call(store.payments[slug] ?? []),
  getWallet: (slug: string) => call(store.wallet[slug] ?? null),
  listListings: () => call(store.listings),
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
      addedAt: new Date().toISOString().slice(0, 10),
    }
    list.push(record)
    return call(record)
  },

  renameBrand: (slug: string, name: string) => {
    const brand = store.brands.find((b) => b.slug === slug)
    if (brand) brand.name = name
    return call(brand!)
  },

  createBrand: (name: string, slug: string) => {
    const brand: Brand = {
      slug,
      name,
      domain: `${slug}.brandsapp.io`,
      role: "owner",
      liveUrl: `https://${slug}.brandsapp.io`,
      adminUrl: `https://${slug}.brandsapp.io/admin`,
      createdAt: new Date().toISOString().slice(0, 10),
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
    store.takenSlugs.push(slug)
    return call(brand)
  },
}

export const ngn = (v: number) => `₦${v.toLocaleString("en-NG")}`

/** Absolute dates read "24 Sep 2026" everywhere (Design Rules §9). */
export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

export const roleLabel: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
}

export const roleOption: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member (view only)",
}

export const roleHelp: Record<Role, string> = {
  owner: "Full control of this brand, including billing, domains and removing admins.",
  admin: "Can do everything an owner can, except remove or demote an owner.",
  member: "Can view this dashboard but can't change billing, team or settings.",
}
