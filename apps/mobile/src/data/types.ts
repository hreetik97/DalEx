// Domain types for the Hisab data layer (apps/mobile/src/data).
// Money is integer paise everywhere. Screens import from here, never from Firestore directly.

export type Category =
  | 'food'
  | 'groceries'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'health'
  | 'entertainment'
  | 'travel'
  | 'education'
  | 'other';

export type Method = 'upi' | 'card' | 'netbanking' | 'cash';

export type TxnSource = 'manual' | 'sms' | 'email' | 'bank';

export interface Transaction {
  id: string;
  amountPaise: number;
  merchantRaw: string;
  merchant: string;
  category: Category;
  method: Method;
  txnAt: Date;
  source: TxnSource;
  sourceRef: string;
  note?: string;
  dedupeKey?: string;
}

export interface NewTransaction {
  amountPaise: number;
  merchant: string;
  category: Category;
  method: Method;
  source: TxnSource;
  sourceRef?: string;
  note?: string;
  txnAt?: Date;
}

export interface PlanItem {
  id: string;
  label: string;
  estimatePaise: number;
}

export interface Budget {
  category: Category;
  monthPaise: number;
  spentPaise: number;
}

export interface DigestMerchant {
  merchant: string;
  totalPaise: number;
  count: number;
}

export interface Digest {
  totalPaise: number;
  txnCount: number;
  byCategory: Record<string, number>;
  byMethod: Record<string, number>;
  plannedPaise: number;
  variancePaise: number;
  topMerchants: DigestMerchant[];
  sentAt?: Date;
}

export interface Bill {
  id: string;
  name: string;
  amountPaise: number;
  dueDay: number;
  autopay: boolean;
  category: Category;
  isSubscription?: boolean;
}

export interface NewBill {
  name: string;
  amountPaise: number;
  dueDay: number;
  autopay: boolean;
  category: Category;
  isSubscription?: boolean;
}

export interface NotifPrefs {
  eveningDigest: boolean;
  digestTime: string;
  morningNudge: boolean;
}

export interface ConsentEntry {
  purpose: string;
  grantedAt: unknown;
  noticeVersion: string;
  /** False when the user withdrew this consent; defaults to true. */
  granted?: boolean;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/** yyyy-MM-dd key in the given IANA timezone (default Asia/Kolkata). */
export function dayKey(date: Date = new Date(), timeZone = 'Asia/Kolkata'): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Collapse whitespace + lowercase. Used for the stored `merchant` field. */
export function normalizeMerchant(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}
