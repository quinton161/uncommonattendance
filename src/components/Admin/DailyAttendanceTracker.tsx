import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { UncommonLogo } from '../Common/UncommonLogo';
import { AttendanceService } from '../../services/attendanceService';
import { DailyAttendanceService } from '../../services/dailyAttendanceService';
import DataService from '../../services/DataService';
import { AttendanceRecord } from '../../types';
import { uniqueToast } from '../../utils/toastUtils';
import {
  CheckCircleIcon,
  CancelIcon,
  TodayIcon,
  CalendarIcon,
  TrendingUpIcon,
  BarChartIcon,
  ArrowBackIcon,
  ArrowForwardIcon,
  PersonIcon,
  LoginIcon,
  LogoutIcon,
  LocationOnIcon
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

const ControlsSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  gap: ${theme.spacing.md};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.lg};
  }
`;

const DateNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  background: ${theme.colors.white};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.sm};
`;

const DateDisplay = styled.div`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textPrimary};
  min-width: 200px;
  text-align: center;
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.base};
    min-width: 150px;
  }
`;

const NavButton = styled.button`
  background: none;
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.sm};
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

const StatCard = styled.div<{ variant?: 'present' | 'absent' | 'late' | 'total' }>`
  background: ${props => {
    switch (props.variant) {
      case 'present': return `linear-gradient(135deg, #22c55e 0%, #16a34a 100%)`;
      case 'absent': return `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`;
      case 'late': return `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`;
      case 'total': return `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`;
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

const AttendanceSection = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: ${theme.spacing.lg};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.gray200};
  
  h3 {
    margin: 0;
    font-size: ${theme.fontSizes.xl};
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textPrimary};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
  }
`;

const AttendanceTable = styled.div`
  overflow-x: auto;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.gray100};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }
`;

const TableRow = styled.div<{ isPresent?: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.gray100};
  align-items: center;
  transition: all 0.2s ease;
  background: ${props => props.isPresent === false ? '#fef2f2' : 'transparent'};
  
  &:hover {
    background: ${theme.colors.gray50};
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
    padding: ${theme.spacing.md};
  }
`;

const StudentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const StudentAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${theme.fontWeights.bold};
  font-size: ${theme.fontSizes.sm};
`;

const StudentDetails = styled.div`
  .name {
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
    margin-bottom: 2px;
  }
  
  .email {
    font-size: ${theme.fontSizes.sm};
    color: ${theme.colors.textSecondary};
  }
`;

const StatusBadge = styled.div<{ status: 'present' | 'absent' | 'late' }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  
  ${props => {
    switch (props.status) {
      case 'present':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        `;
      case 'late':
        return `
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        `;
      case 'absent':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        `;
      default:
        return `
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        `;
    }
  }}
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

const MobileCard = styled.div`
  display: none;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: block;
    background: ${theme.colors.white};
    border: 1px solid ${theme.colors.gray200};
    border-radius: ${theme.borderRadius.md};
    padding: ${theme.spacing.md};
    margin-bottom: ${theme.spacing.sm};
  }
`;

const MobileCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.sm};
`;

const MobileCardBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSizes.sm};
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing['3xl']};
  color: ${theme.colors.textSecondary};
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

interface DailyAttendanceTrackerProps {
  onBack?: () => void;
  isEmbedded?: boolean;
}

interface StudentAttendanceData {
  studentId: string;
  studentName: string;
  email: string;
  status: 'present' | 'absent' | 'late';
  checkInTime?: Date;
  checkOutTime?: Date;
  location?: string;
}

