# Frictionless Transactions — Build Spec

A single source of truth for the parallel **backend** and **frontend** work that closes the journey gaps identified in the UX review.

- The **Backend Track** section is self-contained: an API engineer can build from it without reading the frontend section.
- The **Frontend Track** section is self-contained: a UI engineer can build from it against the existing API (Phase 1) and stub the rest until the backend lands (Phase 2/3).
- The **Phasing** section at the bottom shows what unlocks what.

Source files referenced:
- API client + types: `src/api.ts`
- App shell + screens: `src/App.tsx`

---

## 0. Shared context

### 0.1 Personas and roles

| Persona | Role enum | Notes |
|---|---|---|
| Car buyer | `BUYER` | Exists |
| Sales rep | `DEALER` | Today `DEALER` conflates owner + manager + rep. We keep `DEALER` as the rep seat. |
| Sales manager | `MANAGER` *(new)* | Triage, assignment, approvals, coaching |
| Dealership owner | `OWNER` *(new)* | P&L, staff, commissions, subscription |
| Platform admin | `ADMIN` | Exists |

Role transition: existing `DEALER` accounts default to `DEALER` (rep). Owner-of-record on a `Dealer` record gets `OWNER` at migration time.

### 0.2 Glossary

- **Deal** — single record that buyer, rep, and manager all watch. Already exists.
- **Hold** — pre-deal refundable reservation. New.
- **Pre-qual** — soft-pull financing estimate. New.
- **Approval** — a manager sign-off on a discount/trade-in over threshold. New.
- **Commission rule** — per-dealer payout policy. New.

### 0.3 Out of scope for v1

- Real credit bureau soft pull (we stub with self-reported credit band).
- Multi-language / i18n.
- Carrier integrations for home delivery (still a manual schedule).
- Admin-side compliance reports.

---

## 1. Backend Track

Conventions: REST, JSON, `Authorization: Bearer <token>`, 2xx success, 4xx client error with `{error, message}`. All money fields are integers in cents unless noted. Timestamps ISO-8601 UTC.

### 1.1 Schema deltas

#### 1.1.1 `UserRole`

```
UserRole = 'ADMIN' | 'OWNER' | 'MANAGER' | 'DEALER' | 'BUYER'
```

Migration: any user currently `DEALER` keeps `DEALER`. For each `Dealer`, promote the user listed as `owner_user_id` (if present) to `OWNER`; otherwise pick the oldest `DEALER` user for that dealer.

#### 1.1.2 `User` (new endpoint, existing entity)

`User` records exist server-side (auth uses them). Expose them per dealer:

```
GET /api/dealers/{dealerId}/users           -> User[]
POST /api/dealers/{dealerId}/users/invite   -> Invite
PATCH /api/users/{userId}/role              -> User           body: { role: UserRole }
DELETE /api/dealers/{dealerId}/users/{id}   -> 204
```

```
User = {
  id: number
  dealerId: number | null
  displayName: string
  email: string
  role: UserRole
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED'
  createdAt: string
}

Invite = {
  id: number
  email: string
  role: UserRole
  expiresAt: string
}
```

Permissions:
- `OWNER` + `ADMIN`: full CRUD on users in their dealer.
- `MANAGER`: list only.
- Others: 403.

#### 1.1.3 Assignment fields on `Lead`, `Appointment`, `Deal`

Add nullable `assignedUserId: number | null` to all three. Backfill `null`.

```
PATCH /api/leads/{id}/assign            body: { assignedUserId: number | null }
PATCH /api/appointments/{id}/assign     body: { assignedUserId: number | null }
PATCH /api/deals/{id}/assign            body: { assignedUserId: number | null }
```

Permissions: `MANAGER`, `OWNER`, `ADMIN`. A `DEALER` (rep) may self-claim a lead (`assignedUserId = me`) only if currently null.

Auto-routing endpoint (round-robin among active reps for the dealer):

```
POST /api/dealers/{dealerId}/leads/auto-assign  -> { assignedCount: number }
```

#### 1.1.4 Buyer engagement: saved searches, favorites, comparisons

