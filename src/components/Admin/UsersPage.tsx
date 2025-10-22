import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import DataService from '../../services/DataService';
import { UncommonLogo } from '../Common/UncommonLogo';
import { EditUserModal } from './EditUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { toast } from 'react-toastify';
import {
  PeopleIcon,
  PersonIcon,
  CheckCircleIcon,
  TodayIcon,
  LocationOnIcon,
  LoginIcon,
  LogoutIcon
} from '../Common/Icons';

const PageContainer = styled.div`
  padding: ${theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: ${theme.colors.backgroundSecondary};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.lg};
    max-width: 100%;
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



const UsersTable = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  overflow: hidden;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    border-radius: ${theme.borderRadius.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    border-radius: ${theme.borderRadius.md};
    overflow: visible;
  }
`;

const TableWrapper = styled.div`
  @media (max-width: ${theme.breakpoints.mobile}) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 150px 150px 200px 200px 150px;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.gray200};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSizes.sm};
  min-width: 800px;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
    gap: ${theme.spacing.sm};
    font-size: ${theme.fontSizes.xs};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 2fr 100px 100px 150px 150px 120px;
    padding: ${theme.spacing.sm};
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 150px 150px 200px 200px 150px;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.gray100};
  transition: background-color 0.2s ease;
  min-width: 800px;
  
  &:hover {
    background: ${theme.colors.gray50};
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
    gap: ${theme.spacing.sm};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 2fr 100px 100px 150px 150px 120px;
    padding: ${theme.spacing.sm};
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${theme.borderRadius.full};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryLight} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.white};
  font-weight: ${theme.fontWeights.semibold};
  font-size: ${theme.fontSizes.sm};
`;

const UserDetails = styled.div`
  h4 {
    margin: 0 0 ${theme.spacing.xs} 0;
    font-size: ${theme.fontSizes.base};
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
  }
  
  p {
    margin: 0;
    font-size: ${theme.fontSizes.sm};
    color: ${theme.colors.textSecondary};
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
      case 'organizer':
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

const AttendanceStatus = styled.div<{ isCheckedIn: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-size: ${theme.fontSizes.sm};
  
  ${props => props.isCheckedIn ? `
    color: #16a34a;
  ` : `
    color: ${theme.colors.textSecondary};
  `}
`;

const TimeDisplay = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  
  .time {
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
  }
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

const MobileUserActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  justify-content: flex-end;
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${theme.spacing.xs};
  }
