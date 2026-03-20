import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { theme } from '../../styles/theme';
import { 
  staggeredAnimation, 
  pageTransition, 
  containerAnimation,
  respectMotionPreference 
} from '../../styles/animations';
import { AttendanceService } from '../../services/attendanceService';
import { TimeService } from '../../services/timeService';
import { qrCodeService, DailyQRCode } from '../../services/qrCodeService';

import { UncommonLogo } from '../Common/UncommonLogo';
import StarField from '../Common/StarField';
import TimeSyncStatus from '../Common/TimeSyncStatus';
import { uniqueToast } from '../../utils/toastUtils';
import { StudentAttendanceAnalytics } from '../Analytics/StudentAttendanceAnalytics';
import { StudentProfile } from '../Profile/StudentProfile';
import { 
  FiLogOut, 
  FiUser, 
  FiBarChart2, 
  FiCheckCircle, 
  FiBarChart,
  FiCamera,
  FiX
} from 'react-icons/fi';
import { Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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

const Sidebar = styled.aside<{ $isOpen: boolean }>`
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
    left: ${props => props.$isOpen ? '0' : '-100%'};
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

const MobileOverlay = styled.div<{ $isOpen: boolean }>`
  display: none;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: ${props => props.$isOpen ? 'block' : 'none'};
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
  padding: 0;
  height: 100vh;
  height: 100svh; /* Modern mobile browsers */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
  padding-top: 80px; /* Increased to align with sidebar top */
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  gap: 0;
  ${containerAnimation}
  ${respectMotionPreference}
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: 0;
    padding-top: 70px;
    margin-left: 0;
    height: calc(100vh - 60px);
    height: calc(100svh - 60px);
    gap: 0;
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

const AttendanceCard = styled(StatCard)`
  grid-column: span 2;
  
  @media (max-width: 768px) {
    grid-column: span 1;
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

interface StudentDashboardProps {
  onNavigateToProfile?: () => void;
}

export const StudentDashboard = ({ onNavigateToProfile }: StudentDashboardProps): React.ReactElement => {
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
  const [showScanner, setShowScanner] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [isVerifyingQR, setIsVerifyingQR] = useState(false);
  const [dailyQRCode, setDailyQRCode] = useState<string | null>(null);
  const attendanceService = AttendanceService.getInstance();

  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = qrCodeService.subscribeToDailyCode((qrData: DailyQRCode | null) => {
      if (qrData) {
        setDailyQRCode(qrData.code);
        // Auto-fill the input field if it's empty
        if (!qrCodeInput && qrData.code) {
          setQrCodeInput(qrData.code);
        }
      } else {
        setDailyQRCode(null);
      }
    });
    
    return () => unsubscribe();
  }, [user]);

  const handleCopyCode = () => {
    if (dailyQRCode) {
      navigator.clipboard.writeText(dailyQRCode);
      uniqueToast.success('Check-in code copied to clipboard!');
      setQrCodeInput(dailyQRCode);
    }
  };

  const checkTodayAttendance = useCallback(async () => {
    if (!user) return;
    
    try {
      const attendanceState = await attendanceService.getAttendanceStateWithDayCheck(user.uid);
      
      setCheckedIn(attendanceState.isCheckedIn);
      setCheckInTime(attendanceState.checkInTime);
      setCanCheckIn(attendanceState.canCheckIn);
      setCanCheckOut(attendanceState.canCheckOut);
      
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
      if (!qrCodeInput) {
        uniqueToast.error('Please enter the daily check-in code');
        return;
      }

      setIsVerifyingQR(true);
      const isValid = await qrCodeService.validateCode(qrCodeInput);
      if (!isValid) {
        uniqueToast.error('Invalid check-in code. Please ask your instructor for the current code.');
        setIsVerifyingQR(false);
        return;
      }

      let location: any = { ip: '0.0.0.0', timestamp: Date.now() };
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          location = { ...location, ip: ipData.ip || location.ip };
        }
      } catch (e) {
        // Ignore IP failures
      }
      
      const now = new Date();
      const timeService = TimeService.getInstance();
      const harareNow = timeService.getCurrentTime();
      const currentTime = harareNow.getHours() * 60 + harareNow.getMinutes(); // Convert to minutes
      const nineAM = 9 * 60; // 9:00 AM in minutes
      
      const isLate = currentTime > nineAM;
      
      let attendanceRecord;
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          attendanceRecord = await attendanceService.checkIn(user.uid, user.displayName || 'Student', qrCodeInput, location);
          break; // Success
        } catch (err: any) {
          if (err.message === 'Already checked in today' || retries === maxRetries) throw err;
          retries++;
          console.warn(`Retry check-in ${retries}/${maxRetries}...`);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      if (!attendanceRecord) throw new Error('Check-in failed after retries');
      
      console.log('✅ Attendance recorded successfully:', {
        id: attendanceRecord.id,
        studentId: attendanceRecord.studentId,
        date: attendanceRecord.date,
        checkInTime: attendanceRecord.checkInTime,
        location: attendanceRecord.location?.address || 'No location'
      });
      
      setCheckedIn(true);
      setCheckInTime(now);
      setCanCheckIn(false);
      setCanCheckOut(true);
      
      setStats(prev => ({
        ...prev,
        todayStatus: isLate ? 'Checked In (Late)' : 'Checked In',
        lastCheckIn: now,
      }));

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

      const errAny = error as any;
      const errorMessage = (errAny?.message as string | undefined) || (error instanceof Error ? error.message : undefined) || 'Unknown error';
      const errorCode = errAny?.code as string | undefined;

      if (errorMessage === 'Already checked in today') {
          uniqueToast.info('You have already checked in today.', {
            autoClose: 4000,
            position: 'top-center',
          });
          checkTodayAttendance();
      } else {
        uniqueToast.error(`Failed to check in: ${errorCode ? `${errorCode} - ` : ''}${errorMessage}`, {
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
      case 'analytics':
        return (
          <div style={{ padding: theme.spacing.lg }}>
            <h2 style={{ marginBottom: theme.spacing.lg, color: theme.colors.textPrimary }}>My Analytics</h2>
            <StudentAttendanceAnalytics studentId={user?.uid || ''} />
          </div>
        );
      case 'profile':
        return (
          <div style={{ padding: 0 }}>
            <StudentProfile />
          </div>
        );
      default:
        return null; // Will render the main dashboard
    }
  };

  useEffect(() => {
    console.log('StudentDashboard useEffect - user:', !!user, user?.uid);
    if (user) {
      checkTodayAttendance();
    }
  }, [user, checkTodayAttendance]);

  const handleCheckIn = async () => {
    await handleCheckInInternal(false);
  };

  const handleCheckOut = async () => {
    if (!user || !canCheckOut) return;
    setAttendanceLoading(true);
    try {
      uniqueToast.info('Recording check-out...', { autoClose: 2000, position: 'top-center' });

      let location: any = { ip: '0.0.0.0', timestamp: Date.now() };
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          location = { ...location, ip: ipData.ip || location.ip };
        }
      } catch (e) {
        // Ignore IP failures
      }

      await attendanceService.checkOut(user.uid, location);
      setCheckedIn(false);
      setCheckInTime(null);
      setCanCheckIn(false);
      setCanCheckOut(false);
      setStats(prev => ({ ...prev, todayStatus: 'Completed for Today' }));
      uniqueToast.success('Checked out successfully! See you tomorrow.', { autoClose: 3000, position: 'top-center' });
    } catch (error) {
      console.error('Check-out error:', error);

      const errAny = error as any;
      const errorMessage = (errAny?.message as string | undefined) || (error instanceof Error ? error.message : undefined) || 'Unknown error';
      const errorCode = errAny?.code as string | undefined;

      if (errorMessage === 'Already checked out today') {
          uniqueToast.info('You have already checked out today!', { autoClose: 4000, position: 'top-center' });
          checkTodayAttendance();
      } else if (errorMessage === 'No check-in record found for today') {
          uniqueToast.warning('You need to check in first!', { autoClose: 4000, position: 'top-center' });
          checkTodayAttendance();
      } else {
        uniqueToast.error(`Failed to check out: ${errorCode ? `${errorCode} - ` : ''}${errorMessage}`, { autoClose: 4000, position: 'top-center' });
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

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

      <MobileOverlay $isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />

      <Sidebar $isOpen={mobileMenuOpen}>
        <StarField density="low" speed="slow" />
        <Logo>
          <UncommonLogo size="sm" showSubtitle={false} />
        </Logo>
        <SidebarContent>
          <NavItem active={activeNav === 'dashboard'} onClick={() => handleNavClick('dashboard')}>
            <FiBarChart2 size={20} />
            Dashboard
          </NavItem>
          <NavItem active={activeNav === 'analytics'} onClick={() => handleNavClick('analytics')}>
            <FiBarChart size={20} />
            My Analytics
          </NavItem>
          <NavItem active={activeNav === 'profile'} onClick={() => handleNavClick('profile')}>
            <FiUser size={20} />
            My Profile
          </NavItem>
        </SidebarContent>
        <SidebarFooter>
          <NavItem onClick={logout}>
            <FiLogOut size={20} />
            Logout
          </NavItem>
        </SidebarFooter>
      </Sidebar>

      <MainContent style={{ padding: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNav}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {renderCurrentPage() || (
          <div style={{ padding: 0 }}>
          <Header style={{ padding: theme.spacing.lg }}>
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
                <span>Student Dashboard</span>
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

          <StatsGrid style={{ padding: theme.spacing.lg }}>
            <AttendanceCard variant="primary">
              <div style={{ fontSize: theme.fontSizes.sm, opacity: 0.9, marginBottom: theme.spacing.sm }}>Daily Attendance</div>
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
              
              {!checkedIn && dailyQRCode && (
                <div style={{ 
                  marginTop: theme.spacing.lg, 
                  padding: theme.spacing.md,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: theme.borderRadius.lg,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: theme.spacing.md
                }}>
                  <div style={{ color: theme.colors.white, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium }}>
                    Today's Check-in QR Code
                  </div>
                  <div style={{ 
                    background: 'white', 
                    padding: theme.spacing.sm, 
                    borderRadius: theme.borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <QRCodeSVG value={dailyQRCode} size={150} level="H" />
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: theme.spacing.sm,
                    width: '100%' 
                  }}>
                    <code style={{ 
                      flex: 1,
                      background: 'rgba(0,0,0,0.2)', 
                      padding: theme.spacing.sm, 
                      borderRadius: theme.borderRadius.sm,
                      textAlign: 'center',
                      fontSize: theme.fontSizes.lg,
                      letterSpacing: '2px',
                      color: theme.colors.white
                    }}>
                      {dailyQRCode}
                    </code>
                    <Button 
                      variant="outline" 
                      onClick={handleCopyCode}
                      style={{ padding: theme.spacing.sm, minWidth: 'auto', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                    >
                      <Copy size={20} />
                    </Button>
                  </div>
                  <p style={{ fontSize: '11px', opacity: 0.7, textAlign: 'center', margin: 0 }}>
                    Copy this code and paste it below to check in
                  </p>
                </div>
              )}
              
              {!checkedIn && showScanner && (
                <div style={{ marginTop: theme.spacing.md, width: '100%' }}>
                  <input
                    type="text"
                    placeholder="Enter Daily Code"
                    value={qrCodeInput}
                    onChange={(e) => setQrCodeInput(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.gray300}`,
                      marginBottom: theme.spacing.sm,
                      textAlign: 'center',
                      fontSize: theme.fontSizes.lg,
                      letterSpacing: '4px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <Button 
                      variant="primary" 
                      onClick={handleCheckIn}
                      disabled={attendanceLoading || isVerifyingQR || !qrCodeInput}
                      style={{ flex: 1 }}
                    >
                      Verify & Check In
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { setShowScanner(false); setQrCodeInput(''); }}
                      style={{ padding: theme.spacing.sm }}
                    >
                      <FiX size={20} />
                    </Button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: theme.spacing.lg }}>
                {checkedIn ? (
                  <Button 
                    variant="outline" 
                    onClick={handleCheckOut}
                    disabled={attendanceLoading || !canCheckOut}
                  >
                    <FiLogOut size={16} style={{ marginRight: theme.spacing.xs }} />
                    {attendanceLoading ? 'Checking Out...' : 'Check Out'}
                  </Button>
                ) : canCheckIn ? (
                  !showScanner ? (
                    <Button 
                      variant="primary" 
                      onClick={() => setShowScanner(true)}
                      disabled={attendanceLoading}
                    >
                      <FiCamera size={16} style={{ marginRight: theme.spacing.xs }} />
                      Check In with Code
                    </Button>
                  ) : null
                ) : (
                  <Button variant="secondary" disabled>
                    <FiCheckCircle size={16} style={{ marginRight: theme.spacing.xs }} />
                    {stats.todayStatus}
                  </Button>
                )}
              </div>
            </AttendanceCard>
          </StatsGrid>



        </div>
            )}
          </motion.div>
        </AnimatePresence>
      </MainContent>
    </DashboardContainer>
  );
};
