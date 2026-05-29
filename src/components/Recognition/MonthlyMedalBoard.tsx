import React, { useEffect, useState } from 'react';
import { Medal } from 'lucide-react';
import {
  attendanceAnalyticsService,
  type DateRange,
} from '../../services/attendanceAnalyticsService';
import { getMonthlyAward, periodFromRange } from '../../services/monthlyAwardsService';
import type { MonthlyAwardWinner } from '../../types/notifications';
import { resolvedHubLabel } from '../../services/hubService';

const PODIUM_STYLES = [
  'bg-amber-100 border-amber-300 text-amber-900',
  'bg-slate-100 border-slate-300 text-slate-800',
  'bg-orange-100 border-orange-300 text-orange-900',
];

type Props = {
  hubId?: string;
  range?: DateRange;
  title?: string;
};

export const MonthlyMedalBoard: React.FC<Props> = ({
  hubId,
  range: rangeProp,
  title = 'Top present this month',
}) => {
  const [range] = useState<DateRange>(
    () => rangeProp || attendanceAnalyticsService.currentCalendarMonthRange()
  );
  const [winners, setWinners] = useState<MonthlyAwardWinner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const period = periodFromRange(range);

    async function load() {
      setLoading(true);
      try {
        if (hubId) {
          const cached = await getMonthlyAward(period, hubId);
          if (cached?.winners?.length) {
            if (!cancelled) setWinners(cached.winners);
            return;
          }
        }
        const leaders = await attendanceAnalyticsService.getMonthlyStudentLeaders(
          hubId,
          range,
          3
        );
        if (!cancelled) {
          setWinners(
            leaders.map((l) => ({
              rank: l.rank,
              studentId: l.studentId,
              studentName: l.studentName,
              attendanceRate: l.attendanceRate,
              present: l.present,
              late: l.late,
              streak: l.streak,
            }))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [hubId, range]);

  const hubLabel = resolvedHubLabel({ hubId });

  return (
    <div className="bg-white rounded-[20px] border border-[rgba(0,82,204,0.06)] p-5">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Medal size={18} className="text-amber-600" />
          {title}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {hubLabel} · {range.startDate.slice(0, 7)}
        </p>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : winners.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No attendance data for this period yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          {[1, 0, 2].map((idx) => {
            const w = winners[idx];
            if (!w) return <div key={idx} className="hidden sm:block" />;
            const style = PODIUM_STYLES[w.rank - 1] || PODIUM_STYLES[2];
            const height = w.rank === 1 ? 'sm:min-h-[120px]' : 'sm:min-h-[96px]';
            return (
              <div
                key={w.studentId}
                className={`rounded-2xl border-2 p-4 text-center ${style} ${height} ${
                  w.rank === 1 ? 'sm:order-2' : w.rank === 2 ? 'sm:order-1' : 'sm:order-3'
                }`}
              >
                <div className="text-2xl mb-1">{w.rank === 1 ? '🥇' : w.rank === 2 ? '🥈' : '🥉'}</div>
                <p className="font-bold text-sm truncate">{w.studentName}</p>
                <p className="text-xs mt-1 opacity-80">{w.attendanceRate}% attendance</p>
                {w.streak != null && w.streak > 0 && (
                  <p className="text-[10px] mt-0.5 font-semibold">{w.streak} day streak</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MonthlyMedalBoard;