`;

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
      case 'organizer':
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
}

export const UsersPage: React.FC<UsersPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const dataService = DataService.getInstance();

  useEffect(() => {
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
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const getTodayAttendance = (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(a => a.studentId === userId && a.date === today);
  };

  const getUserStats = () => {
    const totalUsers = users.length;
    const studentsCount = users.filter(u => u.userType === 'attendee').length;
    const today = new Date().toISOString().split('T')[0];
    const todayCheckedIn = attendance.filter(a => a.date === today && a.isPresent).length;
    
    return {
      totalUsers,
      studentsCount,
      todayCheckedIn,
      adminsCount: users.filter(u => u.userType === 'admin').length
    };
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const handleEditUser = (userData: any) => {
    setEditingUser(userData);
  };

  const handleDeleteUser = (userData: any) => {
    setDeletingUser(userData);
  };

  const handleSaveUser = async (userData: any) => {
    await dataService.updateUser(editingUser.id, userData);
    await loadData(); // Refresh the data
  };

  const handleConfirmDelete = async () => {
    await dataService.deleteUser(deletingUser.id);
    await loadData(); // Refresh the data
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (user?.userType !== 'admin') {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
          <h2>Access Denied</h2>
          <p>Only administrators can access this page.</p>
          {onBack && (
            <Button variant="primary" onClick={onBack}>
              Back to Dashboard
            </Button>
          )}
        </div>
      </PageContainer>
    );
  }

  const stats = getUserStats();

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
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Dashboard
          </Button>
        )}
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
          <StatValue>{users.filter(u => u.userType === 'organizer').length}</StatValue>
          <StatLabel>Organizers</StatLabel>
        </StatCard>
      </StatsGrid>

      {loading ? (
        <LoadingState>
          Loading users...
        </LoadingState>
      ) : users.filter(u => u.userType !== 'admin').length === 0 ? (
        <EmptyState>
          <h3>No Manageable Users Found</h3>
          <p>No attendees or organizers are registered in the system yet. Admin accounts are protected and not shown here.</p>
        </EmptyState>
      ) : (
        <>
          <DesktopTable>
            <UsersTable>
              <TableWrapper>
                <TableHeader>
                  <div>User</div>
                  <div>Type</div>
                  <div>Status</div>
                  <div>Check In</div>
                  <div>Check Out</div>
                  <div>Actions</div>
                </TableHeader>
          
          {users.filter(userData => userData.userType !== 'admin').map((userData) => {
            const todayAttendance = getTodayAttendance(userData.id);
            const isCheckedIn = todayAttendance && todayAttendance.checkInTime && !todayAttendance.checkOutTime;
            
            return (
              <TableRow key={userData.id}>
                <UserInfo>
                  <UserAvatar>
                    {userData.photoUrl ? (
                      <img src={userData.photoUrl} alt={userData.displayName} />
                    ) : (
                      getInitials(userData.displayName || 'Unknown')
                    )}
                  </UserAvatar>
                  <UserDetails>
                    <h4>{userData.displayName || 'Unknown User'}</h4>
                    <p>{userData.email}</p>
                  </UserDetails>
                </UserInfo>
                
                <div>
                  <UserType type={userData.userType}>
                    {userData.userType}
                  </UserType>
                </div>
                
                <div>
                  <AttendanceStatus isCheckedIn={!!isCheckedIn}>
                    {isCheckedIn ? (
                      <>
                        <CheckCircleIcon size={16} />
                        Checked In
                      </>
                    ) : (
                      <>
                        <PersonIcon size={16} />
                        Not Present
                      </>
                    )}
                  </AttendanceStatus>
                </div>
                
                <TimeDisplay>
                  {todayAttendance?.checkInTime ? (
                    <div>
                      <LoginIcon size={14} style={{ marginRight: theme.spacing.xs }} />
                      <span className="time">
                        {formatTime(todayAttendance.checkInTime)}
                      </span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TimeDisplay>
                
                <TimeDisplay>
                  {todayAttendance?.checkOutTime ? (
                    <div>
                      <LogoutIcon size={14} style={{ marginRight: theme.spacing.xs }} />
                      <span className="time">
                        {formatTime(todayAttendance.checkOutTime)}
                      </span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TimeDisplay>
                
                <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditUser(userData)}
                  >
                    Edit
                  </Button>
                  <DeleteButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteUser(userData)}
                  >
                    Delete
                  </DeleteButton>
                </div>
              </TableRow>
            );
          })}
              </TableWrapper>
            </UsersTable>
          </DesktopTable>
          
          {/* Mobile Card Layout */}
          <div style={{ display: 'block' }}>
            {users.filter(userData => userData.userType !== 'admin').map((userData) => {
              const todayAttendance = getTodayAttendance(userData.id);
              const isCheckedIn = todayAttendance && todayAttendance.checkInTime && !todayAttendance.checkOutTime;
              
              return (
                <MobileUserCard key={`mobile-${userData.id}`}>
                  <MobileUserHeader>
                    <UserAvatar>
                      {userData.photoUrl ? (
                        <img 
                          src={userData.photoUrl} 
                          alt={userData.displayName} 
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        getInitials(userData.displayName || 'Unknown')
                      )}
                    </UserAvatar>
                    <div>
                      <h4 style={{ margin: 0, fontSize: theme.fontSizes.base, fontWeight: theme.fontWeights.medium }}>
                        {userData.displayName || 'Unknown User'}
                      </h4>
                      <p style={{ margin: 0, fontSize: theme.fontSizes.sm, color: theme.colors.textSecondary }}>
                        {userData.email}
                      </p>
                    </div>
                  </MobileUserHeader>
                  
                  <MobileUserDetails>
                    <div>
                      <strong>Type:</strong><br />
                      <UserTypeTag type={userData.userType}>
                        {userData.userType}
                      </UserTypeTag>
                    </div>
                    <div>
                      <strong>Status:</strong><br />
                      <StatusBadge isActive={isCheckedIn}>
                        {isCheckedIn ? 'Checked In' : 'Not Present'}
                      </StatusBadge>
                    </div>
                    <div>
                      <strong>Check In:</strong><br />
                      {todayAttendance?.checkInTime ? formatTime(todayAttendance.checkInTime) : '-'}
                    </div>
                    <div>
                      <strong>Check Out:</strong><br />
                      {todayAttendance?.checkOutTime ? formatTime(todayAttendance.checkOutTime) : '-'}
                    </div>
                  </MobileUserDetails>
                  
                  <MobileUserActions>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditUser(userData)}
                    >
                      Edit
                    </Button>
                    <DeleteButton 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteUser(userData)}
                    >
                      Delete
                    </DeleteButton>
                  </MobileUserActions>
                </MobileUserCard>
              );
            })}
          </div>
        </>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}

      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </PageContainer>
  );
};
