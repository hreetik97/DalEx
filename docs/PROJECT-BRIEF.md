# PROJECT-BRIEF.md — Hisab at a Glance

> Fast context for the agent. One page; if it grows, something belongs in PRD/ARCHITECTURE instead.

**Product (one paragraph):** Hisab is an Indian expense tracker that ends the "surprise credit card bill." It captures UPI, card, and bank transactions automatically (on-device SMS parsing on Android, bank sync via Account Aggregator later; manual entry always available), shows a simple evening digest of everything spent with planned-vs-actual, and greets the user each morning with "What are you going to do?" to plan the day's spending. Dark, frosted "Liquid Glass" UI; Android + iOS from one Expo codebase.

**Primary personas:** (1) Priya, 28, Bengaluru — pays everything by UPI + one credit card, dreads the monthly bill, non-technical, Android. (2) Arjun, 34, Mumbai — iPhone user, same anxiety, will use manual entry + bank sync (iOS can't read SMS).

**Tech stack (one line):** Expo SDK 57 + React Native 0.86 + Firebase (guarded Blaze, Firestore in Mumbai `asia-south1`, Cloud Functions, FCM) + EAS builds; monorepo `apps/mobile`, `apps/functions`, `packages/shared`.

**Current phase:** Phase 0 — agent OS docs complete; UI prototype done on sample data; **no backend yet**. Blocked on: new GitHub repo creation (Hree's action). Next: monorepo + CI + EAS dev build, then Phase 1 (Firebase core app, manual entry, evening digest push).

**Non-negotiables:** no credentials in chat (vault/deploy key only); iOS SMS is impossible — never propose it; no bank credential scraping, ever; raw SMS never leaves the device; financial data stays in India; DPDP consent before collection.
