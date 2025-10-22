import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { Event } from '../../types';
import { Button } from '../Common/Button';
import { CreateEventForm } from './CreateEventForm';
import { theme } from '../../styles/theme';
import { doc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: ${theme.colors.backgroundSecondary};
  padding: ${theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  background: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${theme.colors.gray200};
`;

const Title = styled.h1`
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  margin: 0;
  color: ${theme.colors.textPrimary};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const LogoutButton = styled(Button)`
  background: ${theme.colors.white};
  color: ${theme.colors.primary};
  border: 1px solid ${theme.colors.primary};
  
  &:hover {
    background: ${theme.colors.primary};
    color: ${theme.colors.white};
  }
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const EventCard = styled.div`
  background: white;
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: ${theme.shadows.md};
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const EventTitle = styled.h3`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.semibold};
  margin: 0 0 ${theme.spacing.sm} 0;
  color: ${theme.colors.textPrimary};
`;

const EventDate = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
  margin: 0 0 ${theme.spacing.sm} 0;
`;

const EventLocation = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
  margin: 0 0 ${theme.spacing.md} 0;
`;

const EventDescription = styled.p`
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSizes.sm};
  margin: 0 0 ${theme.spacing.md} 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const EventStatus = styled.span<{ status: string }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.medium};
  text-transform: uppercase;
  
  ${props => {
    switch (props.status) {
      case 'published':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        `;
      case 'draft':
        return `
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
        `;
      case 'cancelled':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.1);
          color: #9ca3af;
        `;
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing['4xl']};
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${theme.colors.gray200};
`;

const EmptyStateTitle = styled.h2`
  font-size: ${theme.fontSizes.xl};
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.textPrimary};
`;

const EmptyStateText = styled.p`
  font-size: ${theme.fontSizes.base};
  color: ${theme.colors.textSecondary};
  margin-bottom: ${theme.spacing.lg};
`;

const AttendanceSection = styled.div`
  background: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${theme.colors.gray200};
  margin-bottom: ${theme.spacing.xl};
`;

const AttendanceTitle = styled.h2`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.semibold};
  margin: 0 0 ${theme.spacing.md} 0;
  color: ${theme.colors.textPrimary};
`;

const AttendanceInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md};
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.spacing.sm};
  }
`;

const AttendanceStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const StatusIndicator = styled.div<{ isCheckedIn: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.isCheckedIn ? theme.colors.success : theme.colors.gray400};
`;

const TimeDisplay = styled.span`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
`;

interface EventDashboardProps {
  onNavigateToProfile?: () => void;
}

