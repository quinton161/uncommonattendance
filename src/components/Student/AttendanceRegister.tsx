import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { UncommonLogo } from '../Common/UncommonLogo';
import { DailyAttendanceService, AttendanceCalendarDay, DailyAttendanceStats } from '../../services/dailyAttendanceService';
import { uniqueToast } from '../../utils/toastUtils';
import {
  CheckCircleIcon,
  CancelIcon,
  TodayIcon,
  CalendarIcon,
  TrendingUpIcon,
  BarChartIcon,
  ArrowBackIcon,
  ArrowForwardIcon
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const StatCard = styled.div<{ variant?: 'present' | 'absent' | 'rate' | 'streak' }>`
  background: ${props => {
    switch (props.variant) {
      case 'present': return `linear-gradient(135deg, #22c55e 0%, #16a34a 100%)`;
      case 'absent': return `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`;
      case 'rate': return `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`;
      case 'streak': return `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`;
      default: return theme.colors.white;
    }
  }};
  color: ${props => props.variant ? theme.colors.white : theme.colors.textPrimary};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  text-align: center;
  position: relative;
  overflow: hidden;
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
`;

const StatValue = styled.div`
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: ${theme.spacing.xs};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xl};
  }
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  opacity: 0.9;
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xs};
  }
`;

const StatIcon = styled.div`
  position: absolute;
  top: ${theme.spacing.sm};
  right: ${theme.spacing.sm};
  opacity: 0.3;
`;

const CalendarSection = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  overflow: hidden;
  margin-bottom: ${theme.spacing.xl};
`;

const CalendarHeader = styled.div`
  padding: ${theme.spacing.lg};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.gray200};
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: ${theme.fontSizes.xl};
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textPrimary};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
    flex-direction: column;
    gap: ${theme.spacing.sm};
    
    h3 {
      font-size: ${theme.fontSizes.lg};
    }
  }
`;

const CalendarNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const MonthDisplay = styled.div`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textPrimary};
  min-width: 150px;
  text-align: center;
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.base};
    min-width: 120px;
  }
`;

const NavButton = styled.button`
  background: none;
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.xs};
  cursor: pointer;
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
    background: ${theme.colors.gray50};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1px;
  background: ${theme.colors.gray200};
  padding: 1px;
`;

const CalendarDayHeader = styled.div`
  background: ${theme.colors.gray100};
  padding: ${theme.spacing.sm};
  text-align: center;
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textSecondary};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.xs};
    font-size: ${theme.fontSizes.xs};
  }
`;

const CalendarDay = styled.div<{ 
  isPresent?: boolean; 
  isToday?: boolean; 
  isFuture?: boolean;
  isEmpty?: boolean;
}>`
  background: ${props => {
    if (props.isEmpty) return theme.colors.gray50;
    if (props.isPresent) return '#dcfce7'; // Light green
    if (props.isFuture) return theme.colors.white;
    return '#fef2f2'; // Light red for absent days
  }};
  padding: ${theme.spacing.sm};
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  border: ${props => props.isToday ? `2px solid ${theme.colors.primary}` : 'none'};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    min-height: 40px;
    padding: ${theme.spacing.xs};
  }
`;

const DayNumber = styled.div<{ isToday?: boolean; isFuture?: boolean }>`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${props => props.isToday ? theme.fontWeights.bold : theme.fontWeights.medium};
  color: ${props => {
    if (props.isToday) return theme.colors.primary;
    if (props.isFuture) return theme.colors.gray400;
    return theme.colors.textPrimary;
  }};
  margin-bottom: ${theme.spacing.xs};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xs};
    margin-bottom: 2px;
  }
`;

