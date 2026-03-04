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
        this.getWorldTimeAPI,
        this.getTimeAPI,
        this.getGoogleTime
      ];

      let internetTime: Date | null = null;
      
      for (const timeSource of timeSources) {
        try {
          internetTime = await timeSource();
          if (internetTime) {
            break;
          }
        } catch (error) {
          console.warn('⚠️ Time source failed:', error);
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
          internetTime: adjustedTime.toISOString(),
          systemTime: new Date().toISOString(),
          offset: this.timeOffset + 'ms',
          roundTripTime: roundTripTime + 'ms'
        });
      } else {
        console.warn('⚠️ All time sources failed, using system time');
      }
    } catch (error) {
      console.error('❌ Failed to sync time with internet:', error);
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
   * Get current time (internet-synced if available, otherwise system time)
   */
  getCurrentTime(): Date {
    const now = Date.now();
    
    // If we have a recent sync, use the offset
    if (this.lastSyncTime && (now - this.lastSyncTime) < this.syncInterval) {
      return new Date(now + this.timeOffset);
    }
    
    // If sync is old, try to sync again
    if (this.isOnline && (!this.lastSyncTime || (now - this.lastSyncTime) > this.syncInterval)) {
      // Don't wait for sync, just trigger it
      this.syncWithInternetTime();
    }
    
    // Return system time adjusted by last known offset
    return new Date(now + this.timeOffset);
  }

  /**
   * Get current time in Harare/Pretoria timezone (CAT - Central Africa Time)
   */
  getCurrentTimeHarare(): Date {
    const internetTime = this.getCurrentTime();
    return new Date(internetTime.toLocaleString("en-US", { timeZone: "Africa/Harare" }));
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
    const now = this.getCurrentTimeHarare();
    return now.toISOString().split('T')[0];
  }

  /**
   * Check if it's after 9 AM Harare time
   */
  isLate(checkInTime: Date): boolean {
    const harareTime = new Date(checkInTime.toLocaleString("en-US", { timeZone: "Africa/Harare" }));
    const hours = harareTime.getHours();
    const minutes = harareTime.getMinutes();
    
    // Consider late if after 9:00 AM
    return hours > 9 || (hours === 9 && minutes > 0);
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
