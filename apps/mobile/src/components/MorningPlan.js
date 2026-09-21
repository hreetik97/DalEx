import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, inr } from '../theme';
import GlassCard from './GlassCard';

const PLANS = [
  { id: 'home', label: 'Work from home', icon: 'home-outline', estimate: 150 },
  { id: 'office', label: 'Office day', icon: 'briefcase-outline', estimate: 450 },
  { id: 'travel', label: 'Travelling', icon: 'airplane-outline', estimate: 1200 },
  { id: 'out', label: 'Day out', icon: 'sunny-outline', estimate: 800 },
];

export default function MorningPlan() {
  const [picked, setPicked] = useState(null);
  const plan = PLANS.find((p) => p.id === picked);

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.question}>What are you going to do today?</Text>
      {!plan ? (
        <>
          <Text style={styles.hint}>Pick one — we’ll estimate the day and compare tonight.</Text>
          <View style={styles.grid}>
            {PLANS.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setPicked(p.id)}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              >
                <Ionicons name={p.icon} size={17} color={colors.primary} />
                <Text style={styles.chipLabel}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.done}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={18} color="#05281C" />
          </View>
          <View style={styles.doneText}>
            <Text style={styles.doneTitle}>{plan.label} — around {inr(plan.estimate)}</Text>
            <Text style={styles.doneBody}>Tonight’s wrap-up will compare against this.</Text>
          </View>
          <Pressable onPress={() => setPicked(null)} hitSlop={10}>
            <Text style={styles.change}>Change</Text>
          </Pressable>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, marginBottom: 14 },
  question: { fontSize: 16.5, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  hint: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
  },
  pressed: { opacity: 0.6 },
  chipLabel: { fontSize: 13.5, fontWeight: '600', color: colors.ink },
  done: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  doneIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  doneText: { flex: 1 },
  doneTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  doneBody: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  change: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
