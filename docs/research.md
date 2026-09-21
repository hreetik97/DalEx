# research.md — Domain Research Store

> **Purpose:** Storage for detailed domain research gathered by sub-agents. Findings land here with sources so context survives across sessions. Each section ends with **Implications for Hisab**. Estimates are labeled; unverified items are marked as such. Research is not legal advice.

_Last updated: 2026-09-21 — deep research complete (report: `research_notes/hisab-ingestion-gmail-sms-aa-20260921-1943/report.md`)._

## 1. Firebase + React Native on Expo SDK 57

**Status:** ✅ researched 2026-09-21

### Findings
- **Stack:** Expo SDK 57 = React Native 0.86 + React 19.2.3 + Node 22.13.x (docs.expo.dev/versions/v57.0.0/, verified live). Our `package.json` already matches (expo ~57.0.24, RN 0.86.3, React 19.2.3). SDK 57 targets Android API 36 — already compliant with Play's API-36 requirement.
- **react-native-firebase v26** requires React Native **New Architecture** for all native modules → set `newArchEnabled: true` in app config (supported SDK 52+). Pin exact patch versions; test with `expo prebuild --clean` (known iOS SPM config-plugin issues upstream).
- Install: `npx expo install expo-dev-client @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/messaging`. **Expo Go cannot load these** — a dev build (`eas build --profile development`) is mandatory.
- **Firestore `asia-south1` (Mumbai) confirmed** (cloud.google.com/firestore locations, verified live). Offline persistence is on by default on iOS/Android.
- **Rules testing:** Emulator Suite + `@firebase/rules-unit-testing` in CI (`firebase emulators:exec --only firestore "jest"`); GitHub Actions needs Java 21+ (firebase-tools 15). Cover: owner-only `users/{uid}/**`, cross-user denial, unauth denial, default-deny.
- **Google Sign-In:** use **`react-native-nitro-google-signin`** (One Tap / Credential Manager). The free `@react-native-google-signin/google-signin` uses Google's deprecated legacy Android SDK — do not build new auth on it. Register SHA-1/SHA-256 fingerprints in Firebase console.
- **Apple Sign-In:** `expo-apple-authentication` (SDK built-in plugin). iOS-only, dev-build-only, **real device only** (not iOS Simulator). `fullName` returned only on first sign-in — capture immediately. Firebase side: `OAuthProvider('apple.com')` with SHA-256 nonce; needs Apple Developer membership + Service ID + .p8 key. **App Store Guideline 4.8 makes Apple Sign-In mandatory when Google login is offered.**
- **FCM lifecycle:** `requestPermission()` → `getToken()` → store per-user token **array** (multiple devices) → `onTokenRefresh` re-save; on logout `deleteToken()` + remove. `setBackgroundMessageHandler` must register at module top level. Tap routing via `getInitialNotification` / `onNotificationOpenedApp`, reading `msg.data`. iOS: upload APNs .p8 key to Firebase console; resolve `getAPNSToken` before `getToken`.
- **⚠️ Cloud Functions require Blaze (billing account) — NOT deployable on Spark.** Free allowances (2M invocations/mo, 400K GB-sec, 200K CPU-sec, 5 GB egress) live on Blaze. Verified live on firebase.google.com/pricing. **Correction to our earlier plan:** Phase 1 needs a guarded Blaze project from the start (budget alerts at $1/$10, `maxInstances` caps). Early usage (~2,880 scheduler invocations/mo) stays inside free allowances.
- Scheduled digest: `onSchedule({ schedule: "every 15 minutes", region: "asia-south1", timeZone: "Asia/Kolkata" })`. Firestore triggers (`onDocumentCreated/Updated/Deleted`) maintain denormalized aggregates. Node 20 runtime is safe; Node 22 also available.

### Implications for Hisab
- Phase 1 starts on **guarded Blaze**, not Spark — a card is required on day one, spend stays $0 via alerts + caps.
- Auth packages: nitro google-signin + expo-apple-authentication (both from the start; Apple is an App Store requirement, not optional).
- `newArchEnabled: true` from the first dev build; pin RNFirebase patches.
- FCM token = array per user; background handler at module init — bake into ARCHITECTURE.md.

## 2. Gmail API for transaction alerts

**Status:** ✅ researched 2026-09-21 → **decision: DEFER until user demand justifies it**

