import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  Timestamp,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { AttendanceRecord, AttendanceStatus, LocationData } from '../types';
import { DailyAttendanceService } from './dailyAttendanceService';
import { BrowserEmailService } from '../services/emailService';
import { TimeService } from './timeService';

export class AttendanceService {
  private static instance: AttendanceService;
  private emailService: BrowserEmailService;
  private timeService: TimeService;

  public static getInstance(): AttendanceService {
    if (!AttendanceService.instance) {
      AttendanceService.instance = new AttendanceService();
    }
    return AttendanceService.instance;
  }

  constructor() {
    this.emailService = new BrowserEmailService();
    this.timeService = TimeService.getInstance();
  }

  async checkIn(
    studentId: string,
    studentName: string,
    qrCode?: string,
    location?: LocationData,
    skipTimeCheck: boolean = false,
    method: string = 'qr'
  ): Promise<AttendanceRecord> {
    console.log('AttendanceService.checkIn called:', { studentId, studentName, skipTimeCheck, method });

    // 1. Basic validation
    if (!studentId?.trim() || !studentName?.trim()) {
      throw new Error('Student identification is missing');
    }

    // 2. Time & date logic
    const harareTime = this.timeService.getCurrentTime();
    const today = this.timeService.getCurrentDateString();

    // Skip weekend check for admin overrides
    if (!skipTimeCheck) {
      const dayOfWeek = harareTime.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        throw new Error('Attendance is not recorded on weekends.');
      }

      if (!this.timeService.canCheckIn(harareTime)) {
        throw new Error('Check-in is closed. The attendance window is 7:00 AM – 9:05 AM.');
      }
    }

    // 3. Prevent duplicates — doc ID is YYYY-MM-DD_studentId
    const attendanceDocId = `${today}_${studentId}`;
    const attendanceRef = doc(db, 'attendance', attendanceDocId);

    const existingDoc = await getDoc(attendanceRef);
    if (existingDoc.exists() && existingDoc.data().checkInTime) {
      // FIXED: standardized error string — must match StudentDashboard catch block
      throw new Error('Already checked in today');
    }

    // 4. QR validation (if provided)
    if (qrCode) {
      const { qrCodeService } = await import('./qrCodeService');
      const isValid = await qrCodeService.validateCode(qrCode);
      if (!isValid) {
        throw new Error('Invalid or expired check-in code. Ask your instructor for the current code.');
      }
    }

    // 5. Determine status
    // FIXED: isLate at 9:00 AM exactly → 'late'. Before 9:00 AM → 'present'.
    const isLate = this.timeService.isLate(harareTime);
    const status: AttendanceStatus = isLate ? 'late' : 'present';

    const attendanceRecord: any = {
      id: attendanceDocId,
      studentId,
      studentName,
      checkInTime: Timestamp.fromDate(harareTime),
      serverReceivedAt: serverTimestamp(),
      date: today,
      isPresent: true,
      status,
      method,
      deviceId: 'web-app',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Store IP-based location only
    if (location?.ip && location.ip !== '0.0.0.0') {
      attendanceRecord.location = {
        ip: location.ip,
        timestamp: location.timestamp || Date.now(),
      };
    }

    await setDoc(attendanceRef, attendanceRecord);

    // 6. Sync with daily tracking
    const dailyService = DailyAttendanceService.getInstance();
    await dailyService.markPresentToday(studentId, studentName);

    console.log(`✅ Check-in recorded: ${studentName} — ${status} at ${harareTime.toISOString()}`);

    return { ...attendanceRecord, checkInTime: harareTime } as AttendanceRecord;
  }

  async checkOut(studentId: string, location?: LocationData): Promise<AttendanceRecord> {
    const harareTime = this.timeService.getCurrentTime();
    const today = this.timeService.getCurrentDateString();
    const attendanceDocId = `${today}_${studentId}`;
    const attendanceRef = doc(db, 'attendance', attendanceDocId);

    const attendanceDoc = await getDoc(attendanceRef);
    if (!attendanceDoc.exists()) {
      // FIXED: standardized error string — must match StudentDashboard catch block
      throw new Error('No check-in record found for today');
    }

    const attendanceData = attendanceDoc.data();
    if (attendanceData.checkOutTime) {
      // FIXED: standardized error string — must match StudentDashboard catch block
      throw new Error('Already checked out today');
    }

    const updateData: any = {
      checkOutTime: Timestamp.fromDate(harareTime),
      status: 'completed',
      updatedAt: serverTimestamp(),
    };

    if (location?.ip && location.ip !== '0.0.0.0') {
      updateData.location = {
        ...attendanceData.location,
        ip: location.ip,
        checkOutTimestamp: location.timestamp || Date.now(),
      };
    }

    await updateDoc(attendanceRef, updateData);

    return {
      ...attendanceData,
      checkInTime: attendanceData.checkInTime.toDate(),
      checkOutTime: harareTime,
      status: 'completed',
    } as AttendanceRecord;
  }

