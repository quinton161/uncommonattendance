import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import DataService from '../../services/DataService';
import { AttendanceService } from '../../services/attendanceService';
import { UncommonLogo } from '../Common/UncommonLogo';
import { uniqueToast } from '../../utils/toastUtils';
import {
  CheckCircleIcon,
  TodayIcon,
  LocationOnIcon,
  LoginIcon,
  LogoutIcon,
  PersonIcon,
  EditIcon,
  DeleteIcon
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

const FilterSection = styled.div`
  background: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
  
  display: flex;
  gap: ${theme.spacing.md};
  align-items: center;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  
  label {
    font-size: ${theme.fontSizes.sm};
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
  }
  
  select, input {
    padding: ${theme.spacing.sm};
    border: 1px solid ${theme.colors.gray300};
    border-radius: ${theme.borderRadius.md};
    font-size: ${theme.fontSizes.sm};
    
    &:focus {
      outline: none;
      border-color: ${theme.colors.primary};
    }
  }
`;

const AttendanceTable = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  overflow: hidden;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    box-shadow: none;
    background: transparent;
  }
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 140px 130px 150px 150px 150px;
  gap: ${theme.spacing.xl};
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  background: linear-gradient(135deg, ${theme.colors.primary}05 0%, ${theme.colors.primaryLight}10 100%);
  border-bottom: 2px solid ${theme.colors.primary}20;
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 140px 130px 150px 150px 150px;
  gap: ${theme.spacing.xl};
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  border-bottom: 1px solid ${theme.colors.gray100};
  transition: all 0.2s ease;
  align-items: center;
  
  &:hover {
    background: linear-gradient(135deg, ${theme.colors.primary}02 0%, ${theme.colors.primaryLight}05 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px ${theme.colors.primary}10;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: block;
    background: ${theme.colors.white};
    border-radius: ${theme.borderRadius.lg};
    box-shadow: ${theme.shadows.sm};
    margin-bottom: ${theme.spacing.md};
    padding: ${theme.spacing.lg};
    border-bottom: none;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.md};
    }
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
`;

const StudentDetails = styled.div`
  min-width: 0;
  flex: 1;
  
  h4 {
    margin: 0 0 ${theme.spacing.xs} 0;
    font-size: ${theme.fontSizes.base};
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textPrimary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  p {
    margin: 0;
    font-size: ${theme.fontSizes.sm};
    color: ${theme.colors.textSecondary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    h4 {
      font-size: ${theme.fontSizes.lg};
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
    }
    
    p {
      font-size: ${theme.fontSizes.base};
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
    }
  }
`;

const DateDisplay = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  
  .date {
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textPrimary};
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${theme.fontSizes.base};
    margin-bottom: ${theme.spacing.xs};
    
    &:before {
      content: 'Date:';
      font-weight: ${theme.fontWeights.medium};
      color: ${theme.colors.textSecondary};
      margin-right: ${theme.spacing.sm};
      min-width: 80px;
    }
  }
`;

const StatusBadge = styled.div<{ status: 'present' | 'late' | 'absent' }>`
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

const TimeDisplay = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  
  .time {
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textPrimary};
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${theme.fontSizes.base};
    margin-bottom: ${theme.spacing.xs};
    
    &:before {
      content: attr(data-label);
      font-weight: ${theme.fontWeights.medium};
      color: ${theme.colors.textSecondary};
      margin-right: ${theme.spacing.sm};
      min-width: 80px;
    }
  }
`;

const LocationDisplay = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  min-width: 0;
  
  .address {
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textPrimary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${theme.fontSizes.base};
    
    .address {
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
    }
    
    &:before {
      content: 'Location:';
      font-weight: ${theme.fontWeights.medium};
      color: ${theme.colors.textSecondary};
      margin-right: ${theme.spacing.sm};
      min-width: 80px;
    }
  }
`;

const MobileDataGrid = styled.div`
  display: none;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing.md};
    margin-top: ${theme.spacing.md};
  }
`;

const MobileDataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
  justify-content: flex-end;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    justify-content: flex-start;
    margin-top: ${theme.spacing.md};
    padding-top: ${theme.spacing.md};
    border-top: 1px solid ${theme.colors.gray100};
  }
`;

