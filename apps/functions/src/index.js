// Cloud Functions v2 (asia-south1) for Hisab.
// Money is integer paise everywhere. See docs/ARCHITECTURE.md §3–§4.
// NOTE: Functions cannot deploy on Firebase Spark — this project runs on
// guarded Blaze (billing alerts + maxInstances on every function).
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const REGION = 'asia-south1';

const dayKey = (ts) => {
  const d = ts instanceof Date ? ts : ts.toDate();
  return d.toISOString().slice(0, 10); // yyyy-MM-dd (UTC basis; TZ handling in digest)
};

// Recomputes dailyTotals/{date} and budgets/{category}.spentPaise.
// Trigger is a signal only — we re-aggregate, so the write is idempotent.
async function recomputeRollups(uid) {
  const txns = await db.collection(`users/${uid}/transactions`).get();
  const byDay = new Map();
  const byCat = new Map();
  txns.forEach((doc) => {
    const t = doc.data();
    const day = dayKey(t.txnAt);
    const agg = byDay.get(day) || { totalPaise: 0, txnCount: 0, byCategory: {}, byMethod: {} };
    agg.totalPaise += t.amountPaise;
    agg.txnCount += 1;
    agg.byCategory[t.category] = (agg.byCategory[t.category] || 0) + t.amountPaise;
    agg.byMethod[t.method] = (agg.byMethod[t.method] || 0) + t.amountPaise;
    byDay.set(day, agg);
    byCat.set(t.category, (byCat.get(t.category) || 0) + t.amountPaise);
  });
  const batch = db.batch();
  byDay.forEach((agg, day) =>
    batch.set(db.doc(`users/${uid}/dailyTotals/${day}`), agg, { merge: true }));
  byCat.forEach((spentPaise, category) =>
    batch.set(db.doc(`users/${uid}/budgets/${category}`), { spentPaise }, { merge: true }));
  await batch.commit();
}

const recomputeForEvent = async (event) => {
  const uid = event.params.uid;
  await recomputeRollups(uid);
};

exports.onTransactionWrite = [
  onDocumentCreated({ document: 'users/{uid}/transactions/{txnId}', region: REGION, maxInstances: 10 }, recomputeForEvent),
  onDocumentUpdated({ document: 'users/{uid}/transactions/{txnId}', region: REGION, maxInstances: 10 }, recomputeForEvent),
  onDocumentDeleted({ document: 'users/{uid}/transactions/{txnId}', region: REGION, maxInstances: 10 }, recomputeForEvent),
];

// Every 15 min (Asia/Kolkata): users past digestTime with no digest today get one.
exports.scheduledDigest = onSchedule(
  { schedule: 'every 15 minutes', region: REGION, timeZone: 'Asia/Kolkata', maxInstances: 3 },
  async () => {
    // TODO (T5): query users by digestTime, aggregate, write digests/{date}, send FCM.
  }
);

// Daily: drop FCM tokens with repeated NotRegistered failures.
exports.cleanupTokens = onSchedule(
  { schedule: 'every day 03:00', region: REGION, timeZone: 'Asia/Kolkata', maxInstances: 1 },
  async () => {
    // TODO (T5): scan users/*/fcmTokens for stale entries and delete them.
  }
);

// DPDP erasure: authed callable. Wipes the user's Firestore subtree + Auth record.
exports.deleteAccount = onCall({ region: REGION, maxInstances: 5 }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  const uid = request.auth.uid;
  // TODO (T7): recursively delete users/{uid}/** via bulk writer, then admin.auth().deleteUser(uid).
  return { ok: false, todo: true };
});
