# TESTING.md — How to test Hisab on a real device

> The app uses native Firebase (RNFirebase), so it **cannot** run in Expo Go or a
> web browser — it needs a real native development build on a physical phone.
> This doc is the playbook: Part A is the one-time console setup (Hree),
> Part B is the deploy + build (Muse), Part C is the on-device QA checklist.

## Part A — Firebase console setup (Hree, ~15 min, one time)

Do these in the [Firebase console](https://console.firebase.google.com/), signed in
with the Google account that will own the project.

1. **Create project** `hisab-dev` (name is yours to choose; note the project ID).
   When prompted for region, pick **asia-south1 (Mumbai)** for Firestore.
2. **Upgrade to Blaze** (Project settings → Billing). Cloud Functions don't run on
   Spark. Immediately set budget alerts:
   - Billing → Budgets & alerts: create a budget at **₹100 (~$1)** = alert,
     **₹850 (~$10)** = hard-stop review. These are the day-one guardrails.
3. **Enable Firestore** (Build → Firestore Database → Create database).
   Region: **asia-south1**. Start in production mode — our rules deploy next.
4. **Register the Android app** (Project settings → Your apps → Android):
   - Package name: `app.dalex.mobile` (must match `apps/mobile/app.json` exactly)
   - Download **`google-services.json`** → save to `apps/mobile/google-services.json`
5. **Register the iOS app** (Project settings → Your apps → iOS):
   - Bundle ID: `app.dalex.mobile`
   - Download **`GoogleService-Info.plist`** → save to `apps/mobile/GoogleService-Info.plist`
   - These two files are gitignored placeholders in the repo — **never paste their
     contents into chat**; just drop the files in place.
6. **Enable Auth providers** (Build → Authentication → Sign-in method):
   - Google → Enable (needed for Google sign-in)
   - Apple → Enable (needed for Apple sign-in on iOS)
7. **Enable Cloud Messaging** (Project settings → Cloud Messaging): no action needed
   beyond the app registration — FCM is on by default once the apps are added.
8. Tell Muse the **project ID** (or drop the two config files into `apps/mobile/`
   and say "done").

## Part B — Deploy + build (Muse, after Part A)

1. `cp infra/.firebaserc.example infra/.firebaserc`, fill in the project ID as `dev`.
2. `infra/deploy.sh <project-id>` — builds functions, runs the 20 unit tests,
   then deploys Firestore rules + indexes + Cloud Functions. Verify the deploy in
   console (Functions list, rules timestamp).
3. Link the EAS project: `cd apps/mobile && eas init` (sets `owner`, `projectId`).
4. Development build: `eas build --profile development --platform all`
   (or `--platform android` / `--platform ios` separately). Internal distribution —
   install from the QR/link EAS provides.
5. iOS note: first iOS build needs an Apple Developer account for signing;
   use internal/TestFlight distribution, never the development `aps-environment`
   for store builds.

## Part C — Device QA checklist

Work top to bottom. Mark each `[ ]` as you go. Two phones (one Android, one iPhone)
is ideal; one phone covers most of it.

### Auth & onboarding
- [ ] Google sign-in works (Android + iOS)
- [ ] Apple sign-in works (iOS; equal prominence with Google on the welcome screen)
- [ ] First launch routes: welcome → DPDP notice → consent screens (3 screens)
- [ ] Declining consent blocks transactions/plans/FCM (data stays local-only)
- [ ] Consent audit log records the decision; Privacy screen shows it
- [ ] Consent withdrawal deletes data paths as documented

### Core loop: plan → spend → digest
- [ ] Morning (before noon): "What are you going to do today?" card appears, plan saves
- [ ] Add transaction (amount, category, method UPI/card/cash) appears on Home instantly
- [ ] Edit + delete transaction; rollups update
- [ ] **Airplane mode:** add 2 transactions offline → reconnect → they sync, no duplicates
- [ ] Evening digest arrives (~evening IST): planned vs actual, variance math sane
- [ ] **Two consecutive evenings:** digest arrives both nights; deep-link opens the app
- [ ] Morning planner notification fires ~08:00 IST next day

### Money correctness
- [ ] All amounts display in ₹ with paise precision (no floating-point weirdness:
      try ₹99.99, ₹0.01, large amounts)
- [ ] Budgets screen: per-category spend vs budget, over-budget warning fires
- [ ] Bills: add a bill, autopay toggle persists
- [ ] Savings goals: create goal, add money, progress bar updates
- [ ] Insights: 7-day chart renders, "How you paid" UPI vs cards split sane
- [ ] History: search finds transactions; Yesterday tab correct across midnight IST

### Privacy, export, deletion
- [ ] CSV export produces a file; share sheet opens (Files/Drive/WhatsApp)
- [ ] Settings → Delete account: double-confirm → user data gone from Firestore,
      signed out to welcome screen

### Push & tokens
- [ ] Accept push permission → token stored; deny → app still works, no crash
- [ ] Uninstall/reinstall → stale FCM token cleaned up (no ghost deliveries)

## Part D — Gates before calling Phase 1 done

- Two-evening digest test passed (T4.5)
- M1–M4 acceptance re-verified: two devices/one account, airplane-mode sync,
  rules tests green (T5.5)
- `privacy@dalex.app` is a placeholder — replace with the real address before any
  external tester touches the app
- Play Data Safety + App Store privacy labels filled before store submission
