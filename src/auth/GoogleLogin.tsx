import { GoogleLogin } from '@react-oauth/google';
import { env } from '../config/env';
import { useAuthStore } from '../store/useAuthStore';

/** Google's button, with the account picker hinted to the college domain. */
export function CollegeSignInButton() {
  const signInWithCredential = useAuthStore((s) => s.signInWithCredential);
  return (
    <GoogleLogin
      hosted_domain={env.allowedDomain || undefined}
      onSuccess={(response) => {
        if (response.credential) signInWithCredential(response.credential);
      }}
      onError={() => useAuthStore.setState({ error: 'Google sign-in was cancelled or failed. Please try again.' })}
      text="signin_with"
      shape="pill"
      size="large"
    />
  );
}

export function SignInScreen() {
  const error = useAuthStore((s) => s.error);

  return (
    <main className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-lg font-bold text-white dark:bg-white dark:text-gray-900">
          T
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">TaskLite</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
          Your team's Kanban board. Sign in with your
          {env.allowedDomain ? <strong className="font-medium"> @{env.allowedDomain} </strong> : ' college '}
          Google account to continue.
        </p>

        <div className="mt-6 flex justify-center">
          <CollegeSignInButton />
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <p className="mt-8 text-xs text-gray-400 dark:text-neutral-500">
          First time here? You're added to the team automatically when you sign in.
        </p>
      </div>
    </main>
  );
}
