# PLAN.md — Phased Implementation Plan

> Tracer-bullet vertical slices. Each slice ends with something **runnable** — a build on a phone doing a real thing. Slices are ordered so no work is thrown away; later slices extend earlier ones. Maps to TASKS.md and PRD §8.

## Slice 0 — Repo, CI, dev build (T0)

**Build:** monorepo scaffold; docs OS moved in; CI green on PRs; EAS `development` build installs on Android + iPhone.
**Runnable end:** Hree installs the dev build and sees the current Liquid Glass UI (still sample data).
**Gates:** branch protection on; no secrets in git.

## Slice 1 — Auth + consent + empty Home (T1, T2)

**Build:** guarded Blaze Firebase projects (`asia-south1`); Google + Apple sign-in; 3-screen DPDP consent; `users/{uid}` created; Home renders ₹0 empty state honestly.
**Runnable end:** fresh install → consent → sign in → empty Home with "add your first expense" CTA. Signed-out and consent-incomplete states route correctly.
**Gates:** rules + emulator tests in CI; no data collected pre-consent.

## Slice 2 — Manual transactions end-to-end (T3)

**Build:** repository layer; `packages/shared` taxonomy; add-transaction form (`react-hook-form` + `zod`); Home list/search/detail/recategorize; morning planner persisted; Insights/Budgets/Bills/History on live rollups.
**Runnable end:** user adds a ₹450 Swiggy UPI payment offline in airplane mode → it appears, categorised Food, syncs on reconnect; planner + budgets reflect it.
**Gates:** no screen imports Firestore directly; lists paginated; read budget respected.

## Slice 3 — Evening digest push (T4)

**Build:** `onTransactionWrite` rollups; `scheduledDigest` Function; FCM lifecycle; wrap-up card with planned-vs-actual.
**Runnable end:** at ~21:00 IST the phone buzzes with "You spent ₹1,240 today across 6 payments"; tapping opens the wrap-up. Verified two evenings running.
**Gates:** `maxInstances` set; billing alerts live; digest math unit-tested.

## Slice 4 — Account deletion + internal builds (T5)

**Build:** `deleteAccount` Function; in-app + web deletion; `cleanupTokens`; Data Safety draft; privacy policy live; internal Play + TestFlight builds.
**Runnable end:** tester deletes account in-app → `users/{uid}` gone, Auth user gone; internal builds distributed to 12+ testers.
**Gates:** org Play account (D-U-N-S) in progress; M1–M4 acceptance re-verified.

## Slice 5 — Android SMS auto-capture (T6)

**Build:** `packages/shared/sms` pattern pack + corpus; on-device parse service; progressive permission UX behind the DPDP toggle; Play SMS declaration; dedupe v1.
**Runnable end:** a real UPI payment SMS arrives → transaction appears once, categorised, with an "SMS" source badge; raw SMS never left the phone.
**Gates:** declaration approved (or documented fallback: manual + email later); new binary + `runtimeVersion` bump + disclosures updated.

## Slice 6 — Beta hardening (T7)

**Build:** Maestro e2e; read-budget audit; Crashlytics triage; 100-user closed beta; TSP commercial conversations started.
**Runnable end:** 7-day beta: ≥99% crash-free, digest habit forming, Firestore <50% of free quotas.
**Gates:** beta feedback triaged; no P0 crashes; consent logs auditable.

## Slice 7 — Public launch (T8, minus AA)

**Build:** production listings (Play as budgeting app; App Store with Apple Sign-In + nutrition labels); staged rollouts; release branches.
**Runnable end:** public Play listing live; App Store approved; release train running (OTA for JS, monthly native builds).

## Slice 8 — Bank sync via AA (T8.3, post-PMF)

**Build:** TSP integration; AA consent flow; `source: "bank"` ingestion; dedupe priority bank > email > sms > manual.
**Runnable end:** user links HDFC via AA → last 90 days of statements import once, no duplicates against SMS-captured items.
**Gates:** TSP contract + FIU-of-record confirmed; coverage caveats surfaced in UI.

## Explicitly after Slice 8 (gated)

- **Gmail alerts** — only on demonstrated demand (restricted-scope verification + annual CASA).
- **Phone-OTP login** — only when scale justifies SMS billing.
- **Per-user digest time** — when users ask.

## Slice rules

1. Never start a slice whose gates from the previous slice are red.
2. Each slice ships to the `preview` channel for Hree to tap through on a real phone before merging to `main`.
3. A slice that can't be made runnable gets split, not stretched.
