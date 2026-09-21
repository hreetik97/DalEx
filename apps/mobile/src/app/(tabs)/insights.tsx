// Insights on live Firestore data (apps/mobile/src/app/(tabs)/insights.tsx).
// Aggregates client-side from watchTransactions(): 7-day chart (IST, peak
// highlighted), this-month category breakdown, payment-method split and top
// merchants. Honest empty state when there is nothing to show yet.
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import GlassCard from '../../components/GlassCard';
import InsightCard from '../../components/InsightCard';
import { useAuth } from '../../data/auth';
import { watchTransactions } from '../../data/transactions';
import { dayKey, type Transaction } from '../../data/types';
import { categoryMeta, methodMeta } from '../../categoryMeta';
import { inrPaise } from '../../money';
import { TabScreen, EmptyState, SectionLabel } from './_shared';

function last7DaysIST(): { key: string; label: string; total: number }[] {
  const days: { key: string; label: string; total: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = dayKey(d);
    const label = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'narrow' }).format(d);
    days.push({ key, label, total: 0 });
  }
  return days;
}

function thisMonthKey(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}`;
}

function prevMonthKey(): string {
  const nowIst = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const prev = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth() - 1, 1));
  const y = prev.getUTCFullYear();
  const m = String(prev.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function dayOfMonthIST(): number {
  return Number(
    new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' }).format(new Date())
  );
}

function shortDayLabel(key: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
  }).format(new Date(key + 'T12:00:00'));
}

export default function InsightsScreen() {
  const { user } = useAuth();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    return watchTransactions(
      user.uid,
      { limit: 500 },
      (t) => {
        setTxns(t);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [user]);

  const stats = useMemo(() => {
    const days = last7DaysIST();
    const dayIndex = new Map(days.map((d, i) => [d.key, i]));
    const monthKey = thisMonthKey();
    const byCategory = new Map<string, number>();
    const byMethod = new Map<string, number>();
    const byMerchant = new Map<string, { total: number; count: number; category: string }>();
    let monthTotal = 0;

    for (const t of txns) {
      const key = dayKey(t.txnAt);
      const di = dayIndex.get(key);
      if (di !== undefined) days[di].total += t.amountPaise;
      if (key.startsWith(monthKey)) {
        monthTotal += t.amountPaise;
        byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amountPaise);
      }
      byMethod.set(t.method, (byMethod.get(t.method) ?? 0) + t.amountPaise);
      const m = byMerchant.get(t.merchant) ?? { total: 0, count: 0, category: t.category };
      m.total += t.amountPaise;
      m.count += 1;
      byMerchant.set(t.merchant, m);
    }

    const categories = [...byCategory.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
    const maxCat = Math.max(1, ...categories.map((c) => c.total));

    const maxDay = Math.max(1, ...days.map((d) => d.total));

    const split = [...byMethod.entries()]
      .map(([method, total]) => ({ method, total }))
      .sort((a, b) => b.total - a.total);
    const splitTotal = Math.max(1, split.reduce((s, p) => s + p.total, 0));

    const merchants = [...byMerchant.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return { days, maxDay, categories, maxCat, monthTotal, split, splitTotal, merchants };
  }, [txns]);

  const monthlyReport = useMemo(() => {
    const curKey = thisMonthKey();
    const prevKey = prevMonthKey();
    const dayTotals = new Map<string, number>();
    let lastMonthTotal = 0;
    for (const t of txns) {
      const key = dayKey(t.txnAt);
      if (key.startsWith(curKey)) {
        dayTotals.set(key, (dayTotals.get(key) ?? 0) + t.amountPaise);
      } else if (key.startsWith(prevKey)) {
        lastMonthTotal += t.amountPaise;
      }
    }
    const days = [...dayTotals.entries()].sort((a, b) => b[1] - a[1]);
    const highest = days[0] ?? null;
    const lowest = days.length > 1 ? days[days.length - 1] : null;
    const elapsed = Math.max(1, dayOfMonthIST());
    const dailyAvg = stats.monthTotal / elapsed;
    const top = stats.categories[0] ?? null;
    const topShare = top ? Math.round((top.total / Math.max(1, stats.monthTotal)) * 100) : 0;
    const delta =
      lastMonthTotal > 0
        ? Math.round(((stats.monthTotal - lastMonthTotal) / lastMonthTotal) * 100)
        : null;
    return { dailyAvg, top, topShare, highest, lowest, delta, lastMonthTotal };
  }, [txns, stats]);

  const insights = useMemo(() => {    const cards: { title: string; body: string; icon: string; accent: string }[] = [];
    if (stats.categories.length > 0) {
      const top = stats.categories[0];
      const pct = Math.round((top.total / Math.max(1, stats.monthTotal)) * 100);
      cards.push({
        title: `${categoryMeta(top.category).label} leads this month`,
        body: `${inrPaise(top.total)} is ${pct}% of what you spent this month. Small trims here move the needle most.`,
        icon: categoryMeta(top.category).glyph,
        accent: categoryMeta(top.category).hue,
      });
    }
    const upi = stats.split.find((s) => s.method === 'upi');
    if (upi) {
      const pct = Math.round((upi.total / stats.splitTotal) * 100);
      cards.push({
        title: `UPI is ${pct}% of your spending`,
        body: 'Small UPI taps add up invisibly. The evening wrap-up keeps the daily total in sight.',
        icon: 'phone-portrait-outline',
        accent: colors.primary,
      });
    }
    const peak = stats.days.reduce((a, b) => (b.total > a.total ? b : a), stats.days[0]);
    if (peak && peak.total > 0) {
      cards.push({
        title: `Biggest day: ${peak.label} at ${inrPaise(peak.total)}`,
        body: 'One heavy day a week is normal. Two in a row is the pattern to watch.',
        icon: 'calendar-outline',
        accent: colors.amber,
      });
    }
    return cards.slice(0, 3);
  }, [stats]);

  return (
    <TabScreen title="Insights" subtitle="Where your money actually went">
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : txns.length === 0 ? (
        <EmptyState
          title="No spending logged yet"
          body="Add your first expense from Home and your insights will appear here automatically."
        />
      ) : (
        <>
          <GlassCard strong intensity={55} style={styles.card}>
            <Text style={styles.cardLabel}>THIS MONTH</Text>
            <Text style={styles.big}>{inrPaise(stats.monthTotal)}</Text>
            {stats.categories.map((c) => {
              const meta = categoryMeta(c.category);
              const pct = Math.max(6, Math.round((c.total / stats.maxCat) * 100));
              return (
                <View key={c.category} style={styles.catRow}>
                  <View style={styles.catTop}>
                    <View style={styles.catLabel}>
                      <View style={[styles.catIcon, { backgroundColor: meta.hue + '22' }]}>
                        <Ionicons name={meta.glyph as never} size={13} color={meta.hue} />
                      </View>
                      <Text style={styles.catName}>{meta.label}</Text>
                    </View>
                    <Text style={styles.catAmt}>{inrPaise(c.total)}</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${pct}%`, backgroundColor: meta.hue }]} />
                  </View>
                </View>
              );
            })}
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.cardLabel}>HOW YOU PAID</Text>
            {stats.split.map((p) => {
              const meta = methodMeta(p.method);
              const pct = Math.round((p.total / stats.splitTotal) * 100);
              return (
                <View key={p.method} style={styles.splitRow}>
                  <View style={[styles.splitIcon, { backgroundColor: meta.badgeBg }]}>
                    <Ionicons name={meta.glyph as never} size={17} color={meta.badgeText} />
                  </View>
                  <View style={styles.splitText}>
                    <Text style={styles.splitName}>
                      {meta.label} · {pct}%
                    </Text>
                    <Text style={styles.splitNote}>
                      {p.method === 'upi' ? 'Instant bank transfers' : p.method === 'card' ? 'Credit & debit cards' : 'Other methods'}
                    </Text>
                  </View>
                  <Text style={styles.splitAmt}>{inrPaise(p.total)}</Text>
                </View>
              );
            })}
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.cardLabel}>LAST 7 DAYS</Text>
            <View style={styles.chart}>
              {stats.days.map((d, i) => {
                const isPeak = d.total === stats.maxDay && d.total > 0;
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <LinearGradient
                        colors={
                          isPeak
                            ? [colors.primary, 'rgba(52,211,153,0.45)']
                            : ['rgba(148,163,184,0.55)', 'rgba(148,163,184,0.18)']
                        }
                        style={[styles.barFill, { height: `${Math.max(8, (d.total / stats.maxDay) * 100)}%` }]}
                      />
                    </View>
                    <Text style={[styles.barDay, isPeak && styles.barDayPeak]}>{d.label}</Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.cardLabel}>MONTHLY REPORT</Text>
            <View style={styles.reportGrid}>
              <View style={styles.reportCell}>
                <Text style={styles.reportValue}>{inrPaise(stats.monthTotal)}</Text>
                <Text style={styles.reportCaption}>Spent this month</Text>
              </View>
              <View style={styles.reportCell}>
                <Text style={styles.reportValue}>{inrPaise(Math.round(monthlyReport.dailyAvg))}</Text>
                <Text style={styles.reportCaption}>Daily average</Text>
              </View>
            </View>
            {monthlyReport.top && (
              <View style={styles.reportRow}>
                <View style={[styles.catIcon, { backgroundColor: categoryMeta(monthlyReport.top.category).hue + '22' }]}>
                  <Ionicons name={categoryMeta(monthlyReport.top.category).glyph as never} size={14} color={categoryMeta(monthlyReport.top.category).hue} />
                </View>
                <Text style={styles.reportText}>
                  <Text style={styles.reportStrong}>{categoryMeta(monthlyReport.top.category).label}</Text>
                  {' '}takes {monthlyReport.topShare}% of this month at {inrPaise(monthlyReport.top.total)}
                </Text>
              </View>
            )}
            {monthlyReport.highest && (
              <View style={styles.reportRow}>
                <View style={[styles.catIcon, { backgroundColor: 'rgba(251,113,133,0.16)' }]}>
                  <Ionicons name="trending-up-outline" size={14} color={colors.rose} />
                </View>
                <Text style={styles.reportText}>
                  Heaviest day: <Text style={styles.reportStrong}>{shortDayLabel(monthlyReport.highest[0])}</Text>
                  {' '}at {inrPaise(monthlyReport.highest[1])}
                </Text>
              </View>
            )}
            {monthlyReport.lowest && (
              <View style={styles.reportRow}>
                <View style={[styles.catIcon, { backgroundColor: 'rgba(52,211,153,0.14)' }]}>
                  <Ionicons name="leaf-outline" size={14} color={colors.primary} />
                </View>
                <Text style={styles.reportText}>
                  Lightest day: <Text style={styles.reportStrong}>{shortDayLabel(monthlyReport.lowest[0])}</Text>
                  {' '}at {inrPaise(monthlyReport.lowest[1])}
                </Text>
              </View>
            )}
            {monthlyReport.delta !== null && (
              <Text
                style={[
                  styles.delta,
                  { color: monthlyReport.delta > 0 ? colors.rose : colors.primary },
                ]}
              >
                {monthlyReport.delta === 0
                  ? 'Right on par with last month.'
                  : monthlyReport.delta > 0
                    ? `${monthlyReport.delta}% more than last month`
                    : `${Math.abs(monthlyReport.delta)}% less than last month`}
              </Text>
            )}
          </GlassCard>

          <SectionLabel>Top merchants</SectionLabel>
          {stats.merchants.map((m) => {
            const meta = categoryMeta(m.category);
            return (
              <GlassCard key={m.name} style={styles.merchant}>
                <View style={[styles.mIcon, { backgroundColor: meta.hue + '22' }]}>
                  <Ionicons name={meta.glyph as never} size={16} color={meta.hue} />
                </View>
                <View style={styles.mText}>
                  <Text style={styles.mName} numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Text style={styles.mSub}>
                    {m.count} payment{m.count === 1 ? '' : 's'} · {meta.label}
                  </Text>
                </View>
                <Text style={styles.mAmt}>{inrPaise(m.total)}</Text>
              </GlassCard>
            );
          })}

          {insights.length > 0 && (
            <>
              <SectionLabel>Budget coach</SectionLabel>
              {insights.map((c, i) => (
                <InsightCard key={i} title={c.title} body={c.body} icon={c.icon} accent={c.accent} />
              ))}
            </>
          )}
        </>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, marginBottom: 14 },
  cardLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.8, color: colors.faint, marginBottom: 10 },
  big: {
    fontSize: 34, fontWeight: '800', color: colors.ink,
    letterSpacing: -0.8, fontVariant: ['tabular-nums'], marginBottom: 18,
  },
  catRow: { marginBottom: 14 },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  catLabel: { flexDirection: 'row', alignItems: 'center' },
  catIcon: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', marginRight: 9,
  },
  catName: { fontSize: 14, fontWeight: '600', color: colors.inkSoft },
  catAmt: { fontSize: 14, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  splitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  splitIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  splitText: { flex: 1 },
  splitName: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  splitNote: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  splitAmt: { fontSize: 14.5, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150, paddingTop: 8 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { height: 110, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  barFill: { width: 22, borderRadius: 7, overflow: 'hidden' },
  barDay: { fontSize: 11.5, color: colors.faint, marginTop: 7, fontWeight: '600' },
  barDayPeak: { color: colors.primary, fontWeight: '800' },
  merchant: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8 },
  mIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  mText: { flex: 1 },
  mName: { fontSize: 14.5, fontWeight: '700', color: colors.ink, textTransform: 'capitalize' },
  mSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  mAmt: { fontSize: 14.5, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  reportGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  reportCell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 18,
    padding: 14,
  },
  reportValue: { fontSize: 21, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'], letterSpacing: -0.4 },
  reportCaption: { fontSize: 12, color: colors.muted, marginTop: 4 },
  reportRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reportText: { flex: 1, fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 },
  reportStrong: { fontWeight: '800', color: colors.ink },
  delta: { fontSize: 13.5, fontWeight: '700', marginTop: 4 },
});
