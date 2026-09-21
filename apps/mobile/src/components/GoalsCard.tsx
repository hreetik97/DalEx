// Savings-goals section for Home (apps/mobile/src/components/GoalsCard.tsx).
// Live data from the goals repository. Add goal / add money / delete via
// glass modals. 100% funded goals get the mint "Goal reached" treatment.
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { toPaise } from '@dalex/shared';
import { colors } from '../theme';
import { inrPaise } from '../money';
import { watchGoals, addGoal, contributeToGoal, deleteGoal, type Goal } from '../data/goals';
import GlassCard from './GlassCard';

const GOAL_HUES = ['#34D399', '#5B8CFF', '#A78BFA', '#FBBF24', '#FB7185', '#22D3EE'];

function GoalRow({
  uid, goal, onContribute,
}: {
  uid: string;
  goal: Goal;
  onContribute: (goal: Goal) => void;
}) {
  const pct = goal.targetPaise > 0 ? Math.min(100, Math.round((goal.savedPaise / goal.targetPaise) * 100)) : 0;
  const reached = pct >= 100;

  function confirmDelete() {
    Alert.alert(`Delete “${goal.name}”?`, 'Saved progress on this goal will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          void deleteGoal(uid, goal.id).catch(() => {
            Alert.alert('Could not delete', 'Check your connection and try again.');
          });
        },
      },
    ]);
  }

  return (
    <View style={styles.goal}>
      <View style={styles.goalHead}>
        <View style={[styles.goalIcon, { backgroundColor: goal.hue + '26' }]}>
          <Ionicons name={reached ? 'trophy-outline' : (goal.icon as never)} size={17} color={goal.hue} />
        </View>
        <View style={styles.goalText}>
          <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
          <Text style={styles.goalSub}>
            {inrPaise(goal.savedPaise)} of {inrPaise(goal.targetPaise)}
          </Text>
        </View>
        {reached ? (
          <View style={styles.reachedChip}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            <Text style={styles.reachedText}>Goal reached</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => onContribute(goal)}
            style={styles.addBtn}
            accessibilityRole="button"
            accessibilityLabel={`Add money to ${goal.name}`}
            hitSlop={6}
          >
            <Text style={styles.addBtnText}>+ Add money</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: reached ? colors.primary : goal.hue }]} />
      </View>
      <View style={styles.goalFoot}>
        <Text style={styles.pct}>{pct}%</Text>
        <Pressable
          onPress={confirmDelete}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Delete goal ${goal.name}`}
        >
          <Ionicons name="trash-outline" size={15} color={colors.faint} />
        </Pressable>
      </View>
    </View>
  );
}

export default function GoalsCard({ uid }: { uid: string }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [hueIdx, setHueIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [funding, setFunding] = useState<Goal | null>(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    return watchGoals(
      uid,
      (g) => { setGoals(g); setLoading(false); },
      () => setLoading(false)
    );
  }, [uid]);

  async function createGoal() {
    const targetPaise = toPaise(target.trim() === '' ? '0' : target);
    if (targetPaise === null || targetPaise <= 0) {
      Alert.alert('Invalid target', 'Enter a target amount in rupees, e.g. 50000.');
      return;
    }
    setSaving(true);
    try {
      await addGoal(uid, { name: name.trim(), targetPaise, hue: GOAL_HUES[hueIdx % GOAL_HUES.length] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowNew(false);
      setName('');
      setTarget('');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function fund() {
    if (!funding) return;
    const paise = toPaise(amount.trim() === '' ? '0' : amount);
    if (paise === null || paise <= 0) {
      Alert.alert('Invalid amount', 'Enter an amount in rupees, e.g. 2000.');
      return;
    }
    setSaving(true);
    try {
      await contributeToGoal(uid, funding.id, paise);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFunding(null);
      setAmount('');
    } catch {
      Alert.alert('Could not save', 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>SAVINGS GOALS</Text>
        <Pressable
          onPress={() => setShowNew(true)}
          style={styles.newBtn}
          accessibilityRole="button"
          accessibilityLabel="Create a new savings goal"
          hitSlop={6}
        >
          <Ionicons name="add" size={15} color={colors.primary} />
          <Text style={styles.newText}>New goal</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ paddingVertical: 18 }} />
      ) : goals.length === 0 ? (
        <Text style={styles.quiet}>
          Saving for something? Set a target and chip away at it, one contribution at a time.
        </Text>
      ) : (
        goals.map((g) => <GoalRow key={g.id} uid={uid} goal={g} onContribute={setFunding} />)
      )}

      {/* New-goal modal */}
      <Modal visible={showNew} transparent animationType="fade" onRequestClose={() => setShowNew(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <Pressable style={styles.backdrop} onPress={() => setShowNew(false)} accessibilityRole="button" accessibilityLabel="Close" />
          <GlassCard strong intensity={70} style={styles.modal}>
            <Text style={styles.modalTitle}>New savings goal</Text>
            <Text style={styles.modalBody}>What are you saving toward?</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Japan trip"
              placeholderTextColor={colors.faint}
              style={styles.input}
              maxLength={60}
              accessibilityLabel="Goal name"
            />
            <View style={styles.inputRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                value={target}
                onChangeText={setTarget}
                keyboardType="numeric"
                placeholder="50000"
                placeholderTextColor={colors.faint}
                style={styles.amountInput}
                accessibilityLabel="Goal target amount in rupees"
              />
            </View>
            <Text style={styles.hueLabel}>Pick a colour</Text>
            <View style={styles.hues}>
              {GOAL_HUES.map((h, i) => (
                <Pressable
                  key={h}
                  onPress={() => setHueIdx(i)}
                  style={[styles.hue, { backgroundColor: h + '30' }, i === hueIdx && { borderColor: h, borderWidth: 2 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Goal colour ${i + 1}`}
                >
                  <View style={[styles.hueDot, { backgroundColor: h }]} />
                </Pressable>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <Pressable onPress={() => setShowNew(false)} style={styles.cancelBtn} disabled={saving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={createGoal} style={[styles.saveBtn, saving && styles.disabled]} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving…' : 'Create goal'}</Text>
              </Pressable>
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add-money modal */}
      <Modal visible={funding !== null} transparent animationType="fade" onRequestClose={() => setFunding(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <Pressable style={styles.backdrop} onPress={() => setFunding(null)} accessibilityRole="button" accessibilityLabel="Close" />
          <GlassCard strong intensity={70} style={styles.modal}>
            <Text style={styles.modalTitle}>Add money{funding ? ` · ${funding.name}` : ''}</Text>
            <Text style={styles.modalBody}>Every rupee counts toward the target.</Text>
            <View style={styles.inputRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor={colors.faint}
                style={styles.amountInput}
                autoFocus
                accessibilityLabel="Contribution amount in rupees"
              />
            </View>
            <View style={styles.modalBtns}>
              <Pressable onPress={() => setFunding(null)} style={styles.cancelBtn} disabled={saving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={fund} style={[styles.saveBtn, saving && styles.disabled]} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving…' : 'Add money'}</Text>
              </Pressable>
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, marginBottom: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.8, color: colors.faint },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.28)',
    minHeight: 40,
  },
  newText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  quiet: { fontSize: 13.5, color: colors.muted, lineHeight: 19, marginTop: 6 },
  goal: { marginTop: 14 },
  goalHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  goalIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  goalText: { flex: 1, minWidth: 0 },
  goalName: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  goalSub: { fontSize: 12.5, color: colors.muted, marginTop: 2, fontVariant: ['tabular-nums'] },
  addBtn: {
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: colors.glassBorder,
    minHeight: 40, justifyContent: 'center',
  },
  addBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.inkSoft },
  reachedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    backgroundColor: 'rgba(52,211,153,0.14)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.35)',
  },
  reachedText: { fontSize: 12.5, fontWeight: '800', color: colors.primary },
  track: { height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  fill: { height: 9, borderRadius: 5 },
  goalFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  pct: { fontSize: 12, color: colors.muted, fontWeight: '700', fontVariant: ['tabular-nums'] },
  modalWrap: { flex: 1, justifyContent: 'center', padding: 28 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  modal: { padding: 22 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  modalBody: { fontSize: 13.5, color: colors.muted, marginBottom: 16 },
  input: {
    fontSize: 16, fontWeight: '600', color: colors.ink,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: 16, paddingHorizontal: 14, marginBottom: 12,
  },
  rupee: { fontSize: 18, fontWeight: '700', color: colors.muted, marginRight: 6 },
  amountInput: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.ink, paddingVertical: 13, fontVariant: ['tabular-nums'] },
  hueLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 8 },
  hues: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  hue: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  hueDot: { width: 22, height: 22, borderRadius: 11 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center', minHeight: 48, justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: colors.inkSoft },
  saveBtn: { flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center', backgroundColor: colors.primary, minHeight: 48, justifyContent: 'center' },
  saveText: { fontSize: 15, fontWeight: '800', color: '#05281C' },
  disabled: { opacity: 0.6 },
});
