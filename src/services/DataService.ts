import { format, parseISO, subDays } from 'date-fns';
import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { uniqueToast } from '../utils/toastUtils';
import { TimeService } from './timeService';
import { attendanceAnalyticsService } from './attendanceAnalyticsService';
import { hubIdMatchesScope, resolvedHubLabel, staffMayAccessHubForWrite } from './hubService';
import { isUncommonOrgStaffEmail } from '../constants/staff';
import { isAdminEmail } from '../constants/admin';
import type { User } from '../types';

class DataService {
  private static instance: DataService;
  private usersCache: { rows: any[]; expiresAt: number } | null = null;
  private usersInFlight: Promise<any[]> | null = null;

  static getInstance(): DataService {
    if (!DataService.instance) DataService.instance = new DataService();
    return DataService.instance;
  }

  private invalidateUsersCache(): void {
    this.usersCache = null;
    this.usersInFlight = null;
  }

  private isStudent(u: any) { const t = String(u?.userType || '').trim().toLowerCase(); return !t || t==='attendee'||t==='student'; }
  private isInstructor(u: any) { return String(u?.userType || '').trim().toLowerCase()==='instructor'; }

  private attendanceMatchesHub(row: any, hubId?: string): boolean {
    return hubIdMatchesScope(row?.hubId, hubId);
  }

  private usersForHub(users: any[], hubId?: string): any[] {
    if (!hubId) return users;
    return users.filter((u) => hubIdMatchesScope(u.hubId, hubId));
  }

  // ── Events ──────────────────────────────────────────────────────────

  async getEvents(hubId?: string): Promise<any[]> {
    try {
      return await convex.query(api.events.getAllEvents as any, { hubId }) as any[];
    } catch { return []; }
  }

  async createEvent(eventData: any): Promise<string> {
    const id = await convex.mutation(api.events.createEvent as any, {
      ...eventData,
      startDate: eventData.startDate.toISOString?.() ?? eventData.startDate,
      endDate: eventData.endDate?.toISOString?.() ?? eventData.endDate,
    });
    uniqueToast.success('Event created!');
    return id;
  }

  // ── Attendance ──────────────────────────────────────────────────────

  async getAttendance(userId?: string, hubId?: string): Promise<any[]> {
    try {
      if (userId) {
        const rows = await convex.query(api.attendance.getAttendanceHistory as any, {
          studentId: userId as any,
          limitCount: 500,
        }) as any[];
        let filtered = rows.map((r: any) => ({
          ...r, id: r._id,
          checkInTime: new Date(r.checkInTime),
          checkOutTime: r.checkOutTime ? new Date(r.checkOutTime) : undefined,
        }));
        if (hubId) filtered = filtered.filter((r: any) => hubIdMatchesScope(r.hubId, hubId));
        return filtered;
      }
      const ts = TimeService.getInstance();
      const endDate = ts.getCurrentDateString();
      const startDate = format(subDays(parseISO(endDate), 365), 'yyyy-MM-dd');
      let rows = await convex.query(api.attendance.getAttendanceByDateRange as any, {
        startDate, endDate, hubId,
      }) as any[];
      rows = rows.map((r: any) => ({
        ...r, id: r._id,
        checkInTime: new Date(r.checkInTime),
        checkOutTime: r.checkOutTime ? new Date(r.checkOutTime) : undefined,
      }));
      rows.sort((a: any, b: any) => {
        const ta = a.checkInTime instanceof Date ? a.checkInTime.getTime() : 0;
        const tb = b.checkInTime instanceof Date ? b.checkInTime.getTime() : 0;
        return tb - ta;
      });
      return rows;
    } catch (e) {
      console.error('getAttendance error', e);
      return [];
    }
  }

  async recordAttendance(data: any): Promise<void> {
    const ts = TimeService.getInstance();
    const today = ts.getCurrentDateString();
    await convex.mutation(api.attendance.checkIn as any, {
      studentId: data.studentId as any,
      studentName: data.studentName || '',
      date: today,
      hubId: data.hubId,
      status: 'present',
      method: data.method || 'manual',
    });
  }

  async updateAttendance(id: string, data: any): Promise<void> {
    await convex.mutation(api.events.updateEvent as any, {
      eventId: id as any,
      updates: { ...data, updatedAt: Date.now() },
    });
  }

