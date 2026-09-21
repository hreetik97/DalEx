# plan.md — Phased Roadmap

> **Purpose:** The phased roadmap — what gets built, in what order, with clear deliverables and done-criteria. Every phase ends with something runnable. No dead-end tasks: each phase's output is used by the next.

## Phase 0 — Repo & agent OS (Week 1)

**Deliverables**
- New GitHub repo (monorepo): `apps/mobile`, `apps/functions`, `packages/shared`, `infra/`, `docs/`
- Current Expo app moved into `apps/mobile` as-is (design work preserved)
- Branch protection on `main`; CI on every PR: `expo lint`, `tsc --noEmit`, `expo-doctor`
- The 12-file docs OS in `docs/` (this file set)
- EAS project linked (`eas.json`: development / preview / production profiles)

**Done when:** PR checks run green; `eas build --profile development` produces an installable dev build.

## Phase 1 — Firebase backend, manual entry (Weeks 2–5)

**Deliverables**
- M1: Firebase projects (dev/staging/prod, `asia-south1`); Google Sign-In → `users/{uid}`; signed-out state
- M2: `src/data/` repository layer; add-transaction flow → Firestore; list/search/detail/recategorize on live data; offline works, syncs on reconnect; DPDP consent screen; Play Data Safety draft
- M3: `onTransactionWrite` rollups (`dailyTotals`, `budgets/{cat}.spentPaise`); `scheduledDigest` Cloud Function → digest doc + FCM ~21:00 IST; Evening Wrap-Up renders from `digests/{date}`
- M4: Morning plan persisted (`plans/{date}`); planned-vs-actual; budgets + bills on Firestore; Apple Sign-In; rules unit tests in CI; internal Play track + TestFlight builds

**Done when:** Two devices on one account see the same data; digest push arrives two evenings running; airplane-mode test passes.

## Phase 2 — Automated ingestion (Weeks 6–10)

**Deliverables**
- 2a: `packages/shared` — category taxonomy (frozen), merchant normalization, per-bank SMS pattern pack with test corpus
- 2b: Android on-device SMS parsing → `source:"sms"` transactions; Play declaration submitted (Play explicitly permits "SMS-based money management" via declaration; approval case-by-case — manual stays as fallback)
- Dedupe engine v1: merchant+amount+date fuzzy match (±24h), priority sms < manual-never-deleted, `sourceRef` preserved, nightly reconciliation
- TSP commercial conversations started (Setu/Finvu/OneMoney: quotes + FIU-of-record confirmation) so terms don't block Phase 3

**Done when:** A test UPI payment appears once (not 2–3×) from SMS; dedupe verified against manual entries.

**Deferred (gated):**
- Gmail transaction alerts → Phase 3+, only on demonstrated user demand (`gmail.readonly` is a restricted scope: verification + recurring CASA assessment, est. $500–4.5K/yr)
- Account Aggregator bank sync → post-PMF, via licensed TSP + regulated FIU partner (startups can't become an FIU directly)

## Phase 3 — Hardening & beta (Weeks 11–13)

**Deliverables**
- Firestore rules fuzz/hardening; delete-account Function (DPDP erasure)
- Privacy policy published; consent screens finalized
- Maestro e2e: install → consent → sign in → add txn → digest received
- 100-user closed beta (Play internal + TestFlight); Crashlytics triage; read-budget audit vs free tier

**Done when:** Beta cohort completes 7 days with <1% crash-free sessions below 99%; Firestore usage <50% of free quotas.

## Phase 4 — Launch & scale prep (Weeks 14+)

**Deliverables**
- Production Play listing + App Store submission (finance-app review notes prepared)
- Blaze billing with budget alerts ($10/$50); phone-OTP decision (Firebase vs MSG91)
- AA consent UX polished; per-user digest time setting
- Post-launch: weekly release train via `eas update` (JS-only) + monthly native builds

**Done when:** Public Play listing live; App Store approved.

## Dependencies & critical path

```
Phase 0 (repo+CI+EAS) ──→ Phase 1 (backend+manual) ──→ Phase 2 (ingestion) ──→ Phase 3 (beta) ──→ Phase 4 (launch)
                              │                              │
                    Gmail verification              AA TSP contract
                    (start early, weeks)            (start early, weeks)
```

Gmail scope verification and the AA TSP contract are the two long-lead items — **both are now deferred** (Gmail to Phase 3+ on demand, AA to post-PMF), so Phase 1–2 have no external-gating dependencies. Start TSP commercial conversations during Phase 2 anyway, so terms don't block Phase 3.

## What's explicitly NOT in this plan

- Phone OTP login (Phase 4 decision at earliest)
- iOS SMS (impossible), credential-based bank scraping (forbidden)
- Web app parity, multi-currency, shared/household accounts, investment tracking
