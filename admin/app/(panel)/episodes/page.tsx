'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { api, type AdminEpisode } from '@/lib/api';
import { Card, PageHeader, RowSkeleton, StatusPill, timeAgo } from '@/components/ui';

const FILTERS = ['all', 'ready', 'generating', 'failed'] as const;

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<AdminEpisode[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setEpisodes(await api<AdminEpisode[]>('/admin/episodes').catch(() => [] as AdminEpisode[]));
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!episodes.some((e) => e.status === 'generating' || e.status === 'queued')) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [episodes, load]);

  const retry = async (id: string) => {
    setBusy(id);
    try {
      await api(`/admin/episodes/${id}/retry`, { method: 'POST' });
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this episode?')) return;
    setBusy(id);
    try {
      await api(`/admin/episodes/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const shown = filter === 'all' ? episodes : episodes.filter((e) => e.status === filter);

  return (
    <>
      <PageHeader
        title="Episodes"
        subtitle="Monitor and manage global episodes."
        action={
          <button
            onClick={load}
            className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800">
            Refresh
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              filter === f
                ? 'bg-brand text-white'
                : 'border border-neutral-700 text-neutral-400 hover:bg-neutral-800'
            }`}>
            {f}
            {f !== 'all' && ` (${episodes.filter((e) => e.status === f).length})`}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {!loaded ? (
          Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
        ) : shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">
            No episodes.{' '}
            <Link href="/generate" className="text-brand">
              Generate one →
            </Link>
          </p>
        ) : (
          shown.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{e.title}</div>
                <div className="mt-0.5 text-xs text-neutral-500">
                  {e.topic?.label ?? '—'} · {timeAgo(e.createdAt)}
                  {e.durationSec ? ` · ${Math.round(e.durationSec / 60)} min` : ''}
                </div>
              </div>

              <StatusPill status={e.status} />

              {e.audioUrl && (
                <a
                  href={e.audioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-neutral-400 hover:text-neutral-200">
                  audio
                </a>
              )}
              {e.status === 'failed' && (
                <button
                  onClick={() => retry(e.id)}
                  disabled={busy === e.id}
                  className="text-xs font-semibold text-brand hover:opacity-80 disabled:opacity-40">
                  {busy === e.id ? '…' : 'retry'}
                </button>
              )}
              <button
                onClick={() => remove(e.id)}
                disabled={busy === e.id}
                className="text-xs text-red-400/80 hover:text-red-300 disabled:opacity-40">
                delete
              </button>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
