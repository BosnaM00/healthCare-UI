# MediConnect UI Modernization — Implementation Roadmap

> **Status:** The modernization in `HEALTHCARE_UI_MODERNIZATION_PROMPT.md` (Steps 1–6)
> is **already implemented** on this branch. This roadmap is therefore in two parts:
> a **retrospective** of what shipped (Phases 1–4), and a **forward plan** for the
> remaining backlog (hardening, performance, automation, docs) — the work that
> actually remains.

---

## Part A — What shipped (Phases 1–4, ✅ done)

| Phase | Scope | Where | Status |
|-------|-------|-------|--------|
| **1. Design system & tokens** | OKLCH token palette, spacing/typography/motion tokens, 3 themes + `system`, Tailwind v4 `@theme` registration | `src/styles/tokens.css` | ✅ |
| **2. Core components** | Button (variants, loading, press feedback), Badge, Dialog, Dropdown, Toast, Select, Tooltip, Avatar, Switch, Input, Skeleton | `src/components/ui/*` | ✅ |
| **3. Page layouts** | `AppShell`, `Topbar`, `Sidebar`, reusable `PageContainer` / `PageHeader` / `EmptyState`; consistent padding across dashboards & settings | `src/components/layout/*` | ✅ |
| **4. Advanced features** | Dark / high-contrast / system themes with live OS-follow + persistence; enter/exit animations (`tw-animate-css`); page transitions; card/button micro-interactions; reduced-motion + a11y (skip link, keyboard activation, `inert` focus trap) | Steps 5–6 | ✅ |

These map to the document's Steps 1 (audit) → 6 (theme). See
`TESTING_VALIDATION_GUIDE.md` for how to validate each.

---

## Part B — Remaining backlog (the real forward plan)

Sourced from the Steps 1–6 known-issues tracker plus the test-infrastructure gap.

### B1. Priority matrix (impact × effort)

```
            LOW EFFORT                      HIGH EFFORT
         ┌──────────────────────────┬──────────────────────────┐
  HIGH   │ • Fix search debounce    │ • Route code-splitting    │
 IMPACT  │   (1 query not N)        │   (React.lazy + lazy      │
         │ • Wire/remove dead nav   │   Daily.co SDK)           │
         │   (/bookings,            │ • E2E + a11y automation   │
         │    /prescriptions)       │   (Playwright + axe)      │
         ├──────────────────────────┼──────────────────────────┤
  LOW    │ • Remove dead imports    │ • Migrate custom router → │
 IMPACT  │   (SettingsPage)         │   TanStack Router         │
         │ • Verify text-tertiary   │   (already installed,     │
         │   contrast (AA)          │    unused)                │
         └──────────────────────────┴──────────────────────────┘
```

**Do first:** the high-impact / low-effort quadrant (top-left). **Defer:** router
migration unless deep-linking/SSR becomes a requirement — it's a large refactor with
broad blast radius and no user-facing payoff today.

### B2. Backlog detail

| # | Item | Effort | Risk | Dependencies |
|---|------|--------|------|--------------|
| 1 | ✅ **Done** — `MedicSearchPage` debounce now fires one query (useEffect pattern), verified via network | XS | Low | none |
| 2 | ✅ **Done** — removed dead nav links `My Bookings`/`Prescriptions` (no destination pages exist; re-add when built) | S | Low | — |
| 3 | ✅ **Done** — removed dead imports in `SettingsPage` | XS | None | none |
| 4 | ✅ **Done** — audited `--color-text-tertiary` + muted text (AA) across all 4 themes via OKLCH→sRGB math; darkened light 58%→54% and lightened dark 60%→63% to pass AA; disabled text left exempt | S | Low | none |
| 5 | Stand up test runner: Vitest + RTL + jest-axe (unit/component) | M | Low | `--legacy-peer-deps` install |
| 6 | First tests: `theme.store`, search debounce, a few jest-axe component checks | M | Low | #5 |
| 7 | ✅ **Done** — route-level `React.lazy` + `<Suspense>` for every page in `App.tsx`; Daily.co SDK + recharts now lazy; initial JS 424→156 kB gzip; smoke-tested patient routes (dashboard/search/settings) in-browser, no console errors | M | Med | smoke each role's routes after splitting |
| 8 | Playwright golden-path + `@axe-core/playwright` in CI | L | Med | #5 patterns |
| 9 | (Deferred) TanStack Router migration | XL | High | only if deep-linking/SSR needed |

