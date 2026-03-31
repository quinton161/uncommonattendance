import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { theme } from '../../styles/theme';
import { 
  pageTransition, 
  containerAnimation,
  respectMotionPreference 
} from '../../styles/animations';
import { AttendanceService } from '../../services/attendanceService';
import { TimeService } from '../../services/timeService';
import { qrCodeService, DailyQRCode } from '../../services/qrCodeService';

import { UncommonLogo } from '../Common/UncommonLogo';
import { Sidebar } from '../Common/Sidebar';
import TimeSyncStatus from '../Common/TimeSyncStatus';
import { uniqueToast } from '../../utils/toastUtils';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { StudentAttendanceAnalytics } from '../Analytics/StudentAttendanceAnalytics';
import { StudentProfile } from '../Profile/StudentProfile';
import DataService from '../../services/DataService';
import { 
  FiCamera,
  FiX,
  FiMenu,
  FiLogOut,
  FiCheckCircle,
  FiLayers,
  FiClock,
  FiInfo,
  FiTrendingUp,
  FiCalendar
} from 'react-icons/fi';
import { Copy, ScanLine } from 'lucide-react';
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
    padding-top: calc(60px + env(safe-area-inset-top, 0px));
  }
`;

const MobileSidebar = styled.aside<{ $isOpen: boolean }>`
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

const SidebarNav = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
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
    box-sizing: border-box;
    height: calc(60px + env(safe-area-inset-top, 0px));
    padding: ${theme.spacing.md};
    padding-top: env(safe-area-inset-top, 0px);
    padding-left: max(${theme.spacing.md}, env(safe-area-inset-left, 0px));
    padding-right: max(${theme.spacing.md}, env(safe-area-inset-right, 0px));
    background: ${theme.colors.white};
    box-shadow: ${theme.shadows.sm};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
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
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-left: 72px;
  ${containerAnimation}
  ${respectMotionPreference}
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex: 1;
    min-height: 0;
    padding: 0;
    padding-top: ${theme.spacing.md};
    padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px) + ${theme.spacing.lg});
    margin-left: 0;
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

const DashboardPage = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  padding: ${theme.spacing.lg} ${theme.spacing.xl} ${theme.spacing['2xl']};
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
`;

const Tagline = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.base};
  margin: ${theme.spacing.sm} 0 0;
  max-width: 40rem;
  line-height: 1.5;
`;

const HowItWorks = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const StepCard = styled.div`
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.gray200};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
`;

const StepNum = styled.span`
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${theme.colors.primary}14;
  color: ${theme.colors.primary};
  font-weight: ${theme.fontWeights.bold};
  font-size: ${theme.fontSizes.sm};
  margin-bottom: ${theme.spacing.sm};
`;

const StepTitle = styled.div`
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSizes.sm};
`;

const StepBody = styled.p`
  margin: 0;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  line-height: 1.45;
`;

const MiniStatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
`;

const MiniStat = styled.div`
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.gray200};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const MiniStatIcon = styled.div`
  color: ${theme.colors.primary};
  flex-shrink: 0;
`;

const MiniStatText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MiniStatValue = styled.span`
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textPrimary};
  line-height: 1.1;
`;

const MiniStatLabel = styled.span`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const CheckInShell = styled.div`
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.gray200};
  border-radius: ${theme.borderRadius['2xl']};
  overflow: hidden;
  box-shadow: ${theme.shadows.lg};
`;

const CheckInTop = styled.div<{ $tone: 'success' | 'action' | 'closed' }>`
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  background: ${p =>
    p.$tone === 'success'
      ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
      : p.$tone === 'action'
        ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
        : theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.gray200};
`;

const CheckInTopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.md};
`;

const StatusPill = styled.span<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  background: ${p => (p.$on ? '#16a34a18' : '#f59e0b22')};
  color: ${p => (p.$on ? '#15803d' : '#b45309')};
