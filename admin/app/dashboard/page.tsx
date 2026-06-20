'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type AdminEpisode, type AdminTopic } from '@/lib/api';
import { clearToken, getToken } from '@/lib/auth';

const STATUS_STYLES: Record<string, string> = {
  ready: 'bg-green-500/15 text-green-400',
  generating: 'bg-amber-500/15 text-amber-400',
  queued: 'bg-neutral-500/15 text-neutral-300',
  failed: 'bg-red-500/15 text-red-400',
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [engineEnabled, setEngineEnabled] = useState(true);
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [episodes, setEpisodes] = useState<AdminEpisode[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const loadEpisodes = useCallback(async () => {
    try {
      setEpisodes(await api<AdminEpisode[]>('/admin/episodes'));
    } catch {
      /* ignore transient errors */
    }
  }, []);

  // Auth + initial load.
  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    (async () => {
      try {
        const me = await api<{ email: string; engineEnabled: boolean }>('/admin/me');
        setEmail(me.email);
        setEngineEnabled(me.engineEnabled);
        setTopics(await api<AdminTopic[]>('/admin/topics'));
        await loadEpisodes();
        setReady(true);
      } catch {
        clearToken();
        router.replace('/login');
      }
    })();
  }, [router, loadEpisodes]);

  // Poll while anything is generating.
  useEffect(() => {
    if (!episodes.some((e) => e.status === 'generating' || e.status === 'queued')) return;
    const t = setInterval(loadEpisodes, 4000);
    return () => clearInterval(t);
  }, [episodes, loadEpisodes]);

  const generate = async (topic: AdminTopic) => {
    setBusy(topic.id);
    try {
      await api(`/admin/topics/${topic.id}/generate`, { method: 'POST' });
      await loadEpisodes();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const runBatch = async () => {
    if (!confirm('Generate a pod for EVERY topic? This can be a lot of generation.')) return;
    setBusy('batch');
    try {
      await api('/admin/global-run', { method: 'POST' });
      await loadEpisodes();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this episode?')) return;
    try {
      await api(`/admin/episodes/${id}`, { method: 'DELETE' });
      await loadEpisodes();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const logout = () => {
    clearToken();
    router.replace('/login');
  };

  if (!ready) return <div className="p-8 text-neutral-400">Loading…</div>;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hey Podcast Admin</h1>
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <span>{email}</span>
          <button onClick={logout} className="rounded-md border border-neutral-700 px-3 py-1.5 hover:bg-neutral-800">
            Log out
          </button>
        </div>
      </div>

      {!engineEnabled && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Generation engine is <strong>disabled</strong> on the server (missing GEMINI/DEEPGRAM keys).
          Generating will fail until those are set.
        </div>
      )}

      {/* Generate pods */}
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Generate a global pod
          </h2>
          <button
            onClick={runBatch}
            disabled={busy === 'batch'}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-50">
            {busy === 'batch' ? 'Queuing…' : 'Run all topics'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => generate(t)}
              disabled={busy === t.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-left hover:border-brand disabled:opacity-50">
              <div className="text-sm font-semibold">{t.label}</div>
              <div className="mt-1 text-xs text-brand">
                {busy === t.id ? 'Queuing…' : '+ Generate pod'}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent episodes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Recent global episodes
          </h2>
          <button onClick={loadEpisodes} className="text-xs text-neutral-400 hover:text-neutral-200">
            Refresh
          </button>
        </div>

        {episodes.length === 0 ? (
          <p className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-8 text-center text-sm text-neutral-500">
            No global episodes yet. Generate one above.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-800">
            {episodes.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 border-b border-neutral-800 bg-neutral-900 px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{e.title}</div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {e.topic?.label ?? '—'} · {timeAgo(e.createdAt)}
                    {e.durationSec ? ` · ${Math.round(e.durationSec / 60)} min` : ''}
                  </div>
                </div>

                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[e.status] ?? ''}`}>
                  {e.status}
                </span>

                {e.audioUrl && (
                  <a
                    href={e.audioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-neutral-400 hover:text-neutral-200">
                    audio
                  </a>
                )}

                <button
                  onClick={() => remove(e.id)}
                  className="text-xs text-red-400 hover:text-red-300">
                  delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
