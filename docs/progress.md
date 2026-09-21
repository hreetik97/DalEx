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

## Next

1. New repo from Hree → move `docs/` in → Phase 0 (T0): monorepo, CI, EAS profiles, first dev build
2. Register Play organization account (D-U-N-S) — skips the 12-tester/14-day gate
3. Phase 1 (T1–T5): guarded Blaze Firebase, Google+Apple sign-in, consent flow, manual transactions, digest push, delete-account
4. Phase 2 (T6): Android SMS parsing + dedupe; start TSP commercial conversations

## Blocked / waiting

- **Repo creation + access** — Hree's action. Deploy key provided 2026-09-21: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICHACujLHKV3KgAqL78KBPBxUAYroP/GfS/nKjxHevJw hatch`
- Gmail `readonly` verification timeline — pending research
- AA TSP choice (Setu vs Finvu vs others) — pending research

## Session log

| Date | Session | Notes |
|---|---|---|
| 2026-09-21 | Design sprint | Prototype → Liquid Glass → refinement pass. All screenshots delivered |
| 2026-09-21 | Production planning | Architecture, Firebase decision, Phase 1 spec, 4-source ingestion, docs OS kickoff |