`;

const CheckInBody = styled.div`
  padding: ${theme.spacing.xl};
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.xl};
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const QRPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  background: ${theme.colors.gray50};
  border-radius: ${theme.borderRadius.xl};
  border: 1px dashed ${theme.colors.gray200};
`;

const QRLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
`;

const QRHint = styled.p`
  margin: 0;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  line-height: 1.4;
  max-width: 280px;
`;

const CodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  width: 100%;
  max-width: 300px;
`;

const CodeText = styled.code`
  flex: 1;
  background: ${theme.colors.white};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.gray200};
  font-size: ${theme.fontSizes.lg};
  letter-spacing: 0.12em;
  text-align: center;
  color: ${theme.colors.textPrimary};
`;

const WindowNote = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: flex-start;
  margin-top: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.gray200};
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  max-width: 100%;
  line-height: 1.45;
`;

const FormPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const CodeInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 2px solid ${theme.colors.gray200};
  font-size: ${theme.fontSizes.lg};
  letter-spacing: 0.2em;
  text-align: center;
  text-transform: uppercase;
  font-family: ${theme.fonts.mono};
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}22;
  }
`;

const FormActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
`;

const QRMetaLine = styled.p`
  margin: ${theme.spacing.xs} 0 0;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  line-height: 1.4;
  text-align: center;
  max-width: 300px;
`;

