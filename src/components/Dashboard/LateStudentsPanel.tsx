import React, { useMemo } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { resolvedHubLabel } from '../../services/hubService';

export type TodayAttendanceRow = {
  userId?: string;
  userName?: string;
  userEmail?: string;
  hubId?: string;
  hubName?: string;
  status?: string;
  isLate?: boolean;
  checkInTime?: Date | null;
  lateReason?: string;
};

type Props = {
  attendanceList?: TodayAttendanceRow[];
  loading?: boolean;
  showHubColumn?: boolean;
};

function formatTime(d?: Date | null): string {
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function isLateRow(row: TodayAttendanceRow): boolean {
  if (row.isLate) return true;
  const s = (row.status || '').toLowerCase();
  return s === 'late';
}

export const LateStudentsPanel: React.FC<Props> = ({
  attendanceList = [],
  loading = false,
  showHubColumn = false,
}) => {
  const lateRows = useMemo(() => attendanceList.filter((r) => isLateRow(r)), [attendanceList]);

  const byHub = useMemo(() => {
    const map = new Map<string, TodayAttendanceRow[]>();
    lateRows.forEach((r) => {
      const key = r.hubId?.trim() || 'unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) =>
      resolvedHubLabel({ hubId: a[0] }).localeCompare(resolvedHubLabel({ hubId: b[0] }))
    );
  }, [lateRows]);

  return (
    <div className="bg-white rounded-[20px] border border-[rgba(0,82,204,0.06)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Clock size={18} className="text-amber-600" />
            Late arrivals today
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Students who checked in after 9:00 AM (Harare)</p>
        </div>
        <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
          {loading ? '…' : lateRows.length}
        </span>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lateRows.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No late check-ins for this hub today.</p>
      ) : showHubColumn ? (
        <div className="space-y-4">
          {byHub.map(([hubId, rows]) => (
            <div key={hubId}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <MapPin size={11} />
                {resolvedHubLabel({ hubId, hubName: rows[0]?.hubName })}
              </p>
              <LateList rows={rows} />
            </div>
          ))}
        </div>
      ) : (
        <LateList rows={lateRows} />
      )}
    </div>
  );
};

function LateList({ rows }: { rows: TodayAttendanceRow[] }) {
  return (
    <ul className="space-y-2 max-h-64 overflow-y-auto">
      {rows.map((r) => (
        <li
          key={r.userId || `${r.userName}-${r.checkInTime}`}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{r.userName || 'Unknown'}</p>
            {r.lateReason && (
              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2" title={r.lateReason}>
                {r.lateReason}
              </p>
            )}
          </div>
          <span className="text-xs font-bold text-amber-800 whitespace-nowrap">
            {formatTime(r.checkInTime)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default LateStudentsPanel;
