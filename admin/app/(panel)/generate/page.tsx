'use client';

import { useEffect, useState } from 'react';

import { api, type AdminTopic } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';

export default function GeneratePage() {
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [engineEnabled, setEngineEnabled] = useState(true);
  const [queued, setQueued] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api<{ engineEnabled: boolean }>('/admin/me');
        setEngineEnabled(me.engineEnabled);
      } catch {
        /* ignore */
      }
      setTopics(await api<AdminTopic[]>('/admin/topics').catch(() => [] as AdminTopic[]));
      setLoaded(true);
    })();
  }, []);

  const generate = async (t: AdminTopic) => {
    setBusy(t.id);
    setQueued(null);
    try {
      await api(`/admin/topics/${t.id}/generate`, { method: 'POST' });
      setQueued(t.label);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const runBatch = async () => {
    if (
      !confirm(
        "Run today's global batch (2 rotating topics)? No-op if it already ran today."
      )
    )
      return;
    setBusy('batch');
    try {
      await api('/admin/global-run', { method: 'POST' });
      setQueued('daily batch');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Generate"
        subtitle="Fire a shared global pod for any topic. Watch progress under Episodes."
        action={
          <button
            onClick={runBatch}
            disabled={busy === 'batch'}
            className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50">
            {busy === 'batch' ? 'Queuing…' : 'Run daily batch (2)'}
          </button>
        }
      />

      {!engineEnabled && (
        <Card className="mb-5 border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Generation engine is <strong>disabled</strong> on the server (missing GEMINI/DEEPGRAM
          keys). Generating will fail until those are set.
        </Card>
      )}

      {queued && (
        <div className="mb-5 rounded-lg border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-neutral-200">
          Queued <strong>{queued}</strong>. Track it on the{' '}
          <a href="/episodes" className="text-brand underline">
            Episodes
          </a>{' '}
          page.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {!loaded
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            ))
          : topics.map((t) => (
              <button
                key={t.id}
                onClick={() => generate(t)}
                disabled={busy === t.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-left transition hover:border-brand disabled:opacity-50">
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="mt-1 text-xs text-brand">
                  {busy === t.id ? 'Queuing…' : '+ Generate pod'}
                </div>
              </button>
            ))}
      </div>
    </>
  );
}
