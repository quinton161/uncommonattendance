import {
  collection, doc, setDoc, getDoc, getDocs,
  query, where, orderBy, updateDoc,
  Timestamp, deleteDoc, serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import DataService from './DataService';
import { hubIdMatchesScope } from './hubService';
import { AbsenceReason, AttendanceRecord, AttendanceStatus, LocationData } from '../types';
import { DailyAttendanceService } from './dailyAttendanceService';
import { TimeService } from './timeService';

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

  // ── Check-in ────────────────────────────────────────────────────────────────

  /** Minimum length for student late self check-in explanation (Harare 9:01+). */
  static readonly LATE_REASON_MIN_LEN = 10;

  async checkIn(
    studentId: string,
    studentName: string,
    qrCode?: string,
    location?: LocationData,
    skipTimeCheck = false,
    method = 'qr',
    hubId?: string,
    lateReason?: string,
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
    const isStudentQrSelfCheckIn = !skipTimeCheck && method === 'qr';

    if (isLate && isStudentQrSelfCheckIn) {
      const r = lateReason?.trim() ?? '';
      if (r.length < AttendanceService.LATE_REASON_MIN_LEN) {
        throw new Error(
          `Late check-in requires a short explanation (at least ${AttendanceService.LATE_REASON_MIN_LEN} characters).`
        );
      }
    }

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

    if (hubId) {
      record.hubId = hubId;
    }

    if (isLate && isStudentQrSelfCheckIn && lateReason?.trim()) {
      record.lateReason = lateReason.trim();
    }

    if (location?.ip && location.ip !== '0.0.0.0') {
      record.location = { ip: location.ip, timestamp: location.timestamp ?? Date.now() };
    }

    await setDoc(docRef, record);

    if (isLate && isStudentQrSelfCheckIn && lateReason?.trim()) {
      try {
        await addDoc(collection(db, 'late_check_in_events'), {
          studentId,
          studentName,
          hubId: hubId?.trim() ?? '',
          date: today,
          reason: lateReason.trim(),
          attendanceDocId: docId,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('late_check_in_events write failed (non-fatal):', e);
      }
    }

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

  async checkOut(studentId: string, location?: LocationData, studentHubId?: string): Promise<AttendanceRecord> {
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
    const recHub = (data.hubId && String(data.hubId).trim()) || '';
    const scope = studentHubId?.trim() || '';
    if (recHub && scope && recHub !== scope) {
      throw new Error('This check-in belongs to a different hub than your profile. Contact support if you changed hubs.');
    }

    // Include studentId so Firestore rules see it on the merged request.resource (partial updates).
    const base = {
      studentId: data.studentId ?? studentId,
      checkOutTime: Timestamp.fromDate(now),
      status: 'completed' as const,
      updatedAt: serverTimestamp(),
    };
    const update =
      location?.ip && location.ip !== '0.0.0.0'
        ? {
            ...base,
            location: {
              ...data.location,
              ip: location.ip,
              checkOutTimestamp: location.timestamp ?? Date.now(),
            },
          }
        : base;

    await updateDoc(doc(db, 'attendance', docId), update);
    return {
      ...data,
      checkInTime:  data.checkInTime.toDate(),
      checkOutTime: now,
      status:       'completed',
    } as AttendanceRecord;
  }

  /**
   * Staff only (Firestore `isStaff` write): close every open session for Harare today.
   * Merges `date == today` with check-in time in today’s Harare window so legacy rows still match.
   */
  async checkOutAllOpenToday(hubId?: string): Promise<{ checkedOut: number }> {
    const today = this.timeService.getCurrentDateString();
    const { start, end } = this.timeService.getHarareDayUtcBounds(today);
    const [snapDate, snapRange] = await Promise.all([
      getDocs(query(collection(db, 'attendance'), where('date', '==', today))),
      getDocs(
        query(
          collection(db, 'attendance'),
          where('checkInTime', '>=', Timestamp.fromDate(start)),
          where('checkInTime', '<=', Timestamp.fromDate(end))
        )
      ),
    ]);
    const byId = new Map<string, (typeof snapDate.docs)[0]>();
    [...snapDate.docs, ...snapRange.docs].forEach((d) => {
      if (!byId.has(d.id)) byId.set(d.id, d);
    });
    const now = this.timeService.getCurrentTime();
    const tOut = Timestamp.fromDate(now);
    const toClose = Array.from(byId.values()).filter((d) => {
      const x = d.data();
      if (!(x.checkInTime && !x.checkOutTime)) return false;
      if (hubId && !hubIdMatchesScope(x.hubId, hubId)) return false;
      return true;
    });
    for (let i = 0; i < toClose.length; i += 10) {
      const chunk = toClose.slice(i, i + 10);
      await Promise.all(
        chunk.map((d) =>
          updateDoc(d.ref, {
            checkOutTime: tOut,
            status: 'completed',
            updatedAt: serverTimestamp(),
          })
        )
      );
    }
    return { checkedOut: toClose.length };
  }

  /**
   * Staff-only: explicit absence for a calendar day (no check-in).
   * Document id remains `{yyyy-mm-dd}_{studentId}` — mutually exclusive with check-in for that day.
   */
  async recordStaffAbsent(p: StaffAbsentPayload): Promise<void> {
    if (!p.absenceReason) throw new Error('Select an absence reason before saving.');
    const docId = `${p.date}_${p.studentId}`;
    const docRef = doc(db, 'attendance', docId);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().checkInTime) {
      throw new Error('This student already checked in for this date.');
    }
    const prev = snap.exists() ? snap.data() : {};
    await setDoc(
      docRef,
      {
        id: docId,
        studentId: p.studentId,
        studentName: p.studentName,
        date: p.date,
        status: 'absent' as const,
        isPresent: false,
        absenceReason: p.absenceReason,
        absenceNotes: (p.absenceNotes || '').trim(),
        recordedByUid: p.recordedByUid,
        recordedByName: p.recordedByName,
        ...(p.hubId ? { hubId: p.hubId } : {}),
        method: 'staff_absent',
        updatedAt: serverTimestamp(),
        createdAt: prev.createdAt || serverTimestamp(),
      },
      { merge: true }
    );
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  /** Student history — legacy rows without hubId count toward Vincent Bohlen only. */
  private matchesStudentHub(record: any, hubId?: string): boolean {
    return hubIdMatchesScope(record?.hubId, hubId);
  }

  /** Staff / instructor lists (same rules as DataService hub scope). */
  private matchesStaffHub(record: any, hubId?: string): boolean {
    return hubIdMatchesScope(record?.hubId, hubId);
  }

  private safeFirestoreDate(v: unknown): Date | undefined {
    if (v == null) return undefined;
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
    if (typeof (v as { toDate?: () => Date }).toDate === 'function') {
      try {
        const d = (v as { toDate: () => Date }).toDate();
        return Number.isNaN(d.getTime()) ? undefined : d;
      } catch {
        return undefined;
      }
    }
    try {
      const d = new Date(v as string | number);
      return Number.isNaN(d.getTime()) ? undefined : d;
    } catch {
      return undefined;
    }
  }

  async getTodayAttendance(studentId?: string, hubId?: string): Promise<AttendanceRecord | null> {
    if (!studentId) return null;
    const today = this.timeService.getCurrentDateString();
    const snap  = await getDoc(doc(db, 'attendance', `${today}_${studentId}`));
    if (!snap.exists()) return null;
    const d = snap.data();
    if (hubId && !hubIdMatchesScope(d.hubId, hubId)) return null;
    return {
      ...d,
      checkInTime:  this.safeFirestoreDate(d.checkInTime),
      checkOutTime: this.safeFirestoreDate(d.checkOutTime),
    } as AttendanceRecord;
  }

  async isCurrentlyCheckedIn(studentId: string, hubId?: string): Promise<boolean> {
    const r = await this.getTodayAttendance(studentId, hubId);
    return !!(r?.checkInTime && !r.checkOutTime);
  }

  async getCurrentAttendanceState(studentId: string, hubId?: string) {
    const r      = await this.getTodayAttendance(studentId, hubId);
    const now    = this.timeService.getCurrentTime();
    const tooLate = this.timeService.isTooLateToCheckIn(now);
    const inWindow = this.timeService.canCheckIn(now);
    const checkedIn  = !!(r?.checkInTime && !r?.checkOutTime);
    const checkedOut = !!r?.checkOutTime;
    const hasIn      = !!r?.checkInTime;

    let status: 'not_checked_in'|'checked_in'|'checked_out'|'absent'|'late' = 'not_checked_in';
    if (checkedOut)          status = 'checked_out';
    else if (checkedIn)      status = r?.status === 'late' ? 'late' : 'checked_in';
    else if (tooLate && !hasIn) status = 'absent';

    return {
      isCheckedIn:        checkedIn,
      checkInTime:        r?.checkInTime ?? null,
      canCheckIn:         !hasIn && !tooLate && inWindow,
      canCheckOut:        checkedIn && !checkedOut,
      status,
      isTooLateToCheckIn: tooLate,
      isBeforeSessionStart: this.timeService.isBeforeSessionStart(now),
    };
  }

  /**
   * True when there is no attendance doc for *today* (Harare) yet.
   * Uses the same doc id as check-in (`{yyyy-mm-dd}_{studentId}`) — do not compare
   * `date` fields or UTC midnights; mismatches blocked checkout and showed wrong state.
   */
  async checkForNewDay(studentId: string, hubId?: string): Promise<boolean> {
    const today = this.timeService.getCurrentDateString();
    const snap = await getDoc(doc(db, 'attendance', `${today}_${studentId}`));
    if (!snap.exists()) return true;
    if (!hubId) return false;
    const d = snap.data();
    return !hubIdMatchesScope(d.hubId, hubId);
  }

  async getAttendanceStateWithDayCheck(studentId: string, hubId?: string) {
    const isNewDay = await this.checkForNewDay(studentId, hubId);
    if (isNewDay) {
      const now  = this.timeService.getCurrentTime();
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

  async getAllTodayAttendance(): Promise<AttendanceRecord[]> {
    const today = this.timeService.getCurrentDateString();
    const q     = query(collection(db, 'attendance'), where('date','==',today), orderBy('checkInTime','desc'));
    return (await getDocs(q)).docs.map(d => ({
      ...d.data(),
      checkInTime:  d.data().checkInTime?.toDate(),
      checkOutTime: d.data().checkOutTime?.toDate(),
    })) as AttendanceRecord[];
  }

  async getAttendanceHistory(studentId: string, limitCount = 30, hubId?: string): Promise<AttendanceRecord[]> {
    const q = query(collection(db, 'attendance'), where('studentId', '==', studentId));
    let rows = (await getDocs(q)).docs.map((d) => ({
      ...d.data(),
      checkInTime: d.data().checkInTime?.toDate(),
      checkOutTime: d.data().checkOutTime?.toDate(),
    })) as AttendanceRecord[];
    if (hubId) {
      rows = rows.filter((r) => this.matchesStudentHub(r, hubId));
    }
    rows.sort((a, b) => {
      const da = (a as any).date || '';
      const db = (b as any).date || '';
      const cmp = db.localeCompare(da);
      if (cmp !== 0) return cmp;
      const ta = a.checkInTime instanceof Date ? a.checkInTime.getTime() : 0;
      const tb = b.checkInTime instanceof Date ? b.checkInTime.getTime() : 0;
      return tb - ta;
    });
    return rows.slice(0, limitCount);
  }

  async getAttendanceByDateRange(startDate: string, endDate: string, studentId?: string, hubId?: string): Promise<AttendanceRecord[]> {
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
        if (!matchDate || !matchStudent) return false;
        if (!hubId) return true;
        if (studentId) return this.matchesStudentHub(r, hubId);
        return this.matchesStaffHub(r, hubId);
      });
  }

  async getCurrentlyPresentStudents(): Promise<AttendanceRecord[]> {
    const today = this.timeService.getCurrentDateString();
    const q     = query(collection(db,'attendance'), where('date','==',today), where('isPresent','==',true));
    return (await getDocs(q)).docs
      .filter(d => d.data().checkInTime && !d.data().checkOutTime)
      .map(d => ({ ...d.data(), checkInTime: d.data().checkInTime.toDate() })) as AttendanceRecord[];
  }

  /**
   * Deletes today’s `attendance` documents for one hub only (including absence rows scoped to that hub).
   */
  async clearTodayAttendance(hubId: string): Promise<number> {
    const hid = hubId?.trim();
    if (!hid) throw new Error('Select a hub to clear today’s attendance.');
    const today = this.timeService.getCurrentDateString();
    const q = query(collection(db, 'attendance'), where('date', '==', today));
    const docs = (await getDocs(q)).docs;
    const toDelete = docs.filter((d) => hubIdMatchesScope(d.data().hubId, hid));
    await Promise.all(toDelete.map((d) => deleteDoc(d.ref)));
    return toDelete.length;
  }

  /**
   * Deletes all historical attendance + daily summary rows for students in this hub only.
   * Does not remove user accounts.
   */
  async masterResetAttendance(hubId: string): Promise<{ deletedCount: number; deletedDaily: number }> {
    const hid = hubId?.trim();
    if (!hid) throw new Error('A hub must be selected to reset attendance.');

    const users = await DataService.getInstance().getUsers(hid);
    const studentIds = new Set(
      users
        .filter((u: any) => {
          const t = (u.userType || '').toLowerCase();
          return !t || t === 'attendee' || t === 'student';
        })
        .map((u: any) => String(u.uid || u.id))
        .filter(Boolean)
    );

    const [aSnap, dSnap] = await Promise.all([
      getDocs(collection(db, 'attendance')),
      getDocs(collection(db, 'dailyAttendance')),
    ]);

    const attToDel = aSnap.docs.filter((d) => hubIdMatchesScope(d.data().hubId, hid));
    const dailyToDel = dSnap.docs.filter((d) => {
      const sid = d.data().studentId;
      return sid && studentIds.has(String(sid));
    });

    await Promise.all([...attToDel, ...dailyToDel].map((d) => deleteDoc(d.ref)));
    return { deletedCount: attToDel.length, deletedDaily: dailyToDel.length };
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
