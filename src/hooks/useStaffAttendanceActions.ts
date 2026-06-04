import { useCallback, useState } from 'react';
import { AttendanceService } from '../services/attendanceService';
import { TimeService } from '../services/timeService';
import { staffMayAccessHubForWrite } from '../services/hubService';
import { hasRecordedCheckout } from '../utils/attendanceCheckout';
import { uniqueToast } from '../utils/toastUtils';
import type { User } from '../types';
export function toDateSafe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const d = (value as { toDate: () => Date }).toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  }
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type AttendanceListRow = {
  userId?: string;
  userName?: string;
  hubId?: string;
  status?: string;
  checkInTime?: unknown;
  checkOutTime?: unknown;
  checkOutMethod?: string;
};

export function useStaffAttendanceActions(options: {
  user: User | null | undefined;
  effectiveHub: string | undefined;
  hubScopeActive: boolean;
  canWriteSelectedHub: boolean;
  onRefresh: () => void | Promise<void>;
  attendanceList?: AttendanceListRow[];
}) {
  const { user, effectiveHub, hubScopeActive, canWriteSelectedHub, onRefresh, attendanceList = [] } =
    options;
  const [checkoutAllLoading, setCheckoutAllLoading] = useState(false);
  const [checkoutStudentId, setCheckoutStudentId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const ts = TimeService.getInstance();

  const formatAttTime = useCallback(
    (value: unknown): string | null => {
      const d = toDateSafe(value);
      return d ? ts.formatClockTime(d) : null;
    },
    [ts]
  );

  const rowMeta = useCallback((record: AttendanceListRow | undefined) => {
    const checkInDate = toDateSafe(record?.checkInTime);
    const checkOutDate = toDateSafe(record?.checkOutTime);
    const checkoutRecord = {
      checkOutTime: checkOutDate,
      checkOutMethod: record?.checkOutMethod,
    };
    const hasIn = !!checkInDate;
    const checkedOut = hasRecordedCheckout(checkoutRecord);
    const checkInDisp = formatAttTime(checkInDate) ?? '—';
    let checkOutDisp = '—';
    if (record?.checkOutMethod === 'staff' && checkOutDate) {
      checkOutDisp = `Staff ${formatAttTime(checkOutDate) ?? '—'}`;
    } else if (record?.checkOutMethod === 'student' && checkOutDate) {
      checkOutDisp = formatAttTime(checkOutDate) ?? '—';
    }
    return { hasIn, checkedOut, checkInDisp, checkOutDisp };
  }, [formatAttTime]);

  const markPresent = useCallback(
    async (studentId: string, studentName: string, targetHubId?: string) => {
      if (user?.userType === 'instructor' && !staffMayAccessHubForWrite(user, targetHubId)) {
        uniqueToast.error('You can only record attendance for students in your hub.');
        return;
      }
      try {
        await AttendanceService.getInstance().checkIn(
          studentId,
          studentName,
          undefined,
          undefined,
          true,
          user?.userType === 'instructor' ? 'instructor' : 'admin',
          targetHubId
        );
        uniqueToast.success(`${studentName} marked as present!`);
        await onRefresh();
      } catch (error) {
        console.error('Failed to mark present:', error);
        uniqueToast.error(`Failed to mark ${studentName} as present`);
      }
    },
    [user, onRefresh]
  );

  const unmarkPresent = useCallback(
    async (studentId: string, studentName: string, targetHubId?: string, dateStr?: string) => {
      if (user?.userType === 'instructor' && !staffMayAccessHubForWrite(user, targetHubId)) {
        uniqueToast.error('You can only update attendance for students in your hub.');
        return;
      }
      const date = dateStr || ts.getCurrentDateString();
      if (!window.confirm(`Unmark ${studentName} as present for ${date}?`)) return;
      try {
        const removed = await AttendanceService.getInstance().unmarkPresentForDate(
          studentId,
          date,
          targetHubId || effectiveHub
        );
        if (!removed) {
          uniqueToast.info(`${studentName} has no present record for that date.`);
          return;
        }
        uniqueToast.success(`${studentName} unmarked successfully.`);
        await onRefresh();
      } catch (error) {
        console.error('Failed to unmark present:', error);
        uniqueToast.error(`Failed to unmark ${studentName}.`);
      }
    },
    [user, effectiveHub, ts, onRefresh]
  );

  const checkOutStudent = useCallback(
    async (studentId: string, studentName: string, studentHubId?: string) => {
      if (!hubScopeActive || !canWriteSelectedHub) {
        uniqueToast.info('Select your hub before checking out students.');
        return;
      }
      if (
        !window.confirm(
          `Check out ${studentName} for today? This records a staff check-out time (Harare).`
        )
      ) {
        return;
      }
      setCheckoutStudentId(studentId);
      try {
        await AttendanceService.getInstance().checkOutAsStaff(studentId, studentHubId);
        uniqueToast.success(`${studentName} checked out.`);
        await onRefresh();
      } catch (error: unknown) {
        console.error('Staff check-out failed:', error);
        const msg = error instanceof Error ? error.message : 'Failed to check out student.';
        uniqueToast.error(msg);
      } finally {
        setCheckoutStudentId(null);
      }
    },
    [hubScopeActive, canWriteSelectedHub, onRefresh]
  );

  const checkOutAllOpen = useCallback(async () => {
    if (!hubScopeActive || !canWriteSelectedHub) {
      uniqueToast.info(
        user?.userType === 'instructor'
          ? 'Select your assigned hub before checking out students.'
          : 'Select a single hub so check-out applies to that hub only.'
      );
      return;
    }
    if (checkoutAllLoading || bulkLoading) return;
    if (
      !window.confirm(
        'Check out everyone still checked in today? Staff check-out times will be recorded (Harare).'
      )
    ) {
      return;
    }
    setCheckoutAllLoading(true);
    try {
      const { checkedOut } = await AttendanceService.getInstance().checkOutAllOpenToday(effectiveHub);
      uniqueToast.success(
        checkedOut === 0 ? 'No open sessions to check out.' : `Checked out ${checkedOut} student(s).`
      );
      await onRefresh();
    } catch (error) {
      console.error('Failed to check out all:', error);
      uniqueToast.error('Failed to check out everyone.');
    } finally {
      setCheckoutAllLoading(false);
    }
  }, [hubScopeActive, canWriteSelectedHub, checkoutAllLoading, bulkLoading, effectiveHub, user?.userType, onRefresh]);

  const markAllPresent = useCallback(async () => {
    if (!hubScopeActive || !canWriteSelectedHub) {
      uniqueToast.info(
        user?.userType === 'instructor'
          ? 'Select your assigned hub before using bulk actions.'
          : 'Select a single hub so bulk actions apply to that hub only.'
      );
      return;
    }
    const absent = attendanceList.filter((row) => {
      if (!row.userId) return false;
      const meta = rowMeta(row);
      return row.status === 'absent' || !meta.hasIn;
    });

    if (absent.length === 0) {
      uniqueToast.info('All students are already marked as present.');
      return;
    }

    if (!window.confirm(`Mark all ${absent.length} absent / not checked-in students as present?`)) {
      return;
    }

    setBulkLoading(true);
    try {
      const svc = AttendanceService.getInstance();
      await Promise.all(
        absent.map((row) =>
          svc.checkIn(
            row.userId!,
            row.userName || 'Unknown User',
            undefined,
            undefined,
            true,
            user?.userType === 'instructor' ? 'instructor' : 'admin',
            row.hubId
          )
        )
      );
      uniqueToast.success(`Marked ${absent.length} student(s) as present!`);
      await onRefresh();
    } catch (error) {
      console.error('Failed to mark all present:', error);
      uniqueToast.error('Failed to mark all students as present');
    } finally {
      setBulkLoading(false);
    }
  }, [
    hubScopeActive,
    canWriteSelectedHub,
    attendanceList,
    rowMeta,
    user?.userType,
    onRefresh,
  ]);

  return {
    checkoutAllLoading,
    checkoutStudentId,
    bulkLoading,
    formatAttTime,
    rowMeta,
    markPresent,
    unmarkPresent,
    checkOutStudent,
    checkOutAllOpen,
    markAllPresent,
  };
}
