# BrandsApp Dashboard — Design & UX Rules

Source of truth for every screen in the BrandsApp platform dashboard. It documents the rules behind the system, not the screens that happen to exist today. A designer or developer who has never seen the dashboard should be able to build a new screen from this document alone and have it look and behave like the rest of the product.

**Precedence when rules conflict:** the owner's explicit decision → this document → the code in `src/styles.css` and `src/ui.tsx` → your judgement, applied in the spirit of the rules below.

**Who we build for:** a non-technical Nigerian SME owner, usually on a phone, often on a patchy network. Every rule about states, copy and tap targets follows from that.

---

## 1. Principles

1. **Clarity → hierarchy → usability → consistency → polish.** In that order. Never trade an earlier one for a later one.
2. **Colour is a signal, not decoration.** Grey ground, white surfaces, dark text. Orange means "the brand" or "this needs action". Green/amber/red mean good/warning/bad and nothing else.
3. **One primary action per view.** Everything else is secondary or quieter.
4. **Never lie about data.** Loading, error and empty are three different truths and get three different designs.
5. **Every action gets a response.** A toast, a state change, or a navigation, within the same screen the action was taken on.
6. **Phones first.** Layouts are designed at 390px and widened; nothing scrolls sideways; tap targets are at least 40px.

---

## 2. Foundations

### 2.1 Colour tokens

| Token | Value | Use |
|---|---|---|
| `--ground` | `#F9F9F9` | Page background. The only grey ground. |
| `--paper` | `#FFFFFF` | Cards, sidebar, pills, inputs, modals. |
| `--soft` | `#F1F1F1` | Secondary buttons, icon circles, segmented-control track, disabled inputs, skeleton base. |
| `--soft-lift` | `#E8E8E8` | Hover/press on `--soft`. |
| `--line` | `rgba(28,28,28,.07)` | Card borders, dividers, table rules. |
| `--line-strong` | `rgba(28,28,28,.14)` | Input borders, outline buttons, separators inside pills. |
| `--dark` / `--ink` | `#1C1C1C` | Primary buttons, active nav, headings, body text. |
| `--dark-lift` | `#2E2E2E` | Hover/press on `--dark`. |
| `--body` | `#5B5B5B` | Secondary text: subtitles, hints, card body. |
| `--muted` | `#767676` | Tertiary text: meta, table headers, placeholders' neighbours. 4.5:1 on white — the lightest text allowed. |
| `--accent` | `#EA542D` | Brand avatars, focus rings, the empty-state primary CTA, upgrade/marketing only. |
| `--accent-soft` / `--accent-ink` | `#FDEEE8` / `#B93A18` | Owner role chip; the eyebrow on an upgrade tile. |
| `--tile` | `#F8C8B0` | The "needs action" stat tile (peach). Dark ink on top, never white. |
| `--good` / `--good-bg` | `#187A42` / `#E6F4EB` | Live, Active, Paid, Spendable; the healthy range of a meter. |
| `--warn` / `--warn-bg` | `#855A0C` / `#FBF1DC` | Free trial, Invited, Waiting for DNS, meter ≥ 80%. |
| `--bad` / `--bad-bg` | `#B3372F` / `#FBE9E7` | Failed, errors, destructive actions, meter ≥ 95%. |

Rules:
- Never introduce a new hue. If a new status needs a colour, map it to good/warn/bad/neutral.
- Orange is rationed. It appears on a screen at most twice: the brand avatar and one signal (a peach tile or the empty-state CTA). A routine button is never orange.
- There is no blue. Informational notes are dark text on `--paper` or `--soft`.
- Text on a coloured chip uses that chip's ink token, never white — except on `--dark` and `--accent` fills.

### 2.2 Typography

Inter, loaded from Google Fonts with `display=swap`; fallback to the system sans stack. Body is 14.5px / 1.5 with `letter-spacing: -0.005em`.

