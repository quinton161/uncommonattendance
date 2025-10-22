import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { Button } from '../Common/Button';
import { theme } from '../../styles/theme';
import { 
  staggeredAnimation, 
  pageTransition, 
  containerAnimation,
  respectMotionPreference 
} from '../../styles/animations';
import DataService from '../../services/DataService';
import { AttendanceService } from '../../services/attendanceService';
import { DailyAttendanceService, DailyAttendanceStats } from '../../services/dailyAttendanceService';
import { EventsPage } from '../Events/EventsPage';
import { MyAttendancePage } from '../Student/MyAttendancePage';
import { SchedulePage } from '../Student/SchedulePage';
import { ProgressPage } from '../Student/ProgressPage';
import { UncommonLogo } from '../Common/UncommonLogo';
import { StarField } from '../Common/StarField';
import { uniqueToast } from '../../utils/toastUtils';
import {
  DashboardIcon,
  EventIcon,
  CheckCircleIcon,
  ScheduleIcon,
  TrendingUpIcon,
  PersonIcon,
  LogoutIcon,
  LocationOnIcon,
  AssignmentIcon,
  BarChartIcon,
  LoginIcon
} from '../Common/Icons';

const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${theme.colors.backgroundSecondary};
  ${pageTransition}
  ${respectMotionPreference}
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
  }
`;

const Sidebar = styled.div<{ isOpen?: boolean }>`
  width: 280px;
  background: linear-gradient(180deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  color: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  box-shadow: ${theme.shadows.lg};
  position: relative;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    width: 100%;
    position: fixed;
    top: 0;
    left: ${props => props.isOpen ? '0' : '-100%'};
    height: 100vh;
    z-index: ${theme.zIndex.modal};
    transition: left 0.3s ease;
    overflow-y: auto;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
`;

const Logo = styled.div`
  color: ${theme.colors.white};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: ${theme.spacing.xl};
  text-align: center;
  position: relative;
  z-index: 20;
`;

const NavItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  color: ${props => props.active ? theme.colors.white : theme.colors.gray300};
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: ${theme.spacing.sm};
  position: relative;
  z-index: 20;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${theme.colors.white};
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: ${theme.spacing.lg};
  overflow-y: auto;
  ${containerAnimation}
  ${respectMotionPreference}
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
    margin-top: 60px; /* Space for mobile header */
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.sm};
  }
`;

const MobileHeader = styled.div`
  display: none;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${theme.spacing.md};
    background: ${theme.colors.white};
    box-shadow: ${theme.shadows.sm};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: ${theme.zIndex.fixed};
    height: 60px;
  }
`;

const MobileMenuButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: ${theme.fontSizes.xl};
  cursor: pointer;
  padding: ${theme.spacing.xs};
  border-radius: ${theme.borderRadius.md};
  
  &:hover {
    background: ${theme.colors.gray100};
  }
`;

const MobileOverlay = styled.div<{ isOpen: boolean }>`
  display: none;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: ${props => props.isOpen ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: ${theme.zIndex.modal - 1};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.xl};
  gap: ${theme.spacing.md};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.lg};
  }
`;

const HeaderTitle = styled.div`
  h1 {
    font-size: ${theme.fontSizes['2xl']};
    font-weight: ${theme.fontWeights.bold};
    color: ${theme.colors.textPrimary};
    margin: 0 0 ${theme.spacing.md} 0;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.lg};
    
    @media (max-width: ${theme.breakpoints.tablet}) {
      font-size: ${theme.fontSizes.xl};
      gap: ${theme.spacing.md};
    }
    
    @media (max-width: ${theme.breakpoints.mobile}) {
      font-size: ${theme.fontSizes.lg};
      flex-direction: column;
      align-items: flex-start;
      gap: ${theme.spacing.sm};
    }
  }
  
  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
    font-size: ${theme.fontSizes.base};
    margin-top: ${theme.spacing.sm};
    
    @media (max-width: ${theme.breakpoints.tablet}) {
      font-size: ${theme.fontSizes.sm};
    }
    
    @media (max-width: ${theme.breakpoints.mobile}) {
      font-size: ${theme.fontSizes.xs};
      margin-top: ${theme.spacing.xs};
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  align-items: center;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.sm};
    width: 100%;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    gap: ${theme.spacing.xs};
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

