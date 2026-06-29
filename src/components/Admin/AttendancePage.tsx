import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import DataService from '../../services/DataService';
import { effectiveStaffHubScope, initialStaffHubFilter, staffMayAccessHubForWrite } from '../../services/hubService';
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

import { useStaffAttendanceActions } from '../../hooks/useStaffAttendanceActions';
import { FiLogOut } from 'react-icons/fi';
import { Search, Calendar, Filter, Download, Users, LogIn, LogOut } from 'lucide-react';

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


const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Space = styled.div<{ size?: string }>`
  height: ${({ size }) => size || '16px'};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;

  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderTitle = styled.div`
  h1 {
    font-size: 22px;
    font-weight: 800;
    color: ${theme.colors.textPrimary};
    margin: 0;
    letter-spacing: -0.03em;
  }
`;

const FilterSection = styled.div`
  background: #ffffff;
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 82, 204, 0.06);
`;

const FilterRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;

  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;

  label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${theme.colors.textSecondary};
    display: flex;
    align-items: center;
    gap: 4px;
  }

  select, input {
    padding: 8px 12px;
    border: 1px solid rgba(0, 82, 204, 0.12);
    border-radius: 10px;
    font-size: 13px;
    background: #ffffff;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: ${theme.colors.primary};
      box-shadow: 0 0 0 3px rgba(0, 82, 204, 0.08);
    }
  }
`;

const SearchInput = styled.input`
  padding: 8px 12px 8px 36px;
  border: 1px solid rgba(0, 82, 204, 0.12);
  border-radius: 10px;
  font-size: 13px;
  background: #ffffff;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(0, 82, 204, 0.08);
  }
`;

const SearchWrap = styled.div`
  position: relative;
  min-width: 180px;
  flex: 1;

  svg {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: ${theme.colors.textLight};
    pointer-events: none;
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div<{ $color: string; $bg: string }>`
  background: #ffffff;
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 82, 204, 0.06);
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${({ $color }) => $color};
    border-radius: 0 3px 3px 0;
  }
`;

const StatIconWrap = styled.div<{ $bg: string }>`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.span`
  font-size: 20px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  line-height: 1.2;
`;

const StatLabel = styled.span`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  font-weight: 500;
  margin-top: 2px;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;

  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const ActionBtn = styled(Button)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s ease;
  white-space: nowrap;

  svg {
    flex-shrink: 0;
  }
`;

const CheckInBtn = styled(ActionBtn)`
  background: linear-gradient(135deg, #059669, #047857);
  border: none;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #047857, #065f46);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CheckOutBtn = styled(ActionBtn)`
  background: linear-gradient(135deg, #d97706, #b45309);
  border: none;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.25);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #b45309, #92400e);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GhostBtn = styled(ActionBtn)`
  background: transparent;
  border: 1px solid rgba(0, 82, 204, 0.12);
  color: ${theme.colors.textSecondary};

  &:hover:not(:disabled) {
    background: #f8faff;
    border-color: rgba(0, 82, 204, 0.2);
    color: ${theme.colors.primary};
  }
`;

const CsvBtn = styled(ActionBtn)`
  background: #ffffff;
  border: 1px solid rgba(0, 82, 204, 0.12);
  color: ${theme.colors.primary};

  &:hover:not(:disabled) {
    background: #f0f5ff;
    border-color: ${theme.colors.primary};
  }
`;

const FixBtn = styled(ActionBtn)`
  background: #ffffff;
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #dc2626;

  &:hover:not(:disabled) {
    background: #fef2f2;
    border-color: #dc2626;
  }
`;

const TableCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 82, 204, 0.06);
  overflow: hidden;
`;

const TableScroll = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.table`
  width: 100%;
  min-width: 750px;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 14px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${theme.colors.textSecondary};
  background: #f8faff;
  border-bottom: 1px solid rgba(0, 82, 204, 0.06);
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Td = styled.td`
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0, 82, 204, 0.04);
  font-size: 13px;
  color: ${theme.colors.textPrimary};
  vertical-align: middle;
`;

const Tr = styled.tr`
  &:hover td {
    background: #fafbff;
  }
`;

const StudentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const StudentAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0052CC, #0747A6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 82, 204, 0.15);
`;

const StudentDetails = styled.div`
  min-width: 0;
  flex: 1;

  h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: ${theme.colors.textPrimary};
    line-height: 1.3;
    word-break: break-word;
  }

  p {
    margin: 2px 0 0;
    font-size: 12px;
    color: ${theme.colors.textSecondary};
    word-break: break-word;
  }
`;

const ProfileIssueTag = styled.span`
  display: inline-flex;
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 100px;
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
  font-size: 10px;
  font-weight: 700;
  vertical-align: middle;
`;