| Role | Size / weight | Letter-spacing | Where |
|---|---|---|---|
| Page title (h1) | 1.5rem / 600 | -0.025em | `PageHeader` only. One per screen. |
| Hero number | 1.9rem / 600 (`xl` 2.6rem, `md` 1.4rem) | -0.03em, tabular | Stat cards. |
| Section title (h2) | 1.05rem / 600 | -0.015em | Between card groups (`SectionHead`). Sentence case. |
| Card title (h2) | 1rem / 600 | -0.01em | Inside a card. |
| Body | .92–.95rem / 400–500 | — | Rows, descriptions, form values. |
| Hint | .88rem / 400, `--body` | — | Card body text, subtitles. |
| Meta / quiet | .78–.84rem, `--muted` | — | Dates, counts, footnotes. |
| Micro label | .68–.72rem / 600, uppercase | .06–.1em | Sidebar section label, table headers. Nowhere else. |
| Chip | .74rem / 600 | .01em | Status and role chips. |
| Button | .9rem / 600 (`sm` .85rem) | -0.005em | All buttons. |

Rules:
- Sentence case everywhere: titles, buttons, chips, labels. Uppercase is reserved for the two micro-label uses above.
- Numbers that line up (tables, stats, prices) use `font-variant-numeric: tabular-nums`.
- Running text never exceeds ~60ch; use `max-width` on subtitles and hints.

### 2.3 Spacing, radius, elevation

- **Spacing scale:** 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 22 · 24 · 30 · 36. Card padding is 22px (20px on link cards, 18px on fact cards). Gap between cards is 14px. Section title sits 30px above its group and 14px above its first card. Page padding is 16px on phones, 36px from 900px.
- **Radius:** cards and modals 20px (`--r-card`); every control — buttons, inputs, selects, chips, nav items, toasts — is a full pill (`--r-pill`); textareas, notes, menus and inner summary boxes 14–16px; icon circles 50%.
- **Elevation:** cards carry one soft shadow (`--shadow-card`) plus a hairline border. Hover lift uses `--shadow-hover`. Popovers, modals and toasts use `--shadow-pop`. Nothing else has a shadow. Never stack shadows to show importance — use position and size.
- **Ground vs paper:** the page is grey; anything that is an object (card, pill, input) is white. Don't put white on white — a card never sits inside a card. Group inside a card with dividers (`--line`), not nested cards.

### 2.4 Icons

Inline stroke icons, 24-unit grid, 1.7px stroke, round caps. Sizes: 19px in nav, 16px in stat headers and buttons, 14–15px inside chips and small buttons, 20px in manage-card circles. Icons are always paired with a label or an `aria-label`. Icons sit in a `--soft` circle when they lead a card or a row; they sit bare inside buttons and links. Add a new glyph to the `Icon` set rather than importing a library.

---

## 3. Layout & page structure

### 3.1 The shell

- **Sidebar** (≥ 900px): 252px, white, full height, sticky. Top: logomark + "BrandsApp". Nav: "My Brands", then — only when inside a brand — a section label with the brand's name and the six brand pages (Overview, Billing, Finances, Team, Marketplace, Settings). Foot: Collapse control and the signed-in account.
- **Rail:** Collapse turns the sidebar into an 80px icon rail. Labels become tooltips; the brand section label becomes a hairline divider; the state persists in `localStorage("nav.collapsed")`.
- **Mobile** (< 900px): a 60px sticky, blurred top bar (menu button + logomark) and a slide-in drawer with the same nav, closed by scrim, Escape, or navigating.
- Every route change scrolls to the top and closes the drawer.

### 3.2 Page anatomy (top to bottom)

