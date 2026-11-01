import { Activity } from 'lucide-react';
import { useMemo } from 'react';
import { timeAgo } from '../../lib/dates';
import { useUiStore } from '../../store/useUiStore';
import type { Task, TaskComment, TeamMember } from '../../types/models';
import { MentionText } from '../drawer/CommentStream';
import { TagBadge } from '../drawer/TagToggle';
import { Avatar } from '../ui/Avatar';

const FEED_SIZE = 10;

interface ActivityPulseProps {
  comments: TaskComment[];
  tasks: Task[];
  members: TeamMember[];
}

/** The latest comments and blocker alerts across the whole project. */
export function ActivityPulse({ comments, tasks, members }: ActivityPulseProps) {
  const openTask = useUiStore((s) => s.openTask);
  const recent = useMemo(
    () => [...comments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, FEED_SIZE),
    [comments]
  );
  const titleOf = (id: string) => tasks.find((t) => t.id === id)?.title ?? 'Deleted task';

  return (
    <section
      aria-labelledby="pulse-heading"
      className="rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 id="pulse-heading" className="flex items-center gap-1.5 border-b border-gray-200 px-4 py-3 text-sm font-semibold dark:border-neutral-800">
        <Activity size={15} aria-hidden /> Recent activity
      </h2>
      {recent.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs text-gray-500 dark:text-neutral-400">No comments yet.</p>
      ) : (
        <ol>
          {recent.map((c) => (
            <li key={c.id} className="border-b border-gray-100 last:border-0 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => openTask(c.taskId)}
                className={`flex w-full gap-2.5 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-neutral-800/60 ${
                  c.tag === 'Blocker' ? 'border-l-2 border-l-red-500' : ''
                }`}
              >
                <Avatar name={c.authorName} email={c.authorEmail} src={c.authorAvatar} size="sm" className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium">{c.authorName}</span>
                    <TagBadge tag={c.tag} />
                    <span className="ml-auto shrink-0 text-gray-400">{timeAgo(c.createdAt)}</span>
                  </span>
                  <span className="block truncate text-[11px] text-gray-500 dark:text-neutral-400">on {titleOf(c.taskId)}</span>
                  <span className="mt-0.5 line-clamp-2 text-xs text-gray-700 dark:text-neutral-300">
                    <MentionText content={c.content} members={members} />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
