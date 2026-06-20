import { getToken } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/** Fetch the Hey Podcast API with the admin token attached; throws on non-2xx. */
export async function api<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    const err = new Error(body.message ?? `Request failed (${res.status})`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────────────
export interface AdminTopic {
  id: string;
  slug: string;
  label: string;
}

export interface AdminEpisode {
  id: string;
  title: string;
  summary: string | null;
  audioUrl: string | null;
  durationSec: number | null;
  status: 'queued' | 'generating' | 'ready' | 'failed';
  createdAt: string;
  topic: { id: string; label: string } | null;
}

export interface AdminPromoCode {
  id: string;
  code: string;
  trialDays: number;
  redeemed: boolean;
  disabled: boolean;
  redeemedBy: string | null;
  redeemedAt: string | null;
  createdAt: string;
}
