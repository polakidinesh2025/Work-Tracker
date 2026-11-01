import { AtSign, Bell } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMembers } from '../../hooks/useMembers';
import { timeAgo } from '../../lib/dates';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { MentionText } from '../drawer/CommentStream';
import { TagBadge } from '../drawer/TagToggle';
import { Avatar } from '../ui/Avatar';
import { ICON_BUTTON } from '../ui/styles';

const MAX_ITEMS = 30;

/** Navbar inbox of comments where the signed-in user was @mentioned. */
export function MentionsBell() {
  const [open, setOpen] = useState(false);
  // seenAt from before this opening, so new items stay highlighted while the panel is open
  const [highlightAfter, setHighlightAfter] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const myEmail = useAuthStore((s) => s.user?.email ?? '');
  const comments = useWorkspaceStore((s) => s.comments);
  const tasks = useWorkspaceStore((s) => s.tasks);
  const seenAt = useUiStore((s) => s.mentionsSeenAt);
  const { members } = useMembers();

  const mentions = useMemo(
    () =>
      comments
        .filter((c) => c.authorEmail !== myEmail && c.mentionedEmails.includes(myEmail))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, MAX_ITEMS),
    [comments, myEmail]
  );
  const unread = mentions.filter((c) => !seenAt || c.createdAt > seenAt).length;
  const taskTitle = (id: string) => tasks.find((t) => t.id === id)?.title ?? 'Deleted task';

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      setHighlightAfter(seenAt);
      useUiStore.getState().markMentionsSeen();
    }
    setOpen(!open);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unread ? `Mentions, ${unread} unread` : 'Mentions'}
        title="Mentions"
        className={`relative ${ICON_BUTTON}`}
      >
        <Bell size={16} aria-hidden />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex sm:-right-0.5 sm:-top-0.5 h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        // Phones: pinned under the navbar edge to edge; larger screens: dropdown under the bell
        <div className="fixed inset-x-3 top-[calc(3.75rem+env(safe-area-inset-top))] z-50 overflow-hidden sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-1 sm:w-[22rem] rounded-xl border border-gray-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <p className="flex items-center gap-1.5 border-b border-gray-200 px-3 py-2 text-xs font-semibold dark:border-neutral-800">
            <AtSign size={13} aria-hidden /> Mentions
          </p>
          {mentions.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-gray-500 dark:text-neutral-400">
              When a teammate @mentions you, it shows up here.
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {mentions.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      useUiStore.getState().setView('board');
                      useUiStore.getState().openTask(c.taskId);
                      setOpen(false);
                    }}
                    className={`flex w-full gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-neutral-800 ${
                      highlightAfter && c.createdAt <= highlightAfter ? '' : 'bg-indigo-50/50 dark:bg-indigo-950/30'
                    }`}
                  >
                    <Avatar name={c.authorName} email={c.authorEmail} src={c.authorAvatar} size="sm" className="mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="font-medium">{c.authorName}</span>
                        <TagBadge tag={c.tag} />
                        <span className="ml-auto shrink-0 text-gray-400">{timeAgo(c.createdAt)}</span>
                      </span>
                      <span className="block truncate text-[11px] text-gray-500 dark:text-neutral-400">on {taskTitle(c.taskId)}</span>
                      <span className="mt-0.5 line-clamp-2 text-xs text-gray-700 dark:text-neutral-300">
                        <MentionText content={c.content} members={members} />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