  // ── Users ───────────────────────────────────────────────────────────

  async getUsers(hubId?: string): Promise<any[]> {
    try {
      const now = Date.now();
      const cacheTtlMs = 30_000;

      let all: any[] | null = null;
      if (this.usersCache && this.usersCache.expiresAt > now) {
        all = this.usersCache.rows;
      } else {
        if (!this.usersInFlight) {
          this.usersInFlight = convex.query(api.users.getAllUsers as any)
            .then((snap: any) =>
              (snap || []).map((d: any) => ({
                ...d,
                id: d._id,
                uid: d._id,
                createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
              }))
            )
            .finally(() => { this.usersInFlight = null; });
        }
        all = await this.usersInFlight;
        this.usersCache = { rows: all, expiresAt: Date.now() + cacheTtlMs };
      }

      return this.usersForHub(all, hubId);
    } catch {
      return [];
    }
  }

  async isEmailLowerTaken(normalizedEmail: string, exceptUid?: string): Promise<boolean> {
    const key = normalizedEmail.trim().toLowerCase();
    if (!key) return false;
    try {
      const users = await convex.query(api.users.getAllUsers as any) as any[];
      const match = users.find((u: any) => u.emailLower === key);
      if (!match) return false;
      if (exceptUid && match._id === exceptUid) return false;
      return true;
    } catch { return false; }
  }

  async updateUser(userId: string, data: any, actingUser?: User | null): Promise<void> {
    if (actingUser?.userType === 'instructor') {
      const users = await convex.query(api.users.getAllUsers as any) as any[];
      const target = users.find((u: any) => u._id === userId);
      if (!target) throw new Error('User not found');
      if (!staffMayAccessHubForWrite(actingUser, target.hubId)) {
        throw new Error('You can only edit accounts in your hub.');
      }
      if (data?.userType === 'admin') {
        throw new Error('Only administrators can grant admin access.');
      }
    }
    if (data?.userType === 'admin' && actingUser?.userType !== 'admin') {
      throw new Error('Only administrators can grant admin access.');
    }
    await convex.mutation(api.users.adminUpdateUser as any, {
      userId: userId as any,
      ...data,
    });
    this.invalidateUsersCache();
    uniqueToast.success('User updated!');
  }

  async setUserRole(
    targetUserId: string,
    newRole: 'admin' | 'instructor' | 'attendee',
    actingUser: User | null | undefined
  ): Promise<void> {
    if (!actingUser || actingUser.userType !== 'admin') {
      throw new Error('Only administrators can change staff roles.');
    }

    const uid = targetUserId?.trim();
    if (!uid) throw new Error('Missing user id.');

    const users = await convex.query(api.users.getAllUsers as any) as any[];
    const target = users.find((u: any) => u._id === uid);
    if (!target) throw new Error('User not found.');

    const currentType = String(target.userType || '').toLowerCase();
    const email = String(target.email || '').trim();

    if (newRole === 'admin') {
      if (currentType === 'admin') throw new Error('This account already has admin access.');
      if (currentType !== 'instructor' && currentType !== 'attendee') {
        throw new Error('Only instructors or students can be promoted to admin.');
      }
      await convex.mutation(api.users.adminUpdateUser as any, {
        userId: uid as any,
        userType: 'admin',
      });
      this.invalidateUsersCache();
      uniqueToast.success('Admin access granted. Ask them to sign out and sign in again to refresh their session.');
      return;
    }

    if (currentType === 'admin') {
      if (isAdminEmail(email)) {
        throw new Error('The primary bootstrap admin account cannot be demoted.');
      }
      const patch: Record<string, any> = { userType: 'instructor' };
      if (!target.hubId) {
        patch.hubId = 'uncommon_victoriafalls';
        patch.hubName = resolvedHubLabel({ hubId: patch.hubId });
      }
      await convex.mutation(api.users.adminUpdateUser as any, { userId: uid as any, ...patch });
      this.invalidateUsersCache();
      uniqueToast.success('Admin access removed. They are an instructor again.');
      return;
    }

    throw new Error('No role change to apply.');
  }

