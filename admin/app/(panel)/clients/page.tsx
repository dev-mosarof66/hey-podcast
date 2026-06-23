'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { api, type AdminClient, type ClientStatus } from '@/lib/api';
import { Card, PageHeader, RowSkeleton } from '@/components/ui';

const STATUSES: ClientStatus[] = ['prospect', 'contacted', 'trial', 'active', 'churned'];

const STATUS_STYLE: Record<ClientStatus, string> = {
  prospect: 'bg-neutral-500/15 text-neutral-300',
  contacted: 'bg-sky-500/15 text-sky-400',
  trial: 'bg-amber-500/15 text-amber-400',
  active: 'bg-green-500/15 text-green-400',
  churned: 'bg-red-500/15 text-red-400',
};

const EMPTY = { name: '', company: '', contactEmail: '', status: 'prospect' as ClientStatus, monthlyPrice: '', notes: '' };

export default function ClientsPage() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setClients(await api<AdminClient[]>('/admin/clients').catch(() => [] as AdminClient[]));
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api('/admin/clients', {
        method: 'POST',
        body: JSON.stringify({ ...form, monthlyPrice: Number(form.monthlyPrice) || 0 }),
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

  const setStatus = async (c: AdminClient, status: ClientStatus) => {
    setActing(c.id);
    try {
      await api(`/admin/clients/${c.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActing(null);
    }
  };

  const remove = async (c: AdminClient) => {
    if (!confirm(`Delete ${c.name}? This also removes their briefings.`)) return;
    setActing(c.id);
    try {
      await api(`/admin/clients/${c.id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActing(null);
    }
  };

  const mrr = clients
    .filter((c) => c.status === 'active' || c.status === 'trial')
    .reduce((s, c) => s + (c.monthlyPrice || 0), 0);

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Your B2B pipeline — prospects, trials, and paying accounts."
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white">
            <Plus size={16} /> Add client
          </button>
        }
      />

      {/* Pipeline summary */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map((s) => (
          <Card key={s} className="p-3">
            <div className="text-xl font-bold">{clients.filter((c) => c.status === s).length}</div>
            <div className="text-xs capitalize text-neutral-500">{s}</div>
          </Card>
        ))}
        <Card className="border-brand/40 bg-brand/10 p-3">
          <div className="text-xl font-bold">${mrr.toLocaleString()}</div>
          <div className="text-xs text-neutral-400">MRR (trial+active)</div>
        </Card>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="mb-5 space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Field label="Contact email" value={form.contactEmail} onChange={(v) => setForm({ ...form, contactEmail: v })} />
            <Field label="Monthly price ($)" value={form.monthlyPrice} onChange={(v) => setForm({ ...form, monthlyPrice: v })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={saving || !form.name.trim()}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? 'Saving…' : 'Save client'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800">
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* List */}
      <Card className="overflow-hidden">
        {!loaded ? (
          Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
        ) : clients.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">
            No clients yet. Add your first prospect.
          </p>
        ) : (
          clients.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {c.name}
                  {c.company ? <span className="text-neutral-500"> · {c.company}</span> : null}
                </div>
                <div className="mt-0.5 truncate text-xs text-neutral-500">
                  {c.contactEmail || 'no contact'}
                  {c.monthlyPrice ? ` · $${c.monthlyPrice}/mo` : ''}
                </div>
              </div>

              <select
                value={c.status}
                disabled={acting === c.id}
                onChange={(e) => setStatus(c, e.target.value as ClientStatus)}
                className={`rounded-full px-2 py-1 text-xs font-semibold capitalize outline-none ${STATUS_STYLE[c.status]}`}>
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-neutral-900 text-neutral-100">
                    {s}
                  </option>
                ))}
              </select>

              <button
                onClick={() => remove(c)}
                disabled={acting === c.id}
                className="text-neutral-500 hover:text-red-400 disabled:opacity-40"
                aria-label="Delete client">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </Card>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}
