import { env } from '../config/env';
import { getValidToken } from '../store/useAuthStore';
import type { ActionMap, ActionName } from '../types/api';
import { callDemo } from './demoBackend';
import { ApiError, callGas } from './gasClient';

/** Single entry point for backend calls: Apps Script when configured, the local demo store otherwise. */
export async function api<A extends ActionName>(
  action: A,
  payload: ActionMap[A]['payload']
): Promise<ActionMap[A]['result']> {
  if (env.isDemo) return callDemo(action, payload);

  const token = getValidToken();
  if (!token) throw new ApiError('Your Google session has expired. Please sign in again.', 'UNAUTHORIZED');
  return callGas(action, payload, token);
}
