import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { UsersPage } from '../Admin/UsersPage';
import { UncommonLogo } from '../Common/UncommonLogo';
import { theme } from '../../styles/theme';
import { 
  staggeredAnimation, 
  pageTransition, 
  containerAnimation,
  respectMotionPreference 
} from '../../styles/animations';
import DataService from '../../services/DataService';
import { TimeService } from '../../services/timeService';
import { AttendanceService } from '../../services/attendanceService';
import { uniqueToast } from '../../utils/toastUtils';
import { saveAs } from 'file-saver';

import { AdminProfile } from '../Profile/AdminProfile';
import { AdminAttendanceAnalytics } from '../Analytics/AdminAttendanceAnalytics';
import { MasterResetModal } from '../Admin/MasterResetModal';
import { AbsenceRecordModal } from '../Admin/AbsenceRecordModal';
import {
  ATTENDANCE_CSV_HEADERS,
  formatCsvDocument,
  buildAttendanceExportRows,
} from '../../utils/attendanceCsv';
import { Sidebar } from '../Common/Sidebar';
import { StudentGoalsBoard } from '../Goals/StudentGoalsBoard';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { qrCodeService, DailyQRCode } from '../../services/qrCodeService';
import { effectiveStaffHubScope, staffMayAccessHubForWrite } from '../../services/hubService';
import { AdminHubScopeSelect } from '../Admin/AdminHubScopeSelect';
import { 
  FiMenu,
  FiX,
  FiMaximize,
  FiRefreshCw,
  FiLogOut
} from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { format, parseISO } from 'date-fns';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { hubIdMatchesScope } from '../../services/hubService';

/** Match Firestore row to a school calendar day (stored `date` or Harare date from check-in). */
function attendanceMatchesHarareDay(a: any, dateStr: string): boolean {
  if (a?.date === dateStr) return true;
  const ci = a?.checkInTime;
  if (!ci) return false;
  const d = ci instanceof Date ? ci : new Date(ci);
  if (Number.isNaN(d.getTime())) return false;
  return TimeService.getInstance().toHarareDateString(d) === dateStr;
}

const DashboardContainer = styled.div`
  display: flex;
  height: 100vh;
  background: ${theme.colors.backgroundSecondary};
  ${pageTransition}
  ${respectMotionPreference}
  width: 100%;
  overflow: hidden;
  @media (max-width: ${theme.breakpoints.laptop}) {
    flex-direction: column;
    padding-top: calc(60px + env(safe-area-inset-top, 0px));
  }
`;

const MobileSidebar = styled.div<{ $isOpen?: boolean }>`
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
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const NavItem = styled.div<{ $active?: boolean; $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  color: ${props => {
    if (props.$danger) return '#ff8a8a';
    return props.$active ? theme.colors.white : theme.colors.gray300;
  }};
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: ${theme.spacing.sm};
  position: relative;
  z-index: 20;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${props => (props.$danger ? '#ff8a8a' : theme.colors.white)};
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
  @media (max-width: ${theme.breakpoints.laptop}) {
    flex: 1;
    min-height: 0;
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
  h1 {
    font-size: ${theme.fontSizes['3xl']};
    font-weight: ${theme.fontWeights.bold};
    color: ${theme.colors.textPrimary};
    margin: 0 0 ${theme.spacing.sm} 0;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.lg};
    
    @media (max-width: ${theme.breakpoints.laptop}) {
      font-size: ${theme.fontSizes['2xl']};
      gap: ${theme.spacing.md};
    }
    
    @media (max-width: 420px) {
      font-size: ${theme.fontSizes.xl};
      gap: ${theme.spacing.sm};
    }
    
    @media (max-width: 360px) {
      font-size: ${theme.fontSizes.lg};
      flex-direction: column;
      align-items: flex-start;
      gap: ${theme.spacing.xs};
    }
  }
  
  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
    font-size: ${theme.fontSizes.lg};
    
    @media (max-width: ${theme.breakpoints.laptop}) {
      font-size: ${theme.fontSizes.base};
    }
    
    @media (max-width: 420px) {
      font-size: ${theme.fontSizes.sm};
    }
    
    @media (max-width: 360px) {
      font-size: ${theme.fontSizes.xs};
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  align-items: center;
  
  @media (max-width: ${theme.breakpoints.laptop}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.sm};
    width: 100%;
  }
  
  @media (max-width: 420px) {
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
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing.sm};
  }
  
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.xs};
    margin-bottom: ${theme.spacing.lg};
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
`;

