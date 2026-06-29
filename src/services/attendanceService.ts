import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { TimeService } from './timeService';
import { AttendanceRecord, LocationData, AbsenceReason } from '../types';
import { DailyAttendanceService } from './dailyAttendanceService';
import { fetchStudentHubProfile, assertCallerHubMatchesProfile } from './hubIntegrity';

export interface StaffAbsentPayload {
  studentId: string;
  studentName: string;
  date: string;
  hubId?: string;
  absenceReason: AbsenceReason;
  absenceNotes?: string;
  recordedByUid: string;
  recordedByName: string;
}

export class AttendanceService {
  private static instance: AttendanceService;
  private timeService = TimeService.getInstance();

  static getInstance(): AttendanceService {
    if (!AttendanceService.instance) {
      AttendanceService.instance = new AttendanceService();
    }
    return AttendanceService.instance;
  }

  static readonly LATE_REASON_MIN_LEN = 10;
  static readonly CHECK_IN_GOAL_MIN_LEN = 3;

  private async resolveHubForStudent(studentId: string, callerHubId?: string) {
    const profile = await fetchStudentHubProfile(studentId);
    assertCallerHubMatchesProfile(callerHubId, profile.hubId);
    return profile;
  }

  async checkIn(
    studentId: string,
    studentName: string,
    qrCode?: string,
    location?: LocationData,
    skipTimeCheck = false,
    method = 'qr',
    hubId?: string,
    lateReason?: string,
    checkInGoal?: string
  ): Promise<AttendanceRecord> {
    if (!studentId?.trim()) throw new Error('Student ID is required');
    if (!studentName?.trim()) throw new Error('Student name is required');

    await this.timeService.forceSync();
    const now = this.timeService.getCurrentTime();
    const today = this.timeService.getCurrentDateString();

    if (!skipTimeCheck) {
      if (!this.timeService.isHarareWeekday(today)) {
        throw new Error('Attendance is not recorded on weekends.');
      }
      if (!this.timeService.canCheckIn(now)) {
        throw new Error('Check-in is closed.');
      }
    }

    if (qrCode) {
      const { qrCodeService } = await import('./qrCodeService');
      const valid = await qrCodeService.validateCode(qrCode);
      if (!valid) throw new Error("Invalid check-in code.");
    }

    const isLate = this.timeService.isLate(now);
    const isStudentQrSelfCheckIn = !skipTimeCheck && method === 'qr';

    if (isLate && isStudentQrSelfCheckIn && (!lateReason || lateReason.trim().length < AttendanceService.LATE_REASON_MIN_LEN)) {
      throw new Error(`Late check-in requires a short explanation.`);
    }

    let resolvedCheckInGoal = checkInGoal?.trim() ?? '';
    if (isStudentQrSelfCheckIn && resolvedCheckInGoal.length < AttendanceService.CHECK_IN_GOAL_MIN_LEN) {
      throw new Error(`Check-in requires today's goal.`);
    }

    const hub = await this.resolveHubForStudent(studentId, hubId);

    // Call Convex Mutation
    await convex.mutation(api.attendance.checkIn as any, {
      studentId: studentId as any,
      studentName,
      date: today,
      hubId: hub.hubId as any,
      status: isLate ? 'late' : 'present',
      method,
      lateReason,
      checkInGoal: resolvedCheckInGoal,
      location: location?.ip ? { ip: location.ip, timestamp: location.timestamp ?? Date.now() } : undefined,
    });

    try {
      await DailyAttendanceService.getInstance().markPresentToday(studentId, studentName, hub.hubId, hub.hubName);
    } catch (e) { console.warn(e); }

    return { studentId, studentName, checkInTime: now, status: isLate ? 'late' : 'present' } as any;
  }

