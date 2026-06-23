'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Rss, Sparkles, Trash2 } from 'lucide-react';

import {
  api,
  API_BASE,
  type AdminBriefing,
  type AdminClient,
  type AdminEpisode,
} from '@/lib/api';
import { Card, PageHeader, Spinner, StatusPill, timeAgo } from '@/components/ui';

const EMPTY = { title: '', prompt: '', description: '', clientId: '' };

export default function BriefingsPage() {
  const [briefings, setBriefings] = useState<AdminBriefing[]>([]);
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [eps, setEps] = useState<Record<string, AdminEpisode[]>>({});

  const load = useCallback(async () => {
    const [b, c] = await Promise.all([
      api<AdminBriefing[]>('/admin/briefings').catch(() => [] as AdminBriefing[]),
      api<AdminClient[]>('/admin/clients').catch(() => [] as AdminClient[]),
    ]);
    setBriefings(b);
    setClients(c);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadEps = useCallback(async (id: string) => {
    const list = await api<AdminEpisode[]>(`/admin/briefings/${id}/episodes`).catch(
      () => [] as AdminEpisode[]
    );
    setEps((m) => ({ ...m, [id]: list }));
  }, []);

  const toggle = (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!eps[id]) loadEps(id);
  };

  const create = async () => {
    if (!form.title.trim() || !form.prompt.trim()) return;
    setSaving(true);
    try {
      await api('/admin/briefings', {
        method: 'POST',
        body: JSON.stringify({ ...form, clientId: form.clientId || null }),
      });
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const generate = async (b: AdminBriefing) => {
    setActing(b.id);
    try {
      await api(`/admin/briefings/${b.id}/generate`, { method: 'POST' });
      setExpanded(b.id);
      await loadEps(b.id);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActing(null);
    }
  };

  const remove = async (b: AdminBriefing) => {
    if (!confirm(`Delete briefing "${b.title}"? Its episodes stay but lose the feed.`)) return;
    setActing(b.id);
    try {
      await api(`/admin/briefings/${b.id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActing(null);
    }
  };

  const retry = async (id: string, bid: string) => {
    try {
      await api(`/admin/episodes/${id}/retry`, { method: 'POST' });
      await loadEps(bid);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const feedUrl = (slug: string) => `${API_BASE}/feed/${slug}`;
  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <>
      <PageHeader
        title="Briefings"
        subtitle="Branded daily shows for clients. Generate episodes and hand over the RSS feed."
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white">
            <Plus size={16} /> New briefing
          </button>
        }
      />

      {showForm && (
        <Card className="mb-5 space-y-3 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Acme Fintech Daily"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400">
              Prompt * — what to research each episode
            </label>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={2}
              placeholder="The most important fintech and payments developments in the last 24 hours"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400">Client</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand">
                <option value="">— none —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={saving || !form.title.trim() || !form.prompt.trim()}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? 'Saving…' : 'Create briefing'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800">
              Cancel
            </button>
          </div>
        </Card>
      )}

      {!loaded ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse" />
          ))}
        </div>
      ) : briefings.length === 0 ? (
        <Card className="px-4 py-12 text-center text-sm text-neutral-500">
          No briefings yet. Create one to start a client&rsquo;s branded show.
        </Card>
      ) : (
        <div className="space-y-3">
          {briefings.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{b.title}</span>
                    {!b.active && (
                      <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-[11px] text-neutral-300">
                        paused
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {b.client?.name ?? 'No client'} · {b.episodeCount} episode
                    {b.episodeCount === 1 ? '' : 's'}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{b.prompt}</p>
                </div>
                <button
                  onClick={() => remove(b)}
                  disabled={acting === b.id}
                  className="text-neutral-500 hover:text-red-400 disabled:opacity-40"
                  aria-label="Delete briefing">
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Public feed URL */}
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2">
                <Rss size={14} className="shrink-0 text-brand" />
                <code className="flex-1 truncate text-xs text-neutral-400">{feedUrl(b.slug)}</code>
                <button
                  onClick={() => copy(feedUrl(b.slug), b.id)}
                  className="shrink-0 text-xs text-neutral-400 hover:text-neutral-200">
                  {copied === b.id ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => generate(b)}
                  disabled={acting === b.id}
                  className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                  <Sparkles size={14} />
                  {acting === b.id ? 'Queuing…' : 'Generate episode'}
                </button>
                <button
                  onClick={() => toggle(b.id)}
                  className="flex items-center gap-1 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:bg-neutral-800">
                  {expanded === b.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Episodes
                </button>
              </div>

              {/* Episodes */}
              {expanded === b.id && (
                <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-neutral-500">
                      Episodes
                    </span>
                    <button
                      onClick={() => loadEps(b.id)}
                      className="text-xs text-neutral-400 hover:text-neutral-200">
                      Refresh
                    </button>
                  </div>
                  {!eps[b.id] ? (
                    <div className="py-2">
                      <Spinner size={16} />
                    </div>
                  ) : eps[b.id].length === 0 ? (
                    <div className="text-xs text-neutral-500">No episodes yet — generate one.</div>
                  ) : (
                    eps[b.id].map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-sm">
                        <span className="min-w-0 flex-1 truncate">{e.title}</span>
                        <span className="shrink-0 text-xs text-neutral-500">
                          {timeAgo(e.createdAt)}
                        </span>
                        <StatusPill status={e.status} />
                        {e.audioUrl && (
                          <a
                            href={e.audioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 text-xs text-neutral-400 hover:text-neutral-200">
                            audio
                          </a>
                        )}
                        {e.status === 'failed' && (
                          <button
                            onClick={() => retry(e.id, b.id)}
                            className="shrink-0 text-xs font-semibold text-brand">
                            retry
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