const CardTitle = styled.h3`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin: 0 0 ${theme.spacing.lg} 0;
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

const AdminDashboard: React.FC = () => {

  const { user, logout } = useAuth();
  const [adminHubFilter, setAdminHubFilter] = useState('');
  const effectiveHub = useMemo(
    () => effectiveStaffHubScope(user, adminHubFilter),
    [user, adminHubFilter]
  );
  /** Staff actions that must not cross hubs (toasts, bulk mark/checkout, destructive clears). */
  const hubScopeActive = Boolean(effectiveHub);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useBodyScrollLock(mobileMenuOpen);
  const [stats, setStats] = useState({
    totalAttendees: 0,
    totalInstructors: 0,
    todayAttendance: 0,
    lateCount: 0,
    absentCount: 0,
    attendanceRate: 0
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [todayAttendanceList, setTodayAttendanceList] = useState<any[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
  const [atRiskLoaded, setAtRiskLoaded] = useState(false);
  const [dailyQR, setDailyQR] = useState<DailyQRCode | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const dataService = DataService.getInstance();
  const attendanceService = AttendanceService.getInstance();
  const [markingStudentId, setMarkingStudentId] = useState<string | null>(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [checkoutAllLoading, setCheckoutAllLoading] = useState(false);
  const [showMasterResetModal, setShowMasterResetModal] = useState(false);
  const [absenceModal, setAbsenceModal] = useState<{
    userId: string;
    userName: string;
    initialReason?: 'excused' | 'unexcused' | 'dropout';
    initialNotes?: string;
  } | null>(null);
  const [masterResetStats, setMasterResetStats] = useState({ deletedUsers: 0, deletedAttendance: 0, preservedUsers: 0 });

  const handleGenerateQR = async () => {
    try {
      await qrCodeService.generateDailyCode();
      uniqueToast.success('New daily code generated!');
    } catch (error) {
      console.error('Error generating QR:', error);
      uniqueToast.error('Failed to generate daily code');
    }
  };

  const handleDownloadAttendanceCSV = async () => {
    try {
      await dataService.testConnection();
      const users = await dataService.getUsers(effectiveHub);
      const attendance = await dataService.getAttendance(undefined, effectiveHub);
      const timeService = TimeService.getInstance();
      const todayStr = timeService.getCurrentDateString();
      const todayAttendance = attendance.filter((a: any) => attendanceMatchesHarareDay(a, todayStr));
      const students = users.filter(
        (u: any) => !u.userType || u.userType === 'attendee' || u.userType === 'student'
      );
      const dataRows = buildAttendanceExportRows(students, todayAttendance, todayStr);
      const csv = formatCsvDocument([...ATTENDANCE_CSV_HEADERS], dataRows);
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `attendance_${todayStr}.csv`);
      uniqueToast.success('CSV downloaded!', { autoClose: 2000 });
    } catch (error) {
      console.error('Error generating attendance CSV:', error);
      uniqueToast.error('Failed to generate CSV');
    }
  };

  const handleMarkStudentPresent = async (student: any) => {
    if (!hubScopeActive) {
      uniqueToast.info('Select a single hub above to mark attendance for that hub only.');
      return;
    }
    if (user?.userType === 'instructor' && !staffMayAccessHubForWrite(user, student?.hubId)) {
      uniqueToast.error('You can only record attendance for students in your hub.');
      return;
    }
    if (!student?.userId || !student?.userName) return;
    if (markingStudentId) return;

    setMarkingStudentId(student.userId);
    try {
      // Use attendanceService to create proper attendance record
      // skipTimeCheck=true allows admin to mark students present anytime
      // method='admin' indicates admin-marked attendance
      await attendanceService.checkIn(
        student.userId,
        student.userName,
        undefined,
        undefined,
        true,
        user?.userType === 'instructor' ? 'instructor' : 'admin',
        effectiveHub
      );
      uniqueToast.success(`Marked ${student.userName} as present.`);
    } catch (e: any) {
      console.error('Failed to mark student present:', e.message);
      uniqueToast.error(`Failed to mark ${student.userName} as present: ${e.message}`);
    } finally {
      setMarkingStudentId(null);
    }
  };

  const handleMarkAllPresent = async () => {
    if (!hubScopeActive) {
      uniqueToast.info('Select a single hub above so bulk actions apply to that hub only.');
      return;
    }
    if (markAllLoading) return;
    const targets = (todayAttendanceList || [])
      .filter((s: any) => s.status === 'absent' && s.userId && s.userName)
      .filter(
        (s: any) => user?.userType !== 'instructor' || staffMayAccessHubForWrite(user, s.hubId)
      )
      .slice(0, 50);

    if (targets.length === 0) {
      uniqueToast.info('No absent students to mark present.');
      return;
    }

    setMarkAllLoading(true);
    try {
      // Batch to reduce Firestore write pressure.
      // skipTimeCheck=true allows admin to mark all students present anytime
      // method='admin' indicates admin-marked attendance
      const batchSize = 5;
      for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        await Promise.all(
          batch.map((s: any) =>
            attendanceService.checkIn(
              s.userId,
              s.userName,
              undefined,
              undefined,
              true,
              user?.userType === 'instructor' ? 'instructor' : 'admin',
              effectiveHub
            )
          )
        );
      }
      uniqueToast.success('Marked absent students as present.');
    } catch (e) {
      console.error('Failed to mark all present:', e);
      uniqueToast.error('Failed to mark all present.');
    } finally {
      setMarkAllLoading(false);
    }
  };

  const handleCheckOutAllOpen = async () => {
    if (!hubScopeActive) {
      uniqueToast.info('Select a single hub above so check-out applies to that hub only.');
      return;
    }
    if (checkoutAllLoading || markAllLoading) return;
    const open = (todayAttendanceList || []).filter(
      (s: any) => s.checkInTime && !s.checkOutTime && s.status !== 'absent'
    );
    if (open.length === 0) {
      uniqueToast.info('No students are still checked in without a check-out today.');
      return;
    }
    if (
      !window.confirm(
        `Check out ${open.length} student(s) who are still checked in (set check-out time to now, Harare)?`
      )
    ) {
      return;
    }
    setCheckoutAllLoading(true);
    try {
      const { checkedOut } = await attendanceService.checkOutAllOpenToday(effectiveHub);
      uniqueToast.success(
        checkedOut === 0
          ? 'No open sessions to close.'
          : `Checked out ${checkedOut} student(s).`
      );
    } catch (e) {
      console.error('Failed to check out all:', e);
      uniqueToast.error('Failed to check out everyone. Try again or check your connection.');
    } finally {
      setCheckoutAllLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      await dataService.testConnection();

      const dashboardStats = await dataService.getDashboardStats(effectiveHub);

      // Do not reset today counts here — subscribeToTodayAttendance owns them. A slow
      // loadDashboardData used to finish after the listener and zero out live stats on refresh.
      setStats((prev) => ({
        ...prev,
        totalAttendees: dashboardStats.totalAttendees,
        totalInstructors: dashboardStats.totalInstructors,
      }));

      const attendance = await dataService.getAttendance(undefined, effectiveHub);
      const ts = TimeService.getInstance();
      const endStr = ts.getCurrentDateString();
      const lastSchoolDays = ts.lastNHarareWeekdays(5, endStr);

      const weeklyTrends = lastSchoolDays.map((date) => {
        const dayAttendance = attendance.filter((a: any) => attendanceMatchesHarareDay(a, date));
        return {
          name: format(parseISO(`${date}T12:00:00+02:00`), 'EEE'),
          present: dayAttendance.length,
          late: dayAttendance.filter((a: any) => {
            const checkIn = a.checkInTime ? new Date(a.checkInTime) : null;
            return !!(checkIn && ts.isLate(checkIn));
          }).length
        };
      });
      setWeeklyData(weeklyTrends);

      setAtRiskLoaded(false);
      try {
        const atRisk = await dataService.getAtRiskStudents({
          windowDays: 30,
          maxRate: 85,
          minMissedSchoolDays: 3,
          limit: 8,
          hubId: effectiveHub,
        });
        setAtRiskStudents(atRisk);
      } catch (e) {
        console.error('Failed to load at-risk students:', e);
        setAtRiskStudents([]);
      } finally {
        setAtRiskLoaded(true);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      uniqueToast.error('Failed to load dashboard data. Check your connection.');
      setAtRiskLoaded(true);
      setAtRiskStudents([]);
      setStats((prev) => ({
        ...prev,
        totalAttendees: 0,
        totalInstructors: 0,
      }));
    }
  };

  useEffect(() => {
    const unsubscribeAttendance = dataService.subscribeToTodayAttendance((summary) => {
      setStats(prev => ({
        ...prev,
        todayAttendance: summary.presentCount,
        lateCount: summary.lateCount,
        absentCount: summary.absentCount,
        attendanceRate: Math.round((summary.presentCount / (summary.totalUsers || 1)) * 100)
      }));

      if (summary.attendanceList) {
        setTodayAttendanceList(summary.attendanceList);
      }
    }, effectiveHub);

    // Load static dashboard stats on mount
    loadDashboardData();

    // Subscribe to daily QR code
    const unsubscribeQR = qrCodeService.subscribeToDailyCode((qr) => {
      setDailyQR(qr);
    });

    return () => {
      unsubscribeAttendance();
      unsubscribeQR();
    };
  }, [effectiveHub]);

  const lateEventSeenIdsRef = useRef<Set<string>>(new Set());
  const lateEventInitRef = useRef(false);

  useEffect(() => {
    lateEventSeenIdsRef.current = new Set();
    lateEventInitRef.current = false;
  }, [effectiveHub]);

  useEffect(() => {
    if (!hubScopeActive || !effectiveHub) return;
    const today = TimeService.getInstance().getCurrentDateString();
    const q = query(collection(db, 'late_check_in_events'), where('date', '==', today));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!lateEventInitRef.current) {
          lateEventInitRef.current = true;
          snap.docs.forEach((d) => lateEventSeenIdsRef.current.add(d.id));
          return;
        }
        snap.docChanges().forEach((change) => {
          if (change.type !== 'added') return;
          const id = change.doc.id;
          if (lateEventSeenIdsRef.current.has(id)) return;
          lateEventSeenIdsRef.current.add(id);
          const d = change.doc.data() as {
            studentName?: string;
            reason?: string;
            hubId?: string;
          };
          if (!hubIdMatchesScope(d.hubId, effectiveHub)) return;
          const name = d.studentName || 'Student';
          const preview =
            (d.reason && d.reason.length > 120 ? `${d.reason.slice(0, 120)}…` : d.reason) || '';
          uniqueToast.info(`Late check-in — ${name}: ${preview}`, { autoClose: 10000 });
        });
      },
      (err) => console.error('late_check_in_events listener:', err)
    );
    return () => unsub();
  }, [effectiveHub, hubScopeActive]);

  const handleNavClick = (navItem: string) => {
    setActiveNav(navItem);
    setMobileMenuOpen(false); // Close mobile menu when navigating
  };

  // Handle chat initiation from UsersPage
  const handleChatFromUsers = (studentId: string, studentName: string, studentPhotoUrl?: string) => {
    // Chat functionality removed
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const renderCurrentPage = () => {
    switch (activeNav) {
      case 'analytics':
        return (
          <div style={{ padding: theme.spacing.lg }}>
            <h2 style={{ margin: `0 0 ${theme.spacing.lg} 0`, color: theme.colors.textPrimary }}>Attendance Analytics</h2>
            <AdminAttendanceAnalytics />
          </div>
        );
      case 'users':
        return (
          <div style={{ width: '100%', minWidth: 0, minHeight: 0 }}>
            <UsersPage onBack={() => setActiveNav('dashboard')} onChat={handleChatFromUsers} />
          </div>
        );
      case 'profile':
        return (
          <div style={{ padding: 0 }}>
            <AdminProfile />
          </div>
        );
      case 'goals':
        return (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {user?.userType === 'admin' && (
              <div
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.lg} 0`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: theme.spacing.md,
                  flexWrap: 'wrap',
                }}
              >
                <AdminHubScopeSelect
                  user={user}
                  value={adminHubFilter}
                  onChange={setAdminHubFilter}
                  id="goals-hub-filter"
                  label="Hub"
                />
                <span
                  style={{
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.textSecondary,
                    paddingBottom: 4,
                    maxWidth: '28rem',
                    lineHeight: 1.45,
                  }}
                >
                  All hubs: see every student&apos;s goals. Choose a hub to filter.
                </span>
              </div>
            )}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
              <StudentGoalsBoard
                hubScopeId={
                  user?.userType === 'admin'
                    ? adminHubFilter.trim() || null
                    : effectiveHub ?? null
                }
                viewAllHubs={Boolean(user?.userType === 'admin' && !adminHubFilter.trim())}
              />
            </div>
          </div>
        );
      default:
        return null; // Will render the main dashboard
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };


  return (
    <DashboardContainer>
      <MobileHeader>
        <MobileMenuButton
          type="button"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls="admin-mobile-nav"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <FiX size={24} aria-hidden /> : <FiMenu size={24} aria-hidden />}
        </MobileMenuButton>
        <UncommonLogo size="sm" showSubtitle={false} />
        <div style={{ width: 40 }} /> {/* Spacer for alignment */}
      </MobileHeader>
      
      <MobileOverlay $isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />
      
      {mobileMenuOpen && (
        <MobileSidebar id="admin-mobile-nav" $isOpen={mobileMenuOpen}>
          <div style={{ padding: theme.spacing.lg }}>
            <Logo>Menu</Logo>
            <NavList>
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'analytics', label: 'Analytics' },
                { id: 'users', label: 'Users' },
                { id: 'goals', label: 'Goals' },
                { id: 'profile', label: 'Profile' },
              ].map((item) => (
                <NavItem 
                  key={item.id}
                  $active={activeNav === item.id}
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.label}
                </NavItem>
              ))}
              {user?.userType === 'admin' && (
                <NavItem
                  $danger
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowMasterResetModal(true);
                  }}
                >
                  Master Reset
                </NavItem>
              )}
              <NavItem
                $danger
                onClick={() => {
                  setMobileMenuOpen(false);
                  void logout();
                }}
              >
                <FiLogOut size={18} aria-hidden />
                Logout
              </NavItem>
            </NavList>
          </div>
        </MobileSidebar>
      )}
      
      <Sidebar
        activeNav={activeNav}
        onNavClick={handleNavClick}
        onMasterReset={user?.userType === 'admin' ? () => setShowMasterResetModal(true) : undefined}
      />

      <MainContent style={{ padding: 0 }}>
        <div key={activeNav}>
            {renderCurrentPage() || (
          <div style={{ padding: theme.spacing.lg, display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
            <Header>
              <HeaderTitle>
                <h1 style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: theme.spacing.lg,
                  margin: 0 
                }}>
                  <UncommonLogo size="lg" showSubtitle={false} />
                  <span>{user?.userType === 'instructor' ? 'Instructor' : 'Admin'} Dashboard</span>
                </h1>
                <p>Welcome back, {user?.displayName}!</p>
              </HeaderTitle>
              <HeaderActions>
                <Button variant="primary" onClick={handleDownloadAttendanceCSV}>
                  Download Attendance CSV
                </Button>
                <Button variant="outline" onClick={() => setShowQRModal(true)}>
                  <FiMaximize size={16} style={{ marginRight: theme.spacing.xs }} />
                  Daily QR Code
                </Button>
              </HeaderActions>
            </Header>

            {user?.userType === 'admin' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: theme.spacing.md,
                  flexWrap: 'wrap',
                }}
              >
                <AdminHubScopeSelect
                  user={user}
                  value={adminHubFilter}
                  onChange={setAdminHubFilter}
                  id="dashboard-hub-filter"
                />
                <span
                  style={{
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.textSecondary,
                    paddingBottom: 4,
                  }}
                >
                  Dashboard stats and today&apos;s list follow this hub (or all hubs).
                </span>
              </div>
            )}

            {showQRModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: theme.spacing.xl
              }}>
                <Card style={{ 
                  maxWidth: '500px', 
                  width: '100%', 
                  textAlign: 'center',
                  position: 'relative',
                  padding: theme.spacing.xl
                }}>
                  <button 
                    onClick={() => setShowQRModal(false)}
                    style={{
                      position: 'absolute',
                      top: theme.spacing.md,
                      right: theme.spacing.md,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: theme.colors.textSecondary
                    }}
                  >
                    <FiX size={24} />
                  </button>
                  <h2 style={{ marginBottom: theme.spacing.lg }}>Daily Attendance QR Code</h2>
                  <div style={{ 
                    background: 'white', 
                    padding: theme.spacing.xl, 
                    borderRadius: theme.borderRadius.lg,
                    display: 'inline-block',
                    marginBottom: theme.spacing.lg,
                    boxShadow: theme.shadows.md
                  }}>
                    {dailyQR ? (
                      <QRCodeSVG 
                        value={dailyQR.code} 
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    ) : (
                      <div style={{ width: 256, height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.textSecondary }}>
                        No QR Code Generated for Today
                      </div>
                    )}
                  </div>
                  {dailyQR && (
                    <div style={{ marginBottom: theme.spacing.lg }}>
                      <p style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>Code:</p>
                      <h1 style={{ letterSpacing: '8px', color: theme.colors.primary }}>{dailyQR.code}</h1>
                    </div>
                  )}
                  <Button variant="primary" onClick={handleGenerateQR} style={{ width: '100%' }}>
                    <FiRefreshCw size={16} style={{ marginRight: theme.spacing.xs }} />
                    {dailyQR ? 'Regenerate Code' : 'Generate Daily Code'}
                  </Button>
                  <p style={{ marginTop: theme.spacing.md, fontSize: theme.fontSizes.xs, color: theme.colors.textLight }}>
                    Students must scan this code or enter it manually to check in.
                  </p>
                </Card>
              </div>
            )}

            <StatsGrid>
              <StatCard variant="accent">
                <StatValue>{Math.max(0, stats.todayAttendance - stats.lateCount)}</StatValue>
                <StatLabel>On time today</StatLabel>
              </StatCard>
              <StatCard style={{ background: stats.lateCount > 0 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : theme.colors.white, color: stats.lateCount > 0 ? 'white' : theme.colors.textPrimary }}>
                <StatValue>{stats.lateCount}</StatValue>
                <StatLabel>Late today</StatLabel>
              </StatCard>
              <StatCard style={{ background: stats.absentCount > 0 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : theme.colors.white, color: stats.absentCount > 0 ? 'white' : theme.colors.textPrimary }}>
                <StatValue>{stats.absentCount}</StatValue>
                <StatLabel>Absent today</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.todayAttendance}</StatValue>
                <StatLabel>Checked in (total)</StatLabel>
              </StatCard>
              <StatCard variant="primary">
                <StatValue>{stats.totalAttendees}</StatValue>
                <StatLabel>Registered students</StatLabel>
              </StatCard>
              <StatCard variant="secondary">
                <StatValue>{stats.attendanceRate}%</StatValue>
                <StatLabel>Attendance rate (today)</StatLabel>
              </StatCard>
            </StatsGrid>

            {stats.lateCount > 0 && (
              <Card
                style={{
                  marginBottom: theme.spacing.lg,
                  borderLeft: `4px solid #f59e0b`,
                  background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.08) 0%, transparent 40%)',
                }}
              >
                <CardTitle>Late arrivals today (Harare · 9:01 AM or later)</CardTitle>
                <p style={{ margin: `0 0 ${theme.spacing.md} 0`, fontSize: theme.fontSizes.sm, color: theme.colors.textSecondary }}>
                  These students checked in after the on-time window.
                  {hubScopeActive
                    ? ' You will get a toast when someone new is marked late in this hub.'
                    : ' Select a single hub above to receive late check-in alerts for that hub only.'}
                </p>
                <AttendanceList>
                  {(todayAttendanceList || [])
                    .filter((s: any) => s.isLate)
                    .map((s: any) => (
                      <AttendanceItem key={`late-${s.userId}`}>
                        <UserAvatar style={{ background: '#f59e0b' }}>{getInitials(s.userName || 'Student')}</UserAvatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: theme.fontWeights.semibold, color: theme.colors.textPrimary, fontSize: theme.fontSizes.sm }}>
                            {s.userName}
                          </div>
                          <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs }}>
                            {s.checkInTime
                              ? TimeService.getInstance().formatClockTime(new Date(s.checkInTime))
                              : '—'}
                          </div>
                          {s.lateReason ? (
                            <div
                              style={{
                                marginTop: theme.spacing.xs,
                                fontSize: theme.fontSizes.xs,
                                color: theme.colors.textPrimary,
                                lineHeight: 1.35,
                                wordBreak: 'break-word',
                              }}
                            >
                              Reason: {s.lateReason}
                            </div>
                          ) : null}
                        </div>
                      </AttendanceItem>
                    ))}
                </AttendanceList>
              </Card>
            )}

            <ContentGrid>
              <Card>
                <CardTitle>Attendance trend (last 5 school days, Harare)</CardTitle>
                <div style={{ width: '100%', height: 300, minHeight: 240, minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                    <BarChart
                      data={weeklyData.map((d: any) => ({
                        ...d,
                        absent: Math.max(0, (stats.totalAttendees || 0) - (d.present || 0))
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: theme.shadows.md }}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      />
                      <Legend iconType="circle" verticalAlign="top" align="right" height={36} />
                      <Bar dataKey="present" name="Checked in" fill={theme.colors.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" name="Not checked in" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <CardTitle>At risk (rolling 30 weekdays)</CardTitle>
                <AttendanceList>
                  {atRiskStudents.length > 0 ? (
                    atRiskStudents.map((s: any) => (
                      <AttendanceItem key={s.studentId}>
                        <UserAvatar>{getInitials(s.studentName || 'Student')}</UserAvatar>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: theme.fontWeights.medium, color: theme.colors.textPrimary, fontSize: theme.fontSizes.sm }}>
                            {s.studentName}
                          </div>
                          <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs }}>
                            {Math.round(s.attendanceRate || 0)}% attendance • {s.absent} absences
                          </div>
                        </div>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.colors.warning }} />
                      </AttendanceItem>
                    ))
                  ) : (
                    <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: theme.spacing.lg }}>
                      {atRiskLoaded
                        ? 'No students match the at-risk criteria (rate ≥85% and fewer than 3 missed weekdays).'
                        : 'Loading…'}
                    </p>
                  )}
                </AttendanceList>
              </Card>
            </ContentGrid>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: theme.spacing.lg,
              marginTop: theme.spacing.lg
            }}>
              <Card>
                <CardTitle>Quick Student List</CardTitle>
                <AttendanceList>
                  {(todayAttendanceList || [])
                    .slice()
                    .sort((a: any, b: any) => {
                      const sa = a.status === 'absent' ? 0 : (a.status === 'late' || a.isLate) ? 1 : 2;
                      const sb = b.status === 'absent' ? 0 : (b.status === 'late' || b.isLate) ? 1 : 2;
                      return sa - sb;
                    })
                    .slice(0, 8)
                    .map((s: any) => {
                      const isLateStudent = s.status === 'late' || s.isLate;
                      const statusLabel = s.status === 'absent' ? 'Absent' : isLateStudent ? 'Late' : 'Present';
                      const statusColor =
                        s.status === 'absent' ? theme.colors.warning :
                        isLateStudent ? '#f59e0b' :
                        theme.colors.success;

                      return (
                        <AttendanceItem key={s.userId}>
                          <UserAvatar>{getInitials(s.userName || 'Student')}</UserAvatar>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: theme.fontWeights.medium, color: theme.colors.textPrimary, fontSize: theme.fontSizes.sm }}>
                              {s.userName}
                            </div>
                            <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs }}>
                              {statusLabel}
                              {s.checkInTime ? ` • ${new Date(s.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </div>
                            {isLateStudent && s.lateReason ? (
                              <div
                                style={{
                                  marginTop: theme.spacing.xs,
                                  fontSize: theme.fontSizes.xs,
                                  color: theme.colors.textPrimary,
                                  lineHeight: 1.35,
                                  wordBreak: 'break-word',
                                }}
                              >
                                Late reason: {s.lateReason}
                              </div>
                            ) : null}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: theme.spacing.xs }}>
                            <div style={{ width: 8, height: 8, borderRadius: 999, background: statusColor }} />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                              {s.status === 'absent' && (
                                <Button
                                  variant="outline"
                                  type="button"
                                  disabled={!hubScopeActive}
                                  onClick={() =>
                                    setAbsenceModal({
                                      userId: s.userId,
                                      userName: s.userName,
                                      initialReason: s.absenceReason,
                                      initialNotes: s.absenceNotes,
                                    })
                                  }
                                  style={{ padding: '6px 10px', borderRadius: theme.borderRadius.md }}
                                >
                                  {s.absenceReason ? 'Edit absence' : 'Record absence'}
                                </Button>
                              )}
                              <Button
                                variant={s.status === 'absent' ? 'primary' : 'secondary'}
                                disabled={!hubScopeActive || s.status !== 'absent' || markingStudentId === s.userId}
                                onClick={() => handleMarkStudentPresent(s)}
                                style={{ padding: '6px 10px', borderRadius: theme.borderRadius.md }}
                              >
                                {s.status === 'absent' ? (markingStudentId === s.userId ? 'Marking...' : 'Mark Present') : 'Checked'}
                              </Button>
                            </div>
                          </div>
                        </AttendanceItem>
                      );
                    })}

                  {(todayAttendanceList || []).length === 0 && (
                    <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: theme.spacing.lg }}>
                      Loading today’s attendance...
                    </p>
                  )}
                </AttendanceList>
              </Card>

              <Card>
                <CardTitle>Session Info & Quick Actions</CardTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                  <div>
                    <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs }}>Current session</div>
                    <div style={{ fontWeight: theme.fontWeights.semibold, color: theme.colors.textPrimary, fontSize: theme.fontSizes.sm }}>
                      Daily Attendance • {user?.userType === 'instructor' ? 'Teacher' : 'Admin'}
                    </div>
                    <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs, marginTop: theme.spacing.xs }}>
                      {dailyQR ? `QR: ${dailyQR.code}` : 'QR will generate shortly'}
                    </div>
                  </div>

                  <div style={{ 
                    background: theme.colors.gray50,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.md
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                      <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs }}>Engagement</div>
                      <div style={{ fontWeight: theme.fontWeights.semibold, color: theme.colors.textPrimary, fontSize: theme.fontSizes.xs }}>
                        {stats.totalAttendees > 0
                          ? Math.round((stats.todayAttendance / stats.totalAttendees) * 100)
                          : 0}
                        % checked in
                      </div>
                    </div>
                    <div style={{ height: 8, background: theme.colors.gray200, borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{ 
                          width: stats.totalAttendees > 0
                            ? `${Math.round((stats.todayAttendance / stats.totalAttendees) * 100)}%`
                            : '0%',
                          height: '100%',
                          background: theme.colors.primary,
                          transition: 'width 0.35s ease'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                    <Button variant="primary" onClick={() => setShowQRModal(true)} style={{ flex: 1, minWidth: 160 }}>
                      Start Session
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleMarkAllPresent}
                      disabled={!hubScopeActive || markAllLoading || checkoutAllLoading}
                      style={{ flex: 1, minWidth: 160 }}
                    >
                      {markAllLoading ? 'Marking...' : 'Mark All Present'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCheckOutAllOpen}
                      disabled={!hubScopeActive || markAllLoading || checkoutAllLoading}
                      style={{ flex: 1, minWidth: 160, borderColor: theme.colors.gray400 }}
                    >
                      {checkoutAllLoading ? (
                        'Checking out…'
                      ) : (
                        <>
                          <FiLogOut size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                          Check out everyone
                        </>
                      )}
                    </Button>
                    <Button variant="secondary" onClick={handleDownloadAttendanceCSV} style={{ flex: 1, minWidth: 160 }}>
                      Export
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
            )}
        </div>
      </MainContent>
      
      {absenceModal && user && (
        <AbsenceRecordModal
          open
          onClose={() => setAbsenceModal(null)}
          studentId={absenceModal.userId}
          studentName={absenceModal.userName}
          dateStr={TimeService.getInstance().getCurrentDateString()}
          hubId={effectiveHub}
          recordedByUid={user.uid}
          recordedByName={user.displayName || user.email || 'Staff'}
          initialReason={absenceModal.initialReason}
          initialNotes={absenceModal.initialNotes}
          onSaved={() => {
            void loadDashboardData();
          }}
        />
      )}

      {showMasterResetModal && (
        <MasterResetModal
          onClose={() => setShowMasterResetModal(false)}
          onConfirm={async () => {
            const result = await dataService.masterReset();
            setMasterResetStats(result);
          }}
          userCount={masterResetStats.deletedUsers}
          attendanceCount={masterResetStats.deletedAttendance}
        />
      )}
    </DashboardContainer>
  );
};

export default AdminDashboard;
