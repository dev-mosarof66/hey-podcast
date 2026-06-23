'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ListMusic,
  Sparkles,
  Ticket,
  Building2,
  Rss,
  ShieldCheck,
  LogOut,
  X,
} from 'lucide-react';

import { clearToken } from '@/lib/auth';
import type { AdminRole } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Building2 },
  { href: '/briefings', label: 'Briefings', icon: Rss },
  { href: '/episodes', label: 'Episodes', icon: ListMusic },
  { href: '/generate', label: 'Generate', icon: Sparkles },
  { href: '/promo', label: 'Promo codes', icon: Ticket },
  // Super-admin only.
  { href: '/admins', label: 'Admins', icon: ShieldCheck, superAdmin: true },
];

export function Sidebar({
  email,
  role,
  onClose,
}: {
  email?: string;
  role?: AdminRole;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const nav = NAV.filter((n) => !n.superAdmin || role === 'super-admin');

  const logout = () => {
    clearToken();
    router.replace('/login');
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-neutral-800 bg-neutral-900">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
            H
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">Hey Podcast</div>
            <div className="text-[11px] text-neutral-500">Admin panel</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-neutral-400 md:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((n) => {
          const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-brand/15 text-white'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
              }`}>
              <Icon size={18} className={active ? 'text-brand' : ''} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      {/* Account */}
      <div className="border-t border-neutral-800 p-3">
        {email && <div className="truncate px-2 pb-2 text-xs text-neutral-500">{email}</div>}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-400 transition hover:bg-neutral-800 hover:text-red-400">
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </div>
  );
}
