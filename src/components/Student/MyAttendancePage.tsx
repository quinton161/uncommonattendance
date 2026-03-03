import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { UncommonLogo } from '../Common/UncommonLogo';
import DataService from '../../services/DataService';
import { DailyAttendanceService } from '../../services/dailyAttendanceService';
import { uniqueToast } from '../../utils/toastUtils';
import {
  CheckCircleIcon,
  TodayIcon,
  LoginIcon,
  LogoutIcon,
} from '../Common/Icons';

const PageContainer = styled.div<{ isEmbedded?: boolean }>`
  padding: ${props => props.isEmbedded ? '0' : theme.spacing.xl};
  width: 100%;
  min-height: 100vh;
  background: ${theme.colors.backgroundSecondary};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${props => props.isEmbedded ? '0' : theme.spacing.lg};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${props => props.isEmbedded ? '0' : theme.spacing.md};
  }
`;

const ContentWrapper = styled.div<{ isEmbedded?: boolean }>`
  padding: ${props => props.isEmbedded ? theme.spacing.lg : '0'};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${props => props.isEmbedded ? theme.spacing.md : '0'};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${props => props.isEmbedded ? theme.spacing.sm : '0'};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.lg};
  border-bottom: 2px solid ${theme.colors.primary};
  gap: ${theme.spacing.md};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.lg};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    margin-bottom: ${theme.spacing.lg};
    padding-bottom: ${theme.spacing.md};
  }
`;

const HeaderTitle = styled.div`
  h1 {
    font-family: ${theme.fonts.heading};
    font-size: ${theme.fontSizes['3xl']};
    font-weight: ${theme.fontWeights.bold};
    color: ${theme.colors.textPrimary};
    margin: 0 0 ${theme.spacing.sm} 0;
    line-height: 1.2;
  }
  
  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
    font-size: ${theme.fontSizes.lg};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  color: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: ${theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  opacity: 0.9;
`;

const AttendanceHistory = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  overflow: hidden;
`;

const HistoryHeader = styled.div`
  padding: ${theme.spacing.lg};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.gray200};
  
  h3 {
    margin: 0;
    font-size: ${theme.fontSizes.xl};
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textPrimary};
  }
`;

const HistoryList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.gray100};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${theme.colors.gray50};
  }
`;

const HistoryDate = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  
  .date {
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
  }
  
  .day {
    color: ${theme.colors.textSecondary};
    font-size: ${theme.fontSizes.sm};
  }
`;

const HistoryTimes = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};
  align-items: center;
`;

const TimeDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  
  .time {
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing['3xl']};
  color: ${theme.colors.textSecondary};
  
  h3 {
    font-size: ${theme.fontSizes.xl};
    margin-bottom: ${theme.spacing.sm};
    color: ${theme.colors.textPrimary};
  }
`;

interface MyAttendancePageProps {
  onBack?: () => void;
  isEmbedded?: boolean;
}

export const MyAttendancePage: React.FC<MyAttendancePageProps> = ({ onBack, isEmbedded = true }) => {
  const { user } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    presentDays: 0,
    attendanceRate: 0,
    currentStreak: 0,
    averageTime: '9:15 AM',
    lateCheckIns: 0
  });
  const [loading, setLoading] = useState(true);
  const [statsRange, setStatsRange] = useState<'week' | 'month' | 'custom'>('month');
  const [customDays, setCustomDays] = useState(7);
  const dataService = DataService.getInstance();
  const dailyAttendanceService = DailyAttendanceService.getInstance();

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
      const history = await dailyAttendanceService.getRecentActivity(user.uid, daysToCheck);
      setStats({
        presentDays: stats.presentDays,
        attendanceRate: Math.round(stats.attendanceRate),
        currentStreak: stats.currentStreak,
        averageTime: '-', // Not available in stats
        lateCheckIns: 0 // Not available in stats
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
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      day: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <PageContainer isEmbedded={isEmbedded}>
      <ContentWrapper isEmbedded={isEmbedded}>
        <Header>
        <HeaderTitle>
          <h1 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: theme.spacing.lg,
            margin: 0 
          }}>
            <UncommonLogo size="lg" showSubtitle={false} />
            <span>My Attendance</span>
          </h1>
          <p>Track your attendance history and patterns</p>
        </HeaderTitle>
      </Header>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <span style={{ fontWeight: 500 }}>Attendance Stats for:</span>
        <button
          style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: statsRange === 'week' ? theme.colors.primary : theme.colors.gray200, color: statsRange === 'week' ? '#fff' : theme.colors.textPrimary, cursor: 'pointer' }}
          onClick={() => setStatsRange('week')}
        >
          This Week
        </button>
        <button
          style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: statsRange === 'month' ? theme.colors.primary : theme.colors.gray200, color: statsRange === 'month' ? '#fff' : theme.colors.textPrimary, cursor: 'pointer' }}
          onClick={() => setStatsRange('month')}
        >
          This Month
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="number"
            min={1}
            max={90}
            value={statsRange === 'custom' ? customDays : ''}
            onChange={e => { setCustomDays(Number(e.target.value)); setStatsRange('custom'); }}
            style={{ width: 56, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
            placeholder="N"
          />
          days
        </label>
      </div>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.presentDays}</StatValue>
          <StatLabel>Days Present</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.attendanceRate}%</StatValue>
          <StatLabel>Attendance Rate</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.currentStreak}</StatValue>
          <StatLabel>Current Streak</StatLabel>
        </StatCard>
        {/* Average Check-in Time not available in stats, so omitted */}
      </StatsGrid>

      <AttendanceHistory>
        <HistoryHeader>
          <h3>Attendance History</h3>
        </HistoryHeader>
        
        {loading ? (
          <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
            Loading attendance history...
          </div>
        ) : attendanceHistory.length === 0 ? (
          <EmptyState>
            <CheckCircleIcon size={64} />
            <h3>No Attendance Records</h3>
            <p>Your attendance history will appear here once you start checking in.</p>
          </EmptyState>
        ) : (
          <HistoryList>
            {attendanceHistory.map((record) => {
              const { date, day } = formatDate(record.date);
              
              return (
                <HistoryItem key={record.id}>
                  <HistoryDate>
                    <TodayIcon size={16} />
                    <div>
                      <div className="date">{date}</div>
                      <div className="day">{day}</div>
                    </div>
                  </HistoryDate>
                  
                  <HistoryTimes>
                    <TimeDisplay>
                      <LoginIcon size={14} />
                      <span className="time">{formatTime(record.checkInTime)}</span>
                    </TimeDisplay>
                    
                    <TimeDisplay>
                      <LogoutIcon size={14} />
                      <span className="time">{formatTime(record.checkOutTime)}</span>
                    </TimeDisplay>
                  </HistoryTimes>
                </HistoryItem>
              );
            })}
          </HistoryList>
        )}
      </AttendanceHistory>
      </ContentWrapper>
    </PageContainer>
  );
};
