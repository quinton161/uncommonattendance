/**
 * TimeService — single source of truth for all time/date operations.
 *
 * Design decisions:
 * - NEVER blocks check-in because of a failed internet sync.
 * - Uses system clock + Africa/Harare Intl formatting for correctness.
 * - Attempts internet sync in the background; if it fails we silently use system time.
 * - Late threshold: 9:00 AM (9:00:00 exact = LATE).
 * - Check-in window: 7:00 AM – 9:05 AM.
 * - Admin/skipTimeCheck override bypasses the window entirely.
 */
export class TimeService {
  private static instance: TimeService;

  // Internet time offset in ms (0 until first successful sync)
  private timeOffset = 0;
  private lastSyncTime = 0;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 min

  private constructor() {
    this._syncInBackground();
  }

  static getInstance(): TimeService {
    if (!TimeService.instance) {
      TimeService.instance = new TimeService();
    }
    return TimeService.instance;
  }

  // ── Core clock ──────────────────────────────────────────────────────────────

  /** Returns the current moment as a JS Date (internet-corrected when available). */
  getCurrentTime(): Date {
    const now = Date.now() + this.timeOffset;
    return new Date(now);
  }

  /** Returns YYYY-MM-DD string in Africa/Harare timezone. */
  getCurrentDateString(): string {
    return this._toHarareDateString(this.getCurrentTime());
  }

  // ── Attendance rules ────────────────────────────────────────────────────────

  /**
   * isLate — true if check-in time is 9:00:00 AM or later (Harare).
   * 08:59:59 → on time.  09:00:00 → late.
   */
  isLate(checkInTime: Date): boolean {
    const { h, m } = this._harareHM(checkInTime);
    return h > 9 || (h === 9 && m >= 0);
  }

  /**
   * canCheckIn — true if the current Harare time is within the check-in window OR before it.
   * We allow the button to be enabled BEFORE the window opens so students can check in early.
   * They will be marked as "present" (not late) if they check in before 9:00 AM.
   * 
   * Window: 07:00 – 09:05.
   * 
   * IMPORTANT: returns TRUE when time sync hasn't completed yet (lastSyncTime===0)
   * so that slow devices / bad connections never get locked out.
   */
  canCheckIn(now: Date): boolean {
    // If we have never synced, allow check-in and let Firestore rules be the gate.
    if (this.lastSyncTime === 0) return true;

    const { h, m } = this._harareHM(now);
    const total = h * 60 + m;
    // Allow check-in from midnight until 9:05 AM (0 - 545 minutes)
    // After 9:05 AM, return false (check-in closed)
    return total <= 9 * 60 + 5; // 0 - 545 minutes
  }

  /**
   * isTooLateToCheckIn — true if check-in window has closed (after 9:05 AM).
   */
  isTooLateToCheckIn(now: Date): boolean {
    // If we have never synced, allow check-in (fail open)
    if (this.lastSyncTime === 0) return false;
    
    const { h, m } = this._harareHM(now);
    const total = h * 60 + m;
    return total > 9 * 60 + 5; // After 9:05 AM = too late
  }

  shouldMarkAbsent(): boolean {
    return this.isTooLateToCheckIn(this.getCurrentTime());
  }

  // ── Formatting ──────────────────────────────────────────────────────────────

  formatTime(date: Date): string {
    return date.toLocaleString('en-US', {
      timeZone: 'Africa/Harare',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      timeZone: 'Africa/Harare',
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  getTimeZoneInfo(): string {
    return this.getCurrentTime().toLocaleString('en-US', {
      timeZone: 'Africa/Harare', timeZoneName: 'short',
    });
  }

  getSyncStatus() {
    const now = Date.now();
    const recentSync = this.lastSyncTime > 0 && (now - this.lastSyncTime) < this.SYNC_INTERVAL;
    return {
      isOnline: navigator.onLine,
      lastSyncTime: this.lastSyncTime,
      timeOffset: this.timeOffset,
      usingInternetTime: recentSync,
    };
  }

  async forceSync(): Promise<boolean> {
    await this._syncInBackground();
    return this.lastSyncTime > 0;
  }

  // ── Internals ───────────────────────────────────────────────────────────────

  /** Returns { h, m } for a Date in Africa/Harare timezone. */
  private _harareHM(date: Date): { h: number; m: number } {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Harare',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(date);

    const h = Number(parts.find(p => p.type === 'hour')?.value ?? NaN);
    const m = Number(parts.find(p => p.type === 'minute')?.value ?? NaN);

    if (!Number.isFinite(h) || !Number.isFinite(m)) {
      // Fallback: use raw UTC+2 offset for Africa/Harare (CAT, no DST)
      const cat = new Date(date.getTime() + 2 * 3600 * 1000);
      return { h: cat.getUTCHours(), m: cat.getUTCMinutes() };
    }
    return { h, m };
  }

  private _toHarareDateString(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Harare',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(date);

    const y = parts.find(p => p.type === 'year')?.value;
    const mo = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;

    if (y && mo && d) return `${y}-${mo}-${d}`;
    // Ultimate fallback
    return new Date(date.getTime() + 2 * 3600 * 1000).toISOString().split('T')[0];
  }

  private async _syncInBackground(): Promise<void> {
    if (!navigator.onLine) return;
    // Prefer timeapi.io first (worldtimeapi often blocked or reset on some networks).
    const sources = [
      () => fetch('https://timeapi.io/api/Time/current/zone?timeZone=Africa/Harare', { signal: AbortSignal.timeout(4000) })
             .then(r => r.json()).then(d => new Date(d.dateTime)),
      () => fetch('https://worldtimeapi.org/api/timezone/Africa/Harare', { signal: AbortSignal.timeout(4000) })
             .then(r => r.json()).then(d => new Date(d.datetime)),
      () => fetch('https://www.google.com', { method: 'HEAD', signal: AbortSignal.timeout(4000) })
             .then(r => { const d = r.headers.get('date'); if (!d) throw new Error('no date'); return new Date(d); }),
    ];

    const t0 = Date.now();
    for (const source of sources) {
      try {
        const internetTime = await source();
        if (!isNaN(internetTime.getTime())) {
          const rtt = Date.now() - t0;
          this.timeOffset = internetTime.getTime() + rtt / 2 - Date.now();
          this.lastSyncTime = Date.now();
          if (process.env.NODE_ENV === 'development') {
            console.debug(`[TimeService] Synced, offset ${this.timeOffset.toFixed(0)}ms`);
          }
          return;
        }
      } catch (_) { /* try next */ }
    }
    if (process.env.NODE_ENV === 'development') {
      console.warn('[TimeService] Sync failed — using system clock');
    }
  }
}

export default TimeService;