```
SavedSearch = {
  id: number
  buyerEmail: string
  name: string
  query: VehicleQuery  // same shape as listVehicles query
  alertOnPriceDrop: boolean
  createdAt: string
}

Favorite = { id: number; buyerEmail: string; vehicleId: number; createdAt: string }
ComparisonList = { buyerEmail: string; vehicleIds: number[] }   // max 3
```

```
GET    /api/buyers/{email}/saved-searches
POST   /api/buyers/{email}/saved-searches
DELETE /api/buyers/{email}/saved-searches/{id}

GET    /api/buyers/{email}/favorites
POST   /api/buyers/{email}/favorites           body: { vehicleId }
DELETE /api/buyers/{email}/favorites/{vehicleId}

GET    /api/buyers/{email}/compare
PUT    /api/buyers/{email}/compare             body: { vehicleIds: number[] }  // replaces
```

Producer: when a `Vehicle.price` drops and matches a `SavedSearch` with `alertOnPriceDrop`, emit a `Notification` (use existing notifications table, `recipientType: 'BUYER'`).

#### 1.1.5 Financing pre-qual (stub)

```
PreQual = {
  id: number
  buyerEmail: string
  creditBand: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  monthlyIncome: number       // cents
  downPayment: number         // cents
  estimatedApr: number        // basis points, e.g. 690 = 6.90%
  maxLoanAmount: number       // cents
  expiresAt: string
}

POST /api/prequal              body: { buyerEmail, creditBand, monthlyIncome, downPayment }
GET  /api/buyers/{email}/prequal/latest
```

v1 logic: deterministic table mapping `creditBand` → APR band. No external bureau call.

Payment estimator helper (pure compute, can live client-side too):

```
POST /api/payment-estimate     body: { price, downPayment, termMonths, apr }
                               -> { monthlyPayment, totalInterest, totalPayments }
```

#### 1.1.6 Pre-deal hold (reserve a vehicle)

```
Hold = {
  id: number
  vehicleId: number
  buyerEmail: string
  amount: number              // cents, refundable
  status: 'AUTHORIZED' | 'CAPTURED' | 'RELEASED' | 'CONVERTED'
  expiresAt: string           // 48h from creation
  createdAt: string
}

POST /api/vehicles/{id}/hold                body: { buyerEmail, amount, paymentMethodId }
POST /api/holds/{id}/release                -> Hold
POST /api/holds/{id}/convert-to-deal        body: CreateDealRequest -> Deal
```

When a hold is `AUTHORIZED`, set `Vehicle.status = 'RESERVED'`. On `RELEASED` or expiry, revert to `LIVE`. On `CONVERTED`, attach `holdId` to the new `Deal` and credit the hold against the deposit.

#### 1.1.7 Messaging on a deal

```
DealMessage = {
  id: number
  dealId: number
  senderType: ParticipantType
  senderReference: string
  body: string
  attachments: { fileName: string; url: string }[]
  createdAt: string
  readByBuyer: boolean
  readByDealer: boolean
}

GET  /api/deals/{id}/messages              query: ?after=<isoTs>
POST /api/deals/{id}/messages              body: { body, attachments? }
PATCH /api/deals/{id}/messages/read        body: { participantType, lastReadMessageId }
```

Real-time: out of scope v1 — frontend polls `?after=` every 10s while Deal Room is open.

#### 1.1.8 Approvals (manager workflow)

```
Approval = {
  id: number
  dealId: number
  requestedByUserId: number
  type: 'DISCOUNT_OVER_THRESHOLD' | 'TRADE_IN_OVER_MMR' | 'OTHER'
  amount: number              // cents (signed; trade-in overage is positive)
  reason: string
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  decidedByUserId?: number
  decidedAt?: string
  createdAt: string
}

POST /api/deals/{id}/approvals         body: { type, amount, reason }   (rep)
GET  /api/dealers/{id}/approvals?status=PENDING                          (manager+)
PATCH /api/approvals/{id}              body: { status: 'APPROVED'|'DENIED', note? }
```

