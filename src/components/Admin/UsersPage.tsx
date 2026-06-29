import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import DataService from '../../services/DataService';
import {
  effectiveStaffHubScope,
  initialStaffHubFilter,
  resolvedHubLabel,
  staffMayAccessHubForWrite,
} from '../../services/hubService';
import { AdminHubScopeSelect } from './AdminHubScopeSelect';
import { DeleteUserModal } from './DeleteUserModal';
import { uniqueToast } from '../../utils/toastUtils';
import { PersonIcon, SearchIcon } from '../Common/Icons';
import { FiAlertTriangle } from 'react-icons/fi';

const PageContainer = styled.div`
  padding: ${theme.spacing.xl};
  width: 100%;
  max-width: 1200px;
  min-width: 0;
  box-sizing: border-box;
  margin: 0 auto;
  
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
  margin-bottom: 24px;
  gap: ${theme.spacing.md};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.md};
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
    font-size: 22px;
    font-weight: 800;
    color: ${theme.colors.textPrimary};
    margin: 0 0 4px 0;
    letter-spacing: -0.03em;
  }
  
  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
    font-size: 14px;
  }
`;



const CardSection = styled.div`
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.gray100};
  margin-top: ${theme.spacing.md};
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: minmax(200px, 2fr) minmax(120px, 1.2fr) 100px minmax(100px, auto);
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid rgba(0, 82, 204, 0.04);
  transition: all 0.2s ease;
  align-items: center;
  min-width: 0;
  box-sizing: border-box;
  min-height: 72px;

  & > * {
    min-width: 0;
  }
  
  &:hover {
    background: #fafbff;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }
`;

const UserAvatar = styled.div`
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
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
  border: 1px solid rgba(0, 82, 204, 0.06);
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(200px, 2fr) minmax(120px, 1.2fr) 100px minmax(100px, auto);
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

  & > * {
    min-width: 0;
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

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const ActionButtonsEnd = styled(ActionButtons)`
  justify-content: flex-end;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  min-width: 0;
  overflow: hidden;
`;

const AccessDeniedWrapper = styled.div`
  text-align: center;
  padding: ${theme.spacing['3xl']};
`;

const PageHeading = styled.h1`
  margin: 0;
  line-height: 1.2;
`;

const AlertBox = styled.div`
  margin-bottom: ${theme.spacing.lg};
  padding: ${theme.spacing.lg};
  background: rgba(220, 38, 38, 0.06);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: ${theme.borderRadius.lg};
  max-width: 720px;
`;

const AlertContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.md};
`;

const AlertBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const AlertHeading = styled.h3`
  margin: 0 0 ${theme.spacing.xs};
  font-size: ${theme.fontSizes.base};
  color: ${theme.colors.textPrimary};
`;

const AlertText = styled.p`
  margin: 0 0 ${theme.spacing.md};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  line-height: 1.5;
`;

const RightAlignedCell = styled.div`
  text-align: right;
`;

const UserNameHeading = styled.h4`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  margin: 0;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const TableIcon = styled.span`
  display: inline-flex;
  color: ${theme.colors.primary};
`;

const ValueTextSmall = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FullWidthBlock = styled.div`
  display: block;
  width: 100%;
  min-width: 0;
`;

const MobileHeaderContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const MobileUserTitle = styled(UserNameHeading)`
  font-size: ${theme.fontSizes.base};
  font-weight: ${theme.fontWeights.bold};
  margin: 0;
`;

const MobileUserDetailsSingle = styled.div`
  margin-bottom: ${theme.spacing.sm};
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.sm};
`;

const MobileMetaLabel = styled.strong`
  color: ${theme.colors.textSecondary};
  font-size: 10px;
  text-transform: uppercase;
`;

const UserEmail = styled.p`
  margin: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MobileSubText = styled.p`
  margin: 2px 0 0 0;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
`;

const UserTypeItem = styled(UserType)`
  margin-top: 4px;
`;

const AlertIconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #b91c1c;
  margin-top: 2px;
  flex-shrink: 0;
`;

const SearchIconAbsolute = styled(SearchIcon)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.textSecondary};
`;

const DangerOutlineButton = styled(Button)`
  border-color: #dc2626;
  color: #b91c1c;
`;

const UserDetails = styled.div`
  min-width: 0;
  overflow: hidden;

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
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const MobileUserCard = styled.div`
  display: none;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: block;
    background: #ffffff;
    border-radius: 14px;
    padding: ${theme.spacing.lg};
    margin-bottom: ${theme.spacing.md};
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid rgba(0, 82, 204, 0.06);
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
    border-radius: 12px;
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

