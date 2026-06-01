import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import DataService from '../../services/DataService';
import {
  effectiveStaffHubScope,
  hubIdMatchesScope,
  initialStaffHubFilter,
  resolvedHubLabel,
} from '../../services/hubService';
import { AdminHubScopeSelect } from './AdminHubScopeSelect';
import { DeleteUserModal } from './DeleteUserModal';
import { uniqueToast } from '../../utils/toastUtils';
import { PersonIcon, SearchIcon } from '../Common/Icons';
import { FiLock } from 'react-icons/fi';
import { Shield } from 'lucide-react';
import { isAdminEmail } from '../../constants/admin';

function formatInstructorLastLogin(row: Record<string, unknown>): string {
  const v = row?.lastLoginAt;
  if (!v) return '—';
  try {
    const d =
      typeof (v as { toDate?: () => Date })?.toDate === 'function'
        ? (v as { toDate: () => Date }).toDate()
        : v instanceof Date
          ? v
          : null;
    if (!d || Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-GB', {
      timeZone: 'Africa/Harare',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
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
    line-height: 1.5;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  align-items: center;
  justify-content: flex-end;
`;

const SearchWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 320px;

  @media (max-width: ${theme.breakpoints.tablet}) {
    width: 100%;
    max-width: none;
  }
`;

const SearchIconAbsolute = styled(SearchIcon)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.textSecondary};
`;

const SearchInput = styled.input`
  padding: ${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} 40px;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.gray300};
  font-size: ${theme.fontSizes.sm};
  width: 100%;
  box-sizing: border-box;
  background: ${theme.colors.white};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}20;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const StatCard = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${theme.colors.gray200};
  text-align: center;
`;

const StatIcon = styled.div`
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.md};
  display: flex;
  justify-content: center;
`;

const StatValue = styled.div`
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  font-weight: ${theme.fontWeights.medium};
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
  grid-template-columns:
    minmax(200px, 2fr)
    minmax(110px, 1fr)
    minmax(140px, 1.1fr)
    minmax(120px, 0.65fr)
    minmax(200px, 1.25fr);
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.gray200};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 900px;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns:
    minmax(200px, 2fr)
    minmax(110px, 1fr)
    minmax(140px, 1.1fr)
    minmax(120px, 0.65fr)
    minmax(200px, 1.25fr);
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.gray100};
  align-items: center;
  min-width: 900px;
  min-height: 72px;

  &:hover {
    background: ${theme.colors.gray50};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  min-width: 0;
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
`;

const UserDetails = styled.div`
  min-width: 0;
  overflow: hidden;
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
  font-size: ${theme.fontSizes.base};
`;

const UserEmail = styled.p`
  margin: ${theme.spacing.xs} 0 0;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserType = styled.div<{ type: string }>`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.medium};
  text-transform: uppercase;

  ${(props) => {
    switch (props.type) {
      case 'admin':
        return `background: rgba(239, 68, 68, 0.1); color: #dc2626;`;
      case 'instructor':
        return `background: rgba(251, 191, 36, 0.1); color: #d97706;`;
      default:
        return `background: ${theme.colors.gray100}; color: ${theme.colors.textSecondary};`;
    }
  }}
`;

const ValueTextSmall = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RightAlignedCell = styled.div`
  text-align: right;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${theme.spacing.sm};
  width: 100%;
`;

const StaffActionButton = styled(Button)`
  padding: 8px 12px;
  width: 100%;
  max-width: 220px;
`;

const DeleteButton = styled(Button)`
  color: #dc2626;
  border-color: #dc2626;
  width: 100%;
  max-width: 220px;

  &:hover {
    background: #dc2626;
    color: white;
  }
`;

const InlineIcon = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${theme.spacing['3xl']};
  color: ${theme.colors.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing['3xl']};
  color: ${theme.colors.textSecondary};

  h3 {
    color: ${theme.colors.textPrimary};
    margin-bottom: ${theme.spacing.sm};
  }
`;

const AccessDeniedWrapper = styled.div`
  text-align: center;
  padding: ${theme.spacing['3xl']};
`;

interface StaffAccountsPageProps {
  onBack?: () => void;
}

