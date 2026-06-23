'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';

import { api, type AdminMe, type AdminRole, type AdminUser } from '@/lib/api';
import { Card, PageHeader, RowSkeleton } from '@/components/ui';

const EMPTY = { email: '', password: '', displayName: '', role: 'admin' as AdminRole };

export default function AdminsPage() {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const m = await api<AdminMe>('/admin/me');
      setMe(m);
      if (m.role !== 'super-admin') {
        setForbidden(true);
        setLoaded(true);
        return;
      }
      setAdmins(await api<AdminUser[]>('/admin/admins'));
    } catch {
      setForbidden(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!form.email.trim() || form.password.length < 8) return;
    setSaving(true);
    try {
      await api('/admin/admins', { method: 'POST', body: JSON.stringify(form) });
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u: AdminUser) => {
    if (!confirm(`Revoke admin access for ${u.email}?`)) return;
    setActing(u.id);
    try {
      await api(`/admin/admins/${u.id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActing(null);
    }
  };

  if (loaded && forbidden) {
    return (
      <Card className="px-6 py-16 text-center">
        <ShieldCheck className="mx-auto text-neutral-600" size={32} />
        <p className="mt-3 text-sm text-neutral-400">
          Only super-admins can manage admin accounts.
        </p>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Admins"
        subtitle="Create and manage who can access this panel."
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white">
            <Plus size={16} /> New admin
          </button>
        }
      />

      {showForm && (
        <Card className="mb-5 space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400">
                Display name
              </label>
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400">
                Password * (min 8 chars)
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand">
                <option value="admin">Admin</option>
                <option value="super-admin">Super-admin</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            If the email already has a user account, it&rsquo;s promoted to the chosen role.
          </p>
          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={saving || !form.email.trim() || form.password.length < 8}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? 'Saving…' : 'Create admin'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800">
              Cancel
            </button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {!loaded ? (
          Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)
        ) : admins.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">No admins yet.</p>
        ) : (
          admins.map((u) => {
            const isSelf = me?.email?.toLowerCase() === u.email.toLowerCase();
            return (
              <div
                key={u.id}
                className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {u.displayName || u.email}
                    {isSelf && <span className="text-neutral-500"> (you)</span>}
                  </div>
                  <div className="truncate text-xs text-neutral-500">{u.email}</div>
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    u.role === 'super-admin'
                      ? 'bg-brand/20 text-brand'
                      : 'bg-neutral-500/15 text-neutral-300'
                  }`}>
                  {u.role}
                </span>

                {u.role !== 'super-admin' && !isSelf && (
                  <button
                    onClick={() => remove(u)}
                    disabled={acting === u.id}
                    className="text-neutral-500 hover:text-red-400 disabled:opacity-40"
                    aria-label="Revoke admin">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </Card>
    </>
  );
}
