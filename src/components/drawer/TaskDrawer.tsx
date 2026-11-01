import { ChevronLeft, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useVisualViewport } from '../../hooks/useVisualViewport';
import { timeAgo } from '../../lib/dates';
import { STATUS_META } from '../../lib/taskMeta';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { BlockerPopover } from '../board/BlockerPopover';
import { ICON_BUTTON } from '../ui/styles';
import { CommentComposer } from './CommentComposer';
import { CommentStream } from './CommentStream';
import { TaskFields } from './TaskFields';

/** Right-hand slide-over: editable task fields on top, comment thread below. */
export function TaskDrawer() {
  const taskId = useUiStore((s) => s.selectedTaskId);
  const task = useWorkspaceStore((s) => (taskId ? s.tasks.find((t) => t.id === taskId) : undefined));
  const closeTask = useUiStore((s) => s.closeTask);

  // The task was deleted (here or by a teammate): close instead of showing an empty drawer
  useEffect(() => {
    if (taskId && !task) closeTask();
  }, [taskId, task, closeTask]);

  if (!task) return null;
  return <DrawerPanel key={task.id} taskId={task.id} onClose={closeTask} />;
}

function DrawerPanel({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const task = useWorkspaceStore((s) => s.tasks.find((t) => t.id === taskId))!;
  const blockTask = useWorkspaceStore((s) => s.blockTask);
  const deleteTask = useWorkspaceStore((s) => s.deleteTask);
  const user = useAuthStore((s) => s.user);
  const [askingBlocker, setAskingBlocker] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const viewport = useVisualViewport();

  // Move focus into the drawer, and back to whatever opened it on close
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  const canDelete = user && (task.createdBy === user.email || user.role === 'Admin');

  const onDelete = () => {
    if (!window.confirm(`Delete "${task.title}" and its comments? This can't be undone.`)) return;
    deleteTask(task.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/10 dark:bg-black/40" onMouseDown={onClose} aria-hidden />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Task: ${task.title}`}
        // Full-screen on phones; sized to the visible area so the keyboard never hides the comment box
        style={viewport ? { top: viewport.offsetTop, height: viewport.height } : undefined}
        className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl animate-slide-in flex-col border-gray-200 bg-white shadow-2xl outline-none sm:border-l dark:border-neutral-800 dark:bg-neutral-950"
      >
        <header className="pt-safe flex items-center gap-2 border-b border-gray-200 px-2 py-1 sm:px-4 sm:py-2.5 dark:border-neutral-800">
          {/* Phones: a clear "back" control where thumbs expect it */}
          <button type="button" onClick={onClose} aria-label="Back to board" className={`${ICON_BUTTON} sm:hidden`}>
            <ChevronLeft size={20} aria-hidden />
          </button>
          <span className={`h-2 w-2 rounded-full ${STATUS_META[task.status]?.dot ?? ''}`} aria-hidden />
          <span className="text-xs text-gray-500 dark:text-neutral-400">
            {task.status} · updated {timeAgo(task.updatedAt)}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                title="Delete task"
                aria-label="Delete task"
                className={`${ICON_BUTTON} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950`}
              >
                <Trash2 size={15} aria-hidden />
              </button>
            )}
            <button type="button" onClick={onClose} title="Close (Esc)" aria-label="Close" className={`${ICON_BUTTON} hidden sm:inline-flex`}>
              <X size={16} aria-hidden />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <section className="p-4">
            <TaskFields task={task} onRequestBlock={() => setAskingBlocker(true)} />
          </section>
          <section className="border-t border-gray-200 p-4 dark:border-neutral-800" aria-labelledby="comments-heading">
            <h3 id="comments-heading" className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
              Activity
            </h3>
            <CommentStream taskId={task.id} />
          </section>
        </div>

        <CommentComposer taskId={task.id} />
      </aside>

      {askingBlocker && (
        <BlockerPopover
          taskTitle={task.title}
          onCancel={() => setAskingBlocker(false)}
          onSubmit={(reason, mentionedEmails, commentText) => {
            blockTask(task.id, reason, mentionedEmails, commentText);
            setAskingBlocker(false);
          }}
        />
      )}
    </>
  );
}
