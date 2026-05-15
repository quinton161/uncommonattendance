import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
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
import { StudentGoalsBoard } from '../Goals/StudentGoalsBoard';
import { CheckoutGoalModal } from '../Student/CheckoutGoalModal';
import { LateCheckInReasonModal } from '../Student/LateCheckInReasonModal';
import { CheckInDailyGoalModal } from '../Student/CheckInDailyGoalModal';
import { saveCheckoutGoalReflection } from '../../services/checkoutGoalReflectionService';
import { hasGoalsForCheckoutReflection } from '../../services/studentGoalsService';
import type { CheckoutGoalReflectionPayload } from '../../types/checkoutGoalReflection';
import DataService from '../../services/DataService';
import { effectiveStudentHubId } from '../../services/hubService';
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
  min-height: 100vh;
  min-height: 100dvh;
  /* Soft Uncommon blue-to-white gradient */
  background: linear-gradient(135deg, #E8F4FD 0%, #F0F7FF 50%, #FFFFFF 100%);
  background-attachment: fixed;
  ${pageTransition}
  ${respectMotionPreference}
  width: 100%;
  overflow-x: hidden;
  
  @media (max-width: ${theme.breakpoints.laptop}) {
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
  @media (max-width: ${theme.breakpoints.laptop}) {
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
  
  @media (max-width: ${theme.breakpoints.laptop}) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    height: calc(60px + env(safe-area-inset-top, 0px));
    padding: ${theme.spacing.md};
    padding-top: env(safe-area-inset-top, 0px);
    padding-left: max(${theme.spacing.md}, env(safe-area-inset-left, 0px));
    padding-right: max(${theme.spacing.md}, env(safe-area-inset-right, 0px));
    /* Glassmorphism header */
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 4px 24px rgba(0, 82, 204, 0.06);
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
  
  @media (max-width: ${theme.breakpoints.laptop}) {
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
  min-height: 100vh;
  min-height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-left: 72px;
  ${containerAnimation}
  ${respectMotionPreference}
  
  @media (max-width: ${theme.breakpoints.laptop}) {
    flex: 1;
    min-height: auto;
    padding: 0;
    padding-top: ${theme.spacing.md};
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + ${theme.spacing.lg});
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

  @media (max-width: ${theme.breakpoints.laptop}) {
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
  width: 100%;
  margin: 0 auto;
  padding: ${theme.spacing.lg} ${theme.spacing.xl} ${theme.spacing['2xl']};
  box-sizing: border-box;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md} ${theme.spacing.lg};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
  }
  
  @media (max-width: 360px) {
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
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
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const StepCard = styled.div`
  /* Glassmorphism card */
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: ${theme.borderRadius['3xl']};
  padding: ${theme.spacing.lg};
  box-shadow: 0 8px 32px rgba(0, 82, 204, 0.08);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
  
  @media (hover: hover) {
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(0, 82, 204, 0.12);
    }
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
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
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${theme.spacing.sm};
  }
  
  @media (max-width: 360px) {
    grid-template-columns: 1fr;
  }
`;

const MiniStat = styled.div`
  /* Glassmorphism stat card */
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: ${theme.borderRadius['3xl']};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  box-shadow: 0 8px 32px rgba(0, 82, 204, 0.08);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
  
  @media (hover: hover) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 82, 204, 0.12);
    }
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    gap: ${theme.spacing.sm};
  }
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
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xl};
  }
`;

const MiniStatLabel = styled.span`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const CheckInShell = styled.div`
  /* Glassmorphism check-in card */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: ${theme.borderRadius['3xl']};
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 82, 204, 0.1);
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    border-radius: ${theme.borderRadius['2xl']};
  }
`;

const CheckInTop = styled.div<{ $tone: 'success' | 'action' | 'closed' }>`
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  background: ${p =>
    p.$tone === 'success'
      ? 'linear-gradient(135deg, rgba(39, 174, 96, 0.15) 0%, rgba(39, 174, 96, 0.08) 100%)'
      : p.$tone === 'action'
        ? 'linear-gradient(135deg, rgba(0, 82, 204, 0.12) 0%, rgba(0, 82, 204, 0.06) 100%)'
        : 'rgba(248, 249, 250, 0.5)'};
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
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
  /* Glassmorphism inner panel */
  background: rgba(248, 249, 250, 0.6);
  backdrop-filter: blur(12px);
  border-radius: ${theme.borderRadius['2xl']};
  border: 1px dashed rgba(0, 82, 204, 0.2);
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
  /* Glassmorphism note */
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border-radius: ${theme.borderRadius.xl};
  border: 1px solid rgba(255, 255, 255, 0.4);
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
  border-radius: ${theme.borderRadius['2xl']};
  /* Glassmorphism input */
  border: 2px solid rgba(0, 82, 204, 0.15);
  background: rgba(255, 255, 255, 0.7);
  font-size: ${theme.fontSizes.lg};
  letter-spacing: 0.2em;
  text-align: center;
  text-transform: uppercase;
  font-family: ${theme.fonts.mono};
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 0 4px rgba(0, 82, 204, 0.15);
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
  const { user, logout } = useAuth();
  const studentHubId = useMemo(() => effectiveStudentHubId(user ?? undefined), [user]);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkoutGoalModalOpen, setCheckoutGoalModalOpen] = useState(false);
  const [checkoutModalIsFriday, setCheckoutModalIsFriday] = useState(false);
  const [checkoutGoalsLookupLoading, setCheckoutGoalsLookupLoading] = useState(false);
  const [lateReasonModalOpen, setLateReasonModalOpen] = useState(false);
  const [checkInGoalModalOpen, setCheckInGoalModalOpen] = useState(false);
  const [lateReasonPendingForGoal, setLateReasonPendingForGoal] = useState<string | null>(null);
  useBodyScrollLock(mobileMenuOpen || checkoutGoalModalOpen || lateReasonModalOpen || checkInGoalModalOpen);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [isBeforeSessionStart, setIsBeforeSessionStart] = useState(false);
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
      const s = await DataService.getInstance().getStudentStats(user.uid, studentHubId);
      setStats((prev) => ({
        ...prev,
        totalCheckIns: s.totalCheckIns ?? 0,
        currentStreak: s.currentStreak ?? 0,
      }));
    } catch {
      /* ignore */
    }
  }, [user, studentHubId]);

  useEffect(() => {
    loadStudentStats();
  }, [loadStudentStats]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = qrCodeService.subscribeToDailyCode((qrData: DailyQRCode | null) => {
      if (qrData?.code) {
        setDailyQR(qrData);
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
      const attendanceState = await attendanceService.getAttendanceStateWithDayCheck(user.uid, studentHubId);
      const beforeSession = !!(attendanceState as { isBeforeSessionStart?: boolean }).isBeforeSessionStart;
      setIsBeforeSessionStart(beforeSession);

      setCheckedIn(attendanceState.isCheckedIn);
      setCheckInTime(attendanceState.checkInTime);
      setCanCheckIn(attendanceState.canCheckIn);
      
      if (attendanceState.isNewDay && !attendanceState.isCheckedIn) {
        let todayStatus =
          attendanceState.status === 'absent' ? 'Absent / Check-in closed' : 'Ready for New Day';
        if (beforeSession && attendanceState.status !== 'absent') {
          todayStatus = 'Session opens at 7:00 AM';
        }
        setStats(prev => ({
          ...prev,
          todayStatus,
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
      } else if (beforeSession) {
        setStats(prev => ({
          ...prev,
          todayStatus: 'Session opens at 7:00 AM'
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
  }, [user, attendanceService, studentHubId]);

  const handleCheckInError = useCallback(
    (error: unknown) => {
      console.error('Check-in error:', error);

      const errAny = error as any;
      const errorMessage =
        (errAny?.message as string | undefined) ||
        (error instanceof Error ? error.message : undefined) ||
        'Unknown error';
      const errorCode = errAny?.code as string | undefined;

      if (errorMessage === 'Already checked in today') {
        uniqueToast.info('You have already checked in today.', {
          autoClose: 4000,
          position: 'top-center',
        });
        void checkTodayAttendance();
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
    },
    [checkTodayAttendance]
  );

  const performCheckIn = useCallback(
    async (lateReason?: string, checkInGoal?: string) => {
      if (!user) return;

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

      let attendanceRecord;
      let retries = 0;
      const maxRetries = 2;

      while (retries <= maxRetries) {
        try {
          attendanceRecord = await attendanceService.checkIn(
            user.uid,
            user.displayName || 'Student',
            qrCodeInput,
            location,
            false,
            'qr',
            studentHubId,
            lateReason,
            checkInGoal
          );
          break;
        } catch (err: any) {
          if (err.message === 'Already checked in today' || retries === maxRetries) throw err;
          retries++;
          console.warn(`Retry check-in ${retries}/${maxRetries}...`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (!attendanceRecord) throw new Error('Check-in failed after retries');

      const currentTime = new Date();
      const ts = TimeService.getInstance();
      const checkInAt =
        attendanceRecord.checkInTime instanceof Date
          ? attendanceRecord.checkInTime
          : new Date(attendanceRecord.checkInTime as any);
      const isLate = ts.isLate(checkInAt);

      setCheckedIn(true);
      setCheckInTime(currentTime);
      setCanCheckIn(false);

      setStats((prev) => ({
        ...prev,
        todayStatus: isLate ? 'Checked In (Late)' : 'Checked In',
        lastCheckIn: currentTime,
      }));

      if (isLate) {
        uniqueToast.warning('Checked in (Late). Your explanation was recorded for staff.', {
          autoClose: 6000,
          position: 'top-center',
        });
      } else {
        uniqueToast.success('Checked in successfully!', {
          autoClose: 4000,
          position: 'top-center',
        });
      }
      void loadStudentStats();
    },
    [user, qrCodeInput, attendanceService, studentHubId, loadStudentStats]
  );

  const handleCheckInInternal = async () => {
    if (!user) {
      uniqueToast.error('You must be logged in to check in.', {
        autoClose: 4000,
        position: 'top-center',
      });
      return;
    }

    if (!canCheckIn) {
      const ts = TimeService.getInstance();
      if (ts.isBeforeSessionStart(ts.getCurrentTime())) {
        uniqueToast.info('Session starts at 7:00 AM Harare. You can check in once it opens.', {
          autoClose: 5000,
          position: 'top-center',
        });
      } else {
        uniqueToast.info('You cannot check in right now. The window may have closed (after 9:05 AM Harare).', {
          autoClose: 4000,
          position: 'top-center',
        });
      }
      return;
    }

    if (!qrCodeInput.trim()) {
      uniqueToast.error('Please enter the daily check-in code');
      return;
    }

    if (
      !window.confirm(
        'Check in for today with the code you entered? Your attendance will be recorded for your hub. Make sure it matches what your instructor shared.'
      )
    ) {
      return;
    }

    setAttendanceLoading(true);
    try {
      setIsVerifyingQR(true);
      const isValid = await qrCodeService.validateCode(qrCodeInput);
      if (!isValid) {
        uniqueToast.error('Invalid check-in code. Please ask your instructor for the current code.');
        return;
      }

      const ts = TimeService.getInstance();
      if (ts.isLate(ts.getCurrentTime())) {
        setLateReasonModalOpen(true);
        return;
      }

      setLateReasonPendingForGoal(null);
      setCheckInGoalModalOpen(true);
    } catch (error) {
      handleCheckInError(error);
    } finally {
      setIsVerifyingQR(false);
      setAttendanceLoading(false);
    }
  };

  const handleLateReasonSubmit = async (reason: string) => {
    setLateReasonModalOpen(false);
    setLateReasonPendingForGoal(reason);
    setCheckInGoalModalOpen(true);
  };

  const handleCheckInGoalSubmit = async (goal: string) => {
    setAttendanceLoading(true);
    try {
      await performCheckIn(lateReasonPendingForGoal ?? undefined, goal);
      setCheckInGoalModalOpen(false);
      setLateReasonPendingForGoal(null);
    } catch (error) {
      handleCheckInError(error);
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
      case 'goals':
        return (
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
            <StudentGoalsBoard />
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
    await handleCheckInInternal();
  };

  const handleCheckoutModalCancel = () => {
    setCheckoutGoalModalOpen(false);
  };

  const handleCheckOutError = (error: unknown) => {
    const errAny = error as any;
    const errorMessage =
      (errAny?.message as string | undefined) ||
      (error instanceof Error ? error.message : undefined) ||
      'Unknown error';
    const errorCode = errAny?.code as string | undefined;

    if (errorMessage === 'Already checked out today') {
      uniqueToast.info('You have already checked out today!', { autoClose: 4000, position: 'top-center' });
      checkTodayAttendance();
    } else if (errorMessage === 'No check-in record found for today') {
      uniqueToast.warning('You need to check in first!', { autoClose: 4000, position: 'top-center' });
      checkTodayAttendance();
    } else if (errorCode === 'permission-denied') {
      uniqueToast.error(
        'Check-out was blocked. Try again in a moment. If it keeps happening, refresh the page.',
        { autoClose: 5000, position: 'top-center' }
      );
    } else {
      uniqueToast.error(`Failed to check out: ${errorCode ? `${errorCode} - ` : ''}${errorMessage}`, {
        autoClose: 4000,
        position: 'top-center',
      });
    }
  };

  const runCheckOutRequest = async () => {
    if (!user) throw new Error('Not signed in');
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

    await attendanceService.checkOut(user.uid, location, studentHubId);
  };

  const applyCheckOutSuccessUi = () => {
    setCheckoutGoalModalOpen(false);
    setCheckedIn(false);
    setCheckInTime(null);
    setCanCheckIn(false);
    setStats((prev) => ({ ...prev, todayStatus: 'Completed for Today' }));
    uniqueToast.success('Checked out successfully! See you tomorrow.', { autoClose: 3000, position: 'top-center' });
    void loadStudentStats();
  };

  const openCheckoutModal = async () => {
    if (!user) return;
    setCheckoutGoalsLookupLoading(true);
    try {
      const hasGoals = await hasGoalsForCheckoutReflection(user.uid);
      if (hasGoals) {
        const ts = TimeService.getInstance();
        const d = ts.getCurrentDateString();
        setCheckoutModalIsFriday(ts.isHarareFriday(d));
        setCheckoutGoalModalOpen(true);
      } else {
        setAttendanceLoading(true);
        try {
          await runCheckOutRequest();
          applyCheckOutSuccessUi();
        } catch (error) {
          console.error('Check-out error:', error);
          handleCheckOutError(error);
        } finally {
          setAttendanceLoading(false);
        }
      }
    } catch (e) {
      console.error('Goals lookup failed:', e);
      uniqueToast.error('Could not verify your goals. Check your connection and try again.', {
        autoClose: 4000,
        position: 'top-center',
      });
    } finally {
      setCheckoutGoalsLookupLoading(false);
    }
  };

  const performCheckOutWithReflection = async (reflection: CheckoutGoalReflectionPayload) => {
    if (!user) return;
    setAttendanceLoading(true);
    try {
      await runCheckOutRequest();

      const ts = TimeService.getInstance();
      const dateStr = ts.getCurrentDateString();
      const isFriday = ts.isHarareFriday(dateStr);
      try {
        await saveCheckoutGoalReflection(user.uid, dateStr, reflection, isFriday);
      } catch (logErr) {
        console.error('Checkout goal reflection save failed:', logErr);
        uniqueToast.warning('Checked out, but your goal reflection could not be saved. You can try again tomorrow.', {
          autoClose: 5000,
          position: 'top-center',
        });
      }

      applyCheckOutSuccessUi();
    } catch (error) {
      console.error('Check-out error:', error);
      handleCheckOutError(error);
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
      <CheckoutGoalModal
        open={checkoutGoalModalOpen}
        isFriday={checkoutModalIsFriday}
        submitting={attendanceLoading}
        onCancel={handleCheckoutModalCancel}
        onConfirm={performCheckOutWithReflection}
      />
      <LateCheckInReasonModal
        open={lateReasonModalOpen}
        onClose={() => setLateReasonModalOpen(false)}
        onSubmit={handleLateReasonSubmit}
      />
      <CheckInDailyGoalModal
        open={checkInGoalModalOpen}
        onClose={() => {
          setCheckInGoalModalOpen(false);
          setLateReasonPendingForGoal(null);
        }}
        onSubmit={handleCheckInGoalSubmit}
      />
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
            <SidebarNav style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'analytics', label: 'Analytics' },
                { id: 'goals', label: 'Goals' },
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
            <NavItem
              active={false}
              onClick={() => {
                setMobileMenuOpen(false);
                void logout();
              }}
              style={{ flexShrink: 0, marginTop: theme.spacing.md, color: '#ff8a8a' }}
            >
              <FiLogOut size={18} aria-hidden />
              Logout
            </NavItem>
          </SidebarContent>
        </MobileSidebar>
      )}

      <Sidebar 
        activeNav={activeNav} 
        onNavClick={handleNavClick} 
      />

      <MainContent style={{ padding: 0 }}>
        <div key={activeNav}>
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
                    Session opens at <strong>7:00 AM</strong> Harare. Check-in is open until <strong>9:05 AM</strong>. Arriving at{' '}
                    <strong>9:01 AM</strong> or later counts as <strong>late</strong>. The code proves you&apos;re joining today&apos;s session — keep it private until you&apos;ve checked in.
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
                        Type or paste the code yourself — it is not filled in automatically. Same characters as the QR; not case-sensitive.
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
                  <Button
                    variant="outline"
                    onClick={openCheckoutModal}
                    disabled={attendanceLoading || checkoutGoalsLookupLoading}
                  >
                    <FiLogOut size={16} style={{ marginRight: theme.spacing.xs }} />
                    {checkoutGoalsLookupLoading
                      ? 'Loading…'
                      : attendanceLoading
                        ? 'Checking out…'
                        : 'Check out'}
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
                        {isBeforeSessionStart
                          ? 'Today’s session begins at 7:00 AM Harare. You can check in once the window opens (7:00–9:05 AM).'
                          : 'The check-in window has closed for today (after 9:05 AM Harare), or attendance was already finalized. If this looks wrong, contact your instructor.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CheckInShell>
          </DashboardPage>
        </div>
            )}
        </div>
      </MainContent>
    </DashboardContainer>
  );
};
