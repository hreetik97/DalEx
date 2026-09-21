// Pure rollup math for onTransactionWrite.
// Deltas are computed from the affected doc only (created: +amount,
// deleted: -amount, updated: diff old vs new), then applied with
// FieldValue.increment() — so a retried trigger is safe to re-run.

import { istDayKey } from './time';
import { validateTransaction, TransactionDoc, ValidTransaction } from './types';

/** A validated transaction reduced to what the rollup needs. */
export interface TxnSnapshot {
  amountPaise: number;
  category: string;
  method: string;
  dayKey: string; // IST yyyy-MM-dd
}

export interface DayDelta {
  totalPaise: number;
  txnCount: number;
  byCategory: Record<string, number>;
  byMethod: Record<string, number>;
}

export interface RollupDelta {
  days: Map<string, DayDelta>;
  budgets: Map<string, number>; // category -> spentPaise delta
}

const emptyDayDelta = (): DayDelta => ({
  totalPaise: 0,
  txnCount: 0,
  byCategory: {},
  byMethod: {},
});

const emptyDelta = (): RollupDelta => ({ days: new Map(), budgets: new Map() });

/** Apply a signed contribution (+1 create / -1 delete) to a delta. */
function applyContribution(delta: RollupDelta, txn: TxnSnapshot, sign: 1 | -1): void {
  let day = delta.days.get(txn.dayKey);
  if (!day) {
    day = emptyDayDelta();
    delta.days.set(txn.dayKey, day);
  }
  day.totalPaise += sign * txn.amountPaise;
  day.txnCount += sign;
  day.byCategory[txn.category] = (day.byCategory[txn.category] || 0) + sign * txn.amountPaise;
  day.byMethod[txn.method] = (day.byMethod[txn.method] || 0) + sign * txn.amountPaise;
  delta.budgets.set(txn.category, (delta.budgets.get(txn.category) || 0) + sign * txn.amountPaise);
}

function snapshot(txn: ValidTransaction): TxnSnapshot {
  return {
    amountPaise: txn.amountPaise,
    category: txn.category,
    method: txn.method,
    dayKey: istDayKey(txn.txnAt),
  };
}

/** A created doc adds its full contribution. */
export function deltaForCreate(doc: TransactionDoc): RollupDelta {
  const txn = validateTransaction(doc);
  if (!txn) return emptyDelta();
  const delta = emptyDelta();
  applyContribution(delta, snapshot(txn), 1);
  return delta;
}

/** A deleted doc removes its full contribution. */
export function deltaForDelete(doc: TransactionDoc): RollupDelta {
  const txn = validateTransaction(doc);
  if (!txn) return emptyDelta();
  const delta = emptyDelta();
  applyContribution(delta, snapshot(txn), -1);
  return delta;
}

/**
 * An updated doc: remove the old contribution, add the new one.
 * Handles amount, category, method, and day (txnAt) changes in one pass.
 * If the old snapshot is invalid (shouldn't happen), treat as create;
 * if the new one is invalid, treat as delete.
 */
export function deltaForUpdate(before: TransactionDoc, after: TransactionDoc): RollupDelta {
  const oldTxn = validateTransaction(before);
  const newTxn = validateTransaction(after);
  if (!oldTxn && !newTxn) return emptyDelta();
  if (!oldTxn && newTxn) return deltaForCreate(after);
  if (oldTxn && !newTxn) return deltaForDelete(before);
  const delta = emptyDelta();
  applyContribution(delta, snapshot(oldTxn as ValidTransaction), -1);
  applyContribution(delta, snapshot(newTxn as ValidTransaction), 1);
  return delta;
}

/** True when the delta is a no-op (nothing changed). */
export function isEmptyDelta(delta: RollupDelta): boolean {
  return delta.days.size === 0 && delta.budgets.size === 0;
}
