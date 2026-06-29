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
import { StudentPresenceBadge } from '../Recognition/StudentPresenceBadge';
import TimeSyncStatus from '../Common/TimeSyncStatus';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Clock, CalendarCheck, LogIn, LogOut, Timer, CheckCircle, XCircle } from 'lucide-react';

const AttSvc = AttendanceService.getInstance();

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const Space = styled.div<{ size?: string }>`
  height: ${({ size }) => size || '20px'};
`;

const WelcomeCard = styled.div`
  background: linear-gradient(135deg, #0052CC 0%, #003D99 100%);
  border-radius: 20px;
  padding: 28px 32px;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -60%;
    right: -20%;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -40%;
    left: -10%;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
  }
`;

const WelcomeEyebrow = styled.p`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 6px;
`;

const WelcomeTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.03em;
  position: relative;
  z-index: 1;
`;

const WelcomeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
  position: relative;
  z-index: 1;
`;

const WelcomeDate = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const WelcomeMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`;

const TimeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
  border-radius: 100px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  color: white;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div<{ $accent?: string; $bg?: string }>`
  background: #ffffff;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 82, 204, 0.06);
  position: relative;
  overflow: hidden;
  text-align: center;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ $accent }) => $accent || '#0052CC'};
  }
`;

const StatIconWrap = styled.div<{ $bg: string }>`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
`;

const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${theme.colors.textSecondary};
  margin-bottom: 6px;
`;

const StatValue = styled.div<{ $color?: string }>`
  font-size: 28px;
  font-weight: 800;
  color: ${({ $color }) => $color || theme.colors.textPrimary};
  letter-spacing: -0.03em;
  line-height: 1.1;
`;

const StatDetail = styled.p`
  font-size: 12px;
  color: ${theme.colors.textLight};
  margin: 6px 0 0;
`;

const ErrorBar = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 12px 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #dc2626;
`;

const ActionCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 82, 204, 0.06);
`;

const ActionTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 16px;
  color: ${theme.colors.textPrimary};
`;

const TimeInfoGrid = styled.div`
  background: #f8faff;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 16px;
`;

const TimeInfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;

  & + & {
    border-top: 1px solid rgba(0, 82, 204, 0.06);
  }
`;

const TimeInfoLabel = styled.span`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TimeInfoValue = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const HintText = styled.p`
  font-size: 12px;
  color: #d97706;
  text-align: center;
  margin: 0 0 12px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const CheckInButton = styled.button<{ $disabled?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  background: ${({ $disabled }) => ($disabled ? '#d1d5db' : 'linear-gradient(135deg, #7C3AED, #6D28D9)')};
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  box-shadow: ${({ $disabled }) => ($disabled ? 'none' : '0 4px 14px rgba(124, 58, 237, 0.3)')};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35);
  }
`;

const CheckOutButton = styled.button<{ $disabled?: boolean; $active?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border: 2px solid ${({ $active }) => ($active ? '#F59E0B' : '#e5e7eb')};
  border-radius: 12px;
  background: ${({ $disabled }) => ($disabled ? '#f9fafb' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#111827' : '#9ca3af')};
  font-size: 15px;
  font-weight: 700;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: #F59E0B;
    background: #fffbeb;
    color: #111827;
  }
`;

const HistoryCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 82, 204, 0.06);
  overflow: hidden;
`;

const HistoryHeader = styled.div`
  padding: 20px 24px 16px;
`;

const HistoryTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: ${theme.colors.textPrimary};
`;

const HistorySub = styled.p`
  font-size: 12px;
  color: ${theme.colors.textLight};
  margin: 4px 0 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const THead = styled.thead`
  background: #f8faff;
`;

const Th = styled.th`
  padding: 12px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${theme.colors.textSecondary};
  border-bottom: 1px solid rgba(0, 82, 204, 0.06);
`;

const Td = styled.td`
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0, 82, 204, 0.04);
  color: ${theme.colors.textPrimary};
