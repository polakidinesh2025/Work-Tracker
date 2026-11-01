import { demoDomain } from '../config/env';
import type { WorkspaceState } from '../types/api';
import type { Priority, Task, TaskComment, TaskStatus, TeamMember } from '../types/models';

/** Sample data for Local Demo Mode. Names are fictional. */

export const DEMO_USER = {
  email: `you@${demoDomain}`,
  name: 'You (Demo)',
  picture: '',
  role: 'Admin'
};

const day = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString();
const date = (offsetDays: number) => iso(offsetDays).slice(0, 10);

const member = (local: string, name: string, role: string): TeamMember => ({
  email: `${local}@${demoDomain}`,
  name,
  role,
  avatarUrl: '',
  addedAt: iso(-30)
});

const ANANYA = `ananya@${demoDomain}`;
const KABIR = `kabir@${demoDomain}`;
const MEERA = `meera@${demoDomain}`;

const task = (
  id: string,
  title: string,
  status: TaskStatus,
  priority: Priority,
  assigneeEmail: string,
  dueInDays: number | null,
  extra: Partial<Task> = {}
): Task => ({
  id,
  title,
  description: '',
  status,
  priority,
  assigneeEmail,
  dueDate: dueInDays === null ? '' : date(dueInDays),
  blockerReason: '',
  updatedAt: iso(-1),
  createdBy: DEMO_USER.email,
  ...extra
});

const comment = (
  id: string,
  taskId: string,
  authorEmail: string,
  authorName: string,
  tag: TaskComment['tag'],
  content: string,
  hoursAgo: number,
  mentionedEmails: string[] = []
): TaskComment => ({
  id,
  taskId,
  authorEmail,
  authorName,
  authorAvatar: '',
  tag,
  content,
  mentionedEmails,
  createdAt: new Date(Date.now() - hoursAgo * 3_600_000).toISOString()
});

export function createSeedWorkspace(): WorkspaceState {
  return {
    currentUser: DEMO_USER,
    lastSyncedAt: new Date().toISOString(),
    teamMembers: [
      { ...member('you', DEMO_USER.name, 'Admin'), email: DEMO_USER.email },
      member('ananya', 'Ananya Rao', 'Research'),
      member('kabir', 'Kabir Mehta', 'Strategy'),
      member('meera', 'Meera Iyer', 'Design')
    ],
    tasks: [
      task('task-d1', 'Draft client problem statement', 'Done', 'High', DEMO_USER.email, -3),
      task('task-d2', 'Secondary research: market sizing', 'In Progress', 'High', ANANYA, 2, {
        description: 'Top-down and bottom-up TAM for the Indian D2C segment.'
      }),
      task('task-d3', 'Competitor teardown deck', 'In Progress', 'Med', KABIR, 4),
      task('task-d4', 'Survey design for customer interviews', 'Blocked', 'Urgent', MEERA, 1, {
        blockerReason: 'Waiting on the client to share the customer contact list.'
      }),
      task('task-d5', 'Schedule mentor check-in', 'To Do', 'Low', DEMO_USER.email, 6),
      task('task-d6', 'Financial model v1', 'To Do', 'High', KABIR, -1),
      task('task-d7', 'Final presentation storyline', 'Backlog', 'Med', '', null),
      task('task-d8', 'Collect interview transcripts', 'Done', 'Med', ANANYA, -5)
    ],
    comments: [
      comment('cmt-d1', 'task-d2', ANANYA, 'Ananya Rao', 'Update', 'Bottom-up estimate done, top-down 60% there.', 3),
      comment('cmt-d2', 'task-d4', MEERA, 'Meera Iyer', 'Blocker', 'Need the contact list before we can pilot. @You (Demo) can you nudge the client?', 5, [DEMO_USER.email]),
      comment('cmt-d3', 'task-d3', KABIR, 'Kabir Mehta', 'Question', 'Should we include unlisted players in the teardown?', 20),
      comment('cmt-d4', 'task-d1', DEMO_USER.email, DEMO_USER.name, 'Update', 'Shared with the faculty guide for review.', 50)
    ]
  };
}
