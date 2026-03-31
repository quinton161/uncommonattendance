import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import DataService from '../../services/DataService';
import { TimeService } from '../../services/timeService';
import { AttendanceService } from '../../services/attendanceService';
import { DeleteUserModal } from './DeleteUserModal';
import { uniqueToast } from '../../utils/toastUtils';
import {
  PersonIcon,
  CheckCircleIcon,
  TodayIcon,
  SearchIcon
} from '../Common/Icons';
import { FiLogOut } from 'react-icons/fi';
const PageContainer = styled.div`
  padding: ${theme.spacing.xl};
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  min-height: 100vh;
  background: ${theme.colors.backgroundSecondary};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.sm};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.lg};
  border-bottom: 2px solid ${theme.colors.primary};
  gap: ${theme.spacing.md};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    margin-bottom: ${theme.spacing.lg};
    padding-bottom: ${theme.spacing.md};
  }
`;

/** Search is redundant with hamburger + fewer pixels on phones/tablets in portrait. */
const SearchWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 320px;

  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  min-width: 0;

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const DesktopOnly = styled.div`
  display: inline-flex;
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }
`;

const HeaderTitle = styled.div`
  h1 {
    font-family: ${theme.fonts.heading};
    font-size: ${theme.fontSizes['3xl']};
    font-weight: ${theme.fontWeights.bold};
    color: ${theme.colors.primary};
    margin: 0 0 ${theme.spacing.sm} 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
  
  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
    font-size: ${theme.fontSizes.lg};
  }
`;



const StatusDot = styled.span<{ $isActive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: ${theme.spacing.xs};
  background: ${props => props.$isActive ? '#16a34a' : '#9ca3af'};
  box-shadow: ${props => props.$isActive ? '0 0 6px rgba(34, 197, 94, 0.4)' : 'none'};
`;

const CardSection = styled.div`
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.gray100};
  margin-top: ${theme.spacing.md};
`;

const TimeCell = styled.span`
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textPrimary};
  font-variant-numeric: tabular-nums;
  font-size: ${theme.fontSizes.sm};
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: minmax(200px, 2fr) 100px minmax(100px, 120px) minmax(88px, 1fr) minmax(88px, 1fr) minmax(160px,auto);
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.gray100};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  align-items: center;
  min-width: 0;
  box-sizing: border-box;
  min-height: 72px;
  border-left: 4px solid transparent;
  
  &:hover {
    background: white;
    transform: translateX(4px);
    box-shadow: ${theme.shadows.md};
    border-left: 4px solid ${theme.colors.primary};
    z-index: 1;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }
`;

const UserAvatar = styled.div<{ $isActive?: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: ${theme.borderRadius.full};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryLight} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.white};
  font-weight: ${theme.fontWeights.semibold};
  font-size: ${theme.fontSizes.sm};
  border: 2px solid ${props => props.$isActive ? '#16a34a' : 'transparent'};
  box-shadow: ${props => props.$isActive ? '0 0 0 2px #dcfce7' : 'none'};
  transition: all 0.3s ease;
  position: relative;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const UserType = styled.div<{ type: string }>`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    switch (props.type) {
      case 'admin':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        `;
      case 'instructor':
        return `
          background: rgba(251, 191, 36, 0.1);
          color: #d97706;
        `;
      case 'attendee':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        `;
      default:
        return `
          background: ${theme.colors.gray100};
          color: ${theme.colors.textSecondary};
        `;
    }
  }}
`;

const UsersTable = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.lg};
  overflow: hidden;
  border: 1px solid ${theme.colors.gray100};
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(200px, 2fr) 100px minmax(100px, 120px) minmax(88px, 1fr) minmax(88px, 1fr) minmax(160px,auto);
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.gray200};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 0;
  align-items: center;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing['3xl']};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.lg};
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

const DeleteButton = styled(Button)`
  color: #dc2626;
  border-color: #dc2626;
  
  &:hover {
    background: #dc2626;
    color: white;
    border-color: #dc2626;
  }
`;

const SearchInput = styled.input`
  padding: ${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} 40px;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.gray300};
  font-size: ${theme.fontSizes.sm};
  width: 100%;
  box-sizing: border-box;
  background: ${theme.colors.white};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}20;
  }
