import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { AttendanceRecord } from '../types';

export interface DailyAttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  currentStreak: number;
  longestStreak: number;
  attendanceRate: number;
  lastAttendanceDate: string | null;
}

export interface AttendanceCalendarDay {
  date: string;
  isPresent: boolean;
  checkInTime?: Date;
  checkOutTime?: Date;
  isToday: boolean;
  isFuture: boolean;
}

export class DailyAttendanceService {
  private static instance: DailyAttendanceService;

  public static getInstance(): DailyAttendanceService {
    if (!DailyAttendanceService.instance) {
      DailyAttendanceService.instance = new DailyAttendanceService();
    }
    return DailyAttendanceService.instance;
  }

  /**
   * Mark a student as present for today when they check in
   */
  async markPresentToday(studentId: string, studentName: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const dailyRecordId = `${studentId}_${today}`;

    const dailyRecord = {
      id: dailyRecordId,
      studentId,
      studentName,
      date: today,
      isPresent: true,
      markedAt: new Date(),
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'dailyAttendance', dailyRecordId), {
      ...dailyRecord,
      markedAt: Timestamp.fromDate(dailyRecord.markedAt),
      createdAt: Timestamp.fromDate(dailyRecord.createdAt),
    });

    console.log(`✅ Marked ${studentName} as present for ${today}`);
  }

  /**
   * Check if student is marked present today
   */
  async isPresentToday(studentId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const dailyRecordId = `${studentId}_${today}`;

    const docRef = doc(db, 'dailyAttendance', dailyRecordId);
    const docSnap = await getDoc(docRef);

    return docSnap.exists() && docSnap.data()?.isPresent === true;
  }

  /**
   * Get attendance statistics for a student
   */
  async getAttendanceStats(studentId: string, daysToCheck: number = 30): Promise<DailyAttendanceStats> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysToCheck);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const q = query(
      collection(db, 'dailyAttendance'),
      where('studentId', '==', studentId),
      where('date', '>=', startDateStr),
      where('date', '<=', endDateStr),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const records: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        date: data.date,
        isPresent: data.isPresent,
        markedAt: data.markedAt?.toDate(),
      });
    });

    // Calculate stats
    const presentDays = records.filter(r => r.isPresent).length;
    const totalDays = Math.min(daysToCheck, this.getBusinessDaysCount(startDate, endDate));
    const absentDays = totalDays - presentDays;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(records);

    const lastAttendanceDate = records.find(r => r.isPresent)?.date || null;

    return {
      totalDays,
      presentDays,
      absentDays,
      currentStreak,
      longestStreak,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      lastAttendanceDate,
    };
  }

  /**
   * Get attendance calendar for a month
   */
  async getAttendanceCalendar(studentId: string, year: number, month: number): Promise<AttendanceCalendarDay[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const q = query(
      collection(db, 'dailyAttendance'),
      where('studentId', '==', studentId),
      where('date', '>=', startDateStr),
      where('date', '<=', endDateStr),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const attendanceMap = new Map();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      attendanceMap.set(data.date, {
        isPresent: data.isPresent,
        markedAt: data.markedAt?.toDate(),
      });
    });

    // Also get detailed attendance records for check-in/out times
    const detailedRecords = await this.getDetailedAttendanceForMonth(studentId, year, month);
    const detailedMap = new Map();
    detailedRecords.forEach(record => {
      detailedMap.set(record.date, record);
    });

    const calendar: AttendanceCalendarDay[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= endDate.getDate(); day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const attendance = attendanceMap.get(dateStr);
      const detailed = detailedMap.get(dateStr);

      calendar.push({
        date: dateStr,
        isPresent: attendance?.isPresent || false,
        checkInTime: detailed?.checkInTime,
        checkOutTime: detailed?.checkOutTime,
        isToday: dateStr === today,
        isFuture: date > new Date(),
      });
    }

    return calendar;
  }

  /**
   * Get recent attendance activity
   */
  async getRecentActivity(studentId: string, limitCount: number = 10): Promise<any[]> {
    const q = query(
      collection(db, 'dailyAttendance'),
      where('studentId', '==', studentId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const activities: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        date: data.date,
        isPresent: data.isPresent,
        markedAt: data.markedAt?.toDate(),
        type: data.isPresent ? 'present' : 'absent',
        description: data.isPresent ? 'Marked Present' : 'Marked Absent',
      });
    });

    return activities;
  }

  /**
   * Calculate current and longest attendance streaks
   */
  private calculateStreaks(records: any[]): { currentStreak: number; longestStreak: number } {
    if (records.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort by date ascending for streak calculation
    const sortedRecords = records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak (from most recent backwards)
    const reversedRecords = [...sortedRecords].reverse();
    for (const record of reversedRecords) {
      if (record.isPresent) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (const record of sortedRecords) {
      if (record.isPresent) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return { currentStreak, longestStreak };
  }

  /**
   * Get business days count between two dates (excluding weekends)
   */
  private getBusinessDaysCount(startDate: Date, endDate: Date): number {
    let count = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  /**
   * Get detailed attendance records for a specific month
   */
  private async getDetailedAttendanceForMonth(studentId: string, year: number, month: number): Promise<AttendanceRecord[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId),
      where('date', '>=', startDateStr),
      where('date', '<=', endDateStr),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        ...data,
        checkInTime: data.checkInTime?.toDate(),
        checkOutTime: data.checkOutTime?.toDate(),
      } as AttendanceRecord);
    });

    return records;
  }

  /**
   * Mark student as absent for a specific date (admin function)
   */
  async markAbsent(studentId: string, studentName: string, date: string): Promise<void> {
    const dailyRecordId = `${studentId}_${date}`;

    const dailyRecord = {
      id: dailyRecordId,
      studentId,
      studentName,
      date,
      isPresent: false,
      markedAt: new Date(),
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'dailyAttendance', dailyRecordId), {
      ...dailyRecord,
      markedAt: Timestamp.fromDate(dailyRecord.markedAt),
      createdAt: Timestamp.fromDate(dailyRecord.createdAt),
    });

    console.log(`❌ Marked ${studentName} as absent for ${date}`);
  }
}
