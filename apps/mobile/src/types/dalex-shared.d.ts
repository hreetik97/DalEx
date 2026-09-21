// Type declarations for @dalex/shared (plain JS workspace package, no .d.ts shipped).
declare module '@dalex/shared' {
  export function formatPaise(paise: number, opts?: { symbol?: string }): string;
  export function toPaise(input: string | number): number | null;
  export const CATEGORIES: readonly string[];
  export const METHODS: readonly string[];
  export const SOURCES: readonly string[];
  export function dedupeKey(args: {
    merchant: string;
    amountPaise: number;
    txnAt: Date | string;
    method: string;
  }): string;
}
