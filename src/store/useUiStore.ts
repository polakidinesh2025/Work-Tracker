import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Priority, TaskStatus } from '../types/models';

export type View = 'board' | 'dashboard';

/** 'all', 'me', or a teammate's email. */
export type AssigneeFilter = string;

interface UiState {
  view: View;
  selectedTaskId: string | null;
  isSearchOpen: boolean;
  assigneeFilter: AssigneeFilter;
  priorityFilter: Priority | 'all';
  query: string;
  /** ISO time the mentions inbox was last opened, for the unread badge. */
  mentionsSeenAt: string | null;
  /** Column whose quick-add input should take focus (set by the "N" shortcut). */
  quickAddFocus: TaskStatus | null;

  setView: (view: View) => void;
  openTask: (taskId: string) => void;
  closeTask: () => void;
  setSearchOpen: (open: boolean) => void;
  setAssigneeFilter: (filter: AssigneeFilter) => void;
  setPriorityFilter: (filter: Priority | 'all') => void;
  setQuery: (query: string) => void;
  markMentionsSeen: () => void;
  setQuickAddFocus: (status: TaskStatus | null) => void;
  clearFilters: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      view: 'board',
      selectedTaskId: null,
      isSearchOpen: false,
      assigneeFilter: 'all',
      priorityFilter: 'all',
      query: '',
      mentionsSeenAt: null,
      quickAddFocus: null,

      setView: (view) => set({ view }),
      openTask: (selectedTaskId) => set({ selectedTaskId, isSearchOpen: false }),
      closeTask: () => set({ selectedTaskId: null }),
      setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
      setAssigneeFilter: (assigneeFilter) => set({ assigneeFilter }),
      setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
      setQuery: (query) => set({ query }),
      markMentionsSeen: () => set({ mentionsSeenAt: new Date().toISOString() }),
      setQuickAddFocus: (quickAddFocus) => set({ quickAddFocus, view: 'board' }),
      clearFilters: () => set({ assigneeFilter: 'all', priorityFilter: 'all', query: '' })
    }),
    {
      name: 'tasklite-ui',
      storage: createJSONStorage(() => localStorage),
      // Remember preferences, not transient UI like an open drawer
      partialize: (s) => ({
        view: s.view,
        assigneeFilter: s.assigneeFilter,
        priorityFilter: s.priorityFilter,
        mentionsSeenAt: s.mentionsSeenAt
      })
    }
  )
);
