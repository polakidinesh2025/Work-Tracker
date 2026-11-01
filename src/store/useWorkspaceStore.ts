import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { newId, nowIso } from '../lib/ids';
import { applyOp, mergeServerState, type WorkspaceData } from '../sync/mergeState';
import { enqueue, markFailed, removeItem, type OutboxItem } from '../sync/outbox';
import type { MutationOp, WorkspaceState } from '../types/api';
import type { CommentTag, Priority, TaskChanges, TaskStatus } from '../types/models';
import { useAuthStore } from './useAuthStore';

export interface NewTaskInput {
  title: string;
  status: TaskStatus;
  priority?: Priority;
  assigneeEmail?: string;
  dueDate?: string;
  description?: string;
}

export interface NewCommentInput {
  taskId: string;
  content: string;
  tag?: CommentTag;
  mentionedEmails?: string[];
}

interface WorkspaceStore extends WorkspaceData {
  outbox: OutboxItem[];
  /** Outbox item currently being sent; never persisted. */
  inFlightId: string | null;
  lastSyncedAt: string | null;
  /** Email of the user whose data is cached, so a different sign-in starts clean. */
  cacheOwner: string | null;
  syncError: string | null;
  needsAuth: boolean;
  isRefreshing: boolean;

  createTask: (input: NewTaskInput) => string;
  updateTask: (taskId: string, changes: TaskChanges) => void;
  /** Moves a card to Blocked and posts the [Blocker] comment in the same request. */
  blockTask: (taskId: string, reason: string, mentionedEmails?: string[], commentText?: string) => void;
  deleteTask: (taskId: string) => void;
  addComment: (input: NewCommentInput) => void;

  // Used by the sync engine
  applyServerState: (state: WorkspaceState) => void;
  completeItem: (itemId: string) => void;
  failItem: (itemId: string) => void;
  dropItem: (itemId: string, message: string) => void;
  setSync: (patch: Partial<Pick<WorkspaceStore, 'inFlightId' | 'syncError' | 'needsAuth' | 'isRefreshing'>>) => void;
  resetCache: () => void;
}

const EMPTY: WorkspaceData = { tasks: [], comments: [], teamMembers: [] };

function opContext() {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Cannot change data while signed out.');
  return { user, now: nowIso() };
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => {
      /** Optimistic update (0ms) + queue for background sync. */
      const mutate = (op: MutationOp) => {
        const ctx = opContext();
        set((s) => ({
          ...applyOp(s, op, ctx),
          outbox: enqueue(s.outbox, op, s.inFlightId),
          cacheOwner: s.cacheOwner ?? ctx.user.email
        }));
      };

      return {
        ...EMPTY,
        outbox: [],
        inFlightId: null,
        lastSyncedAt: null,
        cacheOwner: null,
        syncError: null,
        needsAuth: false,
        isRefreshing: false,

        createTask: (input) => {
          const id = newId('task');
          mutate({ action: 'CREATE_TASK', payload: { id, ...input, title: input.title.trim() } });
          return id;
        },

        updateTask: (taskId, changes) => {
          const leavingBlocked = changes.status && changes.status !== 'Blocked';
          const task = get().tasks.find((t) => t.id === taskId);
          const patch = leavingBlocked && task?.blockerReason ? { ...changes, blockerReason: '' } : changes;
          mutate({ action: 'UPDATE_TASK', payload: { taskId, changes: patch } });
        },

        blockTask: (taskId, reason, mentionedEmails = [], commentText = reason) =>
          mutate({
            action: 'UPDATE_TASK',
            payload: {
              taskId,
              changes: { status: 'Blocked', blockerReason: reason.trim() },
              autoComment: { id: newId('cmt'), taskId, tag: 'Blocker', content: commentText.trim(), mentionedEmails }
            }
          }),

        deleteTask: (taskId) => mutate({ action: 'DELETE_TASK', payload: { taskId } }),

        addComment: ({ taskId, content, tag = 'General', mentionedEmails = [] }) =>
          mutate({
            action: 'ADD_COMMENT',
            payload: { id: newId('cmt'), taskId, tag, content: content.trim(), mentionedEmails }
          }),

        applyServerState: (state) => {
          const ctx = opContext();
          set((s) => ({
            ...mergeServerState(state, s.outbox.map((item) => item.op), ctx),
            lastSyncedAt: state.lastSyncedAt,
            cacheOwner: state.currentUser.email
          }));
          useAuthStore.getState().setServerUser(state.currentUser);
        },

        completeItem: (itemId) =>
          set((s) => ({ outbox: removeItem(s.outbox, itemId), inFlightId: null, syncError: null })),

        failItem: (itemId) => set((s) => ({ outbox: markFailed(s.outbox, itemId), inFlightId: null })),

        dropItem: (itemId, message) =>
          set((s) => ({ outbox: removeItem(s.outbox, itemId), inFlightId: null, syncError: message })),

        setSync: (patch) => set(patch),

        resetCache: () =>
          set({ ...EMPTY, outbox: [], inFlightId: null, lastSyncedAt: null, cacheOwner: null, syncError: null })
      };
    },
    {
      name: 'tasklite-workspace',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        tasks: s.tasks,
        comments: s.comments,
        teamMembers: s.teamMembers,
        outbox: s.outbox,
        lastSyncedAt: s.lastSyncedAt,
        cacheOwner: s.cacheOwner
      })
    }
  )
);

export type SyncStatus = 'demo' | 'synced' | 'saving' | 'error' | 'auth';

/** Drives the navbar pill: Synced | Saving... | Offline Demo | error states. */
export function selectSyncStatus(s: WorkspaceStore, isDemo: boolean): SyncStatus {
  if (isDemo) return 'demo';
  if (s.needsAuth) return 'auth';
  if (s.syncError) return 'error';
  return s.outbox.length > 0 ? 'saving' : 'synced';
}
