import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import DataService from '../../services/DataService';
import { effectiveStaffHubScope, initialStaffHubFilter, resolvedHubLabel, staffMayAccessHubForWrite } from '../../services/hubService';
import { AdminHubScopeSelect } from './AdminHubScopeSelect';
import { AttendanceService } from '../../services/attendanceService';
import { TimeService } from '../../services/timeService';
import { saveAs } from 'file-saver';
import { uniqueToast } from '../../utils/toastUtils';
import {
  ATTENDANCE_CSV_HEADERS,
  formatCsvDocument,
  buildAttendanceExportRows,
} from '../../utils/attendanceCsv';
import { AbsenceRecordModal } from './AbsenceRecordModal';
import { useStaffAttendanceActions } from '../../hooks/useStaffAttendanceActions';
import { CheckCircleIcon, LocationOnIcon } from '../Common/Icons';
import { FiLogOut } from 'react-icons/fi';

function recordMatchesDate(a: any, dateStr: string, ts: TimeService): boolean {
  if (a.date === dateStr) return true;
  const ci = a.checkInTime;
  if (!ci) return false;
  const d =
    ci instanceof Date ? ci : typeof (ci as { toDate?: () => Date }).toDate === 'function'
      ? (ci as { toDate: () => Date }).toDate()
      : new Date(ci);
  if (Number.isNaN(d.getTime())) return false;
  return ts.toHarareDateString(d) === dateStr;
}

function absenceReasonLabel(r?: string): string {
  if (!r) return '—';
  if (r === 'excused') return 'Excused';
  if (r === 'unexcused') return 'Unexcused';
  if (r === 'dropout') return 'Dropout';
  return r;
}

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
  
  @media (max-width: 420px) {
    padding: ${theme.spacing.sm};
  }
  
  @media (max-width: 360px) {
    padding: ${theme.spacing.xs};
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
  
  @media (max-width: 420px) {
    margin-bottom: ${theme.spacing.md};
    padding-bottom: ${theme.spacing.sm};
    gap: ${theme.spacing.md};
  }
  
  @media (max-width: 360px) {
    margin-bottom: ${theme.spacing.sm};
    gap: ${theme.spacing.sm};
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
    
    @media (max-width: 420px) {
      font-size: ${theme.fontSizes['2xl']};
      gap: ${theme.spacing.sm};
    }
    
    @media (max-width: 360px) {
      font-size: ${theme.fontSizes.xl};
      flex-direction: column;
      align-items: flex-start;
      gap: ${theme.spacing.xs};
    }
  }
  
  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
    font-size: ${theme.fontSizes.lg};
    
    @media (max-width: 420px) {
      font-size: ${theme.fontSizes.base};
    }
    
    @media (max-width: 360px) {
      font-size: ${theme.fontSizes.sm};
    }
  }
`;

const FilterSection = styled.div`
  background: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
  
  display: flex;
  gap: ${theme.spacing.md};
  align-items: flex-end;
  flex-wrap: wrap;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.lg};
    padding: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.sm};
    gap: ${theme.spacing.md};
  }
  
  @media (max-width: 420px) {
    padding: ${theme.spacing.xs};
    gap: ${theme.spacing.sm};
    border-radius: ${theme.borderRadius.md};
  }
  
  @media (max-width: 360px) {
    margin-bottom: ${theme.spacing.md};
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  min-width: 140px;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    min-width: unset;
    width: 100%;
  }
  
  label {
    font-size: ${theme.fontSizes.sm};
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
    
    @media (max-width: ${theme.breakpoints.mobile}) {
      font-size: ${theme.fontSizes.xs};
    }
  }
  
  select, input {
    padding: ${theme.spacing.sm};
    border: 1px solid ${theme.colors.gray300};
    border-radius: ${theme.borderRadius.md};
    font-size: ${theme.fontSizes.sm};
    background: ${theme.colors.white};
    width: 100%;
    box-sizing: border-box;
    
    @media (max-width: ${theme.breakpoints.mobile}) {
      padding: ${theme.spacing.md};
      font-size: ${theme.fontSizes.base};
      min-height: 44px;
    }
    
    @media (max-width: 420px) {
      padding: ${theme.spacing.md} ${theme.spacing.sm};
      font-size: ${theme.fontSizes.base};
      min-height: 48px;
    }
    
    @media (max-width: 360px) {
      padding: ${theme.spacing.lg} ${theme.spacing.sm};
      font-size: ${theme.fontSizes.lg};
      min-height: 52px;
    }
    
    &:focus {
      outline: none;
      border-color: ${theme.colors.primary};
      box-shadow: 0 0 0 2px ${theme.colors.primary}20;
    }
  }
