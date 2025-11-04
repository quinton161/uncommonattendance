import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { Button } from '../Common/Button';
import { CreateEventForm } from '../Events/CreateEventForm';
import { EventsPage } from '../Events/EventsPage';
import { UsersPage } from '../Admin/UsersPage';
import { AttendancePage } from '../Admin/AttendancePage';
import { DailyAttendanceTracker } from '../Admin/DailyAttendanceTracker';
import { UncommonLogo } from '../Common/UncommonLogo';
import { UncommonCard } from '../Common/UncommonCard';
import { StarField } from '../Common/StarField';
import { theme } from '../../styles/theme';
import { 
  fadeInUp, 
  staggeredAnimation, 
  pageTransition, 
  containerAnimation,
  respectMotionPreference 
} from '../../styles/animations';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import DataService from '../../services/DataService';
import { uniqueToast } from '../../utils/toastUtils';
import {
  DashboardIcon,
  EventIcon,
  CheckCircleIcon,
  PeopleIcon,
  PersonIcon,
  LogoutIcon,
  AddIcon,
  TrendingUpIcon,
  EventAvailableIcon,
  GroupIcon,
  TodayIcon
} from '../Common/Icons';

const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${theme.colors.backgroundSecondary};
  ${pageTransition}
  ${respectMotionPreference}
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
  }
`;

const Sidebar = styled.div<{ isOpen?: boolean }>`
  width: 280px;
  background: linear-gradient(180deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  color: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  box-shadow: ${theme.shadows.lg};
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  flex-shrink: 0;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    position: fixed;
    top: 0;
    left: ${props => props.isOpen ? '0' : '-100%'};
    height: 100vh;
    z-index: ${theme.zIndex.modal};
    transition: left 0.3s ease;
    width: 100%;
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

const Logo = styled.div`
  color: ${theme.colors.white};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: ${theme.spacing.xl};
  text-align: center;
  position: relative;
  z-index: 20;
`;

const NavItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  color: ${props => props.active ? theme.colors.white : theme.colors.gray300};
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: ${theme.spacing.sm};
  position: relative;
  z-index: 20;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${theme.colors.white};
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: ${theme.spacing.lg};
  min-height: 100vh;
  overflow-x: hidden;
  ${containerAnimation}
  ${respectMotionPreference}
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
    padding-top: calc(${theme.spacing.md} + 60px);
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.sm};
    padding-top: calc(${theme.spacing.sm} + 60px);
  }
  
  @media (max-width: 420px) {
    padding: ${theme.spacing.xs};
    padding-top: calc(${theme.spacing.xs} + 60px);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.xl};
  gap: ${theme.spacing.md};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.lg};
  }
  
  @media (max-width: 420px) {
    margin-bottom: ${theme.spacing.lg};
    gap: ${theme.spacing.md};
  }
  
  @media (max-width: 360px) {
    margin-bottom: ${theme.spacing.md};
    gap: ${theme.spacing.sm};
  }
`;

const HeaderTitle = styled.div`
  h1 {
    font-size: ${theme.fontSizes['3xl']};
    font-weight: ${theme.fontWeights.bold};
    color: ${theme.colors.textPrimary};
    margin: 0 0 ${theme.spacing.sm} 0;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.lg};
    
    @media (max-width: ${theme.breakpoints.tablet}) {
      font-size: ${theme.fontSizes['2xl']};
      gap: ${theme.spacing.md};
    }
    
    @media (max-width: 420px) {
      font-size: ${theme.fontSizes.xl};
      gap: ${theme.spacing.sm};
    }
    
    @media (max-width: 360px) {
      font-size: ${theme.fontSizes.lg};
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
    
    @media (max-width: 420px) {
      font-size: ${theme.fontSizes.sm};
    }
    
    @media (max-width: 360px) {
      font-size: ${theme.fontSizes.xs};
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
    gap: ${theme.spacing.sm};
    width: 100%;
  }
  
  @media (max-width: 420px) {
    gap: ${theme.spacing.xs};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing.sm};
  }
  
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.xs};
    margin-bottom: ${theme.spacing.lg};
  }
`;

const StatCard = styled.div<{ variant?: 'primary' | 'secondary' | 'accent' }>`
  background: ${props => {
    switch (props.variant) {
      case 'primary': return `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`;
      case 'secondary': return `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.gray800} 100%)`;
      case 'accent': return `linear-gradient(135deg, ${theme.colors.primaryLight} 0%, ${theme.colors.primary} 100%)`;
      default: return theme.colors.white;
    }
  }};
  color: ${props => props.variant ? theme.colors.white : theme.colors.textPrimary};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.md};
  border: 1px solid ${theme.colors.gray200};
  ${staggeredAnimation(0.1)}
  ${respectMotionPreference}
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
  }
