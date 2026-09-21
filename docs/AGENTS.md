# AGENTS.md — Repository Rules for the AI Agent

> You are working in the Hisab monorepo. These rules outrank your defaults. The user outranks this file. Deeper `AGENTS.md` files win over this one.

## 1. First principles

1. **Read `docs/PROJECT-BRIEF.md`** before any task. Read the relevant doc (`PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`) before touching its area.
2. **Where it is unclear, do not guess — ask the user.** A wrong guess in financial software is worse than a question.
3. **Never second-guess the locked stack** (PRD §4). If a package is deprecated or incompatible, report it with evidence and propose the minimal replacement — don't silently swap.
4. **Specificity > abstraction.** Name exact packages, versions, files, values. "Use a form library" is forbidden; "`react-hook-form` + `zod` in `apps/mobile/src/components/AddTransactionForm.tsx`" is correct.

## 2. Doc discipline (the OS must stay true)

- **PRD.md is the source of truth.** When a decision changes during implementation, update PRD.md in the same PR.
- New foundational decision → append to `docs/discovery.md` §3 table.
- End of every work session → update `docs/progress.md` (done / in progress / next / blocked).
- Domain research with sources → `docs/research.md`, never scattered in chat.
- Keep markdown clean: no horizontal dividers (`---`) in docs, no emojis in doc bodies, tables where comparison helps.

## 3. Expo / React Native (SDK 57)

- **Verify docs before touching any Expo/EAS/RN API:** read the SDK version in `apps/mobile/package.json`, then `https://docs.expo.dev/versions/v57.0.0/` or `https://docs.expo.dev/llms.txt`. Training data is stale — APIs get renamed.
- Install with `npx expo install <pkg>` (never bare npm/yarn) — resolves SDK-compatible versions.
- `newArchEnabled: true` is required (react-native-firebase v26). Pin exact RNFirebase patch versions.
- Native modules (anything in `@react-native-firebase/*`) need a **dev build** — Expo Go can't load them. Use `eas build --profile development`.
- **Never create or edit `ios/`/`android/` by hand** — Continuous Native Generation via `app.json` + config plugins.
- Before declaring work complete: `npx expo lint`, `npx tsc --noEmit`, `npx expo-doctor`. All green or it isn't done.

## 4. Firebase

- **Guarded Blaze from day one** (Functions can't deploy on Spark): budget alerts $1/$10, `maxInstances` on every function, Firestore daily-usage alerts.
- Firestore region is `asia-south1`. Money is **integer paise** — validate in client, rules, and functions.
- All user data under `users/{uid}`; rules default-deny; **every rules change ships with emulator tests** (`@firebase/rules-unit-testing`).
- Screens never import Firestore directly — all access goes through `apps/mobile/src/data/` repositories.
- No raw SMS, no email bodies, no credentials in Firestore. Ever.

## 5. Privacy & compliance by default

- No data collection before the DPDP consent flow completes (PRD F-2).
- New data permission (SMS, Gmail, …) ships as a unit: consent toggle → new binary → `runtimeVersion` fingerprint bump → updated Data Safety + nutrition labels. EAS Update alone is never enough.
- Request permissions **progressively, in context** — never bundle at onboarding.
- Delete-account must actually delete (Function wipes the subtree + Auth user).

## 6. Scope & safety

- Financial figures in code comments, tests, and screenshots are **sample data** — label them as such.
- Never request or accept credentials, tokens, or keys in chat. Secrets go in EAS Secrets / Secret Manager.
- iOS SMS parsing is impossible — don't propose it, don't scaffold for it.
- No credential-based bank scraping — the only bank route is Account Aggregator via a licensed TSP + regulated FIU partner.
- No promotional push notifications — transactional/service only.
