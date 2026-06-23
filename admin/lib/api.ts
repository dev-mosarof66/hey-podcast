import { getToken } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/** API base URL — used to build public feed URLs (e.g. `${API_BASE}/feed/<slug>`). */
export const API_BASE = BASE;

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

export type AdminRole = 'admin' | 'super-admin';

export interface AdminMe {
  email: string;
  role: AdminRole;
  engineEnabled: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  role: AdminRole;
  createdAt: string;
}

export type ClientStatus = 'prospect' | 'contacted' | 'trial' | 'active' | 'churned';

export interface AdminClient {
  id: string;
  name: string;
  company: string | null;
  contactEmail: string | null;
  status: ClientStatus;
  monthlyPrice: number;
  notes: string | null;
  createdAt: string;
}

export interface AdminBriefing {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  prompt: string;
  active: boolean;
  clientId: string | null;
  client: { id: string; name: string } | null;
  episodeCount: number;
  createdAt: string;
}

export interface AdminStats {
  episodes: {
    total: number;
    ready: number;
    generating: number;
    queued: number;
    failed: number;
    shared: number;
  };
  topics: number;
  promoCodes: number;
  redemptions: number;
  users: number;
}

export interface AdminPromoCode {
  id: string;
  code: string;
  trialDays: number;
  disabled: boolean;
  redemptionCount: number;
  redeemedBy: string | null;
  redeemedAt: string | null;
  createdAt: string;
}
