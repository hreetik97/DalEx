// Step 3 — age confirmation (apps/mobile/src/app/onboarding/age.tsx).
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../data/auth';
import { ConsentPurpose, logConsent } from '../../data/consent';
import { colors } from '../../theme';
import { OnboardingShell, PrimaryButton, goBack } from './_shared';

export default function AgeScreen() {
  const { user, signOut, refreshConsent } = useAuth();
  const [busy, setBusy] = useState(false);

  async function confirmAdult() {
    if (!user || busy) return;
    setBusy(true);
    try {
      await logConsent(user.uid, ConsentPurpose.AGE);
      await refreshConsent();
      router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  }

  async function notAdult() {
    await signOut().catch(() => {});
    router.replace('/welcome');
  }

  return (
    <OnboardingShell step={3} title="One last check" onBack={goBack}>
      <Text style={styles.body}>
        Hisab is a personal finance app. To comply with Indian regulations, you need to be 18 or older
        to use it.
      </Text>
      <PrimaryButton label={busy ? 'Saving…' : 'I am 18 or older'} onPress={confirmAdult} disabled={busy} />
      <Pressable
        style={styles.alt}
        onPress={notAdult}
        accessibilityRole="button"
        accessibilityLabel="I'm under 18"
      >
        <Text style={styles.altLabel}>I&apos;m under 18</Text>
      </Pressable>
      <Text style={styles.fine}>
        Choosing &quot;under 18&quot; signs you out — no account data is kept on this device.
      </Text>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 14, lineHeight: 21, color: colors.muted, marginBottom: 8 },
  alt: { marginTop: 16, alignItems: 'center', paddingVertical: 10 },
  altLabel: { fontSize: 14, fontWeight: '600', color: colors.muted },
  fine: { marginTop: 12, fontSize: 12, lineHeight: 17, color: colors.faint, textAlign: 'center' },
});
