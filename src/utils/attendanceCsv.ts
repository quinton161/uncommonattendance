import type { AbsenceReason } from '../types';

export const ATTENDANCE_CSV_HEADERS = [
  'Student ID',
  'Student Name',
  'Hub Name',
  'Program / Class',
  'Date',
  'Attendance Status',
  'Excuse Status',
  'Dropout Status',
  'Notes',
  'Recorded By (Name)',
  'Recorded By (User ID)',
  'Record Method',
] as const;

function escapeCell(v: unknown): string {
  const s = v == null || v === undefined ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

/** One CSV row (comma-separated, RFC4180-style quoting). */
export function formatCsvRow(fields: readonly unknown[]): string {
  return fields.map(escapeCell).join(',');
}

export function formatCsvDocument(header: readonly string[], rows: unknown[][]): string {
  const lines = [formatCsvRow(header), ...rows.map(formatCsvRow)];
  return lines.join('\r\n');
}

export function attendanceStatusForExport(
  hasCheckIn: boolean,
  rawStatus?: string,
  absenceReason?: string
): string {
  if (!hasCheckIn && (String(rawStatus).toLowerCase() === 'absent' || !!absenceReason)) return 'Absent';
  if (!hasCheckIn) return 'Absent';
  const s = (rawStatus || '').toLowerCase();
  if (s === 'late') return 'Late';
  if (s === 'completed') return 'Completed';
  return 'Present';
}

export function excuseStatusForExport(absenceReason?: AbsenceReason | string): string {
  if (!absenceReason || absenceReason === 'dropout') return '';
  if (absenceReason === 'excused') return 'Excused';
  if (absenceReason === 'unexcused') return 'Unexcused';
  return '';
}

export function dropoutStatusForExport(absenceReason?: AbsenceReason | string): string {
  return absenceReason === 'dropout' ? 'Yes' : 'No';
}

function methodLabel(m?: string): string {
  if (!m) return '';
  if (m === 'staff_absent') return 'Staff absence (recorded)';
  if (m === 'qr') return 'QR / student check-in';
  if (m === 'admin') return 'Admin mark present';
  if (m === 'instructor') return 'Instructor mark present';
  return String(m);
}

/** Prefer check-in over absence stub; if both absences, prefer one with reason/notes. */
export function pickBestAttendanceForStudent(rows: any[]): any | undefined {
  if (!rows.length) return undefined;
  if (rows.length === 1) return rows[0];
  const withIn = rows.filter((r) => r?.checkInTime);
  if (withIn.length === 1) return withIn[0];
  if (withIn.length > 1) {
    const t = (r: any) => {
      const c = r?.checkInTime;
      if (!c) return 0;
      if (c instanceof Date) return c.getTime();
      if (typeof c?.toDate === 'function') return c.toDate().getTime();
      return new Date(c).getTime();
    };
    return withIn.sort((a, b) => t(b) - t(a))[0];
  }
  const withReason = rows.find((r) => r?.absenceReason);
  return withReason || rows[0];
}

/** One row per student for a single calendar `dateStr` (hub roster + that day’s attendance docs). */
export function buildAttendanceExportRows(
  students: any[],
  attendanceRecordsForDate: any[],
  dateStr: string
): unknown[][] {
  const groups = new Map<string, any[]>();
  attendanceRecordsForDate.forEach((a: any) => {
    const sid = a.studentId || a.userId;
    if (!sid) return;
    const g = groups.get(sid) || [];
    g.push(a);
    groups.set(sid, g);
  });

  const byStudent = new Map<string, any>();
  groups.forEach((rows, sid) => {
    const best = pickBestAttendanceForStudent(rows);
    if (best) byStudent.set(sid, best);
  });

  return students
    .filter(
      (u: any) =>
        !u.userType || u.userType === 'attendee' || u.userType === 'student'
    )
    .map((u: any) => {
      const uid = u.uid || u.id;
      const rec = byStudent.get(uid);
      const hasIn = !!(rec?.checkInTime);
      return [
        u.bootcampStudentId || uid,
        u.displayName || rec?.studentName || 'Unknown',
        u.hubName || '',
        u.course || '',
        dateStr,
        attendanceStatusForExport(hasIn, rec?.status, rec?.absenceReason),
        excuseStatusForExport(rec?.absenceReason),
        dropoutStatusForExport(rec?.absenceReason),
        (rec?.absenceNotes as string) || '',
        (rec?.recordedByName as string) || '',
        (rec?.recordedByUid as string) || '',
        methodLabel(rec?.method),
      ];
    });
}