`;

const StatsContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};
  align-items: center;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.sm};
    width: 100%;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing.sm};
  }
  
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.xs};
  }
`;

const StatItem = styled.span`
  font-weight: ${theme.fontWeights.medium};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: ${theme.colors.gray50};
  border-radius: ${theme.borderRadius.md};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    text-align: center;
    padding: ${theme.spacing.sm};
  }
  
  @media (max-width: 420px) {
    padding: ${theme.spacing.md};
    font-size: ${theme.fontSizes.base};
    font-weight: ${theme.fontWeights.semibold};
  }
  
  @media (max-width: 360px) {
    padding: ${theme.spacing.lg} ${theme.spacing.md};
    font-size: ${theme.fontSizes.lg};
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  align-items: center;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.sm};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    gap: ${theme.spacing.xs};
  }
`;

const AttendanceTableWrap = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  overflow: hidden;
`;

const TableScroll = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const AttendanceTable = styled.table`
  width: 100%;
  min-width: 920px;
  border-collapse: collapse;
  table-layout: fixed;
`;

const Th = styled.th`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  text-align: left;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${theme.colors.textSecondary};
  background: ${theme.colors.gray50};
  border-bottom: 2px solid ${theme.colors.gray200};
  vertical-align: middle;
`;

const Td = styled.td`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.gray100};
  vertical-align: middle;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textPrimary};
`;

const BodyRow = styled.tr`
  &:hover td {
    background: ${theme.colors.gray50};
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const TimeCell = styled.span`
  display: block;
  font-variant-numeric: tabular-nums;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textPrimary};
  font-weight: ${theme.fontWeights.medium};
`;

const SuccessButton = styled(Button)`
  background-color: ${theme.colors.success};
  border-color: ${theme.colors.success};
`;

const ActionTd = styled(Td)`
  text-align: right;
  width: 128px;
`;

const StatusSubtext = styled.div`
  margin-top: 4px;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  font-weight: ${theme.fontWeights.normal};
  text-transform: none;
  letter-spacing: normal;
  line-height: 1.35;
`;

const AbsenceLink = styled.button`
  margin-top: 4px;
  padding: 0;
  border: none;
  background: none;
  color: ${theme.colors.primary};
  font-size: ${theme.fontSizes.xs};
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: ${theme.colors.primaryDark};
  }
`;

const StudentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  min-width: 0;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    margin-bottom: ${theme.spacing.md};
    padding-bottom: ${theme.spacing.md};
    border-bottom: 1px solid ${theme.colors.gray100};
  }
  
  @media (max-width: 420px) {
    gap: ${theme.spacing.sm};
    margin-bottom: ${theme.spacing.sm};
    padding-bottom: ${theme.spacing.sm};
  }
  
  @media (max-width: 360px) {
    gap: ${theme.spacing.xs};
  }
`;

const StudentAvatar = styled.div`
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
  box-shadow: 0 2px 8px ${theme.colors.primary}20;
  flex-shrink: 0;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    width: 44px;
    height: 44px;
    font-size: ${theme.fontSizes.base};
  }
  
  @media (max-width: 420px) {
    width: 48px;
    height: 48px;
    font-size: ${theme.fontSizes.lg};
  }
  
  @media (max-width: 360px) {
    width: 52px;
    height: 52px;
    font-size: ${theme.fontSizes.xl};
  }
