// Shared Firestore taxonomy. Must match infra/firestore.rules and
// packages/shared/src/index.js. Duplicated (not imported) because the
// shared package is plain JS/ESM while functions compile to CommonJS.
export const CATEGORIES = [
  'food',
  'groceries',
  'transport',
  'shopping',
  'bills',
  'health',
  'entertainment',
  'travel',
  'education',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const METHODS = ['upi', 'card', 'netbanking', 'cash'] as const;
export type Method = (typeof METHODS)[number];

export const SOURCES = ['manual', 'sms', 'email', 'bank'] as const;
export type Source = (typeof SOURCES)[number];

export function isCategory(v: unknown): v is Category {
  return typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v);
}

export function isMethod(v: unknown): v is Method {
  return typeof v === 'string' && (METHODS as readonly string[]).includes(v);
}

/** Firestore document shape for users/{uid}/transactions/{txnId}. */
export interface TransactionDoc {
  amountPaise: unknown;
  merchantRaw?: unknown;
  merchant?: unknown;
  category: unknown;
  method: unknown;
  txnAt: unknown;
  source?: unknown;
  sourceRef?: unknown;
  note?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** A validated, normalized transaction ready for rollup math. */
export interface ValidTransaction {
  amountPaise: number;
  merchant: string;
  category: Category;
  method: Method;
  txnAt: Date;
}

/**
 * Validate a raw transaction doc. Returns null for invalid docs — the
 * triggers ignore them (logged) rather than crashing the rollup.
 * Money is integer paise; non-integer or negative amounts are rejected.
 */
export function validateTransaction(doc: TransactionDoc): ValidTransaction | null {
  if (typeof doc.amountPaise !== 'number' || !Number.isInteger(doc.amountPaise)) {
    return null;
  }
  if (doc.amountPaise < 0) return null;
  if (!isCategory(doc.category)) return null;
  if (!isMethod(doc.method)) return null;
  const txnAt = toDate(doc.txnAt);
  if (!txnAt) return null;
  const merchant =
    typeof doc.merchant === 'string' && doc.merchant.length > 0
      ? doc.merchant
      : typeof doc.merchantRaw === 'string'
        ? doc.merchantRaw
        : 'Unknown';
  return { amountPaise: doc.amountPaise, merchant, category: doc.category, method: doc.method, txnAt };
}

/** Accepts Date, Firestore Timestamp-like ({toDate}), or ISO string. */
export function toDate(v: unknown): Date | null {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (v !== null && typeof v === 'object' && 'toDate' in v) {
    const fn = (v as { toDate: unknown }).toDate;
    if (typeof fn === 'function') {
      const d = (fn as () => unknown)();
      return d instanceof Date && !isNaN(d.getTime()) ? d : null;
    }
  }
  return null;
}