`;

const Tr = styled.tr`
  &:hover {
    background: #fafbff;
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const DurationBadge = styled.span`
  font-weight: 700;
  color: #F59E0B;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${theme.colors.textLight};
  font-size: 14px;
`;

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
      console.error('Check-in failed:', err);
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
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;
    if (!window.confirm('Check out now? This completes today\'s session.')) {
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
      console.error('Check-out failed:', err);
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

  const formatDateShort = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const status = getAttendanceStatus();
  const checkedInToday =
    todayAttendance?.checkInTime instanceof Date &&
    !Number.isNaN(todayAttendance.checkInTime.getTime());
  const checkedOutToday = hasRecordedCheckout(todayAttendance ?? {});
  const staffCheckedOutToday = isStaffCheckout(todayAttendance ?? {});
  const displayCheckOutTime = checkedOutToday ? todayAttendance?.checkOutTime : undefined;
  const checkOutLabel = staffCheckedOutToday ? 'Check-out (staff)' : 'Check-out';

  const timeTrackedToday = (() => {
    if (checkedInToday && todayAttendance?.checkInTime) {
      const start = new Date(todayAttendance.checkInTime).getTime();
      const end = checkedOutToday && displayCheckOutTime
        ? new Date(displayCheckOutTime).getTime()
        : Date.now();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        const diffMins = Math.floor((end - start) / 60000);
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      }
    }
    return '0h 0m';
  })();

  const daysThisMonth = attendanceHistory.filter(r => {
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && r.isPresent;
  }).length;

  const currentStatusDisplay = checkedOutToday
    ? 'Checked Out'
    : checkedInToday
      ? 'Checked In'
      : 'Not Checked In';

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

      <Container>
        <WelcomeCard>
          <WelcomeEyebrow>Student Home</WelcomeEyebrow>
          <WelcomeTitle>Welcome back, {user?.displayName || 'Student'}</WelcomeTitle>
          {user?.uid && user?.hubId && (
            <div style={{ marginTop: 12, position: 'relative', zIndex: 1 }}>
              <StudentPresenceBadge studentId={user.uid} hubId={user.hubId} />
            </div>
          )}
          <WelcomeRow>
            <WelcomeDate>{ts.formatDate(ts.getCurrentTime())}</WelcomeDate>
            <WelcomeMeta>
              <TimeBadge>
                <Clock size={14} />
                {harareClock || ts.formatClockTime(ts.getCurrentTime())} (Harare)
              </TimeBadge>
              <TimeSyncStatus />
            </WelcomeMeta>
          </WelcomeRow>
        </WelcomeCard>

        <Space size="20px" />

        <StatsGrid>
          <StatCard $accent="#F59E0B">
            <StatIconWrap $bg="rgba(245, 158, 11, 0.1)">
              <Timer size={20} color="#F59E0B" />
            </StatIconWrap>
            <StatLabel>Time Tracked Today</StatLabel>
            <StatValue $color="#D97706">{loading ? '—' : timeTrackedToday}</StatValue>
            <StatDetail>Hours logged today</StatDetail>
          </StatCard>

          <StatCard $accent="#7C3AED">
            <StatIconWrap $bg="rgba(124, 58, 237, 0.1)">
              <CalendarCheck size={20} color="#7C3AED" />
            </StatIconWrap>
            <StatLabel>Days This Month</StatLabel>
            <StatValue $color="#7C3AED">{loading ? '—' : daysThisMonth}</StatValue>
            <StatDetail>Present records</StatDetail>
          </StatCard>

          <StatCard $accent={checkedInToday && !checkedOutToday ? '#059669' : checkedOutToday ? '#6B7280' : '#DC2626'}>
            <StatIconWrap $bg={checkedInToday && !checkedOutToday ? 'rgba(5, 150, 105, 0.1)' : checkedOutToday ? 'rgba(107, 114, 128, 0.1)' : 'rgba(220, 38, 38, 0.1)'}>
              {checkedInToday && !checkedOutToday ? (
                <CheckCircle size={20} color="#059669" />
              ) : checkedOutToday ? (
                <LogOut size={20} color="#6B7280" />
              ) : (
                <XCircle size={20} color="#DC2626" />
              )}
            </StatIconWrap>
            <StatLabel>Status</StatLabel>
            <StatValue $color={checkedInToday && !checkedOutToday ? '#059669' : checkedOutToday ? '#6B7280' : '#DC2626'}>
              {loading ? '—' : currentStatusDisplay}
            </StatValue>
            <StatDetail>Current state</StatDetail>
          </StatCard>
        </StatsGrid>

        {error && (
          <>
            <Space size="16px" />
            <ErrorBar>{error}</ErrorBar>
          </>
        )}

        <Space size="20px" />

        <ActionCard>
          <ActionTitle>Record Your Attendance</ActionTitle>

          <TimeInfoGrid>
            <TimeInfoRow>
              <TimeInfoLabel>
                <LogIn size={14} />
                Check-in
              </TimeInfoLabel>
              <TimeInfoValue>
                {todayAttendance?.checkInTime ? formatTime(todayAttendance.checkInTime) : 'Not yet'}
              </TimeInfoValue>
            </TimeInfoRow>
            <TimeInfoRow>
              <TimeInfoLabel>
                <LogOut size={14} />
                {checkOutLabel}
              </TimeInfoLabel>
              <TimeInfoValue>
                {displayCheckOutTime ? formatTime(displayCheckOutTime) : 'Not yet'}
              </TimeInfoValue>
            </TimeInfoRow>
          </TimeInfoGrid>

          {checkInWindowHint && <HintText>{checkInWindowHint}</HintText>}

          <ButtonRow>
            <CheckInButton
              $disabled={loading || checkedInToday}
              disabled={loading || checkedInToday}
              onClick={handleCheckIn}
            >
              <LogIn size={16} />
              {loading && status === 'checked-out' ? 'Checking in...' : 'Check In'}
            </CheckInButton>
            <CheckOutButton
              $disabled={loading || checkedOutToday || !checkedInToday}
              $active={checkedInToday && !checkedOutToday}
              disabled={loading || checkedOutToday || !checkedInToday}
              onClick={handleCheckOut}
            >
              <LogOut size={16} />
              {loading && status === 'checked-in' ? 'Checking out...' : 'Check Out'}
            </CheckOutButton>
          </ButtonRow>
        </ActionCard>

        <Space size="20px" />

        <HistoryCard>
          <HistoryHeader>
            <HistoryTitle>Recent Attendance</HistoryTitle>
            <HistorySub>Your latest 5 sessions</HistorySub>
          </HistoryHeader>

          {attendanceHistory.length === 0 ? (
            <EmptyState>No attendance history yet</EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <THead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Check In</Th>
                    <Th>Check Out</Th>
                    <Th>Duration</Th>
                  </tr>
                </THead>
                <tbody>
                  {attendanceHistory.slice(0, 5).map((record) => {
                    let duration = '—';
                    if (hasRecordedCheckout(record) && record.checkInTime && record.checkOutTime) {
                      const start = new Date(record.checkInTime).getTime();
                      const end = new Date(record.checkOutTime).getTime();
                      if (!isNaN(start) && !isNaN(end)) {
                        const diffMins = Math.floor((end - start) / 60000);
                        const h = Math.floor(diffMins / 60);
                        const m = diffMins % 60;
                        duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
                      }
                    }

                    return (
                      <Tr key={record.id}>
                        <Td style={{ fontWeight: 600 }}>{formatDateShort(record.date)}</Td>
                        <Td>{formatTime(record.checkInTime)}</Td>
                        <Td>{hasRecordedCheckout(record) ? formatTime(record.checkOutTime) : '—'}</Td>
                        <Td><DurationBadge>{duration}</DurationBadge></Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </HistoryCard>
      </Container>
    </>
  );
}
