// Maintains users/{uid}/dailyTotals/{yyyy-MM-dd} and
// users/{uid}/budgets/{category}.spentPaise via FieldValue.increment().
// Budgets are month-scoped via a monthKey ("yyyy-MM", Asia/Kolkata): the
// first write of a new month resets spentPaise to 0 before applying the delta.
// Delta-based: created => +amount, deleted => -amount, updated => diff of
// old vs new — so a retried trigger never double-counts. Invalid docs are
// logged and ignored.
import * as logger from 'firebase-functions/logger';
import { FieldValue } from 'firebase-admin/firestore';
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore';
import { db } from './admin';
import {
  deltaForCreate,
  deltaForDelete,
  deltaForUpdate,
  isEmptyDelta,
  RollupDelta,
} from './lib/rollups';
import { TransactionDoc } from './lib/types';

const REGION = 'asia-south1';
const DOCUMENT = 'users/{uid}/transactions/{txnId}';
const COMMON = { document: DOCUMENT, region: REGION, maxInstances: 10 } as const;

type TxnData = QueryDocumentSnapshot | undefined;async function applyDelta(uid: string, delta: RollupDelta): Promise<void> {
  if (isEmptyDelta(delta)) return;
  const firestore = db();

  for (const [dayKey, day] of delta.days) {
    const update: Record<string, unknown> = {
      totalPaise: FieldValue.increment(day.totalPaise),
      txnCount: FieldValue.increment(day.txnCount),
    };
    for (const [cat, amount] of Object.entries(day.byCategory)) {
      update[`byCategory.${cat}`] = FieldValue.increment(amount);
    }
    for (const [method, amount] of Object.entries(day.byMethod)) {
      update[`byMethod.${method}`] = FieldValue.increment(amount);
    }
    await firestore.doc(`users/${uid}/dailyTotals/${dayKey}`).set(update, { merge: true });
  }

  for (const [category, spent] of delta.budgets) {
    await applyBudgetDelta(uid, category, spent);
  }
}

/**
 * Month-scoped budgets. `budgets/{category}` carries a `monthKey` ("yyyy-MM"
 * in Asia/Kolkata). The first write of a new month resets `spentPaise` to 0
 * before applying the delta, inside a transaction so concurrent writes are
 * safe. This keeps the schema stable while preventing spend from
 * accumulating across months forever.
 */
function istMonthKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}`;
}

async function applyBudgetDelta(uid: string, category: string, spent: number): Promise<void> {
  const firestore = db();
  const ref = firestore.doc(`users/${uid}/budgets/${category}`);
  const monthKey = istMonthKey();
  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.data()?.monthKey as string | undefined) : undefined;
    if (current !== monthKey) {
      tx.set(ref, { monthKey, spentPaise: 0 }, { merge: true });
    }
    tx.set(
      ref,
      { spentPaise: FieldValue.increment(spent), monthKey },
      { merge: true }
    );
  });
}

function docOf(snap: TxnData): TransactionDoc | null {
  return snap ? (snap.data() as TransactionDoc) : null;
}

export const onTransactionCreated = onDocumentCreated(COMMON, async (event) => {
  const uid = event.params.uid;
  const doc = docOf(event.data);
  if (!doc) return;
  const delta = deltaForCreate(doc);
  if (isEmptyDelta(delta)) {
    logger.warn('Ignoring invalid transaction doc on create', { uid });
    return;
  }
  await applyDelta(uid, delta);
});

export const onTransactionDeleted = onDocumentDeleted(COMMON, async (event) => {
  const uid = event.params.uid;
  const doc = docOf(event.data);
  if (!doc) return;
  const delta = deltaForDelete(doc);
  if (isEmptyDelta(delta)) {
    logger.warn('Ignoring invalid transaction doc on delete', { uid });
    return;
  }
  await applyDelta(uid, delta);
});

export const onTransactionUpdated = onDocumentUpdated(COMMON, async (event) => {
  const uid = event.params.uid;
  const before = docOf(event.data?.before);
  const after = docOf(event.data?.after);
  if (!before || !after) return;
  const delta = deltaForUpdate(before, after);
  if (isEmptyDelta(delta)) return; // nothing meaningful changed
  await applyDelta(uid, delta);
});
