// Morning-planner repository (apps/mobile/src/data/plans.ts).
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import { dayKey, type PlanItem } from './types';

function planRef(uid: string, date: string) {
  return doc(getFirestore(), 'users', uid, 'plans', date);
}

/** Plan items for a yyyy-MM-dd date (default: today, Asia/Kolkata). */
export async function getPlan(uid: string, date: string = dayKey()): Promise<PlanItem[]> {
  const snap = await getDoc(planRef(uid, date));
  if (!snap.exists()) return [];
  const items = (snap.data()?.items ?? []) as PlanItem[];
  return items.filter((i) => i && typeof i.label === 'string');
}

/** Replace the plan for a date. estimatePaise must be an integer >= 0. */
export async function savePlan(
  uid: string,
  items: PlanItem[],
  date: string = dayKey()
): Promise<void> {
  for (const item of items) {
    if (!item.label.trim()) throw new Error('Plan item label is required.');
    if (!Number.isInteger(item.estimatePaise) || item.estimatePaise < 0) {
      throw new Error('estimatePaise must be an integer >= 0.');
    }
  }
  const ref = planRef(uid, date);
  const snap = await getDoc(ref);
  await setDoc(ref, {
    items: items.map((i) => ({
      id: i.id,
      label: i.label.trim(),
      estimatePaise: i.estimatePaise,
    })),
    createdAt: snap.exists() ? (snap.data()?.createdAt ?? serverTimestamp()) : serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
