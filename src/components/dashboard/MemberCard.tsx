import { timeAgo } from '../../lib/dates';
import { STATUS_META } from '../../lib/taskMeta';
import type { MemberStats, Workload } from '../../lib/workload';
import { useUiStore } from '../../store/useUiStore';
import type { TeamMember } from '../../types/models';
import { MentionText } from '../drawer/CommentStream';
import { TagBadge } from '../drawer/TagToggle';
import { Avatar } from '../ui/Avatar';
import { StackedBar } from './StackedBar';

const MAX_FOCUS = 3;

const WORKLOAD_STYLE: Record<Workload, string> = {
  Light: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
  Balanced: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900',
  Heavy: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-900'
};

/** One teammate: status breakdown, workload badge, and what they're working on right now. */
export function MemberCard({ stats, members }: { stats: MemberStats; members: TeamMember[] }) {
  const { member, counts, active, workload, focus } = stats;
  const openTask = useUiStore((s) => s.openTask);
  const shown = focus.slice(0, MAX_FOCUS);

  return (
    <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <header className="flex items-center gap-2.5">
        <Avatar name={member.name} email={member.email} src={member.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{member.name}</h3>
          <p className="truncate text-xs text-gray-500 dark:text-neutral-400">{member.role || 'Member'}</p>
        </div>
        <span
          title={`${active} active task${active === 1 ? '' : 's'}`}
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${WORKLOAD_STYLE[workload]}`}
        >
          {workload}
        </span>
      </header>

      <div className="mt-3">
        <StackedBar counts={counts} />
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-neutral-800">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
          Current focus &amp; latest update
        </h4>
        {shown.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-neutral-500">Nothing in progress right now.</p>
        ) : (
          <ul className="space-y-2.5">
            {shown.map(({ task, latest }) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => openTask(task.id)}
                  className="flex w-full items-center gap-1.5 text-left text-[13px] font-medium hover:underline"
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_META[task.status].dot}`} title={task.status} aria-hidden />
                  <span className="truncate">{task.title}</span>
                  {task.status === 'Blocked' && <span className="sr-only">(blocked)</span>}
                </button>
                {latest ? (
                  <p className="ml-3 mt-0.5 line-clamp-2 text-xs text-gray-600 dark:text-neutral-400">
                    <TagBadge tag={latest.tag} /> <span className="font-medium">{latest.authorName.split(' ')[0]}:</span>{' '}
                    <MentionText content={latest.content} members={members} />
                    <span className="text-gray-400"> · {timeAgo(latest.createdAt)}</span>
                  </p>
                ) : (
                  <p className="ml-3 mt-0.5 text-xs italic text-gray-400 dark:text-neutral-500">No updates yet</p>
                )}
              </li>
            ))}
          </ul>
        )}
        {focus.length > MAX_FOCUS && (
          <p className="mt-2 text-xs text-gray-500 dark:text-neutral-400">+{focus.length - MAX_FOCUS} more in progress</p>
        )}
      </div>
    </article>
  );
}
