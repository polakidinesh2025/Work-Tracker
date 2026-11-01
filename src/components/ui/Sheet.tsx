import type { ReactNode } from 'react';

interface SheetProps {
  onClose: () => void;
  /** Accessible name, or the id of a heading inside. */
  label?: string;
  labelledBy?: string;
  /**
   * Where it sits on phones. 'bottom' slides up from the bottom edge (good for menus);
   * 'top' stays near the top so the on-screen keyboard can't cover a text field.
   * On larger screens both are centered dialogs.
   */
  placement?: 'bottom' | 'top';
  /** Tailwind max-width class applied from the sm breakpoint up. */
  maxWidth?: string;
  children: ReactNode;
}

const OVERLAY = {
  bottom: 'items-end',
  top: 'items-start px-3 pt-[max(0.75rem,env(safe-area-inset-top))]'
};
const PANEL = {
  bottom: 'animate-sheet-up rounded-t-2xl pb-safe sm:animate-none sm:pb-0',
  top: 'rounded-xl'
};

/** Modal dialog that becomes a full-width sheet on phones. */
export function Sheet({ onClose, label, labelledBy, placement = 'top', maxWidth = 'sm:max-w-md', children }: SheetProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/30 sm:items-start sm:px-4 sm:pt-[12vh] ${OVERLAY[placement]}`}
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-labelledby={labelledBy}
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-full overflow-hidden border border-gray-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-xl ${maxWidth} ${PANEL[placement]}`}
      >
        {children}
      </div>
    </div>
  );
}
