// Evening wrap-up card (apps/mobile/src/components/EveningWrapUp.tsx).
// Renders digests/{yyyy-MM-dd} once the scheduledDigest function writes it;
// before that, computes the same numbers live from today's transactions and
// the morning plan. variancePaise is positive when overspent.
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';
import { inrPaise } from '../money';
import { categoryMeta } from '../categoryMeta';
import { watchDigest } from '../data/digests';
import { dayKey } from '../data/types';
import type { Digest, PlanItem, Transaction } from '../data/types';
import GlassCard from './GlassCard';

interface Props {
  uid: string;
  /** Today's transactions (already IST-filtered by the parent). */
  todayTxns: Transaction[];
  planItems: PlanItem[];
}

function liveTotals(txns: Transaction[], plan: PlanItem[]) {
  const totalPaise = txns.reduce((s, t) => s + t.amountPaise, 0);
  const plannedPaise = plan.reduce((s, i) => s + i.estimatePaise, 0);
  const byMerchant = new Map<string, { totalPaise: number; count: number }>();
  for (const t of txns) {
    const e = byMerchant.get(t.merchant) ?? { totalPaise: 0, count: 0 };
    e.totalPaise += t.amountPaise;
    e.count += 1;
    byMerchant.set(t.merchant, e);
  }
  const topMerchants = [...byMerchant.entries()]
    .map(([merchant, v]) => ({ merchant, ...v }))
    .sort((a, b) => b.totalPaise - a.totalPaise)
    .slice(0, 5);
  return {
    totalPaise,
    txnCount: txns.length,
    plannedPaise,
    variancePaise: totalPaise - plannedPaise,
    topMerchants,
  };
}

export default function EveningWrapUp({ uid, todayTxns, planItems }: Props) {
  const [digest, setDigest] = useState<Digest | null>(null);

  useEffect(() => watchDigest(uid, setDigest, dayKey()), [uid]);

  const live = useMemo(() => liveTotals(todayTxns, planItems), [todayTxns, planItems]);
  const data = digest ?? live;
  const isLive = !digest;
  const hasPlan = data.plannedPaise > 0;
  const over = data.variancePaise > 0;
  const pct = hasPlan ? Math.min(100, Math.round((data.totalPaise / data.plannedPaise) * 100)) : 0;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="moon-outline" size={20} color={colors.violet} />
        <Text style={styles.title}>
          {isLive ? 'Tonight’s wrap-up lands at 9:00 PM' : 'Tonight’s wrap-up'}
        </Text>
      </View>

      <View style={styles.nums}>
        <View style={styles.numBlock}>
          <Text style={styles.numLabel}>SPENT TODAY</Text>
          <Text style={styles.numValue}>{inrPaise(data.totalPaise)}</Text>
        </View>
        <View style={styles.numBlock}>
          <Text style={styles.numLabel}>PLANNED</Text>
          <Text style={[styles.numValue, styles.plannedValue]}>
            {hasPlan ? inrPaise(data.plannedPaise) : '—'}
          </Text>
        </View>
        <View style={styles.numBlock}>
          <Text style={styles.numLabel}>PAYMENTS</Text>
          <Text style={[styles.numValue, styles.plannedValue]}>{data.txnCount}</Text>
        </View>
      </View>

      {hasPlan ? (
        <>
          <View style={styles.track}>
            <LinearGradient
              colors={over ? [colors.rose, colors.amber] : [colors.primary, colors.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.fill, { width: `${pct}%` }]}
            />
          </View>
          <View style={styles.verdictRow}>
            <Ionicons
              name={over ? 'trending-up-outline' : 'checkmark-circle-outline'}
              size={15}
              color={over ? colors.rose : colors.primary}
            />
            <Text style={[styles.verdict, { color: over ? colors.rose : colors.primary }]}>
              {over
                ? `${inrPaise(data.variancePaise)} over plan`
                : `${inrPaise(-data.variancePaise)} under plan`}
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.noPlan}>
          No plan was set this morning — set one tomorrow to compare against.
        </Text>
      )}

      {data.topMerchants.length > 0 && (
        <>
          <Text style={styles.merchLabel}>TOP MERCHANTS</Text>
          {data.topMerchants.map((m) => {
            const sampleTxn = todayTxns.find((t) => t.merchant === m.merchant);
            const cat = categoryMeta(sampleTxn?.category ?? 'other');
            return (
              <View key={m.merchant} style={styles.merchRow}>
                <View style={[styles.merchIcon, { backgroundColor: cat.hue + '26' }]}>
                  <Ionicons name={cat.glyph as never} size={13} color={cat.hue} />
                </View>
                <Text style={styles.merchName} numberOfLines={1}>
                  {m.merchant}
                </Text>
                <Text style={styles.merchCount}>{m.count}×</Text>
                <Text style={styles.merchAmt}>{inrPaise(m.totalPaise)}</Text>
              </View>
            );
          })}
        </>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  title: { fontSize: 15.5, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  nums: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  numBlock: { flex: 1 },
  numLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.4, color: colors.faint, marginBottom: 4 },
  numValue: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  plannedValue: { color: colors.inkSoft },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4 },
  verdictRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  verdict: { fontSize: 13.5, fontWeight: '700' },
  noPlan: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  merchLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: colors.faint,
    marginTop: 16,
    marginBottom: 8,
  },
  merchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  merchIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchName: { flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.inkSoft },
  merchCount: { fontSize: 12, color: colors.faint, fontVariant: ['tabular-nums'] },
  merchAmt: { fontSize: 13.5, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
});
