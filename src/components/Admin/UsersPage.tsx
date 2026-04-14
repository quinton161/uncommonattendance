import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import DataService from '../../services/DataService';
import {
  effectiveStaffHubScope,
  resolvedHubLabel,
  staffMayAccessHubForWrite,
} from '../../services/hubService';
import { AdminHubScopeSelect } from './AdminHubScopeSelect';
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
import { FiLogOut, FiLock, FiAlertTriangle } from 'react-icons/fi';
import { isAdminEmail } from '../../constants/admin';

function formatInstructorLastLogin(row: any): string {
  const v = row?.lastLoginAt;
  if (!v) return '—';
  try {
    const d = typeof v?.toDate === 'function' ? v.toDate() : v instanceof Date ? v : null;
    if (!d || Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-GB', { timeZone: 'Africa/Harare', dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

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
  grid-template-columns: minmax(180px, 2fr) minmax(100px, 1.2fr) 100px minmax(100px, 120px) minmax(88px, 1fr) minmax(88px, 1fr) minmax(160px,auto);
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
  grid-template-columns: minmax(180px, 2fr) minmax(100px, 1.2fr) 100px minmax(100px, 120px) minmax(88px, 1fr) minmax(88px, 1fr) minmax(160px,auto);
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

/** 5-column layout: name, hub, last sign-in, type badge, actions (stacked so buttons never bleed over Type). */
const InstructorTableHeader = styled(TableHeader)`
  grid-template-columns:
    minmax(200px, 2fr)
    minmax(110px, 1fr)
    minmax(140px, 1.1fr)
    minmax(120px, 0.65fr)
    minmax(200px, 1.25fr);
`;

const InstructorTableRow = styled(TableRow)`
  grid-template-columns:
    minmax(200px, 2fr)
    minmax(110px, 1fr)
    minmax(140px, 1.1fr)
    minmax(120px, 0.65fr)
    minmax(200px, 1.25fr);

  & > *:nth-child(1),
  & > *:nth-child(2),
  & > *:nth-child(3) {
    min-width: 0;
  }

  & > *:nth-child(4) {
    min-width: 120px;
    position: relative;
    z-index: 2;
    background: ${theme.colors.white};
  }

  & > *:nth-child(5) {
    min-width: 0;
    position: relative;
    z-index: 1;
    justify-self: end;
    width: 100%;
    max-width: 100%;
  }

  &:hover > *:nth-child(4) {
    background: ${theme.colors.white};
  }
`;

/** Type badge sits in its own column — keeps “INSTRUCTOR” from sitting under action buttons. */
const InstructorTypeCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const InstructorActionButtons = styled(ActionButtons)`
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: ${theme.spacing.sm};
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
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
  const { user, resetPassword } = useAuth();
  const [resetSending, setResetSending] = useState<string | null>(null);
  const [adminHubFilter, setAdminHubFilter] = useState('');
  const effectiveHub = useMemo(() => effectiveStaffHubScope(user, adminHubFilter), [user, adminHubFilter]);
  const hubScopeActive = Boolean(effectiveHub);
  const [users, setUsers] = useState<any[]>([]);
  /** All instructors (every hub) — only populated for admins. */
  const [allInstructors, setAllInstructors] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutAllLoading, setCheckoutAllLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [invalidUncommonLoading, setInvalidUncommonLoading] = useState(false);
  const dataService = DataService.getInstance();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await dataService.testConnection();

      const isAdmin = user?.userType === 'admin';
      const [usersData, attendanceData, instructorsEveryHub] = await Promise.all([
        dataService.getUsers(effectiveHub),
        dataService.getAttendance(undefined, effectiveHub),
        isAdmin ? dataService.getInstructors() : Promise.resolve([] as any[]),
      ]);

      setUsers(usersData);
      setAttendance(attendanceData);
      if (isAdmin) {
        setAllInstructors(
          instructorsEveryHub.filter((row: any) => row.email && !isAdminEmail(row.email))
        );
      } else {
        setAllInstructors([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      uniqueToast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [dataService, effectiveHub, user?.userType]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  const instructorRows = useMemo(() => {
    const inst =
      user?.userType === 'admin'
        ? allInstructors
        : users.filter((u) => u.userType === 'instructor' && u.email && !isAdminEmail(u.email));
    const q = searchTerm.trim().toLowerCase();
    if (!q) return inst;
    return inst.filter((u) => {
      const name = (u.displayName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [user?.userType, allInstructors, users, searchTerm]);

  const handleSendPasswordReset = async (email: string) => {
    if (!email) return;
    setResetSending(email);
    try {
      await resetPassword(email);
      uniqueToast.success(`Password reset email sent to ${email}. They can set a new password from the link or paste the code on the reset page.`);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: string }).message)
          : 'Could not send reset email.';
      uniqueToast.error(msg);
    } finally {
      setResetSending(null);
    }
  };

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

  const instructorCanDeleteStudent = (target: any): boolean => {
    if (user?.userType !== 'instructor') return false;
    if (target?.userType === 'admin' || target?.userType === 'instructor') return false;
    return staffMayAccessHubForWrite(user, target?.hubId);
  };

  const handleOpenDelete = (target: any) => {
    if (user?.userType === 'instructor' && !instructorCanDeleteStudent(target)) {
      uniqueToast.error('You can only remove students registered in your hub.');
      return;
    }
    setUserToDelete(target);
    setShowDeleteModal(true);
  };

  const handleMarkPresent = async (studentId: string, studentName: string, targetHubId?: string) => {
    if (user?.userType === 'instructor' && !staffMayAccessHubForWrite(user, targetHubId)) {
      uniqueToast.error('You can only record attendance for students in your hub.');
      return;
    }
    try {
      // Use AttendanceService with skipTimeCheck=true to allow marking after deadline
      const attendanceService = AttendanceService.getInstance();
      await attendanceService.checkIn(
        studentId,
        studentName,
        undefined,
        undefined,
        true,
        user?.userType === 'instructor' ? 'instructor' : 'admin',
        effectiveHub
      );
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
    if (user?.userType === 'instructor' && !instructorCanDeleteStudent(userToDelete)) {
      uniqueToast.error('You can only remove students in your hub.');
      setShowDeleteModal(false);
      return;
    }
    const targetId = (userToDelete.uid || userToDelete.id || '').trim();
    if (!targetId) {
      uniqueToast.error('Could not resolve this account. Refresh the page and try again.');
      throw new Error('Missing user id');
    }
    try {
      await dataService.deleteUser(targetId, { actingUser: user ?? undefined });
      await loadData();
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: string }).code)
          : '';
      if (code === 'permission-denied') {
        uniqueToast.error('You do not have permission to delete this account.');
        throw error;
      }
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : 'Failed to delete user.';
      uniqueToast.error(msg.includes('Missing') ? msg : `${msg} Check your connection or permissions.`);
      throw error;
    }
  };

  const handleMarkAllPresent = async () => {
    if (!hubScopeActive) {
      uniqueToast.info('Select a single hub so bulk actions apply to that hub only.');
      return;
    }
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
          user?.userType === 'instructor' ? 'instructor' : 'admin',
          effectiveHub
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
    if (!hubScopeActive) {
      uniqueToast.info('Select a single hub so check-out applies to that hub only.');
      return;
    }
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
      const { checkedOut } = await AttendanceService.getInstance().checkOutAllOpenToday(effectiveHub);
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
  const instructorCount =
    user?.userType === 'admin' ? allInstructors.length : users.filter((u) => u.userType === 'instructor').length;

  return (
    <PageContainer>
      <Header>
        <HeaderTitle>
          <h1 style={{ margin: 0, lineHeight: 1.2 }}>Users</h1>
          <p>
          Manage students below; admins are hidden. Summary cards count students only (instructors have their own card). Check-in and check-out times use Africa/Harare (school time).
          {user?.userType === 'admin' && ' As an admin, use Hub to view one location or all hubs.'}
          {user?.userType === 'instructor' &&
            ' Instructors can remove students only from their own hub (attendees and students).'}
        </p>
        </HeaderTitle>
        <HeaderActions>
          <AdminHubScopeSelect
            user={user}
            value={adminHubFilter}
            onChange={setAdminHubFilter}
            id="users-page-hub-filter"
          />
          <Button
            variant="primary"
            onClick={handleMarkAllPresent}
            disabled={!hubScopeActive || loading || checkoutAllLoading}
            style={{ backgroundColor: theme.colors.success, borderColor: theme.colors.success }}
          >
            <CheckCircleIcon size={18} /> Mark All Present
          </Button>
          <Button
            variant="outline"
            onClick={handleCheckOutAllOpen}
            disabled={!hubScopeActive || loading || checkoutAllLoading}
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

      {user?.userType === 'admin' && (
        <div
          style={{
            marginBottom: theme.spacing.lg,
            padding: theme.spacing.lg,
            background: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: theme.borderRadius.lg,
            maxWidth: 720,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md }}>
            <FiAlertTriangle size={22} color="#b91c1c" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: `0 0 ${theme.spacing.xs}`, fontSize: theme.fontSizes.base, color: theme.colors.textPrimary }}>
                Policy: @uncommon.org cannot be students
              </h3>
              <p style={{ margin: `0 0 ${theme.spacing.md}`, fontSize: theme.fontSizes.sm, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
                New signups are blocked. Use the button below to remove old Firestore profiles that incorrectly have Uncommon emails as attendees. This deletes their app profile and linked attendance rows; Firebase Authentication accounts are unchanged (remove those in the Firebase Console if they should register again).
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={invalidUncommonLoading || loading}
                onClick={async () => {
                  setInvalidUncommonLoading(true);
                  try {
                    const found = await dataService.listUncommonOrgStudentProfiles();
                    if (found.length === 0) {
                      uniqueToast.info('No invalid profiles found. All @uncommon.org accounts are staff or already correct.');
                      return;
                    }
                    const summary = found
                      .slice(0, 8)
                      .map((r) => `${r.email} (${r.userType})`)
                      .join('\n');
                    const more = found.length > 8 ? `\n… and ${found.length - 8} more` : '';
                    if (
                      !window.confirm(
                        `Remove ${found.length} profile(s) from Firestore?\n\n${summary}${more}\n\nTheir Firebase login will still exist until deleted in Authentication.`
                      )
                    ) {
                      return;
                    }
                    const { removed } = await dataService.removeUncommonOrgInvalidStudentProfiles();
                    uniqueToast.success(
                      removed > 0
                        ? `Removed ${removed} invalid profile(s) from the database.`
                        : 'Nothing was removed (check permissions / console).'
                    );
                    await loadData();
                  } catch (e) {
                    console.error(e);
                    uniqueToast.error('Cleanup failed. Check the console and Firestore rules.');
                  } finally {
                    setInvalidUncommonLoading(false);
                  }
                }}
                style={{ borderColor: '#dc2626', color: '#b91c1c' }}
              >
                {invalidUncommonLoading ? 'Working…' : 'Scan & remove invalid Uncommon student profiles'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState>
          Loading users...
        </LoadingState>
      ) : (
        <>
        {attendees.length > 0 && filteredAttendees.length === 0 && (
        <EmptyState>
          <h3>No matches</h3>
          <p>No students match your search. Clear the search or try another name or email.</p>
        </EmptyState>
        )}
        {attendees.length === 0 &&
          (user?.userType !== 'admin' || instructorRows.length === 0) && (
        <EmptyState>
          <h3>No Manageable Users Found</h3>
          <p>
            No attendees match this hub yet.{' '}
            {user?.userType === 'admin'
              ? 'Use Hub to pick a location or all hubs. Instructor accounts are listed below when present.'
              : 'Instructor accounts are not shown in the student list.'}
          </p>
        </EmptyState>
        )}
        {filteredAttendees.length > 0 && (
        <>
          <DesktopTable>
            <UsersTable>
              <TableWrapper>
                <TableHeader>
                  <div>User Information</div>
                  <div>Hub</div>
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

                <div style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textSecondary }}>
                  {resolvedHubLabel(userData)}
                </div>

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
                  <MarkPresentButton onClick={() => handleMarkPresent(uid, userData.displayName || 'Unknown User', userData.hubId)}>
                    <CheckCircleIcon size={14} /> <span>Mark Present</span>
                  </MarkPresentButton>
                  {(user?.userType === 'admin' || instructorCanDeleteStudent(userData)) && (
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
                      <p style={{ margin: '4px 0 0 0', fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary }}>
                        Hub: {resolvedHubLabel(userData)}
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
                      <MarkPresentButton onClick={() => handleMarkPresent(uid, userData.displayName || 'Unknown User', userData.hubId)} style={{ flex: 1 }}>
                        <CheckCircleIcon size={14} /> <span>Mark Present</span>
                      </MarkPresentButton>
                      {(user?.userType === 'admin' || instructorCanDeleteStudent(userData)) && (
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
        {user?.userType === 'admin' && instructorRows.length > 0 && (
          <section style={{ marginTop: theme.spacing['2xl'] }}>
            <h2
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: theme.fontSizes.xl,
                margin: `0 0 ${theme.spacing.md}`,
                color: theme.colors.primary,
              }}
            >
              All instructor accounts (every hub)
            </h2>
            <StatsCaption style={{ marginBottom: theme.spacing.lg }}>
              Every instructor in the organization. Last sign-in updates when they open the app (Harare time). Password reset uses Firebase email.
              Removing someone deletes their Firestore profile only — to free the email for a new signup, also delete the user in Firebase Authentication (Console) or they can use Forgot password on the old login.
            </StatsCaption>
            <DesktopTable>
              <UsersTable>
                <TableWrapper>
                  <InstructorTableHeader>
                    <div>Name / email</div>
                    <div>Hub</div>
                    <div>Last sign-in</div>
                    <div>Type</div>
                    <div style={{ textAlign: 'right' }}>Actions</div>
                  </InstructorTableHeader>
                  {instructorRows.map((row) => {
                    const uid = row.id || row.uid;
                    const isSelf = uid === user?.uid;
                    return (
                      <InstructorTableRow key={`inst-${uid}`}>
                        <UserInfo>
                          <UserAvatar $isActive={false}>{getInitials(row.displayName || 'Instructor')}</UserAvatar>
                          <UserDetails>
                            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                              <PersonIcon size={14} style={{ color: theme.colors.primary }} />
                              {row.displayName || 'Instructor'}
                            </h4>
                            <p style={{ margin: 0 }}>{row.email}</p>
                          </UserDetails>
                        </UserInfo>
                        <div style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textSecondary }}>
                          {resolvedHubLabel(row)}
                        </div>
                        <div style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textSecondary }}>
                          {formatInstructorLastLogin(row)}
                        </div>
                        <InstructorTypeCell>
                          <UserType type="instructor">instructor</UserType>
                        </InstructorTypeCell>
                        <InstructorActionButtons>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleSendPasswordReset(row.email)}
                            disabled={resetSending === row.email || !row.email}
                            style={{ padding: '8px 12px', width: '100%', maxWidth: 220 }}
                          >
                            <FiLock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                            {resetSending === row.email ? 'Sending…' : 'Password reset email'}
                          </Button>
                          {!isSelf && (
                            <DeleteButton variant="ghost" onClick={() => handleOpenDelete(row)} style={{ width: '100%', maxWidth: 220 }}>
                              Remove
                            </DeleteButton>
                          )}
                        </InstructorActionButtons>
                      </InstructorTableRow>
                    );
                  })}
                </TableWrapper>
              </UsersTable>
            </DesktopTable>
          </section>
        )}
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
