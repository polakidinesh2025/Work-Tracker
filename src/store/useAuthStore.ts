import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { env } from '../config/env';
import { decodeJwt, isAllowedDomain } from '../lib/jwt';
import { DEMO_USER } from '../services/seedData';
import type { SessionUser } from '../types/models';

/** Refresh a little before Google's ~1h token expiry. */
const EXPIRY_MARGIN_MS = 60_000;

interface AuthState {
  idToken: string | null;
  user: SessionUser | null;
  /** Epoch ms when idToken expires. */
  expiresAt: number;
  error: string | null;
  /** Takes the credential from Google Sign-In; returns false if rejected. */
  signInWithCredential: (credential: string) => boolean;
  /** Updates name/role/avatar from the backend's view of the current user. */
  setServerUser: (user: SessionUser) => void;
  signOut: (reason?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      idToken: null,
      user: env.isDemo ? DEMO_USER : null,
      expiresAt: 0,
      error: null,

      signInWithCredential: (credential) => {
        const claims = decodeJwt(credential);
        if (!claims?.email) {
          set({ error: 'Google sign-in returned an unreadable token. Please try again.' });
          return false;
        }
        // UX check only — the backend re-verifies the domain on every request
        if (!isAllowedDomain(claims, env.allowedDomain)) {
          set({ error: `Please sign in with your @${env.allowedDomain} college account.` });
          return false;
        }
        set({
          idToken: credential,
          expiresAt: claims.exp * 1000,
          error: null,
          user: {
            email: claims.email.toLowerCase(),
            name: claims.name || claims.email.split('@')[0],
            picture: claims.picture || ''
          }
        });
        return true;
      },

      setServerUser: (user) => set((s) => ({ user: s.user ? { ...s.user, ...user } : user })),

      signOut: (reason) =>
        set({ idToken: null, user: env.isDemo ? DEMO_USER : null, expiresAt: 0, error: reason ?? null })
    }),
    {
      name: 'tasklite-auth',
      // sessionStorage: the token dies with the tab instead of lingering on shared machines
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => (env.isDemo ? {} : { idToken: s.idToken, user: s.user, expiresAt: s.expiresAt })
    }
  )
);

/** A token that is present and not about to expire, or null. */
export function getValidToken(): string | null {
  const { idToken, expiresAt } = useAuthStore.getState();
  return idToken && Date.now() < expiresAt - EXPIRY_MARGIN_MS ? idToken : null;
}
