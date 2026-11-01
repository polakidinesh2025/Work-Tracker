/** Reads Vite env vars once and decides whether the app runs in Local Demo Mode. */

const clean = (value: string | undefined) => (value ?? '').trim();

const gasUrl = clean(import.meta.env.VITE_GAS_API_URL);
const googleClientId = clean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const allowedDomain = clean(import.meta.env.VITE_ALLOWED_DOMAIN).toLowerCase().replace(/^@/, '');
const forceDemo = clean(import.meta.env.VITE_FORCE_DEMO) === 'true';

export const env = {
  gasUrl,
  googleClientId,
  allowedDomain,
  /** No backend or OAuth client configured (or explicitly forced): run fully in the browser. */
  isDemo: forceDemo || !gasUrl || !googleClientId
} as const;

/** Email domain used for demo-mode sample teammates. */
export const demoDomain = allowedDomain || 'demo.tasklite';
