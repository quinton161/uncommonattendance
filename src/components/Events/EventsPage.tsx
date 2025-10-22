import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { CreateEventForm } from './CreateEventForm';
import { UncommonLogo } from '../Common/UncommonLogo';
import DataService from '../../services/DataService';
import { uniqueToast } from '../../utils/toastUtils';
import {
  EventIcon as EventSvgIcon,
  AddIcon,
  PersonIcon,
  LocationOnIcon,
  TodayIcon,
  CheckCircleIcon
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
  flex: 1;
  
  h1 {
    font-family: ${theme.fonts.heading};
    font-size: ${theme.fontSizes['3xl']};
    font-weight: ${theme.fontWeights.bold};
    color: ${theme.colors.primary};
    margin: 0 0 ${theme.spacing.sm} 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
    
    @media (max-width: ${theme.breakpoints.tablet}) {
      font-size: ${theme.fontSizes['2xl']};
      gap: ${theme.spacing.sm};
    }
    
    @media (max-width: ${theme.breakpoints.mobile}) {
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
    
    @media (max-width: ${theme.breakpoints.tablet}) {
      font-size: ${theme.fontSizes.base};
    }
    
    @media (max-width: ${theme.breakpoints.mobile}) {
      font-size: ${theme.fontSizes.sm};
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  align-items: center;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    gap: ${theme.spacing.sm};
  }
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const EventCard = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.md};
  border: 1px solid ${theme.colors.gray200};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.lg};
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
    border-radius: ${theme.borderRadius.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.sm};
  }
`;

const EventHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;

const EventIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryLight} 100%);
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.white};
  flex-shrink: 0;
`;

const EventContent = styled.div`
  flex: 1;
`;

const EventTitle = styled.h3`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin: 0 0 ${theme.spacing.xs} 0;
`;

const EventDescription = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
  margin: 0;
  line-height: 1.5;
`;

const EventDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
`;

const EventDetail = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  
  svg {
    color: ${theme.colors.primary};
  }
`;

const EventStatus = styled.div<{ status: string }>`
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
      case 'published':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        `;
      case 'draft':
        return `
          background: rgba(251, 191, 36, 0.1);
          color: #d97706;
        `;
      case 'cancelled':
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

const EventActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.gray200};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing['3xl']};
  color: ${theme.colors.textSecondary};
  
  svg {
    margin-bottom: ${theme.spacing.lg};
    opacity: 0.5;
  }
  
  h3 {
    font-size: ${theme.fontSizes.xl};
    margin-bottom: ${theme.spacing.sm};
    color: ${theme.colors.textPrimary};
  }
  
  p {
    font-size: ${theme.fontSizes.base};
    margin-bottom: ${theme.spacing.lg};
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

interface EventsPageProps {
  onBack?: () => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const dataService = DataService.getInstance();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      await dataService.testConnection();
      const eventsData = await dataService.getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      uniqueToast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setShowCreateForm(true);
  };

  const handleCreateEventSuccess = () => {
    setShowCreateForm(false);
    loadEvents();
    uniqueToast.success('Event created successfully!');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const canCreateEvents = user?.userType === 'admin' || user?.userType === 'organizer';

  if (showCreateForm) {
    return (
      <PageContainer>
        <CreateEventForm
          onCancel={() => setShowCreateForm(false)}
          onSuccess={handleCreateEventSuccess}
        />
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
            <span>Events</span>
          </h1>
          <p>Discover and manage upcoming events</p>
        </HeaderTitle>
        <HeaderActions>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back to Dashboard
            </Button>
          )}
          {canCreateEvents && (
            <Button variant="primary" onClick={handleCreateEvent}>
              <AddIcon size={20} style={{ marginRight: theme.spacing.xs }} />
              Create Event
            </Button>
          )}
        </HeaderActions>
      </Header>

      {loading ? (
        <LoadingState>
          Loading events...
        </LoadingState>
      ) : events.length === 0 ? (
        <EmptyState>
          <EventSvgIcon size={64} />
          <h3>No Events Yet</h3>
          <p>There are no events available at the moment.</p>
          {canCreateEvents && (
            <Button variant="primary" onClick={handleCreateEvent}>
              <AddIcon size={20} style={{ marginRight: theme.spacing.xs }} />
              Create Your First Event
            </Button>
          )}
        </EmptyState>
      ) : (
        <EventsGrid>
          {events.map((event) => (
            <EventCard key={event.id}>
              <EventHeader>
                <EventIcon>
                  <EventSvgIcon size={24} />
                </EventIcon>
                <EventContent>
                  <EventTitle>{event.title}</EventTitle>
                  <EventDescription>{event.description}</EventDescription>
                </EventContent>
              </EventHeader>

              <EventDetails>
                <EventDetail>
                  <TodayIcon size={16} />
                  <span>
                    {formatDate(event.startDate)} - {formatDate(event.endDate)}
                  </span>
                </EventDetail>
                <EventDetail>
                  <LocationOnIcon size={16} />
                  <span>{event.location}</span>
                </EventDetail>
                <EventDetail>
                  <PersonIcon size={16} />
                  <span>Capacity: {event.capacity} attendees</span>
                </EventDetail>
              </EventDetails>

              <EventStatus status={event.eventStatus}>
                <CheckCircleIcon size={12} />
                {event.eventStatus}
              </EventStatus>

              <EventActions>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                {user?.userType === 'attendee' && (
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                )}
                {canCreateEvents && (
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                )}
              </EventActions>
            </EventCard>
          ))}
        </EventsGrid>
      )}
    </PageContainer>
  );
};
