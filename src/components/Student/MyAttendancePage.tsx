import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { UncommonLogo } from '../Common/UncommonLogo';
import DataService from '../../services/DataService';
import { uniqueToast } from '../../utils/toastUtils';
import {
  CheckCircleIcon,
  TodayIcon,
  LocationOnIcon,
  LoginIcon,
  LogoutIcon,
  TrendingUpIcon
} from '../Common/Icons';

const PageContainer = styled.div`
  padding: ${theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: ${theme.colors.backgroundSecondary};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.lg};
    max-width: 100%;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.lg};
  border-bottom: 2px solid ${theme.colors.primary};
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
}

export const MyAttendancePage: React.FC<MyAttendancePageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    currentStreak: 0,
    averageTime: '9:15 AM',
    lateCheckIns: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);
  const dataService = DataService.getInstance();

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await dataService.testConnection();
      const userAttendance = await dataService.getAttendance(user.uid);
      const studentStats = await dataService.getStudentStats(user.uid);
      
      setAttendanceHistory(userAttendance);
      setStats({
        totalDays: studentStats.totalCheckIns,
        currentStreak: studentStats.currentStreak,
        averageTime: studentStats.averageCheckInTime || '9:15 AM',
        lateCheckIns: studentStats.lateCheckIns || 0,
        attendanceRate: studentStats.attendanceRate || 0
      });
    } catch (error) {
      console.error('Error loading attendance data:', error);
      uniqueToast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

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
    <PageContainer>
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
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Dashboard
          </Button>
        )}
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalDays}</StatValue>
          <StatLabel>Total Days Present</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.currentStreak}</StatValue>
          <StatLabel>Current Streak</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.averageTime}</StatValue>
          <StatLabel>Average Check-in Time</StatLabel>
        </StatCard>
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
    </PageContainer>
  );
};