`;

const StudentDetails = styled.div`
  min-width: 0;
  flex: 1;

  h4 {
    margin: 0 0 2px 0;
    font-size: ${theme.fontSizes.base};
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textPrimary};
    line-height: 1.3;
    word-break: break-word;
  }

  p {
    margin: 0;
    font-size: ${theme.fontSizes.sm};
    color: ${theme.colors.textSecondary};
    line-height: 1.35;
    word-break: break-word;
  }
`;

const ProfileIssueTag = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: ${theme.spacing.xs};
  padding: 2px 8px;
  border-radius: ${theme.borderRadius.full};
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  vertical-align: middle;
`;

const StatusBadge = styled.div<{ status: 'present' | 'late' | 'absent' | 'completed' }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.status) {
      case 'present':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
          border-color: rgba(34, 197, 94, 0.2);
        `;
      case 'late':
        return `
          background: rgba(251, 191, 36, 0.1);
          color: #d97706;
          border-color: rgba(251, 191, 36, 0.2);
        `;
      case 'absent':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border-color: rgba(239, 68, 68, 0.2);
        `;
      case 'completed':
        return `
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
          border-color: rgba(59, 130, 246, 0.2);
        `;
      default:
        return `
          background: ${theme.colors.gray100};
          color: ${theme.colors.textSecondary};
          border-color: ${theme.colors.gray200};
        `;
    }
  }}
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${theme.fontSizes.sm};
    padding: ${theme.spacing.sm} ${theme.spacing.lg};
  }
