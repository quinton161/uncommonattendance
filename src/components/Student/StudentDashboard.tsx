import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceService } from '../../services/attendanceService';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Layout, Container, AppHeader } from '../Common/Layout';
import { Button } from '../Common/Button';
import { Card } from '../Common/Card';
import { AttendanceRecord } from '../../types';
import { theme } from '../../styles/theme';

const DashboardContainer = styled.div`
  padding: ${theme.spacing.xl} 0;
  min-height: calc(100vh - 64px);
`;

const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
`;

const WelcomeTitle = styled.h1`
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.sm};
`;

const WelcomeSubtitle = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.lg};
`;

const ActionSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const StatusCard = styled(Card)<{ status: 'checked-in' | 'checked-out' }>`
  text-align: center;
  border: 2px solid ${({ status }) => {
    switch (status) {
      case 'checked-in': return theme.colors.success;
      case 'checked-out': return theme.colors.gray300;
      default: return theme.colors.gray300;
    }
  }};
  background-color: ${({ status }) => {
    switch (status) {
      case 'checked-in': return `${theme.colors.success}10`;
      case 'checked-out': return theme.colors.white;
      default: return theme.colors.white;
    }
  }};
`;

const StatusIcon = styled.div<{ status: 'checked-in' | 'checked-out' }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin: 0 auto ${theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.fontSizes['2xl']};
  background-color: ${({ status }) => {
    switch (status) {
      case 'checked-in': return theme.colors.success;
      case 'checked-out': return theme.colors.gray400;
      default: return theme.colors.gray400;
    }
  }};
  color: ${theme.colors.white};
`;

const StatusText = styled.h3`
  margin-bottom: ${theme.spacing.sm};
  color: ${theme.colors.textPrimary};
`;

const StatusTime = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
  margin-bottom: ${theme.spacing.md};
`;

const LocationInfo = styled.div`
  background-color: ${theme.colors.gray50};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.md};
`;

const LocationText = styled.p`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  margin: 0;
`;

const ErrorMessage = styled.div`
  background-color: ${theme.colors.danger}10;
  border: 1px solid ${theme.colors.danger}30;
  color: ${theme.colors.danger};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.sm};
  text-align: center;
  margin-bottom: ${theme.spacing.md};
`;

const HistorySection = styled.div`
  margin-top: ${theme.spacing.xl};
`;

const HistoryTitle = styled.h2`
  margin-bottom: ${theme.spacing.lg};
  color: ${theme.colors.textPrimary};
`;

const HistoryGrid = styled.div`
  display: grid;
  gap: ${theme.spacing.md};
`;

const HistoryItem = styled(Card)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.spacing.sm};
  }
`;

const HistoryDate = styled.div`
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textPrimary};
`;

const HistoryTimes = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${theme.spacing.xs};
  }
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

interface StudentDashboardProps {
  onNavigateToProfile?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateToProfile }) => {
  const { user, logout } = useAuth();
  const { getCurrentLocation, loading: locationLoading, error: locationError } = useGeolocation();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const attendanceService = AttendanceService.getInstance();

  useEffect(() => {
    loadTodayAttendance();
    loadAttendanceHistory();
  }, []);

  const loadTodayAttendance = async () => {
    if (!user) return;
    
    try {
      const attendance = await attendanceService.getTodayAttendance(user.uid);
      setTodayAttendance(attendance);
    } catch (err) {
      console.error('Failed to load today attendance:', err);
    }
  };

  const loadAttendanceHistory = async () => {
    if (!user) return;
    
    try {
      const history = await attendanceService.getAttendanceHistory(user.uid, 10);
      setAttendanceHistory(history);
    } catch (err) {
      console.error('Failed to load attendance history:', err);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      const location = await getCurrentLocation();
      const attendance = await attendanceService.checkIn(
        user.uid,
        user.displayName,
        location
      );
      setTodayAttendance(attendance);
      await loadAttendanceHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      const attendance = await attendanceService.checkOut(user.uid);
      setTodayAttendance(attendance);
      await loadAttendanceHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to check out');
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

  const getAttendanceStatus = (): 'checked-in' | 'checked-out' => {
    if (!todayAttendance) return 'checked-out';
    if (todayAttendance.checkInTime && !todayAttendance.checkOutTime) return 'checked-in';
    return 'checked-out';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const status = getAttendanceStatus();

  return (
    <Layout>
      <AppHeader>
        <HeaderButtons>
          {onNavigateToProfile && (
            <Button variant="ghost" onClick={onNavigateToProfile}>
              Profile
            </Button>
          )}
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </HeaderButtons>
      </AppHeader>
      
      <DashboardContainer>
        <Container>
          <WelcomeSection>
            <WelcomeTitle>Welcome back, {user?.displayName}!</WelcomeTitle>
            <WelcomeSubtitle>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </WelcomeSubtitle>
          </WelcomeSection>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {locationError && <ErrorMessage>{locationError}</ErrorMessage>}

          <ActionSection>
            <StatusCard status={status}>
              <StatusIcon status={status}>
                {status === 'checked-in' ? '✓' : '○'}
              </StatusIcon>
              
              <StatusText>
                {status === 'checked-in' ? 'Checked In' : 'Not Checked In'}
              </StatusText>
              
              {todayAttendance?.checkInTime && (
                <StatusTime>
                  Check-in: {formatTime(todayAttendance.checkInTime)}
                  {todayAttendance.checkOutTime && (
                    <> • Check-out: {formatTime(todayAttendance.checkOutTime)}</>
                  )}
                </StatusTime>
              )}

              {todayAttendance?.location && (
                <LocationInfo>
                  <LocationText>
                    📍 {todayAttendance.location.address || 
                        `${todayAttendance.location.latitude.toFixed(6)}, ${todayAttendance.location.longitude.toFixed(6)}`}
                  </LocationText>
                </LocationInfo>
              )}

              {status === 'checked-out' ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleCheckIn}
                  loading={loading || locationLoading}
                  disabled={loading || locationLoading}
                >
                  Check In
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={handleCheckOut}
                  loading={loading}
                  disabled={loading}
                >
                  Check Out
                </Button>
              )}
            </StatusCard>
          </ActionSection>

          <HistorySection>
            <HistoryTitle>Recent Attendance</HistoryTitle>
            <HistoryGrid>
              {attendanceHistory.length === 0 ? (
                <Card>
                  <p style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
                    No attendance history yet
                  </p>
                </Card>
              ) : (
                attendanceHistory.map((record) => (
                  <HistoryItem key={record.id}>
                    <HistoryDate>
                      {formatDate(record.date)}
                    </HistoryDate>
                    <HistoryTimes>
                      <span>In: {formatTime(record.checkInTime)}</span>
                      {record.checkOutTime && (
                        <span>Out: {formatTime(record.checkOutTime)}</span>
                      )}
                    </HistoryTimes>
                  </HistoryItem>
                ))
              )}
            </HistoryGrid>
          </HistorySection>
        </Container>
      </DashboardContainer>
    </Layout>
  );
};
