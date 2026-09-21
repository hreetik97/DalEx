// Morning-nudge local notification (apps/mobile/src/data/morningNudge.ts).
// Schedules a daily 08:00 (device local time) reminder to plan the day's
// spending. This is a LOCAL notification via expo-notifications — no push
// token, no server. expo-notifications is imported dynamically so the web
// bundle (which has no notification support) stays safe.
//
// Verified against https://docs.expo.dev/versions/v57.0.0/sdk/notifications/:
// daily trigger = { type: SchedulableTriggerInputTypes.DAILY, hour, minute }.
import { Platform } from 'react-native';

const NUDGE_KIND = 'morning-nudge';
const NUDGE_HOUR = 8;
const NUDGE_MINUTE = 0;

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null = null;

async function notifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web') return null;
  if (!cached) {
    try {
      cached = await import('expo-notifications');
    } catch {
      return null;
    }
  }
  return cached;
}

/** Show the nudge banner when the app is in the foreground. */
export function initMorningNudgeHandler(): void {
  if (Platform.OS === 'web') return;
  void notifications().then((n) => {
    n?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  });
}

/**
 * Enable or disable the daily 08:00 morning nudge. Existing nudge schedules
 * are always cancelled first so toggling can't stack duplicates.
 * Throws if the user denies notification permission.
 */
export async function setMorningNudgeEnabled(enabled: boolean): Promise<void> {
  const n = await notifications();
  if (!n) return; // Web or unavailable — silently a no-op.

  const scheduled = await n.getAllScheduledNotificationsAsync();
  for (const s of scheduled) {
    if ((s.content.data as Record<string, unknown> | undefined)?.kind === NUDGE_KIND) {
      await n.cancelScheduledNotificationAsync(s.identifier);
    }
  }
  if (!enabled) return;

  const { status } = await n.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  if (Platform.OS === 'android') {
    await n.setNotificationChannelAsync(NUDGE_KIND, {
      name: 'Morning nudge',
      importance: n.AndroidImportance.DEFAULT,
    });
  }

  await n.scheduleNotificationAsync({
    content: {
      title: 'Good morning. What are you going to do?',
      body: "Plan today's spend in Hisab — it takes ten seconds.",
      data: { kind: NUDGE_KIND },
      sound: false,
    },
    trigger: {
      type: n.SchedulableTriggerInputTypes.DAILY,
      hour: NUDGE_HOUR,
      minute: NUDGE_MINUTE,
      ...(Platform.OS === 'android' ? { channelId: NUDGE_KIND } : {}),
    },
  });
}