  async deleteUser(
    userId: string,
    opts?: { suppressToast?: boolean; actingUser?: User | null }
  ): Promise<void> {
    const uid = userId?.trim();
    if (!uid) throw new Error('Missing user id');

    if (opts?.actingUser?.userType === 'instructor') {
      const users = await convex.query(api.users.getAllUsers as any) as any[];
      const target = users.find((u: any) => u._id === uid);
      if (!target) throw new Error('User not found');
      if (!staffMayAccessHubForWrite(opts.actingUser, target.hubId)) {
        throw new Error('You can only remove accounts registered in your hub.');
      }
    }

    const [attendRecords, regRecords] = await Promise.all([
      convex.query(api.attendance.getAttendanceHistory as any, { studentId: uid as any, limitCount: 500 }) as any,
      (async () => { try { return await convex.query(api.events.getUserRegistrations as any, { userId: uid as any }) as any[]; } catch { return []; } })(),
    ]);

    const deletePromises: Promise<any>[] = [];

    if (Array.isArray(attendRecords)) {
      for (const r of attendRecords) {
        deletePromises.push(convex.mutation(api.attendance.unmarkPresentForDate as any, {
          studentId: uid as any,
          date: r.date,
        }));
      }
    }

    if (Array.isArray(regRecords)) {
      for (const r of regRecords) {
        deletePromises.push(convex.mutation(api.events.cancelRegistration as any, { registrationId: r._id }));
      }
    }

    await Promise.all(deletePromises.slice(0, 100));
    await convex.mutation(api.users.deleteUser as any, { userId: uid as any });

    this.invalidateUsersCache();
    if (!opts?.suppressToast) {
      uniqueToast.success('User deleted!');
    }
  }

  async listUncommonOrgStudentProfiles(): Promise<
    Array<{ uid: string; email: string; displayName: string; userType: string }>
  > {
    const users = await convex.query(api.users.getAllUsers as any) as any[];
    const out: Array<{ uid: string; email: string; displayName: string; userType: string }> = [];
    for (const d of users) {
      const email = String(d.email || '').trim();
      if (!email || !isUncommonOrgStaffEmail(email)) continue;
      if (isAdminEmail(email)) continue;
      const t = String(d.userType || '').toLowerCase();
      if (t === 'admin' || t === 'instructor') continue;
      if (t === 'attendee' || t === 'student' || !t) {
        out.push({ uid: d._id, email, displayName: String(d.displayName || 'Unknown'), userType: t || '(blank)' });
      }
    }
    return out;
  }

  async removeUncommonOrgInvalidStudentProfiles(): Promise<{ removed: number; uids: string[] }> {
    const list = await this.listUncommonOrgStudentProfiles();
    const uids: string[] = [];
    for (const row of list) {
      try {
        await this.deleteUser(row.uid, { suppressToast: true });
        uids.push(row.uid);
      } catch (e) {
        console.error('removeUncommonOrgInvalidStudentProfiles failed for', row.uid, e);
      }
    }
    return { removed: uids.length, uids };
  }

  // ── Dashboard stats ─────────────────────────────────────────────────

  async getDashboardStats(hubId?: string): Promise<any> {
    const [events, users] = await Promise.all([this.getEvents(hubId), this.getUsers(hubId)]);
    const students = users.filter(u => this.isStudent(u));
    const ts = TimeService.getInstance();
    const today = ts.getCurrentDateString();

    const todayAttendance = await convex.query(api.attendance.getAllTodayAttendance as any, { date: today, hubId }) as any[];
    let merged = (todayAttendance || []).map((r: any) => ({
      ...r, id: r._id,
      checkInTime: new Date(r.checkInTime),
      checkOutTime: r.checkOutTime ? new Date(r.checkOutTime) : undefined,
    }));

    return {
      totalEvents: events.length,
      activeEvents: events.filter((e: any) => e.eventStatus==='published').length,
      totalAttendees: students.length,
      totalInstructors: users.filter(u => this.isInstructor(u)).length,
      todayAttendance: merged.length,
      lateCount: merged.filter((d: any) => ts.isLate(d.checkInTime)).length,
      recentAttendance: merged.slice(0, 10),
    };
  }

  // ── Real-time summary ───────────────────────────────────────────────

