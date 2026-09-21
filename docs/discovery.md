# discovery.md — Project Intake for Hisab

> **Purpose:** The intake form for the AI agent. Captures the *why* behind the project and every key question already answered, so the agent never re-asks. Update this file when a new foundational decision is made.

## 1. Project intent (the why)

**Hisab** is a mobile expense tracker for India that ends the "surprise credit card bill" problem. Indians make dozens of small UPI, credit-card, and RuPay credit-card payments daily; the money leaks invisibly and the bill arrives as a shock.

The core loop:
1. **Morning** — "Good morning. What are you going to do?" The user plans the day's spending.
2. **All day** — every transaction is captured automatically (SMS, email alerts, bank sync) or entered manually.
3. **Evening** — a digest shows everything spent today, planned vs actual, by category and payment method.

If the loop works, there are no more surprise bills.

## 2. Target user

- Indian consumers who pay via UPI + credit cards daily
- Android-first reality (SMS parsing is Android-only), iOS supported via email/bank/manual
- Non-technical; the app must feel effortless, not like accounting software

## 3. Product decisions already made (do not re-ask)

| # | Question | Answer | Date |
|---|---|---|---|
| 1 | Platforms? | Android + iOS, one shared codebase via **Expo SDK 57** + React Native + Expo Router | 2026-09-21 |
| 2 | Design language? | Dark "Liquid Glass" (iOS-26-style): frosted BlurView cards, ambient gradient orbs, floating glass tab bar. **Hree likes it — keep it.** | 2026-09-21 |
| 3 | Tabs? | Home, Insights, Budgets, Bills, History — floating 5-tab bar | 2026-09-21 |
| 4 | Design-first or production-first? | Design first (done) → now production planning | 2026-09-21 |
| 5 | Backend? | **Firebase**: Spark free tier, Firestore in `asia-south1` (Mumbai), Cloud Functions, FCM. Blaze only when phone OTP or quota headroom demands it | 2026-09-21 |
| 6 | Auth V1? | Google Sign-In (free). Apple Sign-In before iOS submission. Phone OTP **deferred** to Phase 3+ (needs Blaze + per-SMS billing) | 2026-09-21 |
| 7 | Transaction ingestion? | **Four sources**: manual entry (Phase 1) + on-device SMS parsing (Android, Phase 2) + Gmail transaction alerts (both platforms, Phase 2) + bank sync via Account Aggregator TSP partner e.g. Setu/Finvu (both platforms, Phase 2). Cross-source **dedupe engine** | 2026-09-21 |
| 8 | iOS SMS? | **Impossible** — Apple provides no SMS API. iOS gets email + bank + manual | 2026-09-21 |
| 9 | Bank scraping? | **Forbidden** — no credential-based scraping. AA network only | 2026-09-21 |
| 10 | Money storage? | Integer paise, never floats | 2026-09-21 |
| 11 | SMS privacy? | Parsed **on-device**; raw SMS never leaves the phone | 2026-09-21 |
| 12 | Email privacy? | Gmail `readonly`, filtered to bank alert senders only; store parsed fields, never full bodies | 2026-09-21 |
| 13 | Repo? | Hree will create a new repo and grant access (deploy key provided). **Pending his action** | 2026-09-21 |
| 14 | Monorepo? | `apps/mobile` (current Expo app moves in), `apps/functions` (Cloud Functions), `packages/shared` (taxonomy, SMS patterns, types), `infra/` | 2026-09-21 |
| 15 | Blaze or Spark? | **Guarded Blaze from day one** — Cloud Functions can't deploy on Spark. Billing alerts $1/$10, `maxInstances` caps; spend stays $0 inside free allowances | 2026-09-21 |
| 16 | Google Sign-In package? | `react-native-nitro-google-signin` (One Tap) — the old `@react-native-google-signin` uses Google's deprecated legacy SDK | 2026-09-21 |
| 17 | Apple Sign-In timing? | **V1, mandatory** — App Store Guideline 4.8 requires it alongside Google login | 2026-09-21 |
| 18 | `newArchEnabled`? | **On** — required by react-native-firebase v26; pin exact patch versions | 2026-09-21 |
| 19 | Gmail ingestion timing? | **Deferred to Phase 3+, gated on demand** — `gmail.readonly` is a restricted scope: verification + recurring CASA assessment (est. $500–4.5K/yr), fragmented bank coverage | 2026-09-21 |
| 20 | Bank sync route/timing? | **Post-PMF**, via licensed TSP + regulated FIU partner — startups can't become an FIU directly | 2026-09-21 |
| 21 | SMS permission strategy? | Play explicitly permits "SMS-based money management" via declaration (case-by-case); request progressively in-context, never at onboarding; parse on-device | 2026-09-21 |
| 22 | Play account type? | **Organization (D-U-N-S)** — skips the 12-tester/14-day gate; matches finance-app expectations | 2026-09-21 |
| 23 | DPDP posture? | 3-screen consent (notice + default-off channel toggles + 18+ gate), consent logging, delete-account Function; Rules notified 13 Nov 2025, full compliance by 13 May 2027 | 2026-09-21 |

## 4. Standing constraints (never violate)

1. **Never request or accept credentials in chat.** Secure vault or SSH deploy key only.
2. All financial figures in the current prototype are **sample data** — label as such, never present as the user's spending.
3. iOS cannot read SMS. Do not propose it, do not design around it.
4. No credential-based bank scraping, ever.
5. Financial data stays in India (`asia-south1`).
6. DPDP Act 2023: consent before collection, plain-language purpose, delete-account path.
7. Verify Expo 57 docs before touching any Expo/RN API (`https://docs.expo.dev/versions/v57.0.0/` or `llms.txt`). Training data is stale.
8. `npx expo install` for packages (SDK-compatible versions). Lint + typecheck before declaring work complete.
9. Never hand-edit `ios/`/`android/` — Continuous Native Generation via `app.json` + config plugins.

## 5. Open questions (the agent may ask THESE)

- Apple Sign-In now or at M4? (Recommendation: M4)
- Digest time fixed 21:00 IST for V1 or per-user setting? (Recommendation: fixed now)
- Which AA TSP partner — Setu vs Finvu vs others? (Needs research.md §3)
- New repo vs evolve `hisab-app` in place? (Recommendation: new repo, clean history)
- Phone OTP: Firebase phone auth vs Indian provider (MSG91 etc.) when the time comes?
