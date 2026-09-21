# DalEx

DalEx is the public repo for **Hisab** — an India-first expense tracker that stops surprise credit-card bills: a morning planner, expense capture through the day, and an evening digest comparing planned vs actual spend.

Android and iOS share one Expo/React Native codebase. Firebase (Firestore `asia-south1` + Cloud Functions + FCM) is the backend.

## Monorepo layout

| Path | What it is |
|---|---|
| `apps/mobile/` | Expo SDK 57 app (React Native, Expo Router). The working UI prototype lives here. |
| `apps/functions/` | Cloud Functions v2 (Node 22): transaction rollups, evening digest, token cleanup, account deletion. |
| `packages/shared/` | Shared JS: paise money helpers, category taxonomy, dedupe normalization. Used by mobile and functions. |
| `infra/` | `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `eas.json` (dev/preview/production profiles). |
| `docs/` | The full product OS: `PRD.md` (start here), `ARCHITECTURE.md`, `DESIGN.md`, `TASKS.md` (T0–T8), `PLAN.md`, `AGENTS.md`, `RULES.md`, plus discovery/research notes. |

## Status

UI prototype complete on sample data (Liquid Glass dark design, approved). Production build — auth, Firestore wiring, Cloud Functions — follows `docs/TASKS.md` and `docs/PLAN.md`.

## Quick start

```bash
# mobile (needs an EAS development build for native Firebase modules)
cd apps/mobile && npm install && npx expo run:ios   # or run:android

# functions (Node 22)
cd apps/functions && npm install && npm run serve
```

## Rules for AI agents

Read `docs/AGENTS.md` and `docs/RULES.md` before writing code. Key ones: money is integer paise, screens talk to Firestore only through a repository layer, never restyle the locked design tokens, and never guess at unclear requirements — ask.