/** Firestore Timestamp or plain seconds — show when the daily code was written (Harare). */
function formatDailyCodePublishedAt(createdAt: unknown): string | null {
  if (createdAt == null) return null;
  const ts = createdAt as { toDate?: () => Date; seconds?: number };
  let d: Date | null = null;
  if (typeof ts.toDate === 'function') {
    d = ts.toDate();
  } else if (typeof ts.seconds === 'number') {
    d = new Date(ts.seconds * 1000);
  }
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-US', {
    timeZone: 'Africa/Harare',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const StudentDashboard = (): React.ReactElement => {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useBodyScrollLock(mobileMenuOpen);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [stats, setStats] = useState({
    totalCheckIns: 0,
    currentStreak: 0,
    todayStatus: 'Not Checked In',
    lastCheckIn: null as Date | null
  });
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [isVerifyingQR, setIsVerifyingQR] = useState(false);
  const [dailyQR, setDailyQR] = useState<DailyQRCode | null>(null);
  const attendanceService = AttendanceService.getInstance();

  const dailyCodePublishedLabel = useMemo(
    () => formatDailyCodePublishedAt(dailyQR?.createdAt),
    [dailyQR]
  );

  const loadStudentStats = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const s = await DataService.getInstance().getStudentStats(user.uid);
      setStats((prev) => ({
        ...prev,
        totalCheckIns: s.totalCheckIns ?? 0,
        currentStreak: s.currentStreak ?? 0,
      }));
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    loadStudentStats();
  }, [loadStudentStats]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = qrCodeService.subscribeToDailyCode((qrData: DailyQRCode | null) => {
      if (qrData?.code) {
        setDailyQR(qrData);
        setQrCodeInput((prev) => (prev.trim() ? prev : qrData.code));
      } else {
        setDailyQR(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleCopyCode = () => {
    const code = dailyQR?.code;
    if (code) {
      navigator.clipboard.writeText(code);
      uniqueToast.success('Check-in code copied to clipboard!');
      setQrCodeInput(code);
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
          todayStatus:
            attendanceState.status === 'absent' ? 'Absent / Check-in closed' : 'Ready for New Day'
        }));
      } else if (attendanceState.isCheckedIn) {
        const late = attendanceState.status === 'late';
        setStats(prev => ({
          ...prev,
          todayStatus: late ? 'Checked In (Late)' : 'Checked In',
          lastCheckIn: attendanceState.checkInTime
        }));
      } else if (attendanceState.status === 'checked_out') {
        setStats(prev => ({
          ...prev,
          todayStatus: 'Completed for Today'
        }));
      } else if (attendanceState.status === 'absent') {
        setStats(prev => ({
          ...prev,
          todayStatus: 'Absent / Check-in closed'
        }));
      } else {
        setStats(prev => ({
          ...prev,
          todayStatus: 'Not Checked In'
        }));
      }
    } catch (error) {
      console.error('Error checking today attendance:', error);
      // Avoid noisy toasts on refresh (offline / transient Firestore). Defaults already show "not checked in".
    }
  }, [user, attendanceService]);

  const handleCheckInInternal = async (isAutomatic: boolean = false) => {
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
      
      // Note: Time validation (9:00 AM + 5 min grace) is handled in attendanceService.checkIn()
      
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
      
      const currentTime = new Date();
      const timeService = TimeService.getInstance();
      const checkInAt =
        attendanceRecord.checkInTime instanceof Date
          ? attendanceRecord.checkInTime
          : new Date(attendanceRecord.checkInTime as any);
      const isLate = timeService.isLate(checkInAt);
      
      setCheckedIn(true);
      setCheckInTime(currentTime);
      setCanCheckIn(false);
      setCanCheckOut(true);
      
      setStats(prev => ({
        ...prev,
        todayStatus: isLate ? 'Checked In (Late)' : 'Checked In',
        lastCheckIn: currentTime,
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
      void loadStudentStats();
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
      } else if (errorCode === 'permission-denied') {
        uniqueToast.error(
          'Could not complete check-in (permission denied). Try refreshing the page. If it persists, contact support.',
          { autoClose: 5000, position: 'top-center' }
        );
      } else {
        uniqueToast.error(`Failed to check in: ${errorCode ? `${errorCode} - ` : ''}${errorMessage}`, {
          autoClose: 4000,
          position: 'top-center',
        });
      }
    } finally {
      setIsVerifyingQR(false);
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
      void loadStudentStats();
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

  const timeService = TimeService.getInstance();
  const nowHarare = timeService.getCurrentTime();
  const harareClock = timeService.formatTime(nowHarare);
  const checkInTone = checkedIn ? 'success' : canCheckIn ? 'action' : 'closed';
  const isLateDisplay =
    checkInTime != null ? timeService.isLate(checkInTime) : false;

  return (
    <DashboardContainer>
      <MobileHeader>
        <MobileMenuButton
          type="button"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls="student-mobile-nav"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <FiX size={24} aria-hidden /> : <FiMenu size={24} aria-hidden />}
        </MobileMenuButton>
        <UncommonLogo size="sm" showSubtitle={false} />
        <div style={{ width: 40 }} />
      </MobileHeader>

      <MobileOverlay $isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />
      
      {mobileMenuOpen && (
        <MobileSidebar id="student-mobile-nav" $isOpen={mobileMenuOpen}>
          <SidebarContent>
            <Logo>Menu</Logo>
            <SidebarNav>
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'analytics', label: 'Analytics' },
                { id: 'profile', label: 'Profile' },
              ].map((item) => (
                <NavItem 
                  key={item.id}
                  active={activeNav === item.id}
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.label}
                </NavItem>
              ))}
            </SidebarNav>
          </SidebarContent>
        </MobileSidebar>
      )}

      <Sidebar 
        activeNav={activeNav} 
        onNavClick={handleNavClick} 
      />

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
          <DashboardPage>
            <Header style={{ padding: 0, marginBottom: theme.spacing.md }}>
              <HeaderTitle>
                <h1
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.lg,
                    margin: 0,
                    flexWrap: 'wrap',
                  }}
                >
                  <UncommonLogo size="lg" showSubtitle={false} />
                  <span>Attendance</span>
                </h1>
                <Tagline>
                  Hi, <strong>{user?.displayName || 'student'}</strong> — welcome to <strong>Uncommon</strong> attendance. Each session day you
                  check in with one shared <strong>QR code and text code</strong> (same token for everyone). Enter it below before the window closes
                  (Harare time).
                </Tagline>
              </HeaderTitle>
              <HeaderActions>
                <TimeSyncStatus />
                <div
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSizes.sm,
                    textAlign: 'right',
                  }}
                >
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </HeaderActions>
            </Header>

            <HowItWorks>
              <StepCard>
                <StepNum>1</StepNum>
                <StepTitle>
                  <FiLayers size={18} aria-hidden />
                  See today&apos;s code
                </StepTitle>
                <StepBody>
                  For Uncommon programs, your team publishes one code per day. When it&apos;s live, it shows here and matches what&apos;s on screen in
                  the room — same token for every student.
                </StepBody>
              </StepCard>
              <StepCard>
                <StepNum>2</StepNum>
                <StepTitle>
                  <ScanLine size={18} aria-hidden strokeWidth={2} />
                  Scan or type it
                </StepTitle>
                <StepBody>
                  Scan the QR with your phone camera, or copy the text and paste it into the field. The QR encodes the same characters — no separate password.
                </StepBody>
              </StepCard>
              <StepCard>
                <StepNum>3</StepNum>
                <StepTitle>
                  <FiCheckCircle size={18} aria-hidden />
                  Verify &amp; check in
                </StepTitle>
                <StepBody>
                  Tap verify to validate the code and save your attendance in this app. Check out when you leave so your session is complete.
                </StepBody>
              </StepCard>
            </HowItWorks>

            <MiniStatsRow>
              <MiniStat>
                <MiniStatIcon>
                  <FiTrendingUp size={24} aria-hidden />
                </MiniStatIcon>
                <MiniStatText>
                  <MiniStatValue>{stats.currentStreak}</MiniStatValue>
                  <MiniStatLabel>Day streak</MiniStatLabel>
                </MiniStatText>
              </MiniStat>
              <MiniStat>
                <MiniStatIcon>
                  <FiCalendar size={24} aria-hidden />
                </MiniStatIcon>
                <MiniStatText>
                  <MiniStatValue>{stats.totalCheckIns}</MiniStatValue>
                  <MiniStatLabel>Days on record</MiniStatLabel>
                </MiniStatText>
              </MiniStat>
            </MiniStatsRow>

            <CheckInShell>
              <CheckInTop $tone={checkInTone}>
                <CheckInTopRow>
                  <div>
                    <div
                      style={{
                        fontSize: theme.fontSizes.xs,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: theme.colors.textSecondary,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      Today&apos;s status
                    </div>
                    <StatusPill $on={checkedIn}>
                      {checkedIn ? 'Checked in' : canCheckIn ? 'Not checked in yet' : stats.todayStatus}
                    </StatusPill>
                    {checkInTime && (
                      <p
                        style={{
                          margin: `${theme.spacing.sm} 0 0`,
                          fontSize: theme.fontSizes.sm,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Time recorded: {checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isLateDisplay && (
                          <span style={{ color: '#b45309', fontWeight: theme.fontWeights.semibold, marginLeft: 8 }}>
                            (Late)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary }}>Now (Harare)</div>
                    <div
                      style={{
                        fontSize: theme.fontSizes.base,
                        fontWeight: theme.fontWeights.semibold,
                        color: theme.colors.textPrimary,
                        fontFamily: theme.fonts.mono,
                      }}
                    >
                      {harareClock}
                    </div>
                  </div>
                </CheckInTopRow>
                <WindowNote>
                  <FiInfo size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
                  <span>
                    Check-in is open until <strong>9:05 AM</strong> Harare. Arriving at <strong>9:00 AM</strong> or later counts as{' '}
                    <strong>late</strong>. The code proves you&apos;re joining today&apos;s session — keep it private until you&apos;ve checked in.
                  </span>
                </WindowNote>
              </CheckInTop>

              {!checkedIn && canCheckIn && (
                <CheckInBody>
                  <QRPanel>
                    <QRLabel>
                      <FiCamera size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} aria-hidden />
                      Today&apos;s QR
                    </QRLabel>
                    {dailyQR?.code ? (
                      <>
                        <div
                          style={{
                            background: theme.colors.white,
                            padding: theme.spacing.md,
                            borderRadius: theme.borderRadius.lg,
                            boxShadow: theme.shadows.md,
                          }}
                        >
                          <QRCodeSVG value={dailyQR.code} size={168} level="H" />
                        </div>
                        <QRHint>Scan with your camera app, or copy the code and paste it on the right.</QRHint>
                        <CodeRow>
                          <CodeText>{dailyQR.code}</CodeText>
                          <Button type="button" variant="outline" onClick={handleCopyCode} style={{ padding: '10px 14px' }}>
                            <Copy size={18} aria-hidden />
                          </Button>
                        </CodeRow>
                        {(dailyQR.date || dailyCodePublishedLabel) && (
                          <QRMetaLine>
                            {dailyQR.date && (
                              <>
                                Code for <strong>{dailyQR.date}</strong>
                                {dailyCodePublishedLabel && (
                                  <>
                                    {' '}
                                    · Published {dailyCodePublishedLabel} Harare
                                  </>
                                )}
                              </>
                            )}
                            {!dailyQR.date && dailyCodePublishedLabel && (
                              <>Published {dailyCodePublishedLabel} Harare</>
                            )}
                          </QRMetaLine>
                        )}
                      </>
                    ) : (
                      <QRHint>
                        The live code hasn&apos;t loaded yet. Ask your instructor for today&apos;s code — you can still type it on the right when you have it.
                      </QRHint>
                    )}
                  </QRPanel>
                  <FormPanel>
                    <div>
                      <strong style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textPrimary }}>Enter the daily code</strong>
                      <p style={{ margin: '6px 0 12px', fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary }}>
                        Same characters as the QR. Letters are not case-sensitive once submitted.
                      </p>
                      <CodeInput
                        type="text"
                        placeholder="PASTE CODE"
                        value={qrCodeInput}
                        onChange={(e) => setQrCodeInput(e.target.value.toUpperCase())}
                        autoComplete="off"
                        autoCapitalize="characters"
                      />
                    </div>
                    <FormActions>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleCheckIn}
                        disabled={attendanceLoading || isVerifyingQR || !qrCodeInput.trim()}
                        style={{ flex: 1, minWidth: 160 }}
                      >
                        {isVerifyingQR || attendanceLoading ? 'Verifying…' : 'Verify & check in'}
                      </Button>
                    </FormActions>
                  </FormPanel>
                </CheckInBody>
              )}

              {checkedIn && (
                <div style={{ padding: theme.spacing.xl }}>
                  <p style={{ margin: `0 0 ${theme.spacing.md}`, fontSize: theme.fontSizes.sm, color: theme.colors.textSecondary }}>
                    When you&apos;re done for the day, check out so your attendance reflects a full session.
                  </p>
                  <Button variant="outline" onClick={handleCheckOut} disabled={attendanceLoading || !canCheckOut}>
                    <FiLogOut size={16} style={{ marginRight: theme.spacing.xs }} />
                    {attendanceLoading ? 'Checking out…' : 'Check out'}
                  </Button>
                </div>
              )}

              {!checkedIn && !canCheckIn && (
                <div style={{ padding: theme.spacing.xl }}>
                  <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'flex-start' }}>
                    <FiClock size={22} color={theme.colors.textSecondary} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
                    <div>
                      <p style={{ margin: 0, fontWeight: theme.fontWeights.semibold, color: theme.colors.textPrimary }}>
                        {stats.todayStatus}
                      </p>
                      <p style={{ margin: `${theme.spacing.sm} 0 0`, fontSize: theme.fontSizes.sm, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
                        The check-in window has closed for today (after 9:05 AM Harare), or attendance was already finalized. If this looks wrong, contact your instructor.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CheckInShell>
          </DashboardPage>
        </div>
            )}
          </motion.div>
        </AnimatePresence>
      </MainContent>
    </DashboardContainer>
  );
};