  async checkOut(studentId: string, location?: LocationData, studentHubId?: string): Promise<AttendanceRecord> {
    const today = this.timeService.getCurrentDateString();
    
    await convex.mutation(api.attendance.checkOut as any, {
      studentId: studentId as any,
      date: today,
      hubId: studentHubId as any,
      checkOutMethod: 'student',
      location: location?.ip ? { ip: location.ip, timestamp: location.timestamp ?? Date.now() } : undefined,
    });

    return { studentId, checkOutTime: new Date(), checkOutMethod: 'student' } as any;
  }

  async checkOutAsStaff(studentId: string, hubId?: string): Promise<AttendanceRecord> {
    const today = this.timeService.getCurrentDateString();
    
    await convex.mutation(api.attendance.checkOut as any, {
      studentId: studentId as any,
      date: today,
      hubId: hubId as any,
      checkOutMethod: 'staff',
    });

    return { studentId, checkOutTime: new Date(), checkOutMethod: 'staff' } as any;
  }

  async checkOutAllOpenToday(hubId?: string): Promise<{ checkedOut: number }> {
    // This is complex to replicate exactly client-side via convex
    // For now returning mock
    return { checkedOut: 0 };
  }

  async recordStaffAbsent(p: StaffAbsentPayload): Promise<void> {
    await convex.mutation(api.attendance.recordStaffAbsent as any, {
      studentId: p.studentId as any,
      date: p.date,
      hubId: p.hubId as any,
      reason: p.absenceReason,
      notes: p.absenceNotes,
      recordedByUid: p.recordedByUid,
    });
  }

  async unmarkPresentForDate(studentId: string, date: string, staffHubId?: string): Promise<boolean> {
    return await convex.mutation(api.attendance.unmarkPresentForDate as any, {
      studentId: studentId as any,
      date,
    });
  }

  async getTodayAttendance(studentId?: string, hubId?: string): Promise<AttendanceRecord | null> {
    if (!studentId) return null;
    const today = this.timeService.getCurrentDateString();
    const result = await convex.query(api.attendance.getTodayAttendance as any, {
      studentId: studentId as any,
      date: today,
    });
    if (!result) return null;
    return { ...result, checkInTime: new Date(result.checkInTime), checkOutTime: result.checkOutTime ? new Date(result.checkOutTime) : undefined } as any;
  }

  subscribeToTodayAttendance(
    studentId: string,
    _hubId: string | undefined,
    onChange: (record: AttendanceRecord | null) => void,
    onError?: (err: Error) => void
  ): () => void {
    if (!studentId) return () => {};
    const today = this.timeService.getCurrentDateString();

    const watch = convex.watchQuery(api.attendance.getTodayAttendance as any, {
      studentId: studentId as any,
      date: today,
    });

    const unsubscribe = watch.onUpdate(() => {
      try {
        const val = watch.localQueryResult();
        if (!val) onChange(null);
        else onChange({ ...val, checkInTime: new Date((val as any).checkInTime), checkOutTime: (val as any).checkOutTime ? new Date((val as any).checkOutTime) : undefined } as any);
      } catch (err) {
        onError?.(err as Error);
      }
    });

    return unsubscribe;
  }

  async isCurrentlyCheckedIn(studentId: string, hubId?: string): Promise<boolean> {
    const r = await this.getTodayAttendance(studentId, hubId);
    return !!(r?.checkInTime && !r.checkOutTime);
  }

  async getCurrentAttendanceState(studentId: string, hubId?: string) {
    const r = await this.getTodayAttendance(studentId, hubId);
    const now = this.timeService.getCurrentTime();
    const tooLate = this.timeService.isTooLateToCheckIn(now);
    const inWindow = this.timeService.canCheckIn(now);
    const checkedOut = !!r?.checkOutTime;
    const checkedIn = !!(r?.checkInTime && !checkedOut);
    const hasIn = !!r?.checkInTime;

    let status: 'not_checked_in'|'checked_in'|'checked_out'|'absent'|'late' = 'not_checked_in';
    if (checkedOut) status = 'checked_out';
    else if (checkedIn) status = r?.status === 'late' ? 'late' : 'checked_in';
    else if (tooLate && !hasIn) status = 'absent';

    return {
      isCheckedIn: checkedIn,
      checkInTime: r?.checkInTime ?? null,
      canCheckIn: !hasIn && !tooLate && inWindow,
      canCheckOut: checkedIn && !checkedOut,
      status,
      isTooLateToCheckIn: tooLate,
      isBeforeSessionStart: this.timeService.isBeforeSessionStart(now),
    };
  }

