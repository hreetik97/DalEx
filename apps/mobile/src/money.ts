// Money formatting for the UI (apps/mobile/src/money.ts).
// Money is integer paise everywhere. Per DESIGN.md §7 rule 5, paise are never
// shown to users: ₹989, not ₹989.00. Sub-rupee amounts round to the rupee.

/** 12999 paise -> "₹130". */
export function inrPaise(paise: number): string {
  const rupees = Math.round(paise / 100);
  return '₹' + rupees.toLocaleString('en-IN');
}

/** 12999 paise -> "₹129.99" — only for contexts that need exactness (debug). */
export function inrPaiseExact(paise: number): string {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(Math.trunc(paise));
  const rupees = Math.trunc(abs / 100);
  const p = String(abs % 100).padStart(2, '0');
  return `${sign}₹${rupees.toLocaleString('en-IN')}.${p}`;
}
