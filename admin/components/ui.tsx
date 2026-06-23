import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

/** Spinning loader. */
export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-brand ${className}`} />;
}

/** Full-viewport centered loader (e.g. the auth gate). */
export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size={28} />
    </div>
  );
}

/** Page title row with optional subtitle + right-aligned action. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-800 bg-neutral-900 ${className}`}>
      {children}
    </div>
  );
}

const STATUS: Record<string, string> = {
  ready: 'bg-green-500/15 text-green-400',
  generating: 'bg-amber-500/15 text-amber-400',
  queued: 'bg-neutral-500/15 text-neutral-300',
  failed: 'bg-red-500/15 text-red-400',
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        STATUS[status] ?? 'bg-neutral-700 text-neutral-300'
      }`}>
      {status}
    </span>
  );
}

export function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Placeholder for a single list row while data loads. */
export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

/** Placeholder for a stat card while data loads. */
export function StatCardSkeleton() {
  return (
    <Card className="p-4">
      <Skeleton className="h-[18px] w-[18px] rounded" />
      <Skeleton className="mt-3 h-8 w-14" />
      <Skeleton className="mt-2 h-3 w-16" />
    </Card>
  );
}
