import {
  collection, doc, setDoc, getDoc, getDocs,
  query, where, orderBy, updateDoc,
  Timestamp, deleteDoc, serverTimestamp,
  addDoc, onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import DataService from './DataService';
import { hubIdMatchesScope, resolvedHubLabel } from './hubService';
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

const ATTENDANCE_PERMISSION_MSG =
  'Could not save attendance. Ask your instructor to verify your hub and profile.';

function mapFirestoreWriteError(err: unknown, context: string): never {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? (err as { code?: string }).code
      : undefined;
  if (code === 'permission-denied') {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[AttendanceService] ${context} permission-denied`, err);
    }
    throw new Error(ATTENDANCE_PERMISSION_MSG);
  }
  throw err instanceof Error ? err : new Error(String(err));
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

  /** Resolve hub from arg or Firestore user profile (Harare attendance must always be hub-scoped). */
  private async resolveHubForStudent(
    studentId: string,
    hubId?: string
  ): Promise<{ hubId: string; hubName: string }> {
    const trimmed = hubId?.trim();
    if (trimmed) {
      return { hubId: trimmed, hubName: resolvedHubLabel({ hubId: trimmed }) };
    }
    try {
      const userSnap = await getDoc(doc(db, 'users', studentId));
      const data = userSnap.exists() ? userSnap.data() : null;
      const fromProfile = data?.hubId != null ? String(data.hubId).trim() : '';
      if (fromProfile) {
        return { hubId: fromProfile, hubName: resolvedHubLabel({ hubId: fromProfile, hubName: data?.hubName }) };
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AttendanceService] resolveHubForStudent failed', e);
      }
    }
    return { hubId: '', hubName: '' };
  }

  // ── Check-in ────────────────────────────────────────────────────────────────

  /** Minimum length for student late self check-in explanation (Harare 9:01+). */
  static readonly LATE_REASON_MIN_LEN = 10;

  /** Required length for student self check-in “goal of the day”. */
  static readonly CHECK_IN_GOAL_MIN_LEN = 3;

  async checkIn(
    studentId: string,
    studentName: string,
    qrCode?: string,
    location?: LocationData,
    skipTimeCheck = false,
    method = 'qr',
    hubId?: string,
    lateReason?: string,
    checkInGoal?: string,
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

    let resolvedCheckInGoal = checkInGoal?.trim() ?? '';
    if (isStudentQrSelfCheckIn && resolvedCheckInGoal.length < AttendanceService.CHECK_IN_GOAL_MIN_LEN) {
      try {
        const { getTodayDailyGoalTitleForCheckIn } = await import('./studentGoalsService');
        const fromGoalsBoard = await getTodayDailyGoalTitleForCheckIn(studentId, today);
        if (fromGoalsBoard) resolvedCheckInGoal = fromGoalsBoard;
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[AttendanceService] could not load today goal from Goals board', e);
        }
      }
    }

    if (isStudentQrSelfCheckIn) {
      if (resolvedCheckInGoal.length < AttendanceService.CHECK_IN_GOAL_MIN_LEN) {
        throw new Error(
          `Check-in requires today's goal (at least ${AttendanceService.CHECK_IN_GOAL_MIN_LEN} characters). Add one on the Goals page or when you check in.`
        );
      }
    }

    const hub = await this.resolveHubForStudent(studentId, hubId);

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

    if (hub.hubId) {
      record.hubId = hub.hubId;
      record.hubName = hub.hubName;
    }

    if (isLate && isStudentQrSelfCheckIn && lateReason?.trim()) {
      record.lateReason = lateReason.trim();
    }

    if (isStudentQrSelfCheckIn && resolvedCheckInGoal) {
      record.checkInGoal = resolvedCheckInGoal;
    }

    if (location?.ip && location.ip !== '0.0.0.0') {
      record.location = { ip: location.ip, timestamp: location.timestamp ?? Date.now() };
    }

    try {
      await setDoc(docRef, record);
    } catch (e) {
      mapFirestoreWriteError(e, `checkIn setDoc attendance/${docId}`);
    }

    if (isLate && isStudentQrSelfCheckIn && lateReason?.trim()) {
      try {
        await addDoc(collection(db, 'late_check_in_events'), {
          studentId,
          studentName,
          hubId: hub.hubId || '',
          date: today,
          reason: lateReason.trim(),
          attendanceDocId: docId,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('late_check_in_events write failed (non-fatal):', e);
      }
    }

    if (isStudentQrSelfCheckIn && resolvedCheckInGoal) {
      try {
        const { upsertDailyGoalFromCheckIn } = await import('./studentGoalsService');
        await upsertDailyGoalFromCheckIn(studentId, resolvedCheckInGoal, today);
      } catch (e) {
        console.warn('goals sync from check-in failed (non-fatal):', e);
      }
    }

    // Mirror to dailyAttendance (best-effort — don't let a failure block check-in)
    try {
      await DailyAttendanceService.getInstance().markPresentToday(studentId, studentName);
    } catch (e) {
      console.warn('dailyAttendance sync failed (non-fatal):', e);
    }

    try {
      const { createNotification } = await import('./notificationFeedService');
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      await createNotification({
        type: isLate ? 'late' : 'check_in',
        title: isLate ? 'Late check-in' : 'Check-in',
        body: `${studentName} at ${timeStr}`,
        hubId: hub.hubId || undefined,
        hubName: hub.hubName || undefined,
        studentId,
        studentName,
      });
    } catch {
      /* non-fatal */
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

    const hub = await this.resolveHubForStudent(studentId, recHub || studentHubId);
    const checkoutDate =
      typeof data.date === 'string' && data.date.length >= 10
        ? data.date
        : today;

    // Include studentId so Firestore rules see it on the merged request.resource (partial updates).
    const base = {
      studentId: data.studentId ?? studentId,
      date: checkoutDate,
      checkOutTime: Timestamp.fromDate(now),
      status: 'completed' as const,
      updatedAt: serverTimestamp(),
      ...(hub.hubId && !recHub ? { hubId: hub.hubId, hubName: hub.hubName } : {}),
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

    try {
      await updateDoc(doc(db, 'attendance', docId), update);
    } catch (e) {
      mapFirestoreWriteError(e, `checkOut updateDoc attendance/${docId}`);
    }

    try {
      const { createNotification } = await import('./notificationFeedService');
      const { resolvedHubLabel } = await import('./hubService');
      const name = String(data.studentName || '');
      const hId = (recHub || studentHubId || '').trim();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      await createNotification({
        type: 'check_out',
        title: 'Check-out',
        body: `${name || 'Student'} at ${timeStr}`,
        hubId: hId || undefined,
        hubName: hId ? resolvedHubLabel({ hubId: hId }) : undefined,
        studentId,
        studentName: name,
      });
    } catch {
      /* non-fatal */
    }

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

  /**
   * Staff correction: remove a mistakenly marked-present record for a date.
   * Returns true when an attendance row existed and was removed.
   */
  async unmarkPresentForDate(studentId: string, date: string, staffHubId?: string): Promise<boolean> {
    const sid = (studentId || '').trim();
    const d = (date || '').trim();
    if (!sid) throw new Error('Missing student id.');
    if (!d) throw new Error('Missing date.');

    const attendanceDocId = `${d}_${sid}`;
    const attendanceRef = doc(db, 'attendance', attendanceDocId);
    const snap = await getDoc(attendanceRef);
    if (!snap.exists()) return false;

    const row = snap.data();
    if (staffHubId && !hubIdMatchesScope(row?.hubId, staffHubId)) {
      throw new Error('You can only update attendance in your hub.');
    }
    if (!row?.checkInTime) {
      throw new Error('This row is not a present check-in record.');
    }

    await deleteDoc(attendanceRef);

    // Keep dailyAttendance in sync so cards/stats recalculate immediately.
    try {
      await deleteDoc(doc(db, 'dailyAttendance', `${sid}_${d}`));
    } catch {
      /* best effort */
    }

    return true;
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

  private mapAttendanceSnapData(d: Record<string, unknown>): AttendanceRecord {
    return {
      ...d,
      checkInTime: this.safeFirestoreDate(d.checkInTime),
      checkOutTime: this.safeFirestoreDate(d.checkOutTime),
    } as AttendanceRecord;
  }

  async getTodayAttendance(studentId?: string, hubId?: string): Promise<AttendanceRecord | null> {
    if (!studentId) return null;
    const today = this.timeService.getCurrentDateString();
    const snap  = await getDoc(doc(db, 'attendance', `${today}_${studentId}`));
    if (!snap.exists()) return null;
    const d = snap.data();
    return this.mapAttendanceSnapData(d);
  }

  /**
   * Live listener for today's attendance doc (`{yyyy-mm-dd}_{studentId}`).
   * Used by the student dashboard so check-in/out updates without a full page reload.
   */
  subscribeToTodayAttendance(
    studentId: string,
    _hubId: string | undefined,
    onChange: (record: AttendanceRecord | null) => void,
    onError?: (err: Error) => void
  ): () => void {
    if (!studentId?.trim()) return () => {};

    const today = this.timeService.getCurrentDateString();
    const docRef = doc(db, 'attendance', `${today}_${studentId}`);

    const emitFromSnap = (snap: Awaited<ReturnType<typeof getDoc>>) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      const d = snap.data() as Record<string, unknown> | undefined;
      if (!d) {
        onChange(null);
        return;
      }
      onChange(this.mapAttendanceSnapData(d));
    };

    const handleListenerError = (err: unknown) => {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (process.env.NODE_ENV === 'development') {
        console.error('[AttendanceService] subscribeToTodayAttendance', err);
      }
      const message =
        code === 'permission-denied'
          ? 'Could not load attendance. Your account may need updated permissions — try signing out and back in, or contact your hub admin.'
          : err instanceof Error
            ? err.message
            : 'Failed to load attendance';
      onError?.(new Error(message));
    };

    // Prime with getDoc so a missing today row does not leave the UI stuck loading.
    void getDoc(docRef)
      .then((snap) => emitFromSnap(snap))
      .catch(handleListenerError);

    return onSnapshot(docRef, emitFromSnap, handleListenerError);
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
    let rows = (await getDocs(q)).docs.map((d) =>
      this.mapAttendanceSnapData({ id: d.id, ...d.data() } as Record<string, unknown>)
    );
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

    return (await getDocs(q)).docs.map((d) =>
      this.mapAttendanceSnapData({ id: d.id, ...d.data() } as Record<string, unknown>)
    )
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
