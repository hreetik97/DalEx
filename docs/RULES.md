# RULES.md — AI Coding Standards

> Project-specific conventions the agent must follow. Violations are bugs.

## 1. Authentication & authorization

- Every Firestore document lives under `users/{uid}/`. No top-level user-data collections.
- Security rules default-deny. The only allow rule is `request.auth.uid == uid` on that user's subtree, plus field validation on `transactions` create (amountPaise int ≥ 0, method/category in enum).
- Callable Cloud Functions must re-verify `request.auth` — never trust client-passed uids.
- Auth state drives routing: signed-out → welcome; consent-incomplete → consent flow; authed → tabs. No screen renders user data before both gates pass.

## 2. Money

- Integer paise in storage, rules, functions, and business logic. Convert to ₹ only at the render boundary (`inr()` in theme).
- Never use floats for money. Never show paise to users (₹989, not ₹989.00). `en-IN` grouping always.

## 3. Data access

- Screens import from `apps/mobile/src/data/` repositories only. Direct `firestore()` imports outside `src/data/` fail review.
- Lists are paginated (limit 50). Render paths use pre-aggregated docs (`dailyTotals`, `digests`) — never full-collection scans. The free-tier read budget (50k/day) is a design constraint, not an afterthought.
- Offline-first: handle the `fromCache` state; writes must succeed offline and sync later.

## 4. Code style

- JavaScript, Expo Router, functional components + hooks. Keep non-route code out of `src/app/`.
- Design tokens from `src/theme.js` only — no hardcoded colors, radii, or spacing in components.
- Category display = glyph + hue together (per DESIGN.md) — never a bare colored dot.
- Forms: `react-hook-form` + `zod`; validate on submit, show inline errors, disable submit while invalid.
- No `console.log` in shipped code. Errors go to Crashlytics with a user-safe fallback UI.

## 5. Privacy in code

- Raw SMS text: parsed on-device, never logged, never uploaded, never in Crashlytics breadcrumbs.
- Email bodies (when Gmail lands): parsed server-side, discarded immediately, never persisted.
- Never log PII (names, emails, tokens, amounts with merchants) — log ids and counts.

## 6. Markdown & docs

- No horizontal dividers (`---`) in any doc. No emojis in doc bodies (status glyphs like ✅/🔬 allowed only in `research.md`/`progress.md` trackers).
- One idea per heading; tables for comparisons; checkboxes for acceptance criteria.
- Every doc states its purpose in a blockquote on line 1.

## 7. Testing & definition of done

- New repository method → unit test. New rules → emulator test. New Function → jest test with mocked Firestore.
- PR checklist: `expo lint` clean, `tsc --noEmit` clean, `expo-doctor` clean, new tests pass, PRD.md updated if any decision changed, `docs/progress.md` updated.
- A feature is done when its PRD acceptance checkboxes are ticked **and** verified on a real device (dev build), not just the web export.

## 8. Commits & PRs

- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`), scoped by package (`feat(mobile):`, `feat(functions):`).
- PRs are small and single-purpose; link the PRD section and TASKS.md items they close.
- Never commit `google-services.json`, `GoogleService-Info.plist`, `.env`, or any secret. They are gitignored and injected via EAS Secrets.
