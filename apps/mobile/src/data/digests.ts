// Evening-digest repository (apps/mobile/src/data/digests.ts).
// digests/{yyyy-MM-dd} is written by the scheduledDigest Cloud Function;
// the client only reads.
import {
  doc,
  getFirestore,
  onSnapshot,
} from '@react-native-firebase/firestore';
import { dayKey, type Digest, type DigestMerchant } from './types';

function toDigest(data: Record<string, unknown>): Digest {
  const sentAtRaw = data.sentAt as { toDate?: () => Date } | undefined;
  return {
    totalPaise: (data.totalPaise as number) ?? 0,
    txnCount: (data.txnCount as number) ?? 0,
    byCategory: (data.byCategory as Record<string, number>) ?? {},
    byMethod: (data.byMethod as Record<string, number>) ?? {},
    plannedPaise: (data.plannedPaise as number) ?? 0,
    variancePaise: (data.variancePaise as number) ?? 0,
    topMerchants: (data.topMerchants as DigestMerchant[]) ?? [],
    sentAt: sentAtRaw?.toDate ? sentAtRaw.toDate() : undefined,
  };
}

/** Live digest for a date (default: today, Asia/Kolkata). Null until the Function writes it. */
export function watchDigest(
  uid: string,
  onNext: (digest: Digest | null) => void,
  date: string = dayKey(),
  onError?: (e: Error) => void
): () => void {
  const ref = doc(getFirestore(), 'users', uid, 'digests', date);
  return onSnapshot(
    ref,
    (snap) => onNext(snap.exists() ? toDigest(snap.data() as Record<string, unknown>) : null),
    (err) => onError?.(err as Error)
  );
}
