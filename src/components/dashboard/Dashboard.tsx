import { useMemo } from 'react';
import { useMembers } from '../../hooks/useMembers';
import { computeDashboard } from '../../lib/workload';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { ActivityPulse } from './ActivityPulse';
import { KpiStrip } from './KpiStrip';
import { MemberCard } from './MemberCard';

/** Team Dashboard: KPIs, one progress card per teammate, and a project-wide activity feed. */
export function Dashboard() {
  const tasks = useWorkspaceStore((s) => s.tasks);
  const comments = useWorkspaceStore((s) => s.comments);
  const { members } = useMembers();

  const stats = useMemo(() => computeDashboard(tasks, comments, members), [tasks, comments, members]);
  const unassigned = tasks.filter((t) => !t.assigneeEmail && t.status !== 'Done').length;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-4 p-4">
        <KpiStrip stats={stats} />

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <section aria-labelledby="team-heading">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 id="team-heading" className="text-sm font-semibold">
                Team progress <span className="font-normal text-gray-400">· {members.length}</span>
              </h2>
              {unassigned > 0 && (
                <span className="text-xs text-gray-500 dark:text-neutral-400">
                  {unassigned} open task{unassigned === 1 ? '' : 's'} unassigned
                </span>
              )}
            </div>
            {stats.members.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-neutral-700">
                Teammates appear here after they sign in for the first time.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {stats.members.map((m) => (
                  <MemberCard key={m.member.email} stats={m} members={members} />
                ))}
              </div>
            )}
          </section>

          <ActivityPulse comments={comments} tasks={tasks} members={members} />
        </div>
      </div>
    </div>
  );
}
