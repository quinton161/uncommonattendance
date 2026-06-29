import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import DataService from '../../services/DataService';
import { AttendanceService } from '../../services/attendanceService';
import { DailyAttendanceService } from '../../services/dailyAttendanceService';
import { TimeService } from '../../services/timeService';
import { hasRecordedCheckout, isStaffCheckout } from '../../utils/attendanceCheckout';
import type { AttendanceRecord } from '../../types';
import { uniqueToast } from '../../utils/toastUtils';
import { CalendarDays, Clock, TrendingUp, CheckCircle } from 'lucide-react';

const PageContainer = styled.div`
  padding: ${theme.spacing.xl};
  width: 100%;
  background: transparent;

  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.lg};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
`;

const ContentWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const HeaderSection = styled.div`
  margin-bottom: 24px;
`;

const HeaderTitle = styled.h1`
  font-size: 22px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin: 0;
  letter-spacing: -0.03em;
`;

const HeaderSub = styled.p`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  margin: 4px 0 0;
`;

const FilterRow = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
`;

const FilterGroup = styled.div`
  display: inline-flex;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
`;

const FilterBtn = styled.button<{ $active?: boolean }>`
  padding: 8px 24px;
  border: none;
  border-radius: 10px;
  background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
  color: ${({ $active }) => ($active ? theme.colors.primary : theme.colors.textSecondary)};
  font-weight: ${({ $active }) => ($active ? 700 : 600)};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${({ $active }) => ($active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none')};

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div<{ $accent?: string; $highlight?: boolean }>`
  background: ${({ $highlight }) => ($highlight ? 'linear-gradient(135deg, #0052CC, #003D99)' : '#ffffff')};
  border-radius: 16px;
  padding: 24px;
  box-shadow: ${({ $highlight }) => ($highlight ? '0 4px 20px rgba(0, 82, 204, 0.2)' : '0 1px 3px rgba(0,0,0,0.04)')};
  border: ${({ $highlight }) => ($highlight ? 'none' : '1px solid rgba(0, 82, 204, 0.06)')};
  text-align: center;
  position: relative;
  overflow: hidden;

  ${({ $highlight }) =>
    $highlight &&
    `
    &::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -30%;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
    }
  `}
`;

const StatIconWrap = styled.div<{ $bg: string }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
`;

const StatValue = styled.div<{ $color?: string; $light?: string }>`
  font-size: ${({ $light }) => ($light ? '32px' : '28px')};
  font-weight: 800;
  color: ${({ $color, $light }) => $light || $color || theme.colors.textPrimary};
  letter-spacing: -0.03em;
  line-height: 1.1;
`;

const StatLabel = styled.div<{ $light?: boolean }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ $light }) => ($light ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary)};
  margin-top: 6px;
`;

const TableCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 82, 204, 0.06);
  overflow: hidden;
`;

const TableHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 82, 204, 0.06);
`;

const TableTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: ${theme.colors.textPrimary};
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

const StaffTag = styled.span`
  font-size: 11px;
  color: ${theme.colors.textLight};
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${theme.colors.textLight};

  h3 {
    font-size: 16px;
    font-weight: 700;
    color: ${theme.colors.textPrimary};
    margin: 12px 0 4px;
  }

  p {
    font-size: 13px;
    margin: 0;
  }
`;

interface MyAttendancePageProps {
  onBack?: () => void;
  isEmbedded?: boolean;
}