Server-side rule: if rep submits a deal with `discountAmount` over the dealer's threshold OR `tradeInOffer` exceeds MMR by more than threshold, the stage transition to `BUYER_CONFIRMED` blocks until an `Approval` is `APPROVED`.

Dealer-level config:

```
DealerSettings = {
  dealerId: number
  discountApprovalThreshold: number   // cents, default $500_00
  tradeInOverMmrThreshold: number     // cents, default $300_00
}
GET   /api/dealers/{id}/settings
PATCH /api/dealers/{id}/settings
```

#### 1.1.9 Commissions

```
CommissionRule = {
  dealerId: number
  repBaseBps: number            // basis points of gross profit, e.g. 1000 = 10%
  managerOverrideBps: number    // basis points of team gross
  perUnitBonusCents: number     // bonus per unit above threshold
  perUnitBonusThreshold: number // units/mo before bonus kicks in
  updatedAt: string
}

CommissionLedgerEntry = {
  id: number
  dealId: number
  userId: number
  type: 'REP_BASE' | 'MANAGER_OVERRIDE' | 'BONUS'
  amount: number               // cents
  createdAt: string
}

GET   /api/dealers/{id}/commission-rules
PUT   /api/dealers/{id}/commission-rules
GET   /api/dealers/{id}/commissions?from=&to=&userId=
```

Ledger entries are written when `Deal.stage` transitions to `COMPLETED`.

#### 1.1.10 Performance reporting

Existing portal returns counts only. Add money + time metrics.

```
PerformanceReport = {
  dealerId: number
  rangeStart: string
  rangeEnd: string
  revenueCents: number
  grossProfitCents: number
  unitsSold: number
  goalUnits: number
  avgGrossPerUnitCents: number
  avgDaysToSale: number
  funnel: { leads: number; contacted: number; testDrove: number; dealOpen: number; closed: number }
  leaderboard: { userId: number; displayName: string; unitsSold: number; grossProfitCents: number }[]
  fAndIAttach: { product: 'WARRANTY' | 'GAP' | 'SERVICE'; attachRate: number }[]
  inventoryHealth: {
    staleListings: number          // listed > 60 days
    missingPhotos: number
    overMmr: number                // > 8% above MMR
  }
}

GET /api/dealers/{id}/performance?from=&to=
```

Implementation note: `avgGrossPerUnit = grossProfit / unitsSold`. Gross profit per deal = `totalAmount - cost_of_vehicle - registrationFee - documentationFee`. `cost_of_vehicle` must be added to `Vehicle` (new field `costCents`, dealer-only visible).

#### 1.1.11 Vehicle additions for inventory health

```
Vehicle += {
  costCents: number                    // dealer-only, never returned to BUYER
  marketPriceCents: number | null      // MMR/KBB feed, nullable until ingested
  listedAt: string                     // existing createdAt may suffice
}
```

Add `GET /api/vehicles/{id}/health` returning `{ stale: boolean; missingPhotos: boolean; overMmrPercent: number }` for dealer/manager/owner.

#### 1.1.12 Real payments and e-signature (provider integration)

Replace stub `POST /api/deals/{id}/deposit`:

```
POST /api/deals/{id}/deposit-intent       -> { clientSecret, amount, provider: 'stripe' }
POST /api/deals/{id}/deposit-confirm      body: { paymentIntentId } -> Deal
```

E-sign:

```
POST /api/deals/{id}/documents/{docId}/sign-request  -> { signingUrl, envelopeId }
Webhook: POST /webhooks/esign                        // provider -> us, flips document to APPROVED
```

Providers: Stripe (payments) + Dropbox Sign or DocuSign (signature). Webhook secrets stored in env.

### 1.2 Endpoint summary table (new + changed)

