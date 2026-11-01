import { googleLogout } from '@react-oauth/google';
import { LogOut, RefreshCw, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { env } from '../../config/env';
import { resetDemoData } from '../../services/demoBackend';
import { useAuthStore } from '../../store/useAuthStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { refresh, syncNow } from '../../sync/syncEngine';
import { Avatar } from '../ui/Avatar';

function signOut() {
  const pending = useWorkspaceStore.getState().outbox.length;
  if (pending > 0 && !window.confirm(`${pending} change(s) haven't synced yet and will be lost. Sign out anyway?`)) {
    return;
  }
  googleLogout();
  useWorkspaceStore.getState().resetCache();
  useAuthStore.getState().signOut();
}

function resetDemo() {
  if (!window.confirm('Reset the demo board to its sample data?')) return;
  resetDemoData();
  useWorkspaceStore.getState().resetCache();
  void refresh();
}

const item =
  'flex w-full items-center gap-2.5 px-3 py-3 text-left text-sm hover:bg-gray-50 sm:py-2 dark:hover:bg-neutral-800';

/** Avatar button with account actions: Sync now, and Sign out (or Reset demo data). */
export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${user.name}`}
        className="flex h-10 w-10 items-center justify-center rounded-full sm:h-7 sm:w-7"
      >
        <Avatar name={user.name} email={user.email} src={user.picture} size="sm" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="border-b border-gray-200 px-3 py-2 dark:border-neutral-800">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-gray-500 dark:text-neutral-400">{env.isDemo ? 'Local Demo Mode' : user.email}</p>
          </div>
          <button type="button" role="menuitem" className={item} onClick={run(() => void syncNow())}>
            <RefreshCw size={15} aria-hidden /> Sync now
          </button>
          {env.isDemo ? (
            <button type="button" role="menuitem" className={item} onClick={run(resetDemo)}>
              <RotateCcw size={15} aria-hidden /> Reset demo data
            </button>
          ) : (
            <button type="button" role="menuitem" className={`${item} text-red-600 dark:text-red-400`} onClick={run(signOut)}>
              <LogOut size={15} aria-hidden /> Sign out
            </button>
          )}
        </div>
      )}
    </div>
  );
}
