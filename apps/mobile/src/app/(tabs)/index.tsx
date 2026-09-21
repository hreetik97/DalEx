// Home tab (apps/mobile/src/app/(tabs)/index.tsx).
// Live data from the repository layer: today's hero, morning planner, search,
// evening wrap-up, and the transaction list. No sample data.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme';
import { inrPaise } from '../../money';
import { categoryMeta } from '../../categoryMeta';
import { useAuth } from '../../data/auth';
import { watchTransactions } from '../../data/transactions';
import { getPlan } from '../../data/plans';
import { dayKey, type PlanItem, type Transaction } from '../../data/types';
import TransactionRow from '../../components/TransactionRow';
import TransactionSheet from '../../components/TransactionSheet';
import MorningPlan from '../../components/MorningPlan';
import EveningWrapUp from '../../components/EveningWrapUp';
import GoalsCard from '../../components/GoalsCard';
import BudgetAlertBanner from '../../components/BudgetAlertBanner';
import GlassCard from '../../components/GlassCard';
import GlassBackground from '../../components/GlassBackground';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

function firstName(displayName: string | null): string {
  if (!displayName) return '';
  return `, ${displayName.split(' ')[0]}`;
}

function SkeletonRow() {
  return (
    <View style={styles.skeleton}>
      <LinearGradient
        colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [sheetTxn, setSheetTxn] = useState<Transaction | null>(null);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const isMorning = new Date().getHours() < 12;

  // Live subscription. Snapshot callbacks are the only place state updates
  // happen — this is the external-system subscription pattern.
  useEffect(() => {
    if (!uid) return;
    const unsub = watchTransactions(
      uid,
      { limit: 50 },
      (list) => {
        setTxns(list);
        setLoaded(true);
        setSyncError(null);
        setRefreshing(false);
      },
      (e) => {
        setSyncError(e.message);
        setLoaded(true);
        setRefreshing(false);
      }
    );
    return unsub;
  }, [uid, refreshKey]);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    void (async () => {
      try {
        const items = await getPlan(uid);
        if (!cancelled) setPlanItems(items);
      } catch {
        // Keep whatever plan state we have; the planner shows templates.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    // onSnapshot is live; the spinner clears when the next snapshot lands.
    setTimeout(() => setRefreshing(false), 4000);
  }, []);

  const today = dayKey();
  const { todayTxns, recentTxns, todayTotal, todayCount } = useMemo(() => {
    const t = txns.filter((x) => dayKey(x.txnAt) === today);
    const rest = txns.filter((x) => dayKey(x.txnAt) !== today);
    return {
      todayTxns: t,
      recentTxns: rest,
      todayTotal: t.reduce((s, x) => s + x.amountPaise, 0),
      todayCount: t.length,
    };
  }, [txns, today]);

  const q = query.trim().toLowerCase();
  const results = q
    ? txns.filter(
        (t) =>
          t.merchantRaw.toLowerCase().includes(q) ||
          categoryMeta(t.category).label.toLowerCase().includes(q)
      )
    : null;

  const plannedTotal = planItems.reduce((s, i) => s + i.estimatePaise, 0);
  const planPct = plannedTotal > 0 ? Math.min(999, Math.round((todayTotal / plannedTotal) * 100)) : null;

  const openAdd = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/add');
  };

  return (
    <View style={styles.root}>
      <GlassBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greet}>
                {greeting()}
                {firstName(user?.displayName ?? null)}
              </Text>
              <Text style={styles.date}>{todayLabel()}</Text>
            </View>
            <BlurView intensity={40} tint="dark" style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.displayName ?? 'H').charAt(0).toUpperCase()}
              </Text>
            </BlurView>
          </View>

          {/* Hero */}
          <GlassCard strong intensity={55} style={styles.hero}>
            <LinearGradient
              colors={['rgba(52,211,153,0.22)', 'transparent']}
              style={[StyleSheet.absoluteFill, styles.heroGlow]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.heroLabel}>TODAY SO FAR</Text>
            <Text style={styles.heroAmount}>{inrPaise(todayTotal)}</Text>
            <Text style={styles.heroSub}>
              {todayCount} payment{todayCount === 1 ? '' : 's'} · UPI + cards, all in one place
            </Text>
            {planPct !== null && todayCount > 0 && (
              <View style={styles.heroChip}>
                <Ionicons
                  name={planPct > 100 ? 'trending-up-outline' : 'trending-down-outline'}
                  size={13}
                  color={planPct > 100 ? colors.rose : colors.primary}
                />
                <Text
                  style={[styles.heroChipText, planPct > 100 && { color: colors.rose }]}
                >
                  {planPct > 100
                    ? `${planPct - 100}% over today's plan`
                    : `${planPct}% of today's plan`}
                </Text>
              </View>
            )}
          </GlassCard>

          {isMorning && uid && (
            <MorningPlan uid={uid} items={planItems} onSaved={setPlanItems} />
          )}

          {uid && <BudgetAlertBanner uid={uid} onPress={() => router.push('/budgets')} />}

          {/* Search */}
          <BlurView intensity={30} tint="dark" style={styles.searchWrap}>
            <Ionicons name="search-outline" size={17} color={colors.faint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search merchants, food, travel…"
              placeholderTextColor={colors.faint}
              style={styles.searchInput}
              accessibilityLabel="Search transactions"
              accessibilityHint="Search by merchant name or category"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={17} color={colors.faint} />
              </Pressable>
            )}
          </BlurView>

          {!loaded ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : syncError ? (
            <GlassCard style={styles.errorCard}>
              <Ionicons name="cloud-offline-outline" size={22} color={colors.rose} />
              <Text style={styles.errorTitle}>Couldn’t load your transactions</Text>
              <Text style={styles.errorBody}>{syncError}</Text>
              <Pressable
                onPress={onRefresh}
                style={styles.retryBtn}
                accessibilityRole="button"
                accessibilityLabel="Try again"
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </GlassCard>
          ) : results ? (
            <>
              <Text style={styles.section}>
                {results.length} result{results.length === 1 ? '' : 's'} for “{query.trim()}”
              </Text>
              {results.map((t) => (
                <TransactionRow key={t.id} txn={t} onPress={setSheetTxn} />
              ))}
            </>
          ) : txns.length === 0 ? (
            <>
              <GlassCard style={styles.emptyCard}>
                <View style={styles.emptyOrb}>
                  <Ionicons name="wallet-outline" size={30} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptyBody}>
                  Add your first expense and Hisab will keep every rupee, remembered.
                </Text>
                <Pressable
                  onPress={openAdd}
                  style={styles.ctaBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Add your first expense"
                >
                  <Text style={styles.ctaText}>Add your first expense</Text>
                </Pressable>
              </GlassCard>
              {uid && <GoalsCard uid={uid} />}
            </>
          ) : (
            <>
              {uid && <EveningWrapUp uid={uid} todayTxns={todayTxns} planItems={planItems} />}

              {uid && <GoalsCard uid={uid} />}

              <Text style={styles.section}>Today</Text>
              {todayTxns.length === 0 ? (
                <Text style={styles.quiet}>
                  Nothing logged yet today — tap + below to add one.
                </Text>
              ) : (
                todayTxns.map((t) => (
                  <TransactionRow key={t.id} txn={t} onPress={setSheetTxn} />
                ))
              )}

              {recentTxns.length > 0 && (
                <>
                  <Text style={styles.section}>Recent</Text>
                  {recentTxns.map((t) => (
                    <TransactionRow key={t.id} txn={t} onPress={setSheetTxn} />
                  ))}
                </>
              )}
            </>
          )}
          <View style={{ height: 150 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Add-expense FAB */}
      {loaded && !syncError && (
        <Pressable
          onPress={openAdd}
          style={styles.fab}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Add expense"
          accessibilityHint="Opens the add expense form"
        >
          <LinearGradient colors={[colors.primary, colors.primaryDeep]} style={styles.fabGrad}>
            <Ionicons name="add" size={28} color="#05281C" />
          </LinearGradient>
        </Pressable>
      )}

      <TransactionSheet
        key={sheetTxn?.id ?? 'none'}
        txn={sheetTxn}
        uid={uid}
        onClose={() => setSheetTxn(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  container: { padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  greet: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  date: { fontSize: 13.5, color: colors.muted, marginTop: 3 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  hero: { padding: 22, marginBottom: 14, borderRadius: 30 },
  heroGlow: { borderRadius: 30 },
  heroLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: colors.muted,
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 46,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  heroSub: { fontSize: 13.5, color: colors.muted, marginTop: 6 },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52,211,153,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.28)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 14,
    gap: 6,
  },
  heroChipText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 18,
    overflow: 'hidden',
  },
  searchInput: { flex: 1, fontSize: 14.5, color: colors.ink },
  section: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 12,
    marginTop: 6,
    letterSpacing: -0.2,
  },
  quiet: { fontSize: 13.5, color: colors.muted, marginBottom: 12, lineHeight: 19 },
  skeleton: {
    height: 66,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  errorCard: { padding: 20, alignItems: 'center', gap: 8 },
  errorTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  errorBody: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 18 },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 6,
  },
  retryText: { fontSize: 14, fontWeight: '800', color: '#05281C' },
  emptyCard: { padding: 28, alignItems: 'center' },
  emptyOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  emptyBody: {
    fontSize: 13.5,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#05281C' },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 120,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 10,
    },
  },
  fabGrad: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
