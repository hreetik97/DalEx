// Budgets on live Firestore data (apps/mobile/src/app/(tabs)/budgets.tsx).
// Reads budgets/{category} (spentPaise maintained by the onTransactionWrite
// Cloud Function) and lets the user set monthPaise targets. All ten taxonomy
// categories are shown; unset categories read ₹0.
import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable, Modal, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { toPaise, CATEGORIES } from '@dalex/shared';
import { colors } from '../../theme';
import GlassCard from '../../components/GlassCard';
import BudgetAlertBanner from '../../components/BudgetAlertBanner';
import { useAuth } from '../../data/auth';
import { watchBudgets, setMonthlyBudget } from '../../data/budgets';
import type { Budget, Category } from '../../data/types';
import { categoryMeta } from '../../categoryMeta';
import { inrPaise } from '../../money';
import { TabScreen, EmptyState } from './_shared';

type Status = { label: string; color: string };

function statusOf(monthPaise: number, spentPaise: number): Status | null {
  if (monthPaise <= 0) return null;
  const pct = spentPaise / monthPaise;
  if (pct >= 1) return { label: 'Over budget', color: colors.rose };
  if (pct >= 0.85) return { label: 'Almost there', color: colors.amber };
  return { label: 'On track', color: colors.primary };
}

function daysLeftInMonthIST(): number {
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return Math.max(0, last.getUTCDate() - now.getUTCDate());
}

function monthLabelIST(): string {
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'long' }).format(new Date());
}

