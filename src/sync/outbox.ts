import { newId } from '../lib/ids';
import type { MutationOp } from '../types/api';

/** A change waiting to be sent to the backend. Persisted, so it survives reloads. */
export interface OutboxItem {
  id: string;
  op: MutationOp;
  attempts: number;
  /** Epoch ms; the worker won't send before this (retry backoff). */
  nextAttemptAt: number;
}

const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;

export const backoffDelay = (attempts: number) => Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** Math.max(0, attempts - 1));

/**
 * Adds a change to the queue, folding it into the last queued item when that
 * keeps requests minimal:
 *  - UPDATE after UPDATE of the same task -> one delta with merged changes
 *  - UPDATE after a still-unsent CREATE   -> the create carries the changes
 * The item currently being sent (inFlightId) is never modified.
 */
export function enqueue(queue: OutboxItem[], op: MutationOp, inFlightId: string | null): OutboxItem[] {
  const last = queue[queue.length - 1];
  const canFold = last && last.id !== inFlightId && op.action === 'UPDATE_TASK';

  if (canFold && last.op.action === 'UPDATE_TASK' && last.op.payload.taskId === op.payload.taskId) {
    const prev = last.op.payload;
    if (!(prev.autoComment && op.payload.autoComment)) {
      const merged: OutboxItem = {
        ...last,
        op: {
          action: 'UPDATE_TASK',
          payload: {
            taskId: prev.taskId,
            changes: { ...prev.changes, ...op.payload.changes },
            autoComment: op.payload.autoComment ?? prev.autoComment
          }
        }
      };
      return [...queue.slice(0, -1), merged];
    }
  }

  if (
    canFold &&
    last.op.action === 'CREATE_TASK' &&
    last.op.payload.id === op.payload.taskId &&
    !op.payload.autoComment
  ) {
    const merged: OutboxItem = {
      ...last,
      op: { action: 'CREATE_TASK', payload: { ...last.op.payload, ...op.payload.changes } }
    };
    return [...queue.slice(0, -1), merged];
  }

  return [...queue, { id: newId('op'), op, attempts: 0, nextAttemptAt: 0 }];
}

export function markFailed(queue: OutboxItem[], itemId: string): OutboxItem[] {
  return queue.map((item) => {
    if (item.id !== itemId) return item;
    const attempts = item.attempts + 1;
    return { ...item, attempts, nextAttemptAt: Date.now() + backoffDelay(attempts) };
  });
}

export const removeItem = (queue: OutboxItem[], itemId: string) => queue.filter((item) => item.id !== itemId);