const StatCard = styled.div<{ variant?: 'primary' | 'secondary' | 'accent' }>`
  background: ${props => {
    switch (props.variant) {
      case 'primary': return `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`;
      case 'secondary': return `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.gray800} 100%)`;
      case 'accent': return `linear-gradient(135deg, ${theme.colors.primaryLight} 0%, ${theme.colors.primary} 100%)`;
      default: return theme.colors.white;
    }
  }};
  color: ${props => props.variant ? theme.colors.white : theme.colors.textPrimary};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.md};
  border: 1px solid ${theme.colors.gray200};
  position: relative;
  overflow: hidden;
  ${staggeredAnimation(0.1)}
  ${respectMotionPreference}
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
  }
`;

const StatValue = styled.div`
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: ${theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  opacity: 0.9;
  margin-bottom: ${theme.spacing.sm};
`;

const StatIcon = styled.div`
  position: absolute;
  top: ${theme.spacing.md};
  right: ${theme.spacing.md};
  font-size: ${theme.fontSizes['2xl']};
  opacity: 0.3;
`;

const AttendanceCard = styled(StatCard)`
  grid-column: span 2;
  
  @media (max-width: 768px) {
    grid-column: span 1;
  }
`;

const AttendanceControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${theme.spacing.lg};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    gap: ${theme.spacing.md};
    align-items: stretch;
    margin-top: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    gap: ${theme.spacing.sm};
    margin-top: ${theme.spacing.sm};
  }
`;

const StatusIndicator = styled.div<{ isCheckedIn: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSizes.base};
  font-weight: ${theme.fontWeights.medium};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${theme.fontSizes.sm};
    gap: ${theme.spacing.xs};
    flex-direction: column;
    text-align: center;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xs};
  }
  
  &::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.isCheckedIn ? '#22c55e' : '#ef4444'};
    
    @media (max-width: ${theme.breakpoints.mobile}) {
      width: 8px;
      height: 8px;
    }
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${theme.spacing.lg};
  
  @media (max-width: ${theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    gap: ${theme.spacing.sm};
  }
`;

const Card = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${theme.colors.gray200};
  ${staggeredAnimation(0.2)}
  ${respectMotionPreference}
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
    border-radius: ${theme.borderRadius.lg};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.sm};
    border-radius: ${theme.borderRadius.md};
  }
`;

const CardTitle = styled.h3`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin: 0 0 ${theme.spacing.lg} 0;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${theme.fontSizes.base};
    margin: 0 0 ${theme.spacing.md} 0;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.sm};
    margin: 0 0 ${theme.spacing.sm} 0;
  }
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const EventItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.backgroundSecondary};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.sm};
  }
`;

const EventInfo = styled.div`
  h4 {
    font-size: ${theme.fontSizes.base};
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
    margin: 0 0 ${theme.spacing.xs} 0;
  }
  
  p {
    font-size: ${theme.fontSizes.sm};
    color: ${theme.colors.textSecondary};
    margin: 0;
  }
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.backgroundSecondary};
`;

const ActivityIcon = styled.div<{ type: 'checkin' | 'checkout' | 'event' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.fontSizes.sm};
  background: ${props => {
    switch (props.type) {
      case 'checkin': return theme.colors.success;
      case 'checkout': return theme.colors.warning;
      case 'event': return theme.colors.primary;
      default: return theme.colors.gray400;
    }
  }};
  color: ${theme.colors.white};
`;

