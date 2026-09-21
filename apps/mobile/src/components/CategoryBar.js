import { View, Text, StyleSheet } from 'react-native';
import { colors, inr } from '../theme';

export default function CategoryBar({ name, amount, max }) {
  const pct = Math.max(6, Math.round((amount / max) * 100));
  const bar = colors.categories[name] || colors.categories.Other;
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View style={styles.label}>
          <View style={[styles.dot, { backgroundColor: bar }]} />
          <Text style={styles.name}>{name}</Text>
        </View>
        <Text style={styles.amount}>{inr(amount)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: bar }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  label: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 4.5, marginRight: 8 },
  name: { fontSize: 14, fontWeight: '600', color: colors.inkSoft },
  amount: { fontSize: 14, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  track: {
    height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4 },
});