`;

const MarkPresentButton = styled(Button)`
  background: ${theme.colors.success};
  border-color: ${theme.colors.success};
  color: white;
  padding: 8px 16px;
  font-size: ${theme.fontSizes.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 120px;
  
  &:hover {
    background: #16a34a;
    border-color: #16a34a;
  }
   
  span {
    display: inline !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const UserDetails = styled.div`
  h4 {
    margin: 0;
    font-size: ${theme.fontSizes.base};
    font-weight: 600;
    color: ${theme.colors.textPrimary};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
  }
  p {
    margin: ${theme.spacing.xs} 0 0;
    font-size: ${theme.fontSizes.sm};
    color: ${theme.colors.textSecondary};
  }
`;

const MobileUserCard = styled.div`
  display: none;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: block;
    background: ${theme.colors.white};
    border-radius: ${theme.borderRadius.lg};
    padding: ${theme.spacing.lg};
    margin-bottom: ${theme.spacing.md};
    box-shadow: ${theme.shadows.sm};
    border: 1px solid ${theme.colors.gray200};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
    border-radius: ${theme.borderRadius.md};
  }
`;

const MobileUserHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    gap: ${theme.spacing.sm};
    margin-bottom: ${theme.spacing.sm};
  }
`;

const MobileUserDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
  font-size: ${theme.fontSizes.sm};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.xs};
    font-size: ${theme.fontSizes.xs};
  }
`;

const MobileTimesRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
  padding: ${theme.spacing.sm} 0;
  border-top: 1px solid ${theme.colors.gray100};
  font-size: ${theme.fontSizes.sm};

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    font-size: ${theme.fontSizes.xs};
  }