export const StaffAccountsPage: React.FC<StaffAccountsPageProps> = ({ onBack }) => {
  const { user, resetPassword } = useAuth();
  const [staffList, setStaffList] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resetSending, setResetSending] = useState<string | null>(null);
  const [roleChangeUid, setRoleChangeUid] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Record<string, unknown> | null>(null);
  const [adminHubFilter, setAdminHubFilter] = useState(() => initialStaffHubFilter(user));
  const effectiveHub = useMemo(() => effectiveStaffHubScope(user, adminHubFilter), [user, adminHubFilter]);
  const dataService = DataService.getInstance();

  const loadStaff = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await dataService.testConnection();
      if (user.userType === 'admin') {
        const rows = await dataService.getStaffDirectory();
        setStaffList(rows.filter((row: Record<string, unknown>) => row.email && !isAdminEmail(String(row.email))));
      } else {
        const hubUsers = await dataService.getUsers(effectiveHub);
        setStaffList(
          hubUsers.filter(
            (row: Record<string, unknown>) =>
              (row.userType === 'instructor' || row.userType === 'admin') &&
              row.email &&
              !isAdminEmail(String(row.email))
          )
        );
      }
    } catch (e) {
      console.error('Failed to load staff:', e);
      uniqueToast.error('Failed to load staff accounts');
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, [dataService, effectiveHub, user]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const staffRows = useMemo(() => {
    let rows = staffList;
    if (user?.userType === 'instructor' && effectiveHub) {
      rows = rows.filter((r) => hubIdMatchesScope(r.hubId as string | undefined, effectiveHub));
    }
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = String(r.displayName || '').toLowerCase();
      const email = String(r.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [staffList, searchTerm, user?.userType, effectiveHub]);

  const instructorCount = staffRows.filter((r) => r.userType === 'instructor').length;
  const adminCount = staffRows.filter((r) => r.userType === 'admin').length;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const handleMakeAdmin = async (target: Record<string, unknown>) => {
    const uid = String(target.id || target.uid || '');
    if (!uid || uid === user?.uid) return;
    const name = String(target.displayName || target.email || 'this user');
    if (
      !window.confirm(
        `Grant full admin access to ${name}? They will see all hubs and admin-only tools after signing in again.`
      )
    ) {
      return;
    }
    setRoleChangeUid(uid);
    try {
      await dataService.setUserRole(uid, 'admin', user);
      await loadStaff();
    } catch (e: unknown) {
      uniqueToast.error(e instanceof Error ? e.message : 'Could not grant admin access.');
    } finally {
      setRoleChangeUid(null);
    }
  };

  const handleRemoveAdmin = async (target: Record<string, unknown>) => {
    const uid = String(target.id || target.uid || '');
    if (!uid || uid === user?.uid) return;
    const name = String(target.displayName || target.email || 'this user');
    if (!window.confirm(`Remove admin access from ${name}? They will become an instructor again.`)) {
      return;
    }
    setRoleChangeUid(uid);
    try {
      await dataService.setUserRole(uid, 'instructor', user);
      await loadStaff();
    } catch (e: unknown) {
      uniqueToast.error(e instanceof Error ? e.message : 'Could not remove admin access.');
    } finally {
      setRoleChangeUid(null);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    if (!email) return;
    setResetSending(email);
    try {
      await resetPassword(email);
      uniqueToast.success(`Password reset email sent to ${email}.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not send reset email.';
      uniqueToast.error(msg);
    } finally {
      setResetSending(null);
    }
  };

  const handleOpenDelete = (target: Record<string, unknown>) => {
    if (user?.userType !== 'admin') return;
    if (target.userType === 'admin') {
      uniqueToast.error('Remove admin access before deleting this account.');
      return;
    }
    setUserToDelete(target);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const uid = String(userToDelete.id || userToDelete.uid || '');
    try {
      await dataService.deleteUser(uid, { actingUser: user });
      setShowDeleteModal(false);
      setUserToDelete(null);
      await loadStaff();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete user.';
      uniqueToast.error(msg);
    }
  };

  if (user?.userType !== 'admin' && user?.userType !== 'instructor') {
    return (
      <PageContainer>
        <AccessDeniedWrapper>
          <h2>Access Denied</h2>
          <p>Only administrators and instructors can view staff accounts.</p>
          {onBack && (
            <Button variant="primary" onClick={onBack}>
              Back to Dashboard
            </Button>
          )}
        </AccessDeniedWrapper>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <HeaderTitle>
          <h1>
            <Shield size={28} aria-hidden />
            Staff
          </h1>
          <p>
            Instructors and administrators across the organization.
            {user?.userType === 'admin'
              ? ' Grant or remove full admin access; promoted users should sign out and sign in again.'
              : ' View only — contact an admin to change roles.'}
          </p>
        </HeaderTitle>
        <HeaderActions>
          <AdminHubScopeSelect
            user={user}
            value={adminHubFilter}
            onChange={setAdminHubFilter}
            id="staff-page-hub-filter"
            label="Hub filter"
          />
          <SearchWrap>
            <SearchIconAbsolute size={20} />
            <SearchInput
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search staff"
            />
          </SearchWrap>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back to Dashboard
            </Button>
          )}
        </HeaderActions>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatIcon>
            <PersonIcon size={32} />
          </StatIcon>
          <StatValue>{instructorCount}</StatValue>
          <StatLabel>Instructors</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>
            <Shield size={32} />
          </StatIcon>
          <StatValue>{adminCount}</StatValue>
          <StatLabel>Administrators</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>
            <PersonIcon size={32} />
          </StatIcon>
          <StatValue>{staffRows.length}</StatValue>
          <StatLabel>Total listed</StatLabel>
        </StatCard>
      </StatsGrid>

      {loading ? (
        <LoadingState>Loading staff accounts…</LoadingState>
      ) : staffRows.length === 0 ? (
        <EmptyState>
          <h3>No staff accounts found</h3>
          <p>Try another hub filter or clear your search.</p>
        </EmptyState>
      ) : (
        <UsersTable>
          <TableWrapper>
            <TableHeader>
              <div>Name / email</div>
              <div>Hub</div>
              <div>Last sign-in</div>
              <div>Type</div>
              <RightAlignedCell>Actions</RightAlignedCell>
            </TableHeader>
            {staffRows.map((row) => {
              const uid = String(row.id || row.uid || '');
              const isSelf = uid === user?.uid;
              const role = row.userType === 'admin' ? 'admin' : 'instructor';
              return (
                <TableRow key={uid}>
                  <UserInfo>
                    <UserAvatar>{getInitials(String(row.displayName || 'Staff'))}</UserAvatar>
                    <UserDetails>
                      <UserNameHeading>{String(row.displayName || role)}</UserNameHeading>
                      <UserEmail>{String(row.email || '')}</UserEmail>
                    </UserDetails>
                  </UserInfo>
                  <ValueTextSmall>{resolvedHubLabel(row)}</ValueTextSmall>
                  <ValueTextSmall>{formatInstructorLastLogin(row)}</ValueTextSmall>
                  <div>
                    <UserType type={role}>{role}</UserType>
                  </div>
                  <ActionButtons>
                    {user?.userType === 'admin' ? (
                      <>
                        {role === 'admin' ? (
                          !isSelf &&
                          !isAdminEmail(String(row.email)) && (
                            <StaffActionButton
                              type="button"
                              variant="outline"
                              onClick={() => handleRemoveAdmin(row)}
                              disabled={roleChangeUid === uid}
                            >
                              {roleChangeUid === uid ? 'Updating…' : 'Remove admin'}
                            </StaffActionButton>
                          )
                        ) : (
                          !isSelf && (
                            <StaffActionButton
                              type="button"
                              variant="primary"
                              onClick={() => handleMakeAdmin(row)}
                              disabled={roleChangeUid === uid}
                            >
                              {roleChangeUid === uid ? 'Updating…' : 'Make admin'}
                            </StaffActionButton>
                          )
                        )}
                        <StaffActionButton
                          type="button"
                          variant="outline"
                          onClick={() => handleSendPasswordReset(String(row.email || ''))}
                          disabled={resetSending === row.email || !row.email}
                        >
                          <InlineIcon>
                            <FiLock size={14} />
                          </InlineIcon>
                          {resetSending === row.email ? 'Sending…' : 'Password reset'}
                        </StaffActionButton>
                        {!isSelf && role !== 'admin' && (
                          <DeleteButton variant="ghost" onClick={() => handleOpenDelete(row)}>
                            Remove
                          </DeleteButton>
                        )}
                      </>
                    ) : (
                      <ValueTextSmall>View only</ValueTextSmall>
                    )}
                  </ActionButtons>
                </TableRow>
              );
            })}
          </TableWrapper>
        </UsersTable>
      )}

      {showDeleteModal && userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </PageContainer>
  );
};

export default StaffAccountsPage;
