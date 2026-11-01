import { env } from '../config/env';
import { ApiError } from '../services/gasClient';
import { api } from '../services/transport';
import { useAuthStore } from '../store/useAuthStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import type { MutationOp } from '../types/api';

/**
 * Background sync: sends queued changes one at a time, in order, and pulls
 * fresh workspace data on load, on tab focus, on a timer and on demand.
 */

const POLL_INTERVAL_MS = 60_000;
const ERROR_AFTER_ATTEMPTS = 3;

let pumping = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let refreshing: Promise<void> | null = null;
/** Bumped whenever a change lands on the server, so stale refreshes can be detected. */
let completedSeq = 0;

const store = () => useWorkspaceStore.getState();
const sendOp = (op: MutationOp) => (api as (a: string, p: unknown) => Promise<unknown>)(op.action, op.payload);
const canTalkToServer = () => env.isDemo || Boolean(useAuthStore.getState().idToken);
const message = (err: unknown) => (err instanceof Error ? err.message : 'Unexpected sync error.');

function handleAuthError() {
  store().setSync({ inFlightId: null, needsAuth: true });
}

/** Drains the outbox. Safe to call any time; only one pump runs at once. */
export async function pump(): Promise<void> {
  if (pumping || !canTalkToServer()) return;
  pumping = true;
  let sentSomething = false;

  try {
    for (;;) {
      const { outbox, needsAuth } = store();
      const item = outbox[0];
      if (!item || needsAuth) break;

      const wait = item.nextAttemptAt - Date.now();
      if (wait > 0) {
        clearTimeout(retryTimer);
        retryTimer = setTimeout(pump, wait);
        break;
      }

      store().setSync({ inFlightId: item.id });
      try {
        await sendOp(item.op);
        completedSeq += 1;
        sentSomething = true;
        store().completeItem(item.id);
      } catch (err) {
        if (err instanceof ApiError && err.needsAuth) {
          handleAuthError();
          break;
        }
        if (err instanceof ApiError && err.retryable) {
          store().failItem(item.id);
          if (item.attempts + 1 >= ERROR_AFTER_ATTEMPTS) {
            store().setSync({ syncError: `Can't reach the server. Retrying… (${err.message})` });
          }
          continue;
        }
        // Rejected by the server (validation, permission, missing task): drop it and restore server truth
        store().dropItem(item.id, message(err));
        void refresh();
      }
    }
  } finally {
    pumping = false;
  }

  if (sentSomething && store().outbox.length === 0) void refresh();
}

/** Pulls the full workspace and merges it under any still-unsent changes. */
export function refresh(): Promise<void> {
  if (!canTalkToServer()) return Promise.resolve();
  if (refreshing) return refreshing;

  refreshing = (async () => {
    store().setSync({ isRefreshing: true });
    try {
      for (let tries = 0; tries < 3; tries += 1) {
        const seqAtStart = completedSeq;
        const state = await api('GET_WORKSPACE', {});
        // A change landed mid-request, so this snapshot may predate it: fetch again
        if (seqAtStart !== completedSeq) continue;

        const { cacheOwner, outbox } = store();
        if (cacheOwner && cacheOwner !== state.currentUser.email) store().resetCache();
        store().applyServerState(state);
        if (outbox.length === 0) store().setSync({ syncError: null });
        break;
      }
    } catch (err) {
      if (err instanceof ApiError && err.needsAuth) handleAuthError();
      else store().setSync({ syncError: message(err) });
    } finally {
      store().setSync({ isRefreshing: false });
      refreshing = null;
    }
  })();
  return refreshing;
}

/** The navbar "Sync Now" button: retry everything immediately, then refresh. */
export async function syncNow(): Promise<void> {
  useWorkspaceStore.setState((s) => ({
    outbox: s.outbox.map((item) => ({ ...item, nextAttemptAt: 0 })),
    syncError: null
  }));
  await pump();
  await refresh();
}

/** Wires up all sync triggers. Returns a cleanup function (for React effects). */
export function startSyncEngine(): () => void {
  const user = useAuthStore.getState().user;
  const { cacheOwner } = store();
  if (user && cacheOwner && cacheOwner !== user.email) store().resetCache();

  const unsubOutbox = useWorkspaceStore.subscribe((s, prev) => {
    if (s.outbox.length > prev.outbox.length) void pump();
  });

  const unsubAuth = useAuthStore.subscribe((s, prev) => {
    if (s.idToken && s.idToken !== prev.idToken) {
      if (store().cacheOwner && s.user && store().cacheOwner !== s.user.email) store().resetCache();
      store().setSync({ needsAuth: false, syncError: null });
      void pump();
      void refresh();
    }
  });

  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      void pump();
      void refresh();
    }
  };
  const onOnline = () => void syncNow();
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', onOnline);

  const poll = setInterval(() => {
    if (document.visibilityState === 'visible') void refresh();
  }, POLL_INTERVAL_MS);

  void pump();
  void refresh();

  return () => {
    unsubOutbox();
    unsubAuth();
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('online', onOnline);
    clearInterval(poll);
    clearTimeout(retryTimer);
  };
}
