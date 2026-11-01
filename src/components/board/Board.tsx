import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useFilteredTasks } from '../../hooks/useFilteredTasks';
import { useMembers } from '../../hooks/useMembers';
import { useUiStore } from '../../store/useUiStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { STATUSES, type TaskStatus } from '../../types/models';
import { BlockerPopover } from './BlockerPopover';
import { Column } from './Column';
import { ColumnTabs } from './ColumnTabs';
import { MoveMenu } from './MoveMenu';

const NO_OVERRIDES: Record<string, TaskStatus> = {};

export function Board() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Card dropped on (or moved to) "Blocked", waiting for the blocker reason
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);
  // Card whose "Move to…" menu is open
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  // Scroll snapping fights drag auto-scroll, so it's paused mid-drag
  const [isDragging, setIsDragging] = useState(false);

  const overrides = useMemo(
    () => (pendingBlockId ? { [pendingBlockId]: 'Blocked' as TaskStatus } : NO_OVERRIDES),
    [pendingBlockId]
  );

  const { columns, isFiltered } = useFilteredTasks(overrides);
  const { byEmail } = useMembers();
  const comments = useWorkspaceStore((s) => s.comments);
  const tasks = useWorkspaceStore((s) => s.tasks);
  const updateTask = useWorkspaceStore((s) => s.updateTask);
  const blockTask = useWorkspaceStore((s) => s.blockTask);
  const selectedTaskId = useUiStore((s) => s.selectedTaskId);
  const openTask = useUiStore((s) => s.openTask);
  const clearFilters = useUiStore((s) => s.clearFilters);

  const commentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of comments) counts.set(c.taskId, (counts.get(c.taskId) ?? 0) + 1);
    return counts;
  }, [comments]);

  const columnCounts = useMemo(
    () => Object.fromEntries(STATUSES.map((s) => [s, columns[s].length])) as Record<TaskStatus, number>,
    [columns]
  );

  /** Shared by drag-and-drop and the "Move to…" menu. */
  const moveTo = useCallback(
    (taskId: string, status: TaskStatus) => {
      if (status === 'Blocked') setPendingBlockId(taskId);
      else updateTask(taskId, { status });
    },
    [updateTask]
  );

  const onDragEnd = useCallback(
    ({ draggableId, source, destination }: DropResult) => {
      setIsDragging(false);
      if (!destination || destination.droppableId === source.droppableId) return;
      moveTo(draggableId, destination.droppableId as TaskStatus);
    },
    [moveTo]
  );

  const pendingTask = pendingBlockId ? tasks.find((t) => t.id === pendingBlockId) : undefined;
  const movingTask = movingTaskId ? tasks.find((t) => t.id === movingTaskId) : undefined;
  const visibleCount = STATUSES.reduce((n, s) => n + columns[s].length, 0);

  return (
    <>
      <ColumnTabs counts={columnCounts} scrollerRef={scrollerRef} />

      {isFiltered && visibleCount === 0 && (
        <p className="px-4 pt-3 text-sm text-gray-500 dark:text-neutral-400">
          No tasks match these filters.{' '}
          <button type="button" onClick={clearFilters} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Clear filters
          </button>
        </p>
      )}

      <DragDropContext onDragStart={() => setIsDragging(true)} onDragEnd={onDragEnd}>
        {/* The only scroll container, in both directions: dnd supports one scroll parent per Droppable */}
        <div
          ref={scrollerRef}
          className={`pb-safe flex min-h-0 flex-1 items-stretch gap-3 overflow-auto scroll-px-3 p-3 sm:p-4 ${
            isDragging ? '' : 'snap-x snap-mandatory lg:snap-none'
          }`}
        >
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={columns[status]}
              membersByEmail={byEmail}
              commentCounts={commentCounts}
              selectedTaskId={selectedTaskId}
              onOpen={openTask}
              onMove={setMovingTaskId}
            />
          ))}
        </div>
      </DragDropContext>

      {movingTask && (
        <MoveMenu
          task={movingTask}
          onClose={() => setMovingTaskId(null)}
          onMove={(status) => {
            setMovingTaskId(null);
            moveTo(movingTask.id, status);
          }}
        />
      )}

      {pendingTask && (
        <BlockerPopover
          taskTitle={pendingTask.title}
          onCancel={() => setPendingBlockId(null)}
          onSubmit={(reason, mentionedEmails, commentText) => {
            blockTask(pendingTask.id, reason, mentionedEmails, commentText);
            setPendingBlockId(null);
          }}
        />
      )}
    </>
  );
}
