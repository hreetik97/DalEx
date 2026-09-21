import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, inr } from '../theme';
import GlassCard from './GlassCard';

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];

// Bottom sheet with full transaction detail + recategorize chips.
export default function TransactionSheet({ txn, visible, onClose, onRecategorize }) {
  const [cat, setCat] = useState(null);
  if (!txn) return null;
  const activeCat = cat || txn.category;
  const tint = colors.categories[activeCat] || colors.categories.Other;
  const glyph = colors.categoryIcons[activeCat] || colors.categoryIcons.Other;
  const isUpi = txn.via === 'UPI';

  const pick = (c) => {
    setCat(c);
    onRecategorize && onRecategorize(txn.id, c);
  };

  const close = () => {
    setCat(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <GlassCard strong intensity={70} style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.head}>
            <View style={[styles.iconWrap, { backgroundColor: tint + '26' }]}>
              <Ionicons name={glyph} size={21} color={tint} />
            </View>
            <View style={styles.headText}>
              <Text style={styles.merchant} numberOfLines={1}>{txn.merchant}</Text>
              <Text style={styles.time}>{txn.time} · {activeCat}</Text>
            </View>
            <Text style={styles.amount}>−{inr(txn.amount)}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.badge, isUpi ? styles.upi : styles.card]}>
              <Ionicons
                name={isUpi ? 'phone-portrait-outline' : 'card-outline'}
                size={13}
                color={isUpi ? colors.upiText : colors.cardText}
              />
              <Text style={[styles.badgeText, { color: isUpi ? colors.upiText : colors.cardText }]}>
                {isUpi ? 'UPI' : 'Credit Card'}
              </Text>
            </View>
            <Text style={styles.ref}>{txn.ref}</Text>
          </View>

          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => {
              const active = c === activeCat;
              const cc = colors.categories[c];
              const cg = colors.categoryIcons[c];
              return (
                <Pressable
                  key={c}
                  onPress={() => pick(c)}
                  style={[styles.chip, active && { backgroundColor: cc + '2E', borderColor: cc + '88' }]}
                >
                  <Ionicons name={cg} size={14} color={active ? cc : colors.muted} />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                  {active && <Ionicons name="checkmark" size={13} color={cc} />}
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={close} style={styles.doneBtn}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 34,
  },
  sheet: { padding: 20, borderRadius: radius.xl },
  grabber: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center', marginBottom: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconWrap: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  headText: { flex: 1 },
  merchant: { fontSize: 17, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  time: { fontSize: 13, color: colors.muted, marginTop: 3 },
  amount: { fontSize: 22, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  upi: { backgroundColor: colors.upiBg },
  card: { backgroundColor: colors.cardBg },
  badgeText: { fontSize: 12, fontWeight: '700' },
  ref: { fontSize: 12.5, color: colors.faint },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: colors.faint, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  chipText: { fontSize: 13.5, fontWeight: '600', color: colors.inkSoft },
  chipTextActive: { color: colors.ink, fontWeight: '700' },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 18, paddingVertical: 14, alignItems: 'center',
  },
  doneText: { fontSize: 15.5, fontWeight: '800', color: '#05281C' },
});
