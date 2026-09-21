// Savings-goal repository (apps/mobile/src/data/goals.ts).
// Goals live at users/{uid}/goals/{goalId}: { name, targetPaise, savedPaise,
// hue?, icon?, createdAt, updatedAt }. Money is integer paise.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from '@react-native-firebase/firestore';

export interface Goal {
  id: string;
  name: string;
  targetPaise: number;
  savedPaise: number;
  hue: string;
  icon: string;
  createdAt: Date;
}

export interface NewGoal {
  name: string;
  targetPaise: number;
  hue?: string;
  icon?: string;
}

function toGoal(id: string, data: Record<string, unknown>): Goal {
  const createdRaw = data.createdAt as { toDate?: () => Date } | undefined;
  return {
    id,
    name: (data.name as string) ?? '',
    targetPaise: (data.targetPaise as number) ?? 0,
    savedPaise: (data.savedPaise as number) ?? 0,
    hue: (data.hue as string) ?? '#34D399',
    icon: (data.icon as string) ?? 'flag-outline',
    createdAt: createdRaw?.toDate ? createdRaw.toDate() : new Date(),
  };
}

function assertGoalInput(name: string, targetPaise: number): void {
  if (!name || !name.trim()) throw new Error('Goal name is required.');
  if (name.trim().length > 60) throw new Error('Goal name must be 60 characters or less.');
  if (!Number.isInteger(targetPaise) || targetPaise <= 0) {
    throw new Error('Target must be a whole rupee amount greater than zero.');
  }
}

/** Live savings goals, oldest first. Returns an unsubscribe function. */
export function watchGoals(
  uid: string,
  onNext: (goals: Goal[]) => void,
  onError?: (e: Error) => void
): () => void {
  const ref = collection(getFirestore(), 'users', uid, 'goals');
  const q = query(ref, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => onNext(snap.docs.map((d) => toGoal(d.id, d.data() as Record<string, unknown>))),
    (err) => onError?.(err as Error)
  );
}

/** Create a savings goal. Returns the new doc id. */
export async function addGoal(uid: string, input: NewGoal): Promise<string> {
  assertGoalInput(input.name, input.targetPaise);
  const ref = await addDoc(collection(getFirestore(), 'users', uid, 'goals'), {
    name: input.name.trim(),
    targetPaise: input.targetPaise,
    savedPaise: 0,
    hue: input.hue ?? '#34D399',
    icon: input.icon ?? 'flag-outline',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Rename a goal or change its target. */
export async function updateGoal(
  uid: string,
  id: string,
  patch: { name?: string; targetPaise?: number }
): Promise<void> {
  if (patch.name !== undefined && !patch.name.trim()) {
    throw new Error('Goal name is required.');
  }
  if (patch.targetPaise !== undefined && (!Number.isInteger(patch.targetPaise) || patch.targetPaise <= 0)) {
    throw new Error('Target must be a whole rupee amount greater than zero.');
  }
  const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.name !== undefined) clean.name = patch.name.trim();
  if (patch.targetPaise !== undefined) clean.targetPaise = patch.targetPaise;
  await updateDoc(doc(getFirestore(), 'users', uid, 'goals', id), clean);
}

/** Add money toward a goal (idempotent-safe server increment). */
export async function contributeToGoal(uid: string, id: string, amountPaise: number): Promise<void> {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error('Contribution must be a whole rupee amount greater than zero.');
  }
  await updateDoc(doc(getFirestore(), 'users', uid, 'goals', id), {
    savedPaise: increment(amountPaise),
    updatedAt: serverTimestamp(),
  });
}

/** Delete a savings goal. */
export async function deleteGoal(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(getFirestore(), 'users', uid, 'goals', id));
}
