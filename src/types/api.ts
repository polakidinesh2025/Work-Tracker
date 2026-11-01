import type { SessionUser, Task, TaskChanges, TaskComment, TeamMember } from './models';

export interface WorkspaceState {
  tasks: Task[];
  comments: TaskComment[];
  teamMembers: TeamMember[];
  currentUser: SessionUser;
  lastSyncedAt: string;
}

export type CreateTaskPayload = Partial<Omit<Task, 'id' | 'createdBy' | 'updatedAt'>> & {
  id: string;
  title: string;
};

/** What the client sends; the backend fills in author fields and createdAt. */
export type NewCommentPayload = Pick<TaskComment, 'id' | 'taskId' | 'tag' | 'content' | 'mentionedEmails'>;

export interface UpdateTaskPayload {
  taskId: string;
  changes: TaskChanges;
  /** Posted in the same request, e.g. the [Blocker] comment when a card moves to Blocked. */
  autoComment?: NewCommentPayload;
}

/** Request payload + response data for every backend action. */
export interface ActionMap {
  GET_WORKSPACE: { payload: Record<string, never>; result: WorkspaceState };
  CREATE_TASK: { payload: CreateTaskPayload; result: { task: Task } };
  UPDATE_TASK: { payload: UpdateTaskPayload; result: { task: Task; comment: TaskComment | null } };
  DELETE_TASK: { payload: { taskId: string }; result: { deletedTaskId: string } };
  ADD_COMMENT: { payload: NewCommentPayload; result: { comment: TaskComment } };
}

export type ActionName = keyof ActionMap;
export type MutationAction = Exclude<ActionName, 'GET_WORKSPACE'>;

/** A queued change, as stored in the outbox. */
export type MutationOp = {
  [A in MutationAction]: { action: A; payload: ActionMap[A]['payload'] };
}[MutationAction];

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'DOMAIN_DENIED'
  | 'FORBIDDEN'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'BUSY'
  | 'SERVER'
  | 'NETWORK';

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  code?: ApiErrorCode;
  error?: string;
}