export const EventDashboard: React.FC<EventDashboardProps> = ({ onNavigateToProfile }) => {
  const { user, logout } = useAuth();
  const { events, loading, getPublicEvents, getUserEvents } = useEvent();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    if (!user) return;
    
    try {
      if (user.userType === 'organizer' || user.userType === 'admin') {
        await getUserEvents(user.uid);
      } else {
        await getPublicEvents();
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCreateEventSuccess = () => {
    setShowCreateForm(false);
    loadEvents(); // Reload events to show the new one
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });
  };

  const handleCheckIn = async () => {
    if (!user) return;

    setAttendanceLoading(true);
    try {
      // Get current location
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;

      // Create attendance record
      const attendanceId = `${user.uid}_${new Date().toISOString().split('T')[0]}`;
      const attendanceData = {
        id: attendanceId,
        studentId: user.uid,
        studentName: user.displayName,
        checkInTime: new Date(),
        location: {
          latitude,
          longitude,
          address: 'Location captured'
        },
        date: new Date().toISOString().split('T')[0],
        isPresent: true
      };

      await setDoc(doc(db, 'attendance', attendanceId), attendanceData);

      setCheckedIn(true);
      setCheckInTime(new Date());
      
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in. Please make sure location access is enabled.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;

    setAttendanceLoading(true);
    try {
      // Get current location
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;

      // Update attendance record
      const attendanceId = `${user.uid}_${new Date().toISOString().split('T')[0]}`;
      await updateDoc(doc(db, 'attendance', attendanceId), {
        checkOutTime: new Date(),
        checkOutLocation: {
          latitude,
          longitude,
          address: 'Location captured'
        }
      });

      setCheckedIn(false);
      setCheckInTime(null);
      
    } catch (error) {
      console.error('Check-out error:', error);
      alert('Failed to check out. Please try again.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Check if user is already checked in today
  useEffect(() => {
    const checkTodayAttendance = async () => {
      if (!user || user.userType !== 'attendee') return;

      try {
        const today = new Date().toISOString().split('T')[0];
        const attendanceId = `${user.uid}_${today}`;
        const attendanceDoc = await getDocs(
          query(
            collection(db, 'attendance'),
            where('studentId', '==', user.uid),
            where('date', '==', today),
            orderBy('checkInTime', 'desc'),
            limit(1)
          )
        );

        if (!attendanceDoc.empty) {
          const record = attendanceDoc.docs[0].data();
          if (record.checkInTime && !record.checkOutTime) {
            setCheckedIn(true);
            setCheckInTime(record.checkInTime.toDate());
          }
        }
      } catch (error) {
        console.error('Error checking attendance:', error);
      }
    };

    checkTodayAttendance();
  }, [user]);

  const getDashboardTitle = () => {
    switch (user?.userType) {
      case 'organizer':
        return 'My Events';
      case 'admin':
        return 'Event Management';
      default:
        return 'Available Events';
    }
  };

  if (loading) {
    return (
      <DashboardContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          color: theme.colors.textPrimary,
          fontSize: '18px',
          background: theme.colors.white,
          borderRadius: theme.borderRadius.lg,
          boxShadow: theme.shadows.sm
        }}>
          Loading events...
        </div>
      </DashboardContainer>
    );
  }

  // Show create event form if requested
  if (showCreateForm) {
    return (
      <DashboardContainer>
        <CreateEventForm 
          onCancel={() => setShowCreateForm(false)}
          onSuccess={handleCreateEventSuccess}
        />
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <div>
          <Title>{getDashboardTitle()}</Title>
          <p style={{ margin: 0, color: theme.colors.textSecondary }}>
            Welcome back, {user?.displayName}!
          </p>
        </div>
        <UserInfo>
          {onNavigateToProfile && (
            <LogoutButton 
              variant="outline" 
              onClick={onNavigateToProfile}
            >
              Profile
            </LogoutButton>
          )}
          <LogoutButton onClick={handleLogout}>
            Logout
          </LogoutButton>
        </UserInfo>
      </Header>

      {/* Attendance Section for Students */}
      {user?.userType === 'attendee' && (
        <AttendanceSection>
          <AttendanceTitle>Daily Attendance</AttendanceTitle>
          <AttendanceInfo>
            <AttendanceStatus>
              <StatusIndicator isCheckedIn={checkedIn} />
              <span>
                {checkedIn ? 'Checked In' : 'Not Checked In'}
                {checkInTime && (
                  <TimeDisplay> at {checkInTime.toLocaleTimeString()}</TimeDisplay>
                )}
              </span>
            </AttendanceStatus>
            <div>
              {checkedIn ? (
                <Button 
                  variant="outline" 
                  onClick={handleCheckOut}
                  disabled={attendanceLoading}
                >
                  {attendanceLoading ? 'Checking Out...' : 'Check Out'}
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={handleCheckIn}
                  disabled={attendanceLoading}
                >
                  {attendanceLoading ? 'Checking In...' : 'Check In'}
                </Button>
              )}
            </div>
          </AttendanceInfo>
          <p style={{ 
            color: theme.colors.textSecondary, 
            fontSize: theme.fontSizes.sm,
            margin: 0 
          }}>
            📍 Location will be recorded for attendance tracking
          </p>
        </AttendanceSection>
      )}

      {events.length === 0 ? (
        <EmptyState>
          <EmptyStateTitle>
            {user?.userType === 'organizer' || user?.userType === 'admin' 
              ? 'No events created yet' 
              : 'No events available'
            }
          </EmptyStateTitle>
          <EmptyStateText>
            {user?.userType === 'organizer' || user?.userType === 'admin'
              ? 'Create your first event to get started!'
              : 'Check back later for upcoming events.'
            }
          </EmptyStateText>
          {(user?.userType === 'organizer' || user?.userType === 'admin') && (
            <Button variant="primary" onClick={() => setShowCreateForm(true)}>
              Create Event
            </Button>
          )}
        </EmptyState>
      ) : (
        <EventsGrid>
          {events.map((event) => (
            <EventCard key={event.id} onClick={() => setSelectedEvent(event)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <EventTitle>{event.title}</EventTitle>
                <EventStatus status={event.eventStatus}>
                  {event.eventStatus}
                </EventStatus>
              </div>
              
              <EventDate>
                {formatDate(event.startDate)} - {formatDate(event.endDate)}
              </EventDate>
              
              <EventLocation>
                📍 {event.location}
              </EventLocation>
              
              <EventDescription>
                {event.description}
              </EventDescription>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {event.capacity ? `${event.capacity} spots` : 'Unlimited'}
                </span>
                <Button size="sm" variant="primary">
                  {user?.userType === 'attendee' ? 'Register' : 'Manage'}
                </Button>
              </div>
            </EventCard>
          ))}
        </EventsGrid>
      )}
    </DashboardContainer>
  );
};
