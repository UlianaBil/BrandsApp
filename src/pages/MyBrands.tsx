import { Link } from "react-router-dom"
import { api } from "../mock"
import { EmptyState, ErrorState, Icon, initials, PageHeader, RoleChip, Skeleton, useAsync } from "../ui"

function BrandCardSkeleton() {
  return (
    <div className="card brandcard" aria-hidden="true">
      <div className="bc-top">
        <Skeleton h={40} w={40} round />
        <div style={{ flex: 1 }}>
          <Skeleton h={14} w="55%" />
          <Skeleton h={11} w="70%" style={{ marginTop: 8 }} />
        </div>
      </div>
      <div className="bc-foot"><Skeleton h={11} w="40%" /></div>
    </div>
  )
}

const since = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" })
}

export default function MyBrands() {
  const brands = useAsync(() => api.listBrands(), [])

  return (
    <main className="page">
      <PageHeader
        title="My Brands"
        sub="Every brand you own or help run, in one place."
        actions={
          brands.data && brands.data.length > 0 ? (
            <Link to="/dashboard/create" className="btn btn-accent">
              <span className="ico-circle"><Icon name="plus" size={13} /></span>
              New brand
            </Link>
          ) : undefined
        }
      />

      {brands.loading && (
        <div className="grid-brands" role="status" aria-label="Loading">
          <BrandCardSkeleton /><BrandCardSkeleton />
        </div>
      )}

      {brands.error && <ErrorState message={brands.error} onRetry={brands.retry} />}

      {brands.data && brands.data.length === 0 && (
        <EmptyState
          icon="grid"
          title="No brands yet"
          body="Create your first brand and get your website, storefront and business apps — all in one place."
          action={<Link to="/dashboard/create" className="btn btn-accent">Create your first brand</Link>}
        />
      )}

      {brands.data && brands.data.length > 0 && (
        <div className="grid-brands">
            {brands.data.map((b) => (
              <Link key={b.slug} to={`/dashboard/${b.slug}`} className="card brandcard" aria-label={`${b.name} — open overview`}>
                <div className="bc-top">
                  <div className="brand-avatar" aria-hidden="true">{initials(b.name)}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h2 title={b.name}>{b.name}</h2>
                    <p className="domain-line"><span className="dom">{b.domain}</span></p>
                  </div>
                  <RoleChip role={b.role} />
                </div>
                <div className="bc-foot">
                  <span className="bc-meta">Since {since(b.createdAt)}</span>
                  <span className="mc-arrow" aria-hidden="true"><Icon name="arrow-up-right" size={16} /></span>
                </div>
              </Link>
            ))}
        </div>
      )}
    </main>
  )
}
