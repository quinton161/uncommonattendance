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
} from 'firebase/firestore';
import { db } from './firebase';
import { AttendanceRecord, LocationData } from '../types';

export class AttendanceService {
  private static instance: AttendanceService;

  public static getInstance(): AttendanceService {
    if (!AttendanceService.instance) {
      AttendanceService.instance = new AttendanceService();
    }
    return AttendanceService.instance;
  }

  async checkIn(
    studentId: string,
    studentName: string,
    location: LocationData
  ): Promise<AttendanceRecord> {
    console.log('AttendanceService.checkIn called with:', { studentId, studentName, location });
    
    const today = new Date().toISOString().split('T')[0];
    const attendanceId = `${studentId}_${today}`;
    console.log('Generated attendanceId:', attendanceId);

    // Check if already checked in today
    console.log('Checking for existing record...');
    const existingRecord = await this.getTodayAttendance(studentId);
    console.log('Existing record:', existingRecord);
    
    if (existingRecord && existingRecord.checkInTime) {
      console.log('Already checked in today, throwing error');
      throw new Error('Already checked in today');
    }

    console.log('Getting address from coordinates...');
    const address = await this.getAddressFromCoordinates(
      location.latitude,
      location.longitude
    );
    console.log('Address obtained:', address);

    const attendanceRecord: AttendanceRecord = {
      id: attendanceId,
      studentId,
      studentName,
      checkInTime: new Date(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: address,
      },
      date: today,
      isPresent: true,
    };

    console.log('Saving attendance record to Firebase:', attendanceRecord);
    
    await setDoc(doc(db, 'attendance', attendanceId), {
      ...attendanceRecord,
      checkInTime: Timestamp.fromDate(attendanceRecord.checkInTime),
    });

    console.log('Attendance record saved successfully');
    return attendanceRecord;
  }

  async checkOut(studentId: string): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const attendanceId = `${studentId}_${today}`;

    const attendanceDoc = await getDoc(doc(db, 'attendance', attendanceId));
    
    if (!attendanceDoc.exists()) {
      throw new Error('No check-in record found for today');
    }

    const attendanceData = attendanceDoc.data();
    
    if (attendanceData.checkOutTime) {
      throw new Error('Already checked out today');
    }

    const checkOutTime = new Date();
    
    await updateDoc(doc(db, 'attendance', attendanceId), {
      checkOutTime: Timestamp.fromDate(checkOutTime),
    });

    return {
      ...attendanceData,
      checkInTime: attendanceData.checkInTime.toDate(),
      checkOutTime,
    } as AttendanceRecord;
  }

  async getTodayAttendance(studentId?: string): Promise<AttendanceRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    
    if (studentId) {
      const attendanceId = `${studentId}_${today}`;
      const attendanceDoc = await getDoc(doc(db, 'attendance', attendanceId));
      
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

  // New method to check if user is currently checked in
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
  }> {
    const todayAttendance = await this.getTodayAttendance(studentId);
    
    const isCheckedIn = todayAttendance?.checkInTime && !todayAttendance?.checkOutTime;
    const hasCheckedOut = todayAttendance?.checkOutTime;
    
    return {
      isCheckedIn: !!isCheckedIn,
      checkInTime: todayAttendance?.checkInTime || null,
      canCheckIn: !todayAttendance?.checkInTime, // Can check in if no check-in today
      canCheckOut: !!isCheckedIn && !hasCheckedOut // Can check out if checked in but not checked out
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
    const today = new Date().toISOString().split('T')[0];
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
  }> {
    const isNewDay = await this.checkForNewDay(studentId);
    const currentState = await this.getCurrentAttendanceState(studentId);
    
    // If it's a new day, reset the state to allow check-in
    if (isNewDay) {
      return {
        isCheckedIn: false,
        checkInTime: null,
        canCheckIn: true,
        canCheckOut: false,
        isNewDay: true
      };
    }
    
    return {
      ...currentState,
      isNewDay: false
    };
  }

  async getAllTodayAttendance(): Promise<AttendanceRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    
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
    let q = query(
      collection(db, 'attendance'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );

    if (studentId) {
      q = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
    }

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

  async getCurrentlyPresentStudents(): Promise<AttendanceRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    
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

  private async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string> {
    try {
      // Using a simple reverse geocoding approach
      // In a production app, you might want to use Google Maps API or similar
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
    } catch (error) {
      console.error('Failed to get address:', error);
    }
    
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}