  subscribeToTodayAttendance(callback: (summary: any) => void, hubId?: string): () => void {
    const ts = TimeService.getInstance();
    const today = ts.getCurrentDateString();
    let users: any[] = [];
    let unsubscribes: (() => void)[] = [];

    const emit = async () => {
      try {
        const attendance = await convex.query(api.attendance.getAllTodayAttendance as any, { date: today, hubId }) as any[];
        let merged = (attendance || []).map((r: any) => ({
          ...r, id: r._id,
          checkInTime: new Date(r.checkInTime),
          checkOutTime: r.checkOutTime ? new Date(r.checkOutTime) : undefined,
        }));
        callback(this._buildSummary(today, users, merged));
      } catch (e) {
        console.error('subscribeToTodayAttendance emit error:', e);
      }
    };

    this.getUsers(hubId).then((u) => {
      users = u;
      emit();
    });

    const watch = convex.watchQuery(
      api.attendance.getAllTodayAttendance as any,
      { date: today },
    );
    const sub = watch.onUpdate(() => { emit(); });
    unsubscribes.push(sub);

    const pollInterval = setInterval(emit, 30000);
    unsubscribes.push(() => clearInterval(pollInterval));

    return () => { unsubscribes.forEach(fn => fn()); };
  }

  private _buildSummary(date: string, users: any[], attendance: any[]) {
    const byStudent = new Map<string, any>();
    attendance.forEach((r) => {
      const sid = r.studentId;
      if (!sid) return;
      const ex = byStudent.get(sid);
      if (!ex) { byStudent.set(sid, r); return; }
      const exIn = !!ex.checkInTime;
      const rIn = !!r.checkInTime;
      if (rIn && !exIn) { byStudent.set(sid, r); return; }
      if (exIn && !rIn) return;
      if (rIn && exIn) {
        const ta = ex.checkInTime instanceof Date ? ex.checkInTime.getTime() : 0;
        const tb = r.checkInTime instanceof Date ? r.checkInTime.getTime() : 0;
        if (tb > ta) byStudent.set(sid, r);
        return;
      }
      byStudent.set(sid, r);
    });

    const ts = TimeService.getInstance();
    const list = users.filter(u => this.isStudent(u)).map(u => {
      const uid = u.id || u._id;
      const rec = byStudent.get(uid);
      let status: 'present'|'late'|'absent'|'completed' = 'absent';
      let checkInTime = null, checkOutTime = null, isLate = false;
      let absenceReason: string | undefined;
      let absenceNotes: string | undefined;
      let recordedByName: string | undefined;
      let lateReason: string | undefined;
      let checkInGoal: string | undefined;

      if (rec) {
        const s = (rec.status||'').toLowerCase();
        const explicitAbsent = s === 'absent' || (!!rec.absenceReason && !rec.checkInTime);
        if (explicitAbsent) {
          status = 'absent';
          absenceReason = rec.absenceReason;
          absenceNotes = rec.absenceNotes;
          recordedByName = rec.recordedByName;
        } else if (rec.checkInTime) {
          const recordedCheckout = rec.checkOutTime && (rec.checkOutMethod === 'student' || rec.checkOutMethod === 'staff');
          status = s === 'late' ? 'late' : recordedCheckout ? 'completed' : 'present';
          checkInTime = rec.checkInTime;
          checkOutTime = recordedCheckout ? rec.checkOutTime : null;
          isLate = status==='late' || ts.isLate(rec.checkInTime);
          lateReason = typeof rec.lateReason === 'string' && rec.lateReason.trim() ? rec.lateReason.trim() : undefined;
          checkInGoal = typeof rec.checkInGoal === 'string' && rec.checkInGoal.trim() ? rec.checkInGoal.trim() : undefined;
        }
      }

      return {
        userId: uid,
        userName: u.displayName || 'Unknown',
        userEmail: u.email,
        userType: u.userType,
        hubId: u.hubId,
        hubName: resolvedHubLabel(u),
        status, checkInTime, checkOutTime, checkOutMethod: rec?.checkOutMethod, isLate,
        attendanceId: rec?._id ?? null,
        absenceReason, absenceNotes, recordedByName, lateReason, checkInGoal,
        profileMissing: false,
      };
    });

    const listedIds = new Set<string>();
    list.forEach((row) => { if (row.userId) listedIds.add(String(row.userId).trim()); });

    const orphanRows = Array.from(byStudent.entries())
      .filter(([sid]) => !listedIds.has(String(sid).trim()))
      .map(([sid, rec]) => {
        // Look up the user in the original users array (they might be an admin/instructor)
        const realUser = users.find(u => (u.id || u._id) === sid);
        
        const s = String(rec?.status || '').toLowerCase();
        const explicitAbsent = s === 'absent' || (!!rec?.absenceReason && !rec?.checkInTime);
        const hasCheckIn = !!rec?.checkInTime;
        const status: 'present'|'late'|'absent'|'completed' = explicitAbsent ? 'absent' : hasCheckIn ? (s === 'late' ? 'late' : s === 'completed' ? 'completed' : 'present') : 'absent';
        const isLate = status === 'late' || ts.isLate(rec?.checkInTime);
        
        return {
          userId: String(sid),
          userName: realUser?.displayName || realUser?.firstName || rec?.studentName || realUser?.email || 'User',
          userEmail: realUser?.email || rec?.studentEmail || '',
          userType: realUser?.userType || 'student',
          hubId: realUser?.hubId || rec?.hubId,
          hubName: resolvedHubLabel(realUser || { hubId: rec?.hubId, hubName: rec?.hubName }),
          status, checkInTime: hasCheckIn ? rec.checkInTime : null, checkOutTime: rec?.checkOutTime ?? null, checkOutMethod: rec?.checkOutMethod, isLate,
          attendanceId: rec?._id ?? null,
          absenceReason: rec?.absenceReason, absenceNotes: rec?.absenceNotes, recordedByName: rec?.recordedByName,
          lateReason: rec?.lateReason, checkInGoal: rec?.checkInGoal,
          profileMissing: !realUser,
        };
      });

    return {
      date, totalUsers: list.length + orphanRows.length,
      presentCount: [...list, ...orphanRows].filter(a => a.status!=='absent').length,
      absentCount: [...list, ...orphanRows].filter(a => a.status==='absent').length,
      lateCount: [...list, ...orphanRows].filter(a => a.isLate).length,
      attendanceList: [...list, ...orphanRows],
      recentAttendance: Array.from(byStudent.values()).slice(0, 10),
    };
  }

