export class InternetTimeService {
  private static instance: InternetTimeService;
  private lastSyncTime: number = 0;
  private syncInterval: number = 5 * 60 * 1000; // 5 minutes
  private timeOffset: number = 0;
  private isOnline: boolean = true;

  public static getInstance(): InternetTimeService {
    if (!InternetTimeService.instance) {
      InternetTimeService.instance = new InternetTimeService();
    }
    return InternetTimeService.instance;
  }

  constructor() {
    this.initializeTimeSync();
    setInterval(() => { this.syncWithInternetTime(); }, this.syncInterval);
    window.addEventListener('online', () => { this.isOnline = true; this.syncWithInternetTime(); });
    window.addEventListener('offline', () => { this.isOnline = false; });
  }

  private async initializeTimeSync(): Promise<void> {
    await this.syncWithInternetTime();
  }

  private async syncWithInternetTime(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const startTime = Date.now();
      const timeSources = [
        this.getTimeAPI.bind(this),
        this.getWorldTimeAPI.bind(this),
        this.getGoogleTime.bind(this),
        this.getSimpleTime.bind(this),
      ];

      let internetTime: Date | null = null;
      for (const source of timeSources) {
        try {
          internetTime = await source();
          if (internetTime) break;
        } catch (_) { continue; }
      }

      if (internetTime) {
        const roundTripTime = Date.now() - startTime;
        const adjustedTime = new Date(internetTime.getTime() + roundTripTime / 2);
        this.timeOffset = adjustedTime.getTime() - Date.now();
        this.lastSyncTime = Date.now();
        console.log('✅ Time synchronized. Offset:', this.timeOffset + 'ms');
      } else {
        // No sync available — reset offset to 0 so we use raw system time
        // rather than a potentially stale offset from a previous failed run.
        if (this.lastSyncTime === 0) this.timeOffset = 0;
        console.warn('⚠️ All time sources failed, using system time');
      }
    } catch (error) {
      console.error('❌ Failed to sync time:', error);
    }
  }

  private async getWorldTimeAPI(): Promise<Date | null> {
    try {
      const response = await fetch('https://worldtimeapi.org/api/timezone/Africa/Harare', {
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        const data = await response.json();
        return new Date(data.datetime);
      }
      return null;
    } catch (_) { return null; }
  }

  private async getTimeAPI(): Promise<Date | null> {
    try {
      const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Africa/Harare', {
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        const data = await response.json();
        return new Date(data.dateTime);
      }
      return null;
    } catch (_) { return null; }
  }

  private async getGoogleTime(): Promise<Date | null> {
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) return new Date(dateHeader);
      }
      return null;
    } catch (_) { return null; }
  }

  private async getSimpleTime(): Promise<Date | null> {
    try {
      const response = await fetch('https://httpbin.org/get', {
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        const data = await response.json();
        if (data.headers?.Date) return new Date(data.headers.Date);
      }
      return null;
    } catch (_) { return null; }
  }

  /**
   * Returns current internet-synced time (falls back to system time gracefully).
   * NEVER returns an invalid date.
   */
  getCurrentTime(): Date {
    const now = Date.now();
    const isRecentSync = this.lastSyncTime > 0 && (now - this.lastSyncTime) < this.syncInterval;

    if (isRecentSync) {
      return new Date(now + this.timeOffset);
    }

    // Trigger a background sync without blocking
    if (this.isOnline) {
      this.syncWithInternetTime().catch(() => {});
    }

    // Always return a valid date — fall back to system time + last known offset
    return new Date(now + this.timeOffset);
  }

  /**
   * Returns current time. The Date object is absolute (not locale-parsed).
   * Caller should use Intl.DateTimeFormat with timeZone: 'Africa/Harare' for display.
   */
  getCurrentTimeHarare(): Date {
    return this.getCurrentTime();
  }

  formatTime(date: Date): string {
    return date.toLocaleString('en-US', {
      timeZone: 'Africa/Harare',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      timeZone: 'Africa/Harare',
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  getCurrentDateString(): string {
    const now = this.getCurrentTime();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Harare',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);

    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;

    if (!y || !m || !d) return new Date().toISOString().split('T')[0];
    return `${y}-${m}-${d}`;
  }

  // ── Attendance time rules ───────────────────────────────────────────────────
  // Check-in window: 7:00 AM – 9:05 AM Harare time
  // Students who arrive at 9:00:00 AM exactly are ON TIME.
  // Students who arrive at 9:00:01 AM or later are LATE.
  // After 9:05 AM check-in is CLOSED (unless admin override).
  private readonly CHECK_IN_START_HOUR = 7;    // 7:00 AM
  private readonly LATE_HOUR = 9;              // 9:00 AM
  private readonly LATE_MINUTE = 0;            // 9:00 AM (0 min)
  private readonly CUTOFF_HOUR = 9;            // 9:05 AM
  private readonly CUTOFF_MINUTE = 5;          // 9:05 AM

  /**
   * Returns true if the check-in time is LATE (at or after 9:00 AM Harare time).
   * 9:00:00 AM exactly → LATE (matches your existing behaviour in DataService).
   * 8:59:59 AM → on time.
   */
  isLate(checkInTime: Date): boolean {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Harare',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(checkInTime);

    const hours = Number(parts.find(p => p.type === 'hour')?.value ?? NaN);
    const minutes = Number(parts.find(p => p.type === 'minute')?.value ?? NaN);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;

    // FIXED: 9:00 AM exactly is late. 8:59 is on time.
    return hours > this.LATE_HOUR || (hours === this.LATE_HOUR && minutes >= this.LATE_MINUTE);
  }

  /**
   * Returns true if a student is allowed to check in right now.
   * Window: 7:00 AM to 9:05 AM Harare time.
   *
   * IMPORTANT: If time sync has not yet completed (lastSyncTime === 0),
   * we ALLOW check-in rather than blocking — this prevents all devices
   * from being locked out when the time API is slow or unavailable.
   */
  canCheckIn(checkInTime: Date): boolean {
    // If we've never synced, permit check-in and let the server-side
    // Firestore rules be the safety net.
    if (this.lastSyncTime === 0) {
      console.warn('⚠️ Time not synced yet — permitting check-in with system time');
      return true;
    }

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Harare',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(checkInTime);

    const hours = Number(parts.find(p => p.type === 'hour')?.value ?? NaN);
    const minutes = Number(parts.find(p => p.type === 'minute')?.value ?? NaN);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      // If we can't parse the time, allow check-in rather than block
      console.warn('⚠️ Could not parse check-in time — permitting check-in');
      return true;
    }

    const totalMinutes = hours * 60 + minutes;
    const startMinutes = this.CHECK_IN_START_HOUR * 60;            // 7:00 = 420
    const cutoffMinutes = this.CUTOFF_HOUR * 60 + this.CUTOFF_MINUTE; // 9:05 = 545

    return totalMinutes >= startMinutes && totalMinutes <= cutoffMinutes;
  }

  shouldMarkAbsent(): boolean {
    return !this.canCheckIn(this.getCurrentTime());
  }

  getSyncStatus() {
    const now = Date.now();
    const usingInternetTime = Boolean(this.lastSyncTime && (now - this.lastSyncTime) < this.syncInterval);
    return {
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      timeOffset: this.timeOffset,
      usingInternetTime
    };
  }

  async forceSync(): Promise<boolean> {
    await this.syncWithInternetTime();
    return this.lastSyncTime > 0;
  }

  getTimeZoneInfo(): string {
    return this.getCurrentTime().toLocaleString('en-US', { timeZone: 'Africa/Harare', timeZoneName: 'short' });
  }
}

export default InternetTimeService;
