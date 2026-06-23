'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Hash, Loader2, Radio, Ticket, Users, XCircle } from 'lucide-react';

import { api, type AdminEpisode, type AdminStats } from '@/lib/api';
import { Card, PageHeader, RowSkeleton, StatCardSkeleton, StatusPill, timeAgo } from '@/components/ui';

export default function OverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [episodes, setEpisodes] = useState<AdminEpisode[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [s, e] = await Promise.all([
      api<AdminStats>('/admin/stats').catch(() => null),
      api<AdminEpisode[]>('/admin/episodes').catch(() => [] as AdminEpisode[]),
    ]);
    if (s) setStats(s);
    setEpisodes(e.slice(0, 6));
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live-refresh while anything is in flight.
  useEffect(() => {
    if (!episodes.some((e) => e.status === 'generating' || e.status === 'queued')) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [episodes, load]);

  const runBatch = async () => {
    setBusy(true);
    try {
      await api('/admin/global-run', { method: 'POST' });
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cards = [
    { label: 'Episodes', value: stats?.episodes.total, icon: Radio, color: 'text-brand' },
    { label: 'Ready', value: stats?.episodes.ready, icon: CheckCircle2, color: 'text-green-400' },
    {
      label: 'In progress',
      value:
        stats == null ? undefined : stats.episodes.generating + stats.episodes.queued,
      icon: Loader2,
      color: 'text-amber-400',
    },
    { label: 'Failed', value: stats?.episodes.failed, icon: XCircle, color: 'text-red-400' },
    { label: 'Topics', value: stats?.topics, icon: Hash, color: 'text-sky-400' },
    { label: 'Users', value: stats?.users, icon: Users, color: 'text-indigo-400' },
    {
      label: 'Promo redemptions',
      value: stats?.redemptions,
      icon: Ticket,
      color: 'text-purple-400',
    },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Generation health at a glance."
        action={
          <button
            onClick={runBatch}
            disabled={busy}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? 'Queuing…' : 'Run daily batch'}
          </button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {!stats
          ? Array.from({ length: cards.length }).map((_, i) => <StatCardSkeleton key={i} />)
          : cards.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.label} className="p-4">
                  <Icon size={18} className={c.color} />
                  <div className="mt-3 text-2xl font-bold">{c.value ?? '—'}</div>
                  <div className="text-xs text-neutral-500">{c.label}</div>
                </Card>
              );
            })}
      </div>

      {/* Recent episodes */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Recent episodes
        </h2>
        <Link href="/episodes" className="text-xs text-neutral-400 hover:text-neutral-200">
          View all →
        </Link>
      </div>
      <Card className="overflow-hidden">
        {!loaded ? (
          Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
        ) : episodes.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">
            No episodes yet.{' '}
            <Link href="/generate" className="text-brand">
              Generate one →
            </Link>
          </p>
        ) : (
          episodes.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{e.title}</div>
                <div className="mt-0.5 text-xs text-neutral-500">
                  {e.topic?.label ?? '—'} · {timeAgo(e.createdAt)}
                </div>
              </div>
              <StatusPill status={e.status} />
            </div>
          ))
        )}
      </Card>
    </>
  );
}
