import type { TeamMember } from '../../types/models';
import { Avatar } from '../ui/Avatar';

interface MentionPickerProps {
  id: string;
  options: TeamMember[];
  activeIndex: number;
  onSelect: (member: TeamMember) => void;
  onHover: (index: number) => void;
}

/** Floating teammate list shown while typing "@" in the comment box. */
export function MentionPicker({ id, options, activeIndex, onSelect, onHover }: MentionPickerProps) {
  if (options.length === 0) return null;

  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Mention a teammate"
      className="absolute bottom-full left-0 z-10 mb-1 w-full max-w-xs overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
    >
      {options.map((m, i) => (
        <li
          key={m.email}
          id={`${id}-${i}`}
          role="option"
          aria-selected={i === activeIndex}
          // mousedown, not click, so the textarea keeps focus
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(m);
          }}
          onMouseEnter={() => onHover(i)}
          className={`flex cursor-pointer items-center gap-2 px-2.5 py-2.5 text-sm sm:py-1.5 ${
            i === activeIndex ? 'bg-gray-100 dark:bg-neutral-800' : ''
          }`}
        >
          <Avatar name={m.name} email={m.email} src={m.avatarUrl} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{m.name}</span>
            <span className="block truncate text-[11px] text-gray-500 dark:text-neutral-400">{m.email}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
