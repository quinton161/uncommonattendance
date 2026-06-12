import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceService } from '../../services/attendanceService';
import { effectiveStudentHubId } from '../../services/hubService';
import { getTodayDailyGoalTitleForCheckIn } from '../../services/studentGoalsService';
import { TimeService } from '../../services/timeService';
import { hasRecordedCheckout, isStaffCheckout } from '../../utils/attendanceCheckout';
import { LateCheckInReasonModal } from '../Student/LateCheckInReasonModal';
import { CheckInDailyGoalModal } from '../Student/CheckInDailyGoalModal';

import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import type { AttendanceRecord, LocationData } from '../../types';
import { Button } from '../Common/Button';
import { StudentPresenceBadge } from '../Recognition/StudentPresenceBadge';
import TimeSyncStatus from '../Common/TimeSyncStatus';

const AttSvc = AttendanceService.getInstance();

export function StudentDashboard(): React.ReactElement {
  const { user } = useAuth();
  const studentHubId = effectiveStudentHubId(user ?? undefined);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lateReasonModalOpen, setLateReasonModalOpen] = useState(false);
  const [checkInGoalModalOpen, setCheckInGoalModalOpen] = useState(false);
  const [checkInGoalInitial, setCheckInGoalInitial] = useState('');
  const [lateReasonPendingForGoal, setLateReasonPendingForGoal] = useState<string | null>(null);
  const [harareClock, setHarareClock] = useState('');
  const [checkInWindowHint, setCheckInWindowHint] = useState('');
  useBodyScrollLock(lateReasonModalOpen || checkInGoalModalOpen);

  const refreshHarareClock = useCallback(() => {
    const ts = TimeService.getInstance();
    const now = ts.getCurrentTime();
    setHarareClock(ts.formatClockTime(now));
    if (ts.isBeforeSessionStart(now)) {
      setCheckInWindowHint('Check-in opens at 7:00 AM (Harare school time).');
    } else if (ts.isTooLateToCheckIn(now)) {
      setCheckInWindowHint('Check-in closed after 9:05 AM (Harare). Ask your instructor.');
    } else if (!ts.canCheckIn(now)) {
      setCheckInWindowHint('Check-in window: 7:00–9:05 AM Harare.');
    } else {
      setCheckInWindowHint('');
    }
  }, []);

  useEffect(() => {
    refreshHarareClock();
    const id = window.setInterval(refreshHarareClock, 30_000);
    return () => window.clearInterval(id);
  }, [refreshHarareClock]);

  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;
    setLoading(true);
    setError('');

    const unsubToday = AttSvc.subscribeToTodayAttendance(
      user.uid,
      studentHubId,
      (record) => {
        if (cancelled) return;
        setTodayAttendance(record);
        setLoading(false);
        setError('');
      },
      (err) => {
        if (cancelled) return;
        console.error('Failed to subscribe to today attendance:', err);
        setError(err.message || 'Failed to load attendance');
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      unsubToday();
    };
  }, [user?.uid, studentHubId]);

  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;
    AttSvc.getAttendanceHistory(user.uid, 10, studentHubId)
      .then((rows) => {
        if (!cancelled) setAttendanceHistory(rows);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        console.error('Failed to load attendance history:', e);
        const code =
          e && typeof e === 'object' && 'code' in e
            ? String((e as { code?: string }).code)
            : '';
        const msg =
          code === 'permission-denied'
            ? 'Could not load attendance history. Sign out and back in, or contact your hub admin.'
            : e instanceof Error
              ? e.message
              : 'Failed to load attendance history';
        setError((prev) => prev || msg);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid, studentHubId]);

  const runCheckIn = async (lateReason?: string, checkInGoal?: string) => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const fallbackName =
        user.displayName?.trim() ||
        user.email?.split('@')[0]?.trim() ||
        'Student';

      let userIp = '0.0.0.0';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          userIp = ipData.ip || userIp;
        }
      } catch {
        // Ignore IP failures
      }

      const locationData: LocationData = {
        ip: userIp,
        timestamp: Date.now(),
      };

      const attendance = await AttSvc.checkIn(
        user.uid,
        fallbackName,
        undefined,
        locationData,
        false,
        'qr',
        studentHubId,
        lateReason,
        checkInGoal,
      );
      setTodayAttendance(attendance);
      const history = await AttSvc.getAttendanceHistory(user.uid, 10, studentHubId);
      setAttendanceHistory(history);
    } catch (err: any) {
      console.error('❌ Check-in failed:', err);
      setError(err?.message || 'Failed to check in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const openCheckInGoalStep = async (lateReason?: string) => {
    if (!user) return;
    setLateReasonPendingForGoal(lateReason ?? null);

    const existingGoal = await getTodayDailyGoalTitleForCheckIn(user.uid);
    if (existingGoal) {
      const preview =
        existingGoal.length > 100 ? `${existingGoal.slice(0, 100)}…` : existingGoal;
      const useExisting = window.confirm(
        `You already have today's goal on your Goals page:\n\n"${preview}"\n\nUse this goal for check-in? (Choose Cancel to enter a different goal.)`
      );
      if (useExisting) {
        try {
          await runCheckIn(lateReason, existingGoal);
        } catch {
          /* error surfaced via setError in runCheckIn */
        }
        return;
      }
    }

    setCheckInGoalInitial(existingGoal ?? '');
    setCheckInGoalModalOpen(true);
  };

  const handleCheckIn = async () => {
    if (!user) return;
    if (!window.confirm('Check in for today? Your attendance will be recorded for your hub.')) {
      return;
    }

    const ts = TimeService.getInstance();
    await ts.forceSync();
    const now = ts.getCurrentTime();
    const late = ts.isLate(now);

    if (ts.isBeforeSessionStart(now)) {
      setError('Check-in opens at 7:00 AM Harare school time.');
      return;
    }
    if (ts.isTooLateToCheckIn(now)) {
      setError('Check-in closed after 9:05 AM Harare. Ask your instructor.');
      return;
    }
    if (!ts.canCheckIn(now)) {
      setError('Check-in is only available 7:00–9:05 AM Harare.');
      return;
    }

    if (late) {
      setLateReasonModalOpen(true);
      return;
    }
    await openCheckInGoalStep();
  };

  const handleLateReasonSubmit = async (reason: string) => {
    setLateReasonModalOpen(false);
    await openCheckInGoalStep(reason);
  };

  const handleCheckInGoalSubmit = async (goal: string) => {
    try {
      await runCheckIn(lateReasonPendingForGoal ?? undefined, goal);
      setCheckInGoalModalOpen(false);
      setLateReasonPendingForGoal(null);
    } catch {
      /* error surfaced via setError in runCheckIn */
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;
    if (!window.confirm('Check out now? This completes today’s session.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      let userIp = '0.0.0.0';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          userIp = ipData.ip || userIp;
        }
      } catch {
        // Ignore IP failures
      }

      const locationData: LocationData = {
        ip: userIp,
        timestamp: Date.now(),
      };

      const attendance = await AttSvc.checkOut(user.uid, locationData, studentHubId);
      setTodayAttendance(attendance);
      const history = await AttSvc.getAttendanceHistory(user.uid, 10, studentHubId);
      setAttendanceHistory(history);
    } catch (err: any) {
      console.error('❌ Check-out failed:', err);
      setError(err?.message || 'Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (): 'checked-in' | 'checked-out' => {
    if (!todayAttendance) return 'checked-out';
    const hasCheckIn =
      todayAttendance.checkInTime instanceof Date &&
      !Number.isNaN(todayAttendance.checkInTime.getTime());
    if (hasCheckIn && !hasRecordedCheckout(todayAttendance)) return 'checked-in';
    return 'checked-out';
  };

  const ts = TimeService.getInstance();
  const formatTime = (date?: Date | null) => {
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return '—';
    return ts.formatClockTime(date);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const status = getAttendanceStatus();
  const checkedInToday =
    todayAttendance?.checkInTime instanceof Date &&
    !Number.isNaN(todayAttendance.checkInTime.getTime());
  const checkedOutToday = hasRecordedCheckout(todayAttendance ?? {});
  const staffCheckedOutToday = isStaffCheckout(todayAttendance ?? {});
  const todayStatusLabel = checkedOutToday
    ? staffCheckedOutToday
      ? 'Checked out by staff'
      : 'Day completed'
    : checkedInToday
      ? todayAttendance?.status === 'late'
        ? 'Checked in late'
        : 'Checked in'
      : 'Not checked in';
  const displayCheckOutTime = checkedOutToday ? todayAttendance?.checkOutTime : undefined;
  const checkOutLabel = staffCheckedOutToday ? 'Check-out (staff)' : 'Check-out';
  const nextActionLabel = status === 'checked-out' ? 'Check In' : 'Check Out';
  const snapshot = {
    total: attendanceHistory.length,
    present: attendanceHistory.filter((record) => record.status === 'present' || record.status === 'completed' || (record.isPresent && record.status !== 'late')).length,
    late: attendanceHistory.filter((record) => record.status === 'late').length,
    absent: attendanceHistory.filter((record) => record.status === 'absent' || !record.isPresent).length,
  };
  const snapshotItems = [
    { label: 'Records', value: snapshot.total, detail: 'Recent days', color: 'text-[#0052CC]', bg: 'bg-[#EEF4FF]' },
    { label: 'On time', value: snapshot.present, detail: 'Present records', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Late', value: snapshot.late, detail: 'Needs attention', color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Absent', value: snapshot.absent, detail: 'Missed days', color: 'text-red-700', bg: 'bg-red-50' },
  ];

  return (
    <>
      <LateCheckInReasonModal
        open={lateReasonModalOpen}
        onClose={() => setLateReasonModalOpen(false)}
        onSubmit={handleLateReasonSubmit}
      />
      <CheckInDailyGoalModal
        open={checkInGoalModalOpen}
        initialGoal={checkInGoalInitial}
        onClose={() => {
          setCheckInGoalModalOpen(false);
          setCheckInGoalInitial('');
          setLateReasonPendingForGoal(null);
        }}
        onSubmit={handleCheckInGoalSubmit}
      />

      <div className="space-y-5">
        <div className="rounded-[20px] bg-gradient-to-br from-[#0052CC] to-[#003D99] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">Student home</p>
          <h2 className="mt-2 text-2xl font-bold">Welcome back, {user?.displayName || 'Student'}</h2>
          {user?.uid && user?.hubId && (
            <div className="mt-2">
              <StudentPresenceBadge studentId={user.uid} hubId={user.hubId} />
            </div>
          )}
          <p className="mt-1 text-sm text-blue-100">
            {ts.formatDate(ts.getCurrentTime())}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              School time: {harareClock || ts.formatClockTime(ts.getCurrentTime())} (Harare)
            </span>
            <TimeSyncStatus />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {snapshotItems.map((item) => (
            <div key={item.label} className="card-white p-4 transition-colors">
              <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${item.bg} ${item.color}`}>
                {item.label}
              </div>
              <div className="mt-3 text-2xl font-bold text-gray-900">{loading ? '—' : item.value}</div>
              <p className="mt-1 text-xs text-gray-400">{item.detail}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="card-white p-6 lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <span className={`mb-3 rounded-full px-3 py-1 text-xs font-bold ${
                checkedInToday ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {todayStatusLabel}
              </span>
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white ${
                  status === 'checked-in'
                    ? 'bg-gradient-to-br from-emerald-500 to-[#0052CC]'
                    : 'bg-gradient-to-br from-slate-300 to-slate-500'
                }`}
              >
                {status === 'checked-in' ? '✓' : '○'}
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                {status === 'checked-in' ? 'You are currently checked in' : 'Ready for today'}
              </h3>

              <div className="my-4 w-full rounded-2xl bg-[#F8FAFF] p-3 text-left text-sm text-gray-500">
                <div className="mb-2 flex items-center justify-between gap-3 border-b border-gray-100 pb-2 text-xs">
                  <span>Harare time</span>
                  <span className="font-semibold text-gray-800">
                    {harareClock || ts.formatClockTime(ts.getCurrentTime())}
                  </span>
                </div>
                {checkInWindowHint ? (
                  <p className="mb-2 text-xs font-medium text-amber-700">{checkInWindowHint}</p>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <span>Check-in</span>
                  <span className="font-semibold text-gray-800">
                    {todayAttendance?.checkInTime ? formatTime(todayAttendance.checkInTime) : 'Not yet'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span>{checkOutLabel}</span>
                  <span className="font-semibold text-gray-800">
                    {displayCheckOutTime ? formatTime(displayCheckOutTime) : 'Not yet'}
                  </span>
                </div>
              </div>

              <Button
                variant={status === 'checked-out' ? 'primary' : 'secondary'}
                size="lg"
                fullWidth
                onClick={status === 'checked-out' ? handleCheckIn : handleCheckOut}
                loading={loading}
                disabled={loading}
              >
                {nextActionLabel}
              </Button>
            </div>
          </div>

          <div className="card-white p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">Recent Attendance</h3>
                <p className="text-xs text-gray-400">Your latest attendance records</p>
              </div>
              <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-bold text-[#0052CC]">
                {attendanceHistory.length} records
              </span>
            </div>

            {attendanceHistory.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FAFF] px-4 py-10 text-center text-sm text-gray-400">
                No attendance history yet
              </div>
            ) : (
              <div className="space-y-2">
                {attendanceHistory.map((record) => (
                  <div
                    key={record.id}
                    className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="font-semibold text-gray-900">
                      {formatDate(record.date)}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span>In: {formatTime(record.checkInTime)}</span>
                      {hasRecordedCheckout(record) ? (
                        <span>
                          Out{isStaffCheckout(record) ? ' (staff)' : ''}:{' '}
                          {formatTime(record.checkOutTime)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

