// Budget-alert banner (apps/mobile/src/components/BudgetAlertBanner.tsx).
// Watches budgets and shows a rose "Over budget" banner when any category is
// at/above 100% of its monthly target, or an amber "Almost there" hint when
// any category is at/above 80%. Dismissible per calendar day (local state).
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { watchBudgets } from '../data/budgets';
import type { Budget } from '../data/types';
import { categoryMeta } from '../categoryMeta';
import { dayKey } from '../data/types';

const WARN_RATIO = 0.8;

export default function BudgetAlertBanner({
  uid,
  onPress,
}: {
  uid: string;
  onPress?: () => void;
}) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dismissedDay, setDismissedDay] = useState<string | null>(null);

  useEffect(() => {
    return watchBudgets(uid, setBudgets, () => {});
  }, [uid]);

  const alert = useMemo(() => {
    const tracked = budgets.filter((b) => b.monthPaise > 0);
    const over = tracked.filter((b) => b.spentPaise >= b.monthPaise);
    if (over.length > 0) {
      const names = over.slice(0, 2).map((b) => categoryMeta(b.category).label);
      const extra = over.length > 2 ? ` and ${over.length - 2} more` : '';
      return {
        tone: 'over' as const,
        title: 'Over budget',
        body: `${names.join(', ')}${extra} crossed the monthly limit.`,
        icon: 'alert-circle-outline',
      };
    }
    const near = tracked.filter((b) => b.spentPaise >= b.monthPaise * WARN_RATIO);
    if (near.length > 0) {
      const names = near.slice(0, 2).map((b) => categoryMeta(b.category).label);
      const extra = near.length > 2 ? ` and ${near.length - 2} more` : '';
      return {
        tone: 'warn' as const,
        title: 'Almost there',
        body: `${names.join(', ')}${extra} used 80% of the monthly budget.`,
        icon: 'warning-outline',
      };
    }
    return null;
  }, [budgets]);

  if (!alert || dismissedDay === dayKey()) return null;

  const tint = alert.tone === 'over' ? colors.rose : colors.amber;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.wrap}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`Budget alert: ${alert.title}. ${alert.body}`}
    >
      <View style={[styles.banner, { borderColor: tint + '55', backgroundColor: tint + '1A' }]}>
        <View style={[styles.iconWrap, { backgroundColor: tint + '26' }]}>
          <Ionicons name={alert.icon as never} size={18} color={tint} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: tint }]}>{alert.title}</Text>
          <Text style={styles.body}>{alert.body}</Text>
        </View>
        <Pressable
          onPress={() => setDismissedDay(dayKey())}
          hitSlop={10}
          style={styles.dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss budget alert for today"
        >
          <Ionicons name="close" size={17} color={colors.muted} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  body: { fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  dismiss: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
});
