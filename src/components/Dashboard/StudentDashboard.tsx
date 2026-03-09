import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
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
import { TimeService } from '../../services/timeService';
import { MyAttendancePage } from '../Student/MyAttendancePage';
import { ProgressPage } from '../Student/ProgressPage';
import { ProfileUpload } from '../Profile/ProfileUpload';
import { ChatWindow } from '../Common/ChatWindow';
import { chatService } from '../../services/chatService';
import { notificationService } from '../../services/notificationService';
import { UncommonLogo } from '../Common/UncommonLogo';
import StarField from '../Common/StarField';
import TimeSyncStatus from '../Common/TimeSyncStatus';
import { uniqueToast } from '../../utils/toastUtils';
import {
  DashboardIcon,
  CheckCircleIcon,
  LogoutIcon,
  LoginIcon,
  BarChartIcon,
  PersonIcon,
} from '../Common/Icons';

const DashboardContainer = styled.div`
  display: flex;
  height: 100vh;
  background: ${theme.colors.backgroundSecondary};
  ${pageTransition}
  ${respectMotionPreference}
  width: 100%;
  overflow: hidden;
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
  }
`;

const Sidebar = styled.aside<{ isOpen: boolean }>`
  width: 280px;
  background: linear-gradient(180deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  color: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  box-shadow: ${theme.shadows.lg};
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1001;
  overflow: hidden;
  -ms-overflow-style: none;
  scrollbar-width: none;
  flex-shrink: 0;
  &::-webkit-scrollbar {
    display: none;
  }
  @media (max-width: ${theme.breakpoints.tablet}) {
    position: fixed;
    top: 0;
    left: ${props => props.isOpen ? '0' : '-100%'};
    height: 100vh;
    z-index: ${theme.zIndex.modal};
    transition: left 0.3s ease;
    width: 100%;
  }
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
  @media (max-width: 420px) {
    padding: ${theme.spacing.sm};
  }
  @media (max-width: 360px) {
    padding: ${theme.spacing.xs};
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
  flex-shrink: 0;
`;

const SidebarContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const SidebarFooter = styled.div`
  flex-shrink: 0;
  margin-top: auto;
  padding-top: ${theme.spacing.xl};
`;

const Badge = styled.div`
  background-color: ${theme.colors.success};
  color: white;
  font-size: 10px;
  font-weight: bold;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  margin-top: 4px;
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
  flex-shrink: 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${theme.colors.white};
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
    z-index: 1000;
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

const MainContent = styled.div`
  flex: 1;
  padding: ${theme.spacing.lg};
  height: 100vh;
  height: 100svh; /* Modern mobile browsers */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
  padding-top: 60px;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  ${containerAnimation}
  ${respectMotionPreference}
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
    padding-top: 70px;
    margin-left: 0;
    height: calc(100vh - 60px);
    height: calc(100svh - 60px);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 20;
  position: relative;
  margin-bottom: ${theme.spacing.xl};
  gap: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.lg};
  }

  @media (max-width: 420px) {
    margin-bottom: ${theme.spacing.lg};
    gap: ${theme.spacing.md};
  }

  @media (max-width: 360px) {
    margin-bottom: ${theme.spacing.md};
    gap: ${theme.spacing.sm};
  }
`;

const HeaderTitle = styled.div`
  flex: 1;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
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

const StatChange = styled.div<{ positive?: boolean }>`
  font-size: ${theme.fontSizes.xs};
  color: ${({ positive }) => positive ? theme.colors.success : theme.colors.error};
  margin-top: ${theme.spacing.xs};
  font-weight: ${theme.fontWeights.medium};
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
  color: ${theme.colors.white};
  
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

const ActivityIcon = styled.div<{ type: 'checkin' | 'checkout' | 'evt' }>`
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
      case 'evt': return theme.colors.primary;
      default: return theme.colors.gray400;
    }
  }};
  color: ${theme.colors.white};
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.white};
  font-weight: ${theme.fontWeights.medium};
  font-size: ${theme.fontSizes.sm};
