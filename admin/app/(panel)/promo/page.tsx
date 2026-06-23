'use client';

import { useCallback, useEffect, useState } from 'react';

import { api, type AdminPromoCode } from '@/lib/api';
import { Card, PageHeader, RowSkeleton } from '@/components/ui';

export default function PromoPage() {
  const [codes, setCodes] = useState<AdminPromoCode[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [latest, setLatest] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setCodes(await api<AdminPromoCode[]>('/admin/promo-codes').catch(() => [] as AdminPromoCode[]));
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    setBusy(true);
    try {
      const c = await api<AdminPromoCode>('/admin/promo-codes', { method: 'POST' });
      setLatest(c.code);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const toggleDisabled = async (c: AdminPromoCode) => {
    setActing(c.id);
    try {
      await api(`/admin/promo-codes/${c.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ disabled: !c.disabled }),
      });
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActing(null);
    }
  };

  const remove = async (c: AdminPromoCode) => {
    if (!confirm(`Delete code ${c.code}? This cannot be undone.`)) return;
    setActing(c.id);
    try {
      await api(`/admin/promo-codes/${c.id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActing(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Promo codes"
        subtitle="Reusable codes that unlock a 7-day premium trial until you disable them."
        action={
          <button
            onClick={generate}
            disabled={busy}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? 'Generating…' : 'Generate code'}
          </button>
        }
      />

      {latest && (
        <Card className="mb-6 flex items-center gap-3 border-brand/40 bg-brand/10 px-4 py-3">
          <code className="flex-1 text-lg font-bold tracking-widest">{latest}</code>
          <button
            onClick={() => copy(latest)}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs hover:bg-neutral-800">
            {copied === latest ? 'Copied!' : 'Copy'}
          </button>
        </Card>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          All codes ({codes.length})
        </h2>
        <button onClick={load} className="text-xs text-neutral-400 hover:text-neutral-200">
          Refresh
        </button>
      </div>

      {!loaded ? (
        <Card className="overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </Card>
      ) : codes.length === 0 ? (
        <Card className="px-4 py-10 text-center text-sm text-neutral-500">No codes yet.</Card>
      ) : (
        <Card className="overflow-hidden">
          {codes.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3 last:border-b-0">
              <code
                className={`flex-1 font-bold tracking-widest ${
                  c.disabled ? 'text-neutral-500 line-through' : ''
                }`}>
                {c.code}
              </code>
              <span className="text-xs text-neutral-500">{c.trialDays}-day</span>
              <span className="text-xs text-neutral-500">{c.redemptionCount} uses</span>

              {c.disabled ? (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                  disabled
                </span>
              ) : (
                <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400">
                  active
                </span>
              )}

              {!c.disabled && (
                <button
                  onClick={() => copy(c.code)}
                  className="text-xs text-neutral-400 hover:text-neutral-200">
                  {copied === c.code ? 'copied' : 'copy'}
                </button>
              )}
              <button
                onClick={() => toggleDisabled(c)}
                disabled={acting === c.id}
                className="text-xs text-amber-400/80 hover:text-amber-300 disabled:opacity-40">
                {c.disabled ? 'enable' : 'disable'}
              </button>
              <button
                onClick={() => remove(c)}
                disabled={acting === c.id}
                className="text-xs text-red-400/80 hover:text-red-300 disabled:opacity-40">
                delete
              </button>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
