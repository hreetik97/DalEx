// Unit tests for digest math. All figures are SAMPLE data for tests.
import {
  aggregateTransactions,
  plannedPaiseFor,
  variancePaise,
  MAX_TOP_MERCHANTS,
} from '../src/lib/digest';
import { istDayKey, istDayStartMs, istDayEndMs, isPastTime } from '../src/lib/time';

describe('aggregateTransactions', () => {
  it('aggregates totals, byCategory, byMethod', () => {
    const agg = aggregateTransactions([
      { amountPaise: 25000, merchant: 'Swiggy', category: 'food', method: 'upi' },
      { amountPaise: 15000, merchant: 'Swiggy', category: 'food', method: 'upi' },
      { amountPaise: 50000, merchant: 'Amazon', category: 'shopping', method: 'card' },
    ]);
    expect(agg.totalPaise).toBe(90000);
    expect(agg.txnCount).toBe(3);
    expect(agg.byCategory).toEqual({ food: 40000, shopping: 50000 });
    expect(agg.byMethod).toEqual({ upi: 40000, card: 50000 });
  });

  it('ranks top merchants by spend, capped at 5', () => {
    const txns = Array.from({ length: 7 }, (_, i) => ({
      amountPaise: (i + 1) * 1000,
      merchant: `M${i}`,
      category: 'food',
      method: 'upi',
    }));
    const agg = aggregateTransactions(txns);
    expect(agg.topMerchants).toHaveLength(MAX_TOP_MERCHANTS);
    expect(agg.topMerchants[0]).toEqual({ merchant: 'M6', totalPaise: 7000, count: 1 });
    expect(agg.topMerchants[4]).toEqual({ merchant: 'M2', totalPaise: 3000, count: 1 });
  });

  it('counts repeat visits per merchant', () => {
    const agg = aggregateTransactions([
      { amountPaise: 10000, merchant: 'Metro', category: 'transport', method: 'upi' },
      { amountPaise: 10000, merchant: 'Metro', category: 'transport', method: 'upi' },
    ]);
    expect(agg.topMerchants).toEqual([{ merchant: 'Metro', totalPaise: 20000, count: 2 }]);
  });

  it('handles an empty day', () => {
    const agg = aggregateTransactions([]);
    expect(agg).toEqual({
      totalPaise: 0,
      txnCount: 0,
      byCategory: {},
      byMethod: {},
      topMerchants: [],
    });
  });
});

describe('planned vs actual', () => {
  it('sums plan estimates', () => {
    expect(plannedPaiseFor([{ estimatePaise: 50000 }, { estimatePaise: 20000 }])).toBe(70000);
    expect(plannedPaiseFor([])).toBe(0);
  });

  it('variance is positive when overspent, negative when under', () => {
    expect(variancePaise(90000, 70000)).toBe(20000); // overspent
    expect(variancePaise(50000, 70000)).toBe(-20000); // under plan
    expect(variancePaise(0, 0)).toBe(0);
  });
});

describe('IST day boundaries', () => {
  // IST = UTC+5:30. 2026-09-21T18:30:00Z is exactly 2026-09-22 00:00 IST.
  it('splits the day at IST midnight, not UTC midnight', () => {
    expect(istDayKey(new Date('2026-09-21T18:29:59Z'))).toBe('2026-09-21');
    expect(istDayKey(new Date('2026-09-21T18:30:00Z'))).toBe('2026-09-22');
    expect(istDayKey(new Date('2026-09-21T12:00:00Z'))).toBe('2026-09-21'); // 17:30 IST
  });

  it('day start/end bracket exactly one IST day', () => {
    const now = new Date('2026-09-21T12:00:00Z');
    const start = istDayStartMs(now);
    const end = istDayEndMs(now);
    expect(end - start).toBe(24 * 60 * 60 * 1000);
    expect(new Date(start).toISOString()).toBe('2026-09-20T18:30:00.000Z');
    expect(new Date(end).toISOString()).toBe('2026-09-21T18:30:00.000Z');
    expect(now.getTime()).toBeGreaterThanOrEqual(start);
    expect(now.getTime()).toBeLessThan(end);
  });

  it('isPastTime respects IST', () => {
    // 15:30 UTC = 21:00 IST
    expect(isPastTime(new Date('2026-09-21T15:30:00Z'), '21:00')).toBe(true);
    expect(isPastTime(new Date('2026-09-21T15:29:00Z'), '21:00')).toBe(false);
    // Custom digest time
    expect(isPastTime(new Date('2026-09-21T15:30:00Z'), '22:00')).toBe(false);
    expect(isPastTime(new Date('2026-09-21T15:30:00Z'), '09:00')).toBe(true);
    expect(isPastTime(new Date('2026-09-21T15:30:00Z'), 'not-a-time')).toBe(false);
  });
});
