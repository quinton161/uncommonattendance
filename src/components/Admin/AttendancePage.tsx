import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import DataService from '../../services/DataService';
import { UncommonLogo } from '../Common/UncommonLogo';
import { uniqueToast } from '../../utils/toastUtils';
import {
  CheckCircleIcon,
  TodayIcon,
  LocationOnIcon,
  LoginIcon,
  LogoutIcon,
  PersonIcon
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
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 150px 120px 150px 150px 200px;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.gray200};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSizes.sm};
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 150px 120px 150px 150px 200px;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.gray100};
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${theme.colors.gray50};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const StudentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const StudentAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${theme.borderRadius.full};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryLight} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.white};
  font-weight: ${theme.fontWeights.semibold};
  font-size: ${theme.fontSizes.sm};
`;

const StudentDetails = styled.div`
  h4 {
    margin: 0 0 ${theme.spacing.xs} 0;
    font-size: ${theme.fontSizes.base};
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
  }
`;

const DateDisplay = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  
  .date {
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
  }
`;

const StatusBadge = styled.div<{ status: 'present' | 'late' | 'absent' }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    switch (props.status) {
      case 'present':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        `;
      case 'late':
        return `
          background: rgba(251, 191, 36, 0.1);
          color: #d97706;
        `;
      case 'absent':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        `;
      default:
        return `
          background: ${theme.colors.gray100};
          color: ${theme.colors.textSecondary};
        `;
    }
  }}
`;

const TimeDisplay = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  
  .time {
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
  }
`;

const LocationDisplay = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  
  .address {
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

interface AttendancePageProps {
  onBack?: () => void;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const dataService = DataService.getInstance();

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
      <Button variant="outline" onClick={() => { setSelectedDate(''); setStatusFilter('all'); }}>
        Clear Filters
      </Button>

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
            <div>Location</div>
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
                  <TodayIcon size={14} style={{ marginRight: theme.spacing.xs }} />
                  <span className="date">{selectedDate}</span>
                </DateDisplay>
                
                <div>
                  <StatusBadge status={record.status}>
                    <CheckCircleIcon size={12} />
                    {record.status}
                    {record.isLate && <span style={{ color: '#f59e0b', marginLeft: '4px' }}>(Late)</span>}
                  </StatusBadge>
                </div>
                
                <TimeDisplay>
                  {record.checkInTime ? (
                    <>
                      <LoginIcon size={14} />
                      <span className="time">{formatTime(record.checkInTime)}</span>
                    </>
                  ) : (
                    '-'
                  )}
                </TimeDisplay>
                
                <TimeDisplay>
                  {record.checkOutTime ? (
                    <>
                      <LogoutIcon size={14} />
                      <span className="time">{formatTime(record.checkOutTime)}</span>
                    </>
                  ) : (
                    '-'
                  )}
                </TimeDisplay>
                
                <LocationDisplay>
                  <LocationOnIcon size={14} />
                  <span className="address">
                    {record.location?.address || 'Unknown Location'}
                  </span>
                </LocationDisplay>
              </TableRow>
            ))}
        </AttendanceTable>
      )}
    </PageContainer>
  );
};