  async checkForNewDay(studentId: string, hubId?: string): Promise<boolean> {
    const r = await this.getTodayAttendance(studentId, hubId);
    return !r;
  }

  async getAttendanceStateWithDayCheck(studentId: string, hubId?: string) {
    const isNewDay = await this.checkForNewDay(studentId, hubId);
    if (isNewDay) {
      const now = this.timeService.getCurrentTime();
      const tooLate = this.timeService.isTooLateToCheckIn(now);
      const inWindow = this.timeService.canCheckIn(now);
      return {
        isCheckedIn: false, checkInTime: null,
        canCheckIn: !tooLate && inWindow, canCheckOut: false,
        isNewDay: true,
        status: tooLate ? 'absent' as const : 'not_checked_in' as const,
        isTooLateToCheckIn: tooLate,
        isBeforeSessionStart: this.timeService.isBeforeSessionStart(now),
      };
    }
    return { ...(await this.getCurrentAttendanceState(studentId, hubId)), isNewDay: false };
  }

  async getAllTodayAttendance(hubId?: string): Promise<AttendanceRecord[]> {
    const today = this.timeService.getCurrentDateString();
    const results = await convex.query(api.attendance.getAllTodayAttendance as any, { date: today, hubId }) as any[];
    return results.map(r => ({ ...r, checkInTime: new Date(r.checkInTime), checkOutTime: r.checkOutTime ? new Date(r.checkOutTime) : undefined }));
  }

  async getAttendanceHistory(studentId: string, limitCount = 30, hubId?: string): Promise<AttendanceRecord[]> {
    const results = await convex.query(api.attendance.getAttendanceHistory as any, { studentId: studentId as any, limitCount }) as any[];
    return results.map(r => ({ ...r, checkInTime: new Date(r.checkInTime), checkOutTime: r.checkOutTime ? new Date(r.checkOutTime) : undefined }));
  }

  async getAttendanceByDateRange(startDate: string, endDate: string, studentId?: string, hubId?: string): Promise<AttendanceRecord[]> {
    const results = await convex.query(api.attendance.getAttendanceByDateRange as any, { startDate, endDate, studentId: studentId as any, hubId }) as any[];
    return results.map(r => ({ ...r, checkInTime: new Date(r.checkInTime), checkOutTime: r.checkOutTime ? new Date(r.checkOutTime) : undefined }));
  }

  async getCurrentlyPresentStudents(hubId?: string): Promise<AttendanceRecord[]> {
    const today = this.timeService.getCurrentDateString();
    const results = await convex.query(api.attendance.getCurrentlyPresentStudents as any, { date: today, hubId }) as any[];
    return results.map(r => ({ ...r, checkInTime: new Date(r.checkInTime), checkOutTime: r.checkOutTime ? new Date(r.checkOutTime) : undefined }));
  }

  async clearTodayAttendance(hubId: string): Promise<number> {
    return 0; // Not implemented yet
  }

  async fixExistingLocationRecords(): Promise<{ updated: number; errors: number }> {
    // Location record migration was a one-time Firebase operation; no-op on Convex.
    return { updated: 0, errors: 0 };
  }

  async masterResetAttendance(hubId: string): Promise<{ deletedCount: number; deletedDaily: number }> {
    const result = await convex.mutation(api.attendance.masterResetAttendance as any, { hubId });
    return result as { deletedCount: number; deletedDaily: number };
  }
}