1. **Back link** — phones only (desktop has the sidebar). Goes to the parent: brand pages → Overview (labelled with the brand name); Overview and Create → My Brands. Flow pages (Create) show it on every width.
2. **Context pill** — desktop only, on brand sub-pages: 24px initials avatar + brand name, linking to Overview. Overview itself replaces this with the full identity pill.
3. **Page header** — h1, one-line subtitle (≤ 60ch), actions on the right. Actions wrap under the title and go full-width on phones.
4. **Summary before detail** — stat/fact cards first, then lists and tables, then forms and settings, then footnotes. A reader who stops after the first row of cards should have the answer to "am I okay?".
5. **Sections** — a `SectionHead` (title + optional hint on the right) between card groups. Never a card just to hold a title.

The page container is `max-width: 1240px`, centred, with 110px bottom padding so the floating Demo button never covers content. Long-form or single-task pages (Create brand) use `.page.narrow` (680px).

### 3.3 Grids and breakpoints

| Grid | < 520 | 520–699 | 700–899 | 900–1239 | ≥ 1240 |
|---|---|---|---|---|---|
| `grid-2` | 1 | 1 | 2 | 2 | 2 |
| `grid-3` (stats, plans, listings) | 1 | 1 | 3 | 3 | 3 |
| `grid-manage` (link cards) | 1 | 2 | 2 | 3 | 5 |
| `grid-brands` | 1 | 2 (from 640) | 2 | 2 | 3 (from 1100) |
| `split` (list + side panel) | 1 | 1 | 1 | 1 (2 from 1000) | 2 |
| `facts` | auto-fit, 160px min | | | | |

All grid tracks are `minmax(0, 1fr)` so long content shrinks and truncates instead of stretching the grid. A card group with two items uses `grid-2`, never `grid-3` with a hole.

---

## 4. Navigation rules

