import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  Timestamp,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { uniqueToast } from '../utils/toastUtils';
import { TimeService } from './timeService';

const mockEvents: any[] = [];
const mockAttendance: any[] = [];
const mockUsers: any[] = [];

class DataService {
  private static instance: DataService;
  private useFirebase: boolean = true;

  private isStudentUser(user: any): boolean {
    const t = (user?.userType || '').toString().toLowerCase();
    if (!t) return true;
    return t === 'attendee' || t === 'student';
  }

  private isInstructorUser(user: any): boolean {
    const t = (user?.userType || '').toString().toLowerCase();
    return t === 'instructor';
  }

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async testConnection(): Promise<boolean> {
    try {
      await getDocs(query(collection(db, 'events'), limit(1)));
      this.useFirebase = true;
      return true;
    } catch (error) {
      console.warn('⚠️ Firebase connection failed:', error);
      this.useFirebase = false;
      return false;
    }
  }

  async getEvents(): Promise<any[]> {
    if (!this.useFirebase) return mockEvents;
    try {
      const eventsSnapshot = await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')));
      return eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      return mockEvents;
    }
  }

  async createEvent(eventData: any): Promise<string> {
    if (!this.useFirebase) {
      const newEvent = { ...eventData, id: `event-${Date.now()}`, createdAt: new Date() };
      mockEvents.unshift(newEvent);
      return newEvent.id;
    }
    try {
      const docRef = await addDoc(collection(db, 'events'), {
        ...eventData,
        createdAt: Timestamp.now(),
        startDate: Timestamp.fromDate(eventData.startDate),
        endDate: Timestamp.fromDate(eventData.endDate),
      });
      uniqueToast.success('Event created successfully!');
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      uniqueToast.error('Failed to create event');
      throw error;
    }
  }

