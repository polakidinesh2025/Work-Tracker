import { OctagonAlert } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useMembers } from '../../hooks/useMembers';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { PRIORITIES, STATUSES, type Priority, type Task, type TaskStatus } from '../../types/models';

const fieldClass =
  'w-full rounded-md border border-transparent bg-transparent px-2 py-2 text-sm outline-none sm:py-1 hover:border-gray-200 focus:border-gray-300 focus:bg-white dark:hover:border-neutral-700 dark:focus:border-neutral-600 dark:focus:bg-neutral-950';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-neutral-400">{label}</span>
      {children}
    </div>
  );
}

/** Text that saves on blur (or Enter for single-line), only when it actually changed. */
function useDraft(value: string, save: (next: string) => void, required = false) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    const next = draft.trim();
    if (next !== value.trim() && (next || !required)) save(next);
    else setDraft(value);
  };
  return { draft, setDraft, commit };
}

interface TaskFieldsProps {
  task: Task;
  /** Moving to Blocked needs a reason, so the drawer opens the blocker prompt. */
  onRequestBlock: () => void;
}

export function TaskFields({ task, onRequestBlock }: TaskFieldsProps) {
  const updateTask = useWorkspaceStore((s) => s.updateTask);
  const { members } = useMembers();
  const set = (changes: Parameters<typeof updateTask>[1]) => updateTask(task.id, changes);

  const title = useDraft(task.title, (next) => set({ title: next }), true);
  const description = useDraft(task.description, (next) => set({ description: next }));
  const assigneeKnown = !task.assigneeEmail || members.some((m) => m.email === task.assigneeEmail);

  return (
    <div className="space-y-3">
      <textarea
        value={title.draft}
        onChange={(e) => title.setDraft(e.target.value.replace(/\n/g, ' '))}
        onBlur={title.commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        rows={1}
        maxLength={200}
        aria-label="Task title"
        className={`${fieldClass} resize-none text-lg font-semibold [field-sizing:content]`}
      />

      {task.status === 'Blocked' && (
        <div role="note" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <OctagonAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Blocked</p>
            <p className="whitespace-pre-wrap text-red-700 dark:text-red-300">{task.blockerReason || 'No reason given.'}</p>
          </div>
          <button type="button" onClick={onRequestBlock} className="shrink-0 text-xs font-medium underline-offset-2 hover:underline">
            Update
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        <Row label="Status">
          <select
            value={task.status}
            onChange={(e) => {
              const status = e.target.value as TaskStatus;
              if (status === 'Blocked') onRequestBlock();
              else set({ status });
            }}
            className={fieldClass}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Row>
        <Row label="Priority">
          <select value={task.priority} onChange={(e) => set({ priority: e.target.value as Priority })} className={fieldClass}>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Row>
        <Row label="Assignee">
          <select value={task.assigneeEmail} onChange={(e) => set({ assigneeEmail: e.target.value })} className={fieldClass}>
            <option value="">Unassigned</option>
            {!assigneeKnown && <option value={task.assigneeEmail}>{task.assigneeEmail}</option>}
            {members.map((m) => (
              <option key={m.email} value={m.email}>
                {m.name}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Due date">
          <input
            type="date"
            value={task.dueDate}
            onChange={(e) => set({ dueDate: e.target.value })}
            className={`${fieldClass} [color-scheme:light] dark:[color-scheme:dark]`}
          />
        </Row>
      </div>

      <div>
        <p className="mb-1 px-2 text-xs text-gray-500 dark:text-neutral-400">Description</p>
        <textarea
          value={description.draft}
          onChange={(e) => description.setDraft(e.target.value)}
          onBlur={description.commit}
          rows={4}
          maxLength={5000}
          placeholder="Add details, links, acceptance criteria…"
          className={`${fieldClass} resize-y border-gray-200 dark:border-neutral-800`}
        />
      </div>
    </div>
  );
}
