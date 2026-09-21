# PRD.md — Hisab Product Requirements Document

> **AGENT INSTRUCTION (read first):** This is the single source of truth for what to build. Any section must be readable in isolation — you can start coding from any single section without reading the whole file. **When a decision changes during implementation, update this document in the same PR** (and log it in `docs/discovery.md` + `docs/progress.md`). Never second-guess the locked tech stack (§4). Prefer concrete over abstract: name exact packages, exact values, exact files. Where anything is unclear, **do not guess — ask the user**.

## 1. Problem statement

Indians make dozens of small UPI, credit-card, and RuPay credit-card payments every day. The money leaks invisibly; the credit-card bill arrives as a shock. Existing trackers demand manual entry for every payment, so people quit within a week.

**Hisab** removes the friction: capture transactions automatically wherever possible, show a dead-simple evening digest of everything spent, and let the user plan each morning. No more surprise bills.

## 2. Target users

- **Primary:** Indian consumers (22–40) who pay daily via UPI + credit cards and feel anxious when the bill arrives. Non-technical. Android-majority.
- **Secondary:** iOS users with the same pain (served via manual entry + bank sync; iOS cannot read SMS — Apple provides no API).

## 3. Goals & success metrics

| Goal | Metric | Target (beta) |
|---|---|---|
| Capture spending with ~zero effort | % of transactions auto-captured (SMS/bank) vs manual | >70% on Android by Phase 2 |
| Daily habit | % of beta users opening the evening digest ≥5 days/week | >50% |
| No surprise bills | Self-reported "I knew my bill amount before it arrived" | >70% agree |
| Trust | Consent toggles understood; zero data-misuse complaints | 0 complaints |
| Stability | Crash-free sessions | ≥99% |

## 4. Locked tech stack (do not second-guess)

- **App:** Expo SDK 57, React Native 0.86, React 19.2.3, Expo Router (`apps/mobile/src/app/`), JavaScript
- **UI:** `expo-blur` (BlurView), `expo-linear-gradient`, `@expo/vector-icons` (Ionicons), dark Liquid Glass design tokens in `DESIGN.md`
- **New Architecture:** `newArchEnabled: true` (required by react-native-firebase v26)
- **Backend:** Firebase — **guarded Blaze plan** (billing card required; budget alerts $1/$10, `maxInstances` caps, usage stays inside free allowances), Firestore in `asia-south1` (Mumbai)
- **Native Firebase:** `@react-native-firebase/app`, `/auth`, `/firestore`, `/messaging` (v26.x, pinned patch) — dev build required, Expo Go incompatible
- **Auth:** `react-native-nitro-google-signin` (One Tap / Credential Manager) + `expo-apple-authentication` (Apple Sign-In is **mandatory** alongside Google per App Store Guideline 4.8)
- **Forms:** `react-hook-form` + `zod` for add-transaction, budget, and bill forms
- **Functions:** firebase-functions v6, Node 22, region `asia-south1`, 2nd-gen (`onSchedule`, `onDocumentCreated/Updated/Deleted`, `onRequest`)
- **Testing:** jest (Functions), `@firebase/rules-unit-testing` + Emulator Suite (rules), Maestro (e2e)
- **Builds:** EAS (development / preview / production profiles), `runtimeVersion: { policy: "fingerprint" }`

## 5. Core features by priority

### P0 — Manual-entry core app (Phase 1)

**F-1 Google + Apple sign-in**
- [ ] One-tap Google sign-in via `react-native-nitro-google-signin` → `signInWithCredential`; creates `users/{uid}` doc
- [ ] Apple Sign-In via `expo-apple-authentication` (iOS only, real device); equal prominence, system button
- [ ] Signed-out state returns to a clean welcome screen; sign-out clears local cache + FCM token

**F-2 DPDP consent onboarding (3 screens, before any data collection)**
- [ ] Screen 1: plain-language notice (what data, purposes, retention, rights) + affirmative "I agree — create my account" button; link to privacy policy
- [ ] Screen 2: optional channel toggles, each **default-off** with its own purpose line (SMS / push in Phase 1; Gmail/bank added later)
- [ ] Screen 3: 18+ age confirmation
- [ ] Every consent event logged (uid, timestamp, purpose, notice version); withdrawal at Settings → Privacy

**F-3 Add transaction (manual)**
- [ ] Form (`react-hook-form` + `zod`): amount (₹, paise integer), merchant (text), category (chips w/ Ionicons glyphs per DESIGN.md), method (`upi`|`card`|`netbanking`|`cash`), date/time (default now), optional note
- [ ] Writes `users/{uid}/transactions/{txnId}` with `source: "manual"`; works offline, syncs on reconnect
- [ ] Validation: amount > 0, merchant non-empty, category from taxonomy, method from enum

**F-4 Home: daily spending hero + transaction list**
- [ ] Hero reads `users/{uid}/dailyTotals/{today}` (1 read): total, count, by-method split
- [ ] Search across merchant names (today/yesterday scope in V1)
- [ ] Tappable rows → detail bottom sheet: amount, merchant, category, method, source badge, recategorize chips (writes category update)
- [ ] Morning planner card (visible before 12:00): "Good morning. What are you going to do?" → plan items with estimates → persisted to `plans/{yyyy-MM-dd}`
- [ ] Evening wrap-up card: renders `digests/{today}` when present; shows planned vs actual

**F-5 Evening digest push (~21:00 IST)**
- [ ] `scheduledDigest` Function runs every 15 min; for users past `digestTime` with no digest today: aggregates today's transactions → writes `digests/{date}` (totals, byCategory, byMethod, plannedPaise, variancePaise, top 5 merchants) → sends FCM
- [ ] Tapping the notification deep-links to Home's wrap-up card
- [ ] FCM token lifecycle: `requestPermission` → `getToken` → stored in `fcmTokens` map; `onTokenRefresh` re-saves; logout → `deleteToken` + remove

