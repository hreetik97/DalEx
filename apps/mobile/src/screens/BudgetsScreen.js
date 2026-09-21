import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, inr } from '../theme';
import { budgets } from '../data';
import GlassCard from '../components/GlassCard';
import GlassBackground from '../components/GlassBackground';

const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
const totalPct = Math.round((totalSpent / totalBudget) * 100);

function statusOf(b) {
  const pct = b.spent / b.budget;
  if (pct >= 1) return { label: 'Over budget', color: colors.rose };
  if (pct >= 0.85) return { label: 'Almost there', color: colors.amber };
  return { label: 'On track', color: colors.primary };
}

export default function BudgetsScreen() {
  return (
    <View style={styles.root}>
      <GlassBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Budgets</Text>
          <Text style={styles.subtitle}>September · 8 days left</Text>

          <GlassCard strong intensity={55} style={styles.hero}>
            <LinearGradient
              colors={['rgba(91,140,255,0.20)', 'transparent']}
              style={styles.heroGlow}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.cardLabel}>TOTAL SPENT VS BUDGET</Text>
            <Text style={styles.big}>
              {inr(totalSpent)} <Text style={styles.bigDim}>/ {inr(totalBudget)}</Text>
            </Text>
            <View style={styles.track}>
              <LinearGradient
                colors={[colors.blue, colors.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.fill, { width: `${Math.min(100, totalPct)}%` }]}
              />
            </View>
            <Text style={styles.heroSub}>
              {totalPct}% used · {inr(totalBudget - totalSpent)} still in the tank
            </Text>
          </GlassCard>

          {budgets.map((b) => {
            const pct = Math.min(100, Math.round((b.spent / b.budget) * 100));
            const st = statusOf(b);
            const accent = colors.categories[b.name] || colors.categories.Other;
            return (
              <GlassCard key={b.name} style={styles.row}>
                <View style={styles.rowHead}>
                  <View style={[styles.icon, { backgroundColor: accent + '22' }]}>
                    <Ionicons name={b.icon} size={17} color={accent} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowName}>{b.name}</Text>
                    <Text style={[styles.rowStatus, { color: st.color }]}>{st.label}</Text>
                  </View>
                  <View style={styles.rowAmt}>
                    <Text style={styles.spent}>{inr(b.spent)}</Text>
                    <Text style={styles.budget}>of {inr(b.budget)}</Text>
                  </View>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: accent }]} />
                </View>
                <Text style={styles.pct}>{pct}% used</Text>
              </GlassCard>
            );
          })}

          <GlassCard style={styles.tip}>
            <Ionicons name="bulb-outline" size={20} color={colors.amber} />
            <Text style={styles.tipText}>
              Food is at 82% of budget with 8 days left. One home-cooked week keeps September in the green.
            </Text>
          </GlassCard>
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
  hero: { padding: 20, marginBottom: 14, borderRadius: 30 },
  heroGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 30 },
  cardLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.8, color: colors.faint, marginBottom: 10 },
  big: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  bigDim: { fontSize: 17, fontWeight: '600', color: colors.muted },
  track: {
    height: 10, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden', marginTop: 14,
  },
  fill: { height: 10, borderRadius: 5 },
  heroSub: { fontSize: 13, color: colors.muted, marginTop: 10 },
  row: { padding: 16, marginBottom: 10 },
  rowHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowText: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  rowStatus: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  rowAmt: { alignItems: 'flex-end' },
  spent: { fontSize: 15, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  budget: { fontSize: 12, color: colors.muted, marginTop: 2, fontVariant: ['tabular-nums'] },
  pct: { fontSize: 12, color: colors.muted, marginTop: 8, fontWeight: '600', fontVariant: ['tabular-nums'] },
  tip: { flexDirection: 'row', padding: 16, marginTop: 6, gap: 12, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 },
});
