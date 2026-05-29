import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Trophy } from 'lucide-react';
import {
  attendanceAnalyticsService,
  type DateRange,
} from '../../services/attendanceAnalyticsService';
import type { HubMonthlyRankingRow } from '../../types/notifications';
import { LeaderboardStatsRow } from './LeaderboardStatsRow';
import { LeaderboardPodium, type PodiumEntry } from './LeaderboardPodium';
import { LeaderboardTable } from './LeaderboardTable';

type Props = {
  range: DateRange;
};

function hubToPodium(rows: HubMonthlyRankingRow[]): PodiumEntry[] {
  return rows.slice(0, 3).map((r) => ({
    rank: r.rank,
    id: r.hubId,
    name: r.hubName,
    rate: r.attendanceRate,
    primaryStat: `${r.enrolled} students enrolled`,
    secondaryStats: [
      { label: 'Present', value: r.present },
      { label: 'Late', value: r.late },
    ],
  }));
}

export const HubLeaderboardSection: React.FC<Props> = ({ range }) => {
  const [rows, setRows] = useState<HubMonthlyRankingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    attendanceAnalyticsService
      .getHubMonthlyRankings(range)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const totalEnrolled = rows.reduce((s, r) => s + r.enrolled, 0);
  const totalPresent = rows.reduce((s, r) => s + r.present, 0);
  const chartData = rows.map((r) => ({
    name: r.hubName.replace(/^Uncommon\s+/i, ''),
    rate: r.attendanceRate,
  }));

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2">
        <Trophy size={20} className="text-[#0052CC]" />
        <h2 className="text-xl font-bold text-gray-900">Hub leaderboard</h2>
      </div>

      <LeaderboardStatsRow
        stats={[
          { label: 'Total enrolled', value: totalEnrolled, icon: 'users', detail: 'All hubs' },
          {
            label: 'Present days',
            value: totalPresent,
            icon: 'check',
            detail: 'Weekdays this month',
          },
          { label: 'Hubs ranked', value: rows.length, icon: 'hub', detail: 'By attendance rate' },
        ]}
      />

      <LeaderboardPodium
        entries={hubToPodium(rows)}
        loading={loading}
        variant="hub"
        emptyMessage="No hub attendance data for this month."
      />

      {!loading && chartData.length > 0 && (
        <div className="bg-white rounded-[20px] border border-[rgba(0,82,204,0.06)] p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Attendance rate by hub</h3>
          <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 48)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2FF" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(v) => [`${v ?? 0}%`, 'Rate']} />
              <Bar dataKey="rate" radius={[0, 8, 8, 0]} barSize={22}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#0052CC' : '#93c5fd'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Global hub ranking</h3>
        <LeaderboardTable
          rows={rows}
          loading={loading}
          getRowKey={(r) => r.hubId}
          emptyMessage="No hubs to rank."
          columns={[
            {
              key: 'rank',
              header: 'Rank',
              render: (r) => (
                <span className="font-bold text-gray-600">
                  {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}
                </span>
              ),
            },
            {
              key: 'hub',
              header: 'Hub',
              render: (r) => <span className="font-semibold text-gray-900">{r.hubName}</span>,
            },
            {
              key: 'rate',
              header: 'Rate',
              align: 'right',
              render: (r) => <span className="font-bold text-[#0052CC]">{r.attendanceRate}%</span>,
            },
            {
              key: 'present',
              header: 'Present',
              align: 'right',
              render: (r) => r.present,
            },
            {
              key: 'late',
              header: 'Late',
              align: 'right',
              render: (r) => r.late,
            },
            {
              key: 'enrolled',
              header: 'Enrolled',
              align: 'right',
              render: (r) => r.enrolled,
            },
          ]}
        />
      </div>
    </section>
  );
};

export default HubLeaderboardSection;