| Method | Path | New/Changed | Roles |
|---|---|---|---|
| GET | `/api/dealers/{id}/users` | new | OWNER, ADMIN, MANAGER |
| POST | `/api/dealers/{id}/users/invite` | new | OWNER, ADMIN |
| PATCH | `/api/users/{id}/role` | new | OWNER, ADMIN |
| DELETE | `/api/dealers/{id}/users/{id}` | new | OWNER, ADMIN |
| PATCH | `/api/leads/{id}/assign` | new | MANAGER, OWNER, ADMIN, self-DEALER |
| PATCH | `/api/appointments/{id}/assign` | new | same |
| PATCH | `/api/deals/{id}/assign` | new | same |
| POST | `/api/dealers/{id}/leads/auto-assign` | new | MANAGER, OWNER, ADMIN |
| GET/POST/DELETE | `/api/buyers/{email}/saved-searches[/...]` | new | BUYER (self), ADMIN |
| GET/POST/DELETE | `/api/buyers/{email}/favorites[/...]` | new | BUYER (self), ADMIN |
| GET/PUT | `/api/buyers/{email}/compare` | new | BUYER (self), ADMIN |
| POST | `/api/prequal` | new | BUYER |
| GET | `/api/buyers/{email}/prequal/latest` | new | BUYER (self), ADMIN |
| POST | `/api/payment-estimate` | new | any |
| POST | `/api/vehicles/{id}/hold` | new | BUYER |
| POST | `/api/holds/{id}/release` | new | BUYER, MANAGER+ |
| POST | `/api/holds/{id}/convert-to-deal` | new | BUYER |
| GET/POST | `/api/deals/{id}/messages` | new | participants of deal |
| PATCH | `/api/deals/{id}/messages/read` | new | same |
| POST/GET/PATCH | `/api/deals/{id}/approvals`, `/api/approvals/{id}` | new | MANAGER+, OWNER, ADMIN |
| GET/PATCH | `/api/dealers/{id}/settings` | new | OWNER, ADMIN |
| GET/PUT | `/api/dealers/{id}/commission-rules` | new | OWNER, ADMIN |
| GET | `/api/dealers/{id}/commissions` | new | OWNER, ADMIN, MANAGER |
| GET | `/api/dealers/{id}/performance` | new | OWNER, ADMIN, MANAGER |
| GET | `/api/vehicles/{id}/health` | new | DEALER+ |
| POST | `/api/deals/{id}/deposit-intent` | new (replaces stub) | BUYER |
| POST | `/api/deals/{id}/deposit-confirm` | new | BUYER |
| POST | `/api/deals/{id}/documents/{id}/sign-request` | new | BUYER |
| POST | `/webhooks/esign` | new | provider only (HMAC) |

### 1.3 Migration order (backend)

1. Add `MANAGER`, `OWNER` to `UserRole` enum; backfill owners.
2. Add `assignedUserId` nullable columns on `leads`, `appointments`, `deals`.
3. Ship `users` listing + invite + role PATCH.
4. Ship `assign` PATCH endpoints + auto-assign.
5. Ship `dealer_settings`, `approvals`, threshold-gated stage transition.
6. Ship buyer-engagement endpoints (saved searches / favorites / compare).
7. Ship pre-qual + payment-estimate.
8. Ship `holds` + `vehicle.status` flip.
9. Ship messaging endpoints.
10. Ship commission rules + ledger writer on deal completion.
11. Add `costCents`, `marketPriceCents` to `vehicles`; ship `performance` + `health`.
12. Integrate Stripe (deposit-intent/confirm) and e-sign provider + webhook.

Each step is independently shippable behind a feature flag.

### 1.4 Test plan (backend)

- Unit: pricing math, commission ledger generation, approval threshold gating.
- Contract: every new endpoint covered by a request/response snapshot test.
- Integration: end-to-end hold → deal → deposit → docs → handoff with a real Stripe test key and a sandbox e-sign envelope.
- RBAC matrix test: every endpoint × every role → expected 2xx / 403.

---

## 2. Frontend Track

App is currently one file (`src/App.tsx` ~3k lines). Step 0 is structural; everything else hangs off it.

### 2.1 Routing and shell

Split `App.tsx` into:

