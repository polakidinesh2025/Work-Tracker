import { Droppable } from '@hello-pangea/dnd';
import { STATUS_META } from '../../lib/taskMeta';
import type { Task, TaskStatus, TeamMember } from '../../types/models';
import { QuickAdd } from './QuickAdd';
import { TaskCard } from './TaskCard';

export const columnDomId = (status: TaskStatus) => `column-${status.replace(/\s+/g, '-').toLowerCase()}`;

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  membersByEmail: Map<string, TeamMember>;
  commentCounts: Map<string, number>;
  selectedTaskId: string | null;
  onOpen: (taskId: string) => void;
  onMove: (taskId: string) => void;
}

export function Column({ status, tasks, membersByEmail, commentCounts, selectedTaskId, onOpen, onMove }: ColumnProps) {
  const meta = STATUS_META[status];

  return (
    <section
      id={columnDomId(status)}
      data-status={status}
      aria-label={status}
      // Phones: ~one column per screen with the next one peeking; it snaps into place when swiping
      className="flex h-fit min-h-full w-[85vw] max-w-[340px] shrink-0 snap-center flex-col rounded-xl bg-gray-50 sm:w-[272px] lg:w-auto lg:min-w-[200px] lg:max-w-none lg:flex-1 dark:bg-neutral-900/50"
    >
      <header className="flex items-center gap-2 px-3 pb-1 pt-3">
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden />
        <h2 className="text-xs font-semibold text-gray-700 dark:text-neutral-200">{status}</h2>
        <span className="text-xs tabular-nums text-gray-400">{tasks.length}</span>
      </header>

      <div className="px-2">
        <QuickAdd status={status} />
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[120px] flex-1 rounded-b-xl px-2 pb-2 transition-colors ${
              snapshot.isDraggingOver ? (status === 'Blocked' ? 'bg-red-50 dark:bg-red-950/40' : 'bg-gray-100 dark:bg-neutral-800/50') : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                assignee={membersByEmail.get(task.assigneeEmail.toLowerCase())}
                commentCount={commentCounts.get(task.id) ?? 0}
                selected={selectedTaskId === task.id}
                onOpen={onOpen}
                onMove={onMove}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="px-2 py-6 text-center text-xs text-gray-400 dark:text-neutral-500">No tasks</p>
            )}
          </div>
        )}
      </Droppable>
    </section>
  );
}
