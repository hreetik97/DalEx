# TASKS.md — Implementation Task List

> Generated from PRD.md. Parent tasks first, then sub-tasks with the files each touches. Tick sub-tasks as they land; a parent is done only when all its sub-tasks are done **and** verified per RULES.md §7.

## T0 — Repo & toolchain (Phase 0)

- [ ] T0.1 Create GitHub repo (Hree), add deploy key, branch protection on `main`
  - files: (GitHub settings)
- [ ] T0.2 Monorepo scaffold: `apps/mobile` (move prototype), `apps/functions`, `packages/shared`, `infra`, `docs`
  - files: repo root `package.json` (workspaces), `apps/mobile/*` (moved)
- [ ] T0.3 CI workflow: lint + typecheck + expo-doctor + rules tests + web-export smoke on every PR
  - files: `.github/workflows/ci.yml`
- [ ] T0.4 EAS project link + `eas.json` (development/preview/production), `runtimeVersion: fingerprint`
  - files: `apps/mobile/eas.json`, `apps/mobile/app.json`
- [ ] T0.5 Move the 12-file docs OS into `docs/`
  - files: `docs/*.md`
- [ ] T0.6 First dev build installs on Android + iPhone
  - files: `apps/mobile/app.json`

## T1 — Firebase foundation (Phase 1 · M1)

- [ ] T1.1 Create `hisab-dev`/`staging`/`prod` Firebase projects, Firestore `asia-south1`, **guarded Blaze** (alerts $1/$10)
  - files: (Firebase console), `infra/firebase.json`
- [ ] T1.2 Install RNFirebase v26 (pinned) + `expo-dev-client`; `newArchEnabled: true`; config plugins; googleServices files (gitignored)
  - files: `apps/mobile/package.json`, `apps/mobile/app.json`, `.gitignore`
- [ ] T1.3 Google sign-in via `react-native-nitro-google-signin` → `signInWithCredential`; create `users/{uid}` on first login
  - files: `apps/mobile/src/data/auth.ts`, `apps/mobile/src/app/welcome.tsx`
- [ ] T1.4 Apple sign-in via `expo-apple-authentication` (iOS); equal prominence, system button
  - files: `apps/mobile/src/data/auth.ts`, `apps/mobile/src/app/welcome.tsx`
- [ ] T1.5 Signed-out routing + sign-out (clears cache + FCM token)
  - files: `apps/mobile/src/app/_layout.tsx`
- [ ] T1.6 `firestore.rules` (default-deny, owner-only) + emulator tests in CI
  - files: `infra/firestore.rules`, `infra/firestore.rules.test.ts`

## T2 — Consent onboarding (Phase 1 · M2)

- [ ] T2.1 Screen 1: notice + affirmative consent button + privacy policy link
  - files: `apps/mobile/src/app/onboarding/notice.tsx`
- [ ] T2.2 Screen 2: default-off channel toggles (SMS/push in V1) with purpose lines
  - files: `apps/mobile/src/app/onboarding/channels.tsx`
- [ ] T2.3 Screen 3: 18+ age gate
  - files: `apps/mobile/src/app/onboarding/age.tsx`
- [ ] T2.4 Consent event logging → `users/{uid}/consentLog`; Settings → Privacy withdrawal
  - files: `apps/mobile/src/data/consent.ts`, `apps/mobile/src/app/(tabs)/settings.tsx`

## T3 — Transactions core (Phase 1 · M2)

- [ ] T3.1 Repository layer: `TransactionRepository` (list/watch/add/update-category), `PlanRepository`, `BudgetRepository`, `DigestRepository`
  - files: `apps/mobile/src/data/*.ts`
- [ ] T3.2 `packages/shared`: category taxonomy (frozen enum), merchant normalization, types
  - files: `packages/shared/taxonomy.ts`, `packages/shared/normalize.ts`, `packages/shared/types.ts`
- [ ] T3.3 Add-transaction form (`react-hook-form` + `zod`): amount, merchant, category chips w/ glyphs, method, datetime, note
  - files: `apps/mobile/src/components/AddTransactionForm.tsx`, `apps/mobile/src/app/add.tsx`
- [ ] T3.4 Home on live data: `dailyTotals` hero, search, tappable rows → detail sheet, recategorize
  - files: `apps/mobile/src/app/(tabs)/index.tsx`, `src/components/TransactionRow.tsx`, `src/components/TransactionSheet.tsx`
- [ ] T3.5 Morning planner persisted to `plans/{yyyy-MM-dd}` (replaces component state)
  - files: `apps/mobile/src/components/MorningPlanner.tsx`, `apps/mobile/src/data/plans.ts`
- [ ] T3.6 Insights/Budgets/Bills/History on live data, paginated (≤50), rollup reads only
  - files: `apps/mobile/src/app/(tabs)/insights.tsx`, `budgets.tsx`, `bills.tsx`, `history.tsx`
