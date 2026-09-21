// Pure digest math for scheduledDigest. No Firestore/Admin imports here,
// so these are unit-testable without the emulator.

export interface DigestInputTxn {
  amountPaise: number;
  merchant: string;
  category: string;
  method: string;
}

export interface TopMerchant {
  merchant: string;
  totalPaise: number;
  count: number;
}

export interface DigestAggregation {
  totalPaise: number;
  txnCount: number;
  byCategory: Record<string, number>;
  byMethod: Record<string, number>;
  topMerchants: TopMerchant[];
}

export const MAX_TOP_MERCHANTS = 5;

/** Aggregate one day's transactions into digest components. */
export function aggregateTransactions(txns: DigestInputTxn[]): DigestAggregation {
  const byCategory: Record<string, number> = {};
  const byMethod: Record<string, number> = {};
  const merchantMap = new Map<string, { totalPaise: number; count: number }>();
  let totalPaise = 0;

  for (const t of txns) {
    totalPaise += t.amountPaise;
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amountPaise;
    byMethod[t.method] = (byMethod[t.method] || 0) + t.amountPaise;
    const name = t.merchant && t.merchant.length > 0 ? t.merchant : 'Unknown';
    const agg = merchantMap.get(name) || { totalPaise: 0, count: 0 };
    agg.totalPaise += t.amountPaise;
    agg.count += 1;
    merchantMap.set(name, agg);
  }

  const topMerchants = [...merchantMap.entries()]
    .map(([merchant, agg]) => ({ merchant, ...agg }))
    .sort((a, b) => b.totalPaise - a.totalPaise || b.count - a.count)
    .slice(0, MAX_TOP_MERCHANTS);

  return { totalPaise, txnCount: txns.length, byCategory, byMethod, topMerchants };
}

export interface PlanItem {
  estimatePaise: number;
}

/** Sum of the day's plan estimates. */
export function plannedPaiseFor(items: PlanItem[]): number {
  return items.reduce((sum, i) => sum + (Number.isInteger(i.estimatePaise) ? i.estimatePaise : 0), 0);
}

/**
 * Planned-vs-actual variance in paise.
 * Convention: variancePaise = totalPaise - plannedPaise.
 * Positive = overspent relative to plan; negative = under plan.
 */
export function variancePaise(totalPaise: number, plannedPaise: number): number {
  return totalPaise - plannedPaise;
}
