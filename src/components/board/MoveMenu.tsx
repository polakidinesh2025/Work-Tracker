import { Check } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { STATUS_META } from '../../lib/taskMeta';
import { STATUSES, type Task, type TaskStatus } from '../../types/models';
import { Sheet } from '../ui/Sheet';

interface MoveMenuProps {
  task: Task;
  onMove: (status: TaskStatus) => void;
  onClose: () => void;
}

/** "Move to…" list: one tap moves a card, no dragging needed. A bottom sheet on phones. */
export function MoveMenu({ task, onMove, onClose }: MoveMenuProps) {
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => currentRef.current?.focus(), []);

  return (
    <Sheet onClose={onClose} labelledBy="move-title" placement="bottom" maxWidth="sm:max-w-xs">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-neutral-800">
        <h2 id="move-title" className="text-sm font-semibold">
          Move to…
        </h2>
        <p className="truncate text-xs text-gray-500 dark:text-neutral-400">{task.title}</p>
      </div>
      <ul className="py-1">
        {STATUSES.map((status) => {
          const current = status === task.status;
          return (
            <li key={status}>
              <button
                ref={current ? currentRef : undefined}
                type="button"
                aria-current={current || undefined}
                onClick={() => (current ? onClose() : onMove(status))}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    onClose();
                  }
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none sm:py-2 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[status].dot}`} aria-hidden />
                <span className={current ? 'font-semibold' : ''}>{status}</span>
                {status === 'Blocked' && !current && (
                  <span className="text-xs text-gray-400 dark:text-neutral-500">asks for a reason</span>
                )}
                {current && <Check size={15} className="ml-auto text-gray-500" aria-label="Current column" />}
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
