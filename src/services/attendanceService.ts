import {
  collection, doc, setDoc, getDoc, getDocs,
  query, where, orderBy, updateDoc,
  Timestamp, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { AttendanceRecord, AttendanceStatus, LocationData } from '../types';
import { DailyAttendanceService } from './dailyAttendanceService';
import { TimeService } from './timeService';

export class AttendanceService {
  private static instance: AttendanceService;
  private timeService = TimeService.getInstance();

  static getInstance(): AttendanceService {
    if (!AttendanceService.instance) {
      AttendanceService.instance = new AttendanceService();
    }
    return AttendanceService.instance;
  }

  // ── Check-in ────────────────────────────────────────────────────────────────

  async checkIn(
    studentId: string,
    studentName: string,
    qrCode?: string,
    location?: LocationData,
    skipTimeCheck = false,
    method = 'qr',
  ): Promise<AttendanceRecord> {
    if (!studentId?.trim()) throw new Error('Student ID is required');
    if (!studentName?.trim()) throw new Error('Student name is required');

    const now   = this.timeService.getCurrentTime();
    const today = this.timeService.getCurrentDateString();

    // Weekend guard (skip for admin)
    if (!skipTimeCheck) {
      const dow = now.getDay();
      if (dow === 0 || dow === 6) {
        throw new Error('Attendance is not recorded on weekends.');
      }
      if (!this.timeService.canCheckIn(now)) {
        throw new Error('Check-in is closed. The window is 7:00 AM – 9:05 AM.');
      }
    }

    // Duplicate guard
    const docId  = `${today}_${studentId}`;
    const docRef = doc(db, 'attendance', docId);
    const snap   = await getDoc(docRef);
    if (snap.exists() && snap.data().checkInTime) {
      // STANDARDISED — StudentDashboard catch block checks this exact string
      throw new Error('Already checked in today');
    }

    // QR validation (only when a code is supplied)
    if (qrCode) {
      const { qrCodeService } = await import('./qrCodeService');
      const valid = await qrCodeService.validateCode(qrCode);
      if (!valid) {
        throw new Error('Invalid or expired check-in code. Ask your instructor for today\'s code.');
      }
    }

    const isLate: boolean       = this.timeService.isLate(now);
    const status: AttendanceStatus = isLate ? 'late' : 'present';

    const record: any = {
      id:               docId,
      studentId,
      studentName,
      checkInTime:      Timestamp.fromDate(now),
      serverReceivedAt: serverTimestamp(),
      date:             today,
      isPresent:        true,
      status,
      method,
      deviceId:         'web-app',
      createdAt:        serverTimestamp(),
      updatedAt:        serverTimestamp(),
    };

    if (location?.ip && location.ip !== '0.0.0.0') {
      record.location = { ip: location.ip, timestamp: location.timestamp ?? Date.now() };
    }

    await setDoc(docRef, record);

    // Mirror to dailyAttendance (best-effort — don't let a failure block check-in)
    try {
      await DailyAttendanceService.getInstance().markPresentToday(studentId, studentName);
    } catch (e) {
      console.warn('dailyAttendance sync failed (non-fatal):', e);
    }

    console.log(`✅ ${studentName} checked in — ${status} at ${now.toISOString()}`);
    return { ...record, checkInTime: now } as AttendanceRecord;
  }

  // ── Check-out ───────────────────────────────────────────────────────────────

  async checkOut(studentId: string, location?: LocationData): Promise<AttendanceRecord> {
    const now   = this.timeService.getCurrentTime();
    const today = this.timeService.getCurrentDateString();
    const docId = `${today}_${studentId}`;
    const snap  = await getDoc(doc(db, 'attendance', docId));

    if (!snap.exists()) {
      throw new Error('No check-in record found for today');
    }
    const data = snap.data();
    if (data.checkOutTime) {
      throw new Error('Already checked out today');
    }

    const update: any = {
      checkOutTime: Timestamp.fromDate(now),
      status:       'completed',
      updatedAt:    serverTimestamp(),
    };
    if (location?.ip && location.ip !== '0.0.0.0') {
      update.location = {
        ...data.location,
        ip: location.ip,
        checkOutTimestamp: location.timestamp ?? Date.now(),
      };
    }

    await updateDoc(doc(db, 'attendance', docId), update);
    return {
      ...data,
      checkInTime:  data.checkInTime.toDate(),
      checkOutTime: now,
      status:       'completed',
    } as AttendanceRecord;
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  async getTodayAttendance(studentId?: string): Promise<AttendanceRecord | null> {
    if (!studentId) return null;
    const today = this.timeService.getCurrentDateString();
    const snap  = await getDoc(doc(db, 'attendance', `${today}_${studentId}`));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      ...d,
      checkInTime:  d.checkInTime?.toDate(),
      checkOutTime: d.checkOutTime?.toDate(),
    } as AttendanceRecord;
  }

  async isCurrentlyCheckedIn(studentId: string): Promise<boolean> {
    const r = await this.getTodayAttendance(studentId);
    return !!(r?.checkInTime && !r.checkOutTime);
  }

  async getCurrentAttendanceState(studentId: string) {
    const r      = await this.getTodayAttendance(studentId);
    const now    = this.timeService.getCurrentTime();
    const late   = !this.timeService.canCheckIn(now);
    const checkedIn  = !!(r?.checkInTime && !r?.checkOutTime);
    const checkedOut = !!r?.checkOutTime;
    const hasIn      = !!r?.checkInTime;

    let status: 'not_checked_in'|'checked_in'|'checked_out'|'absent'|'late' = 'not_checked_in';
    if (checkedOut)          status = 'checked_out';
    else if (checkedIn)      status = r?.status === 'late' ? 'late' : 'checked_in';
    else if (late && !hasIn) status = 'absent';

    return {
      isCheckedIn:        checkedIn,
      checkInTime:        r?.checkInTime ?? null,
      canCheckIn:         !hasIn && !late,
      canCheckOut:        checkedIn && !checkedOut,
      status,
      isTooLateToCheckIn: late,
    };
  }

  async checkForNewDay(studentId: string): Promise<boolean> {
    const r = await this.getTodayAttendance(studentId);
    if (!r) return true;
    const today    = this.timeService.getCurrentDateString();
    const recDate  = r.date ?? new Date(r.checkInTime).toISOString().split('T')[0];
    return recDate !== today;
  }

  async getAttendanceStateWithDayCheck(studentId: string) {
    const isNewDay = await this.checkForNewDay(studentId);
    if (isNewDay) {
      const now  = this.timeService.getCurrentTime();
      const late = !this.timeService.canCheckIn(now);
      return {
        isCheckedIn: false, checkInTime: null,
        canCheckIn: !late, canCheckOut: false,
        isNewDay: true,
        status: late ? 'absent' as const : 'not_checked_in' as const,
        isTooLateToCheckIn: late,
      };
    }
    return { ...(await this.getCurrentAttendanceState(studentId)), isNewDay: false };
  }

  async getAllTodayAttendance(): Promise<AttendanceRecord[]> {
    const today = this.timeService.getCurrentDateString();
    const q     = query(collection(db, 'attendance'), where('date','==',today), orderBy('checkInTime','desc'));
    return (await getDocs(q)).docs.map(d => ({
      ...d.data(),
      checkInTime:  d.data().checkInTime?.toDate(),
      checkOutTime: d.data().checkOutTime?.toDate(),
    })) as AttendanceRecord[];
  }

  async getAttendanceHistory(studentId: string, limitCount = 30): Promise<AttendanceRecord[]> {
    const q = query(collection(db,'attendance'), where('studentId','==',studentId), orderBy('date','desc'));
    const docs = (await getDocs(q)).docs.slice(0, limitCount);
    return docs.map(d => ({
      ...d.data(),
      checkInTime:  d.data().checkInTime?.toDate(),
      checkOutTime: d.data().checkOutTime?.toDate(),
    })) as AttendanceRecord[];
  }

  async getAttendanceByDateRange(startDate: string, endDate: string, studentId?: string): Promise<AttendanceRecord[]> {
    let q;
    if (startDate === endDate) {
      q = studentId
        ? query(collection(db,'attendance'), where('studentId','==',studentId), where('date','==',startDate))
        : query(collection(db,'attendance'), where('date','==',startDate));
    } else {
      q = query(collection(db,'attendance'), orderBy('date','desc'));
    }

    return (await getDocs(q)).docs
      .map(d => ({ ...d.data(), checkInTime: d.data().checkInTime?.toDate(), checkOutTime: d.data().checkOutTime?.toDate() }) as AttendanceRecord)
      .filter(r => {
        const dateStr = r.date ?? (r.checkInTime ? new Date(r.checkInTime).toISOString().split('T')[0] : '');
        const matchDate   = dateStr >= startDate && dateStr <= endDate;
        const matchStudent = !studentId || r.studentId === studentId;
        return matchDate && matchStudent;
      });
  }

  async getCurrentlyPresentStudents(): Promise<AttendanceRecord[]> {
    const today = this.timeService.getCurrentDateString();
    const q     = query(collection(db,'attendance'), where('date','==',today), where('isPresent','==',true));
    return (await getDocs(q)).docs
      .filter(d => d.data().checkInTime && !d.data().checkOutTime)
      .map(d => ({ ...d.data(), checkInTime: d.data().checkInTime.toDate() })) as AttendanceRecord[];
  }

  async clearTodayAttendance(): Promise<number> {
    const today = this.timeService.getCurrentDateString();
    const q     = query(collection(db,'attendance'), where('date','==',today));
    const docs  = (await getDocs(q)).docs;
    await Promise.all(docs.map(d => deleteDoc(d.ref)));
    return docs.length;
  }

  async masterResetAttendance(): Promise<{ deletedCount: number }> {
    const [a, b] = await Promise.all([getDocs(collection(db,'attendance')), getDocs(collection(db,'dailyAttendance'))]);
    await Promise.all([...a.docs, ...b.docs].map(d => deleteDoc(d.ref)));
    return { deletedCount: a.docs.length };
  }

  async fixExistingLocationRecords(): Promise<{ updated: number; errors: number }> {
    let updated = 0, errors = 0;
    const docs = (await getDocs(query(collection(db,'attendance'), orderBy('date','desc')))).docs;
    for (const snap of docs) {
      try {
        const addr = snap.data().location?.address;
        if (!addr) continue;
        let clean = addr
          .replace(/\bat uknown\b/gi, 'at unknown')
          .replace(/\buknown\b/gi, 'unknown')
          .replace(/\bfalss\b/gi, 'Falls');
        if (clean.toLowerCase().includes('unknown') || clean === 'Unknown Location') {
          clean = 'Vincent Bohlen Hub, South Africa';
        }
        if (clean !== addr) {
          await updateDoc(doc(db,'attendance',snap.id), { 'location.address': clean });
          updated++;
        }
      } catch { errors++; }
    }
    return { updated, errors };
  }
}