### Findings
- `gmail.readonly` is a **restricted scope** (not merely sensitive). Production needs Google brand verification + **restricted-scope review including a recurring annual CASA security assessment**. Community estimates: review takes weeks–months; CASA ~US$500–4.5K/yr (estimate, not Google-published).
- Google **Limited Use policy**: Gmail-derived data cannot be used for ads, data brokerage, lending, or creditworthiness. Hisab's expense-tracking use is compatible; monetizing the email data later is not.
- For a non-real-time digest, **polling** (scheduled Gmail search over bank senders) is simpler than push (`watch` → Pub/Sub → webhook). Watch subscriptions expire (~7 days) and need reconciliation polling anyway.
- Bank coverage is **fragmented**: HDFC varies by product/time; SBI Card and Axis send transaction emails; ICICI, Kotak, and SBI deposit-account alerts have weak/no evidence. Coverage changes without notice — never promise it.
- UPI is barely covered by email (banks SMS those). Parsing: `mailparser` (Node) + per-sender regex extractors.
- Data minimization: search queries scoped to bank sender addresses, `newer_than:` bounds, fetch bodies only for matches, discard bodies after parsing, honor token withdrawal by deleting tokens + data.

### Implications for Hisab
- **Gmail moves to Phase 3+, gated on demonstrated demand.** The verification cost/time is not worth it before PMF.
- When built: polling Function (not Pub/Sub push), sender-scoped queries, bodies never persisted.

## 3. Account Aggregator (India) — bank integration

**Status:** ✅ researched 2026-09-21 → **decision: DEFER to post-PMF; route = licensed TSP + regulated FIU partner**

### Findings
- **An unregulated startup cannot directly become an FIU** — FIUs must be regulated by RBI/SEBI/IRDAI/PFRDA. Do not confuse with the NBFC-AA licence (the much heavier route to *operating* an Aggregator).
- Viable route: licensed TSP (Setu, Finvu, OneMoney, Perfios/Anumati, CAMS) **plus a regulated FIU partner** — confirm commercially whether a TSP offers a packaged FIU-of-record arrangement.
- Consent flow: mobile OTP / AA login → account discovery → review data type/purpose/range/frequency/duration → approve → FIU fetches. Supports `ONETIME` and `PERIODIC` fetches.
- Coverage: strongest for singly-held savings/CASA; gaps for joint, NRE/NRO, some current accounts, inconsistent deposit coverage.
- Pricing: no public standard pricing. Old OneMoney material ~₹9.90/statement; one 2026 vendor estimate put first-year cost at ₹5–25L over 5–10 months (order-of-magnitude, commercially biased). Get 2–3 quotes when the time comes.
- Ecosystem: ReBIT (technical standards), Sahamati (industry alliance).

### Implications for Hisab
- AA is the long-term iOS bank-data answer, but **not before PMF**. Keep SMS + manual as the always-available fallback given AA coverage gaps.
- Start TSP conversations during Phase 2 so commercial terms don't block Phase 3.

## 4. Android SMS access + Play Store policy

**Status:** ✅ researched 2026-09-21 → **decision: BUILD in Phase 2, after core app; Android only**

### Findings
- Play policy **explicitly permits** the exception: *"SMS-based money management — for example, apps that track and manage budget"* may use `READ_SMS`/`RECEIVE_SMS` subject to declaration and review (support.google.com/googleplay/android-developer/answer/9047303, verified live).
- Approval is **case-by-case**: the feature must be genuinely critical and prominent in listing + product. Policy warns budgeting apps against exfiltrating unrelated/non-financial SMS.
- **SMS Retriever API and SMS User Consent API do NOT substitute** — they serve app-directed OTP flows only, not inbox parsing (verified live).
- Architecture: **parse on-device; upload only normalized fields** (amount, merchant, date, ref, type). Raw SMS never leaves the phone — the privacy posture reviewers want and the DPDP-minimal design.
- Data Safety: disclose Messages (SMS), Financial info, Email, Identifiers; purposes; optional collection; retention/deletion; encryption in transit; no sharing of raw SMS.
- Precedents (Walnut, Money View) are dated — do not cite as current.

