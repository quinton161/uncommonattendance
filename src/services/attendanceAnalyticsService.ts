import { format, parseISO, subDays } from 'date-fns';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { db } from './firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { TimeService } from './timeService';

// Date range preset type
export interface DateRangePreset {
  label: string;
  value: 'week' | 'month' | 'quarter' | 'custom' | 'today' | 'semester';
}

// Full date range type with properties
export interface DateRange {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
}

// Admin analytics result type
export interface AdminAnalytics {
  daily: Array<{
    date: string;
    present: number;
    late: number;
    absent: number;
  }>;
  distribution: Array<{
    name: string;
    value: number;
  }>;
  heatmap: Array<{
    date: string;
    count: number;
  }>;
  leaderboardTop: Array<{
    studentId: string;
    studentName: string;
    attendanceRate: number;
    present: number;
    late: number;
    totalDays: number;
  }>;
  mostAbsent: Array<{
    userId: string;
    userName: string;
    absent: number;
    attendanceRate: number;
  }>;
  attendanceRate?: number;
  totals?: {
    present: number;
    late: number;
    absent: number;
    totalDays: number;
  };
}

// Student analytics result type
export interface StudentAnalytics {
  daily: Array<{
    date: string;
    status: 'present' | 'late' | 'absent';
  }>;
  totals: {
    present: number;
    late: number;
    absent: number;
    totalDays: number;
    attendanceRate: number;
  };
  streak: {
    current: number;
    longest: number;
  };
  checkInTimes: string[];
  distribution: Array<{ name: string; value: number }>;
  weekly: Array<any>;
  warning: {
    isBelowThreshold: boolean;
    threshold: number;
  };
  range: {
    startDate: string;
    endDate: string;
  };
}

