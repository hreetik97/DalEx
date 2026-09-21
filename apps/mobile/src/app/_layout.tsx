// Root layout (apps/mobile/src/app/_layout.tsx).
// Wraps the app in AuthProvider, wires FCM foreground listeners, and guards
// routes: signed out -> /welcome, signed in without DPDP consent ->
// /onboarding/notice, signed in with consent -> /(tabs).
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../data/auth';
import { initMessaging } from '../data/messaging';
import { initMorningNudgeHandler } from '../data/morningNudge';

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, consentComplete } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const first = segments[0];
    const inAuthFlow = first === 'welcome' || first === 'onboarding';
    if (!user) {
      if (first !== 'welcome') router.replace('/welcome');
    } else if (!consentComplete) {
      if (first !== 'onboarding') router.replace('/onboarding/notice');
    } else if (inAuthFlow) {
      router.replace('/(tabs)');
    }
  }, [user, loading, consentComplete, segments, router]);

  if (loading) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    void initMessaging();
    initMorningNudgeHandler();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RouteGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </RouteGuard>
    </AuthProvider>
  );
}
