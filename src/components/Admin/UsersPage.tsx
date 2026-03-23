import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import DataService from '../../services/DataService';
import { TimeService } from '../../services/timeService';
import { DailyAttendanceService } from '../../services/dailyAttendanceService';
import { DeleteUserModal } from './DeleteUserModal';
import { uniqueToast } from '../../utils/toastUtils';
import { UncommonLogo } from '../Common/UncommonLogo';
import {
  PersonIcon,
  CheckCircleIcon,
  TodayIcon,
  SearchIcon
} from '../Common/Icons';
import { FiClock } from 'react-icons/fi';

const PageContainer = styled.div`
  padding: ${theme.spacing.xl};
  width: 100%;
  min-height: 100vh;
  background: ${theme.colors.backgroundSecondary};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.lg};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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



const StatusDot = styled.span<{ isActive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: ${theme.spacing.xs};
  background: ${props => props.isActive ? '#16a34a' : '#9ca3af'};
  box-shadow: ${props => props.isActive ? '0 0 6px rgba(34, 197, 94, 0.4)' : 'none'};
`;

const LastActivity = styled.div`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  margin-top: ${theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MiniBadge = styled.span`
  background: ${theme.colors.primary}10;
  color: ${theme.colors.primary};
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: ${theme.fontWeights.semibold};
  text-transform: uppercase;
`;

const CardSection = styled.div`
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.gray100};
  margin-top: ${theme.spacing.md};
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 150px 150px 200px;
  gap: ${theme.spacing.xl};
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  border-bottom: 1px solid ${theme.colors.gray100};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  align-items: center;
  min-width: 800px;
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

