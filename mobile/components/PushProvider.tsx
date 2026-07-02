import { useEffect, useRef, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';

import { useAuth } from 'components/AuthProvider';
import { useRegisterPushTokenMutation } from 'store/api';

// How notifications behave while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Daily "your digest is ready" local reminder — same banner UI as the server
// push, but scheduled on-device so it fires every day regardless of the backend
// (and works in Expo Go, where remote push doesn't). Fires just after the
// server's 4:30 AM digest cron.
const DAILY_REMINDER_ID = 'daily-digest-reminder';
const REMINDER_HOUR = 5;
const REMINDER_MINUTE = 0;

/** Request notification permission once. Returns whether it's granted. */
async function ensurePermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Fetch this device's Expo push token for server-sent pushes (null if N/A). */
async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null; // emulators/simulators can't receive remote push
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

/** The digest notification's content — shared by the schedule and the preview. */
const DIGEST_CONTENT: Notifications.NotificationContentInput = {
  title: '🎧 Your daily digest is ready',
  body: 'Open Daily Download to listen to today’s episode.',
  sound: 'default',
  data: { type: 'episode_ready' },
};

/** Fire the daily-digest notification immediately (local — works in Expo Go). */
export async function previewDigestNotification(): Promise<boolean> {
  if (!(await ensurePermission())) return false;
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({ content: DIGEST_CONTENT, trigger: null });
  return true;
}

/** Schedule (or refresh) the recurring daily digest reminder. */
async function scheduleDailyReminder(): Promise<void> {
  // Replace any prior schedule so we don't stack duplicates.
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: DIGEST_CONTENT,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
      channelId: 'default',
    },
  });
}

/**
 * Registers the device's push token, schedules the daily reminder, and routes
 * notification taps. Mount inside the auth + redux providers.
 */
export function PushProvider({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  const [registerToken] = useRegisterPushTokenMutation();
  const setup = useRef(false);

  useEffect(() => {
    if (!isAuthed || setup.current) return;
    (async () => {
      try {
        // Don't prompt here — the Home tab shows a branded popup that routes to
        // Settings. Only wire things up once the user has actually granted it.
        if (!(await Notifications.getPermissionsAsync()).granted) return;
        await ensureAndroidChannel();

        // Recurring daily reminder (works everywhere, incl. Expo Go).
        await scheduleDailyReminder();

        // Remote push token (real devices only) for server-sent notifications.
        const token = await getExpoPushToken();
        if (token) await registerToken({ token, platform: Platform.OS }).unwrap();

        setup.current = true;
      } catch {
        // Best-effort — notifications just won't work this session.
      }
    })();
  }, [isAuthed, registerToken]);

  // Tapping a notification opens the app on Home (the episode is in the feed).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string };
      if (data?.type === 'episode_ready') {
        router.navigate('/(tabs)/home');
      }
    });
    return () => sub.remove();
  }, []);

  return <>{children}</>;
}
