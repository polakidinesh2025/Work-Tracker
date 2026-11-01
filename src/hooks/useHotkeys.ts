import { useEffect } from 'react';
import { useUiStore } from '../store/useUiStore';

export const SEARCH_INPUT_ID = 'board-search';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Global keyboard shortcuts:
 *   Ctrl/Cmd+K  open command palette      /  focus board search
 *   N           new task in "To Do"       Esc close palette / deselect
 */
export function useHotkeys() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ui = useUiStore.getState();

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ui.setSearchOpen(!ui.isSearchOpen);
        return;
      }
      if (e.key === 'Escape') {
        // In the drawer, the first Esc leaves the field (saving its draft on blur); the next one closes it
        if (ui.isSearchOpen) ui.setSearchOpen(false);
        else if (isTyping(e.target)) (e.target as HTMLElement).blur();
        else if (ui.selectedTaskId) ui.closeTask();
        return;
      }
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey || ui.isSearchOpen) return;

      if (e.key === '/') {
        e.preventDefault();
        ui.setView('board');
        requestAnimationFrame(() => document.getElementById(SEARCH_INPUT_ID)?.focus());
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        ui.setQuickAddFocus('To Do');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
