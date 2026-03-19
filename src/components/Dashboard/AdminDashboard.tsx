import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { UsersPage } from '../Admin/UsersPage';
import { UncommonLogo } from '../Common/UncommonLogo';
import { StarField } from '../Common/StarField';
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
import { AttendanceAnalyticsService } from '../../services/attendanceAnalyticsService';
import { uniqueToast } from '../../utils/toastUtils';
import { saveAs } from 'file-saver';
import { ProfileUpload } from '../Profile/ProfileUpload';
import { AdminAttendanceAnalytics } from '../Analytics/AdminAttendanceAnalytics';

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
import { 
  FiLogOut, 
  FiUser, 
  FiBarChart2, 
  FiUsers,
  FiTrendingUp,
  FiMenu,
  FiX,
  FiRefreshCw,
  FiMaximize
} from 'react-icons/fi';
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

const Sidebar = styled.div<{ isOpen?: boolean }>`
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
  h1 {
    font-size: ${theme.fontSizes['3xl']};
    font-weight: ${theme.fontWeights.bold};
    color: ${theme.colors.textPrimary};
    margin: 0 0 ${theme.spacing.sm} 0;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.lg};
    
    @media (max-width: ${theme.breakpoints.tablet}) {
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
    
    @media (max-width: ${theme.breakpoints.tablet}) {
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
  
  @media (max-width: ${theme.breakpoints.tablet}) {
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

interface AdminDashboardProps {
  onNavigateToProfile?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToProfile }) => {

  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [dailyQR, setDailyQR] = useState<DailyQRCode | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const dataService = DataService.getInstance();
  const attendanceService = AttendanceService.getInstance();
  const analyticsService = AttendanceAnalyticsService.getInstance();
  const [markingStudentId, setMarkingStudentId] = useState<string | null>(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);

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
      const users = await dataService.getUsers();
      const attendance = await dataService.getAttendance();
      const timeService = TimeService.getInstance();
      const todayStr = timeService.getCurrentDateString();
      // Only today's attendance
      const todayAttendance = attendance.filter((a: any) => a.date === todayStr);
      const rows = todayAttendance.map((a: any) => {
        const userRecord = users.find((u: any) => u.id === a.studentId || u.uid === a.studentId);
        const checkInTime = a.checkInTime ? new Date(a.checkInTime) : null;
        const isLate = checkInTime && checkInTime.getHours() >= 9 && checkInTime.getMinutes() > 0;
        return [
          userRecord?.displayName || a.studentName || 'Unknown',
          a.date || '',
          checkInTime ? checkInTime.toLocaleTimeString() : '',
          a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString() : '',
          isLate ? 'Late' : 'On Time'
        ];
      });
      let csv = 'Name,Date,Check-in Time,Check-out Time,Late\n';
      csv += rows.map(r => r.map(field => `"${field}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `attendance_${todayStr}.csv`);
      uniqueToast.success('CSV downloaded!', { autoClose: 2000 });
    } catch (error) {
      console.error('Error generating attendance CSV:', error);
      uniqueToast.error('Failed to generate CSV');
    }
  };

  const handleMarkStudentPresent = async (student: any) => {
    if (!student?.userId || !student?.userName) return;
    if (markingStudentId) return;

    setMarkingStudentId(student.userId);
    try {
      await attendanceService.checkIn(student.userId, student.userName);
      uniqueToast.success(`Marked ${student.userName} as present.`);
    } catch (e) {
      console.error('Failed to mark present:', e);
      uniqueToast.error(`Failed to mark ${student.userName} as present.`);
    } finally {
      setMarkingStudentId(null);
    }
  };

  const handleMarkAllPresent = async () => {
    if (markAllLoading) return;
    const targets = (todayAttendanceList || [])
      .filter((s: any) => s.status === 'absent' && s.userId && s.userName)
      .slice(0, 50);

    if (targets.length === 0) {
      uniqueToast.info('No absent students to mark present.');
      return;
    }

    setMarkAllLoading(true);
    try {
      // Batch to reduce Firestore write pressure.
      const batchSize = 5;
      for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        await Promise.all(batch.map((s: any) => attendanceService.checkIn(s.userId, s.userName)));
      }
      uniqueToast.success('Marked absent students as present.');
    } catch (e) {
      console.error('Failed to mark all present:', e);
      uniqueToast.error('Failed to mark all present.');
    } finally {
      setMarkAllLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      uniqueToast.info('Loading dashboard data...', { autoClose: 2000 });
      // Test connection and load stats
      await dataService.testConnection();
      
      const users = await dataService.getUsers();
      // Backward compat: some legacy users may not have userType set; treat them as students.
      const students = users.filter((u: any) => !u.userType || u.userType === 'attendee');
      
      const dashboardStats = await dataService.getDashboardStats();
      
      setStats({
        totalAttendees: dashboardStats.totalAttendees,
        totalInstructors: dashboardStats.totalInstructors,
        todayAttendance: dashboardStats.todayAttendance,
        lateCount: dashboardStats.lateCount || 0,
        absentCount: dashboardStats.totalAttendees - (dashboardStats.todayAttendance || 0),
        attendanceRate: Math.round((dashboardStats.todayAttendance / (dashboardStats.totalAttendees || 1)) * 100)
      });
      
      // Load weekly data
      const attendance = await dataService.getAttendance();
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const weeklyTrends = last7Days.map(date => {
        const dayAttendance = attendance.filter((a: any) => a.date === date);
        return {
          name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          present: dayAttendance.length,
          late: dayAttendance.filter((a: any) => {
            const checkIn = a.checkInTime ? new Date(a.checkInTime) : null;
            return checkIn && (checkIn.getHours() > 9 || (checkIn.getHours() === 9 && checkIn.getMinutes() > 0));
          }).length
        };
      });
      setWeeklyData(weeklyTrends);

      // At-risk students (low attendance) for the dashboard side panel.
      try {
        const range = analyticsService.getDefaultRange('week');
        const analytics = await analyticsService.getAdminAnalytics(range);
        const atRisk = analytics.mostAbsent
          .filter((r: any) => r.attendanceRate < 85 || r.absent >= 3)
          .slice(0, 5);
        setAtRiskStudents(atRisk);
      } catch (e) {
        console.error('Failed to load at-risk students:', e);
      }

      uniqueToast.success('Dashboard data loaded successfully!', { autoClose: 2000 });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      uniqueToast.error('Failed to load some data, using fallback');
      
      // Fallback data
      setStats({
        totalAttendees: 25,
        totalInstructors: 5,
        todayAttendance: 18,
        lateCount: 3,
        absentCount: 7,
        attendanceRate: 72
      });
    }
  };

  useEffect(() => {
    // Subscribe to today's attendance in real-time
    console.log('📊 AdminDashboard: Subscribing to real-time attendance...');
    const unsubscribeAttendance = dataService.subscribeToTodayAttendance((summary) => {
      console.log('🔄 AdminDashboard: Received real-time attendance update:', summary);
      
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
    });

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
  }, []);

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
          <div style={{ padding: theme.spacing.lg }}>
            <UsersPage onBack={() => setActiveNav('dashboard')} onChat={handleChatFromUsers} />
          </div>
        );
      case 'profile':
        return (
          <div style={{ padding: 0 }}>
            <ProfileUpload />
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
        <UncommonLogo size="sm" showSubtitle={false} />
        <MobileMenuButton onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </MobileMenuButton>
      </MobileHeader>
      
      <MobileOverlay isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />
      
      <Sidebar isOpen={mobileMenuOpen}>
        <StarField />
        <Logo>
          <UncommonLogo size="sm" showSubtitle={false} />
        </Logo>
        
      <NavItem active={activeNav === 'dashboard'} onClick={() => handleNavClick('dashboard')}>
        <FiBarChart2 size={20} />
        {user?.userType === 'instructor' ? 'Instructor Dashboard' : 'Admin Dashboard'}
      </NavItem>
      <NavItem active={activeNav === 'analytics'} onClick={() => handleNavClick('analytics')}>
        <FiTrendingUp size={20} />
        Analytics
      </NavItem>
      <NavItem active={activeNav === 'users'} onClick={() => handleNavClick('users')}>
        <FiUsers size={20} />
        Users
      </NavItem>
      <NavItem active={activeNav === 'profile'} onClick={() => handleNavClick('profile')}>
        <FiUser size={20} />
        My Profile
      </NavItem>
        
      <div style={{ marginTop: 'auto', paddingTop: theme.spacing.xl }}>
        {onNavigateToProfile && (
          <NavItem onClick={onNavigateToProfile}>
            <FiUser size={20} />
            Profile
            </NavItem>
          )}
          <NavItem onClick={logout}>
            <FiLogOut size={20} />
            Logout
          </NavItem>
        </div>
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
                <StatValue>{stats.todayAttendance}</StatValue>
                <StatLabel>Present Today</StatLabel>
              </StatCard>
              <StatCard style={{ background: stats.absentCount > 0 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : theme.colors.white, color: stats.absentCount > 0 ? 'white' : theme.colors.textPrimary }}>
                <StatValue>{stats.absentCount}</StatValue>
                <StatLabel>Absent Today</StatLabel>
              </StatCard>
              <StatCard style={{ background: stats.lateCount > 0 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : theme.colors.white, color: stats.lateCount > 0 ? 'white' : theme.colors.textPrimary }}>
                <StatValue>{stats.lateCount}</StatValue>
                <StatLabel>Late Arrivals</StatLabel>
              </StatCard>
              <StatCard variant="primary">
                <StatValue>{(stats.todayAttendance || 0) + (stats.lateCount || 0)}</StatValue>
                <StatLabel>Active Students</StatLabel>
              </StatCard>
              <StatCard variant="secondary">
                <StatValue>{stats.attendanceRate}%</StatValue>
                <StatLabel>Attendance Rate</StatLabel>
              </StatCard>
            </StatsGrid>

            <ContentGrid>
              <Card>
                <CardTitle>Attendance Trend (This Week)</CardTitle>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={weeklyData.map((d: any) => ({
                        ...d,
                        absent: Math.max(
                          0,
                          (stats.totalAttendees || 0) - ((d.present || 0) + (d.late || 0))
                        )
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
                      <Bar dataKey="present" name="Present" fill={theme.colors.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <CardTitle>At Risk Students</CardTitle>
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
                      Loading at-risk data...
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
                      const sa = a.status === 'absent' ? 0 : a.status === 'late' ? 1 : 2;
                      const sb = b.status === 'absent' ? 0 : b.status === 'late' ? 1 : 2;
                      return sa - sb;
                    })
                    .slice(0, 8)
                    .map((s: any) => {
                      const statusLabel = s.status === 'absent' ? 'Absent' : s.status === 'late' ? 'Late' : 'Present';
                      const statusColor =
                        s.status === 'absent' ? theme.colors.warning :
                        s.status === 'late' ? '#f59e0b' :
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
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: theme.spacing.xs }}>
                            <div style={{ width: 8, height: 8, borderRadius: 999, background: statusColor }} />
                            <Button
                              variant={s.status === 'absent' ? 'primary' : 'secondary'}
                              disabled={s.status !== 'absent' || markingStudentId === s.userId}
                              onClick={() => handleMarkStudentPresent(s)}
                              style={{ padding: '6px 10px', borderRadius: theme.borderRadius.md }}
                            >
                              {s.status === 'absent' ? (markingStudentId === s.userId ? 'Marking...' : 'Mark Present') : 'Checked'}
                            </Button>
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
                          ? Math.round(((stats.todayAttendance + stats.lateCount) / stats.totalAttendees) * 100)
                          : 0}
                        % active
                      </div>
                    </div>
                    <div style={{ height: 8, background: theme.colors.gray200, borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{ 
                          width: stats.totalAttendees > 0
                            ? `${Math.round(((stats.todayAttendance + stats.lateCount) / stats.totalAttendees) * 100)}%`
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
                      disabled={markAllLoading}
                      style={{ flex: 1, minWidth: 160 }}
                    >
                      {markAllLoading ? 'Marking...' : 'Mark All Present'}
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
          </motion.div>
        </AnimatePresence>
      </MainContent>
    </DashboardContainer>
  );
};

export default AdminDashboard;
