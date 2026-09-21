# ARCHITECTURE.md — Hisab Architecture Overview

> Durable decisions that won't change during implementation: repo shape, route structure, DB schema, auth model, service boundaries, deployment. Change these only via a PRD update + note in `docs/discovery.md`.

## 1. Monorepo layout

```
hisab/
  apps/mobile/            # Expo app (current prototype moves here as-is)
    src/app/              # Expo Router screens: (tabs)/index, insights, budgets, bills, history
    src/components/       # TransactionRow, GlassCard, BottomSheet, charts…
    src/data/             # Repository layer (see §3) — screens NEVER touch Firestore directly
    src/theme.js          # DESIGN.md tokens
    app.json              # newArchEnabled, plugins, googleServices files
    eas.json
  apps/functions/         # Cloud Functions (Node 20, firebase-functions v6, 2nd-gen)
    src/scheduledDigest.ts
    src/onTransactionWrite.ts
    src/deleteAccount.ts
    src/cleanupTokens.ts
  packages/shared/        # category taxonomy, merchant normalization, SMS pattern pack, types
  infra/                  # firebase.json, firestore.rules, firestore.indexes.json
  docs/                   # the 12-file OS (this set)
```

## 2. Client architecture (apps/mobile)

- **Routing:** Expo Router. `src/app/_layout.tsx` → `(tabs)/_layout.tsx` (floating glass tab bar) → `index` (Home), `insights`, `budgets`, `bills`, `history`. Modal routes: `transaction/[id]` (detail sheet), `add` (add-transaction form).
- **Data layer:** `src/data/` exposes repository interfaces (`TransactionRepository`, `PlanRepository`, `BudgetRepository`, `DigestRepository`). Screens call repositories; repositories talk to Firestore today and to on-device SMS parsing tomorrow. **No `firestore()` imports outside `src/data/`.**
- **State:** React Query-style caching is overkill for V1 — repositories return Firestore snapshot listeners for lists, one-shot reads for rollups. Component state only for ephemeral UI (sheet open, search text).
- **Offline:** Firestore persistence is on by default; repositories surface `fromCache` metadata so UI can show a subtle "syncing…" state. Last-write-wins is acceptable (single-user data).
- **Native modules** (`@react-native-firebase/*`, nitro google-signin, apple-auth): dev build required. `app.json` sets `newArchEnabled: true`, config plugins for each RNFirebase package, `googleServicesFile` paths, iOS `UIBackgroundModes: ["remote-notification"]` + `aps-environment`.

## 3. Firestore schema (asia-south1)

Money = **integer paise**. All user data under `users/{uid}`.

```
users/{uid}
  displayName, email, photoURL, createdAt, timezone ("Asia/Kolkata")
  notifPrefs: { eveningDigest: true, digestTime: "21:00", morningNudge: false }
  fcmTokens: { {token}: { platform, updatedAt } }     # array semantics via map
  consentLog: [{ purpose, grantedAt, noticeVersion }] # DPDP audit trail

users/{uid}/transactions/{txnId}
  amountPaise: int ≥ 0, merchantRaw, merchant (normalized), category (taxonomy enum),
  method: upi|card|netbanking|cash, txnAt: ts, source: manual|sms|email|bank,
  sourceRef: string, note?, createdAt, updatedAt

users/{uid}/plans/{yyyy-MM-dd}        { items: [{ id, label, estimatePaise }], createdAt }
users/{uid}/digests/{yyyy-MM-dd}      { totalPaise, txnCount, byCategory{}, byMethod{},
                                        plannedPaise, variancePaise,
                                        topMerchants: [{merchant,totalPaise,count}] (≤5), sentAt }
users/{uid}/dailyTotals/{yyyy-MM-dd}  { totalPaise, txnCount, byCategory{}, byMethod{} }  # trigger-maintained
users/{uid}/budgets/{categoryId}       { monthPaise, spentPaise }                            # trigger-maintained
users/{uid}/bills/{billId}            { name, amountPaise, dueDay, autopay: bool, category }
```

**Security rules** (`infra/firestore.rules`): default-deny; `users/{uid}/**` readable/writable only by `request.auth.uid == uid`; `transactions` create-validates `amountPaise is int ≥ 0`, `method` in enum, `category` in taxonomy. Rules are tested in CI with the Emulator Suite (`@firebase/rules-unit-testing`).

