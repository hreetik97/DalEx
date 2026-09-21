// Budget repository (apps/mobile/src/data/budgets.ts).
// spentPaise is maintained by the onTransactionWrite Cloud Function;
// the client only writes monthPaise.
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
} from '@react-native-firebase/firestore';
import { CATEGORIES } from '@dalex/shared';
import type { Budget, Category } from './types';

/** Live budgets. Returns an unsubscribe function. */
export function watchBudgets(
  uid: string,
  onNext: (budgets: Budget[]) => void,
  onError?: (e: Error) => void
): () => void {
  const ref = collection(getFirestore(), 'users', uid, 'budgets');
  return onSnapshot(
    ref,
    (snap) =>
      onNext(
        snap.docs.map((d) => ({
          category: d.id as Category,
          monthPaise: (d.data().monthPaise as number) ?? 0,
          spentPaise: (d.data().spentPaise as number) ?? 0,
        }))
      ),
    (err) => onError?.(err as Error)
  );
}

/** Set (or create) the monthly budget for a category, in paise. */
export async function setMonthlyBudget(
  uid: string,
  category: Category,
  monthPaise: number
): Promise<void> {
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    throw new Error(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (!Number.isInteger(monthPaise) || monthPaise < 0) {
    throw new Error('monthPaise must be an integer >= 0.');
  }
  await setDoc(doc(getFirestore(), 'users', uid, 'budgets', category), { monthPaise }, { merge: true });
}
