import { CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { matchesQuery } from '../../hooks/useFilteredTasks';
import { STATUS_META } from '../../lib/taskMeta';
import { useUiStore } from '../../store/useUiStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { Task } from '../../types/models';
import { PriorityBadge } from '../ui/PriorityBadge';
import { Sheet } from '../ui/Sheet';

const MAX_RESULTS = 8;

/** Ctrl/Cmd+K: jump to any task by title or description. */
export function CommandPalette() {
  const isOpen = useUiStore((s) => s.isSearchOpen);
  if (!isOpen) return null;
  return <PaletteDialog />;
}

function PaletteDialog() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const tasks = useWorkspaceStore((s) => s.tasks);
  const { setSearchOpen, openTask, clearFilters, setView } = useUiStore.getState();

  useEffect(() => inputRef.current?.focus(), []);

  const results = useMemo(() => {
    const matches = tasks.filter((t) => matchesQuery(t, query));
    // Open work first, most recently updated first
    matches.sort((a, b) => Number(a.status === 'Done') - Number(b.status === 'Done') || b.updatedAt.localeCompare(a.updatedAt));
    return matches.slice(0, MAX_RESULTS);
  }, [tasks, query]);

  const choose = (task: Task | undefined) => {
    if (!task) return;
    clearFilters(); // make sure the chosen card is visible on the board
    setView('board');
    openTask(task.id);
  };

  return (
    <Sheet onClose={() => setSearchOpen(false)} label="Search tasks" maxWidth="sm:max-w-lg">
        <div className="flex items-center gap-2 border-b border-gray-200 px-3 dark:border-neutral-800">
          <Search size={16} className="text-gray-400" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                choose(results[active]);
              }
            }}
            placeholder="Search tasks…"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          <kbd className="rounded border border-gray-200 px-1.5 text-[10px] text-gray-400 touch:hidden dark:border-neutral-700">Esc</kbd>
          {/* No Esc key on phones */}
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="hidden h-10 shrink-0 px-1 text-sm font-medium text-indigo-600 touch:inline-flex touch:items-center dark:text-indigo-400"
          >
            Cancel
          </button>
        </div>

        <ul id="palette-results" role="listbox" className="max-h-[min(20rem,50dvh)] overflow-y-auto py-1">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-500">No matching tasks</li>}
          {results.map((task, i) => (
            <li
              key={task.id}
              id={`palette-${task.id}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(task)}
              className={`flex cursor-pointer items-center gap-2.5 px-3 py-3 text-sm sm:py-2 ${
                i === active ? 'bg-gray-100 dark:bg-neutral-800' : ''
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_META[task.status]?.dot ?? ''}`} title={task.status} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{task.title}</span>
              <span className="text-xs text-gray-400">{task.status}</span>
              <PriorityBadge priority={task.priority} />
              {i === active && <CornerDownLeft size={13} className="text-gray-400" aria-hidden />}
            </li>
          ))}
        </ul>
    </Sheet>
  );
}