**F-6 Insights / Budgets / Bills / History (live data)**
- [ ] Insights: month category breakdown, UPI-vs-cards split, 7-day chart (peak day highlighted), top merchants — all from `dailyTotals` docs (≤31 reads), never full scans
- [ ] Budgets: per-category `monthPaise` vs `spentPaise` (maintained by `onTransactionWrite` trigger); states: on track / almost there / over
- [ ] Bills: upcoming bills list, autopay **display** toggles (local only in P0 — no money movement), subscriptions list
- [ ] History: Yesterday / This month / This year segments, paginated (limit 50)

**F-7 Delete account (in-app + web)**
- [ ] Settings → Delete account → confirmation → Cloud Function wipes `users/{uid}` subtree + Auth user
- [ ] Web deletion page URL (Play requirement); same Function behind it

### P1 — Android SMS auto-capture (Phase 2)

**F-8 On-device SMS parsing**
- [ ] `READ_SMS` requested **progressively, in context** (never at onboarding), behind the DPDP SMS toggle (Screen 2 pattern)
- [ ] Parsing runs on-device in `packages/shared` (per-bank pattern pack: HDFC, ICICI, SBI, Axis, Kotak + UPI refs); **raw SMS never leaves the phone** — only normalized `{amountPaise, merchant, category, method, txnAt, sourceRef}` syncs
- [ ] Play declaration submitted truthfully as "SMS-based money management"; feature prominent in listing
- [ ] Duplicate guard: same `sourceRef`/SMS hash never ingested twice

### P2 — Bank sync via Account Aggregator (Phase 3, post-PMF)

**F-9 AA via licensed TSP + regulated FIU partner**
- [ ] TSP selection (Setu / Finvu / OneMoney — get 2–3 quotes; confirm packaged FIU-of-record commercially)
- [ ] Consent flow: account discovery → review (data type, purpose, range, frequency, duration) → approve → `ONETIME`/`PERIODIC` fetch → `source: "bank"` transactions
- [ ] Coverage caveat surfaced in UI: best for singly-held CASA; joint/NRE/NRO may not appear

### P3 — Deferred (do not build until gated condition met)

- **Gmail transaction alerts** — gated on demonstrated user demand (restricted-scope verification + recurring CASA assessment, est. $500–4.5K/yr, weeks–months). When built: scheduled polling (not Pub/Sub push), sender-scoped queries, bodies discarded after parsing.
- **Phone-OTP login** — gated on scale justifying Blaze SMS billing; evaluate Firebase phone auth vs Indian providers (MSG91 etc.) then.
- **Per-user digest time** — V1 fixed 21:00 IST.

## 6. Non-goals

- iOS SMS parsing (impossible — no Apple API)
- Credential-based bank scraping (forbidden — banks block it, violates terms)
- Real money movement, bill payment execution, autopay execution (toggles are display-only)
- Lending, credit scoring, investment tracking, multi-currency, shared/household accounts
- Promotional push notifications (banned by product rule + App Store 4.5.5)
- Web app parity (keep `expo export --platform web` building; mobile is the target)

## 7. Technical constraints

1. **Blaze billing account required** for Cloud Functions (Spark cannot deploy them). Guardrails: budget alerts $1/$10, `maxInstances` on every function, Firestore per-day usage alerts.
2. **New Architecture on** (`newArchEnabled: true`); pin `react-native-firebase` v26 patch; verify with `expo prebuild --clean`.
3. **Dev builds only** for anything touching native Firebase modules — Expo Go can't load them.
4. **Firestore paths are per-user** (`users/{uid}/…`); rules default-deny; every rule change ships with emulator tests.
5. **Money = integer paise** everywhere (client, rules validation, functions).
6. **Read-budget discipline:** free tier = 50k reads/20k writes/day. Home = 1 rollup read + paginated lists (≤50). No collection scans in render paths.
7. **New data permission = new binary**: consent toggle → `runtimeVersion` fingerprint bump → updated Data Safety + nutrition labels. EAS Update (OTA) is JS+assets only.
8. **Play account = organization** (D-U-N-S) to skip the 12-tester/14-day gate; declare as budgeting app (not lender); API 36 (already satisfied by SDK 57).
9. **DPDP:** consent before collection; 18+ gate; consent event logging; breach plan (notify users without delay, Board within 72h); full compliance deadline 13 May 2027 (soft enforcement through 2026).

## 8. Phased requirements

| Phase | Scope | Runnable end state | Doc |
|---|---|---|---|
| 0 | Repo, monorepo, CI, EAS, docs OS | Dev build installs; PR checks green | PLAN.md S0 |
| 1 | P0 features (F-1…F-7) | Two devices, one account, same data; digest push 2 evenings running; airplane-mode pass | PLAN.md S1 |
| 2 | P1 SMS (F-8) + dedupe | Test UPI payment appears exactly once from SMS | PLAN.md S2 |
| 3 | Hardening, beta (100 users) | 7-day beta, ≥99% crash-free, <50% free-tier usage | PLAN.md S3 |
| 4 | Launch (P2 AA after PMF) | Play listing live; App Store approved | PLAN.md S4 |

## 9. Open questions (for Hree — the agent may ask these, nothing else)

1. Apple Sign-In now or at M4? (Recommendation: M4 — required before App Store submission anyway.)
2. New repo vs evolve `hisab-app` in place? (Recommendation: new repo, clean history, branch protection from day one.)
3. Play organization account: shall I prepare the D-U-N-S + registration checklist? (Recommendation: yes, Phase 0.)
