import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { attendanceAnalyticsService } from '../../services/attendanceAnalyticsService';
import type { StudentLeaderboardRow } from '../../types/notifications';
import { LeaderboardPodium, type PodiumEntry } from './LeaderboardPodium';

type Props = {
  hubId?: string;
};

function toPodium(rows: StudentLeaderboardRow[]): PodiumEntry[] {
  return rows.map((r) => ({
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

export const AdminTopStudentsPreview: React.FC<Props> = ({ hubId }) => {
  const [entries, setEntries] = useState<PodiumEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const range = attendanceAnalyticsService.currentCalendarMonthRange();
    attendanceAnalyticsService
      .getMonthlyStudentLeaders(hubId, range, 3)
      .then((rows) => {
        if (!cancelled) setEntries(toPodium(rows));
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hubId]);

  return (
    <div className="bg-white rounded-[20px] border border-[rgba(0,82,204,0.06)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Top present this month</h3>
        <Link
          to="/rankings"
          className="text-xs font-semibold text-[#0052CC] hover:underline inline-flex items-center gap-1"
        >
          <TrendingUp size={14} /> Full leaderboard
        </Link>
      </div>
      <LeaderboardPodium entries={entries} loading={loading} variant="student" />
    </div>
  );
};

export default AdminTopStudentsPreview;
