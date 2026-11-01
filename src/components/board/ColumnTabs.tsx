import { useEffect, useState, type RefObject } from 'react';
import { STATUS_META } from '../../lib/taskMeta';
import { STATUSES, type TaskStatus } from '../../types/models';
import { columnDomId } from './Column';

interface ColumnTabsProps {
  counts: Record<TaskStatus, number>;
  scrollerRef: RefObject<HTMLDivElement>;
}

/**
 * Phone/tablet strip of column shortcuts (hidden once all columns fit on screen).
 * Tapping one scrolls the board to that column; the visible column is highlighted.
 */
export function ColumnTabs({ counts, scrollerRef }: ColumnTabsProps) {
  const [active, setActive] = useState<TaskStatus>('Backlog');

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const status = best?.target.getAttribute('data-status') as TaskStatus | null;
        if (status) setActive(status);
      },
      { root: scroller, threshold: [0.6, 0.9] }
    );
    STATUSES.forEach((s) => {
      const el = document.getElementById(columnDomId(s));
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [scrollerRef]);

  const jumpTo = (status: TaskStatus) => {
    setActive(status);
    document.getElementById(columnDomId(status))?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <nav aria-label="Jump to column" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-gray-200 px-3 py-2 lg:hidden dark:border-neutral-800">
      {STATUSES.map((status) => {
        const isActive = status === active;
        return (
          <button
            key={status}
            type="button"
            aria-current={isActive || undefined}
            onClick={() => jumpTo(status)}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[status].dot}`} aria-hidden />
            {status}
            <span className={`tabular-nums ${isActive ? 'opacity-70' : 'text-gray-400'}`}>{counts[status]}</span>
          </button>
        );
      })}
    </nav>
  );
}
