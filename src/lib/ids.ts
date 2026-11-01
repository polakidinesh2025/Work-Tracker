/** Client-generated ids keep creates idempotent: a retried request can't duplicate a row. */
export function newId(prefix: 'task' | 'cmt' | 'op'): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${uuid}`;
}

export const nowIso = () => new Date().toISOString();
