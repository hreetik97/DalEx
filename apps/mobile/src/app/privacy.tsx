// Privacy dashboard (apps/mobile/src/app/privacy.tsx).
// Shows the DPDP consent audit trail (users/{uid}.consentLog) and lets the
// user grant or withdraw push / SMS consent at any time. Withdrawals are
// appended to the log, so the history stays auditable.
import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable, Switch, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import GlassBackground from '../components/GlassBackground';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../data/auth';
import {
  ConsentPurpose,
  getConsentLog,
  getConsentState,
  logConsent,
  withdrawConsent,
} from '../data/consent';
import { requestPushPermission, registerDeviceToken } from '../data/messaging';
import { updateNotifPrefs } from '../data/prefs';
import type { ConsentEntry } from '../data/types';
import { formatDateIST, formatTimeIST } from '../categoryMeta';

const PURPOSE_LABELS: Record<string, { title: string; body: string }> = {
  [ConsentPurpose.ACCOUNT]: {
    title: 'Account & core data',
    body: 'Storing your profile, transactions, budgets and bills so Hisab works.',
  },
  [ConsentPurpose.PUSH]: {
    title: 'Push notifications',
    body: 'Evening digest and transactional service messages. Never promotional.',
  },
  [ConsentPurpose.SMS]: {
    title: 'SMS auto-capture',
    body: 'Reading bank SMS on-device to log spends automatically. Raw SMS never leaves your phone.',
  },
  [ConsentPurpose.AGE]: {
    title: '18+ confirmation',
    body: 'You confirmed you are 18 or older.',
  },
};

function entryDate(e: ConsentEntry): string {
  const raw = e.grantedAt as { toDate?: () => Date } | undefined;
  const d = raw?.toDate ? raw.toDate() : raw instanceof Date ? raw : null;
  if (!d) return '—';
  return `${formatDateIST(d)} · ${formatTimeIST(d)}`;
}

export default function PrivacyScreen() {
  const { user } = useAuth();
  const [log, setLog] = useState<ConsentEntry[]>([]);
  const [state, setState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [l, s] = await Promise.all([getConsentLog(user.uid), getConsentState(user.uid)]);
      setLog([...l].reverse());
      setState(s);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function setPush(value: boolean) {
    if (!user || busy) return;
    setBusy(true);
    try {
      if (value) {
        await logConsent(user.uid, ConsentPurpose.PUSH);
        const granted = await requestPushPermission();
        if (granted) {
          await registerDeviceToken(user.uid);
          await updateNotifPrefs(user.uid, { eveningDigest: true });
        } else {
          Alert.alert('Permission needed', 'Allow notifications in system settings to receive the digest.');
        }
      } else {
        await withdrawConsent(user.uid, ConsentPurpose.PUSH);
        await updateNotifPrefs(user.uid, { eveningDigest: false });
      }
      await refresh();
    } catch (e) {
      Alert.alert('Could not update', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function setSms(value: boolean) {
    if (!user || busy) return;
    setBusy(true);
    try {
      if (value) {
        await logConsent(user.uid, ConsentPurpose.SMS);
      } else {
        await withdrawConsent(user.uid, ConsentPurpose.SMS);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <GlassBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
            <Text style={styles.title}>Privacy</Text>
            <View style={{ width: 40 }} />
          </View>
          <Text style={styles.subtitle}>
            Your data stays in India (Mumbai region) and is never sold. Change your mind anytime —
            withdrawals take effect immediately.
          </Text>

          <Text style={styles.section}>Permissions</Text>
          <GlassCard style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Push notifications</Text>
                <Text style={styles.toggleBody}>Evening digest and service messages only.</Text>
              </View>
              <Switch
                value={!!state[ConsentPurpose.PUSH]}
                onValueChange={setPush}
                trackColor={{ true: colors.primary }}
                disabled={busy}
                accessibilityLabel="Push notifications consent"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>SMS auto-capture</Text>
                <Text style={styles.toggleBody}>
                  Arrives in a later update — nothing reads your SMS yet.
                </Text>
              </View>
              <Switch
                value={!!state[ConsentPurpose.SMS]}
                onValueChange={setSms}
                trackColor={{ true: colors.primary }}
                disabled={busy}
                accessibilityLabel="SMS auto-capture consent"
              />
            </View>
          </GlassCard>

          <Text style={styles.section}>Consent history</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : log.length === 0 ? (
            <Text style={styles.emptyLog}>No consent events recorded yet.</Text>
          ) : (
            log.map((e, i) => {
              const meta = PURPOSE_LABELS[e.purpose] ?? { title: e.purpose, body: '' };
              const granted = e.granted ?? true;
              return (
                <GlassCard key={i} style={styles.entry}>
                  <View style={[styles.dot, { backgroundColor: granted ? colors.primary : colors.rose }]} />
                  <View style={styles.entryText}>
                    <Text style={styles.entryTitle}>
                      {meta.title} · {granted ? 'granted' : 'withdrawn'}
                    </Text>
                    <Text style={styles.entryBody}>{entryDate(e)} · notice v{e.noticeVersion}</Text>
                  </View>
                </GlassCard>
              );
            })
          )}

          <GlassCard style={styles.note}>
            <Ionicons name="information-circle-outline" size={20} color={colors.blue} />
            <Text style={styles.noteText}>
              You can erase everything with Settings → Delete account. Financial data is stored as
              integer paise and is only ever visible to you.
            </Text>
          </GlassCard>
          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  container: { padding: 20, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  title: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 13.5, color: colors.muted, lineHeight: 20, marginBottom: 6 },
  section: {
    fontSize: 15, fontWeight: '800', color: colors.ink,
    letterSpacing: -0.2, marginTop: 20, marginBottom: 10,
  },
  card: { padding: 6, marginBottom: 4 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  toggleText: { flex: 1, marginRight: 10 },
  toggleTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  toggleBody: { fontSize: 12.5, color: colors.muted, marginTop: 2, lineHeight: 17 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 12 },
  entry: { flexDirection: 'row', alignItems: 'center', padding: 13, marginBottom: 8 },
  dot: { width: 9, height: 9, borderRadius: 4.5, marginRight: 12 },
  entryText: { flex: 1 },
  entryTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, textTransform: 'capitalize' },
  entryBody: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  emptyLog: { fontSize: 13.5, color: colors.faint, textAlign: 'center', marginTop: 16 },
  note: { flexDirection: 'row', padding: 16, marginTop: 18, gap: 12, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 },
});
