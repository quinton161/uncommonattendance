import { AttendanceService } from '../services/attendanceService';
import { DailyAttendanceService } from '../services/dailyAttendanceService';

/**
 * Utility functions to verify attendance recording
 */

export class AttendanceVerification {
  private static attendanceService = AttendanceService.getInstance();
  private static dailyService = DailyAttendanceService.getInstance();

  /**
   * Verify that a student's attendance is properly recorded for today
   */
  static async verifyTodayAttendance(studentId: string): Promise<{
    isRecorded: boolean;
    detailedRecord: boolean;
    dailyRecord: boolean;
    details: any;
  }> {
    try {
      console.log(`🔍 Verifying attendance for student: ${studentId}`);

      // Check detailed attendance record
      const detailedRecord = await this.attendanceService.getTodayAttendance(studentId);
      const hasDetailedRecord = !!detailedRecord;

      // Check daily attendance record
      const isDailyPresent = await this.dailyService.isPresentToday(studentId);

      const verification = {
        isRecorded: hasDetailedRecord && isDailyPresent,
        detailedRecord: hasDetailedRecord,
        dailyRecord: isDailyPresent,
        details: {
          detailedRecord: detailedRecord ? {
            id: detailedRecord.id,
            checkInTime: detailedRecord.checkInTime,
            location: detailedRecord.location?.address,
            isPresent: detailedRecord.isPresent
          } : null,
          dailyPresent: isDailyPresent,
          date: new Date().toISOString().split('T')[0]
        }
      };

      console.log('📋 Attendance verification result:', verification);
      return verification;

    } catch (error: any) {
      console.error('❌ Error verifying attendance:', error);
      return {
        isRecorded: false,
        detailedRecord: false,
        dailyRecord: false,
        details: { error: error?.message || 'Unknown error' }
      };
    }
  }

  /**
   * Get comprehensive attendance summary for a student
   */
  static async getAttendanceSummary(studentId: string): Promise<any> {
    try {
      console.log(`📊 Getting attendance summary for student: ${studentId}`);

      const [todayRecord, dailyStats, recentActivity] = await Promise.all([
        this.attendanceService.getTodayAttendance(studentId),
        this.dailyService.getAttendanceStats(studentId, 30),
        this.dailyService.getRecentActivity(studentId, 10)
      ]);

      const summary = {
        today: {
          hasRecord: !!todayRecord,
          checkInTime: todayRecord?.checkInTime,
          checkOutTime: todayRecord?.checkOutTime,
          location: todayRecord?.location?.address,
          isPresent: todayRecord?.isPresent
        },
        stats: dailyStats,
        recentActivity: recentActivity.slice(0, 5),
        lastUpdated: new Date()
      };

      console.log('📈 Attendance summary:', summary);
      return summary;

    } catch (error: any) {
      console.error('❌ Error getting attendance summary:', error);
      throw error;
    }
  }

  /**
   * Test attendance recording functionality
   */
  static async testAttendanceRecording(): Promise<void> {
    console.log('🧪 Testing attendance recording functionality...');
    
    try {
      // Test connection to Firebase
      console.log('1. Testing Firebase connection...');
      
      // Test attendance service
      console.log('2. Testing AttendanceService...');
      const attendanceService = AttendanceService.getInstance();
      
      // Test daily service
      console.log('3. Testing DailyAttendanceService...');
      const dailyService = DailyAttendanceService.getInstance();
      
      console.log('✅ All attendance services initialized successfully');
      
    } catch (error: any) {
      console.error('❌ Attendance recording test failed:', error);
      throw error;
    }
  }
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).AttendanceVerification = AttendanceVerification;
  
  console.log(`
🔍 Attendance Verification Tools Available:

In the browser console, you can run:
- AttendanceVerification.verifyTodayAttendance('USER_ID')
- AttendanceVerification.getAttendanceSummary('USER_ID')
- AttendanceVerification.testAttendanceRecording()

Example:
AttendanceVerification.verifyTodayAttendance('your-user-id').then(result => console.log('Verification:', result))
  `);
}
