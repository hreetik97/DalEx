# apps/functions — Hisab Cloud Functions (TypeScript)

Cloud Functions v2, Node 22, region `asia-south1`. firebase-functions v6, firebase-admin v13.

| Export | Trigger | Job |
|---|---|---|
| `onTransactionCreated/Updated/Deleted` | Firestore `users/{uid}/transactions/{txnId}` | Delta-based rollups: `dailyTotals/{yyyy-MM-dd}` (totalPaise, txnCount, byCategory, byMethod) + `budgets/{category}.spentPaise` via `FieldValue.increment()` |
| `scheduledDigest` | every 15 min, Asia/Kolkata | Users past `digestTime` (default 21:00 IST) with no digest today: aggregate → `digests/{yyyy-MM-dd}` → one FCM message ("Evening wrap-up") |
| `cleanupTokens` | daily 03:00 Asia/Kolkata | Prune `fcmTokens` entries with 3+ consecutive failures or permanent NotRegistered |
| `deleteAccount` | callable (authed) | BulkWriter recursive delete of `users/{uid}/**` + Auth user (DPDP erasure) |

## Conventions

- Money is **integer paise**; non-integer or negative amounts are ignored by triggers.
- User-facing day keys are **Asia/Kolkata** (`src/lib/time.ts`).
- `variancePaise = totalPaise - plannedPaise` (positive = overspent vs plan).
- Pure logic lives in `src/lib/` and is unit-tested without the emulator.
- Every function sets `maxInstances`. No raw SMS, email bodies, or credentials touch Firestore.
- Budget rollups follow `docs/ARCHITECTURE.md` (`budgets/{categoryId}.spentPaise`); monthly reset is still an open product decision — see below.

## Commands

```bash
npm install
npm test          # jest unit tests
npm run build     # tsc -> lib/
npx tsc --noEmit  # typecheck
npm run lint
npm run serve     # emulators: functions + firestore
npm run deploy    # firebase deploy --only functions
```

Deploy targets per environment: `firebase use hisab-dev|hisab-staging|hisab-prod` first.

## Guarded Blaze guardrails (mandatory — Spark cannot deploy Functions)

1. Google Cloud billing **budget alerts at $1 and $10**.
2. `maxInstances` on every function (10 rollups, 3 digest, 1 cleanup, 5 deleteAccount).
3. Firestore per-day read/write usage alerts.
4. Early usage is expected to stay inside free allowances (2M invocations/mo).

## Emulator testing

```bash
npm run serve
# In another shell, exercise triggers:
# firebase emulators:start covers functions+firestore; write a transaction doc
# to users/test/transactions/t1 in the Emulator UI and watch dailyTotals update.
```

## Open decisions (flagged for docs update)

- PRD §4 pins Functions to **Node 20**; this package targets **Node 22** (firebase-functions v6 supports it). Confirm which the release uses.
- `variancePaise` sign convention (total − planned, positive = overspent) needs confirming in PRD.
- `budgets/{categoryId}.spentPaise` accumulates across months with no reset; needs a monthly-reset decision (month-scoped keys or a scheduled reset).
