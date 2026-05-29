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
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  attendanceAnalyticsService,
  type DateRange,
} from '../../services/attendanceAnalyticsService';
import type { HubMonthlyRankingRow } from '../../types/notifications';

const MEDAL = ['🥇', '🥈', '🥉'];

type Props = {
  compact?: boolean;
};

export const HubMonthlyRankings: React.FC<Props> = ({ compact = false }) => {
  const [range, setRange] = useState<DateRange>(() =>
    attendanceAnalyticsService.currentCalendarMonthRange()
  );
  const [rows, setRows] = useState<HubMonthlyRankingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [y, m] = range.startDate.split('-').map(Number);

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

  const shiftMonth = (delta: number) => {
    const d = new Date(y, (m || 1) - 1 + delta, 1);
    setRange(attendanceAnalyticsService.calendarMonthRange(d.getFullYear(), d.getMonth()));
  };

  const chartData = rows.map((r) => ({
    name: r.hubName.replace(/^Uncommon\s+/i, ''),
    rate: r.attendanceRate,
    hubId: r.hubId,
  }));

  const monthLabel = new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={compact ? '' : 'bg-white rounded-[20px] border border-[rgba(0,82,204,0.06)] p-5'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Trophy size={18} className="text-[#0052CC]" />
            Hub rankings
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Monthly attendance rate by hub</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[140px] text-center">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {!compact && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v ?? 0}%`, 'Rate']} />
                <Bar dataKey="rate" radius={[0, 8, 8, 0]} barSize={18}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#0052CC' : '#93c5fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 pr-2">#</th>
                  <th className="pb-2">Hub</th>
                  <th className="pb-2 text-right">Rate</th>
                  <th className="pb-2 text-right hidden sm:table-cell">Present</th>
                  <th className="pb-2 text-right hidden sm:table-cell">Late</th>
                  <th className="pb-2 text-right">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.hubId} className="border-b border-gray-50">
                    <td className="py-2.5 pr-2 font-bold text-gray-500">
                      {r.rank <= 3 ? MEDAL[r.rank - 1] : r.rank}
                    </td>
                    <td className="py-2.5 font-medium text-gray-900">{r.hubName}</td>
                    <td className="py-2.5 text-right font-bold text-[#0052CC]">{r.attendanceRate}%</td>
                    <td className="py-2.5 text-right text-gray-600 hidden sm:table-cell">{r.present}</td>
                    <td className="py-2.5 text-right text-gray-600 hidden sm:table-cell">{r.late}</td>
                    <td className="py-2.5 text-right text-gray-600">{r.enrolled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default HubMonthlyRankings;
