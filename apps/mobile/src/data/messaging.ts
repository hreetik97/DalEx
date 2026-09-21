// FCM messaging lifecycle (apps/mobile/src/data/messaging.ts).
// Background handler is registered at module init (native only) so quit-state
// messages are caught. Foreground listeners + token registration are wired by
// initMessaging(), called from the root layout on native. Notification
// permission is requested ONLY after the user opts in (onboarding channels
// screen or notification settings) — never during auth.
import { Platform } from 'react-native';
import {
  FieldPath,
  deleteField,
  doc,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from '@react-native-firebase/firestore';

const isNative = Platform.OS !== 'web';

type MessagingModule = typeof import('@react-native-firebase/messaging');

let messagingModule: MessagingModule | null = null;
async function getMessagingModule(): Promise<MessagingModule> {
  if (!messagingModule) messagingModule = await import('@react-native-firebase/messaging');
  return messagingModule;
}

// ---------------------------------------------------------------------------
// Module-init: background message handler (native only).
// V1 payloads are data-only; the Cloud Function sends display notifications,
// so the handler just needs to exist to keep the native channel alive.
// ---------------------------------------------------------------------------
if (isNative) {
  getMessagingModule()
    .then((m) => {
      m.setBackgroundMessageHandler(m.getMessaging(), async () => {});
    })
    .catch(() => {
      // Native module unavailable (e.g. Expo Go) — messaging stays disabled.
    });
}

// ---------------------------------------------------------------------------
// Foreground + token-refresh wiring. Called once from the root layout.
// ---------------------------------------------------------------------------
let currentUid: string | null = null;
let listenersStarted = false;
const foregroundHandlers = new Set<(type: string, data: Record<string, string>) => void>();

/** Called by AuthProvider whenever auth state changes. */
export function setMessagingUid(uid: string | null): void {
  currentUid = uid;
  if (!uid) return;
  // Token may have refreshed while signed out; re-register for the new user.
  void registerDeviceToken(uid).catch(() => {});
}

/** Subscribe to foreground FCM data messages. Returns an unsubscribe function. */
export function onForegroundMessage(
  handler: (type: string, data: Record<string, string>) => void
): () => void {
  foregroundHandlers.add(handler);
  return () => {
    foregroundHandlers.delete(handler);
  };
}

export async function initMessaging(): Promise<void> {
  if (!isNative || listenersStarted) return;
  listenersStarted = true;
  try {
    const m = await getMessagingModule();
    const messaging = m.getMessaging();
    m.onMessage(messaging, (remoteMessage) => {
      const type = (remoteMessage.data?.type as string) ?? 'unknown';
      const data = (remoteMessage.data ?? {}) as Record<string, string>;
      foregroundHandlers.forEach((h) => h(type, data));
    });
    m.onNotificationOpenedApp(messaging, (remoteMessage) => {
      const type = (remoteMessage.data?.type as string) ?? 'unknown';
      const data = (remoteMessage.data ?? {}) as Record<string, string>;
      foregroundHandlers.forEach((h) => h(`opened:${type}`, data));
    });
    m.onTokenRefresh(messaging, (token) => {
      if (currentUid) void registerDeviceToken(currentUid, token).catch(() => {});
    });
  } catch {
    // Native module unavailable — messaging stays disabled.
  }
}

// ---------------------------------------------------------------------------
// Permission (post opt-in only) + token registration.
// ---------------------------------------------------------------------------
export async function requestPushPermission(): Promise<boolean> {
  if (!isNative) return false;
  const m = await getMessagingModule();
  const status = await m.requestPermission(m.getMessaging());
  // AuthorizationStatus.AUTHORIZED = 1, PROVISIONAL = 2 (iOS). Android 13+ returns AUTHORIZED on grant.
  return status === 1 || status === 2;
}

export async function hasPushPermission(): Promise<boolean> {
  if (!isNative) return false;
  const m = await getMessagingModule();
  const status = await m.hasPermission(m.getMessaging());
  return status === 1 || status === 2;
}

/**
 * Store the FCM token in the users/{uid}.fcmTokens map, the shape the
 * scheduledDigest / cleanupTokens Cloud Functions read and maintain.
 * FieldPath is used because raw token strings are embedded in the path.
 */
async function registerTokenDoc(uid: string, token: string): Promise<void> {
  const ref = doc(getFirestore(), 'users', uid);
  await updateDoc(ref, new FieldPath('fcmTokens', token), {
    platform: Platform.OS,
    updatedAt: serverTimestamp(),
    failures: 0,
  });
}

/** Fetch the FCM token and store it in the users/{uid}.fcmTokens map. */
export async function registerDeviceToken(uid: string, token?: string): Promise<void> {
  if (!isNative) return;
  const m = await getMessagingModule();
  const t = token ?? (await m.getToken(m.getMessaging()));
  if (t) await registerTokenDoc(uid, t);
}

/** Remove this device's token from the fcmTokens map (called during sign-out). */
export async function unregisterDeviceToken(uid: string): Promise<void> {
  if (!isNative) return;
  const m = await getMessagingModule();
  const messaging = m.getMessaging();
  try {
    const t = await m.getToken(messaging);
    if (t) {
      await updateDoc(
        doc(getFirestore(), 'users', uid),
        new FieldPath('fcmTokens', t),
        deleteField()
      ).catch(() => {});
    }
  } catch {
    // No token to remove.
  }
  await m.deleteToken(messaging).catch(() => {});
}
