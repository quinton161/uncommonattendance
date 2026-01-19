import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceService } from '../../services/attendanceService';
import { Layout, Container, AppHeader } from '../Common/Layout';
import { Button } from '../Common/Button';
import { Card } from '../Common/Card';
import { AttendanceRecord } from '../../types';
import { theme } from '../../styles/theme';

const DashboardContainer = styled.div`
  padding: ${theme.spacing.xl} 0;
  min-height: calc(100vh - 64px);
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const StatCard = styled(Card)`
  text-align: center;
  background: linear-gradient(135deg, ${theme.colors.primary}10 0%, ${theme.colors.secondary}10 100%);
`;

const StatNumber = styled.div`
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SectionTitle = styled.h2`
  margin-bottom: ${theme.spacing.lg};
  color: ${theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const LiveIndicator = styled.div`
  width: 8px;
  height: 8px;
  background-color: ${theme.colors.success};
  border-radius: 50%;
  animation: pulse 2s infinite;
`;

const AttendanceGrid = styled.div`
  display: grid;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
`;

const AttendanceItem = styled(Card)<{ isPresent?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  border-left: 4px solid ${({ isPresent }) => 
    isPresent ? theme.colors.success : theme.colors.gray300};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.spacing.sm};
  }
`;

const StudentAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary});
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.white};
  font-weight: ${theme.fontWeights.bold};
  font-size: ${theme.fontSizes.lg};
  flex-shrink: 0;
`;

const StudentInfo = styled.div`
  flex: 1;
`;

const StudentName = styled.div`
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.xs};
`;

const AttendanceDetails = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${theme.spacing.xs};
  }
`;

const StatusBadge = styled.span<{ status: 'present' | 'absent' }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: ${({ status }) => 
    status === 'present' ? theme.colors.success : theme.colors.gray400};
  color: ${theme.colors.white};
`;

const FilterSection = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  align-items: center;
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterButton = styled(Button)<{ active?: boolean }>`
  ${({ active }) => active && `
    background-color: ${theme.colors.primary};
    color: ${theme.colors.white};
  `}
`;

const RefreshButton = styled(Button)`
  margin-left: auto;
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    margin-left: 0;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xl};
  color: ${theme.colors.textSecondary};
`;

const LogoutButton = styled(Button)`
  margin-left: auto;
`;

type FilterType = 'all' | 'present' | 'absent';

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [currentlyPresent, setCurrentlyPresent] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const attendanceService = AttendanceService.getInstance();

  useEffect(() => {
    loadData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [todayData, presentData] = await Promise.all([
        attendanceService.getAllTodayAttendance(),
        attendanceService.getCurrentlyPresentStudents(),
      ]);
      
      setTodayAttendance(todayData);
      setCurrentlyPresent(presentData);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  const getFilteredAttendance = () => {
    switch (filter) {
      case 'present':
        return todayAttendance.filter(record => 
          record.checkInTime && !record.checkOutTime
        );
      case 'absent':
        return todayAttendance.filter(record => 
          record.checkOutTime || !record.checkInTime
        );
      default:
        return todayAttendance;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStudentStatus = (record: AttendanceRecord): 'present' | 'absent' => {
    return record.checkInTime && !record.checkOutTime ? 'present' : 'absent';
  };

  const filteredAttendance = getFilteredAttendance();
  const totalStudents = todayAttendance.length;
  const presentCount = currentlyPresent.length;
  const absentCount = totalStudents - presentCount;

  if (loading) {
    return (
      <Layout>
        <AppHeader title="Admin Dashboard">
          <LogoutButton variant="outline" onClick={handleLogout}>
            Logout
          </LogoutButton>
        </AppHeader>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 64px)',
          fontSize: '18px',
          color: theme.colors.textSecondary
        }}>
          Loading dashboard...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AppHeader title="Admin Dashboard">
        <LogoutButton variant="outline" onClick={handleLogout}>
          Logout
        </LogoutButton>
      </AppHeader>
      
      <DashboardContainer>
        <Container>
          <StatsSection>
            <StatCard>
              <StatNumber>{totalStudents}</StatNumber>
              <StatLabel>Total Today</StatLabel>
            </StatCard>
            
            <StatCard>
              <StatNumber>{presentCount}</StatNumber>
              <StatLabel>Currently Present</StatLabel>
            </StatCard>
            
            <StatCard>
              <StatNumber>{absentCount}</StatNumber>
              <StatLabel>Checked Out</StatLabel>
            </StatCard>
            
            <StatCard>
              <StatNumber>
                {totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0}%
              </StatNumber>
              <StatLabel>Attendance Rate</StatLabel>
            </StatCard>
          </StatsSection>

          <SectionTitle>
            <LiveIndicator />
            Live Attendance
          </SectionTitle>

          <FilterSection>
            <FilterButton
              variant={filter === 'all' ? 'primary' : 'ghost'}
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All ({totalStudents})
            </FilterButton>
            
            <FilterButton
              variant={filter === 'present' ? 'primary' : 'ghost'}
              active={filter === 'present'}
              onClick={() => setFilter('present')}
            >
              Present ({presentCount})
            </FilterButton>
            
            <FilterButton
              variant={filter === 'absent' ? 'primary' : 'ghost'}
              active={filter === 'absent'}
              onClick={() => setFilter('absent')}
            >
              Checked Out ({absentCount})
            </FilterButton>

            <RefreshButton
              variant="outline"
              onClick={loadData}
              loading={loading}
            >
              Refresh
            </RefreshButton>
          </FilterSection>

          <AttendanceGrid>
            {filteredAttendance.length === 0 ? (
              <EmptyState>
                <p>No attendance records found for the selected filter.</p>
              </EmptyState>
            ) : (
              filteredAttendance.map((record) => {
                const status = getStudentStatus(record);
                return (
                  <AttendanceItem key={record.id} isPresent={status === 'present'}>
                    <StudentAvatar>
                      {getInitials(record.studentName)}
                    </StudentAvatar>
                    
                    <StudentInfo>
                      <StudentName>{record.studentName}</StudentName>
                      <AttendanceDetails>
                        <span>Check-in: {formatTime(record.checkInTime)}</span>
                        {record.checkOutTime && (
                          <span>Check-out: {formatTime(record.checkOutTime)}</span>
                        )}
                        {record.location?.address && (
                          <span>📍 {record.location.address}</span>
                        )}
                      </AttendanceDetails>
                    </StudentInfo>
                    
                    <StatusBadge status={status}>
                      {status}
                    </StatusBadge>
                  </AttendanceItem>
                );
              })
            )}
          </AttendanceGrid>
        </Container>
      </DashboardContainer>
    </Layout>
  );
};
