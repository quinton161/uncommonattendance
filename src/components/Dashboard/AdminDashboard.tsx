import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { UsersPage } from '../Admin/UsersPage';
import { AttendancePage } from '../Admin/AttendancePage';
import { DailyAttendanceTracker } from '../Admin/DailyAttendanceTracker';
import { UncommonLogo } from '../Common/UncommonLogo';
import { StarField } from '../Common/StarField';
import { theme } from '../../styles/theme';
import { 
  staggeredAnimation, 
  pageTransition, 
  containerAnimation,
  respectMotionPreference 
} from '../../styles/animations';
import DataService from '../../services/DataService';
import { uniqueToast } from '../../utils/toastUtils';
import { ChatWindow } from '../Common/ChatWindow';
import { chatService, Conversation } from '../../services/chatService';
import { notificationService } from '../../services/notificationService';
import { saveAs } from 'file-saver';
import { ProfileUpload } from '../Profile/ProfileUpload';

import {
  DashboardIcon,
  CheckCircleIcon,
  PeopleIcon,
  PersonIcon,
  LogoutIcon,
  TrendingUpIcon,
  GroupIcon,
  TodayIcon
} from '../Common/Icons';

const DashboardContainer = styled.div`
  display: flex;
  height: 100vh;
  background: ${theme.colors.backgroundSecondary};
  ${pageTransition}
  ${respectMotionPreference}
  width: 100%;
  overflow: hidden;
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
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1001;
  overflow: hidden;
  -ms-overflow-style: none;
  scrollbar-width: none;
  flex-shrink: 0;
  &::-webkit-scrollbar {
    display: none;
  }
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
  height: 100vh;
  height: 100svh; /* Modern mobile browsers */
  overflow: hidden; /* Prevent outer scroll to stop shaking */
  box-sizing: border-box;
  padding-top: 60px;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  ${containerAnimation}
  ${respectMotionPreference}
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
    padding-top: 70px;
    margin-left: 0;
    height: calc(100vh - 60px);
    height: calc(100svh - 60px);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 20;
  position: relative;
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

const Badge = styled.div`
  background-color: ${theme.colors.success};
  color: white;
  font-size: 10px;
  font-weight: bold;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  margin-top: 4px;
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
    z-index: 1000;
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToProfile }) => {

  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalAttendees: 0,
    todayAttendance: 0
  });
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const dataService = DataService.getInstance();

  const handleDownloadAttendanceCSV = async () => {
    try {
      await dataService.testConnection();
      const users = await dataService.getUsers();
      const attendance = await dataService.getAttendance();
      const todayStr = new Date().toISOString().split('T')[0];
      // Only today's attendance
      const todayAttendance = attendance.filter((a: any) => a.date === todayStr);
      const rows = todayAttendance.map((a: any) => {
        const userRecord = users.find((u: any) => u.id === a.studentId || u.uid === a.studentId);
        const checkInTime = a.checkInTime ? new Date(a.checkInTime) : null;
        const isLate = checkInTime && checkInTime.getHours() >= 9 && checkInTime.getMinutes() > 0;
        return [
          userRecord?.displayName || a.studentName || 'Unknown',
          a.date || '',
          checkInTime ? checkInTime.toLocaleTimeString() : '',
          a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString() : '',
          isLate ? 'Late' : 'On Time'
        ];
      });
      let csv = 'Name,Date,Check-in Time,Check-out Time,Late\n';
      csv += rows.map(r => r.map(field => `"${field}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `attendance_${todayStr}.csv`);
      uniqueToast.success('CSV downloaded!', { autoClose: 2000 });
    } catch (error) {
      console.error('Error generating attendance CSV:', error);
      uniqueToast.error('Failed to generate CSV');
    }
  };

  // Removed unused handleDownloadAttendancePDF function

  const loadDashboardData = async () => {
    try {
      uniqueToast.info('Loading dashboard data...', { autoClose: 2000 });
      // Test connection and load stats
      await dataService.testConnection();
      
      const dashboardStats = await dataService.getDashboardStats();
      
      setStats({
                totalAttendees: dashboardStats.totalAttendees,
        todayAttendance: dashboardStats.todayAttendance,
              });
      
      setRecentAttendance(dashboardStats.recentAttendance);
      uniqueToast.success('Dashboard data loaded successfully!', { autoClose: 2000 });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      uniqueToast.error('Failed to load some data, using fallback');
      
      // Fallback data
      setStats({
                totalAttendees: 25,
        todayAttendance: 8,
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

  useEffect(() => {
    // Request permission for push notifications
    notificationService.requestPermission();

    // Load dashboard stats on mount
    loadDashboardData();

    // Subscribe to conversations specific to this admin
    const unsubscribe = chatService.subscribeToConversationsByAdmin(user?.uid || '', (data) => {
      // Use functional state update to ensure we have the most current conversations
      setConversations(prevConversations => {
        const prevTotal = prevConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        const newTotal = data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        
        console.log('Chat debug - prevTotal:', prevTotal, 'newTotal:', newTotal);

        if (newTotal > prevTotal) {
          console.log('Chat debug - New message detected!');
          // Play notification sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
          
          // Find the specific conversation that got a new message
          const newMsgConv = data.find(c => {
            const prevConv = prevConversations.find(p => p.studentId === c.studentId);
            return (c.unreadCount || 0) > (prevConv?.unreadCount || 0);
          });

          if (newMsgConv) {
            console.log('Chat debug - Showing toast for:', newMsgConv.studentName);
            uniqueToast.info(`New message from ${newMsgConv.studentName}: ${newMsgConv.lastMessage}`, {
              position: 'top-right',
              autoClose: 5000
            });

            // Send system push notification
            notificationService.sendNotification(
              `New message from ${newMsgConv.studentName}`,
              newMsgConv.lastMessage
            );
          }
        }
        
        setTotalUnread(newTotal);
        return data;
      });
    });

    return () => unsubscribe();
  }, []);

  const handleNavClick = (navItem: string) => {
    setActiveNav(navItem);
    setMobileMenuOpen(false); // Close mobile menu when navigating
  };

  // Handle chat initiation from UsersPage
  const handleChatFromUsers = (studentId: string, studentName: string, studentPhotoUrl?: string) => {
    // Create a conversation object from the student data
    const newConversation = {
      id: `${studentId}_${user?.uid}`,
      studentId,
      studentName,
      studentPhotoUrl,
      adminId: user?.uid || '',
      adminName: user?.displayName || 'Admin',
      lastMessage: '',
      lastMessageTime: null
    };
    setSelectedConversation(newConversation as Conversation);
    setActiveNav('chat');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const renderCurrentPage = () => {
    switch (activeNav) {
      case 'attendance':
        return <AttendancePage onBack={() => setActiveNav('dashboard')} />;
      case 'daily-tracker':
        return <DailyAttendanceTracker onBack={() => setActiveNav('dashboard')} isEmbedded={true} />;
      case 'users':
        return <UsersPage onBack={() => setActiveNav('dashboard')} onChat={handleChatFromUsers} />;
      case 'chat':
        const displayConversations = conversations.map(conv => {
          return {
            ...conv,
            id: `${conv.studentId}_${conv.adminId}`
          };
        }).filter(conv => conv.adminId === user?.uid) // Only show conversations for the current admin
        .sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          const timeA = a.lastMessageTime.toDate ? a.lastMessageTime.toDate() : new Date(a.lastMessageTime);
          const timeB = b.lastMessageTime.toDate ? b.lastMessageTime.toDate() : new Date(b.lastMessageTime);
          return timeB.getTime() - timeA.getTime();
        });

        return (
          <MainContent style={{ padding: 0, height: '100svh' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%',
              overflow: 'hidden'
            }}>
              <Card style={{ 
                flex: 1, 
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 0,
                border: 'none'
              }}>
                <div style={{ 
                  flex: 1,
                  overflowY: 'auto',
                  display: selectedConversation ? 'none' : 'block'
                }}>
                  <div style={{ padding: theme.spacing.md }}>
                    <h2 style={{ color: theme.colors.textPrimary, margin: `0 0 ${theme.spacing.md} 0` }}>Messages</h2>
                    <AttendanceList>
                      {displayConversations.map((conv) => (
                        <AttendanceItem 
                          key={conv.id} 
                          style={{ 
                            cursor: 'pointer', 
                            transition: 'all 0.2s',
                            background: selectedConversation?.id === conv.id ? 'rgba(6, 71, 161, 0.1)' : 'transparent',
                            borderLeft: selectedConversation?.id === conv.id ? `4px solid ${theme.colors.primary}` : '4px solid transparent',
                            padding: theme.spacing.md
                          }}
                          onClick={async () => {
                            setSelectedConversation(conv as any);
                            if (conv.unreadCount && conv.unreadCount > 0) {
                              try {
                                await chatService.markAsRead(conv.id!);
                              } catch (error) {
                                console.error('Failed to mark as read:', error);
                              }
                            }
                          }}
                        >
                          <UserAvatar>
                            {conv.studentPhotoUrl ? (
                              <img 
                                src={conv.studentPhotoUrl} 
                                alt="" 
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                              />
                            ) : (
                              getInitials(conv.studentName || 'Student')
                            )}
                          </UserAvatar>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: theme.fontWeights.semibold, color: theme.colors.textPrimary, fontSize: theme.fontSizes.sm }}>
                              {conv.studentName}
                            </div>
                            <div style={{ 
                              fontSize: theme.fontSizes.xs, 
                              color: theme.colors.textSecondary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {conv.lastMessage}
                            </div>
                          </div>
                          {conv.unreadCount && conv.unreadCount > 0 ? (
                            <div style={{ 
                              background: theme.colors.error, 
                              color: 'white', 
                              borderRadius: '50%', 
                              width: '20px', 
                              height: '20px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              {conv.unreadCount}
                            </div>
                          ) : null}
                        </AttendanceItem>
                      ))}
                    </AttendanceList>
                    {displayConversations.length === 0 && (
                      <p style={{ textAlign: 'center', color: theme.colors.textSecondary, padding: theme.spacing.lg }}>
                        No students found.
                      </p>
                    )}
                  </div>
                </div>

                {selectedConversation && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                    <div style={{ 
                      padding: theme.spacing.sm, 
                      background: theme.colors.white, 
                      borderBottom: `1px solid ${theme.colors.gray200}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm
                    }}>
                      <Button 
                        onClick={() => setSelectedConversation(null)}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        Back
                      </Button>
                      <span style={{ fontWeight: 'bold' }}>{selectedConversation.studentName}</span>
                    </div>
                    <div style={{ flex: 1, minHeight: 0 }}>
                      <ChatWindow 
                        studentId={selectedConversation.studentId}
                        studentName={selectedConversation.studentName}
                        studentPhotoUrl={selectedConversation.studentPhotoUrl}
                        currentUserPhotoUrl={user?.photoUrl}
                        currentUserUid={user?.uid || ''}
                        isAdmin={true}
                        adminUid={user?.uid}
                      />
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </MainContent>
        );
      case 'profile':
        return (
          <MainContent>
            <ProfileUpload />
          </MainContent>
        );
      default:
        return null; // Will render the main dashboard
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };


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
          <img src="/shapes.svg" alt="Logo" style={{ width: 24, height: 24, marginRight: theme.spacing.sm }} />
          Admin Panel
        </Logo>
        
        <NavItem active={activeNav === 'dashboard'} onClick={() => handleNavClick('dashboard')}>
          <DashboardIcon size={20} />
          Dashboard
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
        <NavItem active={activeNav === 'chat'} onClick={() => handleNavClick('chat')}>
          <PersonIcon size={20} />
          Student Chat
          {totalUnread > 0 && <Badge style={{ marginLeft: 'auto' }}>{totalUnread}</Badge>}
        </NavItem>
        <NavItem active={activeNav === 'profile'} onClick={() => handleNavClick('profile')}>
          <PersonIcon size={20} />
          My Profile
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

      <MainContent>
        {renderCurrentPage() || (
          <>
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
                <Button variant="primary" onClick={handleDownloadAttendanceCSV}>
                  Download Attendance CSV
                </Button>
              </HeaderActions>
            </Header>

            <StatsGrid>
              <StatCard variant="secondary">
                <StatIcon><GroupIcon size={32} /></StatIcon>
                <StatValue>{stats.totalAttendees}</StatValue>
                <StatLabel>Total Attendees</StatLabel>
                <StatChange positive>
                  <TrendingUpIcon size={16} /> All registered users
                </StatChange>
              </StatCard>
            </StatsGrid>

            <ContentGrid>
              <Card>
                <CardTitle>Recent Check-ins</CardTitle>
                <AttendanceList>
                  {recentAttendance.map((attendance: any) => (
                    <AttendanceItem key={attendance.id}>
                      <UserAvatar>
                        {getInitials(attendance.studentName || 'User')}
                      </UserAvatar>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: theme.fontWeights.medium, color: theme.colors.textPrimary, fontSize: theme.fontSizes.sm }}>
                          {attendance.studentName}
                        </div>
                        <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs }}>
                          {attendance.checkInTime?.toLocaleTimeString()}
                        </div>
                      </div>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.colors.success }} />
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
          </>
        )}
      </MainContent>
  </DashboardContainer>
  );
};

export default AdminDashboard;