const AttendanceIndicator = styled.div<{ isPresent: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${props => props.isPresent ? '#22c55e' : '#ef4444'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    width: 12px;
    height: 12px;
  }
`;

const LegendSection = styled.div`
  padding: ${theme.spacing.lg};
  background: ${theme.colors.gray50};
  display: flex;
  justify-content: center;
  gap: ${theme.spacing.xl};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${theme.spacing.sm};
    padding: ${theme.spacing.md};
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
`;

const LegendDot = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing['3xl']};
  color: ${theme.colors.textSecondary};
`;

interface AttendanceRegisterProps {
  onBack?: () => void;
  isEmbedded?: boolean;
}

export const AttendanceRegister: React.FC<AttendanceRegisterProps> = ({ onBack, isEmbedded = true }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyAttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    attendanceRate: 0,
    lastAttendanceDate: null,
  });
  const [calendarData, setCalendarData] = useState<AttendanceCalendarDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  
  const dailyAttendanceService = DailyAttendanceService.getInstance();

  useEffect(() => {
    loadAttendanceData();
  }, [currentMonth, currentYear]);

  const loadAttendanceData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load stats for the last 30 days
      const statsData = await dailyAttendanceService.getAttendanceStats(user.uid, 30);
      setStats(statsData);
      
      // Load calendar data for current month
      const calendarData = await dailyAttendanceService.getAttendanceCalendar(user.uid, currentYear, currentMonth);
      setCalendarData(calendarData);
      
    } catch (error) {
      console.error('Error loading attendance data:', error);
      uniqueToast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getMonthName = (month: number, year: number) => {
    return new Date(year, month - 1).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const renderCalendar = (): React.ReactNode[] => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const today = new Date().toISOString().split('T')[0];
    
    const days: React.ReactNode[] = [];
    const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']; // Only weekdays
    
    // Add day headers for weekdays only
    dayHeaders.forEach(day => (
      days.push(
        <CalendarDayHeader key={`header-${day}`}>
          {day}
        </CalendarDayHeader>
      )
    ));
    
    // Get all weekdays in the month
    const weekdays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Only include weekdays (Monday = 1 to Friday = 5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        weekdays.push({
          day,
          date,
          dayOfWeek,
          dateStr: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        });
      }
    }
    
    // Group weekdays by week and add to calendar
    let currentWeek: React.ReactNode[] = [];
    let currentWeekStart = -1;
    
    weekdays.forEach((weekday, index) => {
      const { day, date, dayOfWeek, dateStr } = weekday;
      const dayData = calendarData.find(d => d.date === dateStr);
      const isToday = dateStr === today;
      const isFuture = date > new Date();
      
      // If this is the start of a new week or first day
      if (currentWeekStart === -1) {
        currentWeekStart = dayOfWeek;
        // Add empty cells for days before the first weekday of the week
        for (let i = 1; i < dayOfWeek; i++) {
          currentWeek.push(
            <CalendarDay key={`empty-${index}-${i}`} isEmpty>
              <DayNumber></DayNumber>
            </CalendarDay>
          );
        }
      }
      
      // Add the actual day
      currentWeek.push(
        <CalendarDay 
          key={day} 
          isPresent={dayData?.isPresent}
          isToday={isToday}
          isFuture={isFuture}
        >
          <DayNumber isToday={isToday} isFuture={isFuture}>
            {day}
          </DayNumber>
          {!isFuture && dayData && (
            <AttendanceIndicator isPresent={dayData.isPresent}>
              {dayData.isPresent ? (
                <CheckCircleIcon size={8} />
              ) : (
                <CancelIcon size={8} />
              )}
            </AttendanceIndicator>
          )}
        </CalendarDay>
      );
      
      // If this is Friday (5) or the last weekday, complete the week
      if (dayOfWeek === 5 || index === weekdays.length - 1) {
        // Add empty cells to complete the week if needed
        while (currentWeek.length < 5) {
          currentWeek.push(
            <CalendarDay key={`empty-end-${index}-${currentWeek.length}`} isEmpty>
              <DayNumber></DayNumber>
            </CalendarDay>
          );
        }
        
        // Add the complete week to days
        days.push(...currentWeek);
        currentWeek = [];
        currentWeekStart = -1;
      }
    });
    
    return days;
  };

  if (loading) {
    return (
      <PageContainer isEmbedded={isEmbedded}>
        <ContentWrapper isEmbedded={isEmbedded}>
          <LoadingState>
            <div>Loading attendance register...</div>
          </LoadingState>
        </ContentWrapper>
      </PageContainer>
    );
  }

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
              <span>Attendance Register</span>
            </h1>
            <p>View your daily attendance record and patterns</p>
          </HeaderTitle>
        </Header>

        <StatsGrid>
          <StatCard variant="present">
            <StatIcon><CheckCircleIcon size={24} /></StatIcon>
            <StatValue>{stats.presentDays}</StatValue>
            <StatLabel>Days Present</StatLabel>
          </StatCard>
          
          <StatCard variant="absent">
            <StatIcon><CancelIcon size={24} /></StatIcon>
            <StatValue>{stats.absentDays}</StatValue>
            <StatLabel>Days Absent</StatLabel>
          </StatCard>
          
          <StatCard variant="rate">
            <StatIcon><BarChartIcon size={24} /></StatIcon>
            <StatValue>{stats.attendanceRate.toFixed(1)}%</StatValue>
            <StatLabel>Attendance Rate</StatLabel>
          </StatCard>
          
          <StatCard variant="streak">
            <StatIcon><TrendingUpIcon size={24} /></StatIcon>
            <StatValue>{stats.currentStreak}</StatValue>
            <StatLabel>Current Streak</StatLabel>
          </StatCard>
        </StatsGrid>

        <CalendarSection>
          <CalendarHeader>
            <h3>
              <CalendarIcon size={20} style={{ marginRight: theme.spacing.sm }} />
              Monthly Attendance Calendar
            </h3>
            <CalendarNavigation>
              <NavButton onClick={() => navigateMonth('prev')}>
                <ArrowBackIcon size={16} />
              </NavButton>
              <MonthDisplay>
                {getMonthName(currentMonth, currentYear)}
              </MonthDisplay>
              <NavButton onClick={() => navigateMonth('next')}>
                <ArrowForwardIcon size={16} />
              </NavButton>
            </CalendarNavigation>
          </CalendarHeader>
          
          <CalendarGrid>
            {renderCalendar()}
          </CalendarGrid>
          
          <LegendSection>
            <LegendItem>
              <LegendDot color="#22c55e" />
              Present
            </LegendItem>
            <LegendItem>
              <LegendDot color="#ef4444" />
              Absent
            </LegendItem>
            <LegendItem>
              <LegendDot color={theme.colors.gray300} />
              Future/No Data
            </LegendItem>
            <LegendItem>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                border: `2px solid ${theme.colors.primary}`,
                borderRadius: '2px'
              }} />
              Today
            </LegendItem>
          </LegendSection>
        </CalendarSection>
      </ContentWrapper>
    </PageContainer>
  );
};
