import { addDays, eachDayOfInterval, parseISO, subDays } from 'date-fns';

/**
 * TimeService — single source of truth for all time/date operations.
 *
 * Design decisions:
 * - NEVER blocks check-in because of a failed internet sync.
 * - Uses system clock + Africa/Harare Intl formatting for correctness.
 * - Attempts internet sync in the background; if it fails we silently use system time.
 * - Session opens: 7:00 AM Harare (check-in not allowed before then).
 * - Late threshold: 9:01 AM Harare (9:00:00–9:00:59 = on time; 9:01:00+ = late).
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

  /** Calendar date in Harare for any instant (matches stored attendance `date` field). */
  toHarareDateString(date: Date): string {
    return this._toHarareDateString(date);
  }

  /**
   * UTC instants for [start, end] of a calendar day in Africa/Harare (CAT, UTC+2).
   * Used to query Firestore by `checkInTime` so records are found even if `date` is missing/wrong.
   */
  getHarareDayUtcBounds(yyyyMmDd: string): { start: Date; end: Date } {
    const start = new Date(`${yyyyMmDd}T00:00:00.000+02:00`);
    const end = new Date(`${yyyyMmDd}T23:59:59.999+02:00`);
    return { start, end };
  }

  /**
   * True if `yyyy-mm-dd` is Monday–Friday on the Africa/Harare calendar (school days).
   * Uses Harare weekday, not the browser’s local timezone.
   */
  isHarareWeekday(yyyyMmDd: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return false;
    const d = new Date(`${yyyyMmDd}T12:00:00+02:00`);
    const wd = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Harare',
      weekday: 'short',
    }).format(d);
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(wd);
  }

  /**
   * True if `yyyy-mm-dd` is Friday on the Africa/Harare calendar (weekly goal reflection).
   */
  isHarareFriday(yyyyMmDd: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return false;
    const d = new Date(`${yyyyMmDd}T12:00:00+02:00`);
    const wd = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Harare',
      weekday: 'short',
    }).format(d);
    return wd === 'Fri';
  }

  /**
   * All Mon–Fri calendar dates from start through end (inclusive), Harare.
   */
  eachHarareWeekdayInRange(startDateStr: string, endDateStr: string): string[] {
    const dates: string[] = [];
    eachDayOfInterval({
      start: parseISO(`${startDateStr}T12:00:00+02:00`),
      end: parseISO(`${endDateStr}T12:00:00+02:00`),
    }).forEach((d) => {
      const ymd = this.toHarareDateString(d);
      if (this.isHarareWeekday(ymd)) dates.push(ymd);
    });
    return dates;
  }

  /**
   * Last `n` school days (Mon–Fri) ending on `endDateStr` (Harare), oldest → newest.
   */
  lastNHarareWeekdays(n: number, endDateStr: string): string[] {
    const out: string[] = [];
    let d = parseISO(`${endDateStr}T12:00:00+02:00`);
    for (let i = 0; i < 21 && out.length < n; i++) {
      const ymd = this.toHarareDateString(d);
      if (this.isHarareWeekday(ymd)) out.unshift(ymd);
      d = subDays(d, 1);
    }
    return out;
  }

  /**
   * Monday–Sunday calendar bounds (Africa/Harare) for the week containing `dateStr` (YYYY-MM-DD).
   * Used to attach check-in goals to the weekly goals scaffold.
   */
  getHarareWeekMondaySundayBounds(dateStr: string): { weekStart: string; weekEnd: string } {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return { weekStart: dateStr, weekEnd: dateStr };
    }
    const d = new Date(`${dateStr}T12:00:00+02:00`);
    const wd = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Harare',
      weekday: 'short',
    }).format(d);
    const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
    const idx = order.indexOf(wd as (typeof order)[number]);
    const mondayOffset = idx >= 0 ? idx : 0;
    const monday = subDays(d, mondayOffset);
    const sunday = addDays(monday, 6);
    return {
      weekStart: this.toHarareDateString(monday),
      weekEnd: this.toHarareDateString(sunday),
    };
  }

  // ── Attendance rules ────────────────────────────────────────────────────────

  /**
   * isLate — true if check-in time is 9:01:00 AM or later (Harare).
   * Before 9:01 → on time for attendance (including all of 9:00 AM).
   */
  isLate(checkInTime: Date): boolean {
    const { h, m } = this._harareHM(checkInTime);
    return h > 9 || (h === 9 && m >= 1);
  }

  /**
   * canCheckIn — true only when Harare time is inside the daily session window.
   * Session starts at 7:00 AM; check-in is not allowed before then.
   * Window: 07:00 – 09:05 (inclusive).
   */
  canCheckIn(now: Date): boolean {
    const { h, m } = this._harareHM(now);
    const total = h * 60 + m;
    return total >= 7 * 60 && total <= 9 * 60 + 5;
  }

  /** True before 7:00 AM Harare — session has not started yet. */
  isBeforeSessionStart(now: Date): boolean {
    const { h, m } = this._harareHM(now);
    return h * 60 + m < 7 * 60;
  }

  /**
   * isTooLateToCheckIn — true if check-in window has closed (after 9:05 AM).
   */
  isTooLateToCheckIn(now: Date): boolean {
    const { h, m } = this._harareHM(now);
    const total = h * 60 + m;
    return total > 9 * 60 + 5; // After 9:05 AM = window closed
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

  /** Short clock time in Africa/Harare (12-hour) for dashboards and lists. */
  formatClockTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'Africa/Harare',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
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
