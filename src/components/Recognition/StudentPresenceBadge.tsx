import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { attendanceAnalyticsService } from '../../services/attendanceAnalyticsService';
import { getMonthlyAward, periodFromRange } from '../../services/monthlyAwardsService';

type Props = {
  studentId: string;
  hubId?: string;
};

export const StudentPresenceBadge: React.FC<Props> = ({ studentId, hubId }) => {
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId || !hubId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const range = attendanceAnalyticsService.currentCalendarMonthRange();
    const period = periodFromRange(range);

    async function load() {
      const hub = hubId!;
      try {
        const cached = await getMonthlyAward(period, hub);
        const fromCache = cached?.winners?.find((w) => w.studentId === studentId);
        if (fromCache) {
          if (!cancelled) setRank(fromCache.rank);
          return;
        }
        const leaders = await attendanceAnalyticsService.getMonthlyStudentLeaders(hub, range, 10);
        const match = leaders.find((l) => l.studentId === studentId);
        if (!cancelled) setRank(match && match.rank <= 3 ? match.rank : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [studentId, hubId]);

  if (loading || rank == null) return null;

  const label = rank === 1 ? 'Gold' : rank === 2 ? 'Silver' : 'Bronze';
  const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200"
      title={`${label} — top ${rank} attendance this month`}
    >
      <Award size={14} />
      {emoji} Top {rank} this month
    </span>
  );
};

export default StudentPresenceBadge;