interface StudentDashboardProps {
  onNavigateToProfile?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateToProfile }) => {
  const { user, logout } = useAuth();
  const { events } = useEvent();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [stats, setStats] = useState({
    eventsAttended: 0,
    totalCheckIns: 0,
    currentStreak: 0,
    todayStatus: 'Not Checked In',
    lastCheckIn: null as Date | null
  });
  const [dailyStats, setDailyStats] = useState<DailyAttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    attendanceRate: 0,
    lastAttendanceDate: null,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const dataService = DataService.getInstance();
  const attendanceService = AttendanceService.getInstance();
  const dailyAttendanceService = DailyAttendanceService.getInstance();

  // useEffect hooks will be moved after function declarations

  const checkTodayAttendance = useCallback(async () => {
    if (!user || user.userType !== 'attendee') return;

    try {
      // Use the AttendanceService with daily reset logic
      const attendanceState = await attendanceService.getAttendanceStateWithDayCheck(user.uid);
      
      setCheckedIn(attendanceState.isCheckedIn);
      setCheckInTime(attendanceState.checkInTime);
      setCanCheckIn(attendanceState.canCheckIn);
      setCanCheckOut(attendanceState.canCheckOut);
      
      // Update status text
      if (attendanceState.isNewDay && !attendanceState.isCheckedIn) {
        setStats(prev => ({
          ...prev,
          todayStatus: 'Ready for New Day'
        }));
      } else if (attendanceState.isCheckedIn) {
        setStats(prev => ({
          ...prev,
          todayStatus: 'Checked In',
          lastCheckIn: attendanceState.checkInTime
        }));
      } else if (!attendanceState.canCheckIn) {
        // Already checked out today
        setStats(prev => ({
          ...prev,
          todayStatus: 'Completed for Today'
        }));
      } else {
        setStats(prev => ({
          ...prev,
          todayStatus: 'Not Checked In'
        }));
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  }, [user, attendanceService]);

  const loadStudentData = useCallback(async () => {
    if (!user) return;

    try {
      // Test connection and load stats
      await dataService.testConnection();
      const studentStats = await dataService.getStudentStats(user.uid);
      
      setStats(prevStats => ({
        eventsAttended: studentStats.eventsAttended,
        totalCheckIns: studentStats.totalCheckIns,
        currentStreak: studentStats.currentStreak,
        todayStatus: prevStats.todayStatus, // Keep current status
        lastCheckIn: prevStats.lastCheckIn // Keep current check-in time
      }));

      // Load daily attendance stats
      const dailyStatsData = await dailyAttendanceService.getAttendanceStats(user.uid, 30);
      setDailyStats(dailyStatsData);

      // Load recent attendance activity
      const recentAttendanceActivity = await dailyAttendanceService.getRecentActivity(user.uid, 5);
      setRecentActivity(recentAttendanceActivity.map((activity, index) => ({
        id: `activity_${index}`,
        type: activity.type,
        description: activity.description,
        date: activity.date,
        time: activity.markedAt,
        studentName: user.displayName
      })));

    } catch (error) {
      console.error('Error loading student data:', error);
    }
  }, [user, dataService, dailyAttendanceService]);

  const calculateStreak = (attendanceDocs: any[]): number => {
    // Simple streak calculation - consecutive days with attendance
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < attendanceDocs.length; i++) {
      const attendanceDate = attendanceDocs[i].data().checkInTime?.toDate();
      if (!attendanceDate) break;
      
      const daysDiff = Math.floor((today.getTime() - attendanceDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });
  };

  const handleCheckIn = async () => {
    console.log('handleCheckIn called - user:', !!user, 'canCheckIn:', canCheckIn);
    if (!user) {
      console.error('No user found');
      uniqueToast.error('Please log in first');
      return;
    }
    if (!canCheckIn) {
      console.error('Cannot check in - canCheckIn is false');
      uniqueToast.error('You cannot check in right now');
      return;
    }

    setAttendanceLoading(true);
    try {
      console.log('Starting check-in process for user:', user.uid);
      
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
      const nineAM = 9 * 60; // 9:00 AM in minutes
      
      // Check if checking in after 9 AM
      const isLate = currentTime > nineAM;
      
      uniqueToast.info('Getting your location...', { autoClose: 2000 });
      
      // Get current location
      console.log('Requesting geolocation...');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude, accuracy } = position.coords;
      console.log('Location obtained:', { latitude, longitude, accuracy });
      
      // Use AttendanceService to check in
      console.log('Calling attendanceService.checkIn...');
      uniqueToast.info('Recording your attendance...', { autoClose: 2000 });
      
      const attendanceRecord = await attendanceService.checkIn(user.uid, user.displayName || 'Student', {
        latitude,
        longitude,
        accuracy: accuracy || 0,
        timestamp: position.timestamp
      });
      
      console.log('✅ Attendance recorded successfully:', {
        id: attendanceRecord.id,
        studentId: attendanceRecord.studentId,
        date: attendanceRecord.date,
        checkInTime: attendanceRecord.checkInTime,
        location: attendanceRecord.location.address
      });
      
      // Verify the attendance was recorded by checking if we can retrieve it
      const verifyRecord = await attendanceService.getTodayAttendance(user.uid);
      if (verifyRecord) {
        console.log('✅ Attendance verification successful - record exists in database');
      } else {
        console.warn('⚠️ Attendance verification failed - record not found');
        throw new Error('Failed to verify attendance record');
      }

      // Update local state
      setCheckedIn(true);
      setCheckInTime(now);
      setCanCheckIn(false);
      setCanCheckOut(true);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        todayStatus: 'Checked In',
        lastCheckIn: now,
        totalCheckIns: prev.totalCheckIns + 1
      }));
      
      loadStudentData(); // Refresh other stats
      
      // Show appropriate message based on timing
      if (isLate) {
        const lateMinutes = Math.floor(currentTime - nineAM);
        const hours = Math.floor(lateMinutes / 60);
        const minutes = lateMinutes % 60;
        
        let lateMessage = 'You are late! ';
        if (hours > 0) {
          lateMessage += `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else {
          lateMessage += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        lateMessage += ' after 9:00 AM.';
        
        uniqueToast.warning(lateMessage, { 
          autoClose: 6000,
          position: 'top-center'
        });
      } else {
        uniqueToast.success('Checked in successfully! You are on time.', { autoClose: 3000 });
      }
      
    } catch (error) {
      console.error('Check-in error details:', error);
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (error.message === 'Already checked in today') {
          uniqueToast.warning('You have already checked in today!', { autoClose: 4000 });
          // Refresh state to sync with database
          checkTodayAttendance();
        } else if (error.message.includes('User denied')) {
          uniqueToast.error('Location permission denied. Please allow location access.', { autoClose: 4000 });
        } else if (error.message.includes('timeout')) {
          uniqueToast.error('Location request timed out. Please try again.', { autoClose: 4000 });
        } else {
          uniqueToast.error(`Check-in failed: ${error.message}`, { autoClose: 6000 });
        }
      } else {
        uniqueToast.error('Failed to check in. Please try again.', { autoClose: 4000 });
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleNavClick = (navItem: string) => {
    setActiveNav(navItem);
    setMobileMenuOpen(false); // Close mobile menu when navigating
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const renderCurrentPage = () => {
    switch (activeNav) {
      case 'events':
        return <EventsPage onBack={() => setActiveNav('dashboard')} />;
      case 'attendance':
        return <MyAttendancePage onBack={() => setActiveNav('dashboard')} />;
      case 'schedule':
        return <SchedulePage onBack={() => setActiveNav('dashboard')} />;
      case 'progress':
        return <ProgressPage onBack={() => setActiveNav('dashboard')} />;
      default:
        return null; // Will render the main dashboard
    }
  };

  const handleCheckOut = async () => {
    if (!user || !canCheckOut) return;

    setAttendanceLoading(true);
    try {
      uniqueToast.info('Recording check-out...', { autoClose: 2000 });
      
      // Use AttendanceService to check out
      await attendanceService.checkOut(user.uid);

      // Update local state
      setCheckedIn(false);
      setCheckInTime(null);
      setCanCheckIn(false); // Can't check in again today
      setCanCheckOut(false); // Already checked out
      
      // Update stats
      setStats(prev => ({
        ...prev,
        todayStatus: 'Completed for Today'
      }));
      
      loadStudentData(); // Refresh other stats
      
      uniqueToast.success('Checked out successfully! See you tomorrow.', { autoClose: 3000 });
      
    } catch (error) {
      console.error('Check-out error:', error);
      if (error instanceof Error && error.message === 'Already checked out today') {
        uniqueToast.warning('You have already checked out today!', { autoClose: 4000 });
        // Refresh state to sync with database
        checkTodayAttendance();
      } else if (error instanceof Error && error.message === 'No check-in record found for today') {
        uniqueToast.warning('You need to check in first!', { autoClose: 4000 });
        // Refresh state to sync with database
        checkTodayAttendance();
      } else {
        uniqueToast.error('Failed to check out. Please try again.', { autoClose: 4000 });
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

  // useEffect hooks after function declarations
  useEffect(() => {
    console.log('StudentDashboard useEffect - user:', !!user, user?.uid);
    if (user) {
      loadStudentData();
      checkTodayAttendance();
    }
  }, [user, loadStudentData, checkTodayAttendance]);

  // Debug current state
  useEffect(() => {
    console.log('Current state:', {
      checkedIn,
      canCheckIn,
      canCheckOut,
      checkInTime,
      todayStatus: stats.todayStatus
    });
  }, [checkedIn, canCheckIn, canCheckOut, checkInTime, stats.todayStatus]);

  return (
    <DashboardContainer>
      <MobileHeader>
        <UncommonLogo size="sm" showSubtitle={false} />
        <MobileMenuButton onClick={toggleMobileMenu}>
          ☰
        </MobileMenuButton>
      </MobileHeader>
      
      <MobileOverlay isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />
      
      <Sidebar isOpen={mobileMenuOpen}>
        <StarField density="low" speed="slow" />
        <Logo>
          <DashboardIcon size={24} style={{ marginRight: theme.spacing.sm }} />
          Student Hub
        </Logo>
        
        <NavItem active={activeNav === 'dashboard'} onClick={() => handleNavClick('dashboard')}>
          <DashboardIcon size={20} />
          Dashboard
        </NavItem>
        <NavItem active={activeNav === 'events'} onClick={() => handleNavClick('events')}>
          <EventIcon size={20} />
          Events
        </NavItem>
        <NavItem active={activeNav === 'attendance'} onClick={() => handleNavClick('attendance')}>
          <CheckCircleIcon size={20} />
          My Attendance
        </NavItem>
        <NavItem active={activeNav === 'schedule'} onClick={() => handleNavClick('schedule')}>
          <ScheduleIcon size={20} />
          Schedule
        </NavItem>
        <NavItem active={activeNav === 'progress'} onClick={() => handleNavClick('progress')}>
          <BarChartIcon size={20} />
          Progress
        </NavItem>
        
        <div style={{ marginTop: 'auto', paddingTop: theme.spacing.xl }}>
          {onNavigateToProfile && (
            <NavItem onClick={onNavigateToProfile}>
              <PersonIcon size={20} />
              Profile
            </NavItem>
          )}
          <NavItem onClick={logout}>
            <LogoutIcon size={20} />
            Logout
          </NavItem>
        </div>
      </Sidebar>

      {renderCurrentPage() || (
        <MainContent>
          <Header>
            <HeaderTitle>
              <h1 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: theme.spacing.lg,
                margin: 0 
              }}>
                <UncommonLogo size="lg" showSubtitle={false} />
                <span>Dashboard</span>
              </h1>
              <p>Welcome back, {user?.displayName}!</p>
            </HeaderTitle>
          <HeaderActions>
            <div style={{ 
              color: theme.colors.textSecondary,
              fontSize: theme.fontSizes.sm
            }}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </HeaderActions>
        </Header>

        <StatsGrid>
          <AttendanceCard variant="primary">
            <StatIcon><CheckCircleIcon size={32} /></StatIcon>
            <StatLabel>Daily Attendance</StatLabel>
            <StatusIndicator isCheckedIn={checkedIn}>
              {checkedIn ? 'Checked In' : 'Not Checked In'}
              {checkInTime && (
                <span style={{ fontSize: theme.fontSizes.sm, opacity: 0.8 }}>
                  at {checkInTime.toLocaleTimeString()}
                  {checkInTime.getHours() >= 9 && (
                    <span style={{ 
                      color: '#f59e0b', 
                      fontWeight: theme.fontWeights.medium,
                      marginLeft: theme.spacing.xs 
                    }}>
                      (Late)
                    </span>
                  )}
                </span>
              )}
            </StatusIndicator>
            <AttendanceControls>
              <div style={{ fontSize: theme.fontSizes.sm, opacity: 0.8, display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                <LocationOnIcon size={16} />
                Location will be recorded
              </div>
              {checkedIn && canCheckOut ? (
                <Button 
                  variant="outline" 
                  onClick={handleCheckOut}
                  disabled={attendanceLoading || !canCheckOut}
                >
                  <LogoutIcon size={16} style={{ marginRight: theme.spacing.xs }} />
                  {attendanceLoading ? 'Checking Out...' : 'Check Out'}
                </Button>
              ) : canCheckIn ? (
                <Button 
                  variant="primary"
                  onClick={handleCheckIn}
                  disabled={attendanceLoading || !canCheckIn}
                >
                  <LoginIcon size={16} style={{ marginRight: theme.spacing.xs }} />
                  {attendanceLoading ? 'Checking In...' : 'Check In'}
                </Button>
              ) : (
                <Button 
                  variant="secondary"
                  disabled={true}
                >
                  <CheckCircleIcon size={16} style={{ marginRight: theme.spacing.xs }} />
                  {stats.todayStatus}
                </Button>
              )}
            </AttendanceControls>
          </AttendanceCard>
          
          <StatCard variant="secondary">
            <StatIcon><AssignmentIcon size={32} /></StatIcon>
            <StatValue>{dailyStats.presentDays}/{dailyStats.totalDays}</StatValue>
            <StatLabel>Days Present</StatLabel>
          </StatCard>
          
          <StatCard variant="accent">
            <StatIcon><TrendingUpIcon size={32} /></StatIcon>
            <StatValue>{dailyStats.currentStreak}</StatValue>
            <StatLabel>Current Streak</StatLabel>
          </StatCard>
          
          <StatCard variant="primary">
            <StatIcon><CheckCircleIcon size={32} /></StatIcon>
            <StatValue>{dailyStats.attendanceRate.toFixed(1)}%</StatValue>
            <StatLabel>Attendance Rate</StatLabel>
          </StatCard>
        </StatsGrid>

        <ContentGrid>
          <Card>
            <CardTitle>Available Events</CardTitle>
            <EventsList>
              {events.filter(event => event.isPublic && event.eventStatus === 'published').slice(0, 5).map((event) => (
                <EventItem key={event.id}>
                  <EventInfo>
                    <h4>{event.title}</h4>
                    <p>{new Date(event.startDate).toLocaleDateString()} • {event.location}</p>
                  </EventInfo>
                  <Button size="sm" variant="primary">
                    Register
                  </Button>
                </EventItem>
              ))}
              {events.filter(event => event.isPublic && event.eventStatus === 'published').length === 0 && (
                <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: theme.spacing.lg }}>
                  No events available at the moment
                </p>
              )}
            </EventsList>
          </Card>

          <Card>
            <CardTitle>Attendance Summary</CardTitle>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md 
            }}>
              <div style={{ textAlign: 'center', padding: theme.spacing.sm }}>
                <div style={{ 
                  fontSize: theme.fontSizes.xl, 
                  fontWeight: theme.fontWeights.bold,
                  color: theme.colors.success 
                }}>
                  {dailyStats.longestStreak}
                </div>
                <div style={{ 
                  fontSize: theme.fontSizes.xs, 
                  color: theme.colors.textSecondary 
                }}>
                  Longest Streak
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: theme.spacing.sm }}>
                <div style={{ 
                  fontSize: theme.fontSizes.xl, 
                  fontWeight: theme.fontWeights.bold,
                  color: theme.colors.warning 
                }}>
                  {dailyStats.absentDays}
                </div>
                <div style={{ 
                  fontSize: theme.fontSizes.xs, 
                  color: theme.colors.textSecondary 
                }}>
                  Days Absent
                </div>
              </div>
            </div>
            {dailyStats.lastAttendanceDate && (
              <div style={{ 
                textAlign: 'center', 
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.gray50,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.textSecondary
              }}>
                Last attended: {new Date(dailyStats.lastAttendanceDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardTitle>Recent Attendance</CardTitle>
            <ActivityList>
              {recentActivity.map((activity: any) => (
                <ActivityItem key={activity.id}>
                  <ActivityIcon type={activity.type}>
                    {activity.type === 'present' ? '✅' : activity.type === 'absent' ? '❌' : '📅'}
                  </ActivityIcon>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: theme.fontWeights.medium,
                      color: theme.colors.textPrimary,
                      fontSize: theme.fontSizes.sm
                    }}>
                      {activity.description || 'Attendance Record'}
                    </div>
                    <div style={{ 
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSizes.xs
                    }}>
                      {activity.date ? new Date(activity.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Unknown date'}
                      {activity.time && ` • ${activity.time.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}`}
                    </div>
                  </div>
                </ActivityItem>
              ))}
              {recentActivity.length === 0 && (
                <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: theme.spacing.lg }}>
                  No recent attendance records
                </p>
              )}
            </ActivityList>
          </Card>
        </ContentGrid>
        </MainContent>
      )}
    </DashboardContainer>
  );
};
