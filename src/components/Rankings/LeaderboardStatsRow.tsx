import React from 'react';
import { Users, CheckCircle2, Building2 } from 'lucide-react';

export type StatCard = {
  label: string;
  value: string | number;
  detail?: string;
  icon?: 'users' | 'check' | 'hub';
};

type Props = {
  stats: StatCard[];
};

const iconMap = {
  users: Users,
  check: CheckCircle2,
  hub: Building2,
};

export const LeaderboardStatsRow: React.FC<Props> = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {stats.map((s) => {
      const Icon = s.icon ? iconMap[s.icon] : Users;
      return (
        <div
          key={s.label}
          className="rounded-[16px] bg-white border border-[rgba(0,82,204,0.06)] p-4 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0">
            <Icon size={18} className="text-[#0052CC]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.value}</p>
            {s.detail && <p className="text-xs text-gray-500 mt-0.5">{s.detail}</p>}
          </div>
        </div>
      );
    })}
  </div>
);

export default LeaderboardStatsRow;
