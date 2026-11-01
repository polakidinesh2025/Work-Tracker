import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { TaskStatus } from '../../types/models';

/**
 * Inline "type a title, press Enter" task creation. Focus stays in the input so
 * several tasks can be added in a row. New tasks inherit the active assignee and
 * priority filters so they stay visible.
 */
export function QuickAdd({ status }: { status: TaskStatus }) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useWorkspaceStore((s) => s.createTask);
  const focusRequest = useUiStore((s) => s.quickAddFocus);

  useEffect(() => {
    if (focusRequest !== status) return;
    inputRef.current?.focus();
    useUiStore.getState().setQuickAddFocus(null);
  }, [focusRequest, status]);

  const submit = () => {
    const clean = title.trim();
    if (!clean) return;
    const { assigneeFilter, priorityFilter } = useUiStore.getState();
    const me = useAuthStore.getState().user?.email ?? '';
    createTask({
      title: clean,
      status,
      assigneeEmail: assigneeFilter === 'all' ? me : assigneeFilter === 'me' ? me : assigneeFilter,
      ...(priorityFilter !== 'all' && { priority: priorityFilter })
    });
    setTitle('');
  };

  return (
    <label className="mb-2 flex items-center gap-1.5 rounded-md px-2 py-2.5 text-gray-400 sm:py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-300 hover:bg-white/60 dark:focus-within:bg-neutral-900 dark:focus-within:ring-neutral-700 dark:hover:bg-neutral-900/60">
      <Plus size={14} aria-hidden />
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          } else if (e.key === 'Escape') {
            setTitle('');
            e.currentTarget.blur();
          }
        }}
        placeholder="Add task…"
        aria-label={`Add task to ${status}`}
        maxLength={200}
        className="w-full bg-transparent text-[13px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-neutral-100"
      />
    </label>
  );
}
