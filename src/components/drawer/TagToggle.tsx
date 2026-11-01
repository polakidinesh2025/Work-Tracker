import { TAG_META } from '../../lib/taskMeta';
import { COMMENT_TAGS, type CommentTag } from '../../types/models';

/** Inline tag label used in the comment stream, mentions inbox and activity feed. */
export function TagBadge({ tag }: { tag: CommentTag }) {
  if (tag === 'General') return null;
  return (
    <span className={`rounded px-1.5 py-px text-[10px] font-semibold ring-1 ring-inset ${TAG_META[tag]?.className ?? ''}`}>
      {tag}
    </span>
  );
}

/** One-click context tag for a new comment: [Update] [Blocker] [Question]. Clicking again clears it. */
export function TagToggle({ value, onChange }: { value: CommentTag; onChange: (tag: CommentTag) => void }) {
  return (
    <div role="radiogroup" aria-label="Comment tag" className="flex items-center gap-1">
      {COMMENT_TAGS.filter((t) => t !== 'General').map((tag) => {
        const active = value === tag;
        return (
          <button
            key={tag}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? 'General' : tag)}
            className={`h-10 rounded px-2.5 text-xs font-medium transition-colors sm:h-auto sm:px-1.5 sm:py-0.5 sm:text-[11px] ${
              active
                ? `ring-1 ring-inset ${TAG_META[tag].className}`
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