const TimeCell = styled.span`
  display: block;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const DurationCell = styled.span`
  font-weight: 700;
  color: #F59E0B;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background: ${({ $status }) =>
    $status === 'present' ? 'rgba(5, 150, 105, 0.1)' :
    $status === 'late' ? 'rgba(245, 158, 11, 0.1)' :
    'rgba(239, 68, 68, 0.1)'};
  color: ${({ $status }) =>
    $status === 'present' ? '#059669' :
    $status === 'late' ? '#d97706' :
    '#dc2626'};
`;

const StatusSubtext = styled.div`
  margin-top: 4px;
  font-size: 11px;
  color: ${theme.colors.textSecondary};
`;

const ActionTd = styled(Td)`
  text-align: right;
  width: 120px;
`;

const RowActionBtn = styled(Button)`
  min-width: 96px;
  font-size: 12px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${theme.colors.textSecondary};

  h3 {
    font-size: 16px;
    font-weight: 700;
    color: ${theme.colors.textPrimary};
    margin: 0 0 4px;
  }

  p {
    margin: 0;
    font-size: 13px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  color: ${theme.colors.textLight};
  font-size: 14px;
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
  const [csvLoading, setCsvLoading] = useState(false);
  const dataService = DataService.getInstance();
  const attendanceService = AttendanceService.getInstance();

  const loadAttendanceSummary = useCallback(async () => {
    try {
      setLoading(true);
      await dataService.testConnection();
      const summary = await dataService.getDailyAttendanceSummary(selectedDate, effectiveHub);
      setAttendanceSummary(summary);
    } catch (error) {
      console.error('Error loading attendance summary:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, effectiveHub]);

  useEffect(() => {
    const today = timeService.getCurrentDateString();

    if (selectedDate === today) {
      setLoading(true);
      const unsubscribe = dataService.subscribeToTodayAttendance((summary) => {
        setAttendanceSummary(summary);
        setLoading(false);
      }, effectiveHub);
      return unsubscribe;
    }

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


  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleFixLocations = async () => {
    if (fixingLocations) return;

    setFixingLocations(true);
    try {
      const result = await attendanceService.fixExistingLocationRecords();

      if (result.updated > 0) {
        await loadAttendanceSummary();
      }
    } catch (error) {
      console.error('Error fixing locations:', error);
    } finally {
      setFixingLocations(false);
    }
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
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textPrimary }}>Access Denied</h2>
          <p style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Only administrators and instructors can access this page.</p>
          {onBack && (
            <Space size="20px" />
          )}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <HeaderTitle>
          <h1>Attendance Records</h1>
        </HeaderTitle>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Dashboard
          </Button>
        )}
      </Header>

      {attendanceSummary && (
        <StatsRow>
          <StatCard $color="#0052CC" $bg="rgba(0, 82, 204, 0.1)">
            <StatIconWrap $bg="rgba(0, 82, 204, 0.1)">
              <Users size={18} color="#0052CC" />
            </StatIconWrap>
            <StatInfo>
              <StatValue>{attendanceSummary.totalUsers}</StatValue>
              <StatLabel>Total Students</StatLabel>
            </StatInfo>
          </StatCard>
          <StatCard $color="#059669" $bg="rgba(5, 150, 105, 0.1)">
            <StatIconWrap $bg="rgba(5, 150, 105, 0.1)">
              <LogIn size={18} color="#059669" />
            </StatIconWrap>
            <StatInfo>
              <StatValue>{attendanceSummary.presentCount}</StatValue>
              <StatLabel>Present</StatLabel>
            </StatInfo>
          </StatCard>
          <StatCard $color="#dc2626" $bg="rgba(220, 38, 38, 0.1)">
            <StatIconWrap $bg="rgba(220, 38, 38, 0.1)">
              <LogOut size={18} color="#dc2626" />
            </StatIconWrap>
            <StatInfo>
              <StatValue>{attendanceSummary.absentCount}</StatValue>
              <StatLabel>Absent</StatLabel>
            </StatInfo>
          </StatCard>
          <StatCard $color="#d97706" $bg="rgba(217, 119, 6, 0.1)">
            <StatIconWrap $bg="rgba(217, 119, 6, 0.1)">
              <Calendar size={18} color="#d97706" />
            </StatIconWrap>
            <StatInfo>
              <StatValue>{attendanceSummary.lateCount}</StatValue>
              <StatLabel>Late</StatLabel>
            </StatInfo>
          </StatCard>
        </StatsRow>
      )}

      <FilterSection>
        <FilterRow>
          <SearchWrap>
            <Search size={15} />
            <SearchInput
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchWrap>
          <FilterGroup>
            <label><Calendar size={12} />Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </FilterGroup>
          <FilterGroup>
            <label><Filter size={12} />Status</label>
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
        </FilterRow>
      </FilterSection>

      <ActionBar>
        <ActionGroup>
          {isToday && (
            <>
              <CheckInBtn
                onClick={() => void staffActions.markAllPresent()}
                disabled={
                  !hubScopeActive ||
                  !canWriteSelectedHub ||
                  loading ||
                  staffActions.checkoutAllLoading ||
                  staffActions.bulkLoading
                }
              >
                <LogIn size={15} /> Check in all
              </CheckInBtn>
              <CheckOutBtn
                onClick={() => void staffActions.checkOutAllOpen()}
                disabled={
                  !hubScopeActive ||
                  !canWriteSelectedHub ||
                  loading ||
                  staffActions.checkoutAllLoading ||
                  staffActions.bulkLoading
                }
              >
                <LogOut size={15} />
                {staffActions.checkoutAllLoading ? 'Checking out…' : 'Check out everyone'}
              </CheckOutBtn>
            </>
          )}
        </ActionGroup>
        <ActionGroup>
          <GhostBtn onClick={() => { setSelectedDate(''); setStatusFilter('all'); setSearchQuery(''); }}>
            Clear Filters
          </GhostBtn>
          <CsvBtn
            onClick={handleDownloadAttendanceCsv}
            disabled={csvLoading || loading}
          >
            <Download size={15} />
            {csvLoading ? 'Preparing CSV…' : 'Download CSV'}
          </CsvBtn>
          {user?.userType === 'admin' && (
            <FixBtn
              onClick={handleFixLocations}
              disabled={fixingLocations}
            >
              {fixingLocations ? 'Fixing Locations...' : 'Fix Locations'}
            </FixBtn>
          )}
        </ActionGroup>
      </ActionBar>

      {loading ? (
        <LoadingState>
          Loading attendance records...
        </LoadingState>
      ) : getFilteredAttendance().length === 0 ? (
        <TableCard>
          <EmptyState>
            <h3>No Attendance Records</h3>
            <p>No attendance records match your current filters.</p>
          </EmptyState>
        </TableCard>
      ) : (
        <TableCard>
          <TableScroll>
            <Table>
              <colgroup>
                <col style={{ width: '26%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '19%' }} />
              </colgroup>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Check In</Th>
                  <Th>Check Out</Th>
                  <Th>Duration</Th>
                  <Th>Status</Th>
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
                  const studentName = record.userName || record.userEmail || 'User';
                  const statusKey =
                    record.status === 'completed' ? 'present' : record.status;

                  return (
                    <Tr key={record.userId}>
                      <Td>
                        <StudentInfo>
                          <StudentAvatar>
                            {getInitials(record.userName || record.userEmail || 'User')}
                          </StudentAvatar>
                          <StudentDetails>
                            <h4>
                              {record.userName || record.userEmail || 'User'}
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
                      <Td>
                        <TimeCell>{meta.checkInDisp}</TimeCell>
                      </Td>
                      <Td>
                        <TimeCell>{meta.checkOutDisp}</TimeCell>
                      </Td>
                      <Td>
                        <DurationCell>
                          {(() => {
                            if (meta.checkedOut && record.checkInTime && record.checkOutTime) {
                              const start = new Date(record.checkInTime).getTime();
                              const end = new Date(record.checkOutTime).getTime();
                              if (!isNaN(start) && !isNaN(end) && end > start) {
                                const diffMins = Math.floor((end - start) / 60000);
                                const h = Math.floor(diffMins / 60);
                                const m = diffMins % 60;
                                return h > 0 ? `${h}h ${m}m` : `${m}m`;
                              }
                            }
                            return '—';
                          })()}
                        </DurationCell>
                      </Td>
                      <Td>
                        <StatusBadge $status={statusKey}>
                          {statusKey === 'present' && <Users size={11} />}
                          {statusKey}
                        </StatusBadge>
                        {(record.status === 'late' || record.isLate) && record.lateReason && (
                          <StatusSubtext title={record.lateReason}>Late: {record.lateReason}</StatusSubtext>
                        )}
                      </Td>
                      <ActionTd>
                        {canWriteRow && isToday && !meta.hasIn && (
                          <RowActionBtn
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              void staffActions.markPresent(studentId, studentName, record.hubId)
                            }
                          >
                            Check in
                          </RowActionBtn>
                        )}
                        {canWriteRow && isToday && meta.hasIn && !meta.checkedOut && (
                          <RowActionBtn
                            variant="outline"
                            size="sm"
                            loading={staffActions.checkoutStudentId === studentId}
                            disabled={staffActions.checkoutAllLoading}
                            onClick={() =>
                              void staffActions.checkOutStudent(studentId, studentName, record.hubId)
                            }
                          >
                            <FiLogOut size={12} style={{ marginRight: 4 }} /> Check out
                          </RowActionBtn>
                        )}
                        {canWriteRow && isToday && meta.hasIn && meta.checkedOut && (
                          <span style={{ color: theme.colors.textLight, fontSize: 12 }}>Done</span>
                        )}
                        {(!canWriteRow || !isToday) && (
                          <span style={{ color: theme.colors.textLight, fontSize: 12 }}>—</span>
                        )}
                      </ActionTd>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableScroll>
        </TableCard>
      )}

    </PageContainer>
  );
};
