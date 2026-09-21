// Money helpers. Money is integer paise everywhere — never floats.
// (Mirrors packages/shared; duplicated because shared is ESM JS.)

const paise = (v: number): number => Math.abs(Math.trunc(v));

/** 12999 -> "₹129.99" (en-IN grouping). */
export function formatINR(paiseAmount: number): string {
  const sign = paiseAmount < 0 ? '-' : '';
  const abs = paise(paiseAmount);
  const rupees = Math.trunc(abs / 100);
  const p = String(abs % 100).padStart(2, '0');
  return `${sign}₹${rupees.toLocaleString('en-IN')}.${p}`;
}

/** "129.99" | 129.99 -> 12999. Returns null on invalid input. */
export function toPaise(input: string | number): number | null {
  const s = typeof input === 'number' ? input.toFixed(2) : input;
  if (typeof s !== 'string') return null;
  const m = s
    .trim()
    .replace(/,/g, '')
    .match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) return null;
  const value = BigInt(m[2]) * 100n + BigInt((m[3] || '0').padEnd(2, '0'));
  return Number(m[1] ? -value : value);
}
