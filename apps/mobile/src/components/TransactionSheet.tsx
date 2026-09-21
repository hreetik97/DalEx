// Bottom sheet with full transaction detail + recategorize chips
// (apps/mobile/src/components/TransactionSheet.tsx).
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius } from '../theme';
import { inrPaise } from '../money';
import { CATEGORY_META, categoryMeta, formatDateIST, formatTimeIST, methodMeta, sourceLabel } from '../categoryMeta';
import { updateCategory } from '../data/transactions';
import type { Category, Transaction } from '../data/types';
import GlassCard from './GlassCard';

interface Props {
  txn: Transaction | null;
  uid: string | null;
  onClose: () => void;
}

export default function TransactionSheet({ txn, uid, onClose }: Props) {
  // The parent remounts this sheet per transaction (key={txn.id}), so local
  // state always starts fresh for the opened transaction.
  const [picked, setPicked] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  if (!txn) return null;
  const activeCat = picked ?? txn.category;
  const cat = categoryMeta(activeCat);
  const method = methodMeta(txn.method);

  const pick = async (c: Category) => {
    if (c === txn.category || saving) {
      setPicked(c);
      return;
    }
    setPicked(c);
    if (!uid) return;
    setSaving(true);
    try {
      await updateCategory(uid, txn.id, c);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setPicked(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close transaction details"
      >
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <GlassCard strong intensity={70} style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.head}>
            <View style={[styles.iconWrap, { backgroundColor: cat.hue + '26' }]}>
              <Ionicons name={cat.glyph as never} size={21} color={cat.hue} />
            </View>
            <View style={styles.headText}>
              <Text style={styles.merchant} numberOfLines={1}>
                {txn.merchantRaw}
              </Text>
              <Text style={styles.time}>
                {formatTimeIST(txn.txnAt)} · {formatDateIST(txn.txnAt)} · {cat.label}
              </Text>
            </View>
            <Text style={styles.amount}>−{inrPaise(txn.amountPaise)}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: method.badgeBg }]}>
              <Ionicons name={method.glyph as never} size={13} color={method.badgeText} />
              <Text style={[styles.badgeText, { color: method.badgeText }]}>{method.label}</Text>
            </View>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>{sourceLabel(txn.source)}</Text>
            </View>
            {txn.sourceRef ? <Text style={styles.ref} numberOfLines={1}>{txn.sourceRef}</Text> : null}
          </View>

          {txn.note ? <Text style={styles.note}>{txn.note}</Text> : null}

          <View style={styles.labelRow}>
            <Text style={styles.label}>CATEGORY</Text>
            {saving ? <ActivityIndicator size="small" color={colors.faint} /> : null}
          </View>
          <View style={styles.chips}>
            {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
              const active = c === activeCat;
              const cc = CATEGORY_META[c];
              return (
                <Pressable
                  key={c}
                  onPress={() => void pick(c)}
                  style={[
                    styles.chip,
                    active && { backgroundColor: cc.hue + '2E', borderColor: cc.hue + '88' },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Recategorize as ${cc.label}`}
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons
                    name={cc.glyph as never}
                    size={14}
                    color={active ? cc.hue : colors.muted}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{cc.label}</Text>
                  {active && <Ionicons name="checkmark" size={13} color={cc.hue} />}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onClose}
            style={styles.doneBtn}
            accessibilityRole="button"
            accessibilityLabel="Done, close transaction details"
          >
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 34,
  },
  sheet: { padding: 20, borderRadius: radius.xl },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headText: { flex: 1, minWidth: 0 },
  merchant: { fontSize: 17, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  time: { fontSize: 13, color: colors.muted, marginTop: 3 },
  amount: { fontSize: 22, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  sourceBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  sourceText: { fontSize: 12, fontWeight: '700', color: colors.inkSoft },
  ref: { fontSize: 12.5, color: colors.faint, flex: 1, minWidth: 80 },
  note: {
    fontSize: 13.5,
    color: colors.inkSoft,
    lineHeight: 19,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: colors.faint },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  chipText: { fontSize: 13.5, fontWeight: '600', color: colors.inkSoft },
  chipTextActive: { color: colors.ink, fontWeight: '700' },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: { fontSize: 15.5, fontWeight: '800', color: '#05281C' },
});
