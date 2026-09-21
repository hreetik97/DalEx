// History on live Firestore data (apps/mobile/src/app/(tabs)/history.tsx).
// Paginated watch (limit doubles on "load more"), segmented by IST day into
// Today / Yesterday / Earlier. Reuses TransactionRow + TransactionSheet from
// components (import only); recategorize writes through updateCategory.
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import TransactionRow from '../../components/TransactionRow';
import TransactionSheet from '../../components/TransactionSheet';
import { useAuth } from '../../data/auth';
import { watchTransactions } from '../../data/transactions';
import { exportTransactionsCsv } from '../../data/export';
import { dayKey, type Transaction } from '../../data/types';
import { formatDateIST } from '../../categoryMeta';
import { inrPaise } from '../../money';
import { TabScreen, EmptyState, SectionLabel } from './_shared';

const PAGE = 50;

function dayLabel(key: string, todayKey: string, yesterdayKey: string): string {
  if (key === todayKey) return 'Today';
  if (key === yesterdayKey) return 'Yesterday';
  return formatDateIST(new Date(key + 'T12:00:00'));
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    return watchTransactions(
      user.uid,
      { limit },
      (t) => {
        setTxns(t);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [user, limit]);

  const now = new Date();
  const todayKey = dayKey(now);
  const yesterdayKey = dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of txns) {
      const key = dayKey(t.txnAt);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return [...map.entries()].map(([key, items]) => ({
      key,
      label: dayLabel(key, todayKey, yesterdayKey),
      total: items.reduce((s, t) => s + t.amountPaise, 0),
      items,
    }));
  }, [txns, todayKey, yesterdayKey]);

  function openSheet(t: Transaction) {
    setSelected(t);
  }

  async function onExport() {
    if (!user || exporting) return;
    setExporting(true);
    try {
      const count = await exportTransactionsCsv(user.uid);
      if (count === 0) {
        Alert.alert('Nothing to export', 'Log an expense first, then export your history.');
      }
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <TabScreen title="History" subtitle="Every payment, newest first">
      {txns.length > 0 && (
        <Pressable
          onPress={onExport}
          disabled={exporting}
          style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Export transactions as CSV"
          accessibilityHint="Downloads or shares a CSV of your transaction history"
        >
          {exporting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="download-outline" size={16} color={colors.inkSoft} />
          )}
          <Text style={styles.exportText}>{exporting ? 'Exporting…' : 'Export CSV'}</Text>
        </Pressable>
      )}
      {loading && txns.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : txns.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Nothing here yet"
          body="Your payments will appear here the moment you log them from Home."
        />
      ) : (
        <>
          {groups.map((g) => (
            <View key={g.key}>
              <View style={styles.groupHead}>
                <SectionLabel>{g.label}</SectionLabel>
                <Text style={styles.groupTotal}>{inrPaise(g.total)}</Text>
              </View>
              {g.items.map((t) => (
                <TransactionRow key={t.id} txn={t} onPress={openSheet} />
              ))}
            </View>
          ))}
          {txns.length >= limit && (
            <Pressable
              style={styles.moreBtn}
              onPress={() => setLimit((l) => l + PAGE)}
              accessibilityRole="button"
              accessibilityLabel="Load more transactions"
            >
              <Text style={styles.moreText}>Load more</Text>
            </Pressable>
          )}
          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
        </>
      )}

      <TransactionSheet
        key={selected?.id}
        txn={selected}
        uid={user?.uid ?? null}
        onClose={() => setSelected(null)}
      />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  groupHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  groupTotal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  moreBtn: {
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  moreText: { fontSize: 14, fontWeight: '700', color: colors.inkSoft },
  exportBtn: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 12,
    minHeight: 44,
  },
  exportText: { fontSize: 13.5, fontWeight: '700', color: colors.inkSoft },
});
