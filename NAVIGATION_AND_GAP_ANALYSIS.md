# StealADeal — Navigation Journeys & Production Gap Analysis

UX-architect view of the shipped frontend. Part 1 maps the real
navigation per persona (every route exists in `src/App.tsx`). Part 2 is a
prioritized, honest readiness assessment — what's solid, what's still
required before a production launch.

---

## Part 1 — Information architecture

### Roles & theme
- **Guest** (no auth) · **Buyer** · **Dealer** · **Admin**
- Theme is persona-driven: Buyer/Guest = light; Dealer/Admin = dark.
- Auth: in-memory access token + rotating refresh; guest browsing with a
  sign-up invite on gated actions.

### Route → role matrix (from `navItems` + standalone routes)

| Route | Guest | Buyer | Dealer | Admin |
|---|:--:|:--:|:--:|:--:|
| `inventory` (browse vs **manage**) | ✓ browse | ✓ browse | ✓ manage | ✓ manage |
| `vehicle` (detail) | ✓ | ✓ | – | ✓ |
| `compare` | ✓* | ✓ | – | – |
| `garage` (favorites + saved searches) | – | ✓ | – | – |
| `overview` (Dealer = **dashboard**) | – | – | ✓ | ✓ |
| `deal-room` | – | ✓ | ✓ | ✓ |
| `deal-desk` (pipeline kanban) | – | – | ✓ | ✓ |
| `leads` (inbox) | – | – | ✓ | ✓ |
| `appointments` | – | – | ✓ | ✓ |
| `reporting` (operations) | – | – | ✓ | ✓ |
| `dealers` (admin CRUD) | – | – | – | ✓ |
| `fni-catalog` | – | – | – | ✓ |
| `audit` | – | – | – | ✓ |
| `dealer-profile`, `about`, `terms`, `privacy`, `faq`, `contact` | ✓ | ✓ | ✓ | ✓ |

\* guest may open compare; saving/comparing triggers the sign-up invite.

---

## Part 2 — Navigation journeys

### A. Guest → Buyer (discovery → account)
```
Landing (light) ─ Inventory (browse, filters, pagination, deal score)
  │
  ├─ Find your match (quiz) ──────────► ranked listings + match %
  ├─ Compare (pick ≤3) ──────────────► side-by-side + savings + deal score
  ├─ View details ───► Vehicle detail (gallery/lightbox, payment slider,
  │                     history & disclosures, dealer link)
  │                       │
  │                       ├─ View dealer ─► Dealer profile (their inventory)
  │                       └─ ♥ Save / Ask / Test drive / Start purchase
  │                                   └────► AUTH INVITE (sign up / sign in)
  └─ Readiness meter (budget → financing → compare → docs → shortlist)
```
Gate: any save / message / appointment / purchase prompts auth, then
returns the buyer to the action.

### B. Buyer (authenticated)
```
Inventory ─► Vehicle detail ─► Start purchase ─► Deal Room
   │                                              │
 My Garage (saved cars + saved searches w/ alerts)│
 Compare                                          ▼
                          Deal Room: timeline · "what you owe" tasks ·
                          price breakdown · deposit (confirm + receipt) ·
                          documents · F&I (read-only) · platform fee (read-only)
Notifications bell (polled): price-drop alerts, deal updates → deep-link
```

### C. Dealer (self-serve)
```
Overview = DEALER DASHBOARD
  ├─ Onboarding checklist (until complete)
  ├─ Quick actions (live counts) ─► Inventory / Leads / Appointments /
  │                                  Deal Desk / Performance
  ├─ "Needs attention" queue (awaiting buyer · docs · handoff · stalled)
  └─ Operations metrics + subscription status

Inventory (manage) ─ add/edit · publish/unpublish · CSV bulk · VIN add ·
                      per-vehicle history PDF · automated feed (sync)
Leads (inbox)      ─ buyer contact · response-time flag · status progression
Appointments       ─ confirm / complete test drives & deliveries
Deal Desk (kanban) ─ stage columns · stale flag · open a deal
Deal Room          ─ generate disclosures (buyer-agreement/odometer/AS-IS) ·
                      attach/remove F&I · advance stage · fulfillment
Reporting          ─ operations funnel + inventory/deal distributions
```

### D. Admin
```
Overview/Reporting ─ platform operations
Dealers            ─ create/edit dealers · approve/reject · vehicle CRUD
F&I Catalog        ─ create products · activate/deactivate
Audit              ─ append-only event log (filter by deal/actor)
(+ all dealer/deal surfaces, all-tenant scope)
```

