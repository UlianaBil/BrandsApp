# Non-UI Issues — BrandsApp Platform Dashboard

Technical and functional problems found while auditing the **production** dashboard at `brandsapp.io/dashboard/…` (31 Aug – 1 Sep 2026, signed in, mobile viewport, network + console captured). These are backend/platform issues: they are **not fixable from this repository** (the platform codebase is separate; `AdejamTechnologies/brandsapp-multitenant` is the tenant template and does not contain these endpoints), so none of them are "implemented" here. The `Dashboard` branch instead makes the *front end* resilient to them (error cards, retries, honest empty states), which is the UI half of the fix.

Endpoints below are ORPC routes observed as `POST /api/orpc/<route>`.

---

## 1. Core dashboard endpoints intermittently return HTTP 500

- **What:** `brand/list`, `brand/getBySlug`, `team/list`, `marketplace/list`, `billing/apps/owned` all returned `500 Internal Server Error` during a short session. The failures flap — an immediate retry of `brand/list` succeeded.
- **Where:** Every dashboard page; `brand/getBySlug` is called per page, so one flaky route degrades all of them.
- **Why it's a problem:** Every UX issue in the audit is amplified by this; the dashboard is effectively down whenever these fail. Flapping suggests a per-request dependency (DB connection, cold isolate, upstream quota) rather than a code path that always fails.
- **Recommended fix:** Server-side logging/alerting on these five routes first; find the shared dependency. Add retry-with-backoff in the dashboard's data layer for idempotent reads.
- **Priority:** High — **address now** (before any UI work ships, ideally).

## 2. Requests that hang forever (`pending`, no timeout)

- **What:** `domain/list` and some `brand/getBySlug` calls never settled — stuck `pending` for minutes. The UI has no request timeout either, hence the perpetual "Loading domains…".
- **Where:** Settings (domains), brand pages.
- **Why it's a problem:** A hung request is worse than a failed one — nothing ever tells the user (or the code) that it's over.
- **Recommended fix:** Server: find why the route never responds (likely awaiting an upstream that never resolves). Client: `AbortController` timeout (~10–15s) on every query so a hang becomes a visible, retryable error.
- **Priority:** High — **now**.

## 3. Domain-permission check fires and fails on pages that shouldn't call it

- **What:** Console error `"Only the brand's owner or an admin can manage domains."` thrown on the brand **Overview** for the signed-in account, with no UI consequence.
- **Where:** Overview and Settings.
- **Why it's a problem:** Either (a) the account's role is being resolved incorrectly (the same account can open the brand and see the Team invite UI), or (b) an owner/admin-only query is fired unconditionally for all roles and its rejection is swallowed. Both indicate role logic inconsistency between endpoints — worth an audit of its own before Team management ships widely.
- **Recommended fix:** Gate role-restricted queries on the resolved role before firing them; make one endpoint the single source of truth for "my role on this brand"; never throw unhandled from a background query.
- **Priority:** High — **now** (it's an authorization-logic smell, not just noise).

## 4. `brand/list` excludes brands where the user is a member

- **What:** The list endpoint returns only owned/admin brands (the account that can open `/dashboard/acme-fashion-group` gets an empty list).
- **Why it's a problem:** This is the backend half of audit issue 6 (invisible member brands). The UI fix needs the endpoint to return every accessible brand with a `role` field.
- **Recommended fix:** Extend `brand/list` to return `{ brand, role }` for all memberships (the mock API in this branch models exactly that shape).
- **Priority:** High — **now**, it blocks the corresponding UI improvement from shipping for real.

## 5. Unhandled promise rejections logged raw to console

- **What:** Every API failure surfaces as an uncaught exception from the bundle (`im: Internal Server Error` at `index-*.js`) — nothing catches rejections at the query layer.
- **Why it's a problem:** Beyond UX, it means no central place exists to attach reporting/metrics; error tracking (Sentry or similar) would show a single noisy signature.
- **Recommended fix:** Central query wrapper with typed errors (the `useAsync` pattern in this branch is the minimal version); wire it to error reporting.
- **Priority:** Medium — **now** if error reporting matters, otherwise with the next dashboard iteration.

## 6. Display name falls back to the URL slug on fetch failure

- **What:** Pages render the route param (`acme-fashion-group`) as the brand title whenever `brand/getBySlug` fails/hangs, so the same session shows the pretty name on one page and the slug on another.
- **Why it's a problem:** Data issue behind audit issue 3 — the fallback silently substitutes an identifier for data.
- **Recommended fix:** Cache the brand record once per session (any state library or even memory cache keyed by slug); loading shows a skeleton, failure shows the error card — never the slug.
- **Priority:** Medium — **now**, cheap once the query layer exists.

## 7. Onboarding funnels disagree (product logic, not UI)

- **What:** The public site's only path is waitlist → manual WhatsApp outreach; the signed-in dashboard offers instant self-serve creation with a 7-day trial. Neither surface acknowledges the other.
- **Why it's a problem:** Two sources of truth for "how do I get a brand" — pricing/trial policy stated in one place and absent in the other; users invited via WhatsApp land in a dashboard whose creation flow implies they never needed the waitlist.
- **Recommended fix:** A product decision (concierge for cold traffic vs self-serve for invited users is fine) — then make each surface state it. Not a code fix first.
- **Priority:** Medium — **later**, but decide before public launch.

## 8. Not audited: submit paths on the production platform

- **What:** Waitlist submit, create-brand submit, team invite and add-domain were **not** executed against production (to avoid creating real records/infra). Their server-side validation and failure messaging remain unverified.
- **Recommended fix:** Test with throwaway data in a staging tenant; verify duplicate-slug handling, invite email delivery, and DNS instruction copy.
- **Priority:** Medium — **later**, needs a safe environment.

---

## Notes on this prototype (`Dashboard` branch)

- Checkout, marketplace purchase and "sell a section" intentionally show a "not wired up in this prototype" toast instead of pretending to work — wiring them requires the real billing backend.
- The mock layer (`src/mock.ts`) documents, in its shapes, the API contract the improved UI expects (`role` on brands, member lists including the owner, plan status enum, domain status enum). It can serve as the reference when aligning the real ORPC routes.
- The Demo panel (bottom-right) simulates issues 1–2 (failures and slowness) so reviewers can verify the front-end resilience without a bad network.
