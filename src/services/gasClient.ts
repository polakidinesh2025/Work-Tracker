import { env } from '../config/env';
import type { ActionMap, ActionName, ApiErrorCode, ApiResponse } from '../types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Worth retrying later: the request may succeed unchanged. */
  get retryable(): boolean {
    return this.code === 'NETWORK' || this.code === 'BUSY' || this.code === 'SERVER';
  }

  /** The user must sign in again before anything else can be sent. */
  get needsAuth(): boolean {
    return this.code === 'UNAUTHORIZED' || this.code === 'DOMAIN_DENIED';
  }
}

const REQUEST_TIMEOUT_MS = 30_000;

/**
 * CORS-safe call to the Apps Script web app.
 * text/plain is a "simple" content type, so the browser sends no preflight;
 * Apps Script answers with a 302 to googleusercontent.com, which fetch follows.
 */
export async function callGas<A extends ActionName>(
  action: A,
  payload: ActionMap[A]['payload'],
  idToken: string
): Promise<ActionMap[A]['result']> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(env.gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      body: JSON.stringify({ idToken, action, payload }),
      signal: controller.signal
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === 'AbortError' ? 'Request timed out' : 'Network error';
    throw new ApiError(`${reason} while calling ${action}.`, 'NETWORK');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new ApiError(`Backend returned HTTP ${response.status} for ${action}.`, 'SERVER');
  }

  let body: ApiResponse<ActionMap[A]['result']>;
  try {
    body = await response.json();
  } catch {
    // Usually an Apps Script HTML error page (e.g. deployment not shared with "Anyone")
    throw new ApiError('Backend did not return JSON. Check the web app deployment access.', 'SERVER');
  }

  if (!body.ok || body.data === undefined) {
    throw new ApiError(body.error || `${action} failed.`, body.code ?? 'SERVER');
  }
  return body.data;
}
