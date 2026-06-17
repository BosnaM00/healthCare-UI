# MediConnect UI — Testing & Validation Guide

Validation guide for the UI modernization work (Steps 1–6). Scenarios are grounded
in this app's actual stack: React 19 + Vite 8 + Tailwind v4, a custom `useState`
router (`src/App.tsx`), Zustand stores, MSW API mocks, and four themes
(`light` / `dark` / `high-contrast` / `system`).

---

## 0. Current test infrastructure (honest baseline)

| Gate | Command | Status |
|------|---------|--------|
| Type check | `npx tsc --noEmit` | ✅ available (no npm script) |
| Lint | `npm run lint` | ✅ ESLint 10 |
| Production build | `npm run build` | ✅ `vite build` |
| Unit tests | — | ❌ **none installed** |
| Component tests | — | ❌ none |
| E2E tests | — | ❌ none |
| a11y automation | — | ❌ none |

**There is no automated test runner in the project today** — only `tsc`, ESLint,
and the Vite build. Everything below is therefore split into:
- **Manual scenarios** you can run now (no new deps).
- **Recommended automation** to add (§6), with install commands.

> Install note: this repo has a pre-existing peer conflict (`@casl/react@4` caps at
> React 18 while the app runs React 19). Any `npm install` must use
> `--legacy-peer-deps`, matching the existing resolution strategy.

---

## 1. Visual testing checklist

### 1a. Theme switching (Step 6)
Switch via **Topbar theme menu** and **Settings → Appearance**. Both must stay in sync.

| Scenario | Steps | Acceptance criteria |
|----------|-------|---------------------|
| Light | Pick "Light" | `<html>` has no `dark`/`high-contrast` class; `localStorage['mc-theme'] === 'light'`; page repaints light; selected row shows accent border + check |
| Dark | Pick "Dark" | `<html class="dark">`; stored `'dark'`; Topbar icon = moon |
| High contrast | Pick "High contrast" | `<html class="high-contrast">`; pure-white bg; Topbar icon = contrast |
| System | Pick "System" | stored `'system'`; class matches OS `prefers-color-scheme` |
| System live-follow | Set System, then flip OS appearance | App re-themes **without reload** (matchMedia listener) |
| Persistence | Choose a theme, hard-reload | Theme restored from `localStorage` on first paint (no flash of wrong theme) |
| Smooth transition | Toggle light↔dark | Colors fade (~200ms); **no layout shift**; instant under `prefers-reduced-motion` |

Run each theme across: Login, Patient Dashboard, Medic Dashboard, Medic Search,
Settings, a Dialog (e.g. account-deletion), and the Booking flow. Watch for
unreadable text, invisible borders, or hard-coded colors that don't adapt.

### 1b. Responsive breakpoints
Tailwind v4 defaults (the app uses `sm`, `md`, `lg`, `xl`):

| Width | Breakpoint | What to verify |
|-------|-----------|----------------|
| 375px | base (mobile) | Sidebar collapses to drawer; Settings nav becomes horizontal scroll strip; cards stack; no horizontal scroll |
| 640px | `sm` | Stat grids go 2-col; button rows reflow |
| 768px | `md` | Intermediate grid layouts |
| 1024px | `lg` | Sidebar becomes persistent rail; Settings nav becomes vertical sidebar; main content offsets (`lg:ml-60` / `lg:ml-16` collapsed) |
| 1280px | `xl` | Wide containers cap at max-width; content stays centered |

Acceptance: no clipped content, no overflow, tap targets reachable, drawer opens/closes.

### 1c. Animation smoothness (Step 5)
| Scenario | Acceptance criteria |
|----------|---------------------|
| Dialog open/close | Overlay fades, content zooms+slides in (via `tw-animate-css`) |
| Dropdown / tooltip / toast | Enter/exit animate per side; no "pop" |
| Page transition | Route change fades + slides up subtly (keyed by `route.id`) |
| Card hover | MedicCard lifts (`-translate-y-0.5`) + shadow, GPU-only |
| Button press | `active:scale-[0.98]` tactile feedback |
| Reduced motion | With `prefers-reduced-motion: reduce`, all of the above are effectively instant |

---

## 2. Functionality testing

Dev credentials (from the login screen): Patient `maria.popescu@example.com` /
`password`; Medic `dr.ionescu@clinic.ro` / `password`. API is mocked by MSW.