`;

// NOTE: TimeInfo and LocationInfo were previously defined styled components
// that are no longer used. They have been removed to satisfy CI lint rules.

const HubCell = styled.span`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RowActionButton = styled(Button)`
  min-width: 108px;
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

interface AttendancePageProps {
  onBack?: () => void;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [adminHubFilter, setAdminHubFilter] = useState(() => initialStaffHubFilter(user));
  const effectiveHub = useMemo(() => effectiveStaffHubScope(user, adminHubFilter), [user, adminHubFilter]);
  const hubScopeActive = Boolean(effectiveHub);
  const canWriteSelectedHub =
    user?.userType === 'admin' ||
    (user?.userType === 'instructor' &&
      Boolean(effectiveHub) &&
      staffMayAccessHubForWrite(user, effectiveHub));
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const timeService = TimeService.getInstance();
  const [selectedDate, setSelectedDate] = useState(timeService.getCurrentDateString());
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fixingLocations, setFixingLocations] = useState(false);
  const [absenceModal, setAbsenceModal] = useState<{
    userId: string;
    userName: string;
    studentHubId?: string;
    initialReason?: 'excused' | 'unexcused' | 'dropout';
    initialNotes?: string;
  } | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const dataService = DataService.getInstance();
  const attendanceService = AttendanceService.getInstance();

  // ...rest of hooks and logic...


  const loadAttendanceSummary = useCallback(async () => {
    try {
      setLoading(true);
      await dataService.testConnection();
      const summary = await dataService.getDailyAttendanceSummary(selectedDate, effectiveHub);
      setAttendanceSummary(summary);
    } catch (error) {
      console.error('Error loading attendance summary:', error);
      // TODO: Toast removed for CI build. error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, effectiveHub]);

  useEffect(() => {
    const today = timeService.getCurrentDateString();

    // For today, use a real-time listener (feels “live” and avoids re-fetch loops).
    if (selectedDate === today) {
      setLoading(true);
      const unsubscribe = dataService.subscribeToTodayAttendance((summary) => {
        setAttendanceSummary(summary);
        setLoading(false);
      }, effectiveHub);
      return unsubscribe;
    }

    // For non-today dates, do a one-time fetch.
    loadAttendanceSummary();
  }, [selectedDate, loadAttendanceSummary, effectiveHub, timeService]);

  const refreshAttendance = useCallback(async () => {
    const summary = await dataService.getDailyAttendanceSummary(selectedDate, effectiveHub);
    setAttendanceSummary(summary);
  }, [dataService, selectedDate, effectiveHub]);

  const staffActions = useStaffAttendanceActions({
    user,
    effectiveHub,
    hubScopeActive,
    canWriteSelectedHub,
    onRefresh: refreshAttendance,
    attendanceList: attendanceSummary?.attendanceList,
  });

  const isToday = selectedDate === timeService.getCurrentDateString();

  const getFilteredAttendance = () => {
    if (!attendanceSummary) return [];
    
    let filtered = [...attendanceSummary.attendanceList];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(record => {
        const name = (record.userName || (record as any).name || '').toLowerCase();
        const studentId = (record.userId || '').toLowerCase();
        return name.includes(query) || studentId.includes(query);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => {
        if (statusFilter === 'present') {
          return record.status === 'present' || record.status === 'completed';
        } else if (statusFilter === 'on-time') {
          return (record.status === 'present' || record.status === 'completed') && !record.isLate;
        } else if (statusFilter === 'late') {
          return record.isLate;
        } else if (statusFilter === 'absent') {
          return record.status === 'absent';
        }
        return true;
      });
    }

    return filtered;
  };

  const profileMismatchCount = attendanceSummary
    ? (attendanceSummary.attendanceList || []).filter((r: any) => r.profileMissing).length
    : 0;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleFixLocations = async () => {
    if (fixingLocations) return;
    
    setFixingLocations(true);
    try {
      // TODO: Toast removed for CI build. info('Fixing location records...', { autoClose: 2000 });
      
      const result = await attendanceService.fixExistingLocationRecords();
      
      if (result.updated > 0) {
        // TODO: Toast removed for CI build.
        // success(
        //   `Successfully updated ${result.updated} location records!${
        //     result.errors > 0 ? ` (${result.errors} errors)` : ''
        //   }`,
        //   { autoClose: 5000 }
        // );
        
        // Reload the attendance data to show updated locations
        await loadAttendanceSummary();
      } else {
        // TODO: Toast removed for CI build. info('No location records needed updating.', { autoClose: 3000 });
      }
      
    } catch (error) {
      console.error('Error fixing locations:', error);
      // TODO: Toast removed for CI build. error('Failed to fix location records. Please try again.', { autoClose: 4000 });
    } finally {
      setFixingLocations(false);
    }
  };

  const handleOpenAbsenceModal = (record: any) => {
    if (user?.userType === 'instructor' && !staffMayAccessHubForWrite(user, record.hubId)) {
      uniqueToast.error('You can only edit absence records for students in your hub.');
      return;
    }
    setAbsenceModal({
      userId: record.userId,
      userName: record.userName || 'Student',
      studentHubId: record.hubId,
      initialReason: record.absenceReason,
      initialNotes: record.absenceNotes,
    });
  };

  const handleDownloadAttendanceCsv = async () => {
    if (csvLoading) return;
    setCsvLoading(true);
    try {
      await dataService.testConnection();
      const users = await dataService.getUsers(effectiveHub);
      const all = await dataService.getAttendance(undefined, effectiveHub);
      const forDay = all.filter((a: any) => recordMatchesDate(a, selectedDate, timeService));
      const students = users.filter(
        (u: any) => !u.userType || u.userType === 'attendee' || u.userType === 'student'
      );
      const dataRows = buildAttendanceExportRows(students, forDay, selectedDate);
      const csv = formatCsvDocument([...ATTENDANCE_CSV_HEADERS], dataRows);
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `attendance_${selectedDate}.csv`);
      uniqueToast.success('CSV downloaded.');
    } catch (e) {
      console.error(e);
      uniqueToast.error('Failed to build CSV.');
    } finally {
      setCsvLoading(false);
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
            Attendance Records</h1>
          <p>
            Check-in and check-out for the selected date (Africa/Harare). Staff can mark present after the
            student window closes.
          </p>
        </HeaderTitle>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Dashboard
          </Button>
        )}
      </Header>

      <FilterSection>
        <FilterGroup>
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
          />
        </FilterGroup>
        <FilterGroup>
          <label>Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </FilterGroup>
        <FilterGroup>
          <label>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="present">Present (All)</option>
            <option value="on-time">Present (On-Time)</option>
            <option value="late">Present (Late)</option>
            <option value="absent">Absent</option>
          </select>
        </FilterGroup>
        <AdminHubScopeSelect
          user={user}
          value={adminHubFilter}
          onChange={setAdminHubFilter}
          id="attendance-page-hub-filter"
        />
        {attendanceSummary && (
          <StatsContainer>
            <StatItem>Total: {attendanceSummary.totalUsers}</StatItem>
            <StatItem>Present: {attendanceSummary.presentCount}</StatItem>
            <StatItem>Absent: {attendanceSummary.absentCount}</StatItem>
            <StatItem>Late: {attendanceSummary.lateCount}</StatItem>
            {profileMismatchCount > 0 && (
              <StatItem title="Attendance rows that don't have a clean linked student profile">
                Profile issues: {profileMismatchCount}
              </StatItem>
            )}
          </StatsContainer>
        )}
      </FilterSection>
      
      <ActionButtonsContainer>
        {isToday && (
          <>
            <SuccessButton
              variant="primary"
              onClick={() => void staffActions.markAllPresent()}
              disabled={
                !hubScopeActive ||
                !canWriteSelectedHub ||
                loading ||
                staffActions.checkoutAllLoading ||
                staffActions.bulkLoading
              }
            >
              <CheckCircleIcon size={18} /> Check in all
            </SuccessButton>
            <Button
              variant="outline"
              onClick={() => void staffActions.checkOutAllOpen()}
              disabled={
                !hubScopeActive ||
                !canWriteSelectedHub ||
                loading ||
                staffActions.checkoutAllLoading ||
                staffActions.bulkLoading
              }
            >
              <FiLogOut size={18} style={{ marginRight: 8 }} />
              {staffActions.checkoutAllLoading ? 'Checking out…' : 'Check out everyone'}
            </Button>
          </>
        )}
        <Button variant="outline" onClick={() => { setSelectedDate(''); setStatusFilter('all'); setSearchQuery(''); }}>
          Clear Filters
        </Button>
        <Button
          variant="secondary"
          onClick={handleDownloadAttendanceCsv}
          disabled={csvLoading || loading}
        >
          {csvLoading ? 'Preparing CSV…' : 'Download CSV (this date)'}
        </Button>
        {user?.userType === 'admin' && (
          <Button 
            variant="secondary" 
            onClick={handleFixLocations}
            disabled={fixingLocations}
          >
            <LocationOnIcon size={16} style={{ marginRight: theme.spacing.xs }} />
            {fixingLocations ? 'Fixing Locations...' : 'Fix Location Records'}
          </Button>
        )}
      </ActionButtonsContainer>

      {loading ? (
        <LoadingState>
          Loading attendance records...
        </LoadingState>
      ) : getFilteredAttendance().length === 0 ? (
        <EmptyState>
          <h3>No Attendance Records</h3>
          <p>No attendance records match your current filters.</p>
        </EmptyState>
      ) : (
        <AttendanceTableWrap>
          <TableScroll>
            <AttendanceTable>
              <colgroup>
                <col style={{ width: '30%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Hub</Th>
                  <Th>Status</Th>
                  <Th>Check-in</Th>
                  <Th>Check-out</Th>
                  <Th style={{ textAlign: 'right' }}>Action</Th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAttendance().map((record) => {
                  const meta = staffActions.rowMeta(record);
                  const canWriteRow =
                    user?.userType === 'admin' ||
                    (user?.userType === 'instructor' && staffMayAccessHubForWrite(user, record.hubId));
                  const studentId = record.userId;
                  const studentName = record.userName || 'Unknown Student';
                  const hubLabel = resolvedHubLabel({
                    hubId: (record as any).hubId,
                    hubName: (record as any).hubName,
                  });
                  const statusKey =
                    record.status === 'completed' ? 'completed' : record.status;

                  return (
                    <BodyRow key={record.userId}>
                      <Td>
                        <StudentInfo>
                          <StudentAvatar>
                            {getInitials(record.userName || 'Unknown')}
                          </StudentAvatar>
                          <StudentDetails>
                            <h4>
                              {record.userName || 'Unknown Student'}
                              {(record as any).profileMissing && (
                                <ProfileIssueTag title="This attendance row could not be linked to a valid student profile.">
                                  Profile issue
                                </ProfileIssueTag>
                              )}
                            </h4>
                            <p>{record.userEmail}</p>
                          </StudentDetails>
                        </StudentInfo>
                      </Td>
                      <Td title={hubLabel}>
                        <HubCell>{hubLabel}</HubCell>
                      </Td>
                      <Td>
                        <StatusBadge status={statusKey}>
                          <CheckCircleIcon size={12} />
                          {record.status === 'completed' ? 'present' : record.status}
                        </StatusBadge>
                        {record.status === 'absent' && (
                          <StatusSubtext>
                            {absenceReasonLabel(record.absenceReason)}
                            {record.absenceNotes ? ` — ${record.absenceNotes}` : ''}
                            {canWriteRow && (
                              <>
                                <br />
                                <AbsenceLink type="button" onClick={() => handleOpenAbsenceModal(record)}>
                                  {record.absenceReason ? 'Edit absence' : 'Record absence'}
                                </AbsenceLink>
                              </>
                            )}
                          </StatusSubtext>
                        )}
                        {(record.status === 'late' || record.isLate) && record.lateReason && (
                          <StatusSubtext title={record.lateReason}>Late: {record.lateReason}</StatusSubtext>
                        )}
                      </Td>
                      <Td>
                        <TimeCell>{meta.checkInDisp}</TimeCell>
                      </Td>
                      <Td>
                        <TimeCell>{meta.checkOutDisp}</TimeCell>
                      </Td>
                      <ActionTd>
                        {canWriteRow && isToday && !meta.hasIn && (
                          <RowActionButton
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              void staffActions.markPresent(studentId, studentName, record.hubId)
                            }
                          >
                            Check in
                          </RowActionButton>
                        )}
                        {canWriteRow && isToday && meta.hasIn && !meta.checkedOut && (
                          <RowActionButton
                            variant="outline"
                            size="sm"
                            loading={staffActions.checkoutStudentId === studentId}
                            disabled={staffActions.checkoutAllLoading}
                            onClick={() =>
                              void staffActions.checkOutStudent(studentId, studentName, record.hubId)
                            }
                          >
                            <FiLogOut size={14} /> Check out
                          </RowActionButton>
                        )}
                        {canWriteRow && isToday && meta.hasIn && meta.checkedOut && (
                          <TimeCell style={{ color: theme.colors.textSecondary, fontWeight: 400 }}>
                            Done
                          </TimeCell>
                        )}
                        {(!canWriteRow || !isToday) && (
                          <TimeCell style={{ color: theme.colors.textSecondary, fontWeight: 400 }}>
                            —
                          </TimeCell>
                        )}
                      </ActionTd>
                    </BodyRow>
                  );
                })}
              </tbody>
            </AttendanceTable>
          </TableScroll>
        </AttendanceTableWrap>
      )}
      {absenceModal && user && (
        <AbsenceRecordModal
          open
          onClose={() => setAbsenceModal(null)}
          studentId={absenceModal.userId}
          studentName={absenceModal.userName}
          dateStr={selectedDate}
          hubId={effectiveHub ?? absenceModal.studentHubId}
          recordedByUid={user.uid}
          recordedByName={user.displayName || user.email || 'Staff'}
          initialReason={absenceModal.initialReason}
          initialNotes={absenceModal.initialNotes}
          onSaved={() => {
            void refreshAttendance();
          }}
        />
      )}
    </PageContainer>
  );
};
