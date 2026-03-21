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
import { SCHOOL_LOCATION, getLocationDisplayName } from '../config/locationConfig';
import DataService from './DataService';
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
    location?: LocationData
  ): Promise<AttendanceRecord> {
    console.log('AttendanceService.checkIn called with:', { studentId, studentName, qrCode, location });
    
    // 1. Basic Validation
    if (!studentId?.trim() || !studentName?.trim()) {
      throw new Error('Student identification is missing');
    }

    // 2. Time & Date Logic
    const harareTime = this.timeService.getCurrentTime();
    const today = this.timeService.getCurrentDateString();
    
    if (!this.timeService.canCheckIn(harareTime)) {
      throw new Error('Check-in is closed. The attendance deadline has passed (9:05 AM).');
    }

    // 3. Prevent Duplicates with Unique ID (YYYY-MM-DD_studentId)
    const attendanceDocId = `${today}_${studentId}`;
    const attendanceRef = doc(db, 'attendance', attendanceDocId);

    const existingDoc = await getDoc(attendanceRef);
    if (existingDoc.exists() && existingDoc.data().checkInTime) {
      throw new Error('You have already checked in for today.');
    }

    // 4. QR Validation (if enabled)
    if (qrCode) {
      const { qrCodeService } = await import('./qrCodeService');
      const isValid = await qrCodeService.validateCode(qrCode);
      if (!isValid) throw new Error('Invalid or expired check-in code');
    }

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
      method: 'qr',
      deviceId: 'web-app',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (location?.latitude && location?.longitude) {
      attendanceRecord.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || 'Unknown'
      };
    }

    await setDoc(attendanceRef, attendanceRecord);
    
    // 5. Sync with Daily Tracking
    const dailyService = DailyAttendanceService.getInstance();
    await dailyService.markPresentToday(studentId, studentName);

    return { ...attendanceRecord, checkInTime: harareTime } as AttendanceRecord;
  }

  async checkOut(studentId: string, location?: LocationData): Promise<AttendanceRecord> {
    const harareTime = this.timeService.getCurrentTime();
    const today = this.timeService.getCurrentDateString();
    const attendanceDocId = `${today}_${studentId}`;
    const attendanceRef = doc(db, 'attendance', attendanceDocId);

    const attendanceDoc = await getDoc(attendanceRef);
    if (!attendanceDoc.exists()) {
      throw new Error('No check-in record found for today. You must check in first.');
    }

    const attendanceData = attendanceDoc.data();
    if (attendanceData.checkOutTime) {
      throw new Error('You have already checked out for today.');
    }

    const updateData: any = {
      checkOutTime: Timestamp.fromDate(harareTime),
      status: 'completed',
      updatedAt: serverTimestamp()
    };

    if (location?.latitude && location?.longitude) {
      updateData.location = {
        ...attendanceData.location,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || attendanceData.location?.address
      };
    }

    await updateDoc(attendanceRef, updateData);

    return {
      ...attendanceData,
      checkInTime: attendanceData.checkInTime.toDate(),
      checkOutTime: harareTime,
      status: 'completed'
    } as AttendanceRecord;
  }

  async getTodayAttendance(studentId?: string): Promise<AttendanceRecord | null> {
    const today = this.timeService.getCurrentDateString();
    
    if (studentId) {
      const attendanceDocId = `${today}_${studentId}`;
      const attendanceDoc = await getDoc(doc(db, 'attendance', attendanceDocId));
      
      if (!attendanceDoc.exists()) {
        return null;
      }

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
    
    // User is checked in if they have a check-in time but no check-out time
    return !!(todayAttendance?.checkInTime && !todayAttendance?.checkOutTime);
  }

  // New method to get current attendance state
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
    
    const isCheckedIn = todayAttendance?.checkInTime && !todayAttendance?.checkOutTime;
    const hasCheckedOut = todayAttendance?.checkOutTime;
    const hasCheckedIn = !!todayAttendance?.checkInTime;
    
    // Determine status
    let status: 'not_checked_in' | 'checked_in' | 'checked_out' | 'absent' | 'late' = 'not_checked_in';
    if (hasCheckedOut) {
      status = 'checked_out';
    } else if (isCheckedIn) {
      status = todayAttendance?.status === 'late' ? 'late' : 'checked_in';
    } else if (isTooLate && !hasCheckedIn) {
      status = 'absent';
    }
    
    return {
      isCheckedIn: !!isCheckedIn,
      checkInTime: todayAttendance?.checkInTime || null,
      canCheckIn: !todayAttendance?.checkInTime && !isTooLate, // Can check in only if no check-in today AND not too late
      canCheckOut: !!isCheckedIn && !hasCheckedOut, // Can check out if checked in but not checked out
      status,
      isTooLateToCheckIn: isTooLate
    };
  }

  // Method to check if it's a new day and reset attendance state
  async checkForNewDay(studentId: string): Promise<boolean> {
    const todayAttendance = await this.getTodayAttendance(studentId);
    
    // If no attendance record for today, it's a new day or first time
    if (!todayAttendance) {
      return true;
    }
    
    // Check if the last attendance was from a previous day
    const today = this.timeService.getCurrentDateString();
    const attendanceDate = todayAttendance.date || new Date(todayAttendance.checkInTime).toISOString().split('T')[0];
    
    return attendanceDate !== today;
  }

  // Method to get attendance state with automatic new day detection
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
    
    // If it's a new day, reset the state to allow check-in
    if (isNewDay) {
      const now = this.timeService.getCurrentTime();
      const isTooLate = !this.timeService.canCheckIn(now);
      
      return {
        isCheckedIn: false,
        checkInTime: null,
        canCheckIn: !isTooLate, // Only allow if not too late
        canCheckOut: false,
        isNewDay: true,
        status: isTooLate ? 'absent' : 'not_checked_in',
        isTooLateToCheckIn: isTooLate
      };
    }
    
    return {
      ...currentState,
      isNewDay: false
    };
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

  async getAttendanceHistory(
    studentId: string,
    limit: number = 30
  ): Promise<AttendanceRecord[]> {
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
        checkInTime: data.checkInTime.toDate(),
        checkOutTime: data.checkOutTime?.toDate(),
      } as AttendanceRecord);
    });

    return records.slice(0, limit);
  }

  async getAttendanceByDateRange(
    startDate: string,
    endDate: string,
    studentId?: string
  ): Promise<AttendanceRecord[]> {
    // For single day queries (most common), use equality filter
    if (startDate === endDate) {
      let q;
      if (studentId) {
        q = query(
          collection(db, 'attendance'),
          where('studentId', '==', studentId),
          where('date', '==', startDate)
        );
      } else {
        q = query(
          collection(db, 'attendance'),
          where('date', '==', startDate)
        );
      }
      
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
    
    // For date range queries, use orderBy on a single field and filter in memory
    // This avoids Firestore composite index requirements
    const q = query(
      collection(db, 'attendance'),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];
    
    // Filter by date range and studentId in memory
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
      // Only include students who checked in but haven't checked out
      if (data.checkInTime && !data.checkOutTime) {
        records.push({
          ...data,
          checkInTime: data.checkInTime.toDate(),
        } as AttendanceRecord);
      }
    });

    return records;
  }

  // Clear all attendance records for today (admin function)
  async clearTodayAttendance(): Promise<number> {
    const today = this.timeService.getCurrentDateString();
    
    const q = query(
      collection(db, 'attendance'),
      where('date', '==', today)
    );
    
    const querySnapshot = await getDocs(q);
    let deletedCount = 0;
    
    const deletePromises = querySnapshot.docs.map(doc => {
      deletedCount++;
      return deleteDoc(doc.ref);
    });
    
    await Promise.all(deletePromises);
    console.log('🗑️ Cleared', deletedCount, 'attendance records for', today);
    return deletedCount;
  }

  // Master Reset: Clear all attendance records and daily status for a fresh start (Admin only)
  async masterResetAttendance(): Promise<{ deletedCount: number }> {
    console.log('🚨 MASTER RESET INITIATED: Clearing all attendance data...');
    
    try {
      // 1. Get all records from the 'attendance' collection
      const attendanceRef = collection(db, 'attendance');
      const attendanceSnapshot = await getDocs(attendanceRef);
      
      // 2. Get all records from the 'daily_attendance' collection
      const dailyAttendanceRef = collection(db, 'daily_attendance');
      const dailySnapshot = await getDocs(dailyAttendanceRef);
      
      let deletedCount = 0;
      
      // 3. Delete all attendance records
      const attendanceDeletePromises = attendanceSnapshot.docs.map(doc => {
        deletedCount++;
        return deleteDoc(doc.ref);
      });
      
      // 4. Delete all daily attendance records
      const dailyDeletePromises = dailySnapshot.docs.map(doc => {
        return deleteDoc(doc.ref);
      });
      
      await Promise.all([...attendanceDeletePromises, ...dailyDeletePromises]);
      
      console.log(`✅ MASTER RESET COMPLETE: ${deletedCount} records deleted.`);
      return { deletedCount };
    } catch (error) {
      console.error('❌ Master reset failed:', error);
      throw error;
    }
  }

  private async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string> {
    console.log('🗺️ Resolving address for coordinates:', { latitude, longitude });
    return getLocationDisplayName(SCHOOL_LOCATION);
  }

  private isInSouthAfrica(latitude: number, longitude: number): boolean {
    const southAfricaBounds = {
      north: -22.0,
      south: -35.0,
      east: 33.0,
      west: 16.0
    };
    
    return latitude >= southAfricaBounds.south && 
           latitude <= southAfricaBounds.north &&
           longitude >= southAfricaBounds.west && 
           longitude <= southAfricaBounds.east;
  }

  /**
   * Fix existing attendance records with incorrect location addresses
   */
  async fixExistingLocationRecords(): Promise<{ updated: number; errors: number }> {
    console.log('🔧 Starting to fix existing attendance records with location issues...');
    
    let updated = 0;
    let errors = 0;
    
    try {
      // Get all attendance records
      const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      console.log(`📊 Found ${querySnapshot.size} attendance records to check`);
      
      for (const docSnapshot of querySnapshot.docs) {
        try {
          const data = docSnapshot.data();
          const currentAddress = data.location?.address;
          
          if (!currentAddress) {
            continue; // Skip records without location data
          }
          
          // Apply the same cleaning logic we use for new records
          let cleanedAddress = currentAddress;
          let needsUpdate = false;
          
          // Fix typos
          const originalAddress = cleanedAddress;
          cleanedAddress = cleanedAddress.replace(/\bat uknown\b/gi, 'at unknown');
          cleanedAddress = cleanedAddress.replace(/\buknown\b/gi, 'unknown');
          cleanedAddress = cleanedAddress.replace(/\bfalss\b/gi, 'Falls');
          cleanedAddress = cleanedAddress.replace(/\bvictoria falss\b/gi, 'Victoria Falls');
          
          if (cleanedAddress !== originalAddress) {
            needsUpdate = true;
          }
          
          // Replace generic addresses with Vincent Bohlen Hub
          if (cleanedAddress.toLowerCase().includes('unknown') || 
              cleanedAddress.toLowerCase().includes('unnamed') ||
              cleanedAddress === 'Unknown Location') {
            cleanedAddress = 'Vincent Bohlen Hub, South Africa';
            needsUpdate = true;
          }
          
          // Update the record if needed
          if (needsUpdate) {
            await updateDoc(doc(db, 'attendance', docSnapshot.id), {
              'location.address': cleanedAddress
            });
            
            console.log(`✅ Updated record ${docSnapshot.id}: "${originalAddress}" → "${cleanedAddress}"`);
            updated++;
          }
          
        } catch (error) {
          console.error(`❌ Error updating record ${docSnapshot.id}:`, error);
          errors++;
        }
      }
      
      console.log(`🎉 Location fix complete: ${updated} updated, ${errors} errors`);
      return { updated, errors };
      
    } catch (error) {
      console.error('❌ Error fixing existing location records:', error);
      throw error;
    }
  }
}
