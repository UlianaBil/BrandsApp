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

export interface Brand {
  slug: string
  name: string
  domain: string
  role: Role
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
  brands: [
    {
      slug: "acme-fashion-group",
      name: "Acme Fashion Group",
      domain: "acme-fashion-group.brandsapp.io",
      role: "owner" as Role,
      liveUrl: "https://acme-fashion-group.brandsapp.io",
      adminUrl: "https://acme-fashion-group.brandsapp.io/admin",
      createdAt: "2026-08-12",
    },
    {
      slug: "lagos-bites",
      name: "Lagos Bites",
      domain: "lagos-bites.brandsapp.io",
      role: "member" as Role,
      liveUrl: "https://lagos-bites.brandsapp.io",
      adminUrl: "https://lagos-bites.brandsapp.io/admin",
      createdAt: "2026-07-02",
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
      renewsOn: "2026-09-24",
      priceNgn: 2000,
      monthlyCredits: 2000,
    } as Plan,
  } as Record<string, Plan>,

  usage: {
    "acme-fashion-group": {
      requests: 1284,
      storageMb: 62,
      emailsSent: 8,
      period: "August",
      limits: { requests: 50000, storageMb: 100, emails: 1000 },
      resources: [
        { key: "requests", label: "Requests", used: 1284, limit: 50000, unit: "" },
        { key: "emails", label: "Emails", used: 8, limit: 1000, unit: "" },
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
        role: "member" as Role,
        you: true,
        status: "active" as const,
      },
    ],
  } as Record<string, TeamMember[]>,

  payments: {
    "acme-fashion-group": [] as Payment[],
    "lagos-bites": [
      {
        id: "p1",
        date: "2026-08-24",
        description: "Starter plan · monthly",
        amountNgn: 2000,
        status: "paid" as const,
      },
      {
        id: "p2",
        date: "2026-08-09",
        description: "Credit top-up · 1,000 credits",
        amountNgn: 1000,
        status: "paid" as const,
      },
      {
        id: "p3",
        date: "2026-07-24",
        description: "Starter plan · monthly",
        amountNgn: 2000,
        status: "paid" as const,
      },
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
  } as Record<string, DomainRecord[]>,

  takenSlugs: ["acme-fashion-group", "lagos-bites", "ada-fashion"],
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
    store.takenSlugs.push(slug)
    return call(brand)
  },
}

export const ngn = (v: number) => `₦${v.toLocaleString("en-NG")}`

export const roleLabel: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
}

export const roleHelp: Record<Role, string> = {
  owner: "Full control of this brand, including billing, domains and removing admins.",
  admin: "Can do everything an owner can, except remove or demote an owner.",
  member: "Can view this dashboard but can't change billing, team or settings.",
}