  // ── Per-student stats ───────────────────────────────────────────────

  async getStudentStats(userId: string, hubId?: string): Promise<any> {
    const range = attendanceAnalyticsService.getDefaultRange('student');
    const analytics = await attendanceAnalyticsService.getStudentAnalytics(userId, range);
    const all = await this.getAttendance(userId, hubId);

    const present = analytics.totals.present + analytics.totals.late;
    return {
      totalCheckIns: present,
      currentStreak: analytics.streak.current,
      longestStreak: analytics.streak.longest,
      attendanceRate: analytics.totals.attendanceRate,
      averageCheckInTime: '9:00 AM',
      lateCheckIns: analytics.totals.late,
      recentActivity: all.slice(0, 10).map((r: any) => ({ ...r, type: 'checkin' })),
    };
  }

  // ── Daily attendance summary ────────────────────────────────────────

  async getDailyAttendanceSummary(date?: string, hubId?: string): Promise<any> {
    const ts = TimeService.getInstance();
    const tgt = date || ts.getCurrentDateString();
    const [users, all] = await Promise.all([this.getUsers(hubId), this.getAttendance(undefined, hubId)]);
    const forDay = all.filter((r: any) => r.date===tgt);
    return this._buildSummary(tgt, users, forDay);
  }

  async getAtRiskStudents(opts?: {
    windowDays?: number; maxRate?: number; minMissedSchoolDays?: number; limit?: number; hubId?: string;
  }): Promise<Array<{ studentId: string; studentName: string; attendanceRate: number; absent: number }>> {
    const windowDays = opts?.windowDays ?? 30;
    const maxRate = opts?.maxRate ?? 85;
    const minMissed = opts?.minMissedSchoolDays ?? 3;
    const limitN = opts?.limit ?? 10;
    const hubId = opts?.hubId;

    const ts = TimeService.getInstance();
    const endDate = ts.getCurrentDateString();
    const startDate = format(subDays(parseISO(endDate), windowDays), 'yyyy-MM-dd');

    const [users, allAttendance] = await Promise.all([this.getUsers(hubId), this.getAttendance(undefined, hubId)]);
    const students = users.filter(u => this.isStudent(u));

    const inRange = allAttendance.filter((r: any) => {
      const d = r.date;
      return d && d >= startDate && d <= endDate;
    });

    const schoolDays = TimeService.getInstance().eachHarareWeekdayInRange(startDate, endDate).length;

    const daysPresentByStudent = new Map<string, Set<string>>();
    inRange.forEach((r: any) => {
      const sid = r.studentId;
      const day = r.date;
      if (!sid || !day) return;
      if (!ts.isHarareWeekday(day)) return;
      if (!daysPresentByStudent.has(sid)) daysPresentByStudent.set(sid, new Set());
      daysPresentByStudent.get(sid)!.add(day);
    });

    return students
      .map((u: any) => {
        const uid = u.id || u._id;
        const presentDays = daysPresentByStudent.get(uid)?.size ?? 0;
        const missed = Math.max(0, schoolDays - presentDays);
        const rate = schoolDays > 0 ? Math.round((presentDays / schoolDays) * 100) : 100;
        return { studentId: uid, studentName: (u.displayName || u.email || 'Unknown') as string, attendanceRate: rate, absent: missed };
      })
      .filter((r) => r.attendanceRate < maxRate || r.absent >= minMissed)
      .sort((a, b) => a.attendanceRate - b.attendanceRate || b.absent - a.absent)
      .slice(0, limitN);
  }

