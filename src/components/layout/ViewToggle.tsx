import { KanbanSquare, LayoutDashboard } from 'lucide-react';
import { useUiStore, type View } from '../../store/useUiStore';

const OPTIONS: { value: View; label: string; icon: typeof KanbanSquare }[] = [
  { value: 'board', label: 'Board', icon: KanbanSquare },
  { value: 'dashboard', label: 'Team Dashboard', icon: LayoutDashboard }
];

/** Segmented control: [ Board View | Team Dashboard ] */
export function ViewToggle() {
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);

  return (
    <div role="tablist" aria-label="View" className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-neutral-900">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = view === value;
        return (
          <button
            key={value}
            role="tab"
            aria-selected={active}
            aria-label={label}
            title={label}
            onClick={() => setView(value)}
            className={`inline-flex h-9 min-w-10 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors sm:h-auto sm:min-w-0 sm:py-1 ${
              active
                ? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Icon size={14} aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
