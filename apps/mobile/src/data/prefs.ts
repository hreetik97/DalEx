// Notification preferences (apps/mobile/src/data/prefs.ts).
// notifPrefs lives on users/{uid}: { eveningDigest, digestTime, morningNudge }.
// Screens use these helpers; they never touch Firestore directly.
import {
  doc,
  getFirestore,
  onSnapshot,
  updateDoc,
} from '@react-native-firebase/firestore';
import type { NotifPrefs } from './types';

const DEFAULTS: NotifPrefs = {
  eveningDigest: true,
  digestTime: '21:00',
  morningNudge: false,
};

function toPrefs(data: Record<string, unknown>): NotifPrefs {
  const raw = (data.notifPrefs ?? {}) as Partial<NotifPrefs>;
  return {
    eveningDigest: raw.eveningDigest ?? DEFAULTS.eveningDigest,
    digestTime:
      typeof raw.digestTime === 'string' && /^\d{2}:\d{2}$/.test(raw.digestTime)
        ? raw.digestTime
        : DEFAULTS.digestTime,
    morningNudge: raw.morningNudge ?? DEFAULTS.morningNudge,
  };
}

/** Live notification preferences. Returns an unsubscribe function. */
export function watchNotifPrefs(
  uid: string,
  onNext: (prefs: NotifPrefs) => void,
  onError?: (e: Error) => void
): () => void {
  const ref = doc(getFirestore(), 'users', uid);
  return onSnapshot(
    ref,
    (snap) => onNext(snap.exists() ? toPrefs(snap.data() as Record<string, unknown>) : DEFAULTS),
    (err) => onError?.(err as Error)
  );
}

/** Update notification preferences (partial). Validates digestTime as HH:MM. */
export async function updateNotifPrefs(
  uid: string,
  patch: Partial<NotifPrefs>
): Promise<void> {
  if (patch.digestTime !== undefined && !/^\d{2}:\d{2}$/.test(patch.digestTime)) {
    throw new Error('digestTime must be HH:MM (24-hour).');
  }
  const clean: Record<string, unknown> = {};
  if (patch.eveningDigest !== undefined) clean['notifPrefs.eveningDigest'] = patch.eveningDigest;
  if (patch.digestTime !== undefined) clean['notifPrefs.digestTime'] = patch.digestTime;
  if (patch.morningNudge !== undefined) clean['notifPrefs.morningNudge'] = patch.morningNudge;
  if (Object.keys(clean).length === 0) return;
  await updateDoc(doc(getFirestore(), 'users', uid), clean);
}