### Cross-cutting nav
- **URL state**: `?view=&vehicle=&dealer=` — deep links, Back button,
  refresh-safe.
- **Footer** (every page): About · Help & FAQ · Contact · Terms · Privacy.
- **Sticky sidebar** with floating sign-in/identity panel.
- **Global**: toasts (success/error), notifications bell, confirm dialogs,
  error boundary, loading skeletons.

---

## Part 3 — Production gap analysis

Legend: **P0** = launch blocker · **P1** = needed for a credible GA ·
**P2** = fast-follow / polish.

### Verified-good (evidence)
- TypeScript strict, no `any`; `tsc --noEmit` clean.
- 20 Vitest cases: auth wrapper (401→refresh→retry, single-flight,
  refresh-fail logout, 403 no-refresh), deal/match scoring.
- In-memory tokens (no `localStorage`), refresh rotation, central
  `ApiError`, 401/403 handling.
- Every non-webhook backend endpoint has a FE surface (audited).
- Responsive (980/640 breakpoints), light/dark, focus-visible, skip link,
  error boundary, loading/error/empty states via `ResourceBlock`.

### P0 — Launch blockers
1. **No E2E coverage.** Unit tests exist; there are **zero Playwright/
   integration flows**. Buyer purchase, dealer onboarding→publish, admin
   approve, and token-expiry auto-refresh must have E2E before launch.
2. **No browser/visual QA pass.** Many surfaces were type/test-verified but
   not pixel-walked per persona. A cross-browser + responsive QA sweep is
   required (esp. dealer Deal Room F&I panel, Audit table, light-theme
   contrast on chips/badges).
3. **Legal content is DRAFT.** Terms & Privacy carry counsel-review banners
   and `[TBD]` placeholders. A lawyer pass + the platform/fee positioning
   review is mandatory before onboarding a real dealer.
4. **Deposit/payment is not real money yet.** The deposit flow shows a
   confirm+receipt but Stripe Elements / PaymentIntent confirmation is not
   wired on the client (backend `deposit/intent` exists). Real payment +
   e-sign must be integrated and tested in Stripe test mode.
5. **Hardcoded buyer address in `createDeal`.** The buyer's address is
   still placeholder data — a real address-collection step is required
   before deals are legally meaningful.

### P1 — Needed for credible GA
6. **`App.tsx` is ~4k lines.** All view logic + a giant prop object in one
   file. High regression risk; split into `src/routes/*` (the leaf
   components are already extracted — the render switch is the remaining
   monolith).
7. **No real-time.** Notifications + deal messaging poll (or don't exist
   for chat). Buyer↔dealer messaging thread is still absent (no endpoint
   surfaced); deal updates rely on 30s polling.
8. **Accessibility not audited to WCAG.** ARIA/focus/skip-link added, but
   no axe/contrast audit, no keyboard-only walkthrough of dialogs, kanban,
   lightbox, and the quiz.
9. **Error/empty consistency.** Some self-contained components fetch
   independently; verify every one degrades gracefully when the backend
   400/500s (not just 401).
10. **Observability.** No client error reporting (Sentry-equiv), no
    analytics on the funnel the gamification is meant to move.
11. **Config/build hardening.** `VITE_API_BASE_URL` is wired, but no CI
    pipeline, no env-specific builds, no bundle-size budget (JS ~300KB).

### P2 — Fast-follow / polish
- Dealer **VIN decode preview** (currently create-on-submit, no preview).
- Saved-search **"price dropped" highlight** on garage cards (needs prior
  price from backend).
- F&I **buyer self-election** (today dealer attaches; spec wants buyer
  accept/decline digitally).
- Deal Room **document e-sign UX** (envelope status exists in the model).
- **i18n / currency**, empty-state illustrations, micro-interactions.
- Consolidate the two prior-built dealer inventory entry points
  (admin `dealers` view vs dealer `inventory` view) to avoid drift.

### Honest framing
The app is **feature-complete against the current backend** and
engineering-clean (types, unit tests, a11y primitives, theming). It is
**not yet production-ready** primarily on: (1) no E2E/visual QA, (2) draft
legal, (3) real payment/e-sign + buyer address, and (4) the App.tsx
monolith. None are research problems — they're a defined hardening
checklist. P0 items gate launch; P1 items gate a confident GA.
