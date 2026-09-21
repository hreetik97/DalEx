// Category / method / source presentation metadata (apps/mobile/src/categoryMeta.ts).
// The shared taxonomy uses lowercase enums; DESIGN.md locks hues + Ionicons glyphs.
// Glyphs always accompany category color — never a bare dot.
import type { Category, Method, TxnSource } from './data/types';

export interface CategoryMeta {
  label: string;
  hue: string;
  glyph: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  food: { label: 'Food', hue: '#FB923C', glyph: 'fast-food-outline' },
  groceries: { label: 'Groceries', hue: '#4ADE80', glyph: 'cart-outline' },
  transport: { label: 'Transport', hue: '#5B8CFF', glyph: 'car-outline' },
  shopping: { label: 'Shopping', hue: '#FB7185', glyph: 'bag-outline' },
  bills: { label: 'Bills', hue: '#A78BFA', glyph: 'receipt-outline' },
  health: { label: 'Health', hue: '#F472B6', glyph: 'heart-outline' },
  entertainment: { label: 'Entertainment', hue: '#E879F9', glyph: 'film-outline' },
  travel: { label: 'Travel', hue: '#22D3EE', glyph: 'airplane-outline' },
  education: { label: 'Education', hue: '#FACC15', glyph: 'school-outline' },
  other: { label: 'Other', hue: '#94A3B8', glyph: 'shapes-outline' },
};

export function categoryMeta(category: string): CategoryMeta {
  return (CATEGORY_META as Record<string, CategoryMeta>)[category] ?? CATEGORY_META.other;
}

export interface MethodMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
  glyph: string;
}

export const METHOD_META: Record<Method, MethodMeta> = {
  upi: {
    label: 'UPI',
    badgeBg: 'rgba(52,211,153,0.16)',
    badgeText: '#6EE7B7',
    glyph: 'phone-portrait-outline',
  },
  card: {
    label: 'Card',
    badgeBg: 'rgba(91,140,255,0.18)',
    badgeText: '#9DB9FF',
    glyph: 'card-outline',
  },
  netbanking: {
    label: 'NetBanking',
    badgeBg: 'rgba(167,139,250,0.18)',
    badgeText: '#C4B5FD',
    glyph: 'globe-outline',
  },
  cash: {
    label: 'Cash',
    badgeBg: 'rgba(148,163,184,0.18)',
    badgeText: '#CBD5E1',
    glyph: 'cash-outline',
  },
};

export function methodMeta(method: string): MethodMeta {
  return (METHOD_META as Record<string, MethodMeta>)[method] ?? METHOD_META.cash;
}

export const SOURCE_LABELS: Record<TxnSource, string> = {
  manual: 'Manual',
  sms: 'SMS',
  email: 'Email',
  bank: 'Bank',
};

export function sourceLabel(source: string): string {
  return (SOURCE_LABELS as Record<string, string>)[source] ?? source;
}

/** "8:12 AM" in Asia/Kolkata. */
export function formatTimeIST(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/** "22 Sep 2026" in Asia/Kolkata. */
export function formatDateIST(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
