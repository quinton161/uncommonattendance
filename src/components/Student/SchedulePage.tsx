import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { UncommonLogo } from '../Common/UncommonLogo';
import DataService from '../../services/DataService';
import { uniqueToast } from '../../utils/toastUtils';
import {
  ScheduleIcon,
  TodayIcon,
  LocationOnIcon,
  EventIcon,
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
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.lg};
  border-bottom: 2px solid ${theme.colors.primary};
`;

const HeaderTitle = styled.div`
  h1 {
    font-family: ${theme.fonts.heading};
    font-size: ${theme.fontSizes['3xl']};
    font-weight: ${theme.fontWeights.bold};
    color: ${theme.colors.textPrimary};
    margin: 0 0 ${theme.spacing.sm} 0;
    line-height: 1.2;
  }
  
  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
    font-size: ${theme.fontSizes.lg};
  }
`;

const ScheduleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: ${theme.spacing.lg};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
  border-left: 4px solid ${theme.colors.primary};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.lg};
  }
`;

const EventHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md};
`;

const EventInfo = styled.div`
  flex: 1;
`;

const EventTitle = styled.h3`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin: 0 0 ${theme.spacing.xs} 0;
`;

const EventTime = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
  margin-bottom: ${theme.spacing.xs};
`;

const EventLocation = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
`;

const EventStatus = styled.div<{ status: 'upcoming' | 'ongoing' | 'completed' }>`
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
      case 'ongoing':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        `;
      case 'upcoming':
        return `
          background: rgba(6, 71, 161, 0.1);
          color: ${theme.colors.primary};
        `;
      case 'completed':
        return `
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        `;
      default:
        return `
          background: ${theme.colors.gray100};
          color: ${theme.colors.textSecondary};
        `;
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing['3xl']};
  color: ${theme.colors.textSecondary};
  grid-column: 1 / -1;
  
  h3 {
    font-size: ${theme.fontSizes.xl};
    margin-bottom: ${theme.spacing.sm};
    color: ${theme.colors.textPrimary};
  }
`;

interface SchedulePageProps {
  onBack?: () => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dataService = DataService.getInstance();

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      await dataService.testConnection();
      const eventsData = await dataService.getEvents();
      
      // Filter for upcoming events and add mock schedule data
      const upcomingEvents = eventsData.filter(event => 
        new Date(event.startDate) >= new Date()
      ).slice(0, 6);
      
      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Error loading schedule:', error);
      uniqueToast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (event: any) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    if (now >= startDate && now <= endDate) return 'ongoing';
    if (now < startDate) return 'upcoming';
    return 'completed';
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

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
            <span>Schedule</span>
          </h1>
          <p>Your upcoming events and activities</p>
        </HeaderTitle>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Dashboard
          </Button>
        )}
      </Header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          Loading your schedule...
        </div>
      ) : (
        <ScheduleGrid>
          {events.length === 0 ? (
            <EmptyState>
              <ScheduleIcon size={64} />
              <h3>No Upcoming Events</h3>
              <p>Your schedule is clear! Check back later for new events.</p>
            </EmptyState>
          ) : (
            events.map((event) => {
              const status = getEventStatus(event);
              
              return (
                <EventCard key={event.id}>
                  <EventHeader>
                    <EventInfo>
                      <EventTitle>{event.title}</EventTitle>
                      <EventTime>
                        <TodayIcon size={16} />
                        {formatDateTime(event.startDate)}
                      </EventTime>
                      <EventLocation>
                        <LocationOnIcon size={16} />
                        {event.location}
                      </EventLocation>
                    </EventInfo>
                    <EventStatus status={status}>
                      <CheckCircleIcon size={12} />
                      {status}
                    </EventStatus>
                  </EventHeader>
                  
                  <p style={{ 
                    color: theme.colors.textSecondary, 
                    fontSize: theme.fontSizes.sm,
                    lineHeight: 1.5,
                    margin: 0
                  }}>
                    {event.description}
                  </p>
                </EventCard>
              );
            })
          )}
        </ScheduleGrid>
      )}
    </PageContainer>
  );
};
