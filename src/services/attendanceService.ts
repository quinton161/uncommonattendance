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
import { DailyAttendanceService } from './dailyAttendanceService';
import { findKnownLocation, getLocationDisplayName } from '../config/locationConfig';

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
    location?: LocationData
  ): Promise<AttendanceRecord> {
    console.log('AttendanceService.checkIn called with:', { studentId, studentName });
    
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


    const attendanceRecord: AttendanceRecord = {
      id: attendanceId,
      studentId,
      studentName,
      checkInTime: new Date(),
      date: today,
      isPresent: true,
    };

    console.log('📝 Saving detailed attendance record to Firebase:', {
      collection: 'attendance',
      documentId: attendanceId,
      studentId,
      studentName,
      date: today
    });
    
    // Save detailed attendance record
    await setDoc(doc(db, 'attendance', attendanceId), {
      ...attendanceRecord,
      checkInTime: Timestamp.fromDate(attendanceRecord.checkInTime),
    });
    console.log('✅ Detailed attendance record saved to Firebase');

    // Mark student as present for today in daily attendance tracking
    console.log('📊 Marking student as present in daily attendance tracking...');
    const dailyService = DailyAttendanceService.getInstance();
    await dailyService.markPresentToday(studentId, studentName);
    console.log('✅ Daily attendance record saved');

    // Verify both records were saved
    const savedDetailedRecord = await getDoc(doc(db, 'attendance', attendanceId));
    const isPresentToday = await dailyService.isPresentToday(studentId);
    
    if (savedDetailedRecord.exists() && isPresentToday) {
      console.log('🎉 ATTENDANCE RECORDING COMPLETE:', {
        detailedRecord: '✅ Saved',
        dailyRecord: '✅ Saved',
        studentMarkedPresent: '✅ Yes',
        attendanceId,
        date: today
      });
    } else {
      console.error('❌ ATTENDANCE RECORDING VERIFICATION FAILED:', {
        detailedRecord: savedDetailedRecord.exists() ? '✅' : '❌',
        dailyRecord: isPresentToday ? '✅' : '❌'
      });
      throw new Error('Failed to verify attendance records were saved properly');
    }

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
    console.log('🗺️ Resolving address for coordinates:', { latitude, longitude });

    // Check if coordinates match any known location (Vincent Bohlen Hub, etc.)
    const knownLocation = findKnownLocation(latitude, longitude);
    if (knownLocation) {
      const locationName = getLocationDisplayName(knownLocation);
      console.log('📍 Location identified as known location:', locationName);
      return locationName;
    }

    try {
      // Using reverse geocoding API
      console.log('🌐 Fetching address from geocoding service...');
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('📍 Geocoding response:', data);
        
        // Extract meaningful address components
        let address = '';
        if (data.locality || data.city) {
          address = data.locality || data.city;
          if (data.principalSubdivision) {
            address += `, ${data.principalSubdivision}`;
          }
        } else if (data.display_name) {
          address = data.display_name;
        }
        
        // Clean up common API response issues
        if (address) {
          // Fix common typos in geocoding responses
          address = address.replace(/\bat uknown\b/gi, 'at unknown');
          address = address.replace(/\buknown\b/gi, 'unknown');
          address = address.replace(/\bfalss\b/gi, 'Falls');
          address = address.replace(/\bvictoria falss\b/gi, 'Victoria Falls');
          
          // If the address contains "unknown" or is too generic, prefer our known location
          if (address.toLowerCase().includes('unknown') || address.toLowerCase().includes('unnamed')) {
            console.log('📍 Geocoding returned generic address, using Vincent Bohlen Hub fallback');
            return 'Vincent Bohlen Hub, South Africa';
          }
        }
        
        // If we got a meaningful address, return it, otherwise use fallback
        if (address && address.length > 10) {
          console.log('✅ Address resolved:', address);
          return address;
        }
      }
    } catch (error) {
      console.error('❌ Failed to get address from geocoding service:', error);
    }
    
    // Fallback: Check if coordinates suggest it's in South Africa (Vincent Bohlen Hub area)
    if (this.isInSouthAfrica(latitude, longitude)) {
      console.log('📍 Coordinates suggest South Africa location, using Vincent Bohlen Hub');
      return 'Vincent Bohlen Hub, South Africa';
    }
    
    // Final fallback
    console.log('📍 Using coordinate fallback');
    return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }


  /**
   * Check if coordinates are in South Africa (rough bounds)
   */
  private isInSouthAfrica(latitude: number, longitude: number): boolean {
    // South Africa approximate bounds
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
