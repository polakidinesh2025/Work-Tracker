import type { CommentTag, Priority, TaskStatus } from '../types/models';

/** Visual metadata for statuses and priorities, shared by board, drawer and dashboard. */

export const STATUS_META: Record<TaskStatus, { dot: string; text: string }> = {
  Backlog: { dot: 'bg-status-backlog', text: 'text-gray-600 dark:text-neutral-400' },
  'To Do': { dot: 'bg-status-todo', text: 'text-blue-700 dark:text-blue-400' },
  'In Progress': { dot: 'bg-status-progress', text: 'text-amber-700 dark:text-amber-400' },
  Blocked: { dot: 'bg-status-blocked', text: 'text-red-700 dark:text-red-400' },
  Done: { dot: 'bg-status-done', text: 'text-emerald-700 dark:text-emerald-400' }
};

export const TAG_META: Record<CommentTag, { className: string }> = {
  Update: { className: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900' },
  Blocker: { className: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900' },
  Question: { className: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900' },
  General: { className: 'bg-gray-50 text-gray-600 ring-gray-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-700' }
};

export const PRIORITY_META: Record<Priority, { rank: number; className: string }> = {
  Urgent: { rank: 0, className: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900' },
  High: { rank: 1, className: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-900' },
  Med: { rank: 2, className: 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-700' },
  Low: { rank: 3, className: 'bg-white text-gray-500 ring-gray-200 dark:bg-neutral-950 dark:text-neutral-400 dark:ring-neutral-800' }
};
