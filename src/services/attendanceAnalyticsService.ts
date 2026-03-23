import { db } from './firebase';
import { AttendanceService } from './attendanceService';
import DataService from './DataService';
import { TimeService } from './timeService';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

export type DateRangePreset = 'today' | 'week' | 'month' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD (inclusive)
  endDate: string;   // YYYY-MM-DD (inclusive)
}

export interface DailyCounts {
  date: string;
  present: number;
  late: number;
  absent: number;
  total: number;
  attendanceRate: number; // 0..100
}

export interface StudentRateRow {
  studentId: string;
  studentName: string;
  email?: string;
  present: number;
  late: number;
  absent: number;
  totalDays: number;
  attendanceRate: number; // 0..100
}

export interface AdminAnalytics {
  range: DateRange;
  totals: { present: number; late: number; absent: number; total: number; attendanceRate: number };
  daily: DailyCounts[];
  distribution: { name: 'Present' | 'Late' | 'Absent'; value: number }[];
  leaderboardTop: StudentRateRow[];
  mostAbsent: StudentRateRow[];
  heatmap: { date: string; value: number; label: string }[]; // value 0..1
}

export interface StudentAnalytics {
  range: DateRange;
  totals: { present: number; late: number; absent: number; total: number; attendanceRate: number };
  daily: DailyCounts[];
  distribution: { name: 'Present' | 'Late' | 'Absent'; value: number }[];
  weekly: { name: string; present: number; late: number; absent: number }[];
  streak: { current: number; longest: number };
  warning: { isBelowThreshold: boolean; threshold: number };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function parseIsoDate(iso: string): Date {
  // ISO YYYY-MM-DD
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
}

function enumerateDates(startIso: string, endIso: string): string[] {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(toIsoDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function isLateRecord(record: AttendanceRecord): boolean {
  if (record.status === 'late') return true;
  const dt = record.checkInTime;
  if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return false;
  return dt.getHours() > 9 || (dt.getHours() === 9 && dt.getMinutes() > 0);
}

function normalizeStatus(record: AttendanceRecord): AttendanceStatus {
  const status = (record.status || '').toString().toLowerCase();
  if (status === 'late') return 'late';
  if (status === 'completed') return 'completed';
  if (status === 'present') return 'present';
  // fallback: derive from check-in time
  return isLateRecord(record) ? 'late' : 'present';
}

function calcBusinessDays(startIso: string, endIso: string): number {
  const dates = enumerateDates(startIso, endIso);
  return dates.filter(d => {
    const dt = parseIsoDate(d);
    const dow = dt.getDay();
    return dow !== 0 && dow !== 6;
  }).length;
}

export class AttendanceAnalyticsService {
  private static instance: AttendanceAnalyticsService;
  private attendanceService = AttendanceService.getInstance();
  private dataService = DataService.getInstance();
  private timeService = TimeService.getInstance();

  static getInstance(): AttendanceAnalyticsService {
    if (!AttendanceAnalyticsService.instance) {
      AttendanceAnalyticsService.instance = new AttendanceAnalyticsService();
    }
    return AttendanceAnalyticsService.instance;
  }

  getDefaultRange(preset: DateRangePreset): DateRange {
    const today = this.timeService.getCurrentDateString();
    if (preset === 'today') return { preset, startDate: today, endDate: today };

    if (preset === 'week') {
      const end = parseIsoDate(today);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      return { preset, startDate: toIsoDate(start), endDate: today };
    }

    if (preset === 'month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { preset, startDate: toIsoDate(start), endDate: toIsoDate(end) };
    }

    // custom fallback: last 30 days
    const end = parseIsoDate(today);
    const start = new Date(end);
    start.setDate(end.getDate() - 29);
    return { preset: 'custom', startDate: toIsoDate(start), endDate: today };
  }

  async getAdminAnalytics(range: DateRange, opts?: { studentId?: string }): Promise<AdminAnalytics> {
    await this.dataService.testConnection();
    const users = await this.dataService.getUsers();
    const students = users.filter((u: any) => !u.userType || u.userType === 'attendee');

    console.log('[Analytics] Fetching attendance for range:', range, 'Students count:', students.length);
    
    const records = await this.attendanceService.getAttendanceByDateRange(range.startDate, range.endDate);
    
    // Also fetch from dailyAttendance collection for comprehensive analytics
    const dailyAttendanceRef = collection(db, 'dailyAttendance');
    const dailyQuery = query(
      dailyAttendanceRef,
      where('date', '>=', range.startDate),
      where('date', '<=', range.endDate)
    );
    const dailySnap = await getDocs(dailyQuery);
    const dailyRecords = dailySnap.docs.map((doc: any) => ({
      studentId: doc.data().studentId,
      date: doc.data().date,
      status: doc.data().isPresent ? 'present' : 'absent',
      checkInTime: doc.data().markedAt?.toDate() || doc.data().createdAt?.toDate() || null
    }));

    // Merge both sources
    const mergedRecords = [...records];
    dailyRecords.forEach((dr: any) => {
      const exists = mergedRecords.find(mr => mr.studentId === dr.studentId && mr.date === dr.date);
      if (!exists && dr.status === 'present') {
        mergedRecords.push(dr as any);
      }
    });

    console.log('[Analytics] Merged attendance records count:', mergedRecords.length);
    
    const filteredRecords = opts?.studentId ? mergedRecords.filter(r => r.studentId === opts.studentId) : mergedRecords;

    const studentById = new Map<string, any>();
    students.forEach((s: any) => {
      const id = s.uid || s.id;
      studentById.set(id, s);
    });

    const dates = enumerateDates(range.startDate, range.endDate);
    const totalStudents = opts?.studentId ? 1 : students.length;

function getRecordDate(r: any): string | undefined {
  if (r.date) {
    return r.date;
  } else if (r.checkInTime) {
    const checkIn = r.checkInTime;
    if (checkIn.toDate) { // Firestore Timestamp
      return checkIn.toDate().toISOString().split('T')[0];
    } else if (checkIn.toISOString) { // JavaScript Date
      return checkIn.toISOString().split('T')[0];
    } else { // Fallback for string or other formats
      try {
        return new Date(checkIn).toISOString().split('T')[0];
      } catch (e) {
        console.warn("Could not parse date from checkInTime", checkIn);
      }
    }
  }
  return undefined;
}

// ... inside getAdminAnalytics ...

    // DEBUG: Log unique dates found in records
    const uniqueDatesInRecords = Array.from(new Set(filteredRecords.map(r => getRecordDate(r) || '')));
    console.log('[Analytics] Unique dates in records:', uniqueDatesInRecords);
    console.log('[Analytics] Requested range dates:', dates);

    const byDate = new Map<string, AttendanceRecord[]>();
    filteredRecords.forEach(r => {
      // Ensure we use the same date format as the 'dates' array (YYYY-MM-DD)
      const recordDate = getRecordDate(r);
      if (recordDate) {
        const arr = byDate.get(recordDate) || [];
        arr.push(r);
        byDate.set(recordDate, arr);
      }
    });

    const daily: DailyCounts[] = dates.map((date: string) => {
      const dayRecs = byDate.get(date) || [];
      let present = 0;
      let late = 0;
      // de-duplicate per student per day (defensive)
      const seen = new Set<string>();
      dayRecs.forEach(r => {
        if (seen.has(r.studentId)) return;
        seen.add(r.studentId);
        
        // Match the record date with the requested date
        // Some records might have slightly different date strings or checkInTime formats
        const recordDate = getRecordDate(r);
        
        if (recordDate === date) {
          const st = normalizeStatus(r);
          if (st === 'late') late++;
          else present++;
        }
      });
      const absent = Math.max(0, totalStudents - (present + late));
      const total = totalStudents;
      const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;
      return { date, present, late, absent, total, attendanceRate: Math.round(attendanceRate * 100) / 100 };
    });

    const totals = daily.reduce(
      (acc, d) => {
        acc.present += d.present;
        acc.late += d.late;
        acc.absent += d.absent;
        acc.total += totalStudents;
        return acc;
      },
      { present: 0, late: 0, absent: 0, total: 0 }
    );
    const attendanceRate = totals.total > 0 ? ((totals.present + totals.late) / totals.total) * 100 : 0;

    const distribution = [
      { name: 'Present' as const, value: totals.present },
      { name: 'Late' as const, value: totals.late },
      { name: 'Absent' as const, value: totals.absent },
    ];

    // per-student rates across business days
    const businessDays = Math.max(1, calcBusinessDays(range.startDate, range.endDate));
    const perStudent = new Map<string, StudentRateRow>();
    students.forEach((s: any) => {
      const id = s.uid || s.id;
      perStudent.set(id, {
        studentId: id,
        studentName: s.displayName || 'Student',
        email: s.email,
        present: 0,
        late: 0,
        absent: 0,
        totalDays: businessDays,
        attendanceRate: 0,
      });
    });

    // count present/late by student for business days only (Mon-Fri)
    filteredRecords.forEach(r => {
      const row = perStudent.get(r.studentId);
      if (!row) return;
      const dow = parseIsoDate(r.date).getDay();
      if (dow === 0 || dow === 6) return;
      const st = normalizeStatus(r);
      if (st === 'late') row.late += 1;
      else row.present += 1;
    });

    perStudent.forEach(row => {
      row.absent = clamp(row.totalDays - (row.present + row.late), 0, row.totalDays);
      row.attendanceRate = row.totalDays > 0 ? Math.round(((row.present + row.late) / row.totalDays) * 10000) / 100 : 0;
    });

    const rows = Array.from(perStudent.values());
    const leaderboardTop = rows
      .slice()
      .sort((a, b) => b.attendanceRate - a.attendanceRate || (b.present + b.late) - (a.present + a.late))
      .slice(0, 10);
    const mostAbsent = rows
      .slice()
      .sort((a, b) => b.absent - a.absent || a.attendanceRate - b.attendanceRate)
      .slice(0, 10);

    // heatmap values: lower attendance rate -> stronger highlight
    const heatmap = daily.map(d => {
      const value = 1 - (d.attendanceRate / 100);
      return {
        date: d.date,
        value: clamp(value, 0, 1),
        label: `${d.date}: ${Math.round(d.attendanceRate)}% attendance`,
      };
    });

    return {
      range,
      totals: {
        ...totals,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
      },
      daily,
      distribution,
      leaderboardTop,
      mostAbsent,
      heatmap,
    };
  }

  async getStudentAnalytics(studentId: string, range: DateRange, warningThreshold = 85): Promise<StudentAnalytics> {
    await this.dataService.testConnection();
    const totalDays = Math.max(1, calcBusinessDays(range.startDate, range.endDate));

    console.log('[StudentAnalytics] Fetching for student:', studentId, 'Range:', range);
    
    const records = await this.attendanceService.getAttendanceByDateRange(range.startDate, range.endDate, studentId);
    
    // Also fetch from dailyAttendance collection for comprehensive analytics
    const dailyAttendanceRef = collection(db, 'dailyAttendance');
    const dailyQuery = query(
      dailyAttendanceRef,
      where('studentId', '==', studentId),
      where('date', '>=', range.startDate),
      where('date', '<=', range.endDate)
    );
    const dailySnap = await getDocs(dailyQuery);
    const dailyRecords = dailySnap.docs.map((doc: any) => ({
      studentId: doc.data().studentId,
      date: doc.data().date,
      status: doc.data().isPresent ? 'present' : 'absent',
      checkInTime: doc.data().markedAt?.toDate() || doc.data().createdAt?.toDate() || null
    }));

    // Merge both sources
    const mergedRecords = [...records];
    dailyRecords.forEach((dr: any) => {
      const exists = mergedRecords.find(mr => mr.date === dr.date);
      if (!exists && dr.status === 'present') {
        mergedRecords.push(dr as any);
      }
    });

    console.log('[StudentAnalytics] Merged attendance records count:', mergedRecords.length);
    
    const byDate = new Map<string, AttendanceRecord>();
    mergedRecords.forEach(r => {
      // keep first if duplicates
      if (!byDate.has(r.date)) byDate.set(r.date, r);
    });

    const dates = enumerateDates(range.startDate, range.endDate);
    const daily: DailyCounts[] = dates.map(date => {
      const dow = parseIsoDate(date).getDay();
      const isWeekend = dow === 0 || dow === 6;
      const rec = byDate.get(date);
      let present = 0;
      let late = 0;
      let absent = 0;
      if (isWeekend) {
        // exclude weekends from rate, but keep chart continuity as 0 total
        return { date, present: 0, late: 0, absent: 0, total: 0, attendanceRate: 0 };
      }
      if (rec) {
        const st = normalizeStatus(rec);
        if (st === 'late') late = 1;
        else present = 1;
      } else {
        absent = 1;
      }
      const total = 1;
      return { date, present, late, absent, total, attendanceRate: (present + late) * 100 };
    });

    const totals = daily.reduce(
      (acc, d) => {
        acc.present += d.present;
        acc.late += d.late;
        acc.absent += d.absent;
        acc.total += d.total;
        return acc;
      },
      { present: 0, late: 0, absent: 0, total: 0 }
    );
    const attendanceRate = totalDays > 0 ? ((totals.present + totals.late) / totalDays) * 100 : 0;

    const distribution = [
      { name: 'Present' as const, value: totals.present },
      { name: 'Late' as const, value: totals.late },
      { name: 'Absent' as const, value: totals.absent },
    ];

    // weekly bars: last 7 business days within range
    const last7 = daily
      .filter(d => d.total > 0)
      .slice(-7)
      .map(d => ({
        name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
        present: d.present,
        late: d.late,
        absent: d.absent,
      }));

    // streaks (business days only)
    let current = 0;
    let longest = 0;
    let temp = 0;
    const businessDaily = daily.filter(d => d.total > 0);
    for (let i = businessDaily.length - 1; i >= 0; i--) {
      const d = businessDaily[i];
      const isHere = d.present + d.late > 0;
      if (isHere) current++;
      else break;
    }
    for (const d of businessDaily) {
      const isHere = d.present + d.late > 0;
      if (isHere) {
        temp++;
        longest = Math.max(longest, temp);
      } else {
        temp = 0;
      }
    }

    return {
      range,
      totals: {
        ...totals,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
      },
      daily,
      distribution,
      weekly: last7,
      streak: { current, longest },
      warning: { isBelowThreshold: attendanceRate < warningThreshold, threshold: warningThreshold },
    };
  }

  // Subscribe to real-time analytics updates for a specific student
  subscribeToStudentAnalytics(studentId: string, range: DateRange, callback: (analytics: StudentAnalytics) => void): () => void {
    // Listen for attendance changes in the specified range
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId),
      where('date', '>=', range.startDate),
      where('date', '<=', range.endDate)
    );

    console.log(`📡 Setting up real-time analytics listener for student ${studentId}`);

    const unsubscribe = onSnapshot(attendanceQuery, async () => {
      try {
        const analytics = await this.getStudentAnalytics(studentId, range);
        callback(analytics);
      } catch (error) {
        console.error('❌ Error updating real-time student analytics:', error);
      }
    });

    return unsubscribe;
  }
  // Subscribe to real-time analytics updates for admin (all students)
  subscribeToAdminAnalytics(range: DateRange, callback: (analytics: AdminAnalytics) => void): () => void {
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('date', '>=', range.startDate),
      where('date', '<=', range.endDate)
    );

    console.log(`📡 Setting up real-time admin analytics listener for range: ${range.startDate} to ${range.endDate}`);

    const unsubscribe = onSnapshot(attendanceQuery, async () => {
      try {
        const analytics = await this.getAdminAnalytics(range);
        callback(analytics);
      } catch (error) {
        console.error('❌ Error updating real-time admin analytics:', error);
      }
    });

    return unsubscribe;
  }
}

export const attendanceAnalyticsService = AttendanceAnalyticsService.getInstance();