### Implications for Hisab
- SMS parsing is viable with a truthful, prominent declaration — but never request the permission at onboarding; request progressively, in context, behind its own DPDP consent toggle.
- Each new permission = new binary + `runtimeVersion` bump + updated store disclosures (EAS Update can't ship native changes).

## 5. DPDP Act 2023 — compliance

**Status:** ✅ researched 2026-09-21 (research, not legal advice)

### Findings
- **DPDP Rules notified 13 Nov 2025** (PIB press release, verified live). Soft enforcement through 2026; **full compliance deadline 13 May 2027**. Penalties up to **₹250 crore** per violation (security safeguards), ₹200 crore for breach-notification failure.
- Notice (Sec 5): standalone, itemised, plain language — what data, purposes, retention, withdrawal, rights. Consent (Sec 6): free, specific, informed, unambiguous, clear affirmative action — no pre-ticked boxes; withdrawable as easily as given.
- Rights (Secs 11–14): information, correction, erasure; grievance redressal (~90-day response). Breach: notify affected users **without delay**; notify the Board without delay with full details **within 72 hours**.
- Retention: delete when purpose fulfilled or consent withdrawn; propagate erasure to processors (delete-account Cloud Function wiping `users/{uid}`).
- Children: under-18 = child; verifiable parental consent required → **Hisab age-gates at 18+** to stay out of this entirely.
- SDF designation unlikely at launch (government-notified). Cross-border transfers permitted unless restricted — `asia-south1` storage is still the safest default. No blanket startup exemption.
- **Onboarding consent pattern (3 screens):** (1) notice + account consent with affirmative button; (2) optional channel consents as independent **default-off toggles** (Gmail / SMS / push), each with its own purpose line — OS permission requested only when its toggle is enabled; (3) 18+ age confirmation. Log every consent event (who/when/purpose/notice version); withdrawal at Settings → Privacy.

### Implications for Hisab
- Build the 3-screen consent flow in Phase 1 M2 — it doubles as Play/App Store review evidence.
- Delete-account = Cloud Function; Play requires **in-app AND web** deletion; Apple requires in-app (Guideline 5.1.1(v)).

## 6. EAS build + store submission

**Status:** ✅ researched 2026-09-21

### Findings
- **EAS profiles:** development (`developmentClient: true`, internal — never to stores), preview (internal QA; APK on Android), production (`autoIncrement: true`). Channels link builds to EAS Update channels.
- **EAS Update carries JS bundle + assets only.** Native modules, permissions, entitlements, SDK version need a **new binary** with `runtimeVersion: { policy: "fingerprint" }` so a bundle can't land on a binary lacking its native APIs.
- **Play:** new apps must target **API 36** (SDK 57 already does). New **personal** accounts face a 12-tester/14-day closed-testing gate — **register as an organization (D-U-N-S)** to skip it and match finance-app expectations. $25 one-time fee. AAB + Play App Signing. Privacy policy URL mandatory. **Financial Features declaration: truthfully a budgeting app, not a lender.** Account deletion in-app AND web. Watch: Android Developer Verification enforcement from Sept 2026 in select regions.
- **Apple:** **Sign in with Apple mandatory** alongside Google (Guideline 4.8), at equal prominence with the system button. In-app account deletion required (5.1.1(v)) — support-email-only fails. Privacy nutrition labels: Financial Info, Contact Info, Identifiers, Usage/Diagnostics; "linked to identity: yes"; tracking: no. **No promotional push** (Guideline 4.5.5) — budget alerts are transactional, fine. Future paid plan = IAP (3.1.1).
- **Release train:** product SemVer; monotonic `versionCode`/`buildNumber` (`autoIncrement: true`); `runtimeVersion: fingerprint`; channels dev → preview → production; staged rollouts (Play %, iOS phased release); release branch per production build.

### Implications for Hisab
- Register the Play account as an **organization** on day one; budget D-U-N-S time.
- Every new data permission (SMS, later Gmail) ships as: consent toggle → new binary → runtimeVersion bump → updated Data Safety/labels. Plan releases around this cadence.
- No promotional notifications ever — product rule, not just review rule.

---
## Research log

| Date | Topic | Method | Result |
|---|---|---|---|
| 2026-09-21 | Firebase Spark free-tier pricing | browser.search | Spark quotas confirmed; phone auth needs Blaze + per-SMS billing since Sep 2024 |
| 2026-09-21 | Deep research: Firebase/RN/Expo, Gmail+SMS+AA, DPDP+stores | browser.deep_research | Full report + 5 channel notes in `research_notes/hisab-ingestion-gmail-sms-aa-20260921-1943/` |
| 2026-09-21 | **Corrections applied to plan** | synthesis | (1) Cloud Functions need Blaze — Phase 1 starts on guarded Blaze; (2) `gmail.readonly` is restricted + CASA → Gmail deferred to Phase 3+; (3) AA via TSP + FIU partner, post-PMF; (4) Google Sign-In via `react-native-nitro-google-signin`; Apple Sign-In mandatory per Guideline 4.8 |

## Open questions (could not verify — do not assert)

1. Exact CASA assessment cost/duration (community estimates only: ~$500–4.5K/yr, weeks–months)
2. ICICI/Kotak/SBI deposit-account and GPay/PhonePe email coverage
3. AA TSP pricing (no public pricing — get 2–3 quotes when relevant)
4. Whether any TSP offers a packaged FIU-of-record arrangement (confirm commercially)
5. RNFirebase v26 latest patch + SDK 57 compatibility (pin + `expo prebuild --clean` at build time)
6. Android Developer Verification rollout timing
