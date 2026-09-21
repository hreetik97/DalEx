// Asia/Kolkata date helpers. All user-facing day keys use IST.

export const IST_TIMEZONE = 'Asia/Kolkata';

/** yyyy-MM-dd for `date` in Asia/Kolkata. */
export function istDayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (t: string): string => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Epoch millis of 00:00:00 IST on the day containing `date`.
 * IST is UTC+5:30 year-round (no daylight saving).
 */
export function istDayStartMs(date: Date): number {
  const [y, m, d] = istDayKey(date).split('-').map(Number);
  return Date.UTC(y, m - 1, d) - (5 * 60 + 30) * 60_000;
}

/** Epoch millis of the next IST midnight after the day containing `date`. */
export function istDayEndMs(date: Date): number {
  return istDayStartMs(date) + 24 * 60 * 60_000;
}

/**
 * Is `now` at or past "HH:MM" (24h) in `timeZone` (default Asia/Kolkata)?
 * Used to decide whether a user's digestTime has passed.
 */
export function isPastTime(now: Date, hhmm: string, timeZone: string = IST_TIMEZONE): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return false;
  const targetMin = Number(m[1]) * 60 + Number(m[2]);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const min = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return h * 60 + min >= targetMin;
}