`;

const AttendanceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const AttendanceItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.backgroundSecondary};
`;

interface StudentDashboardProps {
  onNavigateToProfile?: () => void;
}

export function StudentDashboard({ onNavigateToProfile }: StudentDashboardProps): React.ReactElement {
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [stats, setStats] = useState({
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [daysPresent, setDaysPresent] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [statsRange, setStatsRange] = useState<'week' | 'month' | 'custom'>('month');
  const [customDays, setCustomDays] = useState(7);

  const dataService = DataService.getInstance();
  const attendanceService = AttendanceService.getInstance();
  const dailyAttendanceService = DailyAttendanceService.getInstance();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const checkTodayAttendance = useCallback(async () => {
    if (!user) return;
    
    // Debug: Log the user type
    console.log('checkTodayAttendance - user.userType:', user.userType, 'user.email:', user.email);
    
    if (user.userType !== 'attendee') {
      // Allow check-in for users without explicit attendee type (fix for Google login users)
      // Only block for explicit admin/instructor roles
      if (user.userType === 'admin' || user.userType === 'instructor') {
        console.log('User is not an attendee, skipping attendance check');
        return;
      }
      // For undefined/null userType, default to allowing attendance (treat as attendee)
      console.log('User type not set, defaulting to attendee for attendance');
    }

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
      console.error('Error checking today attendance:', error);
      uniqueToast.error('Failed to load today\'s attendance status.', {
        autoClose: 4000,
        position: 'top-center',
      });
    }
  }, [user, attendanceService]);

  const loadStudentData = useCallback(async () => {
    if (!user) return;

    try {
      // Test connection and load stats
      await dataService.testConnection();
      const studentStats = await dataService.getStudentStats(user.uid);
      
      setStats(prevStats => ({
        totalCheckIns: studentStats.totalCheckIns,
        currentStreak: studentStats.currentStreak,
        todayStatus: prevStats.todayStatus,
        lastCheckIn: prevStats.lastCheckIn
      }));

      const dailyStatsData = await dailyAttendanceService.getAttendanceStats(user.uid, 30);
      setDailyStats(dailyStatsData);

      // Load recent attendance activity
      const recentAttendanceActivity = await dailyAttendanceService.getRecentActivity(user.uid, 5);
      setRecentActivity(recentAttendanceActivity.map((activity, index) => ({
        id: `activity_${index}`,
        type: activity.type,
        description: activity.description,
        date: activity.date,
        time: activity.markedAt as Date | undefined,
        studentName: user.displayName,
      })));

      // Load all staff (admins and instructors) for chat
      const allStaff = await chatService.getAllStaff();
      setAdmins(allStaff);
      if (allStaff.length > 0 && !selectedAdmin) {
        setSelectedAdmin(allStaff[0]);
      }

    } catch (error) {
      console.error('Error loading student data:', error);
      // Suppress user-facing toast for dashboard load failures so UI isn't noisy.
      // DataService already falls back to mock data when Firebase is unavailable.
    }
  }, [user, dataService, dailyAttendanceService]);

  const handleCheckInInternal = async (isAutomatic: boolean = false) => {
    console.log('handleCheckInInternal called - user:', !!user, 'canCheckIn:', canCheckIn, 'isAutomatic:', isAutomatic);

    if (!user) {
      uniqueToast.error('You must be logged in to check in.', {
        autoClose: 4000,
        position: 'top-center',
      });
      return;
    }

    if (!canCheckIn) {
      uniqueToast.info('You cannot check in right now. Please try again or refresh the page.', {
        autoClose: 4000,
        position: 'top-center',
      });
      return;
    }

    setAttendanceLoading(true);
    try {
      // Simplified location data for record keeping only
      const location = {
        timestamp: Date.now(),
        ip: '0.0.0.0', // We can still try to get IP but it won't block
        status: 'recorded'
      };

      try {
        const ipServices = [
          'https://api.ipify.org?format=json',
          'https://api64.ipify.org?format=json'
        ];

        for (const service of ipServices) {
          try {
            const ipResponse = await fetch(service, { signal: AbortSignal.timeout(3000) });
            if (ipResponse.ok) {
              const ipData = await ipResponse.json();
              location.ip = ipData.ip || ipData.query || location.ip;
              break;
            }
          } catch (e) {
            // Silently continue
          }
        }
      } catch (err) {
        // IP failure is fine
      }
      
      const now = new Date();
      const timeService = TimeService.getInstance();
      const harareNow = timeService.getCurrentTime();
      const currentTime = harareNow.getHours() * 60 + harareNow.getMinutes();
      const nineAM = 9 * 60;
      const isLate = currentTime > nineAM;
      
      let attendanceRecord;
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          attendanceRecord = await attendanceService.checkIn(user.uid, user.displayName || 'Student', location);
          break;
        } catch (err: any) {
          if (err.message === 'Already checked in today' || retries === maxRetries) throw err;
          retries++;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      if (!attendanceRecord) throw new Error('Check-in failed');
      
      setCheckedIn(true);
      setCheckInTime(now);
      setCanCheckIn(false);
      setCanCheckOut(true);
      
      setStats(prev => ({
        ...prev,
        todayStatus: isLate ? 'Checked In (Late)' : 'Checked In',
        lastCheckIn: now,
      }));

      loadStudentData().catch(e => console.error('Background load failed:', e));

      if (isLate) {
        uniqueToast.warning('Checked in (Late). Recorded after 9:00 AM.', {
          autoClose: 6000,
          position: 'top-center',
        });
      } else {
        uniqueToast.success(isAutomatic ? 'Auto check-in successful!' : 'Checked in successfully!', {
          autoClose: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      if (error instanceof Error && error.message === 'Already checked in today') {
        uniqueToast.info('You have already checked in today.', {
          autoClose: 4000,
          position: 'top-center',
        });
        checkTodayAttendance();
      } else {
        uniqueToast.error('Failed to check in. Please try again.', {
          autoClose: 4000,
          position: 'top-center',
        });
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
      case 'attendance':
        return <MainContent><MyAttendancePage onBack={() => setActiveNav('dashboard')} isEmbedded={true} /></MainContent>;
      case 'chat':
        return (
          <MainContent>
            <h2 style={{ marginBottom: theme.spacing.lg, color: theme.colors.textPrimary }}>Messages</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '320px 1fr', 
              gap: theme.spacing.lg, 
              height: 'calc(100vh - 200px)',
              overflow: 'hidden'
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: theme.spacing.md,
                height: '100%',
                overflow: 'hidden'
              }}>
                <Card style={{ 
                  flex: 1, 
                  padding: theme.spacing.sm,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}>
                    <AttendanceList>
                      {admins.map((admin) => (
                        <AttendanceItem 
                          key={admin.uid}
                          onClick={() => setSelectedAdmin(admin)}
                          style={{ 
                            cursor: 'pointer', 
                            transition: 'all 0.2s',
                            background: selectedAdmin?.uid === admin.uid ? 'rgba(6, 71, 161, 0.1)' : 'transparent',
                            borderLeft: selectedAdmin?.uid === admin.uid ? `4px solid ${theme.colors.primary}` : '4px solid transparent',
                            padding: theme.spacing.md
                          }}
                        >
                          <UserAvatar>
                            {admin.photoUrl ? (
                              <img 
                                src={admin.photoUrl} 
                                alt="" 
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                              />
                            ) : (
                              getInitials(admin.displayName || 'Admin')
                            )}
                          </UserAvatar>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: theme.fontWeights.semibold, color: theme.colors.textPrimary, fontSize: theme.fontSizes.sm }}>
                              {admin.displayName || 'Admin'}
                            </div>
                            <div style={{ 
                              fontSize: theme.fontSizes.xs, 
                              color: theme.colors.textSecondary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              Chat with {admin.displayName || 'Admin'}
                            </div>
                          </div>
                        </AttendanceItem>
                      ))}
                    </AttendanceList>
                  </div>
                </Card>
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                overflow: 'hidden'
              }}>
                <h3 style={{ color: theme.colors.textPrimary, margin: `0 0 ${theme.spacing.md} 0` }}>
                  {selectedAdmin ? `Chat with ${selectedAdmin.displayName}` : 'Select an Admin'}
                </h3>
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {selectedAdmin && (
                    <ChatWindow 
                      studentId={user?.uid || ''} 
                      studentName={user?.displayName || 'Student'} 
                      currentUserUid={user?.uid || ''}
                      studentPhotoUrl={user?.photoUrl}
                      currentUserPhotoUrl={user?.photoUrl}
                      adminUid={selectedAdmin.uid}
                      adminPhotoUrl={selectedAdmin.photoUrl}
                      adminName={selectedAdmin.displayName}
                    />
                  )}
                </div>
              </div>
            </div>
          </MainContent>
        );
      case 'progress':
        return <MainContent><ProgressPage onBack={() => setActiveNav('dashboard')} isEmbedded={true} /></MainContent>;
      case 'profile':
        return <MainContent><ProfileUpload /></MainContent>;
      default:
        return null; // Will render the main dashboard
    }
  };


  useEffect(() => {
    console.log('StudentDashboard useEffect - user:', !!user, user?.uid);
    if (user) {
      // Request notification permission
      notificationService.requestPermission();

      loadStudentData();
      checkTodayAttendance();

      // Subscribe to this student's specific conversations
      const unsubscribe = chatService.subscribeToConversationsByStudent(user.uid, async (conversations) => {
        // Mark selected conversation as read if it has unread messages
        if (selectedAdmin) {
          const currentConv = conversations.find(c => c.id === `${user.uid}_${selectedAdmin.uid}`);
          if (currentConv && currentConv.unreadCount && currentConv.unreadCount > 0) {
            await chatService.markAsRead(currentConv.id!);
          }
        }

        // Find if any conversation has a new unread message where the student is NOT the sender
        const prevTotal = unreadCount;
        const newTotal = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

        if (newTotal > prevTotal) {
          // Find the specific conversation that got a new message
          const newMsgConv = conversations.find(c => {
            const prevConv = admins.find(a => `${user.uid}_${a.uid}` === c.id);
            // Only notify if unreadCount increased AND we are NOT the sender
            return (c.unreadCount || 0) > (prevConv?.unreadCount || 0) && c.lastSenderId !== user.uid;
          });

          if (newMsgConv) {
            // Play notification sound
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audio.play().catch(e => console.log('Audio play failed:', e));

            // Show toast notification
            uniqueToast.info(`New message from ${newMsgConv.adminName || 'Admin'}: ${newMsgConv.lastMessage}`, {
              position: 'top-right',
              autoClose: 5000
            });

            // Send system push notification
            notificationService.sendNotification(
              `New Message from ${newMsgConv.adminName || 'Admin'}`,
              newMsgConv.lastMessage
            );
          }
        }
        setUnreadCount(newTotal);
      });

      return () => unsubscribe();
    }
  }, [user, loadStudentData, checkTodayAttendance]);

  // Calculate total school days (Mon-Fri) in current month
  const getTotalSchoolDaysInMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    let total = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const weekday = d.getDay();
      if (weekday !== 0 && weekday !== 6) total++; // Exclude weekends
    }
    return total;
  };

  // Attendance stats from Firebase
  // (Moved up)
  const totalSchoolDays = getTotalSchoolDaysInMonth();

  // Fetch attendance stats from Firebase for selected range
  const fetchAttendanceStats = useCallback(async () => {
    if (!user) return;
    const dailyAttendanceService = DailyAttendanceService.getInstance();
    let daysToCheck = 30;
    if (statsRange === 'week') daysToCheck = 7;
    else if (statsRange === 'month') daysToCheck = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    else if (statsRange === 'custom') daysToCheck = customDays;
    const stats = await dailyAttendanceService.getAttendanceStats(user.uid, daysToCheck);
    setDaysPresent(stats.presentDays);
    setAttendanceRate(Math.round(stats.attendanceRate));
  }, [user, statsRange, customDays]);

  useEffect(() => {
    fetchAttendanceStats();
  }, [fetchAttendanceStats]);

  // Update stats after check-in
  const handleCheckIn = async () => {
    await handleCheckInInternal(false);
    await fetchAttendanceStats();
  };

  // Optionally update on check-out if needed
  const handleCheckOut = async () => {
    if (!user || !canCheckOut) return;
    setAttendanceLoading(true);
    try {
      uniqueToast.info('Recording check-out...', { autoClose: 2000, position: 'top-center' });

      // Simplified location data
      const location = {
        timestamp: Date.now(),
        ip: '0.0.0.0',
        status: 'recorded'
      };

      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          location.ip = ipData.ip || location.ip;
        }
      } catch (e) {
        // Silently continue
      }

      await attendanceService.checkOut(user.uid, location);
      setCheckedIn(false);
      setCheckInTime(null);
      setCanCheckIn(false);
      setCanCheckOut(false);
      setStats(prev => ({ ...prev, todayStatus: 'Completed for Today' }));
      await loadStudentData();
      await fetchAttendanceStats();
      uniqueToast.success('Checked out successfully! See you tomorrow.', { autoClose: 3000, position: 'top-center' });
    } catch (error) {
      console.error('Check-out error:', error);
      if (error instanceof Error) {
        if (error.message === 'Already checked out today') {
          uniqueToast.info('You have already checked out today!', { autoClose: 4000, position: 'top-center' });
          checkTodayAttendance();
        } else if (error.message === 'No check-in record found for today') {
          uniqueToast.warning('You need to check in first!', { autoClose: 4000, position: 'top-center' });
          checkTodayAttendance();
        } else {
          uniqueToast.error('Failed to check out. Please try again.', { autoClose: 4000, position: 'top-center' });
        }
      } else {
        uniqueToast.error('Failed to check out. Please try again.', { autoClose: 4000, position: 'top-center' });
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

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
          <img src="/shapes.svg" alt="Logo" style={{ width: 24, height: 24, marginRight: theme.spacing.sm }} />
          Student Hub
        </Logo>

        <SidebarContent>
          <NavItem active={activeNav === 'dashboard'} onClick={() => handleNavClick('dashboard')}>
            <DashboardIcon size={20} />
            Dashboard
          </NavItem>
          <NavItem active={activeNav === 'attendance'} onClick={() => handleNavClick('attendance')}>
            <CheckCircleIcon size={20} />
            Attendance
          </NavItem>
          <NavItem 
            active={activeNav === 'chat'} 
            onClick={async () => {
              handleNavClick('chat');
              if (unreadCount > 0 && user) {
                try {
                  await chatService.markAsRead(user.uid);
                } catch (error) {
                  console.error('Failed to mark as read:', error);
                }
              }
            }}
          >
            <PersonIcon size={20} />
            Chat with Admin
            {unreadCount > 0 && <Badge style={{ marginLeft: 'auto' }}>{unreadCount}</Badge>}
          </NavItem>
          <NavItem active={activeNav === 'progress'} onClick={() => handleNavClick('progress')}>
            <BarChartIcon size={20} />
            Progress
          </NavItem>
          <NavItem active={activeNav === 'profile'} onClick={() => handleNavClick('profile')}>
            <PersonIcon size={20} />
            Profile
          </NavItem>
        </SidebarContent>

        <SidebarFooter>
          <NavItem onClick={logout}>
            <LogoutIcon size={20} />
            Logout
          </NavItem>
        </SidebarFooter>
      </Sidebar>

      {renderCurrentPage() || (
        <MainContent>
          <Header>
            <HeaderTitle>
              <h1
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.lg,
                  margin: 0,
                }}
              >
                <UncommonLogo size="lg" showSubtitle={false} />
                <span>Dashboard</span>
              </h1>
              <p>Welcome back, {user?.displayName}!</p>
            </HeaderTitle>
            <HeaderActions>
              <TimeSyncStatus />
              <div
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSizes.sm,
                }}
              >
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </HeaderActions>
          </Header>

          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
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
            <AttendanceCard variant="primary">
              <StatIcon>
                <CheckCircleIcon size={32} />
              </StatIcon>
              <StatLabel>Daily Attendance</StatLabel>
              <StatusIndicator isCheckedIn={checkedIn}>
                {checkedIn ? 'Checked In' : 'Not Checked In'}
                {checkInTime && (
                  <span style={{ fontSize: theme.fontSizes.sm, opacity: 0.8 }}>
                    at {checkInTime.toLocaleTimeString()}
                    {checkInTime.getHours() >= 9 && (
                      <span
                        style={{
                          color: '#f59e0b',
                          fontWeight: theme.fontWeights.medium,
                          marginLeft: theme.spacing.xs,
                        }}
                      >
                        (Late)
                      </span>
                    )}
                  </span>
                )}
              </StatusIndicator>
              <AttendanceControls>
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
                  <Button variant="secondary" disabled>
                    <CheckCircleIcon size={16} style={{ marginRight: theme.spacing.xs }} />
                    {stats.todayStatus}
                  </Button>
                )}
              </AttendanceControls>
              <StatValue>
                {daysPresent}/{totalSchoolDays}
              </StatValue>
              <StatLabel>Days Present</StatLabel>
              <StatChange positive>
                Attendance Rate: {attendanceRate}%
              </StatChange>
            </AttendanceCard>
          </StatsGrid>

          <ContentGrid>
            <Card>
              <CardTitle>Attendance Summary</CardTitle>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                }}
              >
                <div style={{ textAlign: 'center', padding: theme.spacing.sm }}>
                  <div
                    style={{
                      fontSize: theme.fontSizes.xl,
                      fontWeight: theme.fontWeights.bold,
                      color: theme.colors.success,
                    }}
                  >
                    {dailyStats.longestStreak}
                  </div>
                  <div
                    style={{
                      fontSize: theme.fontSizes.xs,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Longest Streak
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: theme.spacing.sm }}>
                  <div
                    style={{
                      fontSize: theme.fontSizes.xl,
                      fontWeight: theme.fontWeights.bold,
                      color: theme.colors.warning,
                    }}
                  >
                    {dailyStats.absentDays}
                  </div>
                  <div
                    style={{
                      fontSize: theme.fontSizes.xs,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Days Absent
                  </div>
                </div>
              </div>
              {dailyStats.lastAttendanceDate && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.gray50,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.textSecondary,
                  }}
                >
                  Last attended:{' '}
                  {new Date(dailyStats.lastAttendanceDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
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
                      {activity.type === 'present'
                        ? '✅'
                        : activity.type === 'absent'
                        ? '❌'
                        : '📅'}
                    </ActivityIcon>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: theme.fontWeights.medium,
                          color: theme.colors.textPrimary,
                          fontSize: theme.fontSizes.sm,
                        }}
                      >
                        {activity.description || 'Attendance Record'}
                      </div>
                      <div
                        style={{
                          color: theme.colors.textSecondary,
                          fontSize: theme.fontSizes.xs,
                        }}
                      >
                        {activity.date
                          ? new Date(activity.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Unknown date'}
                        {activity.time &&
                          ` • ${activity.time.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`}
                      </div>
                    </div>
                  </ActivityItem>
                ))}
                {recentActivity.length === 0 && (
                  <p
                    style={{
                      color: theme.colors.textSecondary,
                      textAlign: 'center',
                      padding: theme.spacing.lg,
                    }}
                  >
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