```
src/
  api.ts                          (existing)
  app/
    AppShell.tsx                  role-aware nav + notifications bell
    routes.tsx                    react-router or simple switch by role
  routes/
    buyer/
      InventoryPage.tsx
      VehiclePage.tsx
      DealRoomPage.tsx
      SavedPage.tsx
      ComparePage.tsx
    dealer/                       (sales rep)
      MyQueuePage.tsx
      DealRoomPage.tsx
    manager/
      TriagePage.tsx
      DealDeskPage.tsx
      ApprovalsPage.tsx
    owner/
      PerformancePage.tsx
      StaffPage.tsx
      SubscriptionPage.tsx
    admin/                        (existing screens, untouched in v1)
  components/
    NotificationsBell.tsx
    TaskList.tsx
    DealTimeline.tsx
    PriceBreakdown.tsx
    PaymentSlider.tsx
    CompareDrawer.tsx
    KanbanBoard.tsx
    Leaderboard.tsx
```

Routing rule: after login, look at `currentUser.role` and route to that role's default page. Role → default landing:

- `BUYER` → `/buyer/inventory`
- `DEALER` → `/dealer/queue`
- `MANAGER` → `/manager/triage`
- `OWNER` → `/owner/performance`
- `ADMIN` → existing admin home

### 2.2 Cross-cutting components

These render in every shell and use endpoints that already exist today — they can be built in Phase 1 with zero backend work.

#### 2.2.1 `NotificationsBell`

- Data: `api.listNotifications({ recipientType, recipientReference, unreadOnly: true })`
- Poll every 30s while focused.
- Click bell → dropdown of notifications. Click item → mark read via `api.markNotificationRead(id, true)` and navigate to its `dealId` if present.

#### 2.2.2 `TaskList`

- Data: `api.listTasksForAssignee({ assigneeType, assigneeReference, status: 'OPEN' })`
- Renders one row per task with checkbox; checking calls `api.updateTaskStatus(id, { status: 'COMPLETED' })`.
- Used inside Buyer Deal Room ("What you owe") and Rep Deal Room ("What's blocking close").

#### 2.2.3 `DealTimeline`

- Data: `api.listDealActivity(dealId)` + `api.getDealReadiness(dealId)`.
- Renders an ordered vertical timeline of `eventType` → `message` with timestamps. Blockers from readiness appear as red dots at the relevant stage.

#### 2.2.4 `PaymentSlider` (pure UI)

- Inputs: vehiclePrice, downPayment, termMonths, apr.
- Output: monthly payment via `POST /api/payment-estimate` (Phase 2) or local formula in Phase 1.
- Local formula: `m = P * (r/12) / (1 - (1 + r/12)^-n)` where `P = price - down`, `r = apr/10000`.

### 2.3 Buyer screens

#### 2.3.1 `InventoryPage` + `CompareDrawer`

Wireframe ref: A1 in the UX review.

- Data: `api.listVehicles(query)` (existing).
- Local-state compare (Phase 1) → server-backed `/api/buyers/{email}/compare` (Phase 2).
- Heart icon → favorites (local Phase 1, server Phase 2).
- Sticky bottom drawer shows compare items; "Open" navigates to `/buyer/compare`.

States: empty (no results), loading skeleton, error.

#### 2.3.2 `VehiclePage`

Wireframe ref: A2.

- Data: `api.getVehicle(id)` (existing).
- `PaymentSlider` card.
- "Get pre-qualified" → modal posting `POST /api/prequal` (Phase 2). In Phase 1, the modal stores result in local state only.
- "Reserve & Test Drive" CTA:
  - Phase 1: opens a single-step modal that fires the three existing endpoints in sequence: `createLead`, `createAppointment`, `createDeal` with `fulfillmentType: 'PICKUP'` and a $500 placeholder deposit.
  - Phase 2: replaced by `POST /api/vehicles/{id}/hold`.
- "Ask a question" / "Schedule" stay as fallback secondary actions.

#### 2.3.3 `DealRoomPage`

Wireframe ref: A3. **Built entirely on existing endpoints.**

- Data:
  - `api.getDeal(id)`
  - `api.listDealDocuments(id)`
  - `api.listDealTasks(id)` → checklist
  - `api.getDealReadiness(id)` → red dots on timeline
  - `api.listDealActivity(id)` → timeline events
  - `api.listNotifications({ recipientType: 'BUYER', recipientReference: email })` → inline alerts