- The sidebar shows *where you are*; the page header says *what you're looking at*. Don't repeat the brand name in the h1 of a sub-page — the context pill carries it.
- Brand identity is always the display name. The slug appears only inside the domain string.
- A new top-level brand page gets a nav item with a 19px icon and joins the six existing pages in the brand section. Sub-flows (a domain's DNS detail, an order) do **not** get nav items; they get a back link to their parent list.
- Links that leave the dashboard (brand admin, live site) open in a new tab and carry an arrow or external icon. Links inside the dashboard never do.
- Deep links must work: every page fetches what it needs from the URL; nothing depends on having visited another page first.

---

## 5. Buttons & CTA hierarchy

### 5.1 Variants

| Variant | Look | Use |
|---|---|---|
| `btn-primary` | Dark fill, white text | The one main action of a view: Open brand admin, Send invite, Save, Continue to payment. |
| `btn-secondary` | `--soft` fill, dark text | Supporting actions beside a primary; the default for actions on populated screens. |
| `btn-white` | White, hairline, shadow | A secondary action that sits on the grey ground (page-header actions, "New brand"). |
| `btn-outline` | Transparent, hairline | Rare — a secondary inside a coloured tile. |
| `btn-ghost` | No fill | Tertiary/inline actions: "Try again" inside a card, "Show 6 more". |
| `btn-accent` | Orange fill | Empty-state primary and upgrade/marketing CTAs only. |
| `btn-danger` / `btn-danger-ghost` | Red | Confirming a destructive action inside a modal; never on the page directly. |
| `link-cta` | Text + arrow | Quiet in-card navigation: "Manage plan →", "View finances →". |
| `iconbtn` | 40px circle | Icon-only controls with an `aria-label`: close, menu, copy, more. |

Sizes: default 42px tall; `btn-sm` 36px (inside cards and rows); `btn-lg` 48px (a form's single submit). Buttons in a page header are full-height defaults; buttons inside cards are `btn-sm`.

### 5.2 Hierarchy rules

- **One primary per view.** If two actions feel primary, one is wrong. On Overview it is "Open brand admin"; on a form it is the submit; on a list it is usually nothing — opening an item is the action.
- **Empty state → primary CTA. Populated → the same action becomes secondary.** An empty My Brands shows a filled "Create your first brand"; once brands exist, "New brand" is a white outlined pill in the header. Same for domains, team, payments and any future list.
- **Urgency, not importance, earns the accent.** A plan that is about to lapse gets the peach tile and its link. An active plan gets a plain card and a `link-cta`.
- **Read-only users see no dead buttons.** Hide actions a member can't take and explain once with a lock note ("Only an owner or admin can…"). Disabled buttons are for *not yet valid*, not *not allowed*.
- **Destructive actions are never one tap.** They live in a row menu or a ghost button, open a confirmation modal with a red confirm button, and name the thing being removed.
- **Labels are verbs that say what happens:** "Send invite", "Add domain", "Remove", "Continue to payment". Never "OK", "Submit", "Yes".
- **Pending state narrates:** the button disables and its label changes to the present progressive ("Saving…", "Sending invite…", "Setting up your brand…"). Spinners go inside the button, never replace it.

---

## 6. Components

### 6.1 Cards

- **Card** — white, 20px radius, hairline, `--shadow-card`, 22px padding. Title h2 (1rem/600) with an optional hint under it. Use `card-head` for title + hint + right-side control.
- **Stat card** — icon circle + small label (+ utility in the corner: a chip or a period), hero number, one support line ≤ 34ch, action at the bottom (`link-cta`, or `btn-sm` when the action is urgent). Min-height 190px so a row of them aligns. Add `tile-accent` only under the needs-action rule.
- **Fact card** (`facts`) — label over a single value; for short "current state" facts (Plan / Status / Renews). Values may be a chip.
- **Link card** (`managecard`, `brandcard`) — the whole card is the link; icon circle turns orange on pointer hover; a small arrow sits top-right; press feedback on touch. No buttons inside a link card.
- **Flush card** (`card.flush`) — zero padding so a table or row list runs edge to edge; header and footer get their own padding.
- **Plan card** — name, price with "/ year" (plans are billed yearly), feature list with tick circles, button pinned to the bottom. Current plan gets a dark inset outline and a dark "Current plan" chip.

### 6.2 Chips & status

- Chips are pills, .74rem/600, with a leading 6px dot for *state* chips (Live, Active, Paid, Failed, Invited, Waiting for DNS). Chips without a dot are *labels* (a category, a period, "Current plan").
- Tone mapping is fixed: good = healthy/complete, warn = temporary/pending/expiring, bad = failed/blocked, neutral = informational or inactive, dark = current selection, accent = ownership.
- Role chips: Owner (peach), Admin (dark), Member (grey). Roles are always chips, never plain text.
- Status is always a worded chip. Never a bare coloured dot, never colour alone.

### 6.3 Avatars

- **Brand:** orange circle, white initials (first letters of the first two words), 40px in headers, 24px in the context pill, 48px `lg`.
- **Person:** dark circle, white initials, 36px. Invited people use the `soft` variant (grey circle) until they accept.
- Uploaded logos, when the product supports them, replace the initials inside the same circle with `object-fit: cover`; the initials remain the fallback whenever the image is missing or fails.

### 6.4 Forms

- Label (.88rem/600) above the control, 7px gap; "Optional" as a muted suffix — never mark required fields with an asterisk.
- Inputs and selects are 46px pills with `--line-strong` borders; hover darkens the border, focus turns it `--ink` with a 3px soft ring. Textareas are 14px radius and resize vertically. Selects carry a custom chevron.
- Fixed prefixes/suffixes (`.brandsapp.io`, a leading icon) live inside the pill via `input-group`.
- Help text (.82rem, muted) sits under the field. Validation replaces it in place: red text with a warning icon, set `aria-invalid`, and clear the error as soon as the user edits. Success confirmation (e.g. address available) is green with a check icon in the same slot.
- Validate on submit or after a pause, never on every keystroke of a fresh field. Disable submit until the form is valid; explain why in the help text, not in a tooltip.
- Inline forms (`inline-form`) put one input and one button on a line for single-field edits (rename, add domain); the button wraps to full width under 560px.
- After a successful submit: toast, clear the fields that created something, keep the fields that edited something, refresh the affected list on the same screen.

### 6.5 Search, filters, tabs

- **Search** is a pill input with a leading magnifier and a clear button; it filters client-side as you type and searches every visible text field of the item.
- **Segmented control** (`Segmented`) serves both tabs and filters: a `--soft` track, dark pill for the selected option, optional counts. Use it when there are 2–5 options. More than five → a select.
- Only show a filter when it can change the result: a segmented Active/Invited filter appears only when someone is invited; category chips appear only when there is more than one category.
- A filter that returns nothing gets its own empty state ("No sections match …") with a "Clear filters" secondary button — never the page's true empty state.
- Toolbar order: search, then filters, then any view toggle; left-aligned under the page header.

### 6.6 Lists & tables

- **Row list** (`rowlist` / `row-item`) for people and other entities with an avatar: avatar, title + meta, then chips and a row menu on the right. Under 560px the right side wraps under the text.
- **Table** (`table`) for records with 3–5 comparable columns (payments, domains): micro-label header, hairline rows, hover tint on pointer devices. Under 700px the header hides and each row becomes a two-column stack with inline labels; the first cell spans the row.
- Column alignment: text left, numbers and money right (`num`), status right (`end`). Amounts are bold and tabular.
- Lists show the newest first. Truncate the *list* with pagination, never the *content* of a cell.
- **Pagination** at 5–10 rows per page, in the card footer: "Showing 1–5 of 8 payments" on the left, chevrons and page numbers on the right; the current page is a dark circle. Under two pages, render nothing.
- Row actions live in a "more" (`Menu`) dropdown: neutral actions first, a divider, destructive actions last in red. Never more than one visible button per row.

### 6.7 Meters

Six-pixel pill track in `--soft`. The fill follows the semantic scale: green (`--good`) while healthy, amber at ≥ 80%, red at ≥ 95%. Never the brand orange — in this system orange means "needs action", so a healthy bar in orange would read as a warning. Progress toward a *goal* (an onboarding checklist) uses `--dark` instead, because it has no danger threshold. Label left, "used of limit" right, in the units the user recognises. Sort meters by how close each is to its limit; show the top three and expand in place.

### 6.8 Modals

- Centred 460px dialog from 640px; a bottom sheet with 24px top corners below. Icon circle (red for destructive), title, one or two sentences of body, an optional summary box of label/value lines, then a footer with Cancel/Keep on the left and the action on the right (stacked, action on top, on phones).
- Use a modal for: confirming destructive actions, confirming money (plan changes, purchases), and previews. Don't use a modal for forms that fit on the page, or for information that could be a card.
- Escape and the scrim close it; focus moves into it on open; body scroll is locked; the confirm button is disabled while its request is pending.

### 6.9 Toasts

Dark pill at the bottom centre with a leading icon circle: neutral (info), success (green check), error (red warning). One sentence, no full stop needed, auto-dismiss after ~3.4s. Toasts confirm what happened ("Link copied", "Invite sent to ada@…") — they never carry actions or errors that require reading; those belong in the page.

### 6.10 Notes & explainers

- `member-note` — a white pill with an icon circle for one-line contextual notes (read-only access, where history will appear). Use `.block` for two-line notes, `.warn` for temporary warnings.
- `details.explainer` — a collapsed "How … works" for background the user might want once. Never put required information inside one.

---

## 7. States

Every piece of data on a screen has four states, and the screen must render all of them without layout shifts that move controls under the user's finger.

### 7.1 Loading

- Skeletons, never spinners for content. The skeleton matches the shape of what will load: a stat card shows a number bar and a line; a row list shows avatar circles and two lines; a brand card shows its own outline.
- Keep the frame: the card, its icon and its label render immediately; only the value area is a skeleton.
- Spinners are only allowed inside a button (`spin`) and next to inline availability checks.
- Slow networks are the norm — never block a whole page on one request. Each card loads on its own.

### 7.2 Error

- A failed request renders an `ErrorState` card in place of the data it replaced: red icon circle, "We couldn't load this", the plain-language message plus "Check your connection and try again.", and a secondary "Try again" button. Inside stat cards use `InlineError` so the card's frame and label remain.
- One failed request never blanks the page; sibling cards keep their data.
- Never show a raw backend message. Translate to what it means for the user.
- If the brand itself can't load, the page is only the back link and one error card.

### 7.3 Empty

- Empty states render **only after a successful response that returned nothing**. A failure is never shown as empty.
- `EmptyState`: grey icon circle, a short title that states the fact ("No payments yet"), one sentence that says when content will appear or what to do, and — if the user can create the content — a **primary** CTA (orange in the first-brand case, dark otherwise). If they can't, no button.
- Filter-empty is a different state (see 6.5) and never uses the accent.

### 7.4 Populated

Content per the component rules. When a list has content, the create action moves out of the body and into the header as a secondary button.

### 7.5 Permission & read-only

- Members see the same layout with actions removed and inputs disabled, plus one lock note per page explaining why. Hide whole sections that would only contain actions (a member never sees "Add a domain").
- If the role itself can't be confirmed (brand fetch failed), fail closed: hide management, show a note with "Try again".

### 7.6 Needs-action

A trial with ≤ 7 days left or no plan turns the Plan stat card peach with dark ink and a "Choose a plan" link. This is the only ambient use of colour for urgency; a second urgent item on the same screen gets a warn chip, not a second tile.

---

## 8. After user actions

| Action | During | On success | On failure |
|---|---|---|---|
| Submit a form | Button disabled, label narrates | Success toast; created records appear in the list; fields that created something clear | Error toast or inline field error; fields keep their values |
| Destructive action | Modal confirm button disabled | Modal closes, toast names the removed thing, list refreshes | Toast; modal stays open |
| Copy | — | Toast "Link copied" / "Email copied" | Toast explaining the fallback ("long-press the link instead") |
| Navigate | — | New page at scroll top; drawer closes | — |
| Create a brand | Submit narrates "Setting up your brand…" | Toast, then navigate straight into the new brand's Overview | Toast; stay on the form |
| Toggle a filter / tab | Instant | List re-renders; URL unchanged | — |
| Retry | Skeleton returns in the same slot | Content | Same error card again |

Never ask for confirmation of a non-destructive action, and never confirm success with a modal.

---

## 9. Content rules

- **Missing numbers** are zero, formatted like every other value: "₦0", "0 emails", never "—", "N/A" or a blank. A missing *record* is an empty state, a missing *field* is omitted (don't render "Renews: —").
- **Money:** Naira with the ₦ sign and thousands separators (`ngn()`), bold and tabular in tables; "/ year" as a muted suffix — plans are billed yearly; allowances inside them are monthly and say so ("2,000 usage credits a month"). Credits are "2,000 cr" in facts and "2,000 credits" in prose. 1 credit = ₦1, stated once per screen where credits are bought.
- **Dates:** absolute, day month year — "24 Sep 2026" (`fmtDate()`). Countdowns are relative ("in 5 days", "5 days left"). Never show ISO strings or times unless the time matters.
- **Long text:** single-line identity (brand name in a pill, card title) truncates with an ellipsis and exposes the full text in `title`; body copy wraps; domains and emails wrap anywhere (`overflow-wrap: anywhere`) rather than overflowing. Nothing is ever clipped without an ellipsis.
- **Names:** the brand's display name everywhere; the slug only inside the domain. People get first-name-first as entered; "(you)" is appended to the signed-in user.
- **Statuses:** worded chips from the fixed vocabulary — Live, Provisioning, Paused, Free trial, Active, Inactive, Paid, Failed, Invited, Waiting for DNS. A new status is added to this list and mapped to a tone before it ships.
- **Images:** any image in a card sits at the top, 16:10, 14px radius, `object-fit: cover`, with a `--soft` placeholder and the same aspect ratio while loading or missing. Decorative images have empty alt; informative ones describe the content.
- **Counts** in titles are muted: "People with access · 2".
- **Copy voice:** second person, plain words, present tense. Say what something is for, not how it works ("Earned by your brand — spendable on your plan, credits or apps"). No apologies, no exclamation marks, no jargon (URL → web address). Errors say what went wrong and what to do next.

---

## 10. Interaction, motion & accessibility

- Hover styles exist only under `@media (hover: hover) and (pointer: fine)`. Touch devices get press feedback (`:active`) instead — cards scale to .985, controls darken for the duration of the tap.
- Transitions are 120–280ms on the `--ease` curve; everything respects `prefers-reduced-motion`.
- Focus is a 2px orange outline with 2px offset on every interactive element; keyboard users can reach the rail tooltips, menus, modals (Escape closes) and pagination.
- Icon-only controls carry `aria-label`; live status text uses `aria-live="polite"`; error cards are `role="alert"`; meters are `role="progressbar"` with values.
- Tap targets are ≥ 40px; row menus, copy buttons and pagination numbers are circles of at least 32px inside 40px hit areas.

---

## 11. Building a new screen

Follow this recipe and the screen will belong to the product.

1. **Route and nav.** Top-level brand page → add a nav item with an icon; sub-flow → back link to its parent, no nav item.
2. **Header.** `PageHeader` with title, one-line subtitle, and at most one secondary action (white pill). The primary, if any, lives in the content.
3. **Summary first.** If the screen answers a question ("how much?", "how many?"), open with stat or fact cards in a `grid-3`/`facts` row. Apply the needs-action tile rule if one figure is urgent.
4. **Content.** Choose the component by the data: entities with people → row list; records with columns → table in a flush card with pagination; things to pick between → plan-style cards; navigation targets → link cards.
5. **Toolbar** only if search or filters can change the result.
6. **Forms** in their own card with the submit as the card's primary; inline form for single-field edits.
7. **All four states** for every request, plus filter-empty and read-only.
8. **Actions** per the hierarchy table; destructive ones behind a menu and a modal; every success gets a toast.
9. **Check at 390px** that nothing scrolls sideways and every target is reachable with a thumb.

### Worked examples for screens that don't exist yet

- **Orders (a list of records):** `PageHeader` "Orders" with subtitle; three stat cards (Orders this month, Revenue, Awaiting fulfilment — peach tile only if orders are overdue); toolbar with search and a segmented All / Paid / Pending / Refunded; a flush-card table (Order, Customer, Date, Amount, Status) paginated at 10; row menu with "Copy order link" and, for pending, "Cancel order" behind a red modal. Empty: "No orders yet — they appear here the moment a customer checks out." with no button (the user can't create an order).
- **Notifications:** row list with a soft icon circle instead of an avatar, title + meta time ("Today, 14:20" is allowed here because the time matters), an "unread" dark dot chip; header action "Mark all as read" as a white pill; empty: "You're all caught up".
- **Domain detail (sub-flow):** back link to Settings, `PageHeader` with the hostname, fact cards (Status chip, Added, SSL), a card with the DNS records to copy (each row has a copy iconbtn and a toast), and a ghost "Remove domain" that opens a red modal.
- **Onboarding checklist on Overview:** a white card with a `rowlist` of steps, done steps with a good chip and a check, the next step with a `btn-primary btn-sm`; never a progress bar of a colour outside the tokens.

If a pattern you need isn't here, derive it from the nearest one above, keep the tokens, and add it to this document.
