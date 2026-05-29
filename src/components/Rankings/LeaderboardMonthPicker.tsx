import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DateRange } from '../../services/attendanceAnalyticsService';

type Props = {
  range: DateRange;
  onShiftMonth: (delta: number) => void;
};

export const LeaderboardMonthPicker: React.FC<Props> = ({ range, onShiftMonth }) => {
  const [y, m] = range.startDate.split('-').map(Number);
  const monthLabel = new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const endOfMonth = new Date(y, m || 1, 0);
  const today = new Date();
  const daysLeft =
    today.getFullYear() === y && today.getMonth() + 1 === (m || 1)
      ? Math.max(0, endOfMonth.getDate() - today.getDate())
      : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold text-[#0052CC] uppercase tracking-widest">Period</p>
        <p className="text-lg font-bold text-gray-900">{monthLabel}</p>
        {daysLeft != null && (
          <p className="text-xs text-gray-500 mt-0.5">{daysLeft} day{daysLeft === 1 ? '' : 's'} left this month</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onShiftMonth(-1)}
          className="p-2.5 rounded-xl border border-[rgba(0,82,204,0.12)] bg-white hover:bg-[#EEF4FF] transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} className="text-[#0052CC]" />
        </button>
        <button
          type="button"
          onClick={() => onShiftMonth(1)}
          className="p-2.5 rounded-xl border border-[rgba(0,82,204,0.12)] bg-white hover:bg-[#EEF4FF] transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={18} className="text-[#0052CC]" />
        </button>
      </div>
    </div>
  );
};

export default LeaderboardMonthPicker;
