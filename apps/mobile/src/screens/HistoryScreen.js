import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { colors, inr } from '../theme';
import { monthCategories, monthTotal, monthCount, yesterdayTxns, yearMonths, yearTotal } from '../data';
import CategoryBar from '../components/CategoryBar';
import TransactionRow from '../components/TransactionRow';
import TransactionSheet from '../components/TransactionSheet';
import GlassCard from '../components/GlassCard';
import GlassBackground from '../components/GlassBackground';

const maxCat = Math.max(...monthCategories.map((c) => c.amount));
const maxMonth = Math.max(...yearMonths.map((m) => m.amount));
const yesterdayTotal = yesterdayTxns.reduce((s, t) => s + t.amount, 0);

const TABS = [
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' },
];

export default function HistoryScreen() {
  const [tab, setTab] = useState('yesterday');
  const [sheetTxn, setSheetTxn] = useState(null);
  const [overrides, setOverrides] = useState({});
  const recategorize = (id, cat) => setOverrides((o) => ({ ...o, [id]: cat }));
  const yTxns = yesterdayTxns.map((t) => ({ ...t, category: overrides[t.id] || t.category }));

  return (
    <View style={styles.root}>
      <GlassBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Every rupee, remembered</Text>

          <BlurView intensity={35} tint="dark" style={styles.segment}>
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  style={[styles.segBtn, active && styles.segActive]}
                >
                  <Text style={[styles.segText, active && styles.segTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </BlurView>

          {tab === 'yesterday' && (
            <>
              <GlassCard strong intensity={55} style={styles.card}>
                <Text style={styles.cardLabel}>YESTERDAY’S WRAP-UP</Text>
                <Text style={styles.big}>{inr(yesterdayTotal)}</Text>
                <Text style={styles.muted}>{yTxns.length} payments · every rupee, remembered</Text>
              </GlassCard>
              {yTxns.map((t) => (
                <TransactionRow key={t.id} txn={t} onPress={setSheetTxn} />
              ))}
            </>
          )}

          {tab === 'month' && (
            <GlassCard strong intensity={55} style={styles.card}>
              <Text style={styles.cardLabel}>SEPTEMBER TOTAL</Text>
              <Text style={styles.big}>{inr(monthTotal)}</Text>
              <Text style={styles.muted}>{monthCount} payments · UPI + cards</Text>
              <View style={styles.divider} />
              {monthCategories.map((c) => (
                <CategoryBar key={c.name} name={c.name} amount={c.amount} max={maxCat} />
              ))}
            </GlassCard>
          )}

          {tab === 'year' && (
            <GlassCard strong intensity={55} style={styles.card}>
              <Text style={styles.cardLabel}>2026 SO FAR</Text>
              <Text style={styles.big}>{inr(yearTotal)}</Text>
              <Text style={styles.muted}>9 months tracked</Text>
              <View style={styles.yearChart}>
                {yearMonths.map((m, i) => (
                  <View key={i} style={styles.mCol}>
                    <View style={styles.mTrack}>
                      <View
                        style={[styles.mFill, { height: `${Math.max(6, (m.amount / maxMonth) * 100)}%` }]}
                      />
                    </View>
                    <Text style={styles.mLabel}>{m.m}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.divider} />
              <Text style={styles.note}>
                September is on track to be your lightest month this year — down 11% from August.
              </Text>
            </GlassCard>
          )}
          <View style={{ height: 150 }} />
        </ScrollView>
      </SafeAreaView>

      <TransactionSheet
        txn={sheetTxn ? { ...sheetTxn, category: overrides[sheetTxn.id] || sheetTxn.category } : null}
        visible={!!sheetTxn}
        onClose={() => setSheetTxn(null)}
        onRecategorize={recategorize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  container: { padding: 20 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 3, marginBottom: 16 },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: 24, padding: 4, marginBottom: 16, overflow: 'hidden',
  },
  segBtn: { flex: 1, borderRadius: 20, paddingVertical: 9, alignItems: 'center' },
  segActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  segText: { fontSize: 13.5, fontWeight: '600', color: colors.muted },
  segTextActive: { color: colors.ink, fontWeight: '700' },
  card: { padding: 18, marginBottom: 14 },
  cardLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.8, color: colors.faint, marginBottom: 10 },
  big: { fontSize: 34, fontWeight: '800', color: colors.ink, letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  muted: { fontSize: 13, color: colors.muted, marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.10)', marginVertical: 16 },
  yearChart: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, height: 170 },
  mCol: { flex: 1, alignItems: 'center' },
  mTrack: { height: 120, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  mFill: { width: 20, borderRadius: 6, backgroundColor: colors.primary },
  mLabel: { fontSize: 10, color: colors.muted, marginTop: 8, fontWeight: '600' },
  note: { fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 },
});