`;

const StatValue = styled.div`
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: ${theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  opacity: 0.9;
  margin-bottom: ${theme.spacing.sm};
`;

const StatChange = styled.div<{ positive?: boolean }>`
  font-size: ${theme.fontSizes.xs};
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

const StatIcon = styled.div`
  position: absolute;
  top: ${theme.spacing.md};
  right: ${theme.spacing.md};
  opacity: 0.3;
`;

const MobileHeader = styled.div`
  display: none;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${theme.spacing.md};
    background: ${theme.colors.white};
    box-shadow: ${theme.shadows.sm};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: ${theme.zIndex.fixed};
    height: 60px;
  }
`;

const MobileMenuButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: ${theme.fontSizes.xl};
  cursor: pointer;
  padding: ${theme.spacing.xs};
  border-radius: ${theme.borderRadius.md};
  
  &:hover {
    background: ${theme.colors.gray100};
  }
`;

const MobileOverlay = styled.div<{ isOpen: boolean }>`
  display: none;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: ${props => props.isOpen ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: ${theme.zIndex.modal - 1};
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${theme.spacing.lg};
  
  @media (max-width: ${theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    gap: ${theme.spacing.sm};
  }
`;

const Card = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${theme.colors.gray200};
  ${staggeredAnimation(0.2)}
  ${respectMotionPreference}
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  }
`;

const CardTitle = styled.h3`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin: 0 0 ${theme.spacing.lg} 0;
`;

const RecentEventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const EventItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.backgroundSecondary};
`;

const EventInfo = styled.div`
  h4 {
    font-size: ${theme.fontSizes.base};
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
    margin: 0 0 ${theme.spacing.xs} 0;
  }
  
  p {
    font-size: ${theme.fontSizes.sm};
    color: ${theme.colors.textSecondary};
    margin: 0;
  }
`;

const AttendanceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const AttendanceItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.backgroundSecondary};
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.white};
  font-weight: ${theme.fontWeights.medium};
  font-size: ${theme.fontSizes.sm};
`;

interface AdminDashboardProps {
  onNavigateToProfile?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToProfile }) => {
  const { user, logout } = useAuth();
  const { events } = useEvent();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    todayAttendance: 0,
    activeEvents: 0
  });
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const dataService = DataService.getInstance();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      uniqueToast.info('Loading dashboard data...', { autoClose: 2000 });
      
      // Test connection and load stats
      await dataService.testConnection();
      const dashboardStats = await dataService.getDashboardStats();
      
      setStats({
        totalEvents: dashboardStats.totalEvents,
        totalAttendees: dashboardStats.totalAttendees,
        todayAttendance: dashboardStats.todayAttendance,
        activeEvents: dashboardStats.activeEvents
      });
      
      setRecentAttendance(dashboardStats.recentAttendance);
      uniqueToast.success('Dashboard data loaded successfully!', { autoClose: 2000 });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      uniqueToast.error('Failed to load some data, using fallback');
      
      // Fallback data
      setStats({
        totalEvents: 5,
        totalAttendees: 25,
        todayAttendance: 8,
        activeEvents: 3
      });
      
      setRecentAttendance([
        {
          id: '1',
          studentName: 'John Doe',
          checkInTime: new Date(),
          isPresent: true
        },
        {
          id: '2',
          studentName: 'Jane Smith',
          checkInTime: new Date(Date.now() - 3600000),
          isPresent: true
        }
      ]);
    }
  };

  const handleCreateEventSuccess = () => {
    setShowCreateForm(false);
    loadDashboardData();
  };

  const handleNavClick = (navItem: string) => {
    setActiveNav(navItem);
    setMobileMenuOpen(false); // Close mobile menu when navigating
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const renderCurrentPage = () => {
    switch (activeNav) {
      case 'events':
        return <EventsPage onBack={() => setActiveNav('dashboard')} />;
      case 'attendance':
        return <AttendancePage onBack={() => setActiveNav('dashboard')} />;
      case 'daily-tracker':
        return <DailyAttendanceTracker onBack={() => setActiveNav('dashboard')} isEmbedded={true} />;
      case 'users':
        return <UsersPage onBack={() => setActiveNav('dashboard')} />;
      default:
        return null; // Will render the main dashboard
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (showCreateForm) {
    return (
      <DashboardContainer>
        <div style={{ flex: 1, padding: theme.spacing.lg }}>
          <CreateEventForm 
            onCancel={() => setShowCreateForm(false)}
            onSuccess={handleCreateEventSuccess}
          />
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <MobileHeader>
        <UncommonLogo size="sm" showSubtitle={false} />
        <MobileMenuButton onClick={toggleMobileMenu}>
          ☰
        </MobileMenuButton>
      </MobileHeader>
      
      <MobileOverlay isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />
      
      <Sidebar isOpen={mobileMenuOpen}>
        <StarField density="low" speed="slow" />
        <Logo>
          <DashboardIcon size={24} style={{ marginRight: theme.spacing.sm }} />
          Admin Panel
        </Logo>
        
        <NavItem active={activeNav === 'dashboard'} onClick={() => handleNavClick('dashboard')}>
          <DashboardIcon size={20} />
          Dashboard
        </NavItem>
        <NavItem active={activeNav === 'events'} onClick={() => handleNavClick('events')}>
          <EventIcon size={20} />
          Events
        </NavItem>
        <NavItem active={activeNav === 'attendance'} onClick={() => handleNavClick('attendance')}>
          <CheckCircleIcon size={20} />
          Attendance
        </NavItem>
        <NavItem active={activeNav === 'daily-tracker'} onClick={() => handleNavClick('daily-tracker')}>
          <TodayIcon size={20} />
          Daily Tracker
        </NavItem>
        <NavItem active={activeNav === 'users'} onClick={() => handleNavClick('users')}>
          <PeopleIcon size={20} />
          Users
        </NavItem>
        
        <div style={{ marginTop: 'auto', paddingTop: theme.spacing.xl }}>
          {onNavigateToProfile && (
            <NavItem onClick={onNavigateToProfile}>
              <PersonIcon size={20} />
              Profile
            </NavItem>
          )}
          <NavItem onClick={logout}>
            <LogoutIcon size={20} />
            Logout
          </NavItem>
        </div>
      </Sidebar>

      {renderCurrentPage() || (
        <MainContent>
          <Header>
            <HeaderTitle>
              <h1 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: theme.spacing.lg,
                margin: 0 
              }}>
                <UncommonLogo size="lg" showSubtitle={false} />
                <span>Dashboard</span>
              </h1>
              <p>Welcome back, {user?.displayName}!</p>
            </HeaderTitle>
            <HeaderActions>
              <Button variant="primary" onClick={() => setShowCreateForm(true)}>
                <AddIcon size={20} style={{ marginRight: theme.spacing.xs }} />
                Create Event
              </Button>
            </HeaderActions>
          </Header>

        <StatsGrid>
          <StatCard variant="primary">
            <StatIcon><EventAvailableIcon size={32} /></StatIcon>
            <StatValue>{stats.totalEvents}</StatValue>
            <StatLabel>Total Events</StatLabel>
            <StatChange positive>
              <TrendingUpIcon size={16} /> +{stats.activeEvents} active
            </StatChange>
          </StatCard>
          
          <StatCard variant="secondary">
            <StatIcon><GroupIcon size={32} /></StatIcon>
            <StatValue>{stats.totalAttendees}</StatValue>
            <StatLabel>Total Attendees</StatLabel>
            <StatChange positive>
              <TrendingUpIcon size={16} /> All registered users
            </StatChange>
          </StatCard>
          
          <StatCard variant="accent">
            <StatIcon><TodayIcon size={32} /></StatIcon>
            <StatValue>{stats.todayAttendance}</StatValue>
            <StatLabel>Today's Attendance</StatLabel>
            <StatChange positive>
              <CheckCircleIcon size={16} /> Checked in today
            </StatChange>
          </StatCard>
        </StatsGrid>

        <ContentGrid>
          <Card>
            <CardTitle>Recent Events</CardTitle>
            <RecentEventsList>
              {events.slice(0, 5).map((event) => (
                <EventItem key={event.id}>
                  <EventInfo>
                    <h4>{event.title}</h4>
                    <p>{new Date(event.startDate).toLocaleDateString()}</p>
                  </EventInfo>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </EventItem>
              ))}
              {events.length === 0 && (
                <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: theme.spacing.lg }}>
                  No events created yet
                </p>
              )}
            </RecentEventsList>
          </Card>

          <Card>
            <CardTitle>Recent Check-ins</CardTitle>
            <AttendanceList>
              {recentAttendance.map((attendance: any) => (
                <AttendanceItem key={attendance.id}>
                  <UserAvatar>
                    {getInitials(attendance.studentName || 'User')}
                  </UserAvatar>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: theme.fontWeights.medium,
                      color: theme.colors.textPrimary,
                      fontSize: theme.fontSizes.sm
                    }}>
                      {attendance.studentName}
                    </div>
                    <div style={{ 
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSizes.xs
                    }}>
                      {attendance.checkInTime?.toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ 
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: theme.colors.success
                  }} />
                </AttendanceItem>
              ))}
              {recentAttendance.length === 0 && (
                <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: theme.spacing.lg }}>
                  No recent check-ins
                </p>
              )}
            </AttendanceList>
          </Card>
        </ContentGrid>
        </MainContent>
      )}
    </DashboardContainer>
  );
};
