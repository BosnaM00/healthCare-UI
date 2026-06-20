# MediConnect — Phase 1 & Phase 2 Gap Analysis

**Branch reviewed:** `feature/improvements-3`
**Reference document:** `MediConnect_UI_Architecture.docx`
**Date:** 2026-04-26

The branch ships a respectable Phase 1/2 skeleton (auth stubs, booking flow, consultation workspace, dispute & admin pages, settings) but a large number of items from the architecture document’s Phase 1 (Weeks 1–6) and Phase 2 (Weeks 7–10) checklists are either missing entirely or implemented as visual placeholders with no real wiring. Items below are grouped by area; each item cites the section of the architecture doc it comes from.

---

## 1. Phase 1 — Tooling, CI & Quality Gates (Week 1–2)

The doc says: *“Storybook + Chromatic + axe + Playwright + MSW set up. CI gates on a11y + visual regression from PR #1.”* (§8 Phase 1, also §6.5 “jest-axe on every component PR from day one”).

Only **MSW** is present.

| Tool | Doc requirement | Status |
|---|---|---|
| Storybook | Every component documented, used as design-system home (§4 Component governance) | **Missing** — no `.storybook/`, no `*.stories.tsx`, no dependency in `package.json` |
| Chromatic | Visual regression in CI (§4 Component governance) | **Missing** |
| axe-core / jest-axe | A11y test on every component PR (§2.2, §6.5) | **Missing** |
| eslint-plugin-jsx-a11y | Lint-time a11y gate (§2.2) | **Missing** |
| Playwright | E2E for screens (§3.5, §8 Phase 4) — Phase 1 says set up | **Missing** |
| Vitest + Testing Library | Unit/component testing (§2.2) | **Missing** — `package.json` has no test runner at all, no `test` script |
| Lighthouse CI | Performance budget enforcement (§7.1) | **Missing** |
| Sentry | Error reporting (§3.4, §8 Phase 4) | **Missing** |

There is no `test/` directory, no `msw/handlers per feature` factory layout (`@faker-js`, `test/factories/`) as specified in §3.1.

---

## 2. Phase 1 — Authentication (Week 1–2)

The doc (§3.3, §2.3) is explicit about how auth should be wired:

| Requirement (doc) | Status |
|---|---|
| **OIDC PKCE flow against Keycloak** via `oidc-client-ts` | **Missing.** `oidc-client-ts` and `react-oidc-context` are listed in `package.json` but never imported anywhere. `LoginPage` calls a stub `useLogin` mutation that just sets a fake user in Zustand. |
| **Access token in memory; refresh token in HttpOnly cookie** | **Violated.** Token is persisted to `localStorage` in `auth.store.ts` — directly contradicts the doc and §3.3. Patient PII risk. |
| **Silent refresh** (60 s before expiry, hidden iframe) | **Missing** |
| **Front-channel logout** + full page redirect to clear React tree | **Missing** — `clearAuth()` is a Zustand reset, no redirect, no token revocation |
| Real **MFA enrollment** (QR code / TOTP) | **Missing.** `MfaPage` accepts any 6-digit OTP via mock; `SettingsPage > Security` shows a static “Enable 2FA” button with no flow behind it |
| Password reset with **strength meter** + Romanian-pattern denylist (§5.7) | **Missing.** `PasswordResetPage` is a basic form |
| **Session timeout: 10-min idle warning at 9:00, hard logout at 10:00, PII blur on warning** (§3.3, §6.2) | **Missing entirely.** No idle detector, no countdown banner, no PII blur layer |

---

## 3. Phase 1 — Routing, App Shell, Folder Structure