const DesktopTable = styled.div`
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
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
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const StatCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  border: 1px solid rgba(0, 82, 204, 0.06);
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
  const [adminHubFilter, setAdminHubFilter] = useState(() => initialStaffHubFilter(user));
  const effectiveHub = useMemo(() => effectiveStaffHubScope(user, adminHubFilter), [user, adminHubFilter]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [invalidUncommonLoading, setInvalidUncommonLoading] = useState(false);
  const dataService = DataService.getInstance();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await dataService.testConnection();
      const usersData = await dataService.getUsers(effectiveHub);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      uniqueToast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [dataService, effectiveHub]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
        <AccessDeniedWrapper>
          <h2>Access Denied</h2>
          <p>Only administrators and instructors can access this page.</p>
          {onBack && (
            <Button variant="primary" onClick={onBack}>
              Back to Dashboard
            </Button>
          )}
        </AccessDeniedWrapper>
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

  return (
    <PageContainer>
      <Header>
        <HeaderTitle>
          <PageHeading>Students</PageHeading>
          <p>
            Student roster and accounts — record check-in, check-out, and daily attendance on the Attendance page.
            {(user?.userType === 'admin' || user?.userType === 'instructor') &&
              ' Use Hub to view one location or all hubs (instructors: assigned hub only).'}
            {user?.userType === 'instructor' &&
              ' Instructors can remove students only in their assigned hub.'}
          </p>
        </HeaderTitle>
        <HeaderActions>
          <AdminHubScopeSelect
            user={user}
            value={adminHubFilter}
            onChange={setAdminHubFilter}
            id="users-page-hub-filter"
          />
          <SearchWrap>
            <SearchIconAbsolute size={20} />
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

      <StatsGrid>
        <StatCard>
          <StatIcon><PersonIcon size={32} /></StatIcon>
          <StatValue>{attendees.length}</StatValue>
          <StatLabel>Students in roster</StatLabel>
        </StatCard>
      </StatsGrid>

      {user?.userType === 'admin' && (
        <AlertBox>
          <AlertContent>
            <AlertIconWrapper>
              <FiAlertTriangle size={22} />
            </AlertIconWrapper>
            <AlertBody>
              <AlertHeading>Policy: @uncommon.org cannot be students</AlertHeading>
              <AlertText>
                New signups are blocked. Use the button below to remove old profiles that incorrectly have Uncommon emails as attendees. This deletes their app profile and linked attendance rows; Clerk accounts are unchanged (remove those in the Clerk dashboard if they should register again).
              </AlertText>
              <DangerOutlineButton
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
                        `Remove ${found.length} profile(s)?\n\n${summary}${more}\n\nTheir Clerk account will still exist until deleted in the Clerk dashboard.`
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
                    uniqueToast.error('Cleanup failed. Check the console.');
                  } finally {
                    setInvalidUncommonLoading(false);
                  }
                }}
              >
                {invalidUncommonLoading ? 'Working…' : 'Scan & remove invalid Uncommon student profiles'}
              </DangerOutlineButton>
            </AlertBody>
          </AlertContent>
        </AlertBox>
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
        {attendees.length === 0 && (
        <EmptyState>
          <h3>No students found</h3>
          <p>
            No attendees match this hub yet.{' '}
            {user?.userType === 'admin'
              ? 'Use Hub to pick a location or all hubs.'
              : 'Students in other hubs are not shown here.'}
          </p>
        </EmptyState>
        )}
        {filteredAttendees.length > 0 && (
        <>
          <DesktopTable>
            <UsersTable>
              <TableWrapper>
                <TableHeader>
                  <div>User</div>
                  <div>Hub</div>
                  <div>Type</div>
                  <RightAlignedCell>Actions</RightAlignedCell>
                </TableHeader>

          {filteredAttendees.map((userData) => {
            const canDelete =
              user?.userType === 'admin' || instructorCanDeleteStudent(userData);

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
                    <UserNameHeading>
                      <TableIcon>
                        <PersonIcon size={14} />
                      </TableIcon>
                      {userData.displayName || 'Unknown User'}
                    </UserNameHeading>
                    <UserEmail>{userData.email}</UserEmail>
                  </UserDetails>
                </UserInfo>

                <ValueTextSmall>{resolvedHubLabel(userData)}</ValueTextSmall>

                <div>
                  <UserType type={userData.userType}>{userData.userType}</UserType>
                </div>

                <ActionButtonsEnd>
                  {canDelete ? (
                    <DeleteButton variant="ghost" onClick={() => handleOpenDelete(userData)}>
                      Delete
                    </DeleteButton>
                  ) : (
                    <ValueTextSmall title="View only. Instructors can remove students only in their assigned hub.">
                      View only
                    </ValueTextSmall>
                  )}
                </ActionButtonsEnd>
              </TableRow>
            );
          })}
              </TableWrapper>
            </UsersTable>
          </DesktopTable>
          
          {/* Mobile Card Layout */}
          <FullWidthBlock>
            {filteredAttendees.map((userData) => {
              const canDelete =
                user?.userType === 'admin' || instructorCanDeleteStudent(userData);

              return (
                <MobileUserCard key={`mobile-${userData.id}`}>
                  <MobileUserHeader>
                    <UserAvatar>
                      {userData.photoUrl ? (
                        <img src={userData.photoUrl} alt={userData.displayName} />
                      ) : (
                        getInitials(userData.displayName || 'Unknown')
                      )}
                    </UserAvatar>
                    <MobileHeaderContent>
                      <MobileUserTitle>
                        <TableIcon>
                          <PersonIcon size={14} />
                        </TableIcon>
                        {userData.displayName || 'Unknown User'}
                      </MobileUserTitle>
                      <MobileSubText>{userData.email}</MobileSubText>
                      <MobileSubText>Hub: {resolvedHubLabel(userData)}</MobileSubText>
                    </MobileHeaderContent>
                  </MobileUserHeader>

                  <MobileUserDetailsSingle>
                    <div>
                      <MobileMetaLabel>Type</MobileMetaLabel>
                      <br />
                      <UserTypeItem type={userData.userType}>{userData.userType}</UserTypeItem>
                    </div>
                  </MobileUserDetailsSingle>

                  <CardSection>
                    <ActionButtons>
                      {canDelete ? (
                        <DeleteButton variant="outline" size="sm" onClick={() => handleOpenDelete(userData)}>
                          Delete account
                        </DeleteButton>
                      ) : (
                        <ValueTextSmall title="View only. Instructors can remove students only in their assigned hub.">
                          View only
                        </ValueTextSmall>
                      )}
                    </ActionButtons>
                  </CardSection>
                </MobileUserCard>
              );
            })}
          </FullWidthBlock>
        </>
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
