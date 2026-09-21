// Transaction repository (apps/mobile/src/data/transactions.ts).
// All Firestore access for transactions lives here. Screens use these
// functions + watchTransactions(); they never import Firestore directly.
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { CATEGORIES, METHODS, SOURCES, dedupeKey } from '@dalex/shared';
import { normalizeMerchant, type Category, type Method, type NewTransaction, type Transaction, type TxnSource } from './types';

function toTransaction(id: string, data: Record<string, unknown>): Transaction {
  const txnAtRaw = data.txnAt as { toDate?: () => Date } | undefined;
  return {
    id,
    amountPaise: (data.amountPaise as number) ?? 0,
    merchantRaw: (data.merchantRaw as string) ?? '',
    merchant: (data.merchant as string) ?? '',
    category: data.category as Category,
    method: data.method as Method,
    txnAt: txnAtRaw?.toDate ? txnAtRaw.toDate() : new Date(),
    source: data.source as TxnSource,
    sourceRef: (data.sourceRef as string) ?? '',
    note: data.note as string | undefined,
    dedupeKey: data.dedupeKey as string | undefined,
  };
}

export interface WatchTransactionsOpts {
  limit?: number;
  category?: Category;
}

/** Live list of transactions, newest first. Returns an unsubscribe function. */
export function watchTransactions(
  uid: string,
  opts: WatchTransactionsOpts,
  onNext: (txns: Transaction[]) => void,
  onError?: (e: Error) => void
): () => void {
  const base = collection(getFirestore(), 'users', uid, 'transactions');
  const constraints: unknown[] = [orderBy('txnAt', 'desc')];
  if (opts.category) constraints.unshift(where('category', '==', opts.category));
  constraints.push(fsLimit(opts.limit ?? 50));
  const q = query(base, ...(constraints as Parameters<typeof query>[1][]));
  return onSnapshot(
    q,
    (snap) => onNext(snap.docs.map((d) => toTransaction(d.id, d.data() as Record<string, unknown>))),
    (err) => onError?.(err as Error)
  );
}

function assertValid(input: NewTransaction): void {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 0) {
    throw new Error('amountPaise must be an integer >= 0.');
  }
  if (!input.merchant || !input.merchant.trim()) {
    throw new Error('merchant is required.');
  }
  if (!(CATEGORIES as readonly string[]).includes(input.category)) {
    throw new Error(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (!(METHODS as readonly string[]).includes(input.method)) {
    throw new Error(`method must be one of: ${METHODS.join(', ')}`);
  }
  if (!(SOURCES as readonly string[]).includes(input.source)) {
    throw new Error(`source must be one of: ${SOURCES.join(', ')}`);
  }
}

/** Write a transaction. Returns the new doc id. */
export async function addTransaction(uid: string, input: NewTransaction): Promise<string> {
  assertValid(input);
  const txnAt = input.txnAt ?? new Date();
  const merchant = normalizeMerchant(input.merchant);
  const ref = await addDoc(collection(getFirestore(), 'users', uid, 'transactions'), {
    amountPaise: input.amountPaise,
    merchantRaw: input.merchant.trim(),
    merchant,
    category: input.category,
    method: input.method,
    txnAt: Timestamp.fromDate(txnAt),
    source: input.source,
    sourceRef: input.sourceRef ?? `${input.source}:${Date.now()}`,
    ...(input.note ? { note: input.note } : {}),
    dedupeKey: dedupeKey({ merchant, amountPaise: input.amountPaise, txnAt, method: input.method }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Recategorize a transaction (used by the detail sheet). */
export async function updateCategory(uid: string, id: string, category: Category): Promise<void> {
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    throw new Error(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  await updateDoc(doc(getFirestore(), 'users', uid, 'transactions', id), {
    category,
    updatedAt: serverTimestamp(),
  });
}

/**
 * One-shot fetch of recent transactions, newest first. Used by CSV export.
 * Capped at `max` docs to bound read cost.
 */
export async function fetchTransactions(uid: string, max = 2000): Promise<Transaction[]> {
  const base = collection(getFirestore(), 'users', uid, 'transactions');
  const q = query(base, orderBy('txnAt', 'desc'), fsLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toTransaction(d.id, d.data() as Record<string, unknown>));
}
