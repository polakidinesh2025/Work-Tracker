import { Draggable } from '@hello-pangea/dnd';
import { ArrowRightLeft, CalendarDays, MessageSquare, OctagonAlert } from 'lucide-react';
import { memo, useEffect, useRef } from 'react';
import { formatDue, isOverdue } from '../../lib/dates';
import type { Task, TeamMember } from '../../types/models';
import { Avatar } from '../ui/Avatar';
import { PriorityBadge } from '../ui/PriorityBadge';

interface TaskCardProps {
  task: Task;
  index: number;
  assignee?: TeamMember;
  commentCount: number;
  selected: boolean;
  onOpen: (taskId: string) => void;
  /** Opens the "Move to…" menu — the touch-friendly alternative to dragging. */
  onMove: (taskId: string) => void;
}

export const TaskCard = memo(function TaskCard({ task, index, assignee, commentCount, selected, onOpen, onMove }: TaskCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const overdue = isOverdue(task.dueDate, task.status);
  const isBlocked = task.status === 'Blocked';

  // Bring a card picked from the command palette into view
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected]);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={(el) => {
            provided.innerRef(el);
            ref.current = el;
          }}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          role="button"
          tabIndex={0}
          aria-label={`${task.title}, ${task.priority} priority`}
          onClick={() => onOpen(task.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onOpen(task.id);
          }}
          className={`group mb-2 cursor-pointer rounded-lg border bg-white p-2.5 text-left shadow-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-neutral-900 ${
            snapshot.isDragging ? 'rotate-1 shadow-lg ring-1 ring-gray-300 dark:ring-neutral-600' : 'hover:shadow'
          } ${selected ? 'border-indigo-400 ring-2 ring-indigo-200 dark:border-indigo-500 dark:ring-indigo-900' : 'border-gray-200 dark:border-neutral-800'} ${
            isBlocked ? 'border-l-2 border-l-red-500' : ''
          }`}
        >
          <p className="text-[13px] font-medium leading-snug text-gray-900 dark:text-neutral-100">{task.title}</p>

          {isBlocked && task.blockerReason && (
            <p className="mt-1.5 flex items-start gap-1 text-xs text-red-700 dark:text-red-400">
              <OctagonAlert size={12} className="mt-px shrink-0" aria-hidden />
              <span className="line-clamp-2">{task.blockerReason}</span>
            </p>
          )}

          <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500 dark:text-neutral-400">
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-0.5 ${overdue ? 'font-medium text-red-600 dark:text-red-400' : ''}`}
                title={overdue ? `Overdue (due ${task.dueDate})` : `Due ${task.dueDate}`}
              >
                <CalendarDays size={11} aria-hidden />
                {formatDue(task.dueDate)}
              </span>
            )}
            {commentCount > 0 && (
              <span className="inline-flex items-center gap-0.5" title={`${commentCount} comments`}>
                <MessageSquare size={11} aria-hidden />
                {commentCount}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMove(task.id);
              }}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label={`Move ${task.title} to another column`}
              title="Move to…"
              className="-my-1.5 ml-auto inline-flex h-8 w-8 items-center touch:-my-2 touch:h-10 touch:w-10 justify-center rounded-md text-gray-400 opacity-0 hover:bg-gray-100 hover:text-gray-700 focus-visible:opacity-100 group-hover:opacity-100 touch:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              <ArrowRightLeft size={14} aria-hidden />
            </button>
            <span>
              {assignee ? (
                <Avatar name={assignee.name} email={assignee.email} src={assignee.avatarUrl} size="xs" />
              ) : task.assigneeEmail ? (
                <Avatar name={task.assigneeEmail} size="xs" />
              ) : (
                <span className="text-[10px] text-gray-400">Unassigned</span>
              )}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
});
