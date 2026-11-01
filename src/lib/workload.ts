import type { Task, TaskComment, TaskStatus, TeamMember } from '../types/models';
import { isOverdue } from './dates';

/** Pure calculations behind the Team Dashboard. */

export type Workload = 'Light' | 'Balanced' | 'Heavy';
export type TrackedStatus = Exclude<TaskStatus, 'Backlog'>;

export const TRACKED_STATUSES: TrackedStatus[] = ['To Do', 'In Progress', 'Blocked', 'Done'];
const ACTIVE: TaskStatus[] = ['To Do', 'In Progress', 'Blocked'];

/** 0–2 active tasks is Light, 3–5 Balanced, 6+ Heavy. */
export function workloadFor(activeCount: number): Workload {
  if (activeCount <= 2) return 'Light';
  if (activeCount <= 5) return 'Balanced';
  return 'Heavy';
}

export interface FocusItem {
  task: Task;
  latest?: TaskComment;
}

export interface MemberStats {
  member: TeamMember;
  counts: Record<TrackedStatus, number>;
  active: number;
  workload: Workload;
  /** In Progress and Blocked tasks (blocked first), each with its newest comment. */
  focus: FocusItem[];
}

export interface DashboardStats {
  activeTasks: number;
  /** Done ÷ all tasks outside Backlog, 0–100. */
  completionRate: number;
  doneTasks: number;
  committedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  members: MemberStats[];
}

export function computeDashboard(tasks: Task[], comments: TaskComment[], members: TeamMember[]): DashboardStats {
  const latestByTask = new Map<string, TaskComment>();
  for (const c of comments) {
    const prev = latestByTask.get(c.taskId);
    if (!prev || c.createdAt > prev.createdAt) latestByTask.set(c.taskId, c);
  }

  const committed = tasks.filter((t) => t.status !== 'Backlog');
  const done = committed.filter((t) => t.status === 'Done').length;

  const memberStats = members.map((member): MemberStats => {
    const mine = tasks.filter((t) => t.assigneeEmail.toLowerCase() === member.email.toLowerCase());
    const counts = { 'To Do': 0, 'In Progress': 0, Blocked: 0, Done: 0 } as Record<TrackedStatus, number>;
    for (const t of mine) if (t.status !== 'Backlog') counts[t.status] += 1;

    const active = mine.filter((t) => ACTIVE.includes(t.status)).length;
    const focus = mine
      .filter((t) => t.status === 'In Progress' || t.status === 'Blocked')
      .sort((a, b) => Number(b.status === 'Blocked') - Number(a.status === 'Blocked') || b.updatedAt.localeCompare(a.updatedAt))
      .map((task) => ({ task, latest: latestByTask.get(task.id) }));

    return { member, counts, active, workload: workloadFor(active), focus };
  });

  // Busiest people first, so overload is visible at a glance
  memberStats.sort((a, b) => b.active - a.active || a.member.name.localeCompare(b.member.name));

  return {
    activeTasks: tasks.filter((t) => ACTIVE.includes(t.status)).length,
    completionRate: committed.length ? Math.round((done / committed.length) * 100) : 0,
    doneTasks: done,
    committedTasks: committed.length,
    blockedTasks: tasks.filter((t) => t.status === 'Blocked').length,
    overdueTasks: tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
    members: memberStats
  };
}
