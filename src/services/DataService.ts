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
  onSnapshot 
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { uniqueToast } from '../utils/toastUtils';
import { TimeService } from './timeService';

// Mock data for fallback
const mockEvents = [
  {
    id: 'event-1',
    title: 'Tech Conference 2024',
    description: 'Annual technology conference with industry leaders',
    startDate: new Date('2024-12-01T09:00:00'),
    endDate: new Date('2024-12-01T17:00:00'),
    location: 'Convention Center',
    capacity: 500,
    isPublic: true,
    eventStatus: 'published',
    organizerId: 'admin',
    imageUrl: '',
    createdAt: new Date()
  },
  {
    id: 'event-2',
    title: 'Workshop: React Development',
    description: 'Hands-on React development workshop',
    startDate: new Date('2024-11-25T10:00:00'),
    endDate: new Date('2024-11-25T16:00:00'),
    location: 'Training Room A',
    capacity: 30,
    isPublic: true,
    eventStatus: 'published',
    organizerId: 'admin',
    imageUrl: '',
    createdAt: new Date()
  },
  {
    id: 'event-3',
    title: 'Team Building Event',
    description: 'Fun team building activities and games',
    startDate: new Date('2024-11-30T14:00:00'),
    endDate: new Date('2024-11-30T18:00:00'),
    location: 'Outdoor Park',
    capacity: 100,
    isPublic: true,
    eventStatus: 'published',
    organizerId: 'admin',
    imageUrl: '',
    createdAt: new Date()
  }
];

const mockAttendance = [
  {
    id: 'att-1',
    studentId: 'user-1',
    studentName: 'John Doe',
    checkInTime: new Date(),
    date: new Date().toISOString().split('T')[0],
    isPresent: true,
    location: { latitude: 0, longitude: 0, address: 'Campus' }
  },
  {
    id: 'att-2',
    studentId: 'user-2',
    studentName: 'Jane Smith',
    checkInTime: new Date(Date.now() - 86400000), // Yesterday
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    isPresent: true,
    location: { latitude: 0, longitude: 0, address: 'Campus' }
  }
];

const mockUsers = [
  {
    id: 'student-001',
    displayName: 'Alex Johnson',
    email: 'alex.johnson@school.edu',
    userType: 'attendee',
    createdAt: new Date(),
    photoUrl: '',
    bio: 'Computer Science Student'
  },
  {
    id: 'student-002',
    displayName: 'Maria Garcia',
    email: 'maria.garcia@school.edu',
    userType: 'attendee',
    createdAt: new Date(),
    photoUrl: '',
    bio: 'Engineering Student'
  },
  {
    id: 'student-003',
    displayName: 'Sam Wilson',
    email: 'sam.wilson@school.edu',
    userType: 'attendee',
    createdAt: new Date(),
    photoUrl: '',
    bio: 'Business Student'
  },
  {
    id: 'student-004',
    displayName: 'Nina Patel',
    email: 'nina.patel@school.edu',
    userType: 'attendee',
    createdAt: new Date(),
    photoUrl: '',
    bio: 'Medicine Student'
  },
  {
    id: 'student-005',
    displayName: 'James Chen',
    email: 'james.chen@school.edu',
    userType: 'attendee',
    createdAt: new Date(),
    photoUrl: '',
    bio: 'Arts Student'
  }
];

class DataService {
  private static instance: DataService;
  private useFirebase: boolean = true;

