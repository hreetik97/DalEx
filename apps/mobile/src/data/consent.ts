// DPDP consent log (apps/mobile/src/data/consent.ts).
// Every consent event is appended to users/{uid}/consentLog as
// { purpose, grantedAt, noticeVersion }. No data collection happens
// before the notice screen is agreed to (see src/app/onboarding/).
import {
  arrayUnion,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from '@react-native-firebase/firestore';
import type { ConsentEntry } from './types';

export const NOTICE_VERSION = '1.0';

export const ConsentPurpose = {
  ACCOUNT: 'account', // notice screen "I agree" — account + core data processing
  PUSH: 'push', // evening digest / transactional push notifications
  SMS: 'sms', // Android on-device SMS auto-capture (Phase 2)
  AGE: 'age', // 18+ confirmation
} as const;

/** Append one consent event to the user's audit trail. */
export async function logConsent(
  uid: string,
  purpose: (typeof ConsentPurpose)[keyof typeof ConsentPurpose],
  granted = true
): Promise<void> {
  const ref = doc(getFirestore(), 'users', uid);
  await updateDoc(ref, {
    consentLog: arrayUnion({
      purpose,
      grantedAt: serverTimestamp(),
      noticeVersion: NOTICE_VERSION,
      granted,
    }),
  });
}

/** Record a withdrawal of a previously granted consent. */
export async function withdrawConsent(
  uid: string,
  purpose: (typeof ConsentPurpose)[keyof typeof ConsentPurpose]
): Promise<void> {
  await logConsent(uid, purpose, false);
}

/** Latest consent state per purpose: the most recent entry wins. */
export async function getConsentState(uid: string): Promise<Record<string, boolean>> {
  const log = await getConsentLog(uid);
  const state: Record<string, boolean> = {};
  for (const e of log) {
    state[e.purpose] = e.granted ?? true;
  }
  return state;
}

/** True once the account-level notice has been agreed to at the current notice version. */
export async function hasConsented(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(getFirestore(), 'users', uid));
  if (!snap.exists()) return false;
  const log = (snap.data()?.consentLog ?? []) as ConsentEntry[];
  return log.some(
    (e) => e.purpose === ConsentPurpose.ACCOUNT && e.noticeVersion === NOTICE_VERSION
  );
}

/** Full audit trail, newest last. */
export async function getConsentLog(uid: string): Promise<ConsentEntry[]> {
  const snap = await getDoc(doc(getFirestore(), 'users', uid));
  if (!snap.exists()) return [];
  return (snap.data()?.consentLog ?? []) as ConsentEntry[];
}