### 2a. Auth flows
- **Login** → valid creds route to the role's default dashboard (Patient→`dashboard`, Medic→`medic-dashboard`, Admin→`admin-disputes`, Clinic Manager→`clinic-dashboard`).
- **Login (invalid)** → error surfaced, no navigation.
- **Register / MFA / Password reset** → each screen reachable and "Back" returns to login.
- **Session persistence** → reload stays authenticated (auth persisted).
- **Logout** → returns to login; protected routes inaccessible.

### 2b. Role-based navigation (4 roles)
For each role, every Sidebar item routes somewhere valid and the active item is highlighted.
- **Acceptance:** no nav click lands on a blank screen.
- ⚠️ **Known gap (regression watch):** Sidebar paths `/bookings` and `/prescriptions`
  have **no case** in `navigate()` (`src/App.tsx`) and fall through to `defaultRoute()`.
  Either wire these routes or remove the nav entries.

### 2c. Core data flows
| Flow | Steps | Acceptance |
|------|-------|------------|
| Patient dashboard | Login as patient | Next-appointment hero, stats, upcoming/recent lists render from mock data; empty states show when no data |
| Medic search | Find a medic → type a query | Results filter; loading skeletons show while fetching |
| Booking | Open a medic profile → book | Slot selection → result screen |
| Medic dashboard | Login as medic | Today's schedule, metrics, earnings render |
| Consultation | Start/join a video consult | Join token fetched only when status is `IN_PROGRESS` |
| Settings (GDPR) | Privacy & GDPR | Consent toggles, data export, account-deletion dialog |

⚠️ **Known bug (regression watch):** `MedicSearchPage` debounce (`src/features/booking/components/MedicSearchPage.tsx:28`)
discards the `clearTimeout` cleanup, so each keystroke fires a separate query instead
of one debounced request. **Acceptance once fixed:** typing "cardio" fires exactly **one**
`/medics?q=` request 350ms after the last keystroke (verify in Network tab).

### 2d. Error & empty states
- Force a mock error (e.g. offline / 500) → ErrorBoundary or inline error renders, app doesn't white-screen.
- Empty lists → EmptyState component with a clear CTA.

---

## 3. Performance testing

### 3a. Bundle size (after route-level code-splitting)
| Asset | Raw | Gzip |
|-------|-----|------|
| JS — main/initial chunk (`index-*.js`) | ~511 kB | ~156 kB |
| JS — per-route chunks | split out | loaded on demand |
| CSS | ~68.5 kB | ~12.5 kB |

✅ **Done:** every page in `App.tsx` is now `React.lazy`-loaded behind `<Suspense>`
(LoginPage stays eager as the unauthenticated entry). Initial JS dropped from
**424 → 156 kB gzip** (target was < 250 kB gzip — met). The Daily.co video SDK
(~84 kB gz, in the consultation chunk) and `recharts` (in the `PatientDetailPage`
chunk, ~111 kB gz) only load when their route is visited.

> **Remaining note:** the main chunk still trips Vite's 500 kB *raw* warning
> (156 kB gzip is fine). Further wins available if needed: split `recharts` out of
> `PatientDetailPage` (lazy `VitalsChart` per-tab), and manual-chunk the React/Radix
> vendor core.

### 3b. Lighthouse audit
Run on a production build (`npm run build && npm run preview`), incognito, mobile preset.
**Targets:** Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95.
Capture for Login + one dashboard.

### 3c. Animation performance
- DevTools → Performance: record a dialog open and a page transition. **Acceptance:** no long tasks > 50ms; animations stay on the compositor (transform/opacity only — already the case).
- Rendering → "Paint flashing": hover a card should not repaint large regions.

---

## 4. Accessibility testing

### 4a. What's already implemented (verify these hold)
- Skip-to-content link (WCAG 2.4.1) in `AppShell` — visible on first Tab, jumps to `#main-content`.
- Keyboard activation on custom clickable rows (Enter **and** Space).
- Mobile drawer focus containment via `inert` on `<main>` when open; Escape closes the drawer.
- `:focus-visible` rings on interactive elements.
- `prefers-reduced-motion` honored globally.
- High-contrast theme available.
- Icon-only controls have `aria-label`; decorative icons use `aria-hidden`.

