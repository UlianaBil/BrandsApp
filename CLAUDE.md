# BrandsApp dashboard (Dashboard branch)

Front-end prototype of the BrandsApp platform dashboard on a mock API (`src/mock.ts`). Deployed to Vercel project `brands-app` (production alias https://brands-app-nine.vercel.app).

## Standing rules

- **`Dashboard-Design-Rules.md` is the source of truth.** Any change to design or logic — component, rule, state, status, threshold, copy pattern, default — must update that document in the same commit (see its §12). New screens or features also get an entry in `Dashboard-Audit.md`.
- The web version of the rules is generated from the markdown (`mkrules.py` in the working scratchpad, or re-create an equivalent) and republished to the same artifact URL; never hand-edit the HTML.
- Demo data must cover every state the rules describe (§12). If you add a state, add a brand or record that shows it.
- **This project uses pnpm** (`pnpm install`, `pnpm build`). It was npm until the shadcn conversion; `pnpm-lock.yaml` is the lockfile and `package-lock.json` is gone.
- After every change: `pnpm build`, commit, push to `Dashboard`, then `npx --yes vercel@latest --prod --yes --scope ulianabils-projects`. A push alone does not deploy.
- **Screens are built from `src/ui/primitives.tsx` and `src/ui/controls.tsx`** — shadcn-style components on Tailwind, not the hand-written classes in `src/styles.css`. Those two files are a COPY of the platform's (`apps/web/src/components/v2/` in brandsapp-main-repo) and must stay byte-identical apart from where `cn` is imported; the platform has `pnpm check:design-sync` to verify it. Change them there, not here, or the two drift.
- `src/styles.css` is still loaded, but into a `legacy` cascade layer (see `src/tailwind.css`) so Tailwind wins. It only styles what is not converted yet — `Icon`, `useAsync`, `DemoPanel` and `ToastProvider` in `src/ui.tsx`.
- Compose screens from `src/ui.tsx` primitives and `src/styles.css` tokens. Do not add hues, libraries or icon sets.
- The tenant repo `AdejamTechnologies/brandsapp-multitenant` is reference only: read it, never modify it.