export const DailyAttendanceTracker: React.FC<DailyAttendanceTrackerProps> = ({ onBack, isEmbedded = true }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0
  });

  const attendanceService = AttendanceService.getInstance();
  const dailyAttendanceService = DailyAttendanceService.getInstance();
  const dataService = DataService.getInstance();

  useEffect(() => {
    loadDailyAttendance();
  }, [selectedDate]);

  const loadDailyAttendance = async () => {
    try {
      setLoading(true);

      // Get all users (students)
      const users = await dataService.getUsers();
      const students = users.filter(u => u.userType === 'attendee');

      // Get attendance records for the selected date
      const dateStr = selectedDate.toISOString().split('T')[0];
      const attendanceRecords = await attendanceService.getAttendanceByDateRange(dateStr, dateStr);

      // Build attendance data
      const attendanceMap = new Map();
      attendanceRecords.forEach(record => {
        attendanceMap.set(record.studentId, record);
      });

      const studentAttendanceData: StudentAttendanceData[] = students.map(student => {
        const record = attendanceMap.get(student.uid);
        
        if (record) {
          // Determine if student was late (after 9 AM)
          const checkInTime = record.checkInTime;
          const isLate = checkInTime && checkInTime.getHours() >= 9;
          
          return {
            studentId: student.uid,
            studentName: student.displayName || 'Unknown',
            email: student.email || '',
            status: isLate ? 'late' : 'present',
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime,
            location: record.location?.address || 'Unknown'
          };
        } else {
          return {
            studentId: student.uid,
            studentName: student.displayName || 'Unknown',
            email: student.email || '',
            status: 'absent'
          };
        }
      });

      setAttendanceData(studentAttendanceData);

      // Calculate stats
      const presentCount = studentAttendanceData.filter(s => s.status === 'present').length;
      const lateCount = studentAttendanceData.filter(s => s.status === 'late').length;
      const absentCount = studentAttendanceData.filter(s => s.status === 'absent').length;

      setStats({
        total: students.length,
        present: presentCount,
        late: lateCount,
        absent: absentCount
      });

    } catch (error) {
      console.error('Error loading daily attendance:', error);
      uniqueToast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date | null | undefined) => {
    if (!date) return '-';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  if (loading) {
    return (
      <PageContainer isEmbedded={isEmbedded}>
        <ContentWrapper isEmbedded={isEmbedded}>
          <LoadingState>
            <div>Loading daily attendance...</div>
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
              <span>Daily Attendance Tracker</span>
            </h1>
            <p>Monitor student attendance by day</p>
          </HeaderTitle>
        </Header>

        <ControlsSection>
          <DateNavigation>
            <NavButton onClick={() => navigateDate('prev')}>
              <ArrowBackIcon size={16} />
            </NavButton>
            <DateDisplay>
              <TodayIcon size={20} style={{ marginRight: theme.spacing.xs }} />
              {formatDate(selectedDate)}
              {isWeekend(selectedDate) && (
                <span style={{ 
                  color: theme.colors.warning, 
                  fontSize: theme.fontSizes.sm,
                  marginLeft: theme.spacing.xs 
                }}>
                  (Weekend)
                </span>
              )}
            </DateDisplay>
            <NavButton onClick={() => navigateDate('next')}>
              <ArrowForwardIcon size={16} />
            </NavButton>
          </DateNavigation>
          
          <Button variant="outline" onClick={goToToday}>
            Go to Today
          </Button>
        </ControlsSection>

        <StatsGrid>
          <StatCard variant="total">
            <StatIcon><PersonIcon size={24} /></StatIcon>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Total Students</StatLabel>
          </StatCard>
          
          <StatCard variant="present">
            <StatIcon><CheckCircleIcon size={24} /></StatIcon>
            <StatValue>{stats.present}</StatValue>
            <StatLabel>Present (On Time)</StatLabel>
          </StatCard>
          
          <StatCard variant="late">
            <StatIcon><TrendingUpIcon size={24} /></StatIcon>
            <StatValue>{stats.late}</StatValue>
            <StatLabel>Present (Late)</StatLabel>
          </StatCard>
          
          <StatCard variant="absent">
            <StatIcon><CancelIcon size={24} /></StatIcon>
            <StatValue>{stats.absent}</StatValue>
            <StatLabel>Absent</StatLabel>
          </StatCard>
        </StatsGrid>

        <AttendanceSection>
          <SectionHeader>
            <h3>
              <CalendarIcon size={20} />
              Student Attendance Details
            </h3>
          </SectionHeader>
          
          {attendanceData.length === 0 ? (
            <EmptyState>
              <PersonIcon size={64} />
              <h3>No Students Found</h3>
              <p>No student records available for this date.</p>
            </EmptyState>
          ) : (
            <AttendanceTable>
              <TableHeader>
                <div>Student</div>
                <div>Status</div>
                <div>Check In</div>
                <div>Check Out</div>
                <div>Location</div>
              </TableHeader>
              
              {attendanceData.map((student) => (
                <React.Fragment key={student.studentId}>
                  {/* Desktop View */}
                  <TableRow isPresent={student.status !== 'absent'}>
                    <StudentInfo>
                      <StudentAvatar>
                        {getInitials(student.studentName)}
                      </StudentAvatar>
                      <StudentDetails>
                        <div className="name">{student.studentName}</div>
                        <div className="email">{student.email}</div>
                      </StudentDetails>
                    </StudentInfo>
                    
                    <StatusBadge status={student.status}>
                      {student.status === 'present' && <CheckCircleIcon size={12} />}
                      {student.status === 'late' && <TrendingUpIcon size={12} />}
                      {student.status === 'absent' && <CancelIcon size={12} />}
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </StatusBadge>
                    
                    <TimeDisplay>
                      {student.checkInTime && <LoginIcon size={14} />}
                      <span className="time">{formatTime(student.checkInTime)}</span>
                    </TimeDisplay>
                    
                    <TimeDisplay>
                      {student.checkOutTime && <LogoutIcon size={14} />}
                      <span className="time">{formatTime(student.checkOutTime)}</span>
                    </TimeDisplay>
                    
                    <TimeDisplay>
                      {student.location && <LocationOnIcon size={14} />}
                      <span className="time">{student.location || '-'}</span>
                    </TimeDisplay>
                  </TableRow>
                  
                  {/* Mobile View */}
                  <MobileCard>
                    <MobileCardHeader>
                      <StudentInfo>
                        <StudentAvatar>
                          {getInitials(student.studentName)}
                        </StudentAvatar>
                        <StudentDetails>
                          <div className="name">{student.studentName}</div>
                          <div className="email">{student.email}</div>
                        </StudentDetails>
                      </StudentInfo>
                      <StatusBadge status={student.status}>
                        {student.status === 'present' && <CheckCircleIcon size={12} />}
                        {student.status === 'late' && <TrendingUpIcon size={12} />}
                        {student.status === 'absent' && <CancelIcon size={12} />}
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </StatusBadge>
                    </MobileCardHeader>
                    
                    <MobileCardBody>
                      <TimeDisplay>
                        <LoginIcon size={14} />
                        <span>In: {formatTime(student.checkInTime)}</span>
                      </TimeDisplay>
                      <TimeDisplay>
                        <LogoutIcon size={14} />
                        <span>Out: {formatTime(student.checkOutTime)}</span>
                      </TimeDisplay>
                    </MobileCardBody>
                  </MobileCard>
                </React.Fragment>
              ))}
            </AttendanceTable>
          )}
        </AttendanceSection>
      </ContentWrapper>
    </PageContainer>
  );
};
