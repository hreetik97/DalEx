// Settings (apps/mobile/src/app/(tabs)/settings.tsx).
// Profile, notification preferences (live from users/{uid}.notifPrefs),
// privacy dashboard link, sign-out and the DPDP account-deletion flow
// (deleteAccount callable -> local sign-out).
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable, Switch, TextInput,
  Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import GlassCard from '../../components/GlassCard';
import { useAuth } from '../../data/auth';
import { watchNotifPrefs, updateNotifPrefs } from '../../data/prefs';
import { setMorningNudgeEnabled } from '../../data/morningNudge';
import { callDeleteAccount } from '../../data/account';
import type { NotifPrefs } from '../../data/types';
import { TabScreen, SectionLabel } from './_shared';

function Row({
  icon,
  title,
  body,
  right,
  onPress,
  danger,
}: {
  icon: string;
  title: string;
  body?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? title : undefined}
    >
      <View style={styles.row}>
        <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
          <Ionicons
            name={icon as never}
            size={17}
            color={danger ? colors.rose : colors.inkSoft}
          />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
          {body ? <Text style={styles.rowBody}>{body}</Text> : null}
        </View>
        {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={colors.faint} /> : null)}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [prefs, setPrefs] = useState<NotifPrefs | null>(null);
  const [digestTime, setDigestTime] = useState('21:00');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    return watchNotifPrefs(user.uid, (p) => {
      setPrefs(p);
      setDigestTime(p.digestTime);
    });
  }, [user]);

  async function toggleEveningDigest(value: boolean) {
    if (!user || !prefs) return;
    try {
      await updateNotifPrefs(user.uid, { eveningDigest: value });
    } catch {
      Alert.alert('Could not save', 'Check your connection and try again.');
    }
  }

  async function toggleMorningNudge(value: boolean) {
    if (!user || !prefs) return;
    if (value) {
      // Schedule the local 08:00 nudge first; only persist the pref if the
      // OS accepts the schedule (permission granted).
      try {
        await setMorningNudgeEnabled(true);
      } catch {
        Alert.alert(
          'Notifications are off',
          'Allow notifications for Hisab to receive the morning nudge.'
        );
        return;
      }
    } else {
      try {
        await setMorningNudgeEnabled(false);
      } catch {
        // Best-effort cancel; the pref still flips off.
      }
    }
    try {
      await updateNotifPrefs(user.uid, { morningNudge: value });
    } catch {
      Alert.alert('Could not save', 'Check your connection and try again.');
    }
  }

  async function saveDigestTime() {
    if (!user) return;
    if (!/^\d{2}:\d{2}$/.test(digestTime)) {
      Alert.alert('Invalid time', 'Use 24-hour HH:MM, e.g. 21:00.');
      setDigestTime(prefs?.digestTime ?? '21:00');
      return;
    }
    setSaving(true);
    try {
      await updateNotifPrefs(user.uid, { digestTime });
    } catch {
      Alert.alert('Could not save', 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function doSignOut() {
    try {
      await signOut();
    } finally {
      router.replace('/welcome');
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete your account?',
      'This permanently erases all your transactions, budgets, bills and settings from Hisab. This cannot be undone.',
      [
        { text: 'Keep my account', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Last chance', 'Tap Delete to wipe everything and sign out.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: runDelete },
            ]),
        },
      ]
    );
  }

  async function runDelete() {
    setDeleting(true);
    try {
      await callDeleteAccount();
    } catch (e) {
      setDeleting(false);
      Alert.alert('Deletion failed', e instanceof Error ? e.message : 'Please try again.');
      return;
    }
    try {
      await signOut();
    } finally {
      setDeleting(false);
      router.replace('/welcome');
    }
  }

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <TabScreen title="Settings" subtitle="Your account and preferences">
      <GlassCard style={styles.card}>
        <View style={styles.profile}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={22} color={colors.inkSoft} />
            </View>
          )}
          <View style={styles.profileText}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.displayName ?? 'Hisab user'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
          </View>
        </View>
      </GlassCard>

      <SectionLabel>Notifications</SectionLabel>
      <GlassCard style={styles.card}>
        {prefs === null ? (
          <ActivityIndicator color={colors.primary} style={{ paddingVertical: 12 }} />
        ) : (
          <>
            <Row
              icon="moon-outline"
              title="Evening digest"
              body="A daily wrap-up of what you spent, with planned-vs-actual."
              right={
                <Switch
                  value={prefs.eveningDigest}
                  onValueChange={toggleEveningDigest}
                  trackColor={{ true: colors.primary }}
                  accessibilityLabel="Evening digest"
                />
              }
            />
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="time-outline" size={17} color={colors.inkSoft} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Digest time</Text>
                <Text style={styles.rowBody}>24-hour format, India time.</Text>
              </View>
              <TextInput
                value={digestTime}
                onChangeText={setDigestTime}
                onBlur={saveDigestTime}
                onSubmitEditing={saveDigestTime}
                placeholder="21:00"
                placeholderTextColor={colors.faint}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                style={styles.timeInput}
                accessibilityLabel="Digest time in 24-hour format"
              />
            </View>
            <View style={styles.divider} />
            <Row
              icon="sunny-outline"
              title="Morning nudge"
              body="A gentle reminder to plan your day's spending."
              right={
                <Switch
                  value={prefs.morningNudge}
                  onValueChange={toggleMorningNudge}
                  trackColor={{ true: colors.primary }}
                  accessibilityLabel="Morning nudge"
                />
              }
            />
          </>
        )}
      </GlassCard>

      <SectionLabel>Privacy</SectionLabel>
      <GlassCard style={styles.card}>
        <Row
          icon="shield-checkmark-outline"
          title="Privacy dashboard"
          body="See what you consented to, and change your mind anytime."
          onPress={() => router.push('/privacy')}
        />
      </GlassCard>

      <SectionLabel>Account</SectionLabel>
      <GlassCard style={styles.card}>
        <Row
          icon="log-out-outline"
          title="Sign out"
          onPress={doSignOut}
        />
        <View style={styles.divider} />
        <Row
          icon="trash-outline"
          title={deleting ? 'Deleting…' : 'Delete account'}
          body="Permanently erase all your Hisab data."
          onPress={deleting ? undefined : confirmDelete}
          danger
        />
      </GlassCard>

      <Text style={styles.version}>Hisab v{version} · Made for India</Text>
      {saving ? <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} /> : null}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 6, marginBottom: 4 },
  profile: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  avatarFallback: {
    width: 52, height: 52, borderRadius: 26, marginRight: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileText: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '800', color: colors.ink },
  profileEmail: { fontSize: 13, color: colors.muted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  rowIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowIconDanger: { backgroundColor: 'rgba(251,113,133,0.12)' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  rowTitleDanger: { color: colors.rose },
  rowBody: { fontSize: 12.5, color: colors.muted, marginTop: 2, lineHeight: 17 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 12 },
  timeInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 15, fontWeight: '700', color: colors.ink,
    fontVariant: ['tabular-nums'], minWidth: 76, textAlign: 'center',
  },
  version: { textAlign: 'center', fontSize: 12, color: colors.faint, marginTop: 22 },
});
