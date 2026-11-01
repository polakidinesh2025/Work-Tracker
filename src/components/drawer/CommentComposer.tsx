import { SendHorizontal } from 'lucide-react';
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useMembers } from '../../hooks/useMembers';
import { isTouchDevice } from '../../lib/device';
import { extractMentionEmails, filterMembers, getMentionQuery, insertMention, type MentionQuery } from '../../lib/mentions';
import { useAuthStore } from '../../store/useAuthStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CommentTag, TeamMember } from '../../types/models';
import { MentionPicker } from './MentionPicker';
import { TagToggle } from './TagToggle';

const PICKER_ID = 'mention-picker';

/** Comment box with one-click tags and "@" teammate autocomplete. */
export function CommentComposer({ taskId }: { taskId: string }) {
  const [text, setText] = useState('');
  const [tag, setTag] = useState<CommentTag>('General');
  const [mention, setMention] = useState<MentionQuery | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const addComment = useWorkspaceStore((s) => s.addComment);
  const myEmail = useAuthStore((s) => s.user?.email);
  const { members } = useMembers();

  const options = useMemo(
    () => (mention ? filterMembers(members, mention.query, myEmail) : []),
    [mention, members, myEmail]
  );
  const pickerOpen = options.length > 0;

  const updateMention = (value: string, caret: number) => {
    setMention(getMentionQuery(value, caret));
    setActiveIndex(0);
  };

  const choose = (member: TeamMember) => {
    const el = inputRef.current;
    if (!el || !mention) return;
    const next = insertMention(text, mention, el.selectionStart, member);
    setText(next.text);
    setMention(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.caret, next.caret);
    });
  };

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    addComment({ taskId, content, tag, mentionedEmails: extractMentionEmails(content, members) });
    setText('');
    setTag('General');
    setMention(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (pickerOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const step = e.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex((i) => (i + step + options.length) % options.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        choose(options[activeIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.stopPropagation(); // close the picker, not the drawer
        setMention(null);
        return;
      }
    }
    // On phones Enter adds a new line (as on-screen keyboards suggest); the button sends
    if (e.key === 'Enter' && !e.shiftKey && !isTouchDevice()) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="pb-safe border-t border-gray-200 px-3 pt-3 sm:pb-3 dark:border-neutral-800">
      <div className="relative">
        {pickerOpen && (
          <MentionPicker id={PICKER_ID} options={options} activeIndex={activeIndex} onSelect={choose} onHover={setActiveIndex} />
        )}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            updateMention(e.target.value, e.target.selectionStart);
          }}
          onKeyDown={onKeyDown}
          onClick={(e) => updateMention(e.currentTarget.value, e.currentTarget.selectionStart)}
          onBlur={() => setMention(null)}
          rows={2}
          maxLength={5000}
          placeholder="Write an update… type @ to mention a teammate"
          aria-label="New comment"
          aria-autocomplete="list"
          aria-controls={pickerOpen ? PICKER_ID : undefined}
          aria-activedescendant={pickerOpen ? `${PICKER_ID}-${activeIndex}` : undefined}
          className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-500"
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <TagToggle value={tag} onChange={setTag} />
        <span className="ml-auto hidden text-[11px] text-gray-400 sm:inline touch:hidden">Enter to send</span>
        <button
          type="button"
          // preventDefault keeps the keyboard open on phones so several updates can be sent in a row
          onMouseDown={(e) => e.preventDefault()}
          onClick={submit}
          disabled={!text.trim()}
          className="ml-auto inline-flex h-10 items-center gap-1 rounded-md bg-gray-900 px-3.5 text-sm font-medium sm:ml-0 sm:h-auto sm:px-2.5 sm:py-1 sm:text-xs text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-gray-900 dark:hover:bg-neutral-200"
        >
          <SendHorizontal size={13} aria-hidden />
          Comment
        </button>
      </div>
    </div>
  );
}