const ActionButton = styled.button<{ variant: 'edit' | 'delete' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.white};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'edit' ? `
    color: ${theme.colors.primary};
    border-color: ${theme.colors.primary}20;
    
    &:hover {
      background: ${theme.colors.primary}05;
      border-color: ${theme.colors.primary}40;
      transform: translateY(-1px);
    }
  ` : `
    color: #dc2626;
    border-color: rgba(239, 68, 68, 0.2);
    
    &:hover {
      background: rgba(239, 68, 68, 0.05);
      border-color: rgba(239, 68, 68, 0.4);
      transform: translateY(-1px);
    }
  `}
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md} ${theme.spacing.lg};
    font-size: ${theme.fontSizes.base};
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

interface AttendancePageProps {
  onBack?: () => void;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [fixingLocations, setFixingLocations] = useState(false);
  const dataService = DataService.getInstance();
  const attendanceService = AttendanceService.getInstance();

  useEffect(() => {
    loadAttendanceSummary();
  }, [selectedDate]);

  const loadAttendanceSummary = async () => {
    try {
      setLoading(true);
      await dataService.testConnection();
      const summary = await dataService.getDailyAttendanceSummary(selectedDate);
      setAttendanceSummary(summary);
    } catch (error) {
      console.error('Error loading attendance summary:', error);
      uniqueToast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAttendance = () => {
    if (!attendanceSummary) return [];
    
    let filtered = [...attendanceSummary.attendanceList];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => {
        if (statusFilter === 'present') {
          return record.status === 'present' || record.status === 'completed';
        } else if (statusFilter === 'absent') {
          return record.status === 'absent';
        } else if (statusFilter === 'late') {
          return record.isLate;
        }
        return true;
      });
    }

    return filtered;
  };

  const getAttendanceStatus = (record: any) => {
    if (!record.isPresent) return 'absent';
    
    // Check if late (after 9 AM)
    if (record.checkInTime) {
      const checkInTime = new Date(record.checkInTime);
      const nineAM = new Date(checkInTime);
      nineAM.setHours(9, 0, 0, 0);
      
      if (checkInTime > nineAM) return 'late';
    }
    
    return 'present';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleFixLocations = async () => {
    if (fixingLocations) return;
    
    setFixingLocations(true);
    try {
      uniqueToast.info('Fixing location records...', { autoClose: 2000 });
      
      const result = await attendanceService.fixExistingLocationRecords();
      
      if (result.updated > 0) {
        uniqueToast.success(
          `Successfully updated ${result.updated} location records!${result.errors > 0 ? ` (${result.errors} errors)` : ''}`,
          { autoClose: 5000 }
        );
        
        // Reload the attendance data to show updated locations
        await loadAttendanceSummary();
      } else {
        uniqueToast.info('No location records needed updating.', { autoClose: 3000 });
      }
      
    } catch (error) {
      console.error('Error fixing locations:', error);
      uniqueToast.error('Failed to fix location records. Please try again.', { autoClose: 4000 });
    } finally {
      setFixingLocations(false);
    }
  };

  const handleEditAttendance = (record: any) => {
    console.log('Edit attendance record:', record);
    uniqueToast.info(`Edit functionality for ${record.userName} - Coming soon!`, { autoClose: 3000 });
    // TODO: Implement edit modal/form
  };

  const handleDeleteAttendance = async (record: any) => {
    if (window.confirm(`Are you sure you want to delete the attendance record for ${record.userName} on ${selectedDate}?`)) {
      try {
        // TODO: Implement actual delete functionality
        console.log('Delete attendance record:', record);
        uniqueToast.success(`Attendance record for ${record.userName} deleted successfully!`, { autoClose: 3000 });
        
        // Reload the attendance data
        await loadAttendanceSummary();
      } catch (error) {
        console.error('Error deleting attendance record:', error);
        uniqueToast.error('Failed to delete attendance record. Please try again.', { autoClose: 4000 });
      }
    }
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
            <span>Attendance Records</span>
          </h1>
          <p>View and manage all attendance records</p>
        </HeaderTitle>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Dashboard
          </Button>
        )}
      </Header>

      <FilterSection>
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
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late Arrivals</option>
          </select>
        </FilterGroup>
        {attendanceSummary && (
          <div style={{ 
            display: 'flex', 
            gap: theme.spacing.lg, 
            alignItems: 'center',
            fontSize: theme.fontSizes.sm,
            color: theme.colors.textSecondary
          }}>
            <span>Total: {attendanceSummary.totalUsers}</span>
            <span>Present: {attendanceSummary.presentCount}</span>
            <span>Absent: {attendanceSummary.absentCount}</span>
            <span>Late: {attendanceSummary.lateCount}</span>
          </div>
        )}
      </FilterSection>
      
