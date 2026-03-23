import { AttendanceRecord, AttendanceStatus } from '../types';
import { db } from './firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

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

// Helper function to check if a record is late
function isLateRecord(record: AttendanceRecord): boolean {
  const status = (record.status || '').toString().toLowerCase().trim();
  if (status === 'late') return true;
  if (status.includes('late')) return true;
    
  const dt = record.checkInTime;
  if (!dt) return false;
   
  let hours: number, minutes: number;
  if (dt instanceof Date && !Number.isNaN(dt.getTime())) {
    hours = dt.getHours();
    minutes = dt.getMinutes();
  } else if (dt && typeof dt === 'object') {
    const dateObj = (dt as any).toDate ? (dt as any).toDate() : new Date(dt as any);
    hours = dateObj.getHours();
    minutes = dateObj.getMinutes();
  } else if (typeof dt === 'string') {
    const dateObj = new Date(dt);
    hours = dateObj.getHours();
    minutes = dateObj.getMinutes();
  } else {
    return false;
  }
   
  return hours > 9 || (hours === 9 && minutes > 0);
}

// Helper function to normalize status
function normalizeStatus(record: AttendanceRecord): AttendanceStatus {
  const status = (record.status || '').toString().toLowerCase();
  if (status === 'late') return 'late';
  if (status === 'completed') return 'completed';
  if (status === 'present') return 'present';
  if (status.includes('late')) return 'late';
  
  return isLateRecord(record) ? 'late' : 'present';
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

  // Get default date range with presets
  getDefaultRange(context: 'admin' | 'student'): DateRange {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      preset: { label: 'Month', value: 'month' },
      startDate: monthAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
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

  // Convert preset to date range
  presetToRange(preset: DateRangePreset): DateRange {
    const now = new Date();
    let startDate: Date;
    
    switch (preset.value) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return {
      preset,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  }

  // Get admin analytics
  async getAdminAnalytics(range: DateRange): Promise<AdminAnalytics> {
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
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate daily data
      const dailyMap = new Map<string, { present: number; late: number; absent: number }>();
      
      for (let d = new Date(startDateStr); d <= new Date(endDateStr); d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dailyMap.set(dateStr, { present: 0, late: 0, absent: 0 });
      }

      records.forEach((record: any) => {
        const normalized = normalizeStatus(record);
        const dayData = dailyMap.get(record.date);
        if (dayData) {
          if (normalized === 'present' || normalized === 'completed') {
            dayData.present++;
          } else if (normalized === 'late') {
            dayData.late++;
          }
        }
      });

      const daily = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          present: data.present,
          late: data.late,
          absent: data.absent
        }))
        .filter(d => d.present > 0 || d.late > 0)
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalPresent = daily.reduce((sum, d) => sum + d.present, 0);
      const totalLate = daily.reduce((sum, d) => sum + d.late, 0);
      
      const distribution = [
        { name: 'Present', value: totalPresent },
        { name: 'Late', value: totalLate },
        { name: 'Absent', value: 0 }
      ];

      // Calculate heatmap data
      const heatmap = daily.map(d => ({
        date: d.date,
        count: d.present + d.late
      }));

      return {
        daily,
        distribution,
        heatmap,
        leaderboardTop: [],
        mostAbsent: [],
        attendanceRate: totalPresent + totalLate > 0 ? Math.round((totalPresent / (totalPresent + totalLate)) * 100) : 0,
        totals: {
          present: totalPresent,
          late: totalLate,
          absent: 0,
          totalDays: daily.length
        }
      };
    } catch (error) {
      console.error('Error getting admin analytics:', error);
      return {
        daily: [],
        distribution: [],
        heatmap: [],
        leaderboardTop: [],
        mostAbsent: [],
        attendanceRate: 0,
        totals: { present: 0, late: 0, absent: 0, totalDays: 0 }
      };
    }
  }

  // Get student analytics
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
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const daily = records.map((record: any) => ({
        date: record.date,
        status: normalizeStatus(record) as 'present' | 'late' | 'absent'
      })).sort((a, b) => a.date.localeCompare(b.date));

      const present = daily.filter(d => d.status === 'present').length;
      const late = daily.filter(d => d.status === 'late').length;
      const absent = daily.filter(d => d.status === 'absent').length;
      const totalDays = daily.length;
      const attendanceRate = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0;

      return {
        daily,
        totals: {
          present,
          late,
          absent,
          totalDays,
          attendanceRate
        },
        streak: {
          current: 0,
          longest: 0
        },
        checkInTimes: [],
        distribution: [
          { name: 'Present', value: present },
          { name: 'Late', value: late },
          { name: 'Absent', value: absent }
        ],
        weekly: [],
        warning: {
          isBelowThreshold: attendanceRate < 75,
          threshold: 75
        },
        range: {
          startDate: startDateStr,
          endDate: endDateStr
        }
      };
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
        range: { startDate: '', endDate: '' }
      };
    }
  }

  // Subscribe to admin analytics
  subscribeToAdminAnalytics(range: DateRange, callback: (data: AdminAnalytics) => void): () => void {
    const startDateStr = range.startDate;
    const endDateStr = range.endDate;

    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('date', '>=', startDateStr),
      where('date', '<=', endDateStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate data similar to getAdminAnalytics
      const dailyMap = new Map<string, { present: number; late: number; absent: number }>();
      
      for (let d = new Date(startDateStr); d <= new Date(endDateStr); d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dailyMap.set(dateStr, { present: 0, late: 0, absent: 0 });
      }

      records.forEach((record: any) => {
        const normalized = normalizeStatus(record);
        const dayData = dailyMap.get(record.date);
        if (dayData) {
          if (normalized === 'present' || normalized === 'completed') {
            dayData.present++;
          } else if (normalized === 'late') {
            dayData.late++;
          }
        }
      });

      const daily = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalPresent = daily.reduce((sum, d) => sum + d.present, 0);
      const totalLate = daily.reduce((sum, d) => sum + d.late, 0);

      callback({
        daily,
        distribution: [
          { name: 'Present', value: totalPresent },
          { name: 'Late', value: totalLate },
          { name: 'Absent', value: 0 }
        ],
        heatmap: daily.map(d => ({ date: d.date, count: d.present + d.late })),
        leaderboardTop: [],
        mostAbsent: [],
        attendanceRate: totalPresent + totalLate > 0 ? Math.round((totalPresent / (totalPresent + totalLate)) * 100) : 0,
        totals: { present: totalPresent, late: totalLate, absent: 0, totalDays: daily.length }
      });
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const daily = records.map((record: any) => ({
        date: record.date,
        status: normalizeStatus(record) as 'present' | 'late' | 'absent'
      })).sort((a, b) => a.date.localeCompare(b.date));

      const present = daily.filter(d => d.status === 'present').length;
      const late = daily.filter(d => d.status === 'late').length;
      const absent = daily.filter(d => d.status === 'absent').length;
      const attendanceRate = daily.length > 0 ? Math.round(((present + late) / daily.length) * 100) : 0;

      callback({
        daily,
        totals: { present, late, absent, totalDays: daily.length, attendanceRate },
        streak: { current: 0, longest: 0 },
        checkInTimes: [],
        distribution: [
          { name: 'Present', value: present },
          { name: 'Late', value: late },
          { name: 'Absent', value: absent }
        ],
        weekly: [],
        warning: {
          isBelowThreshold: attendanceRate < 75,
          threshold: 75
        },
        range: {
          startDate: startDateStr,
          endDate: endDateStr
        }
      });
    });

    return unsubscribe;
  }
}

// Export singleton instance
export const attendanceAnalyticsService = AttendanceAnalyticsService.getInstance();
