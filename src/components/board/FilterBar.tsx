import { Search, X } from 'lucide-react';
import { SEARCH_INPUT_ID } from '../../hooks/useHotkeys';
import { useMembers } from '../../hooks/useMembers';
import { isTouchDevice } from '../../lib/device';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { PRIORITIES, type Priority } from '../../types/models';
import { Avatar } from '../ui/Avatar';

const pill = (active: boolean) =>
  `inline-flex h-9 items-center rounded-full px-3 text-xs font-medium transition-colors sm:h-auto sm:px-2.5 sm:py-1 ${
    active
      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
      : 'text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
  }`;

/** One-click teammate pills, priority filter and live search for the board. */
export function FilterBar() {
  const { members } = useMembers();
  const myEmail = useAuthStore((s) => s.user?.email);
  const assignee = useUiStore((s) => s.assigneeFilter);
  const priority = useUiStore((s) => s.priorityFilter);
  const query = useUiStore((s) => s.query);
  const { setAssigneeFilter, setPriorityFilter, setQuery } = useUiStore.getState();
  const teammates = members.filter((m) => m.email !== myEmail);

  return (
    <div className="flex flex-col gap-1.5 border-b border-gray-200 px-3 py-2 sm:flex-row sm:items-center sm:gap-2 sm:px-4 dark:border-neutral-800">
      {/* Phones: one row you can swipe sideways instead of wrapping into several */}
      <div className="no-scrollbar -mx-3 flex items-center gap-2 overflow-x-auto px-3 py-0.5 sm:mx-0 sm:overflow-visible sm:p-0">
      <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Filter by assignee">
        <button type="button" className={pill(assignee === 'all')} onClick={() => setAssigneeFilter('all')}>
          All
        </button>
        <button type="button" className={`${pill(assignee === 'me')} whitespace-nowrap`} onClick={() => setAssigneeFilter('me')}>
          My Tasks
        </button>
        <div className="ml-1 flex items-center gap-0.5 sm:gap-0 sm:-space-x-1">
          {teammates.map((m) => {
            const active = assignee === m.email;
            return (
              <button
                key={m.email}
                type="button"
                aria-pressed={active}
                title={`${m.name}'s tasks`}
                onClick={() => setAssigneeFilter(active ? 'all' : m.email)}
                className={`rounded-full ring-2 transition-transform hover:z-10 hover:-translate-y-0.5 ${
                  active ? 'z-10 ring-indigo-500' : 'ring-white dark:ring-neutral-950'
                }`}
              >
                <Avatar name={m.name} email={m.email} src={m.avatarUrl} size="responsive" />
              </button>
            );
          })}
        </div>
      </div>

      <select
        value={priority}
        onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
        aria-label="Filter by priority"
        className="h-9 shrink-0 rounded-md border border-gray-200 bg-transparent px-2 text-xs text-gray-700 outline-none focus:border-gray-400 sm:h-auto sm:py-1 dark:border-neutral-800 dark:text-neutral-300"
      >
        <option value="all">Any priority</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      </div>

      <label className="flex w-full items-center gap-1.5 rounded-md border border-gray-200 px-2 py-2 focus-within:border-gray-400 sm:ml-auto sm:w-56 sm:py-1 dark:border-neutral-800 dark:focus-within:border-neutral-600">
        <Search size={13} className="text-gray-400" aria-hidden />
        <input
          id={SEARCH_INPUT_ID}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery('');
              e.currentTarget.blur();
            }
          }}
          placeholder={isTouchDevice() ? 'Filter tasks…' : 'Filter tasks…  ( / )'}
          aria-label="Filter tasks"
          className="w-full bg-transparent text-xs outline-none placeholder:text-gray-400"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-gray-400 hover:text-gray-700">
            <X size={12} aria-hidden />
          </button>
        )}
      </label>
    </div>
  );
}
