# infra

Deployment config for Hisab's Firebase backend. Firebase projects: `hisab-dev`, `hisab-staging`, `hisab-prod` (create via console; region `asia-south1` / Mumbai for Firestore).

## Files

- `firestore.rules` — default-deny; all data under `users/{uid}/**`, owner-only. Transactions validate `amountPaise` (int ≥ 0), `method` and `category` enums on create.
- `firestore.indexes.json` — composite indexes for transaction queries. Deploy with `firebase deploy --only firestore:indexes`.
- `firebase.json` — points the CLI at `firestore.rules`, indexes, and `apps/functions`. Includes an `emulators` section (Firestore on port 8080).
- `firestore.rules.test.ts` — security-rules test suite (`@firebase/rules-unit-testing` + jest + ts-jest). Covers default-deny, owner CRUD, cross-user isolation, and transaction create validation.
- `eas.json` — profiles: `development` (dev client, internal), `preview` (internal), `production` (auto-increment, Play/App Store channels).

## Running the rules tests locally

Prerequisites: Node 22, Java 17+ (the Firestore emulator needs it).

```bash
cd infra
npm install
npm run test:emulator
```

That expands to:

```bash
npx firebase emulators:exec --only firestore "npx jest firestore.rules.test.ts"
```

The emulator starts on port 8080 (per `firebase.json`), jest runs the suite against it, and the emulator shuts down when the tests finish. To run jest directly against an already-running emulator, start it in one terminal with `npx firebase emulators:start --only firestore` and run `npx jest firestore.rules.test.ts` in another.

The suite connects to the emulator host in `FIRESTORE_EMULATOR_HOST` (default `127.0.0.1`; a `host:port` or `[::1]:port` value is accepted — the port suffix is stripped). In sandboxed environments where IPv4 loopback breaks the emulator's data plane (`http2 exception`), bind the emulator to IPv6 loopback first, then run jest in a second terminal:

```bash
# terminal 1 — temporarily bind to ::1 (do not commit this change)
python3 - <<'EOF'
import json
p = 'firebase.json'
d = json.load(open(p))
d['emulators']['firestore']['host'] = '::1'
d['emulators']['hub']['host'] = '::1'
json.dump(d, open(p, 'w'), indent=2)
EOF
npx firebase emulators:start --only firestore
# terminal 2
FIRESTORE_EMULATOR_HOST=localhost npx jest firestore.rules.test.ts
# terminal 1 — restore: git checkout firebase.json
```

`localhost` resolves to `::1` first, which the sandboxed network allows. Note `emulators:exec` overwrites `FIRESTORE_EMULATOR_HOST` with its own `host:port`, so the two-terminal flow is required in such environments; CI runners use the default one-shot command unchanged.

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