> **Risk note:** items 7–9 touch routing/loading and have the widest blast radius —
> gate them behind the smoke checklist in `TESTING_VALIDATION_GUIDE.md §7` and ship
> them on their own branches, separately from the bug fixes (1–4).

---

## Part C — Deployment strategy

### C1. Feature flags (use the existing convention)
This project already gates risky work with **build-time Vite env flags** — e.g.
`.env.example` has `VITE_FEATURE_STRIPE=true` ("set to false in production until QA
sign-off"). Reuse this pattern rather than adding a flag SaaS:

- New, risky UI lands behind `VITE_FEATURE_*` and ships **off** in prod until QA signs off.
- Flip to `true` in the production env once validated; redeploy.
- **Caveat:** these are *build-time*, not runtime — flipping a flag requires a rebuild
  + redeploy, so there's no instant kill-switch. If true runtime toggles or
  percentage rollouts become a hard requirement, that's the trigger to adopt a
  runtime flag service (out of scope today).

### C2. Rollout approach for the backlog
- **Bug fixes (B2 #1–4):** low risk, ship directly to `main` after the smoke checklist — no flag needed.
- **Code-splitting (#7):** ship on its own branch; verify every role's routes load (lazy boundaries can break navigation); no flag, but isolated PR.
- **Test automation (#5–6, #8):** dev-only, no production surface — merge freely.

### C3. A/B testing
No A/B infrastructure exists in the app today. Given this is a clinical tool (not a
growth-optimized funnel), A/B testing the UI is **not recommended** — consistency and
correctness matter more than conversion experiments. If specific flows ever need it,
introduce it per-flow behind the flag convention above.

### C4. Rollback plan
- Frontend is a static SPA build. **Rollback = redeploy the previous build artifact**
  (or `git revert` the merge + rebuild). Keep the last known-good build artifact retained.
- Because flags are build-time, the fastest mitigation for a bad feature is: set its
  `VITE_FEATURE_*` to `false`, rebuild, redeploy.
- Theme/token changes are CSS-only and fully reversible by reverting `tokens.css`.

---

## Part D — Documentation deliverables

| Doc | Audience | Content | Status |
|-----|----------|---------|--------|
| **Design tokens reference** | Devs/Design | Enumerate the OKLCH palette, spacing, radius, shadow, motion tokens from `tokens.css`; show light/dark/high-contrast values; "always use `var(--color-*)`, never hex" | ⬜ TODO |
| **Component usage guide** | Devs | Props + variants for `src/components/ui/*` (Button, Dialog, Toast, Select, …) with copy-paste examples; consider Storybook | ⬜ TODO |
| **Layout patterns** | Devs | When to use `PageContainer` / `PageHeader` / `EmptyState`; the `AppShell` contract; responsive breakpoint conventions | ⬜ TODO |
| **Theming guide** | Devs | How `theme.store` works (4 themes, `system` resolution, localStorage `mc-theme`); how to add a theme; reduced-motion rules | ⬜ TODO |
| **Testing & validation** | All | — | ✅ `TESTING_VALIDATION_GUIDE.md` |
| **This roadmap** | Leads | — | ✅ |

> A migration guide "from old components" is **not applicable** — the modernization was
> done in-place on the existing components, so there is no legacy/new split to migrate
> between. The relevant onboarding artifact is the component usage guide above.

---

## Part E — Suggested schedule (remaining work)

Sized in relative effort, not calendar promises. Sequence by the priority matrix.

**Sprint 1 — Stabilize (high-impact/low-effort)**
- B2 #1 search debounce, #2 dead nav, #3 dead imports, #4 contrast audit
- Stand up Vitest (#5) and write the first 3 tests (#6)
- Exit criteria: smoke checklist green; CI runs `tsc` + `lint` + `vitest`

**Sprint 2 — Performance**
- Route code-splitting + lazy video SDK (#7); target initial JS < 250 kB gzip
- Re-run Lighthouse; confirm targets (Perf ≥ 85, A11y ≥ 95)

**Sprint 3 — Confidence & docs**
- Playwright golden-path + axe in CI (#8)
- Write the four TODO docs in Part D (or scaffold Storybook)

**Backlog / on-demand**
- TanStack Router migration (#9) — only if deep-linking/SSR is required.