- [ ] T3.7 Airplane-mode test: add/edit offline → syncs on reconnect
  - files: (manual QA) + `apps/mobile/src/data/sync.ts` if gaps found

## T4 — Digest pipeline (Phase 1 · M3)

- [ ] T4.1 `onTransactionWrite` trigger: recompute `dailyTotals/{date}` + `budgets/{cat}.spentPaise` (idempotent, `increment()`)
  - files: `apps/functions/src/onTransactionWrite.ts` (+ jest tests)
- [ ] T4.2 `scheduledDigest`: every 15 min, Asia/Kolkata; aggregate → `digests/{date}` → FCM
  - files: `apps/functions/src/scheduledDigest.ts` (+ jest tests)
- [ ] T4.3 FCM lifecycle: permission → token → `fcmTokens` map → refresh → logout cleanup; background handler at module init; tap routing via `msg.data`
  - files: `apps/mobile/src/data/messaging.ts`, `apps/mobile/src/app/_layout.tsx`
- [ ] T4.4 Evening wrap-up card renders `digests/{today}`; planned-vs-actual math
  - files: `apps/mobile/src/components/EveningWrapUp.tsx`
- [ ] T4.5 Two-evening live test on real devices; notification deep-link verified
  - files: (QA)

## T5 — Phase 1 closeout (M4)

- [ ] T5.1 `deleteAccount` Function + in-app flow + web deletion page
  - files: `apps/functions/src/deleteAccount.ts`, `apps/mobile/src/app/(tabs)/settings.tsx`
- [ ] T5.2 `cleanupTokens` scheduled function
  - files: `apps/functions/src/cleanupTokens.ts`
- [ ] T5.3 Play Data Safety draft; privacy policy published; org Play account (D-U-N-S) started
  - files: (console + policy URL)
- [ ] T5.4 Internal Play track + TestFlight builds via `preview`/`production` profiles
  - files: `apps/mobile/eas.json`
- [ ] T5.5 M1–M4 acceptance re-verified: two devices/one account; digest 2 evenings; airplane-mode; rules tests green
  - files: (QA checklist in `docs/progress.md`)

## T6 — SMS auto-capture (Phase 2)

- [ ] T6.1 `packages/shared/sms/`: per-bank pattern pack (HDFC, ICICI, SBI, Axis, Kotak, UPI refs) + test corpus of real formats
  - files: `packages/shared/sms/patterns.ts`, `packages/shared/sms/patterns.test.ts`
- [ ] T6.2 On-device parse service (Android): parse → normalize → repository write `source: "sms"`; raw SMS never leaves phone
  - files: `apps/mobile/src/data/smsIngest.ts` (+ native module/config plugin as needed)
- [ ] T6.3 Progressive permission UX: DPDP SMS toggle → in-context system prompt → fallback to manual
  - files: `apps/mobile/src/app/onboarding/channels.tsx`, `apps/mobile/src/components/SmsOptIn.tsx`
- [ ] T6.4 Play SMS declaration submitted; listing updated; `runtimeVersion` bump + new binary
  - files: (Play console), `apps/mobile/app.json`
- [ ] T6.5 Dedupe v1: same `sourceRef` never ingested twice; cross-source fuzzy match (merchant+amount+date ±24h), priority sms < manual-never-deleted
  - files: `apps/functions/src/onTransactionWrite.ts` (extend), `apps/functions/src/reconcile.ts`
- [ ] T6.6 Single-ingestion test: test UPI payment appears exactly once
  - files: (QA)

## T7 — Hardening & beta (Phase 3)

- [ ] T7.1 Maestro e2e: install → consent → sign-in → add txn → digest received
  - files: `.maestro/` flows
- [ ] T7.2 Read-budget audit: verify <50% of free-tier quotas under beta load; add per-day usage alerts
  - files: (Firebase console), `docs/progress.md`
- [ ] T7.3 Crashlytics triage to ≥99% crash-free; 100-user closed beta (Play internal + TestFlight)
  - files: (console)
- [ ] T7.4 Start TSP commercial conversations (Setu/Finvu/OneMoney: quotes + FIU-of-record confirmation)
  - files: `docs/research.md` (log outcomes)

## T8 — Launch & AA (Phase 4)

- [ ] T8.1 Production Play listing (budgeting-app declaration, Data Safety final) + App Store submission (nutrition labels, Apple Sign-In prominence)
  - files: (consoles)
- [ ] T8.2 Staged rollouts; release branch per production build
  - files: (EAS + git)
- [ ] T8.3 AA integration (post-PMF): TSP SDK/API → consent flow → `source: "bank"` transactions → dedupe priority bank > sms > manual
  - files: `apps/mobile/src/data/aaIngest.ts`, `apps/functions/src/aaWebhook.ts`
- [ ] T8.4 Per-user digest time setting; phone-OTP decision (Firebase vs MSG91)
  - files: `apps/mobile/src/app/(tabs)/settings.tsx`, `docs/discovery.md`