  async getTodayAttendance(studentId?: string): Promise<AttendanceRecord | null> {
    const today = this.timeService.getCurrentDateString();

    if (studentId) {
      const attendanceDocId = `${today}_${studentId}`;
      const attendanceDoc = await getDoc(doc(db, 'attendance', attendanceDocId));

      if (!attendanceDoc.exists()) return null;

      const data = attendanceDoc.data();
      return {
        ...data,
        checkInTime: data.checkInTime?.toDate(),
        checkOutTime: data.checkOutTime?.toDate(),
      } as AttendanceRecord;
    }

    return null;
  }

  async isCurrentlyCheckedIn(studentId: string): Promise<boolean> {
    const todayAttendance = await this.getTodayAttendance(studentId);
    return !!(todayAttendance?.checkInTime && !todayAttendance?.checkOutTime);
  }

  async getCurrentAttendanceState(studentId: string): Promise<{
    isCheckedIn: boolean;
    checkInTime: Date | null;
    canCheckIn: boolean;
    canCheckOut: boolean;
    status: 'not_checked_in' | 'checked_in' | 'checked_out' | 'absent' | 'late';
    isTooLateToCheckIn: boolean;
  }> {
    const todayAttendance = await this.getTodayAttendance(studentId);
    const now = this.timeService.getCurrentTime();
    const isTooLate = !this.timeService.canCheckIn(now);

    const isCheckedIn = !!(todayAttendance?.checkInTime && !todayAttendance?.checkOutTime);
    const hasCheckedOut = !!todayAttendance?.checkOutTime;
    const hasCheckedIn = !!todayAttendance?.checkInTime;

    let status: 'not_checked_in' | 'checked_in' | 'checked_out' | 'absent' | 'late' = 'not_checked_in';
    if (hasCheckedOut) {
      status = 'checked_out';
    } else if (isCheckedIn) {
      status = todayAttendance?.status === 'late' ? 'late' : 'checked_in';
    } else if (isTooLate && !hasCheckedIn) {
      status = 'absent';
    }

    return {
      isCheckedIn,
      checkInTime: todayAttendance?.checkInTime || null,
      canCheckIn: !hasCheckedIn && !isTooLate,
      canCheckOut: isCheckedIn && !hasCheckedOut,
      status,
      isTooLateToCheckIn: isTooLate,
    };
  }

  async checkForNewDay(studentId: string): Promise<boolean> {
    const todayAttendance = await this.getTodayAttendance(studentId);
    if (!todayAttendance) return true;

    const today = this.timeService.getCurrentDateString();
    const attendanceDate =
      todayAttendance.date ||
      new Date(todayAttendance.checkInTime).toISOString().split('T')[0];

    return attendanceDate !== today;
  }

  async getAttendanceStateWithDayCheck(studentId: string): Promise<{
    isCheckedIn: boolean;
    checkInTime: Date | null;
    canCheckIn: boolean;
    canCheckOut: boolean;
    isNewDay: boolean;
    status: 'not_checked_in' | 'checked_in' | 'checked_out' | 'absent' | 'late';
    isTooLateToCheckIn: boolean;
  }> {
    const isNewDay = await this.checkForNewDay(studentId);
    const currentState = await this.getCurrentAttendanceState(studentId);

    if (isNewDay) {
      const now = this.timeService.getCurrentTime();
      const isTooLate = !this.timeService.canCheckIn(now);
      return {
        isCheckedIn: false,
        checkInTime: null,
        canCheckIn: !isTooLate,
        canCheckOut: false,
        isNewDay: true,
        status: isTooLate ? 'absent' : 'not_checked_in',
        isTooLateToCheckIn: isTooLate,
      };
    }

    return { ...currentState, isNewDay: false };
  }

