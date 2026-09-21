// Step 2 — optional channel preferences (apps/mobile/src/app/onboarding/channels.tsx).
// Both toggles are preference consent only and default OFF. No permission
// dialogs fire during onboarding except the push one the user explicitly enables.
import { useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../data/auth';
import { ConsentPurpose, logConsent } from '../../data/consent';
import { registerDeviceToken, requestPushPermission } from '../../data/messaging';
import { colors } from '../../theme';
import { OnboardingShell, PrimaryButton, goBack } from './_shared';

export default function ChannelsScreen() {
  const { user } = useAuth();
  const [push, setPush] = useState(false);
  const [sms, setSms] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function togglePush(value: boolean) {
    setNote(null);
    if (!value) {
      setPush(false);
      return;
    }
    if (!user) return;
    try {
      const granted = await requestPushPermission();
      if (!granted) {
        setNote('Notifications were not allowed — the digest will stay inside the app.');
        return;
      }
      await logConsent(user.uid, ConsentPurpose.PUSH);
      await registerDeviceToken(user.uid);
      setPush(true);
    } catch {
      setNote('Could not enable notifications right now. You can try again in settings.');
    }
  }

  async function toggleSms(value: boolean) {
    setNote(null);
    setSms(value);
    if (value && user) {
      // Preference consent only — on-device SMS reading ships in Phase 2.
      await logConsent(user.uid, ConsentPurpose.SMS).catch(() => {});
      setNote('Saved. SMS auto-capture arrives in a later update; nothing reads your SMS yet.');
    }
  }

  return (
    <OnboardingShell step={2} title="Optional extras" onBack={goBack}>
      <Text style={styles.lede}>
        These are entirely optional and stay off unless you choose otherwise. You can change them any
        time in settings.
      </Text>

      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="notifications-outline" size={18} color={colors.blue} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Evening digest push</Text>
          <Text style={styles.rowBody}>A 9 PM nudge with today&apos;s spend summary.</Text>
        </View>
        <Switch
          value={push}
          onValueChange={togglePush}
          trackColor={{ true: colors.primary }}
          accessibilityLabel="Push notifications"
        />
      </View>

      {Platform.OS === 'android' ? (
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color={colors.violet} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>SMS auto-capture</Text>
            <Text style={styles.rowBody}>Read bank SMS on-device to log spends automatically.</Text>
          </View>
          <Switch
            value={sms}
            onValueChange={toggleSms}
            trackColor={{ true: colors.primary }}
            accessibilityLabel="SMS auto-capture"
          />
        </View>
      ) : null}

      {note ? <Text style={styles.note}>{note}</Text> : null}

      <PrimaryButton label="Continue" onPress={() => router.replace('/onboarding/age')} />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  lede: { fontSize: 13, lineHeight: 19, color: colors.muted, marginBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  rowBody: { fontSize: 12, lineHeight: 17, color: colors.muted },
  note: { marginTop: 12, fontSize: 12, lineHeight: 17, color: colors.amber },
});
