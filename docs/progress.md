# progress.md — State & Context Tracker

> **Purpose:** The running log across AI sessions. Agents don't retain memory between chats — this file does. Update it at the end of every work session: what was done, what's in progress, what's next, what's blocked.

## Current status (2026-09-21)

**Phase:** Phase 0 — repo & agent OS in progress. App is UI-complete on sample data; no backend yet.

## Done

- [x] 2026-09-21 — Expo app scaffolded (SDK 57, RN 0.86, Expo Router), 3 tabs → expanded to 5 (Home/Insights/Budgets/Bills/History)
- [x] 2026-09-21 — Morning planner card ("Good morning. What are you going to do?") + Yesterday tab
- [x] 2026-09-21 — Full Liquid Glass redesign (dark, BlurView, orbs, floating tab bar); Hree approved
- [x] 2026-09-21 — Design refinement: category icons, active-tab glow, peak-day chart, tab-bar clearance; fresh screenshots in `preview/`
- [x] 2026-09-21 — Validation: `expo-doctor` 21/21, lint clean, `expo export` ok (web+ios+android)
- [x] 2026-09-21 — Production planning: architecture, Firebase backend decision (Spark, Mumbai, Google Sign-In, FCM)
- [x] 2026-09-21 — `phase-1-firebase-spec.md` written (data model, functions, rules, milestones M1–M4)
- [x] 2026-09-21 — Four-source ingestion decided: manual + SMS (Android) + Gmail alerts + AA via TSP; dedupe engine
- [x] 2026-09-21 — Docs OS started: `discovery.md`, `research.md`, `plan.md`, `progress.md` (this file)
- [x] 2026-09-21 — Deep research complete: Firebase/RN/Expo, Gmail+SMS+AA ingestion, DPDP+store compliance. **Material corrections applied:** (1) Cloud Functions need Blaze, not Spark — Phase 1 starts on guarded Blaze; (2) `gmail.readonly` is a restricted scope + CASA → Gmail deferred to Phase 3+ on demand; (3) startups can't become an FIU directly → AA post-PMF via TSP + FIU partner; (4) Google Sign-In via `react-native-nitro-google-signin`; Apple Sign-In mandatory (Guideline 4.8)
- [x] 2026-09-21 — Docs OS complete: all 12 files (discovery, research, plan, progress + PRD, DESIGN, ARCHITECTURE, AGENTS, PROJECT-BRIEF, TASKS, PLAN, RULES)

## In progress

- [ ] New GitHub repo creation — **waiting on Hree** (deploy key already provided)

## Wave 1 — CI + infra testing (2026-09-22, done)

- `.github/workflows/ci.yml`: `mobile` (node 22, npm cache, `expo lint`, `tsc --noEmit`, `expo-doctor`, `expo export --platform web`), `functions` (`npm ci`, `npm run build`, `npm test`), `rules` (Java 21, `npm ci` in `infra/`, Firestore emulator + jest suite). Triggers on `pull_request` and pushes to `main`.
- `infra/firestore.rules.test.ts`: 19 tests, all passing locally — default-deny for unauthenticated access, owner CRUD on `users/{uid}/**`, cross-user isolation, transaction create validation (int `amountPaise >= 0`, method/category enums, rejects negative/float/string/missing amounts and bad enums), subcollection isolation.
- `infra/firebase.json`: added `emulators` section (Firestore on port 8080). `infra/package.json` + lockfile: jest, ts-jest, `@firebase/rules-unit-testing`, `firebase-tools`. `infra/README.md` documents the exact local command.
- `firestore.rules` unchanged and still aligned with ARCHITECTURE.md section 3 (no weakening).
- Branch protection enabled on `main` of `hreetik97/DalEx`: requires the `ci` status check, no force pushes, no deletions.
- Sandbox note: this dev environment intercepts IPv4 loopback HTTP/2, which breaks the Firestore emulator's data plane; the suite was validated by running the emulator on IPv6 loopback (`FIRESTORE_EMULATOR_HOST=localhost`). CI runners and normal dev machines use the default command unchanged.

## Wave 2 — Screens on live data (2026-09-22, done)

- Home rewritten on live Firestore snapshots: today's IST total hero, search, pull-to-refresh, skeletons, honest empty state, FAB to `/add`, TransactionRow + TransactionSheet (recategorize with optimistic UI).
- `/add` route with `AddTransactionForm` (react-hook-form + zod): ₹ amount → integer paise, merchant, 10 category chips with glyphs, method selector, now/pick-date-time, note; haptic success.
- MorningPlan persisted to `plans/{yyyy-MM-dd}` (before noon only); EveningWrapUp renders `digests/{date}` or computes live (total, count, planned, variance = actual − planned, top-5 merchants).
- Insights: live 7-day IST chart (peak highlight), category bars, UPI-vs-cards split, top merchants, Budget coach cards.
- Budgets: live per-category monthPaise targets (editable), spentPaise progress, on-track/almost/over statuses, month label + days left.
- Bills: full CRUD, IST due-day countdown, autopay toggles, subscriptions section, add/edit sheet, 7-day upcoming total.
- History: paginated (50, load-more doubles), Today/Yesterday/Earlier segments with per-day totals.
- Settings (6th tab): profile, notification prefs (digest toggle, digestTime, morning nudge), Privacy link, two-step delete-account → `deleteAccount` callable → sign-out.
- `/privacy`: consent audit trail, push/SMS grant/withdraw toggles.
- Data-layer fixes: FCM tokens now written to the `fcmTokens` map on the user doc (was a `deviceTokens` subcollection — digest pushes would never have fired); new `prefs.ts`, `account.ts` (`callDeleteAccount`), `isSubscription` on bills, `granted`/`withdrawConsent`/`getConsentState` on consent.
- All green: `tsc --noEmit`, `expo lint`, `expo-doctor` 21/21, `expo export --platform web`.

