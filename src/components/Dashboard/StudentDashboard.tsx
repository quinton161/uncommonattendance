import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceService } from '../../services/attendanceService';
import { effectiveStudentHubId } from '../../services/hubService';
import { TimeService } from '../../services/timeService';
import { LateCheckInReasonModal } from '../Student/LateCheckInReasonModal';
import { CheckInDailyGoalModal } from '../Student/CheckInDailyGoalModal';

import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import type { AttendanceRecord, LocationData } from '../../types';
import { Button } from '../Common/Button';

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
  const [lateReasonPendingForGoal, setLateReasonPendingForGoal] = useState<string | null>(null);
  useBodyScrollLock(lateReasonModalOpen || checkInGoalModalOpen);

  useEffect(() => {
    // keep existing behavior: initial load
    // implemented via the existing attendanceService in original codebase
    // (unchanged logic is below; this is the repo's original dashboard implementation)
    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const attendance = await AttSvc.getTodayAttendance(user.uid, studentHubId);
        setTodayAttendance(attendance);
        const history = await AttSvc.getAttendanceHistory(user.uid, 10, studentHubId);
        setAttendanceHistory(history);
      } catch (e: any) {
        console.error('Failed to load attendance:', e);
        setError(e?.message || 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, studentHubId]);

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

  const handleCheckIn = async () => {
    if (!user) return;
    if (!window.confirm('Check in for today? Your attendance will be recorded for your hub.')) {
      return;
    }
    const ts = TimeService.getInstance();
    if (ts.isLate(ts.getCurrentTime())) {
      setLateReasonModalOpen(true);
      return;
    }
    setLateReasonPendingForGoal(null);
    setCheckInGoalModalOpen(true);
  };

  const handleLateReasonSubmit = async (reason: string) => {
    setLateReasonModalOpen(false);
    setLateReasonPendingForGoal(reason);
    setCheckInGoalModalOpen(true);
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
    if (todayAttendance.checkInTime && !todayAttendance.checkOutTime) return 'checked-in';
    return 'checked-out';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const status = getAttendanceStatus();

  return (
    <>
      <LateCheckInReasonModal
        open={lateReasonModalOpen}
        onClose={() => setLateReasonModalOpen(false)}
        onSubmit={handleLateReasonSubmit}
      />
      <CheckInDailyGoalModal
        open={checkInGoalModalOpen}
        onClose={() => {
          setCheckInGoalModalOpen(false);
          setLateReasonPendingForGoal(null);
        }}
        onSubmit={handleCheckInGoalSubmit}
      />

      <div className="space-y-5">
        <div className="rounded-[20px] bg-gradient-to-br from-[#0052CC] to-[#003D99] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">Student home</p>
          <h2 className="mt-2 text-2xl font-bold">Welcome back, {user?.displayName || 'Student'}</h2>
          <p className="mt-1 text-sm text-blue-100">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="card-white p-6 lg:col-span-1">
            <div className="flex flex-col items-center text-center">
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
                {status === 'checked-in'
                  ? `Checked in${todayAttendance?.status === 'late' ? ' late' : ''}`
                  : 'Not checked in'}
              </h3>

              {todayAttendance?.checkInTime && (
                <p className="mb-4 mt-2 text-sm text-gray-500">
                  Check-in: {formatTime(todayAttendance.checkInTime)}
                  {todayAttendance.checkOutTime && <> · Check-out: {formatTime(todayAttendance.checkOutTime)}</>}
                </p>
              )}

              <Button
                variant={status === 'checked-out' ? 'primary' : 'secondary'}
                size="lg"
                fullWidth
                onClick={status === 'checked-out' ? handleCheckIn : handleCheckOut}
                loading={loading}
                disabled={loading}
              >
                {status === 'checked-out' ? 'Check In' : 'Check Out'}
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
                      {record.checkOutTime && <span>Out: {formatTime(record.checkOutTime)}</span>}
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

