# infra

Deployment config for Hisab's Firebase backend. Firebase projects: `hisab-dev`, `hisab-staging`, `hisab-prod` (create via console; region `asia-south1` / Mumbai for Firestore).

## Files

- `firestore.rules` — default-deny; all data under `users/{uid}/**`, owner-only. Transactions validate `amountPaise` (int ≥ 0), `method` and `category` enums on create.
- `firestore.indexes.json` — composite indexes for transaction queries. Deploy with `firebase deploy --only firestore:indexes`.
- `firebase.json` — points the CLI at `firestore.rules`, indexes, and `apps/functions`.
- `eas.json` — profiles: `development` (dev client, internal), `preview` (internal), `production` (auto-increment, Play/App Store channels).

## Cost guardrails (guarded Blaze — mandatory, Spark cannot deploy Functions)

1. Billing budget alerts at $1 and $10 in Google Cloud Console.
2. `maxInstances` set on every function in `apps/functions/src/index.js`.
3. Firestore per-day usage alerts.
4. Expect early usage to sit inside free allowances (2M function invocations/mo etc.).

## Deploy order

```bash
firebase use hisab-prod
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
```
