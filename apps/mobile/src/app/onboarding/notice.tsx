// Step 1 — DPDP consent notice (apps/mobile/src/app/onboarding/notice.tsx).
// Plain-language notice + affirmative agreement. Nothing is collected before this.
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../data/auth';
import { ConsentPurpose, NOTICE_VERSION, logConsent } from '../../data/consent';
import { colors } from '../../theme';
import { OnboardingShell, PrimaryButton } from './_shared';

// TODO: replace with the live privacy policy URL before public release.
const PRIVACY_POLICY_URL = 'https://dalex.app/privacy';

const POINTS: { icon: string; title: string; body: string }[] = [
  {
    icon: 'person-outline',
    title: 'What we collect',
    body: 'Your name and email from sign-in, plus the transactions, budgets, bills and plans you add in the app.',
  },
  {
    icon: 'pie-chart-outline',
    title: 'Why we collect it',
    body: 'Only to run Hisab for you — your spending breakdown, budgets and the daily digest. We never sell your data.',
  },
  {
    icon: 'notifications-outline',
    title: 'What is optional',
    body: 'Push notifications and SMS auto-capture are off by default. You can turn them on next — or never.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Your rights',
    body: 'Access, correct or delete your data any time, and withdraw consent from settings. Signing out stops collection on this device.',
  },
];

export default function NoticeScreen() {
  const { user, refreshConsent } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleAgree() {
    if (!user || !agreed || busy) return;
    setBusy(true);
    try {
      await logConsent(user.uid, ConsentPurpose.ACCOUNT);
      await refreshConsent();
      router.replace('/onboarding/channels');
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnboardingShell step={1} title="How Hisab uses your data">
      <Text style={styles.version}>Notice version {NOTICE_VERSION} · DPDP Act, 2023</Text>
      {POINTS.map((p) => (
        <View key={p.title} style={styles.point}>
          <View style={styles.iconWrap}>
            <Ionicons name={p.icon as never} size={18} color={colors.primary} />
          </View>
          <View style={styles.pointText}>
            <Text style={styles.pointTitle}>{p.title}</Text>
            <Text style={styles.pointBody}>{p.body}</Text>
          </View>
        </View>
      ))}

      <Pressable
        style={styles.linkRow}
        onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
        accessibilityRole="link"
        accessibilityLabel="Read the full Privacy Policy"
      >
        <Text style={styles.link}>Read the full Privacy Policy</Text>
        <Ionicons name="open-outline" size={14} color={colors.primary} />
      </Pressable>

      <Pressable
        style={styles.agreeRow}
        onPress={() => setAgreed((v) => !v)}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityLabel="I have read the notice and agree to Hisab processing my data as described"
        accessibilityState={{ checked: agreed }}
      >
        <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
          {agreed ? <Ionicons name="checkmark" size={16} color="#04120C" /> : null}
        </View>
        <Text style={styles.agreeText}>
          I have read the notice above and agree to Hisab processing my data as described.
        </Text>
      </Pressable>

      <PrimaryButton label={busy ? 'Saving…' : 'I agree — continue'} onPress={handleAgree} disabled={!agreed || busy} />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  version: { fontSize: 12, color: colors.faint, marginBottom: 18 },
  point: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(52,211,153,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: { flex: 1 },
  pointTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 3 },
  pointBody: { fontSize: 13, lineHeight: 19, color: colors.muted },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 18 },
  link: { fontSize: 13, fontWeight: '700', color: colors.primary },
  agreeRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  agreeText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.inkSoft },
});
