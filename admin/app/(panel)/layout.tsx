'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';

import { Sidebar } from '@/components/Sidebar';
import { FullPageLoader } from '@/components/ui';
import { api, type AdminMe, type AdminRole } from '@/lib/api';
import { clearToken, getToken } from '@/lib/auth';

export default function PanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('admin');
  const [open, setOpen] = useState(false);

  // Single auth gate for every panel page.
  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    (async () => {
      try {
        const me = await api<AdminMe>('/admin/me');
        setEmail(me.email);
        setRole(me.role);
        setReady(true);
      } catch {
        clearToken();
        router.replace('/login');
      }
    })();
  }, [router]);

  if (!ready) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen">
      {/* Fixed sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden md:block">
        <Sidebar email={email} role={role} />
      </aside>

      {/* Drawer (mobile) */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0">
            <Sidebar email={email} role={role} onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="md:pl-64">
        <header className="flex items-center gap-3 border-b border-neutral-800 bg-neutral-900 px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} className="text-neutral-300" aria-label="Open menu">
            <Menu size={22} />
          </button>
          <span className="font-bold">Hey Podcast Admin</span>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-7 md:px-8">{children}</main>
      </div>
    </div>
  );
}
