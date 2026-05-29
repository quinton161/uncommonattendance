import React, { useEffect, useState } from 'react';
import { Medal, MapPin } from 'lucide-react';
import {
  attendanceAnalyticsService,
  type DateRange,
} from '../../services/attendanceAnalyticsService';
import type { StudentLeaderboardRow } from '../../types/notifications';
import { resolvedHubLabel } from '../../services/hubService';
import { LeaderboardStatsRow } from './LeaderboardStatsRow';
import { LeaderboardPodium, type PodiumEntry } from './LeaderboardPodium';
import { LeaderboardTable } from './LeaderboardTable';

type Props = {
  range: DateRange;
  hubId?: string;
  hubFilter?: React.ReactNode;
};

function studentToPodium(rows: StudentLeaderboardRow[]): PodiumEntry[] {
  return rows.slice(0, 3).map((r) => ({
    rank: r.rank,
    id: r.studentId,
    name: r.studentName,
    subtitle: r.hubName,
    photoUrl: r.photoUrl,
    rate: r.attendanceRate,
    primaryStat: `${r.present + r.late} days attended`,
    secondaryStats: [
      { label: 'Present', value: r.present },
      { label: 'Streak', value: `${r.streak}d` },
    ],
  }));
}

function UserCell({ row }: { row: StudentLeaderboardRow }) {
  const initials =
    row.studentName
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  return (
    <div className="flex items-center gap-3 min-w-0">
      {row.photoUrl ? (
        <img src={row.photoUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0052CC] to-[#003D99] text-white text-xs font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 truncate">{row.studentName}</p>
        <p className="text-xs text-gray-400 truncate">{row.hubName || resolvedHubLabel({ hubId: row.hubId })}</p>
      </div>
    </div>
  );
}

export const StudentLeaderboardSection: React.FC<Props> = ({ range, hubId, hubFilter }) => {
  const [rows, setRows] = useState<StudentLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    attendanceAnalyticsService
      .getMonthlyStudentLeaders(hubId, range, 50)
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
  }, [range, hubId]);

  const participated = rows.filter((r) => r.present + r.late > 0).length;
  const hubLabel = hubId ? resolvedHubLabel({ hubId }) : 'All hubs';

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Medal size={20} className="text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">Student leaderboard</h2>
        </div>
        {hubFilter}
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1 -mt-2">
        <MapPin size={12} /> {hubLabel}
      </p>

      <LeaderboardStatsRow
        stats={[
          { label: 'Students ranked', value: rows.length, icon: 'users', detail: hubLabel },
          {
            label: 'Participated',
            value: participated,
            icon: 'check',
            detail: 'Checked in at least once',
          },
          {
            label: 'Top rate',
            value: rows[0] ? `${rows[0].attendanceRate}%` : '—',
            icon: 'hub',
            detail: rows[0]?.studentName?.split(' ')[0] ?? '—',
          },
        ]}
      />

      <LeaderboardPodium
        entries={studentToPodium(rows)}
        loading={loading}
        variant="student"
        emptyMessage="No student attendance for this hub and month."
      />

      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Global ranking</h3>
        <LeaderboardTable
          rows={rows}
          loading={loading}
          getRowKey={(r) => r.studentId}
          emptyMessage="No students to rank."
          columns={[
            {
              key: 'rank',
              header: 'Rank',
              render: (r) => (
                <span className="font-bold text-gray-600 w-8 inline-block">
                  {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}
                </span>
              ),
            },
            {
              key: 'user',
              header: 'Student',
              render: (r) => <UserCell row={r} />,
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
              key: 'streak',
              header: 'Streak',
              align: 'right',
              render: (r) => `${r.streak}d`,
            },
          ]}
        />
      </div>
    </section>
  );
};

export default StudentLeaderboardSection;
