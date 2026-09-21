// Daily 03:00 Asia/Kolkata: remove dead FCM tokens from users' fcmTokens
// maps. A token is removed when it has failed 3+ consecutive sends or its
// last failure was a permanent NotRegistered/Unregistered error.
// (Failures are recorded by scheduledDigest; permanent failures are pruned
// immediately there — this run is the safety net.)
import * as logger from 'firebase-functions/logger';
import { FieldValue, FieldPath } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from './admin';

const REGION = 'asia-south1';
const MAX_FAILURES = 3;
const PAGE_SIZE = 500;

const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/unregistered',
]);

interface TokenEntry {
  failures?: unknown;
  lastFailureCode?: unknown;
}

/** Token keys in the user's fcmTokens map that should be deleted. Pure. */
export function deadTokens(fcmTokens: Record<string, TokenEntry> | undefined): string[] {
  if (!fcmTokens) return [];
  return Object.entries(fcmTokens)
    .filter(([, entry]) => {
      const failures = typeof entry?.failures === 'number' ? entry.failures : 0;
      const code = typeof entry?.lastFailureCode === 'string' ? entry.lastFailureCode : '';
      return failures >= MAX_FAILURES || DEAD_TOKEN_CODES.has(code);
    })
    .map(([token]) => token);
}

export const cleanupTokens = onSchedule(
  {
    schedule: 'every day 03:00',
    timeZone: 'Asia/Kolkata',
    region: REGION,
    maxInstances: 1,
  },
  async () => {
    const firestore = db();
    let lastId: string | undefined;
    let usersScanned = 0;
    let tokensRemoved = 0;

    for (;;) {
      let q = firestore.collection('users').orderBy('__name__').limit(PAGE_SIZE);
      if (lastId) q = q.startAfter(lastId);
      const snap = await q.get();
      if (snap.empty) break;

      const batch = firestore.batch();
      let batchOps = 0;
      for (const doc of snap.docs) {
        usersScanned++;
        const fcmTokens = (doc.data() as { fcmTokens?: Record<string, TokenEntry> }).fcmTokens;
        for (const token of deadTokens(fcmTokens)) {
          batch.update(doc.ref, new FieldPath('fcmTokens', token), FieldValue.delete());
          batchOps++;
          tokensRemoved++;
        }
        lastId = doc.id;
      }
      if (batchOps > 0) await batch.commit();
      if (snap.size < PAGE_SIZE) break;
    }

    logger.info('Token cleanup finished', { usersScanned, tokensRemoved });
  }
);
