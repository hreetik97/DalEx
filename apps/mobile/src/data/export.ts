// CSV export of the user's transactions (apps/mobile/src/data/export.ts).
// Columns: Date (IST), Merchant, Category, Method, Source, Amount (₹), Note.
// Native: writes to the cache dir (new expo-file-system File API, SDK 57) and
// opens the OS share sheet via expo-sharing. Web: triggers a Blob download.
// Verified against:
// - https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/ (File/Paths API)
// - https://docs.expo.dev/versions/v57.0.0/sdk/sharing/ (shareAsync)
import { Platform } from 'react-native';
import { fetchTransactions } from './transactions';
import { categoryMeta, formatDateIST, formatTimeIST } from '../categoryMeta';

function csvCell(value: string): string {
  const v = value.replace(/"/g, '""');
  return /[",\n]/.test(v) ? `"${v}"` : v;
}

async function transactionsCsv(uid: string): Promise<{ csv: string; rowCount: number }> {
  const txns = await fetchTransactions(uid);
  const rows = [
    'Date,Time (IST),Merchant,Category,Method,Source,Amount (INR),Note',
  ];
  for (const t of txns) {
    rows.push(
      [
        formatDateIST(t.txnAt),
        formatTimeIST(t.txnAt),
        csvCell(t.merchantRaw),
        csvCell(categoryMeta(t.category).label),
        t.method,
        t.source,
        (t.amountPaise / 100).toFixed(2),
        csvCell(t.note ?? ''),
      ].join(',')
    );
  }
  return { csv: rows.join('\n'), rowCount: txns.length };
}

function exportFileName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `hisab-transactions-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.csv`;
}

/**
 * Export all (up to 2000) transactions as CSV and share/download it.
 * Returns the number of exported rows. Throws on failure.
 */
export async function exportTransactionsCsv(uid: string): Promise<number> {
  const { csv, rowCount } = await transactionsCsv(uid);
  const filename = exportFileName();

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return rowCount;
  }

  const [{ File, Paths }, Sharing] = await Promise.all([
    import('expo-file-system'),
    import('expo-sharing'),
  ]);
  const file = new File(Paths.cache, filename);
  await file.write(csv);
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export transactions',
  });
  return rowCount;
}
