// Shared onboarding shell: dark canvas, orbs, frosted card, step dots.
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, floatShadow, radius } from '../../theme';

export function OnboardingShell({
  step,
  title,
  children,
  onBack,
}: {
  step: 1 | 2 | 3;
  title: string;
  children: ReactNode;
  onBack?: () => void;
}) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A1420', '#06080E', '#030509']} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, styles.orbMint]} />
      <View style={[styles.orb, styles.orbRose]} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              style={styles.backBtn}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          <View style={styles.dots}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.backBtn} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <BlurView intensity={45} tint="dark" style={[styles.card, floatShadow]}>
          {children}
        </BlurView>
      </ScrollView>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.primary, disabled && styles.primaryDisabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.primaryLabel, disabled && styles.primaryLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

export function goBack() {
  router.back();
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  orb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.45 },
  orbMint: { backgroundColor: colors.orbMint, top: -120, right: -110 },
  orbRose: { backgroundColor: colors.orbRose, bottom: -140, left: -120 },
  scroll: { padding: 24, paddingTop: 64, paddingBottom: 48 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.glassBorder },
  dotActive: { backgroundColor: colors.primary },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.3, marginBottom: 20 },
  card: { borderRadius: radius.xl, borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden', padding: 22 },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryDisabled: { backgroundColor: colors.glassStrong },
  primaryLabel: { fontSize: 16, fontWeight: '800', color: '#04120C' },
  primaryLabelDisabled: { color: colors.faint },
});
