// Shared primitives for Hisab (used by apps/mobile and apps/functions).
// MONEY: integer paise everywhere. Never floats.

// --- Paise helpers ---
// 12999 paise -> "₹129.99"
export function formatPaise(paise, { symbol = '₹' } = {}) {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(Math.trunc(paise));
  const rupees = Math.trunc(abs / 100);
  const p = String(abs % 100).padStart(2, '0');
  return `${sign}${symbol}${rupees.toLocaleString('en-IN')}.${p}`;
}

// "129.99" or 129.99 -> 12999. Returns null on invalid input.
export function toPaise(input) {
  if (typeof input === 'number') input = input.toFixed(2);
  if (typeof input !== 'string') return null;
  const m = input.trim().replace(/,/g, '').match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) return null;
  const value = BigInt(m[2]) * 100n + BigInt((m[3] || '0').padEnd(2, '0'));
  return Number(m[1] ? -value : value);
}

// --- Category taxonomy (must match Firestore rules enum + UI glyphs) ---
export const CATEGORIES = [
  'food', 'groceries', 'transport', 'shopping', 'bills',
  'health', 'entertainment', 'travel', 'education', 'other',
];

// --- Payment methods ---
export const METHODS = ['upi', 'card', 'netbanking', 'cash'];

// --- Transaction sources ---
export const SOURCES = ['manual', 'sms', 'email', 'bank'];

// --- Dedupe normalization ---
// Key: normalized merchant | amountPaise | yyyy-MM-dd | method.
// Sources dedupe within a 48h window; bank evidence wins; manual is never auto-deleted.
export function dedupeKey({ merchant, amountPaise, txnAt, method }) {
  const normMerchant = String(merchant || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const day = (txnAt instanceof Date ? txnAt : new Date(txnAt)).toISOString().slice(0, 10);
  return `${normMerchant}|${amountPaise}|${day}|${method}`;
}