### 4b. Automated scans
- **axe DevTools** / **WAVE** browser extension on: Login, Patient Dashboard, Medic Search, Settings, an open Dialog. **Acceptance:** zero critical violations; review "needs review" items.

### 4c. Keyboard navigation (no mouse)
| Scenario | Acceptance |
|----------|------------|
| Tab order | Logical top→bottom; skip link first |
| Sidebar drawer (mobile) | Opens via menu button; Escape closes; focus trapped while open |
| Dialogs | Focus moves in on open, returns to trigger on close; Escape closes |
| Theme menu / dropdowns | Arrow keys navigate, Enter selects, Escape closes |
| Forms | Every field reachable + labeled; submit via Enter |
| Booking rows / cards | Enter and Space both activate |

### 4d. Screen reader (VoiceOver ⌘+F5 / NVDA)
- Headings announce a sensible outline; landmarks (`main`, `nav`) present.
- Buttons announce purpose (not "button"); theme options announce selected state (`aria-pressed`).
- Live regions: toasts/errors are announced.

### 4e. Contrast
- Verify text/background pairs meet WCAG AA (4.5:1 body, 3:1 large) in **all four themes**.
- Pay attention to `--color-text-tertiary` and muted text on `--color-surface-raised`
  (flagged for verification in earlier steps).

---

## 5. Cross-browser
Smoke the golden path (login → dashboard → theme toggle → one flow) in **Chrome, Safari, Firefox**, plus one mobile browser (iOS Safari). Watch for OKLCH color rendering and `inert` support (baseline in all modern browsers).

---

## 6. Recommended automation to add

None of this exists yet; install with `--legacy-peer-deps`.

```bash
# Unit + component tests
npm i -D vitest @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom jsdom jest-axe --legacy-peer-deps

# E2E + a11y
npm i -D @playwright/test @axe-core/playwright --legacy-peer-deps
npx playwright install
```

Suggested first targets (highest value / lowest effort):
1. **`theme.store` unit test** — `setTheme` toggles the `<html>` class, persists to
   `localStorage`, and `system` resolves via `matchMedia`. Pure logic, fast, guards Step 6.
2. **MedicSearch debounce test** — assert exactly one query fires after rapid input
   (locks in the §2c fix and prevents regression).
3. **Playwright golden-path** — login → dashboard → switch theme → assert `<html>` class.
4. **jest-axe** on a few rendered components — zero violations.

Add scripts:
```jsonc
// package.json
"test": "vitest",
"test:e2e": "playwright test",
"typecheck": "tsc --noEmit"
```

---

## 7. Pre-release smoke checklist (copy per release)

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds
- [ ] All 4 themes render correctly on Login + one dashboard
- [ ] Mobile (375px) + desktop (1280px) layouts verified
- [ ] Login works for all 4 roles → correct default dashboard
- [ ] No nav item lands on a blank screen (incl. `/bookings`, `/prescriptions`)
- [ ] Search fires one debounced request
- [ ] Skip link + keyboard nav + Escape-to-close verified
- [ ] axe scan: zero critical violations
- [ ] No console errors on the golden path

---

## 8. Known issues tracker (from Steps 1–6)

| Issue | Location | Priority | Status |
|-------|----------|----------|--------|
| Search debounce fires N queries instead of 1 | `MedicSearchPage.tsx` | High | ✅ Fixed (one debounced query, verified via network) |
| Dead nav routes `/bookings`, `/prescriptions` | `Sidebar.tsx` | Medium | ✅ Fixed (removed links — no destination pages exist) |
| Dead imports (`ToggleLeft`, `ToggleRight`, `ChevronRight`) | `SettingsPage.tsx` | Low | ✅ Fixed (removed) |
| `--color-text-tertiary` contrast unverified | `tokens.css` | Medium | ✅ Fixed (light 58%→54%, dark 60%→63% for WCAG AA; verified by OKLCH→sRGB ratio math) |
| JS bundle > 500 kB (no code-splitting) | build | Medium | ✅ Fixed (route-level `React.lazy` in `App.tsx`; initial JS 424→156 kB gzip; Daily.co SDK + recharts now lazy) |
| Custom router instead of installed TanStack Router | `App.tsx` | Low | ⬜ Deferred |
