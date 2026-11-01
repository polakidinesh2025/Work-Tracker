import { useGoogleOneTapLogin } from '@react-oauth/google';
import { useEffect, useState } from 'react';
import { env } from '../config/env';
import { useAuthStore } from '../store/useAuthStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

/** Start a silent refresh this long before the ~1h Google token expires. */
const REFRESH_LEAD_MS = 5 * 60_000;

/** True once `deadline` (epoch ms) has passed; re-renders at that moment. */
function usePassed(deadline: number): boolean {
  const [passed, setPassed] = useState(() => Date.now() >= deadline);
  useEffect(() => {
    const wait = deadline - Date.now();
    setPassed(wait <= 0);
    if (wait <= 0) return;
    const timer = setTimeout(() => setPassed(true), wait);
    return () => clearTimeout(timer);
  }, [deadline]);
  return passed;
}

/**
 * Keeps the Google session alive: shortly before expiry (or after the backend
 * rejects the token) it asks Google One Tap for a fresh token with auto_select,
 * which usually needs no click. Returns true when the user must sign in manually.
 */
export function useTokenRefresh(): { sessionExpired: boolean } {
  const signedIn = useAuthStore((s) => Boolean(s.user));
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const signInWithCredential = useAuthStore((s) => s.signInWithCredential);
  const needsAuth = useWorkspaceStore((s) => s.needsAuth);

  const refreshDue = usePassed(expiresAt - REFRESH_LEAD_MS);
  const expired = usePassed(expiresAt);

  useGoogleOneTapLogin({
    disabled: !signedIn || !(refreshDue || needsAuth),
    auto_select: true,
    cancel_on_tap_outside: false,
    hosted_domain: env.allowedDomain || undefined,
    onSuccess: (response) => {
      if (response.credential) signInWithCredential(response.credential);
    }
  });

  return { sessionExpired: signedIn && (expired || needsAuth) };
}