## Wave 3 — Polish + extras (2026-09-22, done)

- Savings goals: `src/data/goals.ts` (watch/create/update/contribute/delete, paise-validated) + GoalsCard on Home (progress bars, goal-reached state, add/contribute/delete); rules + emulator tests added for `users/{uid}/goals/{goalId}`.
- CSV export from History (up to 2,000 txns, BOM + quoted cells, native share sheet / web download).
- Monthly report card in Insights: month total, daily average, top category, heaviest/lightest days, vs-last-month delta.
- BudgetAlertBanner (rose ≥100%, amber ≥80%, tappable, dismissible per day) on Home + Budgets.
- Morning nudge: daily 08:00 IST local notification via expo-notifications, scheduled only when the toggle is enabled and OS permission granted.
- Accessibility pass: roles/labels/states on all interactive elements, 44pt touch targets.
- Design QA: Liquid Glass unchanged; 150pt spacers, mint discipline, glyph+hue pairing, en-IN money.

## Integration (2026-09-22, done)

- `onTransactionWrite`: budgets are month-scoped — `monthKey` ("yyyy-MM", Asia/Kolkata) with transaction-guarded reset of `spentPaise` on first write of a new month. ARCHITECTURE.md §3–4 updated.
- Locked conventions documented: `variancePaise = total − planned` (positive = overspent); digest at-most-once per user per day; `fcmTokens` map contract on the user doc.
- PRD §4: Functions Node 20 → 22 (Expo/SDK-57-era tooling). discovery.md rows 5/7 marked superseded (Spark→guarded Blaze; Gmail/AA timing). TASKS.md: 26 code-complete subtasks ticked; remaining items are device/console-gated.
- CI repaired: root `npm ci` install job (workspaces share one lockfile), jobs depend on it.
- Web deletion page: `apps/web-delete/index.html` (host at dalex.app/delete) + README.
- `apps/mobile/AGENTS.md`: noted aggressive React Compiler eslint rules (no `Date.now()`, no setState-in-effect).

## Next

1. **Hree's actions (console work I cannot do):** create `hisab-dev`/`staging`/`prod` Firebase projects (`asia-south1`, guarded Blaze, alerts $1/$10); download `google-services.json` + `GoogleService-Info.plist` into `apps/mobile/`; run `eas build --profile development` and install on Android + iPhone
2. Publish privacy policy → replace `https://dalex.app/privacy` placeholder in onboarding + set `aps-environment` to production for store builds
3. Host `apps/web-delete/` at `dalex.app/delete`; publish Play Data Safety; start org Play account (D-U-N-S)
4. Device QA: sign-in (Google + Apple), consent flow, add txn offline → sync, two evenings of digest push, delete-account
5. Phase 2 (T6): Android SMS parsing + dedupe v1

## Blocked / waiting

- Firebase projects + service files — Hree's console action (code is ready; placeholders are gitignored)
- First EAS dev build — needs the above
- Gmail `readonly` verification timeline — pending research
- AA TSP choice (Setu vs Finvu vs others) — pending research

## Session log

| Date | Session | Notes |
|---|---|---|
| 2026-09-21 | Design sprint | Prototype → Liquid Glass → refinement pass. All screenshots delivered |
| 2026-09-21 | Production planning | Architecture, Firebase decision, Phase 1 spec, 4-source ingestion, docs OS kickoff |
| 2026-09-22 | Wave 1: CI + infra testing | `.github/workflows/ci.yml` (mobile/functions/rules), 19 Firestore rules tests passing, branch protection on `main` |
| 2026-09-22 | Full build: waves 1-3 + integration | Functions TS rewrite, Firebase auth/consent/repo layer, all screens on live data, goals/CSV/monthly report/budget alerts/morning nudge, month-scoped budgets, CI repaired, docs reconciled |
| 2026-09-22 | Post-push CI failure + fix | First `main` push failed 2 CI jobs: `apps/functions/.gitignore` `lib/` swallowed `src/lib/*.ts` (build broke in CI) → scoped to `/lib/` and committed the helpers; infra rules job lacked `@types/jest` (standalone `npm ci`, not a workspace) → added devDep. Fix commit `2f7b39c`; CI fully green on all 4 jobs |