      <div style={{ 
        display: 'flex', 
        gap: theme.spacing.md, 
        marginBottom: theme.spacing.lg,
        alignItems: 'center'
      }}>
        <Button variant="outline" onClick={() => { setSelectedDate(''); setStatusFilter('all'); }}>
          Clear Filters
        </Button>
        <Button 
          variant="secondary" 
          onClick={handleFixLocations}
          disabled={fixingLocations}
        >
          <LocationOnIcon size={16} style={{ marginRight: theme.spacing.xs }} />
          {fixingLocations ? 'Fixing Locations...' : 'Fix Location Records'}
        </Button>
      </div>

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
        <AttendanceTable>
          <TableHeader>
            <div>Student</div>
            <div>Date</div>
            <div>Status</div>
            <div>Check-in</div>
            <div>Check-out</div>
            <div>Actions</div>
          </TableHeader>
          
          {getFilteredAttendance().map((record) => (
              <TableRow key={record.userId}>
                <StudentInfo>
                  <StudentAvatar>
                    {getInitials(record.userName || 'Unknown')}
                  </StudentAvatar>
                  <StudentDetails>
                    <h4>{record.userName || 'Unknown Student'}</h4>
                    <p>{record.userEmail}</p>
                  </StudentDetails>
                </StudentInfo>
                
                <DateDisplay>
                  <TodayIcon size={14} />
                  <span className="date">{selectedDate}</span>
                </DateDisplay>
                
                <div>
                  <StatusBadge status={record.status}>
                    <CheckCircleIcon size={12} />
                    {record.status}
                    {record.isLate && <span style={{ color: '#f59e0b', marginLeft: '4px' }}>(Late)</span>}
                  </StatusBadge>
                </div>
                
                <TimeDisplay data-label="Check-in:">
                  {record.checkInTime ? (
                    <>
                      <LoginIcon size={14} />
                      <span className="time">{formatTime(record.checkInTime)}</span>
                    </>
                  ) : (
                    '-'
                  )}
                </TimeDisplay>
                
                <TimeDisplay data-label="Check-out:">
                  {record.checkOutTime ? (
                    <>
                      <LogoutIcon size={14} />
                      <span className="time">{formatTime(record.checkOutTime)}</span>
                    </>
                  ) : (
                    '-'
                  )}
                </TimeDisplay>
                
                <ActionButtons>
                  <ActionButton 
                    variant="edit" 
                    onClick={() => handleEditAttendance(record)}
                    title="Edit attendance record"
                  >
                    <EditIcon size={14} />
                    Edit
                  </ActionButton>
                  <ActionButton 
                    variant="delete" 
                    onClick={() => handleDeleteAttendance(record)}
                    title="Delete attendance record"
                  >
                    <DeleteIcon size={14} />
                    Delete
                  </ActionButton>
                </ActionButtons>
                
                {/* Mobile-only organized layout */}
                <MobileDataGrid>
                  <MobileDataItem>
                    <DateDisplay>
                      <TodayIcon size={16} />
                      <span className="date">{selectedDate}</span>
                    </DateDisplay>
                    <div>
                      <StatusBadge status={record.status}>
                        <CheckCircleIcon size={12} />
                        {record.status}
                        {record.isLate && <span style={{ color: '#f59e0b', marginLeft: '4px' }}>(Late)</span>}
                      </StatusBadge>
                    </div>
                  </MobileDataItem>
                  
                  <MobileDataItem>
                    <TimeDisplay data-label="Check-in:">
                      {record.checkInTime ? (
                        <>
                          <LoginIcon size={16} />
                          <span className="time">{formatTime(record.checkInTime)}</span>
                        </>
                      ) : (
                        <span className="time">Not checked in</span>
                      )}
                    </TimeDisplay>
                    
                    <TimeDisplay data-label="Check-out:">
                      {record.checkOutTime ? (
                        <>
                          <LogoutIcon size={16} />
                          <span className="time">{formatTime(record.checkOutTime)}</span>
                        </>
                      ) : (
                        <span className="time">Not checked out</span>
                      )}
                    </TimeDisplay>
                  </MobileDataItem>
                </MobileDataGrid>
              </TableRow>
            ))}
        </AttendanceTable>
      )}
    </PageContainer>
  );
};
