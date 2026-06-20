'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type AdminPromoCode } from '@/lib/api';
import { clearToken, getToken } from '@/lib/auth';

export default function PromoPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<AdminPromoCode[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCodes(await api<AdminPromoCode[]>('/admin/promo-codes'));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    (async () => {
      try {
        await api('/admin/me');
        await load();
        setReady(true);
      } catch {
        clearToken();
        router.replace('/login');
      }
    })();
  }, [router, load]);

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

  const [acting, setActing] = useState<string | null>(null);

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

  if (!ready) return <div className="p-8 text-neutral-400">Loading…</div>;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promo codes</h1>
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Dashboard
        </Link>
      </div>

      {/* Generate */}
      <section className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-semibold">Generate a 7-day free-trial code</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Each code is one-time use. Share it with a user to unlock a 7-day premium trial.
        </p>
        <button
          onClick={generate}
          disabled={busy}
          className="mt-4 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? 'Generating…' : 'Generate code'}
        </button>

        {latest && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-brand/40 bg-brand/10 px-4 py-3">
            <code className="flex-1 text-lg font-bold tracking-widest">{latest}</code>
            <button
              onClick={() => copy(latest)}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs hover:bg-neutral-800">
              {copied === latest ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </section>

      {/* List */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            All codes ({codes.length})
          </h2>
          <button onClick={load} className="text-xs text-neutral-400 hover:text-neutral-200">
            Refresh
          </button>
        </div>

        {codes.length === 0 ? (
          <p className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-8 text-center text-sm text-neutral-500">
            No codes yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-800">
            {codes.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 border-b border-neutral-800 bg-neutral-900 px-4 py-3 last:border-b-0">
                <code
                  className={`flex-1 font-bold tracking-widest ${
                    c.redeemed || c.disabled ? 'text-neutral-500 line-through' : ''
                  }`}>
                  {c.code}
                </code>
                <span className="text-xs text-neutral-500">{c.trialDays}-day</span>

                {/* Status badge */}
                {c.redeemed ? (
                  <span className="rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs text-neutral-400">
                    used
                  </span>
                ) : c.disabled ? (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                    disabled
                  </span>
                ) : (
                  <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400">
                    available
                  </span>
                )}

                {/* Actions */}
                {!c.redeemed && !c.disabled && (
                  <button
                    onClick={() => copy(c.code)}
                    className="text-xs text-neutral-400 hover:text-neutral-200">
                    {copied === c.code ? 'copied' : 'copy'}
                  </button>
                )}
                {!c.redeemed && (
                  <button
                    onClick={() => toggleDisabled(c)}
                    disabled={acting === c.id}
                    className="text-xs text-amber-400/80 hover:text-amber-300 disabled:opacity-40">
                    {c.disabled ? 'enable' : 'disable'}
                  </button>
                )}
                <button
                  onClick={() => remove(c)}
                  disabled={acting === c.id}
                  className="text-xs text-red-400/80 hover:text-red-300 disabled:opacity-40">
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