export default function BudgetsScreen() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    return watchBudgets(
      user.uid,
      (b) => {
        setBudgets(b);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [user]);

  const rows = useMemo(() => {
    const byCat = new Map(budgets.map((b) => [b.category, b]));
    return (CATEGORIES as Category[]).map((category) => ({
      category,
      monthPaise: byCat.get(category)?.monthPaise ?? 0,
      spentPaise: byCat.get(category)?.spentPaise ?? 0,
    }));
  }, [budgets]);

  const totals = useMemo(() => {
    const withBudget = rows.filter((r) => r.monthPaise > 0);
    return {
      budget: withBudget.reduce((s, r) => s + r.monthPaise, 0),
      spent: withBudget.reduce((s, r) => s + r.spentPaise, 0),
      count: withBudget.length,
    };
  }, [rows]);

  const totalPct = totals.budget > 0 ? Math.round((totals.spent / totals.budget) * 100) : 0;

  function openEdit(category: Category, current: number) {
    setEditing(category);
    setDraft(current > 0 ? String(Math.round(current / 100)) : '');
  }

  async function saveBudget() {
    if (!user || !editing) return;
    const paise = toPaise(draft.trim() === '' ? '0' : draft);
    if (paise === null || paise < 0) {
      Alert.alert('Invalid amount', 'Enter a valid rupee amount, e.g. 5000.');
      return;
    }
    setSaving(true);
    try {
      await setMonthlyBudget(user.uid, editing, paise);
      setEditing(null);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const editingMeta = editing ? categoryMeta(editing) : null;

  return (
    <TabScreen
      title="Budgets"
      subtitle={`${monthLabelIST()} · ${daysLeftInMonthIST()} days left`}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : totals.count === 0 ? (
        <EmptyState
          icon="wallet-outline"
          title="No budgets yet"
          body="Set a monthly target for any category below and Hisab will track your spending against it."
        />
      ) : (
        <>
        {user && <BudgetAlertBanner uid={user.uid} />}
        <GlassCard strong intensity={55} style={styles.hero}>
          <LinearGradient
            colors={['rgba(91,140,255,0.20)', 'transparent']}
            style={styles.heroGlow}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.cardLabel}>TOTAL SPENT VS BUDGET</Text>
          <Text style={styles.big}>
            {inrPaise(totals.spent)} <Text style={styles.bigDim}>/ {inrPaise(totals.budget)}</Text>
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
            {totalPct}% used
            {totals.budget - totals.spent >= 0
              ? ` · ${inrPaise(totals.budget - totals.spent)} still in the tank`
              : ` · ${inrPaise(totals.spent - totals.budget)} over budget`}
          </Text>
        </GlassCard>
        </>
      )}

      {!loading &&
        rows.map((r) => {
          const meta = categoryMeta(r.category);
          const pct = r.monthPaise > 0 ? Math.min(100, Math.round((r.spentPaise / r.monthPaise) * 100)) : 0;
          const st = statusOf(r.monthPaise, r.spentPaise);
          return (
            <GlassCard key={r.category} style={styles.row}>
              <Pressable
                onPress={() => openEdit(r.category, r.monthPaise)}
                accessibilityRole="button"
                accessibilityLabel={`Set monthly budget for ${meta.label}`}
                accessibilityHint={`${inrPaise(r.spentPaise)} spent of ${r.monthPaise > 0 ? inrPaise(r.monthPaise) : 'no budget set'}`}
              >
                <View style={styles.rowHead}>
                  <View style={[styles.icon, { backgroundColor: meta.hue + '22' }]}>
                    <Ionicons name={meta.glyph as never} size={17} color={meta.hue} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowName}>{meta.label}</Text>
                    {st ? (
                      <Text style={[styles.rowStatus, { color: st.color }]}>{st.label}</Text>
                    ) : (
                      <Text style={styles.rowStatusDim}>Tap to set a budget</Text>
                    )}
                  </View>
                  <View style={styles.rowAmt}>
                    <Text style={styles.spent}>{inrPaise(r.spentPaise)}</Text>
                    <Text style={styles.budget}>
                      of {r.monthPaise > 0 ? inrPaise(r.monthPaise) : '—'}
                    </Text>
                  </View>
                  <Ionicons name="pencil-outline" size={15} color={colors.faint} style={{ marginLeft: 10 }} />
                </View>
                {r.monthPaise > 0 && (
                  <>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: meta.hue }]} />
                    </View>
                    <Text style={styles.pct}>{pct}% used</Text>
                  </>
                )}
              </Pressable>
            </GlassCard>
          );
        })}

      <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrap}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setEditing(null)} />
          <GlassCard strong intensity={70} style={styles.modal}>
            <Text style={styles.modalTitle}>
              Monthly budget{editingMeta ? ` · ${editingMeta.label}` : ''}
            </Text>
            <Text style={styles.modalBody}>How much can {editingMeta?.label.toLowerCase() ?? 'this'} cost this month?</Text>
            <View style={styles.inputRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                keyboardType="numeric"
                placeholder="5000"
                placeholderTextColor={colors.faint}
                style={styles.input}
                autoFocus
              />
            </View>
            <View style={styles.modalBtns}>
              <Pressable
                onPress={() => setEditing(null)}
                style={styles.cancelBtn}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing budget"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveBudget}
                style={[styles.saveBtn, saving && styles.disabled]}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel={`Save ${editingMeta?.label ?? ''} budget`}
              >
                <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
              </Pressable>
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 20, marginBottom: 14, borderRadius: 30 },
  heroGlow: { ...StyleSheet.absoluteFill, borderRadius: 30 },
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
  rowHead: { flexDirection: 'row', alignItems: 'center' },
  icon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowText: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  rowStatus: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  rowStatusDim: { fontSize: 12, color: colors.faint, marginTop: 2 },
  rowAmt: { alignItems: 'flex-end' },
  spent: { fontSize: 15, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  budget: { fontSize: 12, color: colors.muted, marginTop: 2, fontVariant: ['tabular-nums'] },
  pct: { fontSize: 12, color: colors.muted, marginTop: 8, fontWeight: '600', fontVariant: ['tabular-nums'] },
  modalWrap: { flex: 1, justifyContent: 'center', padding: 28 },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  modal: { padding: 22 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  modalBody: { fontSize: 13.5, color: colors.muted, marginBottom: 16 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: 16, paddingHorizontal: 14, marginBottom: 16,
  },
  rupee: { fontSize: 18, fontWeight: '700', color: colors.muted, marginRight: 6 },
  input: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.ink, paddingVertical: 13, fontVariant: ['tabular-nums'] },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: colors.inkSoft },
  saveBtn: { flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center', backgroundColor: colors.primary },
  saveText: { fontSize: 15, fontWeight: '800', color: '#05281C' },
  disabled: { opacity: 0.6 },
});
