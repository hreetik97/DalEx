// Welcome / sign-in screen (apps/mobile/src/app/welcome.tsx).
// Google (Nitro one-tap) and Apple (iOS) sign-in, equal prominence.
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../data/auth';
import { colors, floatShadow, radius } from '../theme';

export default function WelcomeScreen() {
  const { signInGoogle, signInApple } = useAuth();
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(kind: 'google' | 'apple') {
    setBusy(kind);
    setError(null);
    try {
      if (kind === 'google') await signInGoogle();
      else await signInApple();
      // RouteGuard in _layout.tsx takes it from here.
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed. Please try again.';
      if (!/cancel/i.test(msg)) setError(msg);
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0A1420', '#06080E', '#030509']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbMint]} />
      <View style={[styles.orb, styles.orbIndigo]} />

      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Ionicons name="wallet-outline" size={34} color={colors.primary} />
          </View>
          <Text style={styles.title}>Hisab</Text>
          <Text style={styles.subtitle}>
            Your money, understood.{'\n'}UPI + cards, one calm daily digest.
          </Text>
        </View>

        <BlurView intensity={45} tint="dark" style={[styles.card, floatShadow]}>
          <Text style={styles.cardTitle}>Sign in to continue</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.googleBtn, busy === 'google' && styles.btnDisabled]}
            onPress={() => handle('google')}
            disabled={busy !== null}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            {busy === 'google' ? (
              <ActivityIndicator color="#0B0E14" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#0B0E14" />
                <Text style={styles.googleLabel}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {Platform.OS === 'ios' ? (
            busy === 'apple' ? (
              <View style={[styles.appleBtn, styles.btnDisabled]}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={16}
                style={styles.appleBtn}
                onPress={() => handle('apple')}
              />
            )
          ) : null}

          <Text style={styles.fine}>
            By continuing you agree to the notice shown next —{'\n'}plain-language, DPDP compliant.
          </Text>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  orb: { position: 'absolute', width: 340, height: 340, borderRadius: 170, opacity: 0.5 },
  orbMint: { backgroundColor: colors.orbMint, top: -110, left: -110 },
  orbIndigo: { backgroundColor: colors.orbIndigo, bottom: -130, right: -120 },
  content: { flex: 1, justifyContent: 'center', padding: 28 },
  brand: { alignItems: 'center', marginBottom: 40 },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.glassStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 40, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  subtitle: { marginTop: 10, fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center' },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    padding: 24,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, marginBottom: 18, textAlign: 'center' },
  error: {
    color: colors.rose,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 12,
  },
  googleLabel: { fontSize: 16, fontWeight: '700', color: '#0B0E14' },
  appleBtn: { height: 52, width: '100%', marginBottom: 4 },
  btnDisabled: { opacity: 0.7 },
  fine: { marginTop: 14, fontSize: 12, lineHeight: 17, color: colors.faint, textAlign: 'center' },
});