- Components: `DealTimeline`, `TaskList`, `PriceBreakdown`, document upload list (existing UI).
- Messaging panel: Phase 1 hidden, Phase 2 enabled (`/api/deals/{id}/messages` polling every 10s).
- Deposit button:
  - Phase 1: keeps stub `payDealDeposit`.
  - Phase 3: Stripe Elements via `deposit-intent` → `deposit-confirm`.
- Sign button on `BUYER_AGREEMENT`:
  - Phase 1: file upload (existing).
  - Phase 3: opens `signingUrl` from `sign-request`.

### 2.4 Sales Rep screens (role `DEALER`)

#### 2.4.1 `MyQueuePage`

- Tabs: Leads / Appointments / Deals — all filtered to `assignedUserId == me`.
- Phase 1 (no assignment field yet): show **all** dealer items but render a "Claim" button that no-ops with a toast "Assignment ships in Phase 2".
- Phase 2: Claim → `PATCH /api/leads/{id}/assign { assignedUserId: me }`.

#### 2.4.2 Rep `DealRoomPage`

Same as buyer's, but:
- "What you owe" replaced with "What's blocking close" (`listDealTasks` filtered to `assigneeType: 'DEALER'`).
- Add "Request approval" button → opens modal that posts `/api/deals/{id}/approvals` (Phase 2).
- Add internal-only note field on activity (frontend can stub; backend treats as a `DealMessage` with sender DEALER and audience DEALER-only — needs `audience` field if we want this — Phase 3).

### 2.5 Sales Manager screens (role `MANAGER`)

#### 2.5.1 `TriagePage`

Wireframe ref: B1.

- Top KPI strip: counts from `api.getDealerPortal(dealerId).overview` (existing).
- Unassigned leads: `api.listDealerPortalLeads(dealerId, { status: 'NEW' })` filtered client-side to `assignedUserId == null`.
- Rep load: `GET /api/dealers/{id}/users` (Phase 2) cross-joined client-side with the leads list.
- Approval queue: `GET /api/dealers/{id}/approvals?status=PENDING` (Phase 2).
- Assign action: `PATCH /api/leads/{id}/assign` (Phase 2). Auto-RR button: `POST /api/dealers/{id}/leads/auto-assign`.

Phase 1 fallback: page renders read-only with KPIs + "Phase 2" empty states for unassigned/rep-load/approval panels.

#### 2.5.2 `DealDeskPage`

Wireframe ref: B2.

- Data: `api.listDeals({ stage })` for each stage column.
- Columns: `INITIATED`, `OFFER_SENT`, `BUYER_CONFIRMED`/`DEPOSIT_PAID` (merged), `DOCUMENTS_PENDING`, `READY_FOR_HANDOFF`.
- Card shows buyer, vehicle, assigned rep, days-in-stage, blocker count from `getDealReadiness`.
- Click → side panel with `TaskList`, `DealTimeline`, "Reassign", "Approve/Deny" if approval pending.
- Drag-to-reassign: `PATCH /api/deals/{id}/assign` (Phase 2).

#### 2.5.3 `ApprovalsPage`

- Data: `GET /api/dealers/{id}/approvals` (Phase 2).
- Approve/Deny modal with required note. Optimistic update; rollback on error.

### 2.6 Dealership Owner screens (role `OWNER`)

#### 2.6.1 `PerformancePage`

Wireframe ref: C1.

- Phase 1: render **Operations** tab from existing `api.getDealerPortal(dealerId)` (counts, pipeline, queue).
- Phase 2: add **Performance** tab from `GET /api/dealers/{id}/performance` (revenue, gross, days-to-sale, leaderboard, F&I attach, inventory health).
- Date range picker → query params `from`, `to`.

#### 2.6.2 `StaffPage`

Wireframe ref: C2.

