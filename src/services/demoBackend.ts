import { applyOp, type WorkspaceData } from '../sync/mergeState';
import type { ActionMap, ActionName, MutationOp } from '../types/api';
import { ApiError } from './gasClient';
import { createSeedWorkspace, DEMO_USER } from './seedData';

/**
 * Local Demo Mode backend: same contract as Code.gs, stored in localStorage.
 * Lets the whole UI and sync engine run before Google is configured.
 */

const DB_KEY = 'tasklite-demo-db';
const LATENCY_MS = 250;

function load(): WorkspaceData {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as WorkspaceData;
  } catch {
    // Storage blocked or corrupt: fall back to fresh seed data
  }
  const { tasks, comments, teamMembers } = createSeedWorkspace();
  return { tasks, comments, teamMembers };
}

function save(db: WorkspaceData) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // Non-fatal in demo mode
  }
}

export function resetDemoData() {
  try {
    localStorage.removeItem(DB_KEY);
  } catch {
    // ignore
  }
}

const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

export async function callDemo<A extends ActionName>(
  action: A,
  payload: ActionMap[A]['payload']
): Promise<ActionMap[A]['result']> {
  await delay();
  const db = load();

  if (action === 'GET_WORKSPACE') {
    const state = { ...db, currentUser: DEMO_USER, lastSyncedAt: new Date().toISOString() };
    return state as ActionMap[A]['result'];
  }

  const op = { action, payload } as MutationOp;
  if (op.action === 'DELETE_TASK') {
    const task = db.tasks.find((t) => t.id === op.payload.taskId);
    if (task && task.createdBy !== DEMO_USER.email && DEMO_USER.role !== 'Admin') {
      throw new ApiError('Only the task creator or an Admin can delete this task.', 'FORBIDDEN');
    }
  }
  if (op.action === 'UPDATE_TASK' && !db.tasks.some((t) => t.id === op.payload.taskId)) {
    throw new ApiError(`Task ${op.payload.taskId} does not exist.`, 'NOT_FOUND');
  }

  const next = applyOp(db, op, { user: DEMO_USER, now: new Date().toISOString() });
  save(next);
  return resultFor(op, next) as ActionMap[A]['result'];
}

function resultFor(op: MutationOp, db: WorkspaceData) {
  const findTask = (id: string) => db.tasks.find((t) => t.id === id)!;
  const findComment = (id: string) => db.comments.find((c) => c.id === id) ?? null;

  switch (op.action) {
    case 'CREATE_TASK':
      return { task: findTask(op.payload.id) };
    case 'UPDATE_TASK':
      return {
        task: findTask(op.payload.taskId),
        comment: op.payload.autoComment ? findComment(op.payload.autoComment.id) : null
      };
    case 'DELETE_TASK':
      return { deletedTaskId: op.payload.taskId };
    case 'ADD_COMMENT':
      return { comment: findComment(op.payload.id) };
  }
}
