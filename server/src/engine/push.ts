import { AppDataSource } from '../data-source';
import { PushToken } from '../entities/PushToken';
import { logger } from '../config/logger';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushPayload {
  title: string;
  body: string;
  /** Extra data delivered to the app (e.g. episodeId) for deep-linking. */
  data?: Record<string, unknown>;
}

/**
 * Send a push to every device a user has registered, via Expo's push service.
 * Best-effort: logs and swallows failures so it never breaks the caller.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    const tokens = await AppDataSource.getRepository(PushToken).find({ where: { userId } });
    if (!tokens.length) return;

    const messages = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.warn({ status: res.status, text: text.slice(0, 200) }, 'push: send failed');
      return;
    }

    // Expo returns per-message tickets; prune tokens it reports as unregistered.
    const json = (await res.json().catch(() => null)) as
      | { data?: { status: string; details?: { error?: string } }[] }
      | null;
    const tickets = json?.data ?? [];
    const dead = tokens.filter(
      (_t, i) => tickets[i]?.details?.error === 'DeviceNotRegistered'
    );
    if (dead.length) {
      await AppDataSource.getRepository(PushToken).remove(dead);
      logger.info({ count: dead.length }, 'push: pruned unregistered tokens');
    }
  } catch (err) {
    logger.warn({ err }, 'push: unexpected send error');
  }
}
