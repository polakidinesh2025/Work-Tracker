import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

const CACHE_KEYS = ['tasklite-workspace', 'tasklite-ui'];

/**
 * Last-resort screen if rendering crashes (e.g. a corrupt local cache).
 * Offers a reload, and a reset that clears cached data but keeps the session.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('TaskLite crashed:', error, info.componentStack);
  }

  private resetCache = () => {
    try {
      CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Storage unavailable; a plain reload is all we can do
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main role="alert" className="flex min-h-full items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
            TaskLite hit an unexpected error. Reloading usually fixes it. If it keeps happening, clear the local cache. Your
            synced data stays safe in Google Sheets, but changes that haven't synced yet will be lost.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.resetCache}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium dark:border-neutral-700"
            >
              Clear local cache
            </button>
          </div>
        </div>
      </main>
    );
  }
}
