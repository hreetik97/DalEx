import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, inr } from '../theme';
import { bills, subscriptions } from '../data';
import GlassCard from '../components/GlassCard';
import GlassBackground from '../components/GlassBackground';

const billsTotal = bills.reduce((s, b) => s + b.amount, 0);
const subsTotal = subscriptions.reduce((s, s2) => s + s2.amount, 0);

export default function BillsScreen() {
  const [autopay, setAutopay] = useState(
    Object.fromEntries(bills.map((b) => [b.id, b.autopay]))
  );

  return (
    <View style={styles.root}>
      <GlassBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Bills</Text>
          <Text style={styles.subtitle}>Nothing slips through</Text>

          <GlassCard strong intensity={55} style={styles.hero}>
            <LinearGradient
              colors={['rgba(167,139,250,0.20)', 'transparent']}
              style={styles.heroGlow}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.cardLabel}>DUE IN THE NEXT 30 DAYS</Text>
            <Text style={styles.big}>{inr(billsTotal)}</Text>
            <Text style={styles.heroSub}>{bills.length} bills · {inr(subsTotal)}/mo in subscriptions</Text>
          </GlassCard>

          <Text style={styles.section}>Upcoming</Text>
          {bills.map((b) => (
            <GlassCard key={b.id} style={styles.bill}>
              <View style={[styles.icon, { backgroundColor: 'rgba(167,139,250,0.16)' }]}>
                <Ionicons name={b.icon} size={18} color={colors.violet} />
              </View>
              <View style={styles.billText}>
                <Text style={styles.billName}>{b.name}</Text>
                <Text style={styles.billDetail}>{b.detail} · {b.dueIn}</Text>
                <View style={styles.autopayRow}>
                  <Text style={styles.autopayLabel}>Autopay</Text>
                  <Switch
                    value={autopay[b.id]}
                    onValueChange={(v) => setAutopay((a) => ({ ...a, [b.id]: v }))}
                    trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.primary }}
                    thumbColor="#fff"
                    style={styles.switch}
                  />
                </View>
              </View>
              <Text style={styles.billAmt}>{inr(b.amount)}</Text>
            </GlassCard>
          ))}

          <Text style={styles.section}>Subscriptions · {inr(subsTotal)}/mo</Text>
          <GlassCard style={styles.subs}>
            {subscriptions.map((s, i) => (
              <View key={s.id}>
                <View style={styles.subRow}>
                  <View style={[styles.icon, { backgroundColor: 'rgba(91,140,255,0.14)' }]}>
                    <Ionicons name={s.icon} size={17} color={colors.blue} />
                  </View>
                  <Text style={styles.subName}>{s.name}</Text>
                  <Text style={styles.subAmt}>
                    {inr(s.amount)}<Text style={styles.subCycle}>{s.cycle}</Text>
                  </Text>
                </View>
                {i < subscriptions.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </GlassCard>

          <GlassCard style={styles.tip}>
            <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
            <Text style={styles.tipText}>
              Turning on autopay for your ICICI card avoids late fees and keeps your credit score smiling.
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
  hero: { padding: 20, marginBottom: 8, borderRadius: 30 },
  heroGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 30 },
  cardLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.8, color: colors.faint, marginBottom: 10 },
  big: { fontSize: 36, fontWeight: '800', color: colors.ink, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  heroSub: { fontSize: 13.5, color: colors.muted, marginTop: 6 },
  section: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 12, marginBottom: 12, letterSpacing: -0.2 },
  bill: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 10 },
  icon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', marginRight: 13,
  },
  billText: { flex: 1 },
  billName: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  billDetail: { fontSize: 12.5, color: colors.muted, marginTop: 3 },
  autopayRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  autopayLabel: { fontSize: 12.5, color: colors.muted, fontWeight: '600' },
  switch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginLeft: -6 },
  billAmt: { fontSize: 16, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  subs: { padding: 8, marginBottom: 6 },
  subRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  subName: { flex: 1, fontSize: 14.5, fontWeight: '600', color: colors.inkSoft },
  subAmt: { fontSize: 14, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  subCycle: { fontSize: 12, fontWeight: '500', color: colors.muted },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 12 },
  tip: { flexDirection: 'row', padding: 16, marginTop: 10, gap: 12, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 },
});
