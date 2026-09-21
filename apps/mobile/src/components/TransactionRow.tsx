// Frosted transaction row (apps/mobile/src/components/TransactionRow.tsx).
// Tap opens the detail sheet (handled by the parent).
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { inrPaise } from '../money';
import { categoryMeta, formatTimeIST, methodMeta } from '../categoryMeta';
import type { Transaction } from '../data/types';

interface Props {
  txn: Transaction;
  onPress?: (txn: Transaction) => void;
}

export default function TransactionRow({ txn, onPress }: Props) {
  const cat = categoryMeta(txn.category);
  const method = methodMeta(txn.method);

  return (
    <Pressable
      onPress={() => onPress?.(txn)}
      style={({ pressed }) => [pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${txn.merchantRaw}, ${inrPaise(txn.amountPaise)}, ${cat.label}, via ${method.label}`}
      accessibilityHint="Opens transaction details"
    >
      <BlurView intensity={30} tint="dark" style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: cat.hue + '26' }]}>
          <Ionicons name={cat.glyph as never} size={17} color={cat.hue} />
        </View>
        <View style={styles.main}>
          <Text style={styles.merchant} numberOfLines={1}>
            {txn.merchantRaw}
          </Text>
          <Text style={styles.sub}>
            {formatTimeIST(txn.txnAt)} · {cat.label}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>−{inrPaise(txn.amountPaise)}</Text>
          <View style={[styles.methodBadge, { backgroundColor: method.badgeBg }]}>
            <Text style={[styles.methodText, { color: method.badgeText }]}>{method.label}</Text>
          </View>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  main: { flex: 1, minWidth: 0 },
  merchant: { fontSize: 15, fontWeight: '600', color: colors.ink, letterSpacing: -0.1 },
  sub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amount: { fontSize: 15.5, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  methodBadge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  methodText: { fontSize: 10.5, fontWeight: '700' },
});
