export class InternetTimeService {
  private static instance: InternetTimeService;
  private cachedTime: Date | null = null;
  private lastSyncTime: number = 0;
  private syncInterval: number = 5 * 60 * 1000; // 5 minutes
  private timeOffset: number = 0; // Offset in milliseconds
  private isOnline: boolean = true;

  public static getInstance(): InternetTimeService {
    if (!InternetTimeService.instance) {
      InternetTimeService.instance = new InternetTimeService();
    }
    return InternetTimeService.instance;
  }

  constructor() {
    this.initializeTimeSync();
    // Set up periodic sync
    setInterval(() => {
      this.syncWithInternetTime();
    }, this.syncInterval);
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncWithInternetTime();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async initializeTimeSync(): Promise<void> {
    await this.syncWithInternetTime();
  }

  /**
   * Synchronize time with internet time servers
   */
  private async syncWithInternetTime(): Promise<void> {
    if (!this.isOnline) {
      console.log('🕐 Offline, using cached time with last known offset');
      return;
    }

    try {
      console.log('🕐 Syncing time with internet servers...');
      const startTime = Date.now();
      
      // Try multiple time sources for redundancy
      const timeSources = [
        { name: 'TimeAPI', func: this.getTimeAPI },
        { name: 'Google', func: this.getGoogleTime },
        { name: 'Simple', func: this.getSimpleTime },
        { name: 'WorldTimeAPI', func: this.getWorldTimeAPI }
      ];

      let internetTime: Date | null = null;
      let successfulSource = '';
      
      for (const timeSource of timeSources) {
        try {
          internetTime = await timeSource.func();
          if (internetTime) {
            successfulSource = timeSource.name;
            break;
          }
        } catch (error) {
          console.warn(`⚠️ Time source ${timeSource.name} failed:`, error);
          continue;
        }
      }

      if (internetTime) {
        const endTime = Date.now();
        const roundTripTime = endTime - startTime;
        
        // Adjust for network latency (half of round-trip time)
        const adjustedTime = new Date(internetTime.getTime() + (roundTripTime / 2));
        
        // Calculate offset between system time and internet time
        this.timeOffset = adjustedTime.getTime() - Date.now();
        this.cachedTime = adjustedTime;
        this.lastSyncTime = Date.now();
        
        console.log('✅ Time synchronized successfully:', {
          source: successfulSource,
          internetTime: adjustedTime.toISOString(),
          systemTime: new Date().toISOString(),
          offset: this.timeOffset + 'ms',
          roundTripTime: roundTripTime + 'ms'
        });
      } else {
        console.warn('⚠️ All time sources failed, using system time with fallback');
        // If all internet sources fail, use system time but mark as not synced
        this.lastSyncTime = 0; // Reset to indicate no successful sync
      }
    } catch (error) {
      console.error('❌ Failed to sync time with internet:', error);
      // Don't update lastSyncTime on error to keep using previous offset if available
    }
  }

  /**
   * Get time from WorldTimeAPI
   */
  private async getWorldTimeAPI(): Promise<Date | null> {
    try {
      const response = await fetch('https://worldtimeapi.org/api/timezone/Africa/Harare', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return new Date(data.datetime);
      }
      return null;
    } catch (error) {
      console.warn('WorldTimeAPI failed:', error);
      return null;
    }
  }

  /**
   * Get time from TimeAPI
   */
  private async getTimeAPI(): Promise<Date | null> {
    try {
      const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Africa/Harare', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return new Date(data.dateTime);
      }
      return null;
    } catch (error) {
      console.warn('TimeAPI failed:', error);
      return null;
    }
  }

