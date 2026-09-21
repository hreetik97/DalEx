// Bills repository (apps/mobile/src/data/bills.ts).
// Autopay toggles are display-only in V1 (no money movement).
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from '@react-native-firebase/firestore';
import { CATEGORIES } from '@dalex/shared';
import type { Bill, Category, NewBill } from './types';

function toBill(id: string, data: Record<string, unknown>): Bill {
  return {
    id,
    name: (data.name as string) ?? '',
    amountPaise: (data.amountPaise as number) ?? 0,
    dueDay: (data.dueDay as number) ?? 1,
    autopay: (data.autopay as boolean) ?? false,
    category: (data.category as Category) ?? 'bills',
    isSubscription: (data.isSubscription as boolean) ?? false,
  };
}

function assertValid(input: NewBill): void {
  if (!input.name.trim()) throw new Error('Bill name is required.');
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 0) {
    throw new Error('amountPaise must be an integer >= 0.');
  }
  if (!Number.isInteger(input.dueDay) || input.dueDay < 1 || input.dueDay > 31) {
    throw new Error('dueDay must be 1-31.');
  }
  if (!(CATEGORIES as readonly string[]).includes(input.category)) {
    throw new Error(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
}

/** Live bills, ordered by due day. Returns an unsubscribe function. */
export function watchBills(
  uid: string,
  onNext: (bills: Bill[]) => void,
  onError?: (e: Error) => void
): () => void {
  const q = query(
    collection(getFirestore(), 'users', uid, 'bills'),
    orderBy('dueDay', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => onNext(snap.docs.map((d) => toBill(d.id, d.data() as Record<string, unknown>))),
    (err) => onError?.(err as Error)
  );
}

export async function addBill(uid: string, input: NewBill): Promise<string> {
  assertValid(input);
  const ref = await addDoc(collection(getFirestore(), 'users', uid, 'bills'), {
    name: input.name.trim(),
    amountPaise: input.amountPaise,
    dueDay: input.dueDay,
    autopay: input.autopay,
    category: input.category,
    isSubscription: input.isSubscription ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBill(
  uid: string,
  id: string,
  patch: Partial<Omit<NewBill, 'name'> & { name: string }>
): Promise<void> {
  if (patch.amountPaise !== undefined && (!Number.isInteger(patch.amountPaise) || patch.amountPaise < 0)) {
    throw new Error('amountPaise must be an integer >= 0.');
  }
  if (patch.dueDay !== undefined && (!Number.isInteger(patch.dueDay) || patch.dueDay < 1 || patch.dueDay > 31)) {
    throw new Error('dueDay must be 1-31.');
  }
  await updateDoc(doc(getFirestore(), 'users', uid, 'bills', id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBill(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(getFirestore(), 'users', uid, 'bills', id));
}
