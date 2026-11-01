import { AlarmClock, CheckCircle2, ListTodo, OctagonAlert } from 'lucide-react';
import type { DashboardStats } from '../../lib/workload';

interface KpiProps {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof ListTodo;
  /** Red emphasis for numbers that need attention. */
  alert?: boolean;
}

function Kpi({ label, value, detail, icon: Icon, alert }: KpiProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        alert
          ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50'
          : 'border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
      }`}
    >
      <p className={`flex items-center gap-1.5 text-xs font-medium ${alert ? 'text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-neutral-400'}`}>
        <Icon size={14} aria-hidden />
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${alert ? 'text-red-700 dark:text-red-300' : ''}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">{detail}</p>
    </div>
  );
}

export function KpiStrip({ stats }: { stats: DashboardStats }) {
  return (
    <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Active tasks" value={stats.activeTasks} detail="To Do, In Progress, Blocked" icon={ListTodo} />
      <Kpi
        label="Completion rate"
        value={`${stats.completionRate}%`}
        detail={`${stats.doneTasks} of ${stats.committedTasks} done (excl. Backlog)`}
        icon={CheckCircle2}
      />
      <Kpi
        label="Blocked"
        value={stats.blockedTasks}
        detail={stats.blockedTasks ? 'Need someone to unblock' : 'Nothing blocked'}
        icon={OctagonAlert}
        alert={stats.blockedTasks > 0}
      />
      <Kpi
        label="Overdue"
        value={stats.overdueTasks}
        detail={stats.overdueTasks ? 'Past due and not done' : 'All on schedule'}
        icon={AlarmClock}
        alert={stats.overdueTasks > 0}
      />
    </section>
  );
}
