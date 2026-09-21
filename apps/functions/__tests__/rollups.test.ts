// Unit tests for rollup delta math. All figures are SAMPLE data for tests.
import { deltaForCreate, deltaForDelete, deltaForUpdate, isEmptyDelta } from '../src/lib/rollups';
import { TransactionDoc } from '../src/lib/types';

const base: TransactionDoc = {
  amountPaise: 25000,
  merchant: 'Swiggy',
  category: 'food',
  method: 'upi',
  txnAt: new Date('2026-09-21T10:00:00Z'), // 15:30 IST -> 2026-09-21
  source: 'manual',
};

describe('deltaForCreate', () => {
  it('adds the full contribution', () => {
    const d = deltaForCreate(base);
    const day = d.days.get('2026-09-21');
    expect(day).toBeDefined();
    expect(day!.totalPaise).toBe(25000);
    expect(day!.txnCount).toBe(1);
    expect(day!.byCategory).toEqual({ food: 25000 });
    expect(day!.byMethod).toEqual({ upi: 25000 });
    expect(d.budgets.get('food')).toBe(25000);
  });

  it('ignores invalid docs', () => {
    expect(isEmptyDelta(deltaForCreate({ ...base, amountPaise: 25.5 }))).toBe(true); // float paise
    expect(isEmptyDelta(deltaForCreate({ ...base, amountPaise: -100 }))).toBe(true);
    expect(isEmptyDelta(deltaForCreate({ ...base, category: 'yachts' }))).toBe(true);
    expect(isEmptyDelta(deltaForCreate({ ...base, txnAt: 'not-a-date' }))).toBe(true);
  });
});

describe('deltaForDelete', () => {
  it('removes the full contribution', () => {
    const d = deltaForDelete(base);
    const day = d.days.get('2026-09-21');
    expect(day!.totalPaise).toBe(-25000);
    expect(day!.txnCount).toBe(-1);
    expect(d.budgets.get('food')).toBe(-25000);
  });
});

describe('deltaForUpdate', () => {
  it('applies amount diffs', () => {
    const d = deltaForUpdate(base, { ...base, amountPaise: 30000 });
    const day = d.days.get('2026-09-21');
    expect(day!.totalPaise).toBe(5000);
    expect(day!.txnCount).toBe(0);
    expect(day!.byCategory).toEqual({ food: 5000 });
    expect(d.budgets.get('food')).toBe(5000);
  });

  it('moves spend between categories and methods', () => {
    const d = deltaForUpdate(base, { ...base, category: 'groceries', method: 'card' });
    const day = d.days.get('2026-09-21');
    expect(day!.totalPaise).toBe(0);
    expect(day!.txnCount).toBe(0);
    expect(day!.byCategory).toEqual({ food: -25000, groceries: 25000 });
    expect(day!.byMethod).toEqual({ upi: -25000, card: 25000 });
    expect(d.budgets.get('food')).toBe(-25000);
    expect(d.budgets.get('groceries')).toBe(25000);
  });

  it('moves spend between IST days when txnAt changes day', () => {
    const after = { ...base, txnAt: new Date('2026-09-21T20:00:00Z') }; // 01:30 IST -> 2026-09-22
    const d = deltaForUpdate(base, after);
    const oldDay = d.days.get('2026-09-21');
    const newDay = d.days.get('2026-09-22');
    expect(oldDay!.totalPaise).toBe(-25000);
    expect(oldDay!.txnCount).toBe(-1);
    expect(newDay!.totalPaise).toBe(25000);
    expect(newDay!.txnCount).toBe(1);
    // Budget is day-agnostic: net zero.
    expect(d.budgets.get('food')).toBe(0);
  });

  it('is a no-op when nothing meaningful changed', () => {
    const d = deltaForUpdate(base, { ...base, note: 'added a note' });
    const day = d.days.get('2026-09-21');
    expect(day!.totalPaise).toBe(0);
    expect(day!.txnCount).toBe(0);
  });

  it('treats invalid-new as delete and invalid-old as create', () => {
    const asDelete = deltaForDelete({ ...base, amountPaise: 25.5 });
    expect(isEmptyDelta(asDelete)).toBe(true);
    const d = deltaForUpdate(base, { ...base, amountPaise: 25.5 });
    expect(d.days.get('2026-09-21')!.totalPaise).toBe(-25000); // removes old
    const c = deltaForUpdate({ ...base, amountPaise: 25.5 }, base);
    expect(c.days.get('2026-09-21')!.totalPaise).toBe(25000); // adds new
  });
});
