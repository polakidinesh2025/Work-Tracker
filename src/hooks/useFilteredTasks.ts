import { useMemo } from 'react';
import { PRIORITY_META } from '../lib/taskMeta';
import { useAuthStore } from '../store/useAuthStore';
import { useUiStore } from '../store/useUiStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { STATUSES, type Task, type TaskStatus } from '../types/models';

/** Urgent first, then earliest due date, then most recently updated. */
function compareTasks(a: Task, b: Task): number {
  const byPriority = (PRIORITY_META[a.priority]?.rank ?? 2) - (PRIORITY_META[b.priority]?.rank ?? 2);
  if (byPriority !== 0) return byPriority;
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function matchesQuery(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return task.title.toLowerCase().includes(q) || task.description.toLowerCase().includes(q);
}

/**
 * Board columns after the filter bar's assignee / priority / search filters.
 * `overrides` lets the board show a card in a column before the change is committed
 * (used while the blocker prompt is open).
 */
export function useFilteredTasks(overrides: Record<string, TaskStatus> = {}) {
  const tasks = useWorkspaceStore((s) => s.tasks);
  const myEmail = useAuthStore((s) => s.user?.email ?? '');
  const assigneeFilter = useUiStore((s) => s.assigneeFilter);
  const priorityFilter = useUiStore((s) => s.priorityFilter);
  const query = useUiStore((s) => s.query);

  return useMemo(() => {
    const assignee = assigneeFilter === 'me' ? myEmail : assigneeFilter;
    const columns = Object.fromEntries(STATUSES.map((s) => [s, [] as Task[]])) as Record<TaskStatus, Task[]>;

    for (const task of tasks) {
      if (assignee !== 'all' && task.assigneeEmail !== assignee) continue;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) continue;
      if (!matchesQuery(task, query)) continue;
      const status = overrides[task.id] ?? task.status;
      (columns[status] ?? columns.Backlog).push(task);
    }
    for (const status of STATUSES) columns[status].sort(compareTasks);

    const isFiltered = assignee !== 'all' || priorityFilter !== 'all' || query.trim() !== '';
    return { columns, isFiltered };
  }, [tasks, myEmail, assigneeFilter, priorityFilter, query, overrides]);
}