  private isStudentUser(user: any): boolean {
    const t = (user?.userType || '').toString().toLowerCase();
    // Backward compat: treat missing userType as attendee/student.
    if (!t) return true;
    return t === 'attendee';
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

  // Test Firebase connection
  async testConnection(): Promise<boolean> {
    try {
      await getDocs(query(collection(db, 'events'), limit(1)));
      this.useFirebase = true;
      console.log('✅ Firebase connection successful');
      return true;
    } catch (error) {
      console.warn('⚠️ Firebase connection failed, using mock data:', error);
      this.useFirebase = false;
      // Previously showed an "offline mode" toast here; now we silently fall back to mock data.
      return false;
    }
  }

  // Events
  async getEvents(): Promise<any[]> {
    if (!this.useFirebase) {
      return mockEvents;
    }

    try {
      const eventsSnapshot = await getDocs(
        query(collection(db, 'events'), orderBy('createdAt', 'desc'))
      );
      
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      return events.length > 0 ? events : mockEvents;
    } catch (error) {
      console.error('Error fetching events:', error);
      uniqueToast.error('Failed to load events, using sample data');
      return mockEvents;
    }
  }

  async createEvent(eventData: any): Promise<string> {
    if (!this.useFirebase) {
      const newEvent = {
        ...eventData,
        id: `event-${Date.now()}`,
        createdAt: new Date()
      };
      mockEvents.unshift(newEvent);
      // In offline mode we silently update local mock data without user notification.
      return newEvent.id;
    }

    try {
      const docRef = await addDoc(collection(db, 'events'), {
        ...eventData,
        createdAt: Timestamp.now(),
        startDate: Timestamp.fromDate(eventData.startDate),
        endDate: Timestamp.fromDate(eventData.endDate)
      });
      
      uniqueToast.success('Event created successfully!');
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      uniqueToast.error('Failed to create event');
      throw error;
    }
  }

  // Attendance
  async getAttendance(userId?: string): Promise<any[]> {
    if (!this.useFirebase) {
      return userId ? mockAttendance.filter(a => a.studentId === userId) : mockAttendance;
    }

    try {
      const attendanceQuery = userId 
        ? query(
            collection(db, 'attendance'),
            where('studentId', '==', userId),
            orderBy('checkInTime', 'desc')
          )
        : query(collection(db, 'attendance'), orderBy('checkInTime', 'desc'));

      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      const attendance = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkInTime: doc.data().checkInTime?.toDate(),
        checkOutTime: doc.data().checkOutTime?.toDate()
      }));
      