export const MyAttendancePage: React.FC<MyAttendancePageProps> = ({ onBack, isEmbedded = true }) => {
  const { user } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    presentDays: 0,
    attendanceRate: 0,
    currentStreak: 0,
    averageTime: '9:15 AM',
    lateCheckIns: 0
  });
  const [loading, setLoading] = useState(true);
  const [statsRange, setStatsRange] = useState<'week' | 'month' | 'custom'>('month');
  const [customDays] = useState(7);
  const dataService = DataService.getInstance();
  const dailyAttendanceService = DailyAttendanceService.getInstance();
  const attendanceService = AttendanceService.getInstance();
  const ts = TimeService.getInstance();

  const fetchAttendanceStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let daysToCheck = 30;
    if (statsRange === 'week') daysToCheck = 7;
    else if (statsRange === 'month') daysToCheck = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    else if (statsRange === 'custom') daysToCheck = customDays;
    try {
      await dataService.testConnection();
      const stats = await dailyAttendanceService.getAttendanceStats(user.uid, daysToCheck);
      const history = await attendanceService.getAttendanceHistory(user.uid, daysToCheck, user.hubId);
      setStats({
        presentDays: stats.presentDays,
        attendanceRate: Math.round(stats.attendanceRate),
        currentStreak: stats.currentStreak,
        averageTime: '-',
        lateCheckIns: 0
      });
      setAttendanceHistory(history);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      uniqueToast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [user, statsRange, customDays]);

  useEffect(() => {
    fetchAttendanceStats();
  }, [fetchAttendanceStats]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      day: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  const formatTime = (date?: Date | null) => {
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return '—';
    return ts.formatClockTime(date);
  };

  const calculateTotalMinutes = (records: AttendanceRecord[]) => {
    let totalMins = 0;
    records.forEach(r => {
      if (hasRecordedCheckout(r) && r.checkInTime && r.checkOutTime) {
        const start = new Date(r.checkInTime).getTime();
        const end = new Date(r.checkOutTime).getTime();
        if (!isNaN(start) && !isNaN(end) && end > start) {
          totalMins += Math.floor((end - start) / 60000);
        }
      }
    });
    return totalMins;
  };

  const totalMinutes = calculateTotalMinutes(attendanceHistory);
  const totalHoursStr = totalMinutes > 0
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    : '0h 0m';

  return (
    <PageContainer>
      <ContentWrapper>
        <HeaderSection>
          <HeaderTitle>My Attendance Records</HeaderTitle>
          <HeaderSub>Track your check-ins, check-outs, and total time spent</HeaderSub>
        </HeaderSection>

        <FilterRow>
          <FilterGroup>
            <FilterBtn $active={statsRange === 'week'} onClick={() => setStatsRange('week')}>
              Past 7 Days
            </FilterBtn>
            <FilterBtn $active={statsRange === 'month'} onClick={() => setStatsRange('month')}>
              This Month
            </FilterBtn>
          </FilterGroup>
        </FilterRow>

        <StatsGrid>
          <StatCard $accent="#0052CC">
            <StatIconWrap $bg="rgba(0, 82, 204, 0.1)">
              <CalendarDays size={22} color="#0052CC" />
            </StatIconWrap>
            <StatValue $color="#0052CC">{loading ? '—' : stats.presentDays}</StatValue>
            <StatLabel>Days Present</StatLabel>
          </StatCard>

          <StatCard $highlight>
            <StatIconWrap $bg="rgba(255,255,255,0.15)">
              <Clock size={22} color="#fff" />
            </StatIconWrap>
            <StatValue $light="#fff">{loading ? '—' : totalHoursStr}</StatValue>
            <StatLabel $light>Total Time Tracked</StatLabel>
          </StatCard>

          <StatCard $accent="#059669">
            <StatIconWrap $bg="rgba(5, 150, 105, 0.1)">
              <TrendingUp size={22} color="#059669" />
            </StatIconWrap>
            <StatValue $color="#059669">{loading ? '—' : stats.attendanceRate}%</StatValue>
            <StatLabel>Attendance Rate</StatLabel>
          </StatCard>
        </StatsGrid>

        <TableCard>
          <TableHeader>
            <TableTitle>Timesheet</TableTitle>
          </TableHeader>

          {loading ? (
            <EmptyState><p>Loading attendance history...</p></EmptyState>
          ) : attendanceHistory.length === 0 ? (
            <EmptyState>
              <CheckCircle size={48} strokeWidth={1} color="#d1d5db" />
              <h3>No Attendance Records</h3>
              <p>Your attendance history will appear here once you start checking in.</p>
            </EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <THead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Day</Th>
                    <Th>Check In</Th>
                    <Th>Check Out</Th>
                    <Th>Duration</Th>
                  </tr>
                </THead>
                <tbody>
                  {attendanceHistory.map((record, index) => {
                    const { date, day } = formatDate(record.date);
                    let duration = '—';
                    if (hasRecordedCheckout(record) && record.checkInTime && record.checkOutTime) {
                      const start = new Date(record.checkInTime).getTime();
                      const end = new Date(record.checkOutTime).getTime();
                      if (!isNaN(start) && !isNaN(end) && end > start) {
                        const diffMins = Math.floor((end - start) / 60000);
                        const h = Math.floor(diffMins / 60);
                        const m = diffMins % 60;
                        duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
                      }
                    }

                    return (
                      <Tr key={record.id}>
                        <Td style={{ fontWeight: 600 }}>{date}</Td>
                        <Td style={{ color: theme.colors.textSecondary }}>{day}</Td>
                        <Td>{formatTime(record.checkInTime)}</Td>
                        <Td>
                          {hasRecordedCheckout(record) ? (
                            <>{formatTime(record.checkOutTime)}{isStaffCheckout(record) ? <StaffTag> (staff)</StaffTag> : ''}</>
                          ) : '—'}
                        </Td>
                        <Td><DurationBadge>{duration}</DurationBadge></Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </TableCard>
      </ContentWrapper>
    </PageContainer>
  );
};