  async getAttendance(userId?: string): Promise<any[]> {
    if (!this.useFirebase) {
      return userId ? mockAttendance.filter((a) => a.studentId === userId) : mockAttendance;
    }
    try {
      const attendanceQuery = userId
        ? query(collection(db, 'attendance'), where('studentId', '==', userId), orderBy('checkInTime', 'desc'))
        : query(collection(db, 'attendance'), orderBy('checkInTime', 'desc'));

      const attendanceSnapshot = await getDocs(attendanceQuery);
      return attendanceSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        checkInTime: doc.data().checkInTime?.toDate(),
        checkOutTime: doc.data().checkOutTime?.toDate(),
      }));
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return userId ? mockAttendance.filter((a) => a.studentId === userId) : mockAttendance;
    }
  }

  async recordAttendance(attendanceData: any): Promise<void> {
    if (!this.useFirebase) {
      mockAttendance.unshift({ ...attendanceData, id: `att-${Date.now()}`, status: 'present', createdAt: new Date() });
      return;
    }
    try {
      await setDoc(doc(db, 'attendance', attendanceData.id), {
        ...attendanceData,
        checkInTime: Timestamp.fromDate(attendanceData.checkInTime),
        status: 'present',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      uniqueToast.success('Attendance recorded successfully!');
    } catch (error) {
      console.error('Error recording attendance:', error);
      uniqueToast.error('Failed to record attendance');
      throw error;
    }
  }

  async updateAttendance(attendanceId: string, updateData: any): Promise<void> {
    if (!this.useFirebase) {
      const index = mockAttendance.findIndex((a) => a.id === attendanceId);
      if (index !== -1) mockAttendance[index] = { ...mockAttendance[index], ...updateData, updatedAt: new Date() };
      return;
    }
    try {
      const updatePayload: any = { ...updateData, updatedAt: Timestamp.now() };
      if (updateData.checkOutTime) {
        updatePayload.checkOutTime = Timestamp.fromDate(updateData.checkOutTime);
        updatePayload.status = 'completed';
      }
      await updateDoc(doc(db, 'attendance', attendanceId), updatePayload);
      uniqueToast.success('Check-out recorded successfully!');
    } catch (error) {
      console.error('Error updating attendance:', error);
      uniqueToast.error('Failed to update attendance');
      throw error;
    }
  }

  async getUsers(): Promise<any[]> {
    if (!this.useFirebase) return mockUsers;
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      return usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return mockUsers;
    }
  }

  async updateUser(userId: string, userData: any): Promise<void> {
    if (!this.useFirebase) {
      const index = mockUsers.findIndex((u) => u.id === userId);
      if (index !== -1) mockUsers[index] = { ...mockUsers[index], ...userData };
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), userData);
      uniqueToast.success('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      uniqueToast.error('Failed to update user');
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.useFirebase) {
      const index = mockUsers.findIndex((u) => u.id === userId);
      if (index !== -1) mockUsers.splice(index, 1);
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));

      const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', userId));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      await Promise.all(attendanceSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

      const conversationsQuery = query(collection(db, 'conversations'), where('studentId', '==', userId));
      const conversationsSnapshot = await getDocs(conversationsQuery);
      await Promise.all(conversationsSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

      const registrationsQuery = query(collection(db, 'registrations'), where('studentId', '==', userId));
      const registrationsSnapshot = await getDocs(registrationsQuery);
      await Promise.all(registrationsSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

      try {
        await deleteObject(ref(storage, `profile-photos/${userId}/profile.jpg`));
      } catch (storageError: any) {
        if (storageError.code !== 'storage/object-not-found') {
          console.warn('⚠️ Could not delete profile photo:', storageError.message);
        }
      }

      uniqueToast.success('Account and all associated data deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      uniqueToast.error('Failed to delete account data. Please try again.');
      throw error;
    }
  }

  async getDashboardStats(): Promise<any> {
    const events = await this.getEvents();
    const users = await this.getUsers();
    const students = users.filter((u) => this.isStudentUser(u));
    const timeService = TimeService.getInstance();
    const today = timeService.getCurrentDateString();

    const attendanceQuery = query(collection(db, 'attendance'), where('date', '==', today));
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const todayAttendanceCount = attendanceSnapshot.size;

    return {
      totalEvents: events.length,
      activeEvents: events.filter((e) => e.eventStatus === 'published').length,
      totalAttendees: students.length,
      totalInstructors: users.filter((u) => this.isInstructorUser(u)).length,
      todayAttendance: todayAttendanceCount,
      recentAttendance: attendanceSnapshot.docs.slice(0, 10).map((doc) => ({
        id: doc.id,
        ...doc.data(),
        checkInTime: doc.data().checkInTime?.toDate(),
        checkOutTime: doc.data().checkOutTime?.toDate(),
      })),
    };
  }

  /**
   * FIXED: Load users ONCE upfront, then only subscribe to attendance changes.
   * The previous version subscribed to the entire users collection, causing a
   * race condition where an empty allUsers array triggered refreshSummary
   * before users were loaded — breaking all real-time updates.
   */
  subscribeToTodayAttendance(callback: (summary: any) => void): () => void {
    if (!this.useFirebase) {
      this.getDailyAttendanceSummary().then(callback);
      return () => {};
    }

    const timeService = TimeService.getInstance();
    const today = timeService.getCurrentDateString();

    let allUsers: any[] = [];
    // Load users once — they rarely change during a session
    const usersReady = this.getUsers().then((users) => {
      allUsers = users;
    });

    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('date', '==', today),
      orderBy('checkInTime', 'desc')
    );

    const unsubscribeAttendance = onSnapshot(
      attendanceQuery,
      async (attendanceSnapshot) => {
        // Wait for users to finish loading before computing the summary
        await usersReady;

        const dailyAttendance = attendanceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          checkInTime: doc.data().checkInTime?.toDate(),
          checkOutTime: doc.data().checkOutTime?.toDate(),
        }));

        this.refreshSummary(today, allUsers, dailyAttendance, callback);
      },
      (error) => {
        console.error('❌ Error in attendance real-time listener:', error);
      }
    );

    return () => {
      unsubscribeAttendance();
    };
  }

  private async refreshSummary(
    date: string,
    users: any[],
    attendance: any[] | undefined,
    callback: (summary: any) => void
  ) {
    let currentAttendance = attendance;
    if (!currentAttendance) {
      const allAttendance = await this.getAttendance();
      currentAttendance = allAttendance.filter((a) => {
        const dateStr = this.extractDateString(a);
        return dateStr === date;
      });
    }

    // Deduplicate: keep most recent record per student
    const uniqueAttendanceMap = new Map<string, any>();
    currentAttendance.forEach((record) => {
      const studentId = record.studentId || record.userId;
      if (!studentId) return;
      const existing = uniqueAttendanceMap.get(studentId);
      if (
        !existing ||
        (record.checkInTime && (!existing.checkInTime || record.checkInTime > existing.checkInTime))
      ) {
        uniqueAttendanceMap.set(studentId, record);
      }
    });

    const attendanceSummary = users
      .filter((user) => this.isStudentUser(user))
      .map((user) => {
        const studentUid = user.uid || user.id;
        const userAttendance = uniqueAttendanceMap.get(studentUid);

        let status: 'present' | 'late' | 'absent' | 'completed' = 'absent';
        let checkInTime = null;
        let checkOutTime = null;
        let isLate = false;

        if (userAttendance) {
          const rawStatus = (userAttendance.status || '').toString().toLowerCase();
          if (rawStatus === 'late') status = 'late';
          else if (rawStatus === 'completed') status = 'completed';
          else status = 'present';

          checkInTime = userAttendance.checkInTime;
          checkOutTime = userAttendance.checkOutTime;

          // FIXED: isLate if >= 9:00 AM (9:00:00 exactly is late)
          const checkInDate = checkInTime ? new Date(checkInTime) : null;
          const checkInHarare = checkInDate
            ? new Intl.DateTimeFormat('en-US', {
                timeZone: 'Africa/Harare',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).formatToParts(checkInDate)
            : null;
          const h = checkInHarare ? Number(checkInHarare.find((p) => p.type === 'hour')?.value ?? NaN) : NaN;
          const m = checkInHarare ? Number(checkInHarare.find((p) => p.type === 'minute')?.value ?? NaN) : NaN;
          const isLateCalc = Number.isFinite(h) && Number.isFinite(m) && (h > 9 || (h === 9 && m >= 0));
          isLate = status === 'late' || isLateCalc;
        }

        return {
          userId: studentUid,
          userName: user.displayName || 'Unknown',
          userEmail: user.email,
          userType: user.userType,
          status,
          checkInTime,
          checkOutTime,
          isLate,
          attendanceId: userAttendance?.id || null,
        };
      });

    callback({
      date,
      totalUsers: attendanceSummary.length,
      presentCount: attendanceSummary.filter(
        (a) => a.status === 'present' || a.status === 'completed' || a.status === 'late'
      ).length,
      absentCount: attendanceSummary.filter((a) => a.status === 'absent').length,
      lateCount: attendanceSummary.filter((a) => a.isLate).length,
      attendanceList: attendanceSummary,
      recentAttendance: Array.from(uniqueAttendanceMap.values()).slice(0, 10),
    });
  }

  /**
   * FIXED: Extracts a YYYY-MM-DD date string from a record, handling both
   * records that have a `date` field and older records that only have `checkInTime`.
   */
  private extractDateString(record: any): string | undefined {
    if (record.date) return record.date;
    if (record.checkInTime) {
      const checkIn = record.checkInTime;
      if (checkIn.toDate) return checkIn.toDate().toISOString().split('T')[0];
      if (checkIn.toISOString) return checkIn.toISOString().split('T')[0];
      try { return new Date(checkIn).toISOString().split('T')[0]; } catch (_) {}
    }
    return undefined;
  }

  async getStudentStats(userId: string): Promise<any> {
    const userAttendance = await this.getAttendance(userId);

    // Deduplicate by date — keep best record per day
    const uniqueDailyAttendance = Array.from(
      userAttendance
        .reduce((map, record) => {
          const dateStr = this.extractDateString(record);
          if (!dateStr) return map;
          const existing = map.get(dateStr);
          if (
            !existing ||
            record.status === 'completed' ||
            (!existing.checkOutTime && record.checkOutTime)
          ) {
            map.set(dateStr, record);
          }
          return map;
        }, new Map())
        .values()
    ).sort(
      (a: any, b: any) =>
        new Date(b.date || b.checkInTime).getTime() - new Date(a.date || a.checkInTime).getTime()
    );

    // Current streak
    let currentStreak = 0;
    if (uniqueDailyAttendance.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mostRecentDateStr =
        (uniqueDailyAttendance[0] as any).date ||
        new Date((uniqueDailyAttendance[0] as any).checkInTime).toISOString().split('T')[0];
      const mostRecentDate = new Date(mostRecentDateStr);
      mostRecentDate.setHours(0, 0, 0, 0);

      const diffInDays = Math.floor((today.getTime() - mostRecentDate.getTime()) / 86400000);

      if (diffInDays <= 1) {
        currentStreak = 1;
        for (let i = 1; i < uniqueDailyAttendance.length; i++) {
          const curr = new Date(
            (uniqueDailyAttendance[i - 1] as any).date || (uniqueDailyAttendance[i - 1] as any).checkInTime
          );
          const prev = new Date(
            (uniqueDailyAttendance[i] as any).date || (uniqueDailyAttendance[i] as any).checkInTime
          );
          curr.setHours(0, 0, 0, 0);
          prev.setHours(0, 0, 0, 0);
          if (Math.floor((curr.getTime() - prev.getTime()) / 86400000) === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    const totalPossibleDays = 30;
    const attendanceRate = Math.min(100, (uniqueDailyAttendance.length / totalPossibleDays) * 100);

    const checkInTimes = uniqueDailyAttendance
      .filter((a: any) => a.checkInTime)
      .map((a: any) => {
        const d = new Date(a.checkInTime);
        return d.getHours() * 60 + d.getMinutes();
      });

    let averageCheckInTime = '9:00 AM';
    if (checkInTimes.length > 0) {
      const avgMins = checkInTimes.reduce((sum, t) => sum + t, 0) / checkInTimes.length;
      const hours = Math.floor(avgMins / 60);
      const mins = Math.floor(avgMins % 60);
      averageCheckInTime = `${hours % 12 || 12}:${mins.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    }

    return {
      totalCheckIns: uniqueDailyAttendance.length,
      currentStreak,
      attendanceRate: Math.round(attendanceRate),
      averageCheckInTime,
      recentActivity: uniqueDailyAttendance.slice(0, 10).map((a: any) => ({
        ...a,
        type: 'checkin',
        id: a.id || `activity-${Date.now()}-${Math.random()}`,
      })),
      lateCheckIns: uniqueDailyAttendance.filter((a: any) => a.status === 'late').length,
    };
  }

  async getDailyAttendanceSummary(date?: string): Promise<any> {
    const timeService = TimeService.getInstance();
    const targetDate = date || timeService.getCurrentDateString();
    const allUsers = await this.getUsers();
    const allAttendance = await this.getAttendance();

    const dailyAttendance = allAttendance.filter((a) => {
      const dateStr = this.extractDateString(a);
      return dateStr === targetDate;
    });

    const uniqueAttendanceMap = new Map<string, any>();
    dailyAttendance.forEach((record) => {
      const studentId = record.studentId || record.userId;
      if (!studentId) return;
      const existing = uniqueAttendanceMap.get(studentId);
      if (
        !existing ||
        (record.checkInTime && (!existing.checkInTime || record.checkInTime > existing.checkInTime))
      ) {
        uniqueAttendanceMap.set(studentId, record);
      }
    });

    const attendanceSummary = allUsers
      .filter((user) => this.isStudentUser(user))
      .map((user) => {
        const studentUid = user.uid || user.id;
        const userAttendance = uniqueAttendanceMap.get(studentUid);

        let status: 'present' | 'late' | 'absent' | 'completed' = 'absent';
        let checkInTime = null;
        let checkOutTime = null;
        let isLate = false;

        if (userAttendance) {
          const rawStatus = (userAttendance.status || '').toString().toLowerCase();
          if (rawStatus === 'late') status = 'late';
          else if (rawStatus === 'completed') status = 'completed';
          else status = 'present';

          checkInTime = userAttendance.checkInTime;
          checkOutTime = userAttendance.checkOutTime;

          // FIXED: isLate if >= 9:00 AM Harare time
          const checkInDate = checkInTime ? new Date(checkInTime) : null;
          const checkInHarare = checkInDate
            ? new Intl.DateTimeFormat('en-US', {
                timeZone: 'Africa/Harare',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).formatToParts(checkInDate)
            : null;
          const h = checkInHarare ? Number(checkInHarare.find((p) => p.type === 'hour')?.value ?? NaN) : NaN;
          const m = checkInHarare ? Number(checkInHarare.find((p) => p.type === 'minute')?.value ?? NaN) : NaN;
          const isLateCalc = Number.isFinite(h) && Number.isFinite(m) && (h > 9 || (h === 9 && m >= 0));
          isLate = status === 'late' || isLateCalc;
        }

        return {
          userId: studentUid,
          userName: user.displayName || 'Unknown',
          userEmail: user.email,
          userType: user.userType,
          status,
          checkInTime,
          checkOutTime,
          isLate,
          attendanceId: userAttendance?.id || null,
        };
      });

    return {
      date: targetDate,
      totalUsers: attendanceSummary.length,
      presentCount: attendanceSummary.filter(
        (a) => a.status === 'present' || a.status === 'completed' || a.status === 'late'
      ).length,
      absentCount: attendanceSummary.filter((a) => a.status === 'absent').length,
      lateCount: attendanceSummary.filter((a) => a.isLate).length,
      attendanceList: attendanceSummary,
    };
  }

  async logAdminAction(
    adminId: string,
    adminName: string,
    action: string,
    targetUserId: string,
    targetUserName: string,
    details: any
  ): Promise<void> {
    if (!this.useFirebase) return;
    try {
      await addDoc(collection(db, 'admin_actions'), {
        actionType: 'attendance',
        action,
        adminId,
        adminName,
        targetUserId,
        targetUserName,
        details: { ...details },
        timestamp: serverTimestamp(),
        date: details.date || TimeService.getInstance().getCurrentDateString(),
      });
    } catch (error) {
      console.error('❌ Failed to log admin action:', error);
    }
  }

  private getCurrentDateString(): string {
    return TimeService.getInstance().getCurrentDateString();
  }

  async getInstructors(): Promise<any[]> {
    if (!this.useFirebase) return mockUsers.filter((u) => this.isInstructorUser(u));
    try {
      const usersSnapshot = await getDocs(
        query(collection(db, 'users'), where('userType', '==', 'instructor'))
      );
      return usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching instructors:', error);
      return [];
    }
  }

  async masterReset(): Promise<{ deletedUsers: number; deletedAttendance: number; preservedUsers: number }> {
    console.log('⚠️ DataService: Starting MASTER RESET...');

    if (!this.useFirebase) {
      const attendees = mockUsers.filter((u) => this.isStudentUser(u));
      const preserved = mockUsers.filter((u) => !this.isStudentUser(u));
      mockUsers.length = 0;
      mockUsers.push(...preserved);
      mockAttendance.length = 0;
      return { deletedUsers: attendees.length, deletedAttendance: 0, preservedUsers: preserved.length };
    }

    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const ADMIN_EMAIL = 'quintonndlovu161@gmail.com';
      const usersToDelete = allUsers.filter((user: any) => user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase());
      const usersToPreserve = allUsers.filter((user: any) => user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

      await Promise.all(usersToDelete.map((user: any) => deleteDoc(doc(db, 'users', user.id))));

      const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
      await Promise.all(attendanceSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

      const registrationsSnapshot = await getDocs(collection(db, 'registrations'));
      await Promise.all(registrationsSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

      const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
      await Promise.all(conversationsSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

      uniqueToast.success(
        `Master Reset complete! Deleted ${usersToDelete.length} users and all attendance records.`
      );

      return {
        deletedUsers: usersToDelete.length,
        deletedAttendance: attendanceSnapshot.size,
        preservedUsers: usersToPreserve.length,
      };
    } catch (error) {
      console.error('❌ Master Reset failed:', error);
      uniqueToast.error('Master Reset failed. Please try again.');
      throw error;
    }
  }
}

export default DataService;
