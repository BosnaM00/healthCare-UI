# MediConnect — Frontend (my-app)

React 19 + Vite + TypeScript SPA for the MediConnect telemedicine marketplace.
Branch: `feature/improvements-4-stripe`

---

## Quick Start

```bash
cp .env.example .env.local
# Fill in VITE_STRIPE_PUBLISHABLE_KEY with your Stripe test key
npm install --legacy-peer-deps
npm run dev
```

---

## Environment Variables

All variables are prefixed `VITE_` (exposed to the browser by Vite).

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:8080/api` | Backend base URL (no trailing slash) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | **Yes (Stripe on)** | — | Stripe publishable key (`pk_test_…` or `pk_live_…`). App throws on startup if missing and `VITE_FEATURE_STRIPE=true`. |
| `VITE_FEATURE_STRIPE` | No | `true` in dev, `false` in prod | Feature flag for the Stripe payment subsystem. Set to `false` to hide payment step and payouts pages. |

Copy `.env.example` to `.env.local` and fill in values. Never commit real keys.

---

## Stripe Integration

### Architecture

- **Charge model:** Escrow — `PaymentIntent` created on the platform account; funds transferred to the medic on consultation completion.
- **Currency:** RON (minor unit: bani, 1 RON = 100 bani).
- **SCA:** `automatic_payment_methods.enabled = true` + redirect if required.
- **Medic onboarding:** Stripe Connect Express via `POST /v1/medics/me/stripe/onboarding`.

### Local Development with Stripe CLI

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Log in: `stripe login`
3. Forward webhooks to the backend:
   ```bash
   stripe listen --forward-to http://localhost:8080/api/v1/webhooks/stripe
   ```
4. Use the printed webhook secret as `STRIPE_WEBHOOK_SECRET` in the backend `.env`.

### Test Cards

| Card | Scenario |
|------|----------|
| `4242 4242 4242 4242` | Immediate success |
| `4000 0027 6000 3184` | 3DS / SCA required |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |

Use any future expiry, any 3-digit CVC, any postal code.

### Feature Flag

Set `VITE_FEATURE_STRIPE=false` to disable the entire payment subsystem:
- `BookingSheet` skips the payment step (booking still created)
- Sidebar hides Payouts and Stripe Setup links for medics
- `BookingResultPage` is inaccessible

---

## Key File Structure

```
src/
├── env.ts                           # Typed env accessor (throws if required var missing)
├── i18n/
│   ├── index.ts                     # i18next init (ro default, en fallback)
│   └── locales/{ro,en}/
│       ├── payments.json            # Payment status, sheet, result, errors
│       └── payouts.json             # Onboarding, payout history
├── features/
│   ├── payments/
│   │   ├── StripeProvider.tsx       # <Elements> wrapper with brand theme + locale
│   │   ├── StripeStatusBadge.tsx    # Payment state badge (role-aware)
│   │   ├── StripeErrorMapper.ts     # Stripe code → i18n key (never leaks raw errors)
│   │   ├── BookingResultPage.tsx    # /bookings/:id/result — polls backend post-3DS
│   │   ├── MedicOnboardingPage.tsx  # /medic/onboarding — Connect Express setup
│   │   ├── MedicPayoutsPage.tsx     # /medic/payouts — payout history
│   │   └── hooks/use-payments.ts   # TanStack Query hooks for all payment APIs
│   └── booking/
│       └── components/
│           └── BookingSheet.tsx     # Multi-step sheet with PaymentElement
├── mocks/handlers/
│   └── payments.handlers.ts         # MSW handlers for all payment endpoints
└── types/index.ts                   # PaymentStatus, Payment, MedicStripeStatus, etc.
```

---

## Running Tests

```bash
npm run lint
npm run build        # Type-check via tsc + Vite bundle
```

(Vitest unit tests are planned — see Phase G tracking)

---

## Payment Flow (Patient)

1. Patient selects medic + slot → `BookingSheet` opens.
2. Patient reviews summary and accepts cancellation policy.
3. "Confirm & Pay" → `POST /bookings` creates the booking, then `POST /v1/payments/intents` creates the PaymentIntent and returns `clientSecret`.
4. `BookingSheet` transitions to payment step; `PaymentElement` renders.
5. Patient submits card → `stripe.confirmPayment()` called.
   - If 3DS required: Stripe redirects to bank, then returns to `?booking_result=…&payment_id=…`.
   - If no redirect needed: resolves inline; BookingSheet advances to "done" step.
6. Backend webhook `payment_intent.succeeded` → state `RESERVED → HELD`.
7. After consultation, Quartz auto-release job fires → Transfer to medic → state `HELD → RELEASED`.

---

## Cancellation Policy (binding)

| Scenario | Refund |
|----------|--------|
| Cancel ≥ 2h before start | Full refund |
| Cancel < 2h before start | No refund |
| Patient no-show | No refund |
| Medic no-show | Full refund + apology credit |
| Platform technical failure | Full refund |

---

## Phased Delivery

- **Phase A** ✅ Stripe packages, env helper, i18n init, type extensions
- **Phase B** ✅ Medic Connect onboarding + payouts pages, CASL `OwnPayouts`, MSW handlers
- **Phase C** ✅ `StripeProvider`, `PaymentElement` in `BookingSheet`, `BookingResultPage`
- **Phase D** ✅ `StripeStatusBadge`, `StripeErrorMapper`, `formatRon`
- **Phase E** ✅ Routing (new routes + sidebar links)
- **Phase F** ✅ i18n wiring, feature flag, README
- **Phase G** — Vitest unit tests + Storybook stories (follow-up)
- **Phase H (future)** — Stripe Invoices/Tax (Phase 2 — not in this PR)
