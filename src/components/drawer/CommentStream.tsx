import { Fragment, useEffect, useMemo, useRef } from 'react';
import { useMembers } from '../../hooks/useMembers';
import { timeAgo } from '../../lib/dates';
import { toSegments } from '../../lib/mentions';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { TaskComment, TeamMember } from '../../types/models';
import { Avatar } from '../ui/Avatar';
import { TagBadge } from './TagToggle';

/** Comment text with @mentions highlighted as badges. */
export function MentionText({ content, members }: { content: string; members: TeamMember[] }) {
  return (
    <>
      {toSegments(content, members).map((seg, i) =>
        'mention' in seg ? (
          <span
            key={i}
            title={seg.mention.email}
            className="rounded bg-indigo-50 px-0.5 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          >
            @{seg.mention.name}
          </span>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        )
      )}
    </>
  );
}

/** Ids of comments created locally that haven't reached the server yet. */
function usePendingCommentIds(): Set<string> {
  const outbox = useWorkspaceStore((s) => s.outbox);
  return useMemo(() => {
    const ids = new Set<string>();
    for (const { op } of outbox) {
      if (op.action === 'ADD_COMMENT') ids.add(op.payload.id);
      if (op.action === 'UPDATE_TASK' && op.payload.autoComment) ids.add(op.payload.autoComment.id);
    }
    return ids;
  }, [outbox]);
}

function CommentItem({ comment, members, pending }: { comment: TaskComment; members: TeamMember[]; pending: boolean }) {
  const author = members.find((m) => m.email === comment.authorEmail);
  const isBlocker = comment.tag === 'Blocker';

  return (
    <li className={`flex gap-2.5 ${pending ? 'opacity-60' : ''}`}>
      <Avatar name={comment.authorName} email={comment.authorEmail} src={comment.authorAvatar || author?.avatarUrl} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-medium text-gray-900 dark:text-neutral-100">{comment.authorName}</span>
          <TagBadge tag={comment.tag} />
          <time dateTime={comment.createdAt} title={new Date(comment.createdAt).toLocaleString()} className="text-gray-400">
            {pending ? 'Sending…' : timeAgo(comment.createdAt)}
          </time>
        </div>
        <p
          className={`mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-neutral-300 ${
            isBlocker ? 'border-l-2 border-red-400 pl-2' : ''
          }`}
        >
          <MentionText content={comment.content} members={members} />
        </p>
      </div>
    </li>
  );
}

/** Chronological comments for one task; scrolls to the newest one when it arrives. */
export function CommentStream({ taskId }: { taskId: string }) {
  const allComments = useWorkspaceStore((s) => s.comments);
  const { members } = useMembers();
  const pendingIds = usePendingCommentIds();
  const endRef = useRef<HTMLDivElement>(null);

  const comments = useMemo(
    () => allComments.filter((c) => c.taskId === taskId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [allComments, taskId]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [comments.length]);

  if (comments.length === 0) {
    return <p className="py-4 text-center text-xs text-gray-400 dark:text-neutral-500">No comments yet. Post the first update below.</p>;
  }

  return (
    <>
      <ol className="space-y-4" aria-label="Comments">
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} members={members} pending={pendingIds.has(c.id)} />
        ))}
      </ol>
      <div ref={endRef} />
    </>
  );
}
