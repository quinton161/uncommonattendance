import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NotificationPanel } from './NotificationPanel';
import { WelcomeNotification } from './WelcomeNotification';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToNotifications } from '../../services/notificationFeedService';
import { notificationService } from '../../services/notificationService';
import type { AppNotification } from '../../types/notifications';
import { initialStaffHubFilter, resolvedHubLabel } from '../../services/hubService';

interface LayoutProps {
  children: React.ReactNode;
}

interface ContainerProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  children: React.ReactNode;
}

const LayoutWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  background: #eef2ff;
`;

const ContentColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;

  @media (min-width: ${theme.breakpoints.laptop}) {
    margin-left: 240px;
  }
`;

const Main = styled.main`
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
  padding: 20px;

  @media (min-width: ${theme.breakpoints.tablet}) {
    padding: 24px;
  }
`;

const getMaxWidth = (maxWidth: string) => {
  switch (maxWidth) {
    case 'sm':
      return '640px';
    case 'md':
      return '768px';
    case 'lg':
      return '1024px';
    case 'xl':
      return '1280px';
    case 'full':
      return '100%';
    default:
      return '1024px';
  }
};

const StyledContainer = styled.div<ContainerProps>`
  width: 100%;
  max-width: ${({ maxWidth = 'lg' }) => getMaxWidth(maxWidth)};
  margin: 0 auto;
  padding: ${({ padding = true }) => (padding ? `0 ${theme.spacing.md}` : '0')};

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${({ padding = true }) => (padding ? `0 ${theme.spacing.sm}` : '0')};
  }
`;

const Header = styled.header`
  background-color: ${theme.colors.surface};
  border-bottom: 1px solid rgba(0, 82, 204, 0.07);
  box-shadow: ${theme.shadows.sm};
  position: sticky;
  top: 0;
  z-index: ${theme.zIndex.sticky};
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 ${theme.spacing.md};
`;

const Logo = styled.h1`
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  margin: 0;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const bootstrappedRef = useRef(false);

  const isStaff = user?.userType === 'admin' || user?.userType === 'instructor';
  const feedHubId = isStaff ? initialStaffHubFilter(user ?? null) || undefined : user?.hubId;

  const handleDesktopNotify = useCallback(
    (item: AppNotification) => {
      if (!user?.uid) return;
      if (item.readBy.includes(user.uid)) return;

      const notifyStaff =
        isStaff && (item.type === 'check_in' || item.type === 'late' || item.type === 'check_out');
      const notifyStudentAward =
        user.userType === 'attendee' &&
        item.type === 'award' &&
        item.studentId === user.uid;

      if (notifyStaff || notifyStudentAward) {
        notificationService.sendNotification(item.title, item.body);
      }
    },
    [user, isStaff]
  );

  useEffect(() => {
    if (!user?.uid) return;

    if (isStaff && !notificationService.wasPermissionPrompted()) {
      notificationService.markPermissionPrompted();
      void notificationService.requestPermission();
    }

    const unsub = subscribeToNotifications({
      hubId: feedHubId,
      uid: user.uid,
      onData: (items, unread) => {
        setNotifications(items);
        setUnreadCount(unread);
      },
      onError: () => {
        setNotifications([]);
        setUnreadCount(0);
      },
      onNew: (item) => {
        if (!bootstrappedRef.current) return;
        if (seenIdsRef.current.has(item.id)) return;
        handleDesktopNotify(item);
      },
    });

    return unsub;
  }, [user?.uid, feedHubId, isStaff, handleDesktopNotify]);

  useEffect(() => {
    if (notifications.length > 0 && !bootstrappedRef.current) {
      notifications.forEach((n) => seenIdsRef.current.add(n.id));
      bootstrappedRef.current = true;
    }
  }, [notifications]);

  const hubFilterLabel = feedHubId
    ? `Showing hub: ${resolvedHubLabel({ hubId: feedHubId })}`
  : isStaff
      ? 'All hubs'
      : undefined;

  return (
    <LayoutWrapper>
      <WelcomeNotification />
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <ContentColumn>
        <TopBar
          onMenuClick={() => setMobileOpen((open) => !open)}
          isMenuOpen={mobileOpen}
          unreadCount={unreadCount}
          onNotificationsClick={() => setNotifOpen(true)}
        />
        <Main>{children}</Main>
      </ContentColumn>
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        items={notifications}
        uid={user?.uid || ''}
        hubFilterLabel={hubFilterLabel}
      />
    </LayoutWrapper>
  );
};

export const Container: React.FC<ContainerProps> = ({ children, ...props }) => {
  return <StyledContainer {...props}>{children}</StyledContainer>;
};

export const AppHeader: React.FC<{
  title?: string;
  children?: React.ReactNode;
}> = ({
  title = 'Hub Attendance Tracker',
  children,
}) => {
  return (
    <Header>
      <Container>
        <HeaderContent>
          <Logo>{title}</Logo>
          <Nav>{children}</Nav>
        </HeaderContent>
      </Container>
    </Header>
  );
};