      return attendance.length > 0 ? attendance : (userId ? mockAttendance.filter(a => a.studentId === userId) : mockAttendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return userId ? mockAttendance.filter(a => a.studentId === userId) : mockAttendance;
    }
  }

  async recordAttendance(attendanceData: any): Promise<void> {
    if (!this.useFirebase) {
      const newAttendance = {
        ...attendanceData,
        id: `att-${Date.now()}`,
        status: 'present',
        createdAt: new Date()
      };
      mockAttendance.unshift(newAttendance);
      // In offline mode we silently update local mock data without user notification.
      return;
    }

    try {
      const attendanceRecord = {
        ...attendanceData,
        checkInTime: Timestamp.fromDate(attendanceData.checkInTime),
        status: 'present', // Mark as present when checking in
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      await setDoc(doc(db, 'attendance', attendanceData.id), attendanceRecord);
      
      uniqueToast.success('Attendance recorded successfully!');
    } catch (error) {
      console.error('Error recording attendance:', error);
      uniqueToast.error('Failed to record attendance');
      throw error;
    }
  }

  async updateAttendance(attendanceId: string, updateData: any): Promise<void> {
    if (!this.useFirebase) {
      const index = mockAttendance.findIndex(a => a.id === attendanceId);
      if (index !== -1) {
        mockAttendance[index] = { 
          ...mockAttendance[index], 
          ...updateData,
          updatedAt: new Date()
        };
      }
      // In offline mode we silently update local mock data without user notification.
      return;
    }

    try {
      const updatePayload: any = { 
        ...updateData,
        updatedAt: Timestamp.now()
      };
      
      if (updateData.checkOutTime) {
        updatePayload.checkOutTime = Timestamp.fromDate(updateData.checkOutTime);
        updatePayload.status = 'completed'; // Mark as completed when checking out
      }

      await updateDoc(doc(db, 'attendance', attendanceId), updatePayload);
      uniqueToast.success('Check-out recorded successfully!');
    } catch (error) {
      console.error('Error updating attendance:', error);
      uniqueToast.error('Failed to update attendance');
      throw error;
    }
  }

  // Users
  async getUsers(): Promise<any[]> {
    if (!this.useFirebase) {
      return mockUsers;
    }

    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      return users.length > 0 ? users : mockUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      return mockUsers;
    }
  }

  async updateUser(userId: string, userData: any): Promise<void> {
    if (!this.useFirebase) {
      const index = mockUsers.findIndex(u => u.id === userId);
      if (index !== -1) {
        mockUsers[index] = { ...mockUsers[index], ...userData };
      }
      // In offline mode we silently update local mock data without user notification.
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
      const index = mockUsers.findIndex(u => u.id === userId);
      if (index !== -1) {
        mockUsers.splice(index, 1);
      }
      // In offline mode we silently update local mock data without user notification.
      return;
    }

    try {
      console.log('🗑️ DataService: Starting comprehensive user data deletion for:', userId);
      
      // 1. Delete user document
      await deleteDoc(doc(db, 'users', userId));
      console.log('🗑️ Deleted: users/', userId);
      
      // 2. Delete attendance records for this user
      const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', userId));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceDeletes = attendanceSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(attendanceDeletes);
      console.log('🗑️ Deleted:', attendanceSnapshot.size, 'attendance records');
      
      // 3. Delete chat conversations where user is involved
      // Conversations are stored with ID format: studentId_adminId
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('studentId', '==', userId)
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);
      const conversationDeletes = conversationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(conversationDeletes);
      console.log('🗑️ Deleted:', conversationsSnapshot.size, 'conversations');
      
      // 4. Delete registrations for this user
      const registrationsQuery = query(collection(db, 'registrations'), where('studentId', '==', userId));
      const registrationsSnapshot = await getDocs(registrationsQuery);
      const registrationDeletes = registrationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(registrationDeletes);
      console.log('🗑️ Deleted:', registrationsSnapshot.size, 'registrations');
      
      // 5. Delete profile photo from storage if exists
      try {
        const profilePhotoRef = ref(storage, `profile-photos/${userId}/profile.jpg`);
        await deleteObject(profilePhotoRef);
        console.log('🗑️ Deleted: profile photo');
      } catch (storageError: any) {
        // File might not exist, which is fine
        if (storageError.code !== 'storage/object-not-found') {
          console.warn('⚠️ Could not delete profile photo:', storageError.message);
        }
      }
      
      console.log('✅ DataService: User and all associated data deleted successfully');
      uniqueToast.success('Account and all associated data deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      uniqueToast.error('Failed to delete account data. Please try again.');
      throw error;
    }
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    const events = await this.getEvents();
    const attendance = await this.getAttendance();
    const users = await this.getUsers();

    const timeService = TimeService.getInstance();
    const today = timeService.getCurrentDateString();
    const todayAttendance = attendance.filter(a => a.date === today);

    return {
      totalEvents: events.length,
      activeEvents: events.filter(e => e.eventStatus === 'published').length,
      totalAttendees: users.filter(u => this.isStudentUser(u)).length,
      totalInstructors: users.filter(u => this.isInstructorUser(u)).length,
      todayAttendance: todayAttendance.length,
      recentAttendance: attendance.slice(0, 10) // Show more recent activity
    };
  }

  // Subscribe to Today's Attendance Summary (Real-time)
  subscribeToTodayAttendance(callback: (summary: any) => void): () => void {
    if (!this.useFirebase) {
      // Fallback for mock data (no real-time support in mock mode)
      this.getDailyAttendanceSummary().then(callback);
      return () => {};
    }

    const timeService = TimeService.getInstance();
    const today = timeService.getCurrentDateString();
    
    console.log('📡 Setting up real-time attendance listener for:', today);

    // 1. Listen for all users (to get the student list)
    // In a real app, users don't change as often as attendance, 
    // but we need them to build the summary.
    let allUsers: any[] = [];
    
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (usersSnapshot) => {
      allUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      }));
      
      // Trigger update whenever users change
      this.refreshSummary(today, allUsers, undefined, callback);
    });

    // 2. Listen for today's attendance records
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('date', '==', today),
      orderBy('checkInTime', 'desc')
    );

    const unsubscribeAttendance = onSnapshot(attendanceQuery, (attendanceSnapshot) => {
      const dailyAttendance = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkInTime: doc.data().checkInTime?.toDate(),
        checkOutTime: doc.data().checkOutTime?.toDate()
      }));

      // Trigger update whenever attendance changes
      this.refreshSummary(today, allUsers, dailyAttendance, callback);
    }, (error) => {
      console.error('❌ Error in attendance real-time listener:', error);
    });

    return () => {
      console.log('🔌 Cleaning up attendance listeners');
      unsubscribeUsers();
      unsubscribeAttendance();
    };
  }

  private async refreshSummary(date: string, users: any[], attendance: any[] | undefined, callback: (summary: any) => void) {
    // If attendance isn't provided, fetch it once or wait for the listener
    let currentAttendance = attendance;
    if (!currentAttendance) {
      const allAttendance = await this.getAttendance();
      currentAttendance = allAttendance.filter(a => {
        const attendanceDate = a.date || (a.checkInTime ? (a.checkInTime.toISOString ? a.checkInTime.toISOString().split('T')[0] : new Date(a.checkInTime).toISOString().split('T')[0]) : '');
        return attendanceDate === date;
      });
    }

    const attendanceSummary = users
      .filter(user => this.isStudentUser(user))
      .map(user => {
        const studentUid = user.uid || user.id;
        const userAttendance = currentAttendance?.find(a => 
          a.studentId === studentUid || 
          a.userId === studentUid
        );
        
        let status: 'present' | 'late' | 'absent' | 'completed' = 'absent';
        let checkInTime = null;
        let checkOutTime = null;
        let isLate = false;
        
        if (userAttendance) {
          // If a record exists, they are not absent. Normalize legacy values.
          const rawStatus = (userAttendance.status || '').toString().toLowerCase();
          if (rawStatus === 'late') status = 'late';
          else if (rawStatus === 'completed') status = 'completed';
          else status = 'present';

          checkInTime = userAttendance.checkInTime;
          checkOutTime = userAttendance.checkOutTime;
          
          isLate = status === 'late';
        }

        return {
          userId: user.uid || user.id,
          userName: user.displayName || 'Unknown',
          userEmail: user.email,
          userType: user.userType,
          status,
          checkInTime,
          checkOutTime,
          isLate,
          attendanceId: userAttendance?.id || null
        };
      });

    callback({
      date,
      totalUsers: attendanceSummary.length,
      presentCount: attendanceSummary.filter(a => a.status === 'present' || a.status === 'completed').length,
      absentCount: attendanceSummary.filter(a => a.status === 'absent').length,
      lateCount: attendanceSummary.filter(a => a.status === 'late' || a.isLate).length,
      attendanceList: attendanceSummary,
      recentAttendance: currentAttendance?.slice(0, 10) || []
    });
  }
  async getStudentStats(userId: string): Promise<any> {
    const userAttendance = await this.getAttendance(userId);
    const events = await this.getEvents();

    // Calculate streak
    let currentStreak = 0;
    // Filter out duplicates for the same day and sort by date descending
    const uniqueDaysAttendance = Array.from(new Map(
      userAttendance
        .filter(a => a.date || a.checkInTime)
        .map(a => [a.date || (a.checkInTime.toISOString ? a.checkInTime.toISOString().split('T')[0] : new Date(a.checkInTime).toISOString().split('T')[0]), a])
    ).values()).sort((a, b) => 
      new Date(b.date || b.checkInTime).getTime() - new Date(a.date || a.checkInTime).getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Streak logic: A streak is alive if the user checked in today OR yesterday.
    // If the most recent check-in is before yesterday, the streak is 0.
    if (uniqueDaysAttendance.length === 0) {
      currentStreak = 0;
    } else {
      const mostRecentDateStr = uniqueDaysAttendance[0].date || new Date(uniqueDaysAttendance[0].checkInTime).toISOString().split('T')[0];
      const mostRecentDate = new Date(mostRecentDateStr);
      mostRecentDate.setHours(0, 0, 0, 0);
      
      const diffInDays = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays > 1) {
        // Streak broken (more than 1 day since last check-in)
        currentStreak = 0;
      } else {
        // Streak continues: walk back from the most recent check-in date
        currentStreak = 1;
        for (let i = 1; i < uniqueDaysAttendance.length; i++) {
          const currentDateStr = uniqueDaysAttendance[i-1].date || new Date(uniqueDaysAttendance[i-1].checkInTime).toISOString().split('T')[0];
          const prevDateStr = uniqueDaysAttendance[i].date || new Date(uniqueDaysAttendance[i].checkInTime).toISOString().split('T')[0];
          
          const current = new Date(currentDateStr);
          const previous = new Date(prevDateStr);
          current.setHours(0, 0, 0, 0);
          previous.setHours(0, 0, 0, 0);
          
          const gap = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
          
          if (gap === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Calculate attendance rate
    const totalPossibleDays = 30; // Last 30 days
    const attendanceRate = Math.min(100, (userAttendance.length / totalPossibleDays) * 100);

    // Calculate average check-in time
    const checkInTimes = userAttendance
      .filter(a => a.checkInTime)
      .map(a => new Date(a.checkInTime).getHours() * 60 + new Date(a.checkInTime).getMinutes());
    
    const averageCheckInMinutes = checkInTimes.length > 0 
      ? checkInTimes.reduce((sum, time) => sum + time, 0) / checkInTimes.length
      : 9 * 60; // Default 9:00 AM

    const averageHours = Math.floor(averageCheckInMinutes / 60);
    const averageMinutes = Math.floor(averageCheckInMinutes % 60);
    const averageCheckInTime = `${averageHours}:${averageMinutes.toString().padStart(2, '0')} ${averageHours >= 12 ? 'PM' : 'AM'}`;

    // Calculate monthly progress
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyAttendance = userAttendance.filter(a => {
      const attendanceDate = new Date(a.date || a.checkInTime);
      return attendanceDate.getMonth() === currentMonth && attendanceDate.getFullYear() === currentYear;
    });

    return {
      totalCheckIns: userAttendance.length,
      currentStreak,
      attendanceRate: Math.round(attendanceRate),
      averageCheckInTime,
      monthlyAttendance: monthlyAttendance.length,
      eventsAttended: events.filter(e => e.instructorId === userId).length, // Events they might have organized
      recentActivity: userAttendance.slice(0, 10).map(a => ({
        ...a,
        type: 'checkin',
        id: a.id || `activity-${Date.now()}-${Math.random()}`
      })),
      lateCheckIns: userAttendance.filter(a => {
        const checkInTime = new Date(a.checkInTime);
        return checkInTime.getHours() >= 9; // After 9 AM is considered late
      }).length
    };
  }

  // Get daily attendance summary for admin
  async getDailyAttendanceSummary(date?: string): Promise<any> {
    const timeService = TimeService.getInstance();
    const targetDate = date || timeService.getCurrentDateString();
    const allUsers = await this.getUsers();
    const allAttendance = await this.getAttendance();
    
    // Filter attendance for the target date
    const dailyAttendance = allAttendance.filter(a => {
      // Handle both string dates and Firestore Timestamps/Date objects
      const attendanceDate = a.date || (a.checkInTime ? (a.checkInTime.toISOString ? a.checkInTime.toISOString().split('T')[0] : new Date(a.checkInTime).toISOString().split('T')[0]) : '');
      return attendanceDate === targetDate;
    });

    // Create summary for each user
    const attendanceSummary = allUsers
      .filter(user => this.isStudentUser(user)) // Only students (missing userType treated as student)
      .map(user => {
        const userAttendance = dailyAttendance.find(a => a.userId === user.uid || a.studentId === user.uid || a.studentId === user.id || a.userId === user.id);
        
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

          isLate = status === 'late';
        }

        return {
          userId: user.uid || user.id,
          userName: user.displayName || 'Unknown',
          userEmail: user.email,
          userType: user.userType,
          status,
          checkInTime,
          checkOutTime,
          isLate,
          attendanceId: userAttendance?.id || null
        };
      });

    return {
      date: targetDate,
      totalUsers: attendanceSummary.length,
      presentCount: attendanceSummary.filter(a => a.status === 'present' || a.status === 'completed').length,
      absentCount: attendanceSummary.filter(a => a.status === 'absent').length,
      lateCount: attendanceSummary.filter(a => a.status === 'late' || a.isLate).length,
      attendanceList: attendanceSummary
    };
  }
}

export default DataService;
