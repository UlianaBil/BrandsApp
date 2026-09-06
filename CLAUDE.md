# BrandsApp dashboard (Dashboard branch)

Front-end prototype of the BrandsApp platform dashboard on a mock API (`src/mock.ts`). Deployed to Vercel project `brands-app` (production alias https://brands-app-nine.vercel.app).

## Standing rules

- **`Dashboard-Design-Rules.md` is the source of truth.** Any change to design or logic — component, rule, state, status, threshold, copy pattern, default — must update that document in the same commit (see its §12). New screens or features also get an entry in `Dashboard-Audit.md`.
- The web version of the rules is generated from the markdown (`mkrules.py` in the working scratchpad, or re-create an equivalent) and republished to the same artifact URL; never hand-edit the HTML.
- Demo data must cover every state the rules describe (§12). If you add a state, add a brand or record that shows it.
- After every change: `npm run build`, commit, push to `Dashboard`, then `npx --yes vercel@latest --prod --yes --scope ulianabils-projects`. A push alone does not deploy.
- Compose screens from `src/ui.tsx` primitives and `src/styles.css` tokens. Do not add hues, libraries or icon sets.
- The tenant repo `AdejamTechnologies/brandsapp-multitenant` is reference only: read it, never modify it.
