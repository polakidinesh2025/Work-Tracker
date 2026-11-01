import { PRIORITY_META } from '../../lib/taskMeta';
import type { Priority } from '../../types/models';

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.Med;
  return (
    <span className={`rounded px-1.5 py-px text-[10px] font-medium ring-1 ring-inset ${meta.className}`}>
      {priority}
    </span>
  );
}
