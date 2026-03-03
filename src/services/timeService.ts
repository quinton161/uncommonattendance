export class TimeService {
  private static instance: TimeService;

  public static getInstance(): TimeService {
    if (!TimeService.instance) {
      TimeService.instance = new TimeService();
    }
    return TimeService.instance;
  }

  // Get current time in Harare/Pretoria timezone (CAT - Central Africa Time)
  getCurrentTime(): Date {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Harare" }));
  }

  // Format time for display
  formatTime(date: Date): string {
    return date.toLocaleString("en-US", { 
      timeZone: "Africa/Harare",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  // Format date for display
  formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", { 
      timeZone: "Africa/Harare",
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Get current date string in Harare timezone
  getCurrentDateString(): string {
    const now = this.getCurrentTime();
    return now.toISOString().split('T')[0];
  }

  // Check if it's after 9 AM Harare time
  isLate(checkInTime: Date): boolean {
    const harareTime = new Date(checkInTime.toLocaleString("en-US", { timeZone: "Africa/Harare" }));
    const hours = harareTime.getHours();
    const minutes = harareTime.getMinutes();
    
    // Consider late if after 9:00 AM
    return hours > 9 || (hours === 9 && minutes > 0);
  }

  // Get time zone info
  getTimeZoneInfo(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Africa/Harare",
      timeZoneName: 'short'
    };
    
    return now.toLocaleString("en-US", options);
  }
}

export default TimeService;
