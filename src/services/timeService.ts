import { InternetTimeService } from './internetTimeService';

export class TimeService {
  private static instance: TimeService;
  private internetTimeService: InternetTimeService;

  public static getInstance(): TimeService {
    if (!TimeService.instance) {
      TimeService.instance = new TimeService();
    }
    return TimeService.instance;
  }

  constructor() {
    this.internetTimeService = InternetTimeService.getInstance();
  }

  // Get current time in Harare/Pretoria timezone (CAT - Central Africa Time)
  getCurrentTime(): Date {
    return this.internetTimeService.getCurrentTimeHarare();
  }

  // Format time for display
  formatTime(date: Date): string {
    return this.internetTimeService.formatTime(date);
  }

  // Format date for display
  formatDate(date: Date): string {
    return this.internetTimeService.formatDate(date);
  }

  // Get current date string in Harare timezone
  getCurrentDateString(): string {
    return this.internetTimeService.getCurrentDateString();
  }

  // Check if it's after 9:05 AM Harare time (late check-in)
  isLate(checkInTime: Date): boolean {
    return this.internetTimeService.isLate(checkInTime);
  }
  
  // Check if check-in is still allowed (before 9:05 AM)
  canCheckIn(checkInTime: Date): boolean {
    return this.internetTimeService.canCheckIn(checkInTime);
  }
  
  // Check if student should be marked as absent (after 9:05 AM)
  shouldMarkAbsent(): boolean {
    return this.internetTimeService.shouldMarkAbsent();
  }

  // Get time zone info
  getTimeZoneInfo(): string {
    return this.internetTimeService.getTimeZoneInfo();
  }

  // Get synchronization status
  getSyncStatus() {
    return this.internetTimeService.getSyncStatus();
  }

  // Force manual sync
  async forceSync(): Promise<boolean> {
    return await this.internetTimeService.forceSync();
  }
}

export default TimeService;
