import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { TimeService } from './timeService';


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

  async markPresentToday(
    studentId: string,
    studentName: string,
    hubId: string,
    hubName: string
  ): Promise<void> {
    const timeService = TimeService.getInstance();
    const today = timeService.getCurrentDateString();
    
    const todayDate = new Date(today);
    const dayOfWeek = todayDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return; 
    }
    
    await convex.mutation(api.dailyAttendance.markPresentToday as any, {
      studentId: studentId as any,
      studentName,
      hubId: hubId as any,
      hubName,
      date: today,
    });
  }

  async isPresentToday(studentId: string): Promise<boolean> {
    const timeService = TimeService.getInstance();
    const today = timeService.getCurrentDateString();

    const records = await convex.query(api.dailyAttendance.getDailyAttendance as any, {
      studentId: studentId as any,
    }) as any[];
    
    const record = records.find(r => r.date === today);
    return record?.status === "present";
  }

  private async getDailyRows(studentId: string, daysToCheck: number): Promise<any[]> {
    const records = await convex.query(api.dailyAttendance.getDailyAttendance as any, {
      studentId: studentId as any,
    }) as any[];

    return records.map(r => ({
      id: r._id,
      date: r.date,
      isPresent: r.status === "present",
      markedAt: new Date(r.createdAt),
    })).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  async getAttendanceStats(studentId: string, daysToCheck: number = 30): Promise<DailyAttendanceStats> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysToCheck);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const records = (await this.getDailyRows(studentId, daysToCheck)).filter(
      (r) => r.date >= startDateStr && r.date <= endDateStr
    );

    const presentDays = records.filter(r => r.isPresent).length;
    const totalDays = Math.min(daysToCheck, this.getBusinessDaysCount(startDate, endDate));
    const absentDays = totalDays - presentDays;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

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

  async getAttendanceCalendar(studentId: string, year: number, month: number): Promise<AttendanceCalendarDay[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const allRecords = await this.getDailyRows(studentId, 365);
    const attendanceMap = new Map();

    allRecords.forEach((data) => {
      if (data.date < startDateStr || data.date > endDateStr) return;
      attendanceMap.set(data.date, {
        isPresent: data.isPresent,
        markedAt: data.markedAt,
      });
    });

    const detailedRecords = await convex.query(api.attendance.getAttendanceHistory as any, { studentId: studentId as any, limitCount: 100 }) as any[];
    const detailedMap = new Map();
    detailedRecords.forEach(record => {
      detailedMap.set(record.date, record);
    });

    const calendar: AttendanceCalendarDay[] = [];
    const timeService = TimeService.getInstance();
    const today = timeService.getCurrentDateString();

    for (let day = 1; day <= endDate.getDate(); day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const attendance = attendanceMap.get(dateStr);
      const detailed = detailedMap.get(dateStr);

      calendar.push({
        date: dateStr,
        isPresent: attendance?.isPresent || false,
        checkInTime: detailed?.checkInTime ? new Date(detailed.checkInTime) : undefined,
        checkOutTime: detailed?.checkOutTime ? new Date(detailed.checkOutTime) : undefined,
        isToday: dateStr === today,
        isFuture: date > new Date(),
      });
    }

    return calendar;
  }

  async getRecentActivity(studentId: string, limitCount: number = 10): Promise<any[]> {
    const activities = (await this.getDailyRows(studentId, Math.max(limitCount * 4, 45))).map((data) => ({
      date: data.date,
      isPresent: data.isPresent,
      markedAt: data.markedAt,
      type: data.isPresent ? 'present' : 'absent',
      description: data.isPresent ? 'Marked Present' : 'Marked Absent',
    }));
    return activities.slice(0, limitCount);
  }

  private calculateStreaks(records: any[]): { currentStreak: number; longestStreak: number } {
    if (records.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const sortedRecords = records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const reversedRecords = [...sortedRecords].reverse();
    for (const record of reversedRecords) {
      if (record.isPresent) currentStreak++;
      else break;
    }

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

  private getBusinessDaysCount(startDate: Date, endDate: Date): number {
    let count = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
  }

  async markAbsent(studentId: string, studentName: string, date: string): Promise<void> {
    await convex.mutation(api.dailyAttendance.markAbsent as any, {
      studentId: studentId as any,
      studentName,
      date,
    });
  }
}
