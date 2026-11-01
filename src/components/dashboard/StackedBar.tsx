import { TRACKED_STATUSES, type TrackedStatus } from '../../lib/workload';

const SEGMENT_COLOR: Record<TrackedStatus, string> = {
  'To Do': 'bg-status-todo',
  'In Progress': 'bg-status-progress',
  Blocked: 'bg-status-blocked',
  Done: 'bg-status-done'
};

/** One horizontal bar split by status, with a count legend underneath. */
export function StackedBar({ counts }: { counts: Record<TrackedStatus, number> }) {
  const total = TRACKED_STATUSES.reduce((n, s) => n + counts[s], 0);
  const summary = TRACKED_STATUSES.map((s) => `${counts[s]} ${s}`).join(', ');

  return (
    <div>
      <div
        role="img"
        aria-label={total ? summary : 'No tasks assigned'}
        className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800"
      >
        {total > 0 &&
          TRACKED_STATUSES.filter((s) => counts[s] > 0).map((s) => (
            <span key={s} title={`${s}: ${counts[s]}`} className={SEGMENT_COLOR[s]} style={{ width: `${(counts[s] / total) * 100}%` }} />
          ))}
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500 dark:text-neutral-400" aria-hidden>
        {TRACKED_STATUSES.map((s) => (
          <li key={s} className="inline-flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${SEGMENT_COLOR[s]}`} />
            {s} <span className="font-medium tabular-nums text-gray-700 dark:text-neutral-200">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
