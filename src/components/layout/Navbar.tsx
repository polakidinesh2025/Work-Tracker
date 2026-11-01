import { Search } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { ICON_BUTTON } from '../ui/styles';
import { MentionsBell } from './MentionsBell';
import { SyncPill } from './SyncPill';
import { UserMenu } from './UserMenu';
import { ViewToggle } from './ViewToggle';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function Navbar() {
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="flex h-14 items-center gap-1.5 px-3 sm:h-12 sm:gap-3 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-900 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
            T
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">TaskLite</span>
        </div>

        <ViewToggle />

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="ml-auto hidden items-center gap-2 rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700 md:inline-flex dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700"
        >
          <Search size={13} aria-hidden />
          Search tasks
          <kbd className="rounded border border-gray-200 px-1 font-sans text-[10px] touch:hidden dark:border-neutral-700">
            {isMac ? '⌘' : 'Ctrl'} K
          </kbd>
        </button>
        <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search tasks" className={`ml-auto md:hidden ${ICON_BUTTON}`}>
          <Search size={17} aria-hidden />
        </button>

        <MentionsBell />
        <SyncPill />
        <UserMenu />
      </div>
    </header>
  );
}