| Requirement (doc) | Status |
|---|---|
| **TanStack Router file-based, type-safe** (§2.2, §3.2) | **Missing.** `@tanstack/react-router` is listed in `package.json` but not used. `App.tsx` is a hand-rolled `useState<Route>` switch statement. Loses type-safe params, route-level code-splitting, and pending/error boundary wiring (which the doc explicitly couples to TanStack Query in §3.4). |
| **Code-split per route** (§7.2) | **Missing.** No dynamic `import()`; everything is statically imported at the top of `App.tsx`. |
| Route map from §3.2 — many specified routes are not implemented | **Partial.** Missing: `/(patient)/history` (consultation timeline), `/(medic)/schedule` (medic-side availability), `/(admin)/config` (fees, specialties, platform settings), `/(support)/` (read-only support agent role) |
| **Folder structure** per §3.1 (`src/app/`, `src/shared/`, `src/design-system/`, `src/i18n/`, `src/test/`) | **Different.** Branch uses `src/components`, `src/features`, `src/lib`, `src/styles`, `src/stores`, `src/mocks`. None of `app/`, `shared/`, `design-system/`, `i18n/`, `test/` exist. |
| **Skip-link to `#main`** (§6.4) | **Missing** |
| **Landmarks**: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` everywhere (§6.4) | **Partial.** Topbar has `role="banner"`, AppShell uses `<main>`, but `<footer>` is not rendered anywhere — no `Footer` component exists |
| **Breadcrumbs** (§4.1) | **Missing** — no Breadcrumbs component |
| **RightRail 320 px contextual panel** (§4.1, used on `/(medic)/patients/$id`) | **Missing** |
| **Footer** with GDPR notice / support link / version stamp (§4.1) | **Missing** |
| **Lang attributes** `lang="ro"` on root, `lang="en"` on switched islands (§6.1) | **Missing** |
| **Reduced-motion root hook** (`useReducedMotion`) (§1.6) | **Missing** — `tokens.css` has the `@media (prefers-reduced-motion)` block but no root JS hook |

---

## 4. Phase 1 — Component Library (Week 3–4)

The doc lists 43 named components (§4). Multiple Phase-1 named components are absent.

### 4.1 Forms & Inputs (§4.4)

| Component | Status |
|---|---|
| `Combobox` (async with TanStack Query, used for medic/clinic/patient search) | **Missing** |
| `IcdAutocomplete` (ICD-10 dictionary, code + RO description) | **Missing.** `PrescriptionCard` has a plain `Input` placeholder “ICD-10 code or description” — no real autocomplete |
| `MedicationAutocomplete` (Romanian Nomenclator, inline interaction warnings) | **Missing.** Plain `Input` |
| `DatePicker` (Radix Popover + react-day-picker, RO locale, Mon-start, EET/EEST safe) | **Missing.** No `react-day-picker` dependency |
| `DateTimePicker` (combined date + 30-min slot) | **Missing** |
| `FileUpload` (drag-drop, type/size validation, **EXIF stripping**, **resumable via tus.io**) | **Missing entirely**, including the EXIF-stripping requirement that the doc calls out as a privacy concern in §2.3 |
| `DosageInput` (numeric + unit + frequency, validates against drug max-daily-dose) | **Missing.** `PrescriptionCard` uses three loose inputs without validation |
| `SignaturePad` (canvas-based, SVG output) for prescription signing | **Missing** |
| `ConsentCheckbox` (full GDPR text inline, **scroll-to-bottom required before checkable**) | **Missing.** `BookingSheet` uses a plain checkbox — no scroll-gated consent. This is explicitly called out as a GDPR requirement in §4.4. |
| `FormField` | Present ✓ |
| `Input`, `Select`, `Textarea` | Present ✓ |

### 4.2 Data Display (§4.3)

| Component | Status |
|---|---|
| `MetricCard` (label, value, delta with trend arrow, sparkline) | **Missing as a shared component.** Inline divs are repeated in `MedicDashboard`, `ClinicManagerDashboard`, etc. |
| `PatientCard` | **Missing** |
| `MedicCard` | Present ✓ |
| `DataTable` with virtualization | Present ✓ but `virtualize` defaults to `false`; doc requires virtualized at 100+ rows |
| `Timeline` (audit-trail, consultation-log) | Partially present (`PatientTimeline`); no shared generic `Timeline` |
| `StatusBadge` (~20 known states) | **Missing.** `Badge` exists but no domain-specific status mapping |
| `KeyValueGrid` | **Missing** |
| `PageStats` | **Missing** |

### 4.3 Feedback (§4.5)

| Component | Status |
|---|---|
| `Toast` (Sonner-based) | Custom `toast.tsx` + `toaster.tsx` — but **not Sonner**, and no polite/assertive split per the doc |
| `Skeleton` | Present ✓ |
| `EmptyState` | Present ✓ |
| `ErrorBoundary` (per-route, Sentry, Reload + Report buttons) | Partially. `ErrorBoundary` exists but no Sentry integration, no Report button |
| `InlineAlert` (in-flow info/warning/error) | **Missing** as a component — used inline in pages |
| `LoadingButton` (spinner replaces label, no layout shift) | **Missing.** `Button` does not have a loading variant |
| `ProgressIndicator` (determinate + indeterminate) | **Missing** |

### 4.4 Modals & Overlays (§4.7)

| Component | Status |
|---|---|
| `Sheet` (shared side drawer primitive) | **Missing.** `BookingSheet` is a hand-rolled fixed-position div, not built on a shared `Sheet`. No `@radix-ui/react-dialog`-backed `Sheet` primitive exists for reuse. |
| `Drawer` (bottom sheet on mobile, replaces Dialog at `sm`) | **Missing.** Doc mandates this responsive behaviour. |
| `Popover` (rich content) | Radix dep installed; **no `popover.tsx` shared component** in `components/ui/` |
| `ConfirmDialog` (red CTA, **typing confirmation for irreversible actions**) | **Missing.** Account deletion in `SettingsPage` does not require typing “DELETE” — explicitly contradicts §4.7. |

### 4.5 Charts & Visualization (§4.6)

| Component | Status |
|---|---|
| `VitalsChart` | Present ✓ — has severity bands and `<table className="sr-only">` mirror as required |
| `BookingHeatmap` | **Missing** (used in clinic reporting; clinic dashboard exists) |
| `AppointmentCalendar` (drag-to-create, keyboard-navigable) | **Missing.** `MedicCard`/`MedicProfilePage` show a flat slot list. The medic-side **drag-to-create availability block** flow from §5.4 is entirely absent. |
| `RevenueChart`, `FunnelChart` | Phase 3, not required here |

---

## 5. Phase 1 — Booking Flow (Week 5–6)

| Requirement (doc) | Status |
|---|---|
| **Stripe Elements** card form inside `BookingSheet` (§5.4, §5.7) | **Not integrated.** `BookingSheet` literally renders the placeholder text *“Stripe Elements will render here when payment service is integrated.”* No `@stripe/stripe-js` or `@stripe/react-stripe-js` dependency. |
| **3DS challenge handled inline** by Stripe Elements (§5.4) | **Missing** (no Stripe at all) |
| **Race condition handling**: slot reserved by another patient mid-flow → “Sorry, just taken — here are 3 nearby slots” (§5.4) | **Missing** — no fallback UI |
| **DST transition**: always show timezone label (§5.4) | **Missing.** `BookingSheet` uses `toLocaleDateString('en-GB', …)` — wrong locale (should be `ro-RO`) and no Europe/Bucharest TZ rendering. `date-fns-tz` is installed but never imported. |
| **Cancellation policy must scroll-and-acknowledge** (§4.4 ConsentCheckbox, §5.4) | **Violated** — plain checkbox |
| **“Secured by Stripe” badge** + lock icon next to URL-domain microcopy in topbar (§5.7) | **Missing** |

---

## 6. Phase 2 — Daily.co Video & Consultation Workspace (§5, §8 Phase 2)

The doc says: *“VideoConsoleStrip + NoteEditor + PrescriptionCard inside MedicConsultationWorkspace … Daily.co integration with prebuilt UI; webhook events drive call-duration tracking.”*

| Requirement | Status |
|---|---|
| **`@daily-co/daily-react` + Daily.co Prebuilt** (§2.2 confirmed stack) | **Missing.** No Daily SDK dependency. `MedicConsultationWorkspace` uses a raw `<iframe src="https://mediconnect.daily.co/...">` — that is not Daily.co Prebuilt and gives up encryption-status, recording, and bandwidth-adaption hooks the doc cites as Phase-2 deliverables. |
| **Video controls actually wired to Daily** (mute/cam/screen-share/end) | **Missing.** `VideoConsoleStrip` is purely visual — `setMicMuted`/`setVideoOff` only toggle local state |
| **Webhook events drive call-duration tracking** | **Missing.** `durationSeconds` is a prop with no source |
| **Reconnection toast on transient drop** (§7.6) | **Missing** |
| **NoteEditor: encrypts on submit (AES-256 via Web Crypto)** (§4.8) | **Missing.** `NoteEditor` saves cleartext via `useSaveNote`. The Web Crypto step is explicitly required for GDPR Art. 9 data. |
| NoteEditor: auto-save every 8 s, draft recovery on reload | Auto-save present; **draft recovery on reload missing** (no localStorage/indexedDB persistence) |
| NoteEditor templates (SOAP, Follow-up) | Present ✓ |
| **`VerificationStatus` pill** with Colegiul Medicilor logo when verified (§4.8) | **Missing** as a component (only a `type` alias in `types/index.ts`) |
| **`DisputeBanner`** persistent in-page banner on a disputed consultation (§4.8) | **Missing** |
| **`StripeStatusBadge`** mapping `payment_status` → coloured pill (§4.8) | **Missing** |

---

## 7. Phase 2 — Patient Detail Page (Medic View) (§5.3)

The patient-detail page exists but several explicit deliverables are absent:

| Requirement | Status |
|---|---|
| Allergies in **red `InlineAlert`** at the top of the left rail | **Missing** (no `InlineAlert` component exists) |
| **Documents tab with grid + preview Sheet** | Tab exists; no actual grid + preview Sheet |
| **`useAuditLogger` hook called in `useEffect` on every tab change** (§5.3, §6.2, Appendix C) | **Missing.** No `useAuditLogger` hook exists anywhere in the codebase, despite being part of the audit-compliance contract specified in Appendix C. |
| `LabResultsTable` (result · value · unit · reference range · severity, sortable) (§4.8) | **Missing** |
| **Print summary** action wired to a printable view with watermark | **Missing** |

---

## 8. Phase 2 — Admin & Audit (§5, §8 Phase 2)

| Requirement | Status |
|---|---|
| Audit log **virtualized DataTable with full-text search** (§5.3, §6.2) | Partial. `AuditLogViewer` exists but `DataTable` is used without `virtualize` enabled |
| **`/(admin)/config`** route — fees, specialties, platform settings (§3.2) | **Missing entirely** |
| **`/(support)/`** read-only support-agent role (§3.2) | **Missing entirely** |
| Admin user management — change role, deactivate ✓ | Present (mutations exist) ✓ |
| Dispute filing flow + dispute queue ✓ | Present ✓ |

---

## 9. Phase 2 — GDPR / Settings (§5.6)

| Requirement | Status |
|---|---|
| `GdprConsentManager` with last-updated timestamp + revoke control | Present in `SettingsPage` ✓ |
| “Export my data” → queues PDF + JSON download | Mutation stub only — no PDF/JSON download UX |
| “Delete my account” **multi-step destructive flow with email confirmation** | **Partial.** Single dialog with reason text — no email confirmation step, no typed “DELETE” confirmation gate (§4.7 ConfirmDialog) |
| **2FA enrolment flow** (QR + recovery codes) | **Missing.** Section shows static “Not enabled / Enable 2FA” button with no flow |
| **Active sessions list with revoke per session, last login locations** | Static demo array, no real API |
| **Notifications: granular toggles per event × channel** | Present ✓ |

---

## 10. Cross-cutting Compliance & UX (§6, applies to Phase 1 and Phase 2)

These are explicit Phase-1/2 commitments in the doc that are not in the branch:

| Requirement | Status |
|---|---|
| **PII masking by default** (e.g., “Maria P.”) on patient lists | **Inconsistent.** `maskName`/`maskPhone` utilities exist in `lib/utils.ts` but are not applied on patient lists in `MedicDashboard` or `ClinicManagerDashboard` |
| **CNP (Romanian national ID) always masked except on own profile** | **Missing.** No CNP handling at all |
| **Print/screenshot watermarks** on prescription/consultation summary (viewer email + timestamp) | **Missing** — `PrescriptionCard` calls `window.print()` directly |
| **Clipboard hygiene**: PII auto-clears from JS after 60 s | **Missing** |
| **Anti-phishing**: signed one-time tokens for password-reset, IP/UA-bound | **Missing** |
| **`autocomplete="off"` + name randomisation** on sensitive inputs | **Missing** |
| **i18n (Romanian primary, English Phase 2)** | **Effectively missing.** `i18next`/`react-i18next` are in `package.json`, but: no `src/i18n/ro/` or `src/i18n/en/` folders exist, no `t()` calls anywhere in feature code, all UI strings are hardcoded English. The Topbar lacks the RO/EN language switcher specified in §4.1. The doc’s Phase-1 routing of UI through `i18next` is therefore not in place. |
| **Service Worker (workbox) for app-shell + asset caching** (§7.4) | **Missing** — no `workbox` dep, no `service-worker.ts` |
| **Offline indicator + queued mutations on reconnect** (§7.6) | **Missing** |
| **`prefers-reduced-motion` JS hook at root** (§1.6, §6.1) | **Missing** (CSS-only) |
| **Color-contrast verification script in CI** (§6.5) | **Missing** |
| **CSP / XSS sweep / CSRF** (§8 Phase 4 — but headers should be set from Phase 1) | **Missing** — no `meta http-equiv="Content-Security-Policy"`, no helmet equivalent |

---

## 11. State / API Layer Gaps

| Requirement (doc) | Status |
|---|---|
| **One typed API client per bounded context, Zod-parsed responses** (§3.4) | **Partially violated.** The single `api` client in `lib/api-client.ts` is generic; calls in hooks use `api.get<T>()` with **no Zod parsing of the response**. The doc’s example explicitly does `BookingSchema.parse(res)` for the same reason MSW + Zod must enforce contract drift. |
| **RFC 7807 problem-detail envelope mapping → toasts** (§3.4) | Partial. `ApiError` carries the envelope; no toast mapping in QueryClient `onError`. |
| **401 → silent refresh once, then redirect**; **403 → in-page state, never toast** (§3.4) | **Violated.** `api-client.ts` does an immediate `window.location.href = '/auth/login'` on 401 with no refresh attempt; 403 is treated identically to other errors. |
| **Permission `Ability` rebuilt from backend-driven permission set** (§2.3) | **Partially violated.** `defineAbilityFor(role)` hardcodes role→ability mapping; doc mandates backend returns the granular permission list (e.g., `BOOKING_CANCEL_OWN`) and the frontend mirrors it exactly to keep audit log clean. |
| **CASL `<Can I="cancel" a={booking}>`** subject-instance gating | **Missing.** Code uses role checks; the `<Can>` wrapper is exported but never used in feature code. |
| **SSE for online-presence / instant-consultation** (§2.3) | **Missing** (Phase 3 surface, but the wiring should exist; no `EventSource` anywhere) |

---

## 12. Component Governance (§4 callout)

The doc is unambiguous: *“Every component above lives in Storybook with: (1) all variants documented, (2) axe-core run automatically, (3) visual regression snapshot via Chromatic, (4) usage example.”*

None of (1)–(4) is in place. This is the single biggest deviation from Phase 1 and is a hard precondition the doc warns about: *“Do not let pressure to ship a ‘first feature’ in Week 2 erode the Week 1–2 token work.”*

---

## Summary — High-priority items missing

If I had to triage the gaps before declaring Phase 1+2 “done”:

1. **OIDC/Keycloak wiring + token-in-memory + session-timeout** — security baseline.
2. **Stripe Elements integration** — Phase 1 booking flow is non-functional without it.
3. **Daily.co SDK + working video controls + webhook duration tracking** — core of Phase 2.
4. **`useAuditLogger` hook + audit calls on every medical-data read** — Appendix C, GDPR Art. 9.
5. **`NoteEditor` AES-256 encryption via Web Crypto** — explicit GDPR requirement.
6. **TanStack Router + route-level code splitting** — perf budget in §7.1 will fail without it.
7. **Storybook + axe + Playwright + Vitest set up with CI gates** — every later quality claim depends on these.
8. **i18n (RO primary)** — product is for Romanian patients; no Romanian copy ships today.
9. **Missing form primitives**: `Combobox`, `DatePicker`, `FileUpload` (with EXIF strip), `ConsentCheckbox` (scroll-gated), `SignaturePad`, `DosageInput`, `IcdAutocomplete`, `MedicationAutocomplete`.
10. **Missing healthcare components**: `LabResultsTable`, `AppointmentCalendar` (drag-to-create), `VerificationStatus`, `DisputeBanner`, `StripeStatusBadge`, `ConfirmDialog` (with typed confirmation), `Sheet`/`Drawer`/`Popover` shared primitives, `MetricCard`, `StatusBadge`, `KeyValueGrid`, `InlineAlert`, `LoadingButton`, `Footer`, `Breadcrumbs`, `RightRail`.
11. **Compliance UX**: PII masking applied consistently, print watermarks, scroll-gated GDPR consent, account-deletion typed confirmation, idle session warning + PII blur.
