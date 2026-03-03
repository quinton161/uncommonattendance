import { AttendanceRecord } from '../types';
import { TimeService } from './timeService';

export interface EmailService {
  sendCheckInNotification(studentEmail: string, studentName: string, checkInTime: Date): Promise<void>;
}

export class BrowserEmailService implements EmailService {
  private timeService: TimeService;

  constructor() {
    this.timeService = TimeService.getInstance();
  }

  async sendCheckInNotification(studentEmail: string, studentName: string, checkInTime: Date): Promise<void> {
    try {
      // For browser-based email, we'll use mailto link
      const subject = encodeURIComponent('Attendance Check-in Confirmation');
      const body = encodeURIComponent(`
        Hello ${studentName},

        You have successfully checked in today.

        Check-in Details:
        Date: ${this.timeService.formatDate(checkInTime)}
        Time: ${this.timeService.formatTime(checkInTime)}
        Status: Present

        This is an automated confirmation of your attendance. Keep up the great work!

        © 2024 Uncommon Attendance System
      `);

      // Open email client
      window.location.href = `mailto:${studentEmail}?subject=${subject}&body=${body}`;
      
      console.log('📧 Email client opened for:', studentEmail);
    } catch (error) {
      console.error('❌ Failed to open email client:', error);
      throw error;
    }
  }
}

export default BrowserEmailService;
