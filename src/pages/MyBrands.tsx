import { Link } from "react-router-dom"
import { api } from "../mock"
import { CardSkeleton, EmptyState, ErrorState, Icon, initials, RoleChip, useAsync } from "../ui"

export default function MyBrands() {
  const brands = useAsync(() => api.listBrands(), [])

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>My Brands</h1>
          <p className="sub">Every brand you own or help run, in one place.</p>
        </div>
        <Link to="/dashboard/create" className="btn btn-primary">
          <Icon name="plus" size={17} />
          New brand
        </Link>
      </div>

      {brands.loading && (
        <div className="stack">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
        </div>
      )}

      {brands.error && <ErrorState message={brands.error} onRetry={brands.retry} />}

      {brands.data && brands.data.length === 0 && (
        <EmptyState
          title="No brands yet"
          body="Create your first brand and get your website, storefront and business apps — all in one place."
          action={
            <Link to="/dashboard/create" className="btn btn-primary btn-sm">
              Create your first brand
            </Link>
          }
        />
      )}

      {brands.data && brands.data.length > 0 && (
        <div className="stack">
          {brands.data.map((b) => (
            <Link key={b.slug} to={`/dashboard/${b.slug}`} className="card linkcard">
              <div className="brand-avatar" aria-hidden="true">
                {initials(b.name)}
              </div>
              <div className="grow" style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h2 style={{ marginBottom: 0 }}>{b.name}</h2>
                  <RoleChip role={b.role} />
                </div>
                <p className="domain-line">{b.domain}</p>
              </div>
              <span style={{ color: "var(--muted)", alignSelf: "center" }} aria-hidden="true">
                <Icon name="arrow-right" size={18} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
