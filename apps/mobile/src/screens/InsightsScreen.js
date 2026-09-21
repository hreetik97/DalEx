import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, inr } from '../theme';
import { monthCategories, monthTotal, weekTrend, insights, paymentSplit, topMerchants } from '../data';
import CategoryBar from '../components/CategoryBar';
import InsightCard from '../components/InsightCard';
import GlassCard from '../components/GlassCard';
import GlassBackground from '../components/GlassBackground';

const maxCat = Math.max(...monthCategories.map((c) => c.amount));
const maxDay = Math.max(...weekTrend.map((d) => d.amount));
const splitTotal = paymentSplit.reduce((s, p) => s + p.amount, 0);

export default function InsightsScreen() {
  return (
    <View style={styles.root}>
      <GlassBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>Where your money actually went</Text>

          <GlassCard strong intensity={55} style={styles.card}>
            <Text style={styles.cardLabel}>THIS MONTH</Text>
            <Text style={styles.big}>{inr(monthTotal)}</Text>
            {monthCategories.map((c) => (
              <CategoryBar key={c.name} name={c.name} amount={c.amount} max={maxCat} />
            ))}
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.cardLabel}>HOW YOU PAID</Text>
            {paymentSplit.map((p) => {
              const pct = Math.round((p.amount / splitTotal) * 100);
              const accent = p.name === 'UPI' ? colors.primary : colors.blue;
              return (
                <View key={p.name} style={styles.splitRow}>
                  <View style={[styles.splitIcon, { backgroundColor: accent + '22' }]}>
                    <Ionicons name={p.icon} size={17} color={accent} />
                  </View>
                  <View style={styles.splitText}>
                    <Text style={styles.splitName}>{p.name} · {pct}%</Text>
                    <Text style={styles.splitNote}>{p.note}</Text>
                  </View>
                  <Text style={styles.splitAmt}>{inr(p.amount)}</Text>
                </View>
              );
            })}
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.cardLabel}>LAST 7 DAYS</Text>
            <View style={styles.chart}>
              {weekTrend.map((d, i) => {
                const isPeak = d.amount === maxDay;
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <LinearGradient
                        colors={
                          isPeak
                            ? [colors.primary, 'rgba(52,211,153,0.45)']
                            : ['rgba(148,163,184,0.55)', 'rgba(148,163,184,0.18)']
                        }
                        style={[styles.barFill, { height: `${Math.max(8, (d.amount / maxDay) * 100)}%` }]}
                      />
                    </View>
                    <Text style={[styles.barDay, isPeak && styles.barDayPeak]}>{d.day}</Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>

          <Text style={styles.section}>Top merchants</Text>
          {topMerchants.map((m) => {
            const tint = colors.categories[m.category] || colors.categories.Other;
            const glyph = colors.categoryIcons[m.category] || colors.categoryIcons.Other;
            return (
              <GlassCard key={m.name} style={styles.merchant}>
                <View style={[styles.mIcon, { backgroundColor: tint + '22' }]}>
                  <Ionicons name={glyph} size={16} color={tint} />
                </View>
                <View style={styles.mText}>
                  <Text style={styles.mName}>{m.name}</Text>
                  <Text style={styles.mSub}>{m.count} payments · {m.category}</Text>
                </View>
                <Text style={styles.mAmt}>{inr(m.amount)}</Text>
              </GlassCard>
            );
          })}

          <Text style={styles.section}>Budget coach</Text>
          <InsightCard title={insights[0].title} body={insights[0].body} icon="flash-outline" accent={colors.primary} />
          <InsightCard title={insights[1].title} body={insights[1].body} icon="fast-food-outline" accent={colors.amber} />
          <InsightCard title={insights[2].title} body={insights[2].body} icon="shield-checkmark-outline" accent={colors.blue} />
          <View style={{ height: 150 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  container: { padding: 20 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 3, marginBottom: 18 },
  card: { padding: 18, marginBottom: 14 },
  cardLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.8, color: colors.faint, marginBottom: 10 },
  big: {
    fontSize: 34, fontWeight: '800', color: colors.ink,
    letterSpacing: -0.8, fontVariant: ['tabular-nums'], marginBottom: 18,
  },
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
  barDay: { fontSize: 11.5, color: colors.muted, marginTop: 8, fontWeight: '600' },
  barDayPeak: { color: colors.primary, fontWeight: '800' },
  section: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 10, marginBottom: 12, letterSpacing: -0.2 },
  merchant: { flexDirection: 'row', alignItems: 'center', padding: 13, marginBottom: 8 },
  mIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  mText: { flex: 1 },
  mName: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  mSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  mAmt: { fontSize: 14.5, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
});
