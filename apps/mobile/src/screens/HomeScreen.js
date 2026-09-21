import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, inr } from '../theme';
import { todayTxns, yesterdayTxns, savingsGoals } from '../data';
import TransactionRow from '../components/TransactionRow';
import TransactionSheet from '../components/TransactionSheet';
import MorningPlan from '../components/MorningPlan';
import GlassCard from '../components/GlassCard';
import GlassBackground from '../components/GlassBackground';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function HomeScreen() {
  const isMorning = new Date().getHours() < 12;
  const [query, setQuery] = useState('');
  const [sheetTxn, setSheetTxn] = useState(null);
  const [overrides, setOverrides] = useState({});

  const withCats = (list) => list.map((t) => ({ ...t, category: overrides[t.id] || t.category }));
  const today = withCats(todayTxns);
  const todayTotal = today.reduce((s, t) => s + t.amount, 0);
  const searchable = withCats([...todayTxns, ...yesterdayTxns]);
  const results = query.trim()
    ? searchable.filter((t) => t.merchant.toLowerCase().includes(query.trim().toLowerCase()))
    : null;

  const recategorize = (id, cat) => setOverrides((o) => ({ ...o, [id]: cat }));

  return (
    <View style={styles.root}>
      <GlassBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greet}>{greeting()}, Hree</Text>
              <Text style={styles.date}>{todayLabel()}</Text>
            </View>
            <BlurView intensity={40} tint="dark" style={styles.avatar}>
              <Text style={styles.avatarText}>H</Text>
            </BlurView>
          </View>

          {/* Hero */}
          <GlassCard strong intensity={55} style={styles.hero}>
            <LinearGradient
              colors={['rgba(52,211,153,0.22)', 'transparent']}
              style={styles.heroGlow}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.heroLabel}>TODAY SO FAR</Text>
            <Text style={styles.heroAmount}>{inr(todayTotal)}</Text>
            <Text style={styles.heroSub}>{today.length} payments · UPI + cards, all in one place</Text>
            <View style={styles.heroChip}>
              <Ionicons name="trending-down-outline" size={13} color={colors.primary} />
              <Text style={styles.heroChipText}>18% less than yesterday at this time</Text>
            </View>
          </GlassCard>

          {isMorning && <MorningPlan />}

          {/* Search */}
          <BlurView intensity={30} tint="dark" style={styles.searchWrap}>
            <Ionicons name="search-outline" size={17} color={colors.faint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search merchants, food, travel…"
              placeholderTextColor={colors.faint}
              style={styles.searchInput}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={17} color={colors.faint} />
              </Pressable>
            )}
          </BlurView>

          {results ? (
            <>
              <Text style={styles.section}>
                {results.length} result{results.length === 1 ? '' : 's'} for “{query.trim()}”
              </Text>
              {results.map((t) => (
                <TransactionRow key={t.id} txn={t} onPress={setSheetTxn} />
              ))}
            </>
          ) : (
            <>
              {/* Savings goals */}
              <Text style={styles.section}>Savings goals</Text>
              {savingsGoals.map((g) => {
                const pct = Math.round((g.saved / g.target) * 100);
                return (
                  <GlassCard key={g.id} style={styles.goal}>
                    <View style={styles.goalHead}>
                      <View style={styles.goalIcon}>
                        <Ionicons name={g.icon} size={17} color={colors.blue} />
                      </View>
                      <View style={styles.goalText}>
                        <Text style={styles.goalName}>{g.name}</Text>
                        <Text style={styles.goalSub}>
                          {inr(g.saved)} of {inr(g.target)}
                        </Text>
                      </View>
                      <Text style={styles.goalPct}>{pct}%</Text>
                    </View>
                    <View style={styles.goalTrack}>
                      <LinearGradient
                        colors={[colors.blue, colors.violet]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.goalFill, { width: `${pct}%` }]}
                      />
                    </View>
                  </GlassCard>
                );
              })}

              <GlassCard style={styles.digest}>
                <View style={styles.digestHead}>
                  <Ionicons name="moon-outline" size={20} color={colors.violet} />
                  <Text style={styles.digestTitle}>Tonight’s wrap-up lands at 9:00 PM</Text>
                </View>
                <Text style={styles.digestBody}>
                  Yesterday’s: ₹6,399 across 11 payments — every rupee, remembered.
                </Text>
              </GlassCard>

              <Text style={styles.section}>Your transactions</Text>
              {today.map((t) => (
                <TransactionRow key={t.id} txn={t} onPress={setSheetTxn} />
              ))}
            </>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  greet: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  date: { fontSize: 13.5, color: colors.muted, marginTop: 3 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  hero: { padding: 22, marginBottom: 14, borderRadius: 30 },
  heroGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 30 },
  heroLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.8, color: colors.muted, marginBottom: 8 },
  heroAmount: {
    fontSize: 46, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -1.2, fontVariant: ['tabular-nums'],
  },
  heroSub: { fontSize: 13.5, color: colors.muted, marginTop: 6 },
  heroChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: 'rgba(52,211,153,0.14)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.28)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginTop: 14, gap: 6,
  },
  heroChipText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.glass,
    borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 18, overflow: 'hidden',
  },
  searchInput: { flex: 1, fontSize: 14.5, color: colors.ink },
  section: { fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 12, marginTop: 6, letterSpacing: -0.2 },
  goal: { padding: 16, marginBottom: 10 },
  goalHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  goalIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(91,140,255,0.16)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  goalText: { flex: 1 },
  goalName: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  goalSub: { fontSize: 12.5, color: colors.muted, marginTop: 2, fontVariant: ['tabular-nums'] },
  goalPct: { fontSize: 14, fontWeight: '800', color: colors.blue, fontVariant: ['tabular-nums'] },
  goalTrack: {
    height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden',
  },
  goalFill: { height: 8, borderRadius: 4 },
  digest: { padding: 16, marginTop: 8, marginBottom: 8 },
  digestHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  digestTitle: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  digestBody: { fontSize: 13.5, color: colors.muted, lineHeight: 19 },
});