`;

const MobileTimeBlock = styled.div`
  strong {
    display: block;
    color: ${theme.colors.textSecondary};
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
`;

// MobileUserActions styled component removed (unused) to satisfy CI linting.

const DesktopTable = styled.div`
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }
`;

const UserTypeTag = styled.span<{ type: string }>`
  display: inline-block;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.medium};
  text-transform: capitalize;
  
  ${props => {
    switch (props.type) {
      case 'admin':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        `;
      case 'instructor':
        return `
          background: rgba(251, 191, 36, 0.1);
          color: #d97706;
        `;
      default:
        return `
          background: rgba(6, 71, 161, 0.1);
          color: ${theme.colors.primary};
        `;
    }
  }}
`;

const StatusBadge = styled.span<{ $isActive: boolean }>`
  display: inline-block;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => props.$isActive ? `
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
  ` : `
    background: rgba(107, 114, 128, 0.1);
    color: #6b7280;
  `}
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
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${theme.colors.gray200};
  text-align: center;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.sm};
  }
`;

const StatIcon = styled.div`
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.md};
  display: flex;
  justify-content: center;
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    margin-bottom: ${theme.spacing.sm};
  }
`;

const StatValue = styled.div`
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.xs};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${theme.fontSizes['2xl']};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xl};
  }
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  font-weight: ${theme.fontWeights.medium};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xs};
  }
`;

const StatsCaption = styled.p`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  margin: 0 0 ${theme.spacing.md} 0;
  line-height: 1.45;
  max-width: 52rem;
`;

function toDateSafe(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

interface UsersPageProps {
  onBack?: () => void;
  onChat?: (studentId: string, studentName: string, studentPhotoUrl?: string) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onBack, onChat }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutAllLoading, setCheckoutAllLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dataService = DataService.getInstance();

  useEffect(() => {
    // Intentionally run only once on mount; loadData handles its own dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await dataService.testConnection();
      
      const [usersData, attendanceData] = await Promise.all([
        dataService.getUsers(),
        dataService.getAttendance()
      ]);
      
      setUsers(usersData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
      uniqueToast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const ts = TimeService.getInstance();
  const formatAttTime = (value: any): string | null => {
    const d = toDateSafe(value);
    return d ? ts.formatClockTime(d) : null;
  };

  const getTodayAttendance = (userId: string) => {
    const today = ts.getCurrentDateString();
    const matchesToday = (a: any) => {
      const sid = a.studentId || a.userId;
      if (sid !== userId) return false;
      if (a.date) return a.date === today;
      const ci = toDateSafe(a.checkInTime);
      if (!ci) return false;
      return ts.toHarareDateString(ci) === today;
    };
    const todays = attendance.filter(matchesToday);
    if (todays.length === 0) return undefined;
    return todays.sort((a, b) => {
      const ta = toDateSafe(a.checkInTime)?.getTime() ?? 0;
      const tb = toDateSafe(b.checkInTime)?.getTime() ?? 0;
      return tb - ta;
    })[0];
  };

  // getUserStats and formatTime were previously defined but unused helpers.
  // They have been removed to keep CI linting happy.
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const attendees = useMemo(() => users.filter((u) => u.userType === 'attendee'), [users]);
  const filteredAttendees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return attendees;
    return attendees.filter((u) => {
      const name = (u.displayName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [attendees, searchTerm]);

  if (user?.userType !== 'admin' && user?.userType !== 'instructor') {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
          <h2>Access Denied</h2>
          <p>Only administrators and instructors can access this page.</p>
          {onBack && (
            <Button variant="primary" onClick={onBack}>
              Back to Dashboard
            </Button>
          )}
        </div>
      </PageContainer>
    );
  }

  // const stats = getUserStats(); // no longer used

  const handleOpenDelete = (user: any) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleMarkPresent = async (studentId: string, studentName: string) => {
    try {
      // Use AttendanceService with skipTimeCheck=true to allow marking after deadline
      const attendanceService = AttendanceService.getInstance();
      await attendanceService.checkIn(studentId, studentName, undefined, undefined, true, 'admin');
      uniqueToast.success(`${studentName} marked as present!`);
      // Refresh the attendance data
      loadData();
    } catch (error) {
      console.error('Failed to mark present:', error);
      uniqueToast.error(`Failed to mark ${studentName} as present`);
    }
  };

  const handleCloseDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await dataService.deleteUser(userToDelete.id);
      uniqueToast.success('User deleted successfully!');
      await loadData();
    } catch (error) {
      uniqueToast.error('Failed to delete user');
    }
  };

  const handleMarkAllPresent = async () => {
    const absentStudents = users.filter(userData => {
      if (userData.userType === 'admin' || userData.userType === 'instructor') return false;
      const uid = userData.id || userData.uid;
      const todayAttendance = getTodayAttendance(uid);
      const isPresent = todayAttendance && todayAttendance.checkInTime && !todayAttendance.checkOutTime;
      return !isPresent;
    });

    if (absentStudents.length === 0) {
      uniqueToast.info('All students are already marked as present.');
      return;
    }

    if (!window.confirm(`Are you sure you want to mark all ${absentStudents.length} absent students as present?`)) {
      return;
    }

    setLoading(true);
    try {
      // Use AttendanceService with skipTimeCheck=true to allow marking after deadline
      const attendanceService = AttendanceService.getInstance();
      const promises = absentStudents.map(student =>
        attendanceService.checkIn(
          student.id || student.uid,
          student.displayName || 'Unknown User',
          undefined,
          undefined,
          true,
          'admin'
        )
      );
      await Promise.all(promises);
      uniqueToast.success(`Marked ${absentStudents.length} students as present!`);
      loadData();
    } catch (error) {
      console.error('Failed to mark all present:', error);
      uniqueToast.error('Failed to mark all students as present');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOutAllOpen = async () => {
    if (checkoutAllLoading || loading) return;
    if (
      !window.confirm(
        'Check out everyone who is still checked in today (sets check-out time to now, Harare)?'
      )
    ) {
      return;
    }
    setCheckoutAllLoading(true);
    try {
      const { checkedOut } = await AttendanceService.getInstance().checkOutAllOpenToday();
      uniqueToast.success(
        checkedOut === 0 ? 'No open sessions to close.' : `Checked out ${checkedOut} student(s).`
      );
      await loadData();
    } catch (error) {
      console.error('Failed to check out all:', error);
      uniqueToast.error('Failed to check out everyone.');
    } finally {
      setCheckoutAllLoading(false);
    }
  };

  const presentNowCount = attendees.filter(u => {
    const uid = u.id || u.uid;
    const t = getTodayAttendance(uid);
    return !!(t?.checkInTime && !t?.checkOutTime);
  }).length;
  const checkedInTodayCount = attendees.filter(u => {
    const uid = u.id || u.uid;
    return !!getTodayAttendance(uid)?.checkInTime;
  }).length;
  const instructorCount = users.filter(u => u.userType === 'instructor').length;

  return (
    <PageContainer>
      <Header>
        <HeaderTitle>
          <h1 style={{ margin: 0, lineHeight: 1.2 }}>Users</h1>
          <p>Manage students below; admins are hidden. Summary cards count students only (instructors have their own card). Check-in and check-out times use Africa/Harare (school time).</p>
        </HeaderTitle>
        <HeaderActions>
          <Button
            variant="primary"
            onClick={handleMarkAllPresent}
            disabled={loading || checkoutAllLoading}
            style={{ backgroundColor: theme.colors.success, borderColor: theme.colors.success }}
          >
            <CheckCircleIcon size={18} /> Mark All Present
          </Button>
          <Button
            variant="outline"
            onClick={handleCheckOutAllOpen}
            disabled={loading || checkoutAllLoading}
          >
            <FiLogOut size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {checkoutAllLoading ? 'Checking out…' : 'Check out everyone'}
          </Button>
          <SearchWrap>
            <SearchIcon
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.colors.textSecondary,
              }}
            />
            <SearchInput
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search users"
            />
          </SearchWrap>
          {onBack && (
            <DesktopOnly>
              <Button variant="outline" onClick={onBack}>
                Back to Dashboard
              </Button>
            </DesktopOnly>
          )}
        </HeaderActions>
      </Header>

      <StatsCaption>
        Student totals match the list (attendees only). “Checked in today” includes anyone who checked in at least once today, even if they have since checked out. “Currently present” means checked in and not checked out yet.
      </StatsCaption>
      <StatsGrid>
        <StatCard>
          <StatIcon><PersonIcon size={32} /></StatIcon>
          <StatValue>{attendees.length}</StatValue>
          <StatLabel>Students</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon><CheckCircleIcon size={32} /></StatIcon>
          <StatValue>{presentNowCount}</StatValue>
          <StatLabel>Currently Present</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon><TodayIcon size={32} /></StatIcon>
          <StatValue>{checkedInTodayCount}</StatValue>
          <StatLabel>Checked In Today</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon><PersonIcon size={32} /></StatIcon>
          <StatValue>{instructorCount}</StatValue>
          <StatLabel>Instructors</StatLabel>
        </StatCard>
      </StatsGrid>

      {loading ? (
        <LoadingState>
          Loading users...
        </LoadingState>
      ) : attendees.length === 0 ? (
        <EmptyState>
          <h3>No Manageable Users Found</h3>
          <p>No attendees are registered in the system yet. Admin and instructor accounts are protected and not shown here.</p>
        </EmptyState>
      ) : filteredAttendees.length === 0 ? (
        <EmptyState>
          <h3>No matches</h3>
          <p>No students match your search. Clear the search or try another name or email.</p>
        </EmptyState>
      ) : (
        <>
          <DesktopTable>
            <UsersTable>
              <TableWrapper>
                <TableHeader>
                  <div>User Information</div>
                  <div>Type</div>
                  <div>Today</div>
                  <div>Check-in</div>
                  <div>Check-out</div>
                  <div style={{ textAlign: 'right' }}>Actions</div>
                </TableHeader>
          
          {filteredAttendees.map((userData) => {
            const uid = userData.id || userData.uid;
            const todayAttendance = getTodayAttendance(uid);
            const hasIn = !!todayAttendance?.checkInTime;
            const hasOut = !!todayAttendance?.checkOutTime;
            const isCheckedInNow = hasIn && !hasOut;
            const statusLabel = !hasIn ? 'Not present' : hasOut ? 'Checked out' : 'Checked in';
            const checkInDisp = formatAttTime(todayAttendance?.checkInTime) ?? '—';
            const checkOutDisp = formatAttTime(todayAttendance?.checkOutTime) ?? '—';

            return (
              <TableRow key={userData.id}>
                <UserInfo>
                  <UserAvatar $isActive={!!isCheckedInNow}>
                    {userData.photoUrl ? (
                      <img src={userData.photoUrl} alt={userData.displayName} />
                    ) : (
                      getInitials(userData.displayName || 'Unknown')
                    )}
                  </UserAvatar>
                  <UserDetails>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                      <PersonIcon size={14} style={{ color: theme.colors.primary }} />
                      {userData.displayName || 'Unknown User'}
                    </h4>
                    <p>{userData.email}</p>
                  </UserDetails>
                </UserInfo>

                <div>
                  <UserType type={userData.userType}>
                    {userData.userType}
                  </UserType>
                </div>

                <div>
                  <StatusBadge $isActive={!!isCheckedInNow}>
                    <StatusDot $isActive={!!isCheckedInNow} />
                    {statusLabel}
                  </StatusBadge>
                </div>

                <div>
                  <TimeCell>{checkInDisp}</TimeCell>
                </div>
                <div>
                  <TimeCell>{checkOutDisp}</TimeCell>
                </div>

                <ActionButtons style={{ justifyContent: 'flex-end' }}>
                  <MarkPresentButton onClick={() => handleMarkPresent(uid, userData.displayName || 'Unknown User')}>
                    <CheckCircleIcon size={14} /> <span>Mark Present</span>
                  </MarkPresentButton>
                  {user?.userType === 'admin' && (
                    <DeleteButton variant="ghost" onClick={() => handleOpenDelete(userData)}>
                      Delete
                    </DeleteButton>
                  )}
                </ActionButtons>
              </TableRow>
            );
          })}
              </TableWrapper>
            </UsersTable>
          </DesktopTable>
          
          {/* Mobile Card Layout */}
          <div style={{ display: 'block', width: '100%', minWidth: 0 }}>
            {filteredAttendees.map((userData) => {
              const uid = userData.id || userData.uid;
              const todayAttendance = getTodayAttendance(uid);
              const hasIn = !!todayAttendance?.checkInTime;
              const hasOut = !!todayAttendance?.checkOutTime;
              const isCheckedInNow = hasIn && !hasOut;
              const statusLabel = !hasIn ? 'Not present' : hasOut ? 'Checked out' : 'Checked in';
              const checkInDisp = formatAttTime(todayAttendance?.checkInTime) ?? '—';
              const checkOutDisp = formatAttTime(todayAttendance?.checkOutTime) ?? '—';

              return (
                <MobileUserCard key={`mobile-${userData.id}`}>
                  <MobileUserHeader>
                    <UserAvatar $isActive={!!isCheckedInNow}>
                      {userData.photoUrl ? (
                        <img 
                          src={userData.photoUrl} 
                          alt={userData.displayName} 
                        />
                      ) : (
                        getInitials(userData.displayName || 'Unknown')
                      )}
                    </UserAvatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.sm }}>
                        <h4 style={{ margin: 0, fontSize: theme.fontSizes.base, fontWeight: theme.fontWeights.bold, display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                          <PersonIcon size={14} style={{ color: theme.colors.primary }} />
                          {userData.displayName || 'Unknown User'}
                        </h4>
                        <StatusBadge $isActive={!!isCheckedInNow} style={{ flexShrink: 0 }}>
                          <StatusDot $isActive={!!isCheckedInNow} />
                          {statusLabel}
                        </StatusBadge>
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary }}>
                        {userData.email}
                      </p>
                    </div>
                  </MobileUserHeader>
                  
                  <MobileUserDetails style={{ marginBottom: theme.spacing.sm, gridTemplateColumns: '1fr' }}>
                    <div>
                      <strong style={{ color: theme.colors.textSecondary, fontSize: '10px', textTransform: 'uppercase' }}>Type</strong><br />
                      <UserTypeTag type={userData.userType} style={{ marginTop: '4px' }}>
                        {userData.userType}
                      </UserTypeTag>
                    </div>
                  </MobileUserDetails>

                  <MobileTimesRow>
                    <MobileTimeBlock>
                      <strong>Check-in</strong>
                      {checkInDisp}
                    </MobileTimeBlock>
                    <MobileTimeBlock>
                      <strong>Check-out</strong>
                      {checkOutDisp}
                    </MobileTimeBlock>
                  </MobileTimesRow>

                  <CardSection>
                    <ActionButtons>
                      <MarkPresentButton onClick={() => handleMarkPresent(uid, userData.displayName || 'Unknown User')} style={{ flex: 1 }}>
                        <CheckCircleIcon size={14} /> <span>Mark Present</span>
                      </MarkPresentButton>
                      {user?.userType === 'admin' && (
                        <DeleteButton variant="outline" size="sm" onClick={() => handleOpenDelete(userData)}>
                          Delete
                        </DeleteButton>
                      )}
                    </ActionButtons>
                  </CardSection>
                </MobileUserCard>
              );
            })}
          </div>
        </>
      )}
      {showDeleteModal && userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onClose={handleCloseDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </PageContainer>
  );
};
