import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect } from 'react';
import { AuthGate } from './auth/AuthGate';
import { Board } from './components/board/Board';
import { FilterBar } from './components/board/FilterBar';
import { Dashboard } from './components/dashboard/Dashboard';
import { TaskDrawer } from './components/drawer/TaskDrawer';
import { Navbar } from './components/layout/Navbar';
import { CommandPalette } from './components/search/CommandPalette';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { env } from './config/env';
import { useHotkeys } from './hooks/useHotkeys';
import { useUiStore } from './store/useUiStore';
import { useWorkspaceStore } from './store/useWorkspaceStore';
import { startSyncEngine } from './sync/syncEngine';

function LoadingState() {
  return (
    <div role="status" className="flex flex-1 gap-3 p-4" aria-label="Loading your board">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-64 flex-1 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-900" />
      ))}
    </div>
  );
}

/** Signed-in app: runs the sync engine and keyboard shortcuts. */
function Workspace() {
  useEffect(() => startSyncEngine(), []);
  useHotkeys();

  const view = useUiStore((s) => s.view);
  const isLoading = useWorkspaceStore((s) => s.tasks.length === 0 && s.lastSyncedAt === null);
  const syncError = useWorkspaceStore((s) => s.syncError);

  return (
    <div className="flex h-full flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-1.5 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>
      <Navbar />
      {syncError && (
        <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-1.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {syncError}
        </p>
      )}
      <main id="main" tabIndex={-1} className="flex min-h-0 flex-1 flex-col outline-none">
        <h1 className="sr-only">{view === 'board' ? 'Task board' : 'Team dashboard'}</h1>
        {view === 'board' && <FilterBar />}
        {isLoading ? <LoadingState /> : view === 'board' ? <Board /> : <Dashboard />}
      </main>
      <TaskDrawer />
      <CommandPalette />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      {env.isDemo ? (
        <Workspace />
      ) : (
        <GoogleOAuthProvider clientId={env.googleClientId}>
          <AuthGate>
            <Workspace />
          </AuthGate>
        </GoogleOAuthProvider>
      )}
    </ErrorBoundary>
  );
}