const UserAvatar = styled.div<{ isActive?: boolean }>`
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
  border: 2px solid ${props => props.isActive ? '#16a34a' : 'transparent'};
  box-shadow: ${props => props.isActive ? '0 0 0 2px #dcfce7' : 'none'};
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
  grid-template-columns: 2fr 150px 150px 200px;
  gap: ${theme.spacing.xl};
  padding: ${theme.spacing.xl};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.gray200};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 800px;
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
  width: 300px;
  background: ${theme.colors.white};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}20;
  }

  @media (max-width: ${theme.breakpoints.tablet}) {
    width: 100%;
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

const StatusBadge = styled.span<{ isActive: boolean }>`
  display: inline-block;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => props.isActive ? `
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
  const [searchTerm, setSearchTerm] = useState('');
  const dataService = DataService.getInstance();
  const dailyService = DailyAttendanceService.getInstance();

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

  const getTodayAttendance = (userId: string) => {
    const timeService = TimeService.getInstance();
    const today = timeService.getCurrentDateString();
    return attendance.find(a => a.studentId === userId && a.date === today);
  };

  // getUserStats and formatTime were previously defined but unused helpers.
  // They have been removed to keep CI linting happy.
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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

  const handleOpenDelete = (user: any) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleMarkPresent = async (studentId: string, studentName: string) => {
    try {
      await dailyService.markPresentToday(studentId, studentName);
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
      const todayAttendance = getTodayAttendance(userData.id);
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
      const promises = absentStudents.map(student => 
        dailyService.markPresentToday(student.id, student.displayName || 'Unknown User')
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

  return (
    <PageContainer>
      <Header>
        <HeaderTitle>
          <h1 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: theme.spacing.lg,
            margin: 0 
          }}>
            <UncommonLogo size="lg" showSubtitle={false} />
            <span>Users Management</span>
          </h1>
          <p>Manage all users and track their attendance</p>
        </HeaderTitle>
        <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
          <Button 
            variant="primary" 
            onClick={handleMarkAllPresent} 
            disabled={loading}
            style={{ backgroundColor: theme.colors.success, borderColor: theme.colors.success }}
          >
            <CheckCircleIcon size={18} /> Mark All Present
          </Button>
          <div style={{ position: 'relative' }}>
            <SearchIcon size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.colors.textSecondary }} />
            <SearchInput
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back to Dashboard
            </Button>
          )}
        </div>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatIcon><PersonIcon size={32} /></StatIcon>
          <StatValue>{users.filter(u => u.userType !== 'admin').length}</StatValue>
          <StatLabel>Manageable Users</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon><CheckCircleIcon size={32} /></StatIcon>
          <StatValue>{users.filter(u => u.userType !== 'admin' && getTodayAttendance(u.id)?.checkInTime && !getTodayAttendance(u.id)?.checkOutTime).length}</StatValue>
          <StatLabel>Currently Present</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon><TodayIcon size={32} /></StatIcon>
          <StatValue>{users.filter(u => u.userType !== 'admin' && getTodayAttendance(u.id)?.checkInTime).length}</StatValue>
          <StatLabel>Checked In Today</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon><PersonIcon size={32} /></StatIcon>
          <StatValue>{users.filter(u => u.userType === 'instructor').length}</StatValue>
          <StatLabel>Instructors</StatLabel>
        </StatCard>
      </StatsGrid>

      {loading ? (
        <LoadingState>
          Loading users...
        </LoadingState>
      ) : users.filter(u => u.userType !== 'admin' && u.userType !== 'instructor').length === 0 ? (
        <EmptyState>
          <h3>No Manageable Users Found</h3>
          <p>No attendees are registered in the system yet. Admin and instructor accounts are protected and not shown here.</p>
        </EmptyState>
      ) : (
        <>
          <DesktopTable>
            <UsersTable>
              <TableWrapper>
                <TableHeader>
                  <div>User Information</div>
                  <div>User Type</div>
                  <div>Daily Status</div>
                  <div style={{ textAlign: 'right' }}>Actions</div>
                </TableHeader>
          
          {users.filter(userData => userData.userType === 'attendee').map((userData) => {
            const todayAttendance = getTodayAttendance(userData.id);
            const isCheckedIn = todayAttendance && todayAttendance.checkInTime && !todayAttendance.checkOutTime;
            const checkInTimeString = todayAttendance?.checkInTime 
              ? (todayAttendance.checkInTime.toDate ? todayAttendance.checkInTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(todayAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
              : null;
            
            return (
              <TableRow key={userData.id}>
                <UserInfo>
                  <UserAvatar isActive={!!isCheckedIn}>
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
                    <LastActivity>
                      <FiClock size={12} />
                      Last check-in: {checkInTimeString || 'No record today'}
                    </LastActivity>
                  </UserDetails>
                </UserInfo>
                
                <div>
                  <UserType type={userData.userType}>
                    {userData.userType}
                  </UserType>
                </div>
                
                <div>
                  <StatusBadge isActive={!!isCheckedIn}>
                    <StatusDot isActive={!!isCheckedIn} />
                    {isCheckedIn ? 'Checked In' : 'Not Present'}
                  </StatusBadge>
                </div>
                
                <ActionButtons style={{ justifyContent: 'flex-end' }}>
                  <MarkPresentButton onClick={() => handleMarkPresent(userData.id, userData.displayName || 'Unknown User')}>
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
          <div style={{ display: 'block' }}>
            {users.filter(userData => userData.userType === 'attendee').map((userData) => {
              const todayAttendance = getTodayAttendance(userData.id);
              const isCheckedIn = todayAttendance && todayAttendance.checkInTime && !todayAttendance.checkOutTime;
              const checkInTimeString = todayAttendance?.checkInTime 
                ? (todayAttendance.checkInTime.toDate ? todayAttendance.checkInTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(todayAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                : null;
              
              return (
                <MobileUserCard key={`mobile-${userData.id}`}>
                  <MobileUserHeader>
                    <UserAvatar isActive={!!isCheckedIn}>
                      {userData.photoUrl ? (
                        <img 
                          src={userData.photoUrl} 
                          alt={userData.displayName} 
                        />
                      ) : (
                        getInitials(userData.displayName || 'Unknown')
                      )}
                    </UserAvatar>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: 0, fontSize: theme.fontSizes.base, fontWeight: theme.fontWeights.bold, display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                          <PersonIcon size={14} style={{ color: theme.colors.primary }} />
                          {userData.displayName || 'Unknown User'}
                        </h4>
                        <MiniBadge>Active</MiniBadge>
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary }}>
                        {userData.email}
                      </p>
                    </div>
                  </MobileUserHeader>
                  
                  <MobileUserDetails>
                    <div>
                      <strong style={{ color: theme.colors.textSecondary, fontSize: '10px', textTransform: 'uppercase' }}>Type</strong><br />
                      <UserTypeTag type={userData.userType} style={{ marginTop: '4px' }}>
                        {userData.userType}
                      </UserTypeTag>
                    </div>
                    <div>
                      <strong style={{ color: theme.colors.textSecondary, fontSize: '10px', textTransform: 'uppercase' }}>Status</strong><br />
                      <StatusBadge isActive={isCheckedIn} style={{ marginTop: '4px' }}>
                        <StatusDot isActive={isCheckedIn} />
                        {isCheckedIn ? 'Checked In' : 'Not Present'}
                      </StatusBadge>
                    </div>
                  </MobileUserDetails>

                  <LastActivity style={{ marginBottom: theme.spacing.md, padding: `${theme.spacing.xs} 0` }}>
                    <FiClock size={12} />
                    Last check-in: {checkInTimeString || 'No record today'}
                  </LastActivity>

                  <CardSection>
                    <ActionButtons>
                      <MarkPresentButton onClick={() => handleMarkPresent(userData.id, userData.displayName || 'Unknown User')} style={{ flex: 1 }}>
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
