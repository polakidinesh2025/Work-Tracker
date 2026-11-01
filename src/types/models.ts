/** Mirrors the three Google Sheet tabs. Every sheet value is a string. */

export const STATUSES = ['Backlog', 'To Do', 'In Progress', 'Blocked', 'Done'] as const;
export const PRIORITIES = ['Low', 'Med', 'High', 'Urgent'] as const;
export const COMMENT_TAGS = ['Update', 'Blocker', 'Question', 'General'] as const;

export type TaskStatus = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type CommentTag = (typeof COMMENT_TAGS)[number];

/** Sheet: Tasks */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeEmail: string;
  /** YYYY-MM-DD or '' */
  dueDate: string;
  blockerReason: string;
  /** ISO timestamp */
  updatedAt: string;
  createdBy: string;
}

/** Sheet: Comments (mentionedEmails is stored as a JSON string, parsed by the backend) */
export interface TaskComment {
  id: string;
  taskId: string;
  authorEmail: string;
  authorName: string;
  authorAvatar: string;
  tag: CommentTag;
  content: string;
  mentionedEmails: string[];
  createdAt: string;
}

/** Sheet: TeamMembers */
export interface TeamMember {
  email: string;
  name: string;
  role: string;
  avatarUrl: string;
  addedAt: string;
}

export interface SessionUser {
  email: string;
  name: string;
  picture: string;
  role?: string;
}

/** Fields UPDATE_TASK may change (the backend enforces the same whitelist). */
export type TaskChanges = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assigneeEmail' | 'dueDate' | 'blockerReason'>
>;