  async getAllTodayAttendance(): Promise<AttendanceRecord[]> {
    const today = this.timeService.getCurrentDateString();

    const q = query(
      collection(db, 'attendance'),
      where('date', '==', today),
      orderBy('checkInTime', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        ...data,
        checkInTime: data.checkInTime.toDate(),
        checkOutTime: data.checkOutTime?.toDate(),
      } as AttendanceRecord);
    });

    return records;
  }

  async getAttendanceHistory(studentId: string, limitCount: number = 30): Promise<AttendanceRecord[]> {
    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
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

    return records.slice(0, limitCount);
  }

  async getAttendanceByDateRange(
    startDate: string,
    endDate: string,
    studentId?: string
  ): Promise<AttendanceRecord[]> {
    if (startDate === endDate) {
      const q = studentId
        ? query(collection(db, 'attendance'), where('studentId', '==', studentId), where('date', '==', startDate))
        : query(collection(db, 'attendance'), where('date', '==', startDate));

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

    const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const recordDate = data.date;
      const matchesStudent = !studentId || data.studentId === studentId;
      const matchesDate = recordDate >= startDate && recordDate <= endDate;

      if (matchesStudent && matchesDate) {
        records.push({
          ...data,
          checkInTime: data.checkInTime?.toDate(),
          checkOutTime: data.checkOutTime?.toDate(),
        } as AttendanceRecord);
      }
    });

    return records;
  }

  async getCurrentlyPresentStudents(): Promise<AttendanceRecord[]> {
    const today = this.timeService.getCurrentDateString();

    const q = query(
      collection(db, 'attendance'),
      where('date', '==', today),
      where('isPresent', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.checkInTime && !data.checkOutTime) {
        records.push({
          ...data,
          checkInTime: data.checkInTime.toDate(),
        } as AttendanceRecord);
      }
    });

    return records;
  }

  async clearTodayAttendance(): Promise<number> {
    const today = this.timeService.getCurrentDateString();
    const q = query(collection(db, 'attendance'), where('date', '==', today));
    const querySnapshot = await getDocs(q);
    let deletedCount = 0;
    const deletePromises = querySnapshot.docs.map((doc) => {
      deletedCount++;
      return deleteDoc(doc.ref);
    });
    await Promise.all(deletePromises);
    console.log('🗑️ Cleared', deletedCount, 'attendance records for', today);
    return deletedCount;
  }

  async masterResetAttendance(): Promise<{ deletedCount: number }> {
    console.log('🚨 MASTER RESET: Clearing all attendance data...');
    try {
      const [attendanceSnapshot, dailySnapshot] = await Promise.all([
        getDocs(collection(db, 'attendance')),
        getDocs(collection(db, 'dailyAttendance')),
      ]);

      let deletedCount = 0;
      const deletePromises = [
        ...attendanceSnapshot.docs.map((doc) => { deletedCount++; return deleteDoc(doc.ref); }),
        ...dailySnapshot.docs.map((doc) => deleteDoc(doc.ref)),
      ];

      await Promise.all(deletePromises);
      console.log(`✅ MASTER RESET COMPLETE: ${deletedCount} records deleted.`);
      return { deletedCount };
    } catch (error) {
      console.error('❌ Master reset failed:', error);
      throw error;
    }
  }

  async fixExistingLocationRecords(): Promise<{ updated: number; errors: number }> {
    let updated = 0;
    let errors = 0;

    try {
      const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);

      for (const docSnapshot of querySnapshot.docs) {
        try {
          const data = docSnapshot.data();
          const currentAddress = data.location?.address;
          if (!currentAddress) continue;

          let cleanedAddress = currentAddress;
          cleanedAddress = cleanedAddress.replace(/\bat uknown\b/gi, 'at unknown');
          cleanedAddress = cleanedAddress.replace(/\buknown\b/gi, 'unknown');
          cleanedAddress = cleanedAddress.replace(/\bfalss\b/gi, 'Falls');
          cleanedAddress = cleanedAddress.replace(/\bvictoria falss\b/gi, 'Victoria Falls');

          if (
            cleanedAddress.toLowerCase().includes('unknown') ||
            cleanedAddress.toLowerCase().includes('unnamed') ||
            cleanedAddress === 'Unknown Location'
          ) {
            cleanedAddress = 'Vincent Bohlen Hub, South Africa';
          }

          if (cleanedAddress !== currentAddress) {
            await updateDoc(doc(db, 'attendance', docSnapshot.id), {
              'location.address': cleanedAddress,
            });
            updated++;
          }
        } catch (error) {
          console.error(`❌ Error updating record ${docSnapshot.id}:`, error);
          errors++;
        }
      }

      return { updated, errors };
    } catch (error) {
      console.error('❌ Error fixing location records:', error);
      throw error;
    }
  }
}