  // ── Admin audit log ─────────────────────────────────────────────────

  async logAdminAction(adminId: string, adminName: string, action: string, targetUserId: string, targetUserName: string, details: any): Promise<void> {
    try {
      await convex.mutation(api.adminActions.log as any, {
        adminId, adminName, action, targetUserId, targetUserName, details,
        date: details.date || TimeService.getInstance().getCurrentDateString(),
      });
    } catch (e) { console.error('logAdminAction failed:', e); }
  }

  // ── Master reset ────────────────────────────────────────────────────

  async masterReset(): Promise<{ deletedUsers: number; deletedAttendance: number; preservedUsers: number }> {
    const ADMIN = 'quintonndlovu161@gmail.com';
    const allUsers = await convex.query(api.users.getAllUsers as any) as any[];
    const del = allUsers.filter((u: any) => u.email?.toLowerCase() !== ADMIN.toLowerCase());
    const keep = allUsers.filter((u: any) => u.email?.toLowerCase() === ADMIN.toLowerCase());

    for (const u of del) {
      await convex.mutation(api.users.adminUpdateUser as any, { userId: u._id, status: 'deleted' });
    }

    const ts = TimeService.getInstance();
    const endDate = ts.getCurrentDateString();
    const startDate = format(subDays(parseISO(endDate), 365), 'yyyy-MM-dd');
    const allAttendance = await convex.query(api.attendance.getAttendanceByDateRange as any, { startDate, endDate }) as any[];
    for (const r of allAttendance) {
      await convex.mutation(api.attendance.unmarkPresentForDate as any, { studentId: r.studentId, date: r.date });
    }

    this.invalidateUsersCache();
    uniqueToast.success(`Reset complete: ${del.length} users, ${allAttendance.length} attendance records deleted.`);
    return { deletedUsers: del.length, deletedAttendance: allAttendance.length, preservedUsers: keep.length };
  }

  async getInstructors(): Promise<any[]> {
    try {
      return await convex.query(api.users.getUsersByType as any, { userType: 'instructor' }) as any[];
    } catch { return []; }
  }

  async getStaffDirectory(): Promise<any[]> {
    try {
      const [instructors, admins] = await Promise.all([
        convex.query(api.users.getUsersByType as any, { userType: 'instructor' }) as Promise<any[]>,
        convex.query(api.users.getUsersByType as any, { userType: 'admin' }) as Promise<any[]>,
      ]);
      const byId = new Map<string, any>();
      for (const d of [...instructors, ...admins]) {
        byId.set(d._id, { id: d._id, ...d });
      }
      return Array.from(byId.values());
    } catch { return []; }
  }

  async testConnection(): Promise<boolean> {
    try {
      await convex.query(api.users.getAllUsers as any);
      return true;
    } catch {
      return false;
    }
  }
}

export default DataService;
