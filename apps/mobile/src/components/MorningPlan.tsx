// Morning planner, persisted to plans/{yyyy-MM-dd} (apps/mobile/src/components/MorningPlan.tsx).
// Renders nothing after 12:00 local. Items are edited inline; "Start the day"
// saves them via the PlanRepository.
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { inrPaise } from '../money';
import { toPaise } from '@dalex/shared';
import { savePlan } from '../data/plans';
import type { PlanItem } from '../data/types';
import GlassCard from './GlassCard';

const TEMPLATES = [
  { label: 'Work from home', icon: 'home-outline', estimatePaise: 15000 },
  { label: 'Office day', icon: 'briefcase-outline', estimatePaise: 45000 },
  { label: 'Travelling', icon: 'airplane-outline', estimatePaise: 120000 },
  { label: 'Day out', icon: 'sunny-outline', estimatePaise: 80000 },
];

// Local id sequence for unsaved draft items (replaced on save).
let draftIdSeq = 0;

interface Props {
  uid: string;
  items: PlanItem[];
  onSaved: (items: PlanItem[]) => void;
}

export default function MorningPlan({ uid, items, onSaved }: Props) {
  const [draft, setDraft] = useState<PlanItem[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editing = draft ?? items;
  const dirty = draft !== null;

  const addTemplate = (t: (typeof TEMPLATES)[number]) => {
    setError(null);
    setDraft([
      ...editing,
      { id: `plan-draft-${++draftIdSeq}`, label: t.label, estimatePaise: t.estimatePaise },
    ]);
  };

  const removeItem = (id: string) => setDraft(editing.filter((i) => i.id !== id));

  const setEstimate = (id: string, text: string) => {
    const paise = toPaise(text);
    setDraft(
      editing.map((i) => (i.id === id ? { ...i, estimatePaise: paise ?? 0 } : i))
    );
  };

  const startDay = async () => {
    setError(null);
    const clean = editing.filter((i) => i.label.trim());
    if (clean.length === 0) {
      setError('Add at least one plan for the day.');
      return;
    }
    setSaving(true);
    try {
      await savePlan(uid, clean);
      onSaved(clean);
      setDraft(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your plan.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const plannedTotal = editing.reduce((s, i) => s + i.estimatePaise, 0);

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.question}>Good morning. What are you going to do?</Text>
      <Text style={styles.hint}>
        {items.length === 0 && !dirty
          ? 'Pick a template or two — we’ll estimate the day and compare tonight.'
          : 'Your plan for today. Tonight’s wrap-up compares against this.'}
      </Text>

      <View style={styles.grid}>
        {TEMPLATES.map((t) => (
          <Pressable
            key={t.label}
            onPress={() => addTemplate(t)}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Add plan: ${t.label}, estimated ${inrPaise(t.estimatePaise)}`}
          >
            <Ionicons name={t.icon as never} size={16} color={colors.primary} />
            <Text style={styles.chipLabel}>{t.label}</Text>
            <Text style={styles.chipEst}>{inrPaise(t.estimatePaise)}</Text>
          </Pressable>
        ))}
      </View>

      {editing.length > 0 && (
        <View style={styles.list}>
          {editing.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                value={String(Math.round(item.estimatePaise / 100))}
                onChangeText={(t) => setEstimate(item.id, t)}
                keyboardType="numeric"
                style={styles.estInput}
                accessibilityLabel={`Planned spend for ${item.label}, in rupees`}
              />
              <Pressable
                onPress={() => removeItem(item.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Remove plan: ${item.label}`}
              >
                <Ionicons name="close-circle-outline" size={18} color={colors.faint} />
              </Pressable>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Planned for today</Text>
            <Text style={styles.totalValue}>{inrPaise(plannedTotal)}</Text>
          </View>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {(dirty || items.length === 0) && (
        <Pressable
          onPress={() => void startDay()}
          disabled={saving}
          style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={items.length === 0 ? 'Start the day' : 'Update plan'}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#05281C" />
          ) : (
            <Text style={styles.saveText}>{items.length === 0 ? 'Start the day' : 'Update plan'}</Text>
          )}
        </Pressable>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, marginBottom: 14 },
  question: { fontSize: 16.5, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  hint: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 14, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
  },
  pressed: { opacity: 0.6 },
  chipLabel: { fontSize: 13.5, fontWeight: '600', color: colors.ink },
  chipEst: { fontSize: 12, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] },
  list: { marginTop: 14, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  rupee: { fontSize: 13, color: colors.faint },
  estInput: {
    width: 76,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  totalLabel: { fontSize: 13, fontWeight: '600', color: colors.muted },
  totalValue: { fontSize: 15, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] },
  error: { fontSize: 12.5, color: colors.rose, marginTop: 10 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  saveText: { fontSize: 15, fontWeight: '800', color: '#05281C' },
});
