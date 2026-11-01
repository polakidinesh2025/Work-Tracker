import { OctagonAlert, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMembers } from '../../hooks/useMembers';
import { useAuthStore } from '../../store/useAuthStore';
import { Avatar } from '../ui/Avatar';
import { Sheet } from '../ui/Sheet';

interface BlockerPopoverProps {
  taskTitle: string;
  /** commentText is the reason plus the @Name tags, for the [Blocker] comment. */
  onSubmit: (reason: string, mentionedEmails: string[], commentText: string) => void;
  onCancel: () => void;
}

/**
 * Shown when a card is dropped on "Blocked". Submitting sets blockerReason and
 * posts a [Blocker] comment; tagged teammates get an email alert.
 */
export function BlockerPopover({ taskTitle, onSubmit, onCancel }: BlockerPopoverProps) {
  const [reason, setReason] = useState('');
  const [tagged, setTagged] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { members } = useMembers();
  const myEmail = useAuthStore((s) => s.user?.email);
  const helpers = members.filter((m) => m.email !== myEmail);

  useEffect(() => textareaRef.current?.focus(), []);

  const toggle = (email: string) =>
    setTagged((prev) => (prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]));

  const submit = () => {
    const clean = reason.trim();
    if (!clean) return;
    const names = members.filter((m) => tagged.includes(m.email)).map((m) => `@${m.name}`);
    onSubmit(clean, tagged, names.length ? `${clean}\n${names.join(' ')}` : clean);
  };

  return (
    <Sheet onClose={onCancel} labelledBy="blocker-title">
      <div className="p-4">
        <div className="mb-3 flex items-start gap-2">
          <OctagonAlert size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 id="blocker-title" className="text-sm font-semibold">What is blocking this, and @who can help?</h2>
            <p className="truncate text-xs text-gray-500 dark:text-neutral-400">{taskTitle}</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cancel" className="rounded p-0.5 text-gray-400 hover:text-gray-700">
            <X size={16} aria-hidden />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            } else if (e.key === 'Escape') {
              e.stopPropagation();
              onCancel();
            }
          }}
          rows={3}
          maxLength={1000}
          placeholder="e.g. Waiting on the client's data export"
          className="w-full resize-none rounded-md border border-gray-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 dark:border-neutral-700 dark:bg-neutral-950"
        />

        {helpers.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs text-gray-500 dark:text-neutral-400">Who can help? (they'll get an email)</p>
            <div className="flex flex-wrap gap-1.5">
              {helpers.map((m) => {
                const on = tagged.includes(m.email);
                return (
                  <button
                    key={m.email}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(m.email)}
                    className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs transition-colors sm:py-0.5 sm:pl-0.5 sm:pr-2.5 ${
                      on
                        ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Avatar name={m.name} email={m.email} src={m.avatarUrl} size="xs" />@{m.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <span className="mr-auto text-[11px] text-gray-400 touch:invisible">Enter to submit · Shift+Enter for new line</span>
          <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!reason.trim()}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark blocked
          </button>
        </div>
      </div>
    </Sheet>
  );
}