function checkInToDate(record: AttendanceRecord): Date | null {
  const dt = record.checkInTime as any;
  if (!dt) return null;
  if (dt instanceof Date && !Number.isNaN(dt.getTime())) return dt;
  if (typeof dt?.toDate === 'function') {
    const d = dt.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  try {
    const d = new Date(dt);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/** Late vs on-time uses Harare time (same as TimeService / check-in rules). */
function isLateRecord(record: AttendanceRecord): boolean {
  const status = (record.status || '').toString().toLowerCase().trim();
  if (status === 'late') return true;
  if (status.includes('late')) return true;

  const d = checkInToDate(record);
  if (!d) return false;
  return TimeService.getInstance().isLate(d);
}

/**
 * Map a stored attendance row to present/late for analytics.
 * Check-out sets `status` to `completed`, which would otherwise disappear from charts.
 */
function normalizeStatus(record: AttendanceRecord): AttendanceStatus {
  const status = (record.status || '').toString().toLowerCase();
  if (status === 'late') return 'late';
  if (status === 'present') return 'present';
  if (status.includes('late')) return 'late';
  if (status === 'completed') {
    return isLateRecord(record) ? 'late' : 'present';
  }

  return isLateRecord(record) ? 'late' : 'present';
}

/** School calendar day in Harare from stored `date` or from check-in instant (real data). */
function recordSchoolDateHarare(r: any): string | undefined {
  if (r.date && typeof r.date === 'string') return r.date;
  const d = checkInToDate(r as AttendanceRecord);
  if (!d) return undefined;
  return TimeService.getInstance().toHarareDateString(d);
}

function dedupeRecordsByDate(records: any[]): Map<string, any> {
  const m = new Map<string, any>();
  const ts = TimeService.getInstance();
  records.forEach((r) => {
    const day = recordSchoolDateHarare(r);
    if (!day || !ts.isHarareWeekday(day)) return;
    const ex = m.get(day);
    if (!ex) {
      m.set(day, r);
      return;
    }
    const tNew = checkInToDate(r as AttendanceRecord)?.getTime() ?? 0;
    const tOld = checkInToDate(ex as AttendanceRecord)?.getTime() ?? 0;
    if (tNew >= tOld) m.set(day, r);
  });
  return m;
}

/** Mon–Fri only; uses Harare calendar (not browser local `getDay()`). */
function eachWeekdayInRange(startDateStr: string, endDateStr: string): string[] {
  return TimeService.getInstance().eachHarareWeekdayInRange(startDateStr, endDateStr);
}

/** Roster entries for per-student leaderboard / most-absent (same date range as query). */
export type AdminAnalyticsRosterEntry = { studentId: string; studentName: string };

function computeRosterLeaderboards(
  range: DateRange,
  records: any[],
  roster: AdminAnalyticsRosterEntry[]
): { leaderboardTop: AdminAnalytics['leaderboardTop']; mostAbsent: AdminAnalytics['mostAbsent'] } {
  const weekdays = eachWeekdayInRange(range.startDate, range.endDate);
  const totalWd = weekdays.length;
  if (totalWd === 0 || roster.length === 0) {
    return { leaderboardTop: [], mostAbsent: [] };
  }

  const recordsByStudent = new Map<string, any[]>();
  records.forEach((r) => {
    const sid = r.studentId;
    if (!sid) return;
    if (!recordsByStudent.has(sid)) recordsByStudent.set(sid, []);
    recordsByStudent.get(sid)!.push(r);
  });

  const rows = roster.map(({ studentId, studentName }) => {
    const rlist = recordsByStudent.get(studentId) || [];
    const byDate = dedupeRecordsByDate(rlist);
    let present = 0;
    let late = 0;
    weekdays.forEach((dateStr) => {
      const rec = byDate.get(dateStr);
      if (!rec) return;
      const n = normalizeStatus(rec as AttendanceRecord);
      if (n === 'late') late++;
      else present++;
    });
    const daysAttended = present + late;
    const absent = totalWd - daysAttended;
    const rate = totalWd > 0 ? Math.round((daysAttended / totalWd) * 100) : 100;
    return {
      studentId,
      studentName,
      attendanceRate: rate,
      present,
      late,
      totalDays: totalWd,
      absent,
    };
  });

  const leaderboardTop = [...rows]
    .sort((a, b) => {
      if (b.attendanceRate !== a.attendanceRate) return b.attendanceRate - a.attendanceRate;
      return b.present + b.late - (a.present + a.late);
    })
    .slice(0, 10)
    .map(({ studentId, studentName, attendanceRate, present, late, totalDays }) => ({
      studentId,
      studentName,
      attendanceRate,
      present,
      late,
      totalDays,
    }));

  const mostAbsent = [...rows]
    .sort((a, b) => {
      if (b.absent !== a.absent) return b.absent - a.absent;
      return a.attendanceRate - b.attendanceRate;
    })
    .slice(0, 10)
    .map(({ studentId, studentName, absent, attendanceRate }) => ({
      userId: studentId,
      userName: studentName,
      absent,
      attendanceRate,
    }));

  return { leaderboardTop, mostAbsent };
}

function aggregateAdminRecords(
  records: any[],
  range: DateRange,
  opts?: { studentId?: string; totalStudents?: number; roster?: AdminAnalyticsRosterEntry[] }
): AdminAnalytics {
  const startDateStr = range.startDate;
  const endDateStr = range.endDate;
  const totalStudents = opts?.totalStudents ?? 0;
  const studentId = opts?.studentId;

  const dailyMap = new Map<string, { present: number; late: number; absent: number }>();
  eachWeekdayInRange(startDateStr, endDateStr).forEach((dateStr) => {
    dailyMap.set(dateStr, { present: 0, late: 0, absent: 0 });
  });

  if (studentId) {
    const byDate = dedupeRecordsByDate(records.filter((r) => r.studentId === studentId));
    dailyMap.forEach((data, dateStr) => {
      const rec = byDate.get(dateStr);
      if (!rec) {
        data.absent = 1;
      } else {
        const n = normalizeStatus(rec as AttendanceRecord);
        if (n === 'late') data.late = 1;
        else data.present = 1;
      }
    });
  } else {
    const ts = TimeService.getInstance();
    const byDate = new Map<string, Map<string, 'present' | 'late'>>();
    records.forEach((r: any) => {
      const day = recordSchoolDateHarare(r);
      const sid = r.studentId;
      if (!day || !sid) return;
      if (!ts.isHarareWeekday(day)) return;
      if (!byDate.has(day)) byDate.set(day, new Map());
      const st = normalizeStatus(r as AttendanceRecord) === 'late' ? 'late' : 'present';
      byDate.get(day)!.set(sid, st);
    });
    dailyMap.forEach((data, dateStr) => {
      const sm = byDate.get(dateStr);
      let present = 0;
      let late = 0;
      if (sm) {
        sm.forEach((v) => {
          if (v === 'late') late++;
          else present++;
        });
      }
      data.present = present;
      data.late = late;
      const checkedIn = present + late;
      data.absent = totalStudents > 0 ? Math.max(0, totalStudents - checkedIn) : 0;
    });
  }

  const daily = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      present: data.present,
      late: data.late,
      absent: data.absent,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalPresent = daily.reduce((s, d) => s + d.present, 0);
  const totalLate = daily.reduce((s, d) => s + d.late, 0);
  const totalAbsent = daily.reduce((s, d) => s + d.absent, 0);

  const distribution = [
    { name: 'Present', value: totalPresent },
    { name: 'Late', value: totalLate },
    { name: 'Absent', value: totalAbsent },
  ];

  let attendanceRate = 0;
  if (studentId) {
    const wd = daily.length;
    attendanceRate = wd > 0 ? Math.round(((totalPresent + totalLate) / wd) * 100) : 0;
  } else if (totalStudents > 0 && daily.length > 0) {
    const sumRate = daily.reduce((s, d) => s + ((d.present + d.late) / totalStudents) * 100, 0);
    attendanceRate = Math.round(sumRate / daily.length);
  } else {
    attendanceRate =
      totalPresent + totalLate > 0 ? Math.round((totalPresent / (totalPresent + totalLate)) * 100) : 0;
  }

  let leaderboardTop: AdminAnalytics['leaderboardTop'] = [];
  let mostAbsent: AdminAnalytics['mostAbsent'] = [];
  if (!studentId && opts?.roster && opts.roster.length > 0) {
    const lb = computeRosterLeaderboards(range, records, opts.roster);
    leaderboardTop = lb.leaderboardTop;
    mostAbsent = lb.mostAbsent;
  }

  return {
    daily,
    distribution,
    heatmap: daily.map((d) => ({ date: d.date, count: d.present + d.late })),
    leaderboardTop,
    mostAbsent,
    attendanceRate,
    totals: {
      present: totalPresent,
      late: totalLate,
      absent: totalAbsent,
      totalDays: daily.length,
    },
  };
}

function chunkWeeklySeries(
  daily: Array<{ date: string; status: 'present' | 'late' | 'absent' }>
): Array<{ name: string; present: number; late: number; absent: number }> {
  const weekly: Array<{ name: string; present: number; late: number; absent: number }> = [];
  for (let i = 0; i < daily.length; i += 5) {
    const chunk = daily.slice(i, i + 5);
    if (chunk.length === 0) continue;
    const a = chunk[0].date;
    const b = chunk[chunk.length - 1].date;
    const name = `${format(parseISO(a), 'MMM d')} – ${format(parseISO(b), 'MMM d')}`;
    weekly.push({
      name,
      present: chunk.filter((x) => x.status === 'present').length,
      late: chunk.filter((x) => x.status === 'late').length,
      absent: chunk.filter((x) => x.status === 'absent').length,
    });
  }
  return weekly;
}

function computeStreaks(daily: Array<{ status: string }>): { current: number; longest: number } {
  let longest = 0;
  let run = 0;
  daily.forEach((d) => {
    if (d.status === 'present' || d.status === 'late') {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  });
  let current = 0;
  for (let i = daily.length - 1; i >= 0; i--) {
    const d = daily[i];
    if (d.status === 'present' || d.status === 'late') current++;
    else break;
  }
  return { current, longest };
}

function buildStudentAnalyticsFromRecords(records: any[], range: DateRange): StudentAnalytics {
  const startDateStr = range.startDate;
  const endDateStr = range.endDate;
  const byDate = dedupeRecordsByDate(records);

  const daily: Array<{ date: string; status: 'present' | 'late' | 'absent' }> = [];
  eachWeekdayInRange(startDateStr, endDateStr).forEach((dateStr) => {
    const rec = byDate.get(dateStr);
    if (!rec) {
      daily.push({ date: dateStr, status: 'absent' });
    } else {
      daily.push({ date: dateStr, status: normalizeStatus(rec as AttendanceRecord) as 'present' | 'late' });
    }
  });

  const present = daily.filter((d) => d.status === 'present').length;
  const late = daily.filter((d) => d.status === 'late').length;
  const absent = daily.filter((d) => d.status === 'absent').length;
  const totalDays = daily.length;
  const attendanceRate = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0;

  const streaks = computeStreaks(daily);
  const weekly = chunkWeeklySeries(daily);

  return {
    daily,
    totals: {
      present,
      late,
      absent,
      totalDays,
      attendanceRate,
    },
    streak: {
      current: streaks.current,
      longest: streaks.longest,
    },
    checkInTimes: [],
    distribution: [
      { name: 'Present', value: present },
      { name: 'Late', value: late },
      { name: 'Absent', value: absent },
    ],
    weekly,
    warning: {
      isBelowThreshold: attendanceRate < 75,
      threshold: 75,
    },
    range: {
      startDate: startDateStr,
      endDate: endDateStr,
    },
  };
}

// Main analytics service class
export class AttendanceAnalyticsService {
  private static instance: AttendanceAnalyticsService;

  private constructor() {}

  public static getInstance(): AttendanceAnalyticsService {
    if (!AttendanceAnalyticsService.instance) {
      AttendanceAnalyticsService.instance = new AttendanceAnalyticsService();
    }
    return AttendanceAnalyticsService.instance;
  }

  // Get default date range with presets (aligned with attendance `date` = Africa/Harare)
  getDefaultRange(context: 'admin' | 'student'): DateRange {
    const ts = TimeService.getInstance();
    const endDate = ts.getCurrentDateString();
    const startDate = format(subDays(parseISO(endDate), 30), 'yyyy-MM-dd');
    return {
      preset: { label: 'Month', value: 'month' },
      startDate,
      endDate,
    };
  }

  // Get preset options
  getPresets(): DateRangePreset[] {
    return [
      { label: 'Week', value: 'week' },
      { label: 'Month', value: 'month' },
      { label: 'Quarter', value: 'quarter' }
    ];
  }

  // Convert preset to date range (Harare calendar days, same as attendance records)
  presetToRange(preset: DateRangePreset): DateRange {
    const ts = TimeService.getInstance();
    const endDate = ts.getCurrentDateString();

    if (preset.value === 'today') {
      return { preset, startDate: endDate, endDate };
    }

    if (preset.value === 'week') {
      const wd = ts.lastNHarareWeekdays(5, endDate);
      const startW = wd[0] ?? endDate;
      const endW = wd[wd.length - 1] ?? endDate;
      return { preset, startDate: startW, endDate: endW };
    }

    const days =
      preset.value === 'quarter'
          ? 90
          : preset.value === 'month'
            ? 30
            : preset.value === 'semester'
              ? 120
              : 30;
    const startDate = format(subDays(parseISO(endDate), days), 'yyyy-MM-dd');

    return {
      preset,
      startDate,
      endDate,
    };
  }

  // Get admin analytics (studentId = one learner; totalStudents = enrollment for absent / rate when viewing all)
  async getAdminAnalytics(
    range: DateRange,
    opts?: { studentId?: string; totalStudents?: number; roster?: AdminAnalyticsRosterEntry[] }
  ): Promise<AdminAnalytics> {
    try {
      const startDateStr = range.startDate;
      const endDateStr = range.endDate;

      const attendanceRef = collection(db, 'attendance');
      const q = query(
        attendanceRef,
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr)
      );

      const snapshot = await getDocs(q);
      let records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      if (opts?.studentId) {
        records = records.filter((r: any) => r.studentId === opts.studentId);
      }

      return aggregateAdminRecords(records, range, opts);
    } catch (error) {
      console.error('Error getting admin analytics:', error);
      return {
        daily: [],
        distribution: [],
        heatmap: [],
        leaderboardTop: [],
        mostAbsent: [],
        attendanceRate: 0,
        totals: { present: 0, late: 0, absent: 0, totalDays: 0 },
      };
    }
  }

  // Get student analytics (weekdays in range; absences = missing weekdays)
  async getStudentAnalytics(studentId: string, range: DateRange): Promise<StudentAnalytics> {
    try {
      const startDateStr = range.startDate;
      const endDateStr = range.endDate;

      const attendanceRef = collection(db, 'attendance');
      const q = query(
        attendanceRef,
        where('studentId', '==', studentId),
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr)
      );

      const snapshot = await getDocs(q);
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return buildStudentAnalyticsFromRecords(records, range);
    } catch (error) {
      console.error('Error getting student analytics:', error);
      return {
        daily: [],
        totals: { present: 0, late: 0, absent: 0, totalDays: 0, attendanceRate: 0 },
        streak: { current: 0, longest: 0 },
        checkInTimes: [],
        distribution: [],
        weekly: [],
        warning: { isBelowThreshold: false, threshold: 75 },
        range: { startDate: range.startDate, endDate: range.endDate },
      };
    }
  }

  // Subscribe to admin analytics
  subscribeToAdminAnalytics(
    range: DateRange,
    callback: (data: AdminAnalytics) => void,
    opts?: { studentId?: string; totalStudents?: number; roster?: AdminAnalyticsRosterEntry[] }
  ): () => void {
    const startDateStr = range.startDate;
    const endDateStr = range.endDate;

    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('date', '>=', startDateStr),
      where('date', '<=', endDateStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      if (opts?.studentId) {
        records = records.filter((r: any) => r.studentId === opts.studentId);
      }
      callback(aggregateAdminRecords(records, range, opts));
    });

    return unsubscribe;
  }

  // Subscribe to student analytics
  subscribeToStudentAnalytics(studentId: string, range: DateRange, callback: (data: StudentAnalytics) => void): () => void {
    const startDateStr = range.startDate;
    const endDateStr = range.endDate;

    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('studentId', '==', studentId),
      where('date', '>=', startDateStr),
      where('date', '<=', endDateStr)
    );

    const empty = (): StudentAnalytics => ({
      daily: [],
      totals: { present: 0, late: 0, absent: 0, totalDays: 0, attendanceRate: 0 },
      streak: { current: 0, longest: 0 },
      checkInTimes: [],
      distribution: [],
      weekly: [],
      warning: { isBelowThreshold: false, threshold: 75 },
      range: { startDate: range.startDate, endDate: range.endDate },
    });

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(buildStudentAnalyticsFromRecords(records, range));
      },
      (err) => {
        console.error('subscribeToStudentAnalytics:', err);
        callback(empty());
      }
    );

    return unsubscribe;
  }
}

// Export singleton instance
export const attendanceAnalyticsService = AttendanceAnalyticsService.getInstance();
