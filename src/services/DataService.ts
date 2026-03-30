import {
  collection, doc, getDocs, setDoc, updateDoc,
  query, where, orderBy, limit, addDoc,
  Timestamp, deleteDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { eachDayOfInterval, format, parseISO, subDays } from 'date-fns';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { uniqueToast } from '../utils/toastUtils';
import { TimeService } from './timeService';

class DataService {
  private static instance: DataService;
  private useFirebase = true;

  static getInstance(): DataService {
    if (!DataService.instance) DataService.instance = new DataService();
    return DataService.instance;
  }

  private isStudent(u: any)    { const t = (u?.userType||'').toLowerCase(); return !t || t==='attendee'||t==='student'; }
  private isInstructor(u: any) { return (u?.userType||'').toLowerCase()==='instructor'; }

  /** Extract YYYY-MM-DD from a record that may or may not have a `date` field. */
  private dateStr(record: any): string|undefined {
    if (record.date) return record.date;
    const c = record.checkInTime;
    if (!c) return undefined;
    try {
      if (c.toDate)      return c.toDate().toISOString().split('T')[0];
      if (c.toISOString) return c.toISOString().split('T')[0];
      return new Date(c).toISOString().split('T')[0];
    } catch { return undefined; }
  }

  /** Is the check-in time late? (>= 9:00 AM Harare) */
  private calcIsLate(checkInTime: any): boolean {
    if (!checkInTime) return false;
    try {
      const d = checkInTime instanceof Date ? checkInTime
              : checkInTime.toDate ? checkInTime.toDate()
              : new Date(checkInTime);
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Harare', hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(d);
      const h = Number(parts.find(p=>p.type==='hour')?.value ?? NaN);
      const m = Number(parts.find(p=>p.type==='minute')?.value ?? NaN);
      return Number.isFinite(h) && Number.isFinite(m) && (h > 9 || (h === 9 && m >= 0));
    } catch { return false; }
  }

  async testConnection(): Promise<boolean> {
    try {
      await getDocs(query(collection(db,'events'), limit(1)));
      this.useFirebase = true;
      return true;
    } catch {
      this.useFirebase = false;
      return false;
    }
  }

  // ── Events ──────────────────────────────────────────────────────────────────

  async getEvents(): Promise<any[]> {
    try {
      const snap = await getDocs(query(collection(db,'events'), orderBy('createdAt','desc')));
      return snap.docs.map(d => ({
        id: d.id, ...d.data(),
        startDate: d.data().startDate?.toDate(),
        endDate:   d.data().endDate?.toDate(),
        createdAt: d.data().createdAt?.toDate(),
      }));
    } catch { return []; }
  }

  async createEvent(eventData: any): Promise<string> {
    const ref = await addDoc(collection(db,'events'), {
      ...eventData,
      createdAt: Timestamp.now(),
      startDate: Timestamp.fromDate(eventData.startDate),
      endDate:   Timestamp.fromDate(eventData.endDate),
    });
    uniqueToast.success('Event created!');
    return ref.id;
  }

  // ── Attendance ──────────────────────────────────────────────────────────────

  async getAttendance(userId?: string): Promise<any[]> {
    try {
      const mapDoc = (d: { id: string; data: () => any }) => ({
        id: d.id,
        ...d.data(),
        checkInTime: d.data().checkInTime?.toDate(),
        checkOutTime: d.data().checkOutTime?.toDate(),
      });
      if (userId) {
        // Single-field equality avoids composite index (studentId + checkInTime).
        const q = query(collection(db, 'attendance'), where('studentId', '==', userId));
        const rows = (await getDocs(q)).docs.map(mapDoc);
        rows.sort((a: any, b: any) => {
          const ta = a.checkInTime instanceof Date ? a.checkInTime.getTime() : 0;
          const tb = b.checkInTime instanceof Date ? b.checkInTime.getTime() : 0;
          return tb - ta;
        });
        return rows;
      }
      const q = query(collection(db, 'attendance'), orderBy('checkInTime', 'desc'));
      return (await getDocs(q)).docs.map(mapDoc);
    } catch (e) {
      console.error('getAttendance error', e);
      return [];
    }
  }

  async recordAttendance(data: any): Promise<void> {
    await setDoc(doc(db,'attendance',data.id), {
      ...data,
      checkInTime: Timestamp.fromDate(data.checkInTime),
      status: 'present', createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
  }

  async updateAttendance(id: string, data: any): Promise<void> {
    const payload: any = { ...data, updatedAt: Timestamp.now() };
    if (data.checkOutTime) {
      payload.checkOutTime = Timestamp.fromDate(data.checkOutTime);
      payload.status = 'completed';
    }
    await updateDoc(doc(db,'attendance',id), payload);
  }

  // ── Users ───────────────────────────────────────────────────────────────────

  async getUsers(): Promise<any[]> {
    try {
      return (await getDocs(collection(db,'users'))).docs.map(d => ({
        id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate(),
      }));
    } catch { return []; }
  }

  async updateUser(userId: string, data: any): Promise<void> {
    await updateDoc(doc(db,'users',userId), data);
    uniqueToast.success('User updated!');
  }

  async deleteUser(userId: string): Promise<void> {
    await deleteDoc(doc(db,'users',userId));
    const attendSnap = await getDocs(query(collection(db,'attendance'), where('studentId','==',userId)));
    await Promise.all(attendSnap.docs.map(d => deleteDoc(d.ref)));
    const convoSnap  = await getDocs(query(collection(db,'conversations'), where('studentId','==',userId)));
    await Promise.all(convoSnap.docs.map(d => deleteDoc(d.ref)));
    const regSnap    = await getDocs(query(collection(db,'registrations'), where('studentId','==',userId)));
    await Promise.all(regSnap.docs.map(d => deleteDoc(d.ref)));
    try { await deleteObject(ref(storage,`profile-photos/${userId}/profile.jpg`)); } catch (_) {}
    uniqueToast.success('User deleted!');
  }

  // ── Dashboard stats ─────────────────────────────────────────────────────────

  async getDashboardStats(): Promise<any> {
    const [events, users] = await Promise.all([this.getEvents(), this.getUsers()]);
    const students  = users.filter(u => this.isStudent(u));
    const today     = TimeService.getInstance().getCurrentDateString();
    const todaySnap = await getDocs(query(collection(db,'attendance'), where('date','==',today)));

    return {
      totalEvents:       events.length,
      activeEvents:      events.filter(e => e.eventStatus==='published').length,
      totalAttendees:    students.length,
      totalInstructors:  users.filter(u => this.isInstructor(u)).length,
      todayAttendance:   todaySnap.size,
      lateCount:         todaySnap.docs.filter(d => this.calcIsLate(d.data().checkInTime)).length,
      recentAttendance:  todaySnap.docs.slice(0,10).map(d => ({
        id: d.id, ...d.data(),
        checkInTime:  d.data().checkInTime?.toDate(),
        checkOutTime: d.data().checkOutTime?.toDate(),
      })),
    };
  }

  // ── Real-time summary ───────────────────────────────────────────────────────
  /**
   * FIXED: Load users ONCE upfront — never subscribe to the users collection.
   * The old version subscribed to users, which fired with an empty array first,
   * causing the summary to show 0 present every time a user doc changed.
   */
  subscribeToTodayAttendance(callback: (summary: any) => void): () => void {
    const ts    = TimeService.getInstance();
    const today = ts.getCurrentDateString();

    // Load users once (they don't change mid-session)
    let users: any[] = [];
    const usersReady = this.getUsers().then(u => { users = u; });

    const q = query(
      collection(db,'attendance'),
      where('date','==',today),
      orderBy('checkInTime','desc'),
    );

    const unsub = onSnapshot(q, async snap => {
      await usersReady;
      const attendance = snap.docs.map(d => ({
        id: d.id, ...d.data(),
        checkInTime:  d.data().checkInTime?.toDate(),
        checkOutTime: d.data().checkOutTime?.toDate(),
      }));
      callback(this._buildSummary(today, users, attendance));
    }, err => console.error('attendance listener error:', err));

    return unsub;
  }

  private _buildSummary(date: string, users: any[], attendance: any[]) {
    // Deduplicate: keep newest record per student
    const byStudent = new Map<string, any>();
    attendance.forEach(r => {
      const sid = r.studentId || r.userId;
      if (!sid) return;
      const ex = byStudent.get(sid);
      if (!ex || (r.checkInTime && (!ex.checkInTime || r.checkInTime > ex.checkInTime))) {
        byStudent.set(sid, r);
      }
    });

    const list = users.filter(u => this.isStudent(u)).map(u => {
      const uid = u.uid || u.id;
      const rec = byStudent.get(uid);
      let status: 'present'|'late'|'absent'|'completed' = 'absent';
      let checkInTime = null, checkOutTime = null, isLate = false;

      if (rec) {
        const s = (rec.status||'').toLowerCase();
        status = s==='late' ? 'late' : s==='completed' ? 'completed' : 'present';
        checkInTime  = rec.checkInTime;
        checkOutTime = rec.checkOutTime;
        isLate = status==='late' || this.calcIsLate(rec.checkInTime);
      }

      return {
        userId: uid,
        userName:    u.displayName || 'Unknown',
        userEmail:   u.email,
        userType:    u.userType,
        status, checkInTime, checkOutTime, isLate,
        attendanceId: rec?.id ?? null,
      };
    });

    return {
      date,
      totalUsers:   list.length,
      presentCount: list.filter(a => a.status!=='absent').length,
      absentCount:  list.filter(a => a.status==='absent').length,
      lateCount:    list.filter(a => a.isLate).length,
      attendanceList: list,
      recentAttendance: Array.from(byStudent.values()).slice(0,10),
    };
  }

  // ── Per-student stats ───────────────────────────────────────────────────────

  async getStudentStats(userId: string): Promise<any> {
    const all = await this.getAttendance(userId);

    // Deduplicate by date
    const byDate = new Map<string, any>();
    all.forEach(r => {
      const d = this.dateStr(r);
      if (!d) return;
      const ex = byDate.get(d);
      if (!ex || r.status==='completed' || (!ex.checkOutTime && r.checkOutTime)) byDate.set(d, r);
    });
    const unique = Array.from(byDate.values()).sort(
      (a,b) => new Date(b.date||b.checkInTime).getTime() - new Date(a.date||a.checkInTime).getTime()
    );

    let streak = 0;
    if (unique.length) {
      const today = new Date(); today.setHours(0,0,0,0);
      const last  = new Date(unique[0].date||unique[0].checkInTime); last.setHours(0,0,0,0);
      if (Math.floor((today.getTime()-last.getTime())/86400000) <= 1) {
        streak = 1;
        for (let i=1; i<unique.length; i++) {
          const a = new Date(unique[i-1].date||unique[i-1].checkInTime); a.setHours(0,0,0,0);
          const b = new Date(unique[i].date||unique[i].checkInTime);     b.setHours(0,0,0,0);
          if (Math.floor((a.getTime()-b.getTime())/86400000)===1) streak++; else break;
        }
      }
    }

    const rate = Math.min(100, Math.round((unique.length/30)*100));

    return {
      totalCheckIns:     unique.length,
      currentStreak:     streak,
      attendanceRate:    rate,
      averageCheckInTime:'9:00 AM',
      lateCheckIns:      unique.filter(r=>r.status==='late').length,
      recentActivity:    unique.slice(0,10).map(r => ({ ...r, type:'checkin' })),
    };
  }

  // ── Daily attendance summary (admin, date-filtered) ─────────────────────────

  async getDailyAttendanceSummary(date?: string): Promise<any> {
    const ts  = TimeService.getInstance();
    const tgt = date || ts.getCurrentDateString();
    const [users, all] = await Promise.all([this.getUsers(), this.getAttendance()]);
    const forDay = all.filter(r => this.dateStr(r)===tgt);
    return this._buildSummary(tgt, users, forDay);
  }

  /**
   * Students to flag on the admin home screen: low attendance over a recent window.
   * Uses one attendance fetch + in-memory aggregation (same data model as analytics).
   */
  async getAtRiskStudents(opts?: {
    windowDays?: number;
    maxRate?: number;
    minMissedSchoolDays?: number;
    limit?: number;
  }): Promise<Array<{
    studentId: string;
    studentName: string;
    attendanceRate: number;
    absent: number;
  }>> {
    const windowDays = opts?.windowDays ?? 30;
    const maxRate = opts?.maxRate ?? 85;
    const minMissed = opts?.minMissedSchoolDays ?? 3;
    const limitN = opts?.limit ?? 10;

    const ts = TimeService.getInstance();
    const endDate = ts.getCurrentDateString();
    const startDate = format(subDays(parseISO(endDate), windowDays), 'yyyy-MM-dd');

    const [users, allAttendance] = await Promise.all([this.getUsers(), this.getAttendance()]);
    const students = users.filter(u => this.isStudent(u));

    const inRange = allAttendance.filter((r: any) => {
      const d = r.date || this.dateStr(r);
      return d && d >= startDate && d <= endDate;
    });

    const schoolDays = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    }).filter((d) => {
      const wd = d.getDay();
      return wd !== 0 && wd !== 6;
    }).length;

    const daysPresentByStudent = new Map<string, Set<string>>();
    inRange.forEach((r: any) => {
      const sid = r.studentId;
      const day = r.date || this.dateStr(r);
      if (!sid || !day) return;
      if (!daysPresentByStudent.has(sid)) daysPresentByStudent.set(sid, new Set());
      daysPresentByStudent.get(sid)!.add(day);
    });

    return students
      .map((u) => {
        const uid = u.uid || u.id;
        const presentDays = daysPresentByStudent.get(uid)?.size ?? 0;
        const missed = Math.max(0, schoolDays - presentDays);
        const rate = schoolDays > 0 ? Math.round((presentDays / schoolDays) * 100) : 100;
        return {
          studentId: uid,
          studentName: (u.displayName || u.email || 'Unknown') as string,
          attendanceRate: rate,
          absent: missed,
        };
      })
      .filter((r) => r.attendanceRate < maxRate || r.absent >= minMissed)
      .sort((a, b) => a.attendanceRate - b.attendanceRate || b.absent - a.absent)
      .slice(0, limitN);
  }

  // ── Admin audit log ─────────────────────────────────────────────────────────

  async logAdminAction(adminId: string, adminName: string, action: string, targetUserId: string, targetUserName: string, details: any): Promise<void> {
    try {
      await addDoc(collection(db,'admin_actions'), {
        actionType:'attendance', action, adminId, adminName,
        targetUserId, targetUserName, details,
        timestamp: serverTimestamp(),
        date: details.date || TimeService.getInstance().getCurrentDateString(),
      });
    } catch (e) { console.error('logAdminAction failed:', e); }
  }

  // ── Master reset ────────────────────────────────────────────────────────────

  async masterReset(): Promise<{ deletedUsers: number; deletedAttendance: number; preservedUsers: number }> {
    const ADMIN = 'quintonndlovu161@gmail.com';
    const usersSnap = await getDocs(collection(db,'users'));
    const all   = usersSnap.docs.map(d=>({id:d.id,...d.data()}));
    const del   = all.filter((u:any)=>u.email?.toLowerCase()!==ADMIN.toLowerCase());
    const keep  = all.filter((u:any)=>u.email?.toLowerCase()===ADMIN.toLowerCase());

    await Promise.all(del.map((u:any) => deleteDoc(doc(db,'users',u.id))));

    const [aSnap,rSnap,cSnap] = await Promise.all([
      getDocs(collection(db,'attendance')),
      getDocs(collection(db,'registrations')),
      getDocs(collection(db,'conversations')),
    ]);
    await Promise.all([...aSnap.docs,...rSnap.docs,...cSnap.docs].map(d=>deleteDoc(d.ref)));

    uniqueToast.success(`Reset complete: ${del.length} users, ${aSnap.size} attendance records deleted.`);
    return { deletedUsers: del.length, deletedAttendance: aSnap.size, preservedUsers: keep.length };
  }

  async getInstructors(): Promise<any[]> {
    try {
      return (await getDocs(query(collection(db,'users'), where('userType','==','instructor')))).docs.map(d=>({id:d.id,...d.data()}));
    } catch { return []; }
  }
}

export default DataService;