- Phase 2 only. Data: `GET /api/dealers/{id}/users`, `GET /api/dealers/{id}/commission-rules`, `GET /api/dealers/{id}/commissions`.
- Invite teammate modal → `POST /api/dealers/{id}/users/invite`.
- Commission rules editor → `PUT /api/dealers/{id}/commission-rules`.

#### 2.6.3 `SubscriptionPage`

Already exists in code. Add contextual upgrade CTA when usage approaches plan limits (compare `PortalOverview.totalInventoryCount` to plan ceiling). No backend change.

### 2.7 Feature flags (frontend)

Wrap Phase 2/3 surfaces in a single config:

```
src/featureFlags.ts
export const flags = {
  buyerCompare: true,        // P1 client-only, P2 server
  buyerPreQual: false,       // P2
  buyerHold: false,          // P2
  dealMessaging: false,      // P2
  repAssignment: false,      // P2
  managerApprovals: false,   // P2
  ownerPerformance: false,   // P2
  ownerStaff: false,         // P2
  realPayments: false,       // P3
  eSignature: false,         // P3
}
```

Toggle to `true` as each backend slice lands.

### 2.8 Test plan (frontend)

- Visual: Storybook stories for `DealTimeline`, `TaskList`, `KanbanBoard`, `PaymentSlider`.
- Component: React Testing Library on routing-by-role, notifications poll, task check/uncheck.
- E2E (Playwright) per role: buyer happy path (browse → deal room → docs), rep claim → close, manager assign → approve, owner performance load.
- Accessibility: every interactive element labeled; kanban supports keyboard drag (arrow keys + space to pick up).

---

## 3. Phasing — what unlocks what

### Phase 1 — Frontend-only, ships against the current backend (1–2 weeks)

Goal: every persona sees a coherent, real screen with no fake data.

- Split `App.tsx` into route files (2.1).
- `NotificationsBell` everywhere (2.2.1).
- Buyer `DealRoomPage` rebuild with `TaskList` + `DealTimeline` (2.3.3).
- `PaymentSlider` on `VehiclePage` (local math).
- Manager `DealDeskPage` kanban over `listDeals` (read-only reassignment).
- Owner `PerformancePage` → **Operations** tab from existing portal endpoint.
- Local-state compare drawer and favorites for buyer.

No backend dependencies. Demonstrates the model.

### Phase 2 — Schema + workflow backend (3–4 weeks parallel)

Goal: real roles, assignment, approvals, money math.

Backend ships migration 1–11 from §1.3. Frontend flips flags as each lands:

- `MANAGER` and `OWNER` roles + role-based landing routes.
- Lead/appointment/deal assignment + auto-RR.
- Approvals workflow (manager triage + rep request).
- Buyer saved searches, favorites, compare (server-backed), pre-qual, hold.
- Deal messaging (polling).
- Owner performance dashboard + staff page + commission rules.

### Phase 3 — Payments and e-sign (2 weeks)

Goal: close the trust gap. The deal can actually finish in-app.

- Stripe deposit-intent / deposit-confirm replaces stub.
- E-sign provider integration + webhook → flips `BUYER_AGREEMENT` to `APPROVED` automatically.
- Real KYC via Stripe Identity or Persona (only if compliance asks; otherwise stays as doc upload).

---

## 4. Acceptance criteria (per-track exit gates)

**Backend Phase 2 done when:**
- All endpoints in §1.2 return contract-test-valid responses.
- RBAC matrix tests pass for all roles.
- A scripted scenario can: invite a rep → assign a lead → escalate an approval → approve it → complete a deal → see a commission ledger entry.

**Frontend Phase 2 done when:**
- A logged-in `MANAGER` lands on `/manager/triage` and can drag a card across the kanban, see an approval, decide it, and watch the deal advance in real time on a second tab.
- A logged-in `BUYER` can browse, compare 3 cars, get a pre-qual estimate, reserve with a hold, see a checklist update as the rep approves docs.
- A logged-in `OWNER` sees revenue, gross/unit, days-to-sale, and a rep leaderboard for the current month.

**Phase 3 done when:**
- A buyer completes a deal end-to-end with a real Stripe deposit and a real signed PDF — no manual upload required.
