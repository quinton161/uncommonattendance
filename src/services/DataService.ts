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
  deleteDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { uniqueToast } from '../utils/toastUtils';

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
    id: 'user-1',
    displayName: 'John Doe',
    email: 'john@example.com',
    userType: 'attendee',
    createdAt: new Date(),
    photoUrl: '',
    bio: 'Student'
  },
  {
    id: 'user-2',
    displayName: 'Jane Smith',
    email: 'jane@example.com',
    userType: 'attendee',
    createdAt: new Date(),
    photoUrl: '',
    bio: 'Student'
  }
];

class DataService {
  private static instance: DataService;
  private useFirebase: boolean = true;

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
      // Delete user document
      await deleteDoc(doc(db, 'users', userId));
      
      // Note: In a real app, you might want to also delete related attendance records
      // or mark them as deleted rather than actually deleting the user document
      
      uniqueToast.success('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      uniqueToast.error('Failed to delete user');
      throw error;
    }
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    const events = await this.getEvents();
    const attendance = await this.getAttendance();
    const users = await this.getUsers();

    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);

    return {
      totalEvents: events.length,
      activeEvents: events.filter(e => e.eventStatus === 'published').length,
      totalAttendees: users.filter(u => u.userType === 'attendee').length,
      todayAttendance: todayAttendance.length,
      recentAttendance: attendance.slice(0, 5)
    };
  }

  // Student specific stats
  async getStudentStats(userId: string): Promise<any> {
    const userAttendance = await this.getAttendance(userId);
    const events = await this.getEvents();

    // Calculate streak
    let currentStreak = 0;
    const sortedAttendance = userAttendance.sort((a, b) => 
      new Date(b.date || b.checkInTime).getTime() - new Date(a.date || a.checkInTime).getTime()
    );

    const today = new Date();
    for (let i = 0; i < sortedAttendance.length; i++) {
      const attendanceDate = new Date(sortedAttendance[i].date || sortedAttendance[i].checkInTime);
      const daysDiff = Math.floor((today.getTime() - attendanceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        currentStreak++;
      } else {
        break;
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
      eventsAttended: events.filter(e => e.organizerId === userId).length, // Events they might have attended
      recentActivity: userAttendance.slice(0, 5).map(a => ({
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
    const targetDate = date || new Date().toISOString().split('T')[0];
    const allUsers = await this.getUsers();
    const allAttendance = await this.getAttendance();
    
    // Filter attendance for the target date
    const dailyAttendance = allAttendance.filter(a => {
      const attendanceDate = new Date(a.date || a.checkInTime).toISOString().split('T')[0];
      return attendanceDate === targetDate;
    });

    // Create summary for each user
    const attendanceSummary = allUsers
      .filter(user => user.userType !== 'admin') // Exclude admin users
      .map(user => {
        const userAttendance = dailyAttendance.find(a => a.userId === user.uid || a.studentId === user.uid);
        
        let status = 'absent';
        let checkInTime = null;
        let checkOutTime = null;
        let isLate = false;
        
        if (userAttendance) {
          status = userAttendance.status || 'present';
          checkInTime = userAttendance.checkInTime;
          checkOutTime = userAttendance.checkOutTime;
          
          if (checkInTime) {
            const checkIn = new Date(checkInTime);
            isLate = checkIn.getHours() >= 9; // After 9 AM is late
          }
        }

        return {
          userId: user.uid,
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
      lateCount: attendanceSummary.filter(a => a.isLate).length,
      attendanceList: attendanceSummary
    };
  }
}

export default DataService;
