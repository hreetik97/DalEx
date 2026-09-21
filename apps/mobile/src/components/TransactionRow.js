import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, inr } from '../theme';

// Frosted transaction row. Tap opens the detail sheet (handled by parent).
export default function TransactionRow({ txn, onPress }) {
  const tint = colors.categories[txn.category] || colors.categories.Other;
  const glyph = colors.categoryIcons[txn.category] || colors.categoryIcons.Other;

  return (
    <Pressable onPress={() => onPress && onPress(txn)} style={({ pressed }) => [pressed && styles.pressed]}>
      <BlurView intensity={30} tint="dark" style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: tint + '22' }]}>
          <Ionicons name={glyph} size={17} color={tint} />
        </View>
        <View style={styles.main}>
          <Text style={styles.merchant} numberOfLines={1}>{txn.merchant}</Text>
          <Text style={styles.sub}>{txn.time} · {txn.category}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>−{inr(txn.amount)}</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.faint} />
        </View>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 20,
    padding: 13,
    marginBottom: 8,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  main: { flex: 1 },
  merchant: { fontSize: 15, fontWeight: '600', color: colors.ink, letterSpacing: -0.1 },
  sub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amount: { fontSize: 15.5, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
});