  /**
   * Get time from Google's header (fallback method)
   */
  private async getGoogleTime(): Promise<Date | null> {
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          return new Date(dateHeader);
        }
      }
      return null;
    } catch (error) {
      console.warn('Google time failed:', error);
      return null;
    }
  }

  /**
   * Get time from a simple HTTP request (most reliable fallback)
   */
  private async getSimpleTime(): Promise<Date | null> {
    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        // httpbin returns current time in various formats
        if (data.headers && data.headers.Date) {
          return new Date(data.headers.Date);
        }
      }
      return null;
    } catch (error) {
      console.warn('Simple time fallback failed:', error);
      return null;
    }
  }

  /**
   * Get current time (internet-synced if available, otherwise system time)
   */
  getCurrentTime(): Date {
    const now = Date.now();
    
    // If we have a recent sync, use the offset
    if (this.lastSyncTime && (now - this.lastSyncTime) < this.syncInterval) {
      return new Date(now + this.timeOffset);
    }
    
    // If sync is old or failed, try to sync again but don't wait
    if (this.isOnline && (!this.lastSyncTime || (now - this.lastSyncTime) > this.syncInterval)) {
      // Trigger async sync without blocking
      this.syncWithInternetTime().catch(() => {
        // Silently handle sync errors
      });
    }
    
    // Return system time adjusted by last known offset (if any)
    const adjustedTime = new Date(now + this.timeOffset);
    
    // If we never synced successfully, just return system time
    if (this.lastSyncTime === 0) {
      console.warn('⚠️ Using system time - no internet sync available');
      return new Date();
    }
    
    return adjustedTime;
  }

  /**
   * Get current time in Harare/Pretoria timezone (CAT - Central Africa Time)
   */
  getCurrentTimeHarare(): Date {
    // Important: Avoid parsing locale-formatted strings back into Date (can yield Invalid Date
    // depending on environment/locale). We return an absolute Date (internet-synced if available).
    // Any "Harare-local" components should be derived via Intl with the Africa/Harare timeZone.
    return this.getCurrentTime();
  }

  /**
   * Format time for display in Harare timezone
   */
  formatTime(date: Date): string {
    return date.toLocaleString("en-US", { 
      timeZone: "Africa/Harare",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * Format date for display in Harare timezone
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", { 
      timeZone: "Africa/Harare",
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get current date string in Harare timezone
   */
  getCurrentDateString(): string {
    const now = this.getCurrentTime();
    // Use a stable, timezone-aware formatter to avoid Invalid Date / timezone parsing issues.
    // en-CA yields ISO-like YYYY-MM-DD.
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Harare',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);

    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;

    if (!y || !m || !d) {
      // Ultimate fallback: system date in ISO format
      return new Date().toISOString().split('T')[0];
    }

    return `${y}-${m}-${d}`;
  }

  private readonly CHECK_IN_START_HOUR = 7;
  private readonly CHECK_IN_END_HOUR = 9;
  private readonly LATE_HOUR = 9;
  private readonly GRACE_PERIOD_MINUTES = 5;
  
  // Admin can override time check for marking students present
  public allowAdminOverride = false;
  
  /**
   * Check if it's 9:00 AM or later Harare time (late check-in)
   */
  isLate(checkInTime: Date): boolean {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Harare',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(checkInTime);

    const hourStr = parts.find(p => p.type === 'hour')?.value;
    const minuteStr = parts.find(p => p.type === 'minute')?.value;
    const hours = hourStr ? Number(hourStr) : NaN;
    const minutes = minuteStr ? Number(minuteStr) : NaN;

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return false;
    }
    
    // Late if exactly 9:00 AM or after
    return hours >= this.LATE_HOUR;
  }
  
  /**
   * Check if check-in is allowed (between 7:00 AM and 9:05 AM)
   * Returns true if student can check in, false otherwise
   */
  canCheckIn(checkInTime: Date): boolean {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Harare',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(checkInTime);

    const hourStr = parts.find(p => p.type === 'hour')?.value;
    const minuteStr = parts.find(p => p.type === 'minute')?.value;
    const hours = hourStr ? Number(hourStr) : NaN;
    const minutes = minuteStr ? Number(minuteStr) : NaN;

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return false;
    }
    
    const checkInMinutes = hours * 60 + minutes;
    const startMinutes = this.CHECK_IN_START_HOUR * 60;
    const endMinutes = this.CHECK_IN_END_HOUR * 60 + this.GRACE_PERIOD_MINUTES;

    return checkInMinutes >= startMinutes && checkInMinutes <= endMinutes;
  }
  
  /**
   * Check if student should be marked as absent (after 9:05 AM and no check-in)
   */
  shouldMarkAbsent(): boolean {
    const now = this.getCurrentTime();
    return !this.canCheckIn(now);
  }

  /**
   * Get time synchronization status
   */
  getSyncStatus(): {
    isOnline: boolean;
    lastSyncTime: number | null;
    timeOffset: number;
    usingInternetTime: boolean;
  } {
    const now = Date.now();
    const usingInternetTime = Boolean(this.lastSyncTime && (now - this.lastSyncTime) < this.syncInterval);
    
    return {
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      timeOffset: this.timeOffset,
      usingInternetTime: usingInternetTime
    };
  }

  /**
   * Force manual time sync
   */
  async forceSync(): Promise<boolean> {
    await this.syncWithInternetTime();
    return this.lastSyncTime > 0;
  }

  /**
   * Get time zone info
   */
  getTimeZoneInfo(): string {
    const now = this.getCurrentTime();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Africa/Harare",
      timeZoneName: 'short'
    };
    
    return now.toLocaleString("en-US", options);
  }
}

export default InternetTimeService;
