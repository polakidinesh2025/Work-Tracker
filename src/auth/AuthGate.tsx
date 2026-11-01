import type { ReactNode } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { CollegeSignInButton, SignInScreen } from './GoogleLogin';
import { useTokenRefresh } from './tokenRefresh';

/**
 * Shows the sign-in screen until a college account signs in. After that the app
 * stays usable even if the token lapses: edits keep queuing locally, and a
 * banner asks to sign in again so they can be sent.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const { sessionExpired } = useTokenRefresh();

  if (!user) return <SignInScreen />;

  return (
    <>
      {sessionExpired && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <span>Your Google session expired. Your changes are saved here and will sync after you sign in.</span>
          <CollegeSignInButton />
        </div>
      )}
      {children}
    </>
  );
}
