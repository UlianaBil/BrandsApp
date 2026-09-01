# BrandsApp Dashboard — UX/UI Audit & Improvements

**Scope:** the platform dashboard at `brandsapp.io/dashboard/…` (My Brands, Create brand, Brand overview, Billing, Finances, Team, Settings, Marketplace).
**Method:** live walkthrough of the production dashboard on a phone-sized viewport with network traffic and console output captured, plus inspection of the reference codebase (`AdejamTechnologies/brandsapp-multitenant`, read-only) to understand architecture and intent.
**Audience assumption (from the product's own docs):** a non-technical Nigerian SME owner, usually on a phone, often on a patchy network. That assumption drives most priorities below — on this audience, a missing error state is not a polish issue, it is the product appearing broken.

**This branch (`Dashboard`)** contains a working re-implementation of the dashboard with every "Implemented" item below built in. It runs against a mock data layer (`src/mock.ts`) because the platform backend is not part of this repository; the mock adds realistic latency and a **Demo panel** (bottom-right) that simulates a slow or failing API so every loading/error/retry state can be reviewed live.

---

## Cross-cutting

### 1. Failures render as infinite spinners — the UI has no error state
- **Issue:** In production, when a dashboard API call fails, pages show a bare spinner forever (My Brands, Billing's plan area, Settings' "Loading domains…"). Errors appear only in the developer console.
- **Why it matters:** The target user is on a network where requests genuinely fail. A spinner that never resolves is indistinguishable from "the app is broken"; the only recovery a non-technical user knows is closing the tab.
- **Recommendation:** Every query gets three first-class states: skeleton while loading, an error card with a plain-language message and a **Try again** button on failure, and content on success.
- **Expected benefit:** Users recover from bad connections themselves instead of abandoning; support load drops.
- **Priority:** High
- **Implemented:** ✅ `useAsync` hook + `ErrorState` component used by every page; skeletons replace spinners. Test it with the Demo panel → "API failures".

### 2. Empty states masked failures
- **Issue:** In production, a failed request could render the *empty* state: Marketplace showed "No listings yet." while its API returned 500; My Brands showed "No brands yet" to an account that had access to a brand.
- **Why it matters:** "You have nothing" and "we couldn't load your things" are opposite messages. Conflating them makes owners believe their data is gone.
- **Recommendation:** Render an empty state only on a confirmed empty successful response; failures get the error card.
- **Expected benefit:** Trust. The dashboard never lies about the user's data.
- **Priority:** High
- **Implemented:** ✅ Structural — empty states are only reachable from a successful response in every page.

### 3. Raw slug shown instead of the brand's display name
- **Issue:** Production pages often title the brand `acme-fashion-group` instead of "Acme Fashion Group" — and inconsistently (Billing showed the display name while Overview showed the slug in the same session), because each page independently fetches the brand and falls back to the URL slug when the fetch fails. The domain line also wrapped mid-word ("brandsap p.io").
- **Why it matters:** The brand's identity is the emotional center of the product ("run your whole brand"); a machine identifier as the page title reads unfinished, and the inconsistency reads broken.
- **Recommendation:** Always show the display name; never use the slug as a title (the slug only appears as part of the domain). Wrap the domain with `overflow-wrap: anywhere`.
- **Expected benefit:** The dashboard feels like it's about *the user's brand*, not about database keys.
- **Priority:** Medium
- **Implemented:** ✅ `BrandHeader` component used across all brand pages; slug appears only inside the domain string; domain line wraps cleanly.

### 4. No scroll reset on navigation (intermittent in production)
- **Issue:** A route change could keep the previous scroll position, opening the new page at its footer.
- **Recommendation / Implemented:** ✅ The shell scrolls to top on every pathname change.
- **Priority:** Medium

### 5. Component & feedback consistency
- **Issue:** Production mixes patterns (spinner styles, empty-state formats, inconsistent zero states like "—" vs "₦0") and gives no feedback after actions (Copy link had no confirmation).
- **Recommendation:** One card system, one chip system (role chips, status chips), one state system, and toast confirmations for every action ("Link copied", "Invite sent to …").
- **Expected benefit:** Predictability — users learn the system once.
- **Priority:** Medium
- **Implemented:** ✅ Shared `ui.tsx` primitives (cards, chips, states, toasts) used by every page; all statuses are worded chips (Live, Free trial, Paid, Waiting for DNS…) rather than bare colors.

---

## My Brands (`/dashboard`)

### 6. Brands where you're a member are invisible
- **Issue:** Production lists only owned/admin brands. A member sees "No brands yet" and has no navigation path to a brand they can open by direct URL; the "← My Brands" link on brand pages then leads them to a page claiming they have nothing.
- **Why it matters:** It's a dead end for every staff member of every brand, and it contradicts the page's own back-navigation.
- **Recommendation:** List every brand the account can access with a role badge (Owner / Admin / Member); gate capabilities *inside* the brand rather than hiding the brand from navigation.
- **Expected benefit:** Team members can actually use the product; navigation is honest.
- **Priority:** High
- **Implemented:** ✅ My Brands lists both mock brands — "Acme Fashion Group (Owner)" and "Lagos Bites (Member)" — with role chips; member role is read-only inside the brand (see Team/Settings).

### 7. Empty state copy
- **Issue:** The production empty state buries the member-brand caveat in the middle of the "create your first brand" pitch.
- **Implemented:** ✅ Simplified empty-state copy focused on the action; the role explanation moved to a persistent footnote under the list.
- **Priority:** Low

---

## Create brand (`/dashboard/create`)

*The strongest screen in the production dashboard — kept its logic (live name → slug, country → currency, disabled submit until valid, trial reassurance) and closed the gaps.*

### 8. No feedback on address availability
- **Issue:** The production form auto-generates the slug but never says whether it's free; the user finds out at submit.
- **Recommendation:** Debounced availability check with inline result ("✓ …available" / "…already taken — try another address"), editable slug.
- **Priority:** Medium
- **Implemented:** ✅ Live availability check with aria-live status; the slug is editable and re-slugified as you type. Try `ada-fashion` to see the "taken" state.

### 9. Field labels and helper copy
- **Issue:** "URL" is developer vocabulary; there's no hint that the name can change later (a common hesitation point).
- **Implemented:** ✅ "URL" → "Web address"; helper text under name ("you can change it later") and address ("you can connect your own domain later"); inline email validation with a human message; submit button narrates progress ("Setting up your brand…").
- **Priority:** Low

---

## Brand overview (`/dashboard/:slug`)

### 10. No path to the place where the business is actually run
- **Issue:** In production, "Manage this brand" offers Billing / Finances / Team / Marketplace / Settings — money and infrastructure. The tenant admin (products, orders, pages, apps at `slug.brandsapp.io/admin`) has **no entry point anywhere**; the only outbound link opens the public storefront.
- **Why it matters:** The dashboard's daily job for an owner is "get to my business." Requiring a memorized second URL for that is the single biggest IA gap in the product.
- **Recommendation:** Make "Open brand admin" the primary action of the overview, with "View live site" secondary.
- **Expected benefit:** The most common task becomes the most prominent button.
- **Priority:** High
- **Implemented:** ✅ Hero card: Live status chip + role chip, primary **Open brand admin**, secondary **View live site**, tertiary **Copy link** (with toast), and a one-line explanation of what lives in the admin.

### 11. Plan and usage cards were empty shells
- **Issue:** Production showed "No subscription found for this brand." (a raw backend message) and "No usage recorded yet."
- **Recommendation:** The plan card should always answer "am I okay, and what should I do next?" — trial with days left → "Choose a plan"; active → renewal date; none → clear CTA. Usage should show the three numbers an owner recognizes (visits, storage, emails) rather than nothing.
- **Priority:** Medium
- **Implemented:** ✅ All three plan states designed and wired; usage card with real numbers and an honest "appears once your site gets its first visits" empty state; per-card inline error + retry so one failed call doesn't blank the page.

### 12. Member view
- **Implemented:** ✅ A member sees the overview with a read-only note ("billing, team and settings are read-only for you") instead of being locked out or misled. Open "Lagos Bites" to review.
- **Priority:** Medium

---

## Billing (`/dashboard/:slug/billing`)

### 13. Nothing to act on
- **Issue:** In production the page showed a raw "No subscription record found for this brand", a spinner that never resolved (the plans area), and an empty payment history — no plans to choose, nothing to do.
- **Recommendation:** Show the subscription state in human terms, always show the available plans with prices and a clear current-plan marker, and give payment history a true empty state ("Once you're on a paid plan, every charge shows up here").
- **Priority:** High
- **Implemented:** ✅ Subscription card (trial/active/none states), plan cards with "Current plan" chip and Choose/Switch actions, payment history list with Paid/Failed chips and a proper empty state. (Checkout intentionally shows a "not wired up in this prototype" toast — see Non-UI-Issues.md.)

---

## Finances (`/dashboard/:slug/finances`)

### 14. Confusing numbers and apologetic copy
- **Issue:** Production showed "—" for wallet balance but "₦0" for spending (two different zeros), paragraphs apologizing for missing features ("an itemised list… isn't available on this screen yet"), and a dense explanation of two different credit systems; it also sent users in a circle ("buy one from Billing" while Billing showed nothing purchasable).
- **Why it matters:** A money page must answer "what do I have?" in one glance. Dashes and meta-copy erode exactly the trust a wallet needs.
- **Recommendation:** One headline number (wallet balance), three consistent stat cards (money in / money out / app credits) each with a one-line plain explanation, and the credit taxonomy folded into an expandable "How the two kinds of credit work".
- **Priority:** Medium
- **Implemented:** ✅ As recommended; the Billing cross-link is a real link; zero states are consistently "₦0", never "—".

---

## Team (`/dashboard/:slug/team`)

### 15. The page promised "who has access" but never showed anyone
- **Issue:** Production rendered the invite form and then "Loading team…" which, when the list API failed, never became a list or an error — not even the owner was shown.
- **Recommendation:** Members list first (the page's core promise), invite second. The owner is always visible; each member gets an avatar, role chip, "(you)" marker, and Invited status when pending.
- **Priority:** High
- **Implemented:** ✅ "People with access · N" card first, then the invite card. List failures show the error card with retry.

### 16. Invite form gaps
- **Issue:** Role helper text only ever described Admin; no inline validation; no feedback after inviting.
- **Implemented:** ✅ Helper text changes per selected role (Admin/Member described in plain words); inline validation ("Enter a full email address…", duplicate detection); success toast; the new invitee appears in the list with an "Invited" chip. Remove action is owner/admin-only and never offered against an owner or yourself.
- **Priority:** Medium

---

## Settings (`/dashboard/:slug/settings`)

### 17. Brand name wasn't editable anywhere
- **Issue:** The display name exists in the backend (Billing showed it) but no dashboard surface let the owner set or fix it — while the UI fell back to the slug (issue 3).
- **Implemented:** ✅ "Brand name" card at the top of Settings with save feedback; read-only for members.
- **Priority:** Medium

### 18. Domains: perpetual loading, no state design
- **Issue:** Production hung on "Loading domains…" (its API call also fired a permission error for non-owners with no UI). No connected-domain list design, no validation on the add field.
- **Implemented:** ✅ Domain list with Active / "Waiting for DNS" status chips and a true empty state; hostname validation with a human error; add-domain feedback via toast; the whole domains section is hidden for members (fail-closed) rather than half-rendered.
- **Priority:** Medium

---

## Marketplace (`/dashboard/:slug/marketplace`)

### 19. "No listings yet." as the entire page
- **Issue:** In production the empty state was one line (and could mask an API failure — issue 2); "Sell a section" was the only styled element.
- **Implemented:** ✅ Listing cards (category chip, author, Naira price, Preview & buy) with loading/error/empty states; the empty state sells the two-sided market ("You could be first: sell one of yours").
- **Priority:** Low

---

## Navigation & responsive behavior

### 20. Brand sections were reachable only through the overview
- **Issue:** In production, moving between Billing → Team → Settings required going through Overview each time on mobile (the drawer had the links, but the pages themselves had no persistent context navigation on desktop).
- **Implemented:** ✅ Persistent sidebar (≥900px) with a "This brand" section when inside a brand; breadcrumbs (My Brands / Brand / Page) on every page; mobile gets a top bar + slide-in drawer (scrim, Esc to close, closes on navigation).
- **Priority:** Medium

### 21. Accessibility & mobile ergonomics
- **Implemented:** ✅ Visible focus states on everything interactive; aria-labels on icon buttons; `aria-live` on availability/status messages; `aria-invalid` + described-by on failing fields; reduced-motion media queries on all animation; 40px+ tap targets; single-column layouts under 700px; the page never scrolls horizontally.
- **Priority:** Medium

---

## Summary of priorities

| # | Area | Issue | Priority | Status |
|---|------|-------|----------|--------|
| 1 | All | No error states, infinite spinners | High | ✅ Implemented |
| 2 | All | Empty states masked failures | High | ✅ Implemented |
| 6 | My Brands | Member brands invisible | High | ✅ Implemented |
| 10 | Overview | No path to brand admin | High | ✅ Implemented |
| 13 | Billing | Nothing to act on | High | ✅ Implemented |
| 15 | Team | Member list never shown | High | ✅ Implemented |
| 3 | All | Slug shown instead of name | Medium | ✅ Implemented |
| 4 | All | No scroll reset on navigation | Medium | ✅ Implemented |
| 5 | All | Inconsistent components/feedback | Medium | ✅ Implemented |
| 8 | Create | No slug availability feedback | Medium | ✅ Implemented |
| 11 | Overview | Empty plan/usage cards | Medium | ✅ Implemented |
| 12 | Overview | Member view undefined | Medium | ✅ Implemented |
| 14 | Finances | Confusing numbers/copy | Medium | ✅ Implemented |
| 16 | Team | Invite form gaps | Medium | ✅ Implemented |
| 17 | Settings | Brand name not editable | Medium | ✅ Implemented |
| 18 | Settings | Domains states | Medium | ✅ Implemented |
| 20 | Nav | Section navigation | Medium | ✅ Implemented |
| 21 | Nav | Accessibility/ergonomics | Medium | ✅ Implemented |
| 7 | My Brands | Empty-state copy | Low | ✅ Implemented |
| 9 | Create | Labels/helper copy | Low | ✅ Implemented |
| 19 | Marketplace | Empty page | Low | ✅ Implemented |

## Refinement pass — original UI preserved by default

After review, the visual layer was pulled back toward the original production components ("preserve by default, improve only where necessary"):

- **Buttons and inputs** returned to the original squarish ~10px radius (the first iteration's full pills were an unnecessary change).
- **Cards** returned to the original 12px radius; the page ground returned to white.
- **Manage cards** returned to the original pattern — plain terracotta icon above the title, no decorative icon tiles.
- **"Your brand is live" card** returned to the original tinted (peach) treatment, now carrying the improved actions.
- **Brand card** (My Brands) keeps its approved redesign, with the avatar now showing the brand's real initials ("AF" for Acme Fashion Group) instead of a generic globe icon; the same initials avatar identifies the brand on the Overview.
- Pill shapes are now reserved for chips/badges only, matching how the original used them.

## What was deliberately kept

- The existing information architecture (My Brands → brand → Billing/Finances/Team/Settings/Marketplace) — it's sound; the problems were states and gaps, not structure.
- All existing copy that worked ("Don't own one yet? Buying a domain through BrandsApp is coming soon.", the trial reassurance, the Team page's account-vs-app-staff distinction).
- The brand look: terracotta/cream/Inter, pill buttons, soft cards — matched to the landing page in this repository so dashboard and marketing feel like one product.
- The visual tone of the production dashboard (light ground, bordered cards, generous spacing) — refined, not replaced.
