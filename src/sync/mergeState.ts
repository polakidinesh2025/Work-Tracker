import type { MutationOp, NewCommentPayload } from '../types/api';
import type { SessionUser, Task, TaskComment, TeamMember } from '../types/models';

export interface WorkspaceData {
  tasks: Task[];
  comments: TaskComment[];
  teamMembers: TeamMember[];
}

export interface OpContext {
  user: SessionUser;
  now: string;
}

function toComment(payload: NewCommentPayload, ctx: OpContext): TaskComment {
  return {
    ...payload,
    authorEmail: ctx.user.email,
    authorName: ctx.user.name,
    authorAvatar: ctx.user.picture,
    createdAt: ctx.now
  };
}

function upsertComment(comments: TaskComment[], comment: TaskComment): TaskComment[] {
  return comments.some((c) => c.id === comment.id) ? comments : [...comments, comment];
}

/**
 * Applies one queued change to local data. Used for the optimistic update when
 * the change is made, and again on top of fresh server data while it is still
 * unsent. Every branch is idempotent, so applying a change twice is harmless.
 */
export function applyOp(data: WorkspaceData, op: MutationOp, ctx: OpContext): WorkspaceData {
  switch (op.action) {
    case 'CREATE_TASK': {
      if (data.tasks.some((t) => t.id === op.payload.id)) return data;
      const task: Task = {
        description: '',
        status: 'To Do',
        priority: 'Med',
        assigneeEmail: ctx.user.email,
        dueDate: '',
        blockerReason: '',
        ...op.payload,
        updatedAt: ctx.now,
        createdBy: ctx.user.email
      };
      return { ...data, tasks: [...data.tasks, task] };
    }
    case 'UPDATE_TASK': {
      const { taskId, changes, autoComment } = op.payload;
      const tasks = data.tasks.map((t) => (t.id === taskId ? { ...t, ...changes, updatedAt: ctx.now } : t));
      const comments = autoComment ? upsertComment(data.comments, toComment(autoComment, ctx)) : data.comments;
      return { ...data, tasks, comments };
    }
    case 'DELETE_TASK':
      return {
        ...data,
        tasks: data.tasks.filter((t) => t.id !== op.payload.taskId),
        comments: data.comments.filter((c) => c.taskId !== op.payload.taskId)
      };
    case 'ADD_COMMENT':
      return { ...data, comments: upsertComment(data.comments, toComment(op.payload, ctx)) };
  }
}

/** Fresh server data with every still-unsent change re-applied on top, so a refresh never undoes an edit. */
export function mergeServerState(server: WorkspaceData, pending: MutationOp[], ctx: OpContext): WorkspaceData {
  return pending.reduce((acc, op) => applyOp(acc, op, ctx), {
    tasks: server.tasks,
    comments: server.comments,
    teamMembers: server.teamMembers
  });
}
