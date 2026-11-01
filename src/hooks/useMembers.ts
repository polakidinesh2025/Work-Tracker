import { useMemo } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import type { TeamMember } from '../types/models';

/** Team members sorted by name, plus an email -> member lookup. */
export function useMembers() {
  const teamMembers = useWorkspaceStore((s) => s.teamMembers);
  return useMemo(() => {
    const members = [...teamMembers].sort((a, b) => a.name.localeCompare(b.name));
    const byEmail = new Map<string, TeamMember>(members.map((m) => [m.email.toLowerCase(), m]));
    return { members, byEmail };
  }, [teamMembers]);
}