**Indexes** (`infra/firestore.indexes.json`): committed for every composite query (e.g., `transactions` ordered by `txnAt` desc filtered by `category`).

## 4. Cloud Functions (apps/functions)

**Billing: guarded Blaze is mandatory** (Spark cannot deploy Functions). Guardrails: billing alerts at $1/$10, `maxInstances` on every function, Firestore per-day usage alerts. Expected early usage stays inside free allowances (2M invocations/mo etc.).

| Function | Trigger | Job |
|---|---|---|
| `scheduledDigest` | `onSchedule("every 15 min", asia-south1, Asia/Kolkata)` | Users past `digestTime` with no digest today → aggregate → write `digests/{date}` → FCM data+notification message |
| `onTransactionWrite` | `onDocumentCreated/Updated/Deleted` on `transactions/{txnId}` | Recompute `dailyTotals/{date}` + `budgets/{cat}.spentPaise` with `increment()`; idempotent |
| `deleteAccount` | `onCall` (authed) | Wipe `users/{uid}` subtree + delete Auth user (DPDP erasure; used by in-app + web flows) |
| `cleanupTokens` | `onSchedule("daily")` | Drop FCM tokens with repeated `NotRegistered` |

No function handles raw SMS (on-device only, Phase 2) or full email bodies (Phase 3+ polling stores parsed fields only).

## 5. Auth model

- Firebase Auth. V1: Google (via `react-native-nitro-google-signin`, One Tap / Credential Manager; SHA-1/SHA-256 registered) + Apple (`expo-apple-authentication`, iOS real-device only; `OAuthProvider('apple.com')` + SHA-256 nonce; capture `fullName` on first sign-in).
- Anonymous sign-in allowed pre-account; linked on upgrade.
- Every backend read/write is authorized by `request.auth.uid`; callable functions re-verify `request.auth`.

## 6. Push (FCM) data flow

App: `requestPermission()` (iOS prompt; Android 13+ `POST_NOTIFICATIONS`) → `getToken()` (iOS: resolve `getAPNSToken` first) → write into `users/{uid}/fcmTokens` → `onTokenRefresh` re-saves → logout: `deleteToken()` + remove entry. `setBackgroundMessageHandler` registered at module top level. Tap routing from `msg.data` via `getInitialNotification` / `onNotificationOpenedApp`. iOS: APNs .p8 key uploaded to Firebase console. **No promotional pushes — transactional/service only.**

## 7. Ingestion & dedupe (Phase 2+)

- **SMS (Android):** `packages/shared/sms/` pattern pack parses on-device → repository writes `source: "sms"` transactions. Raw SMS never leaves the phone.
- **Bank (AA, Phase 3+):** TSP + regulated FIU partner → consented `ONETIME`/`PERIODIC` pulls → `source: "bank"`.
- **Email (Phase 3+, gated):** scheduled polling Function, sender-scoped Gmail queries → `source: "email"`; bodies discarded after parsing.
- **Dedupe:** `onTransactionWrite` + nightly reconciliation; key = normalized merchant + amountPaise + date + method within ±24h, fuzzy merchant match; priority bank > email > sms > manual; manual never auto-deleted; all `sourceRef`s preserved and shown in the detail sheet ("seen via SMS + email").

## 8. Environments & deployment

- Firebase projects: `hisab-dev`, `hisab-staging`, `hisab-prod`. Client config via `app.config.js` env; prod secrets in EAS Secrets; `google-services.json` / `GoogleService-Info.plist` per variant, gitignored.
- **EAS profiles:** `development` (dev client, internal), `preview` (internal QA; APK on Android), `production` (`autoIncrement: true`). Channels map to EAS Update channels.
- **OTA discipline:** EAS Update = JS + assets only. Any native change (permissions, plugins, SDK) → new binary + `runtimeVersion: { policy: "fingerprint" }`.
- **CI (GitHub Actions, every PR):** `expo lint`, `tsc --noEmit`, `expo-doctor`, Functions jest, Firestore rules tests on emulator (Java 21+), `expo export --platform web` smoke.
- **Release train:** SemVer product versions; monotonic `versionCode`/`buildNumber`; staged rollouts (Play %, iOS phased release); release branch per production build.
