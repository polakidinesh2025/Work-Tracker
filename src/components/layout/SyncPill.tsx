import { AlertCircle, Check, CloudOff, KeyRound, Loader2, RefreshCw } from 'lucide-react';
import { env } from '../../config/env';
import { timeAgo } from '../../lib/dates';
import { selectSyncStatus, useWorkspaceStore, type SyncStatus } from '../../store/useWorkspaceStore';
import { syncNow } from '../../sync/syncEngine';
import { ICON_BUTTON } from '../ui/styles';

const META: Record<SyncStatus, { label: string; icon: typeof Check; className: string }> = {
  synced: { label: 'Synced', icon: Check, className: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950' },
  saving: { label: 'Saving…', icon: Loader2, className: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950' },
  demo: { label: 'Offline Demo', icon: CloudOff, className: 'text-gray-600 bg-gray-100 dark:text-neutral-300 dark:bg-neutral-800' },
  error: { label: 'Sync error', icon: AlertCircle, className: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950' },
  auth: { label: 'Sign in to sync', icon: KeyRound, className: 'text-amber-800 bg-amber-50 dark:text-amber-200 dark:bg-amber-950' }
};

/** Navbar status pill (Synced | Saving... | Offline Demo) plus the manual Sync Now button. */
export function SyncPill() {
  const status = useWorkspaceStore((s) => selectSyncStatus(s, env.isDemo));
  const pending = useWorkspaceStore((s) => s.outbox.length);
  const syncError = useWorkspaceStore((s) => s.syncError);
  const lastSyncedAt = useWorkspaceStore((s) => s.lastSyncedAt);
  const isRefreshing = useWorkspaceStore((s) => s.isRefreshing);

  const meta = META[status];
  const Icon = meta.icon;
  const title =
    syncError ??
    [
      pending > 0 ? `${pending} change${pending === 1 ? '' : 's'} waiting to save` : '',
      lastSyncedAt ? `Last synced ${timeAgo(lastSyncedAt)}` : ''
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <div className="flex items-center gap-1">
      <span
        title={title}
        aria-live="polite"
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}
      >
        <Icon size={12} className={status === 'saving' ? 'animate-spin' : ''} aria-hidden />
        {/* Icon-only on phones; the full label is still read out by screen readers */}
        <span className="sr-only sm:not-sr-only">{meta.label}</span>
        {status === 'saving' && pending > 1 && <span className="tabular-nums">({pending})</span>}
      </span>
      <button
        type="button"
        onClick={() => void syncNow()}
        title="Sync now"
        aria-label="Sync now"
        // On phones "Sync now" lives in the account menu to keep the navbar uncluttered
        className={`${ICON_BUTTON} hidden sm:inline-flex`}
      >
        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} aria-hidden />
      </button>
    </div>
  );
}
