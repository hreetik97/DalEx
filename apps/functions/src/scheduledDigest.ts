// Every 15 min (Asia/Kolkata): for users with notifPrefs.eveningDigest
// enabled whose local time is past digestTime (default 21:00) and who have
// no digests/{today} yet — aggregate today's transactions + plans/{today},
// write digests/{yyyy-MM-dd}, then send one FCM message.
// The digest doc is claimed inside a Firestore transaction first, so even
// overlapping runs send at most one notification per user per day.
import * as logger from 'firebase-functions/logger';
import { FieldValue, FieldPath, Timestamp } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db, messaging } from './admin';
import { aggregateTransactions, plannedPaiseFor, variancePaise, PlanItem } from './lib/digest';
import { formatINR } from './lib/money';
import { istDayKey, istDayStartMs, istDayEndMs, isPastTime } from './lib/time';
import { toDate, TransactionDoc } from './lib/types';

const REGION = 'asia-south1';
const DEFAULT_DIGEST_TIME = '21:00';
const CONCURRENCY = 5;

// FCM error codes that mean the token will never work again.
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/unregistered',
]);

interface TokenEntry {
  platform?: string;
  updatedAt?: unknown;
  failures?: number;
  lastFailureAt?: unknown;
  lastFailureCode?: string;
}

async function processUser(uid: string, now: Date): Promise<'sent' | 'skipped' | 'failed'> {
  const firestore = db();
  const userRef = firestore.doc(`users/${uid}`);
  const snap = await userRef.get();
  if (!snap.exists) return 'skipped';
  const user = snap.data() as {
    notifPrefs?: { eveningDigest?: boolean; digestTime?: string };
    fcmTokens?: Record<string, TokenEntry>;
  };

  const prefs = user.notifPrefs ?? {};
  if (prefs.eveningDigest !== true) return 'skipped';
  const digestTime = typeof prefs.digestTime === 'string' ? prefs.digestTime : DEFAULT_DIGEST_TIME;
  if (!isPastTime(now, digestTime)) return 'skipped';

  const dayKey = istDayKey(now);
  const digestRef = firestore.doc(`users/${uid}/digests/${dayKey}`);

  // Claim the digest atomically: only the winner proceeds to notify.
  const claimed = await firestore.runTransaction(async (tx) => {
    const existing = await tx.get(digestRef);
    if (existing.exists) return false;
    tx.set(digestRef, {
      totalPaise: 0,
      txnCount: 0,
      byCategory: {},
      byMethod: {},
      plannedPaise: 0,
      variancePaise: 0,
      topMerchants: [],
      status: 'building',
      sentAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
  if (!claimed) return 'skipped';

  try {
    const start = Timestamp.fromMillis(istDayStartMs(now));
    const end = Timestamp.fromMillis(istDayEndMs(now));
    const txnsSnap = await firestore
      .collection(`users/${uid}/transactions`)
      .where('txnAt', '>=', start)
      .where('txnAt', '<', end)
      .get();

    const txns = txnsSnap.docs
      .map((d) => d.data() as TransactionDoc)
      .map((t) => ({
        amountPaise:
          typeof t.amountPaise === 'number' && Number.isInteger(t.amountPaise) ? t.amountPaise : 0,
        merchant:
          typeof t.merchant === 'string' && t.merchant.length > 0
            ? t.merchant
            : typeof t.merchantRaw === 'string'
              ? t.merchantRaw
              : 'Unknown',
        category: typeof t.category === 'string' ? t.category : 'other',
        method: typeof t.method === 'string' ? t.method : 'unknown',
        _at: toDate(t.txnAt),
      }))
      .filter((t) => t._at !== null);

    const agg = aggregateTransactions(txns);

    const planSnap = await firestore.doc(`users/${uid}/plans/${dayKey}`).get();
    const planData = planSnap.data() as { items?: Array<{ estimatePaise?: unknown }> } | undefined;
    const planItems: PlanItem[] = Array.isArray(planData?.items)
      ? planData.items.map((i) => ({
          estimatePaise:
            typeof i?.estimatePaise === 'number' && Number.isInteger(i.estimatePaise)
              ? i.estimatePaise
              : 0,
        }))
      : [];
    const planned = plannedPaiseFor(planItems);

    await digestRef.set(
      {
        totalPaise: agg.totalPaise,
        txnCount: agg.txnCount,
        byCategory: agg.byCategory,
        byMethod: agg.byMethod,
        plannedPaise: planned,
        variancePaise: variancePaise(agg.totalPaise, planned),
        topMerchants: agg.topMerchants,
        status: 'ready',
        sentAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const tokens = Object.keys(user.fcmTokens ?? {});
    if (tokens.length > 0) {
      const plural = agg.txnCount === 1 ? '' : 's';
      const resp = await messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: 'Evening wrap-up',
          body: `You spent ${formatINR(agg.totalPaise)} across ${agg.txnCount} payment${plural} today.`,
        },
        data: { type: 'evening_digest', date: dayKey },
      });

      // Update token health per result. FieldPath is used because raw
      // token strings are embedded in the field path.
      const entries: Array<[FieldPath, unknown]> = [];
      resp.responses.forEach((r, i) => {
        const token = tokens[i];
        if (r.success) {
          entries.push([new FieldPath('fcmTokens', token, 'failures'), 0]);
          entries.push([new FieldPath('fcmTokens', token, 'lastFailureAt'), FieldValue.delete()]);
          entries.push([new FieldPath('fcmTokens', token, 'lastFailureCode'), FieldValue.delete()]);
        } else {
          const code = r.error?.code ?? 'unknown';
          if (DEAD_TOKEN_CODES.has(code)) {
            entries.push([new FieldPath('fcmTokens', token), FieldValue.delete()]);
          } else {
            entries.push([new FieldPath('fcmTokens', token, 'failures'), FieldValue.increment(1)]);
            entries.push([
              new FieldPath('fcmTokens', token, 'lastFailureAt'),
              FieldValue.serverTimestamp(),
            ]);
            entries.push([new FieldPath('fcmTokens', token, 'lastFailureCode'), code]);
          }
        }
      });
      if (entries.length > 0) {
        const flat: unknown[] = [];
        for (const [p, v] of entries) flat.push(p, v);
        await userRef.update(flat[0] as FieldPath, flat[1], ...flat.slice(2));
      }
      logger.info('Digest sent', {
        uid,
        dayKey,
        success: resp.successCount,
        failure: resp.failureCount,
      });
    }
    return 'sent';
  } catch (err) {
    // Leave the claimed digest in place (status 'building') so a retry or
    // the next 15-min run doesn't double-send; mark it failed for visibility.
    logger.error('Digest failed', { uid, dayKey, err });
    await digestRef.set({ status: 'failed' }, { merge: true });
    return 'failed';
  }
}

export const scheduledDigest = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'Asia/Kolkata',
    region: REGION,
    maxInstances: 3,
  },
  async () => {
    const now = new Date();
    const firestore = db();
    const usersSnap = await firestore
      .collection('users')
      .where('notifPrefs.eveningDigest', '==', true)
      .get();

    const uids = usersSnap.docs.map((d) => d.id);
    logger.info('Digest run starting', { users: uids.length });

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    for (let i = 0; i < uids.length; i += CONCURRENCY) {
      const chunk = uids.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(chunk.map((uid) => processUser(uid, now)));
      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value === 'sent') sent++;
          else skipped++;
        } else {
          failed++;
          logger.error('Digest user error', { err: r.reason });
        }
      }
    }
    logger.info('Digest run finished', { sent, skipped, failed });
  }
);
