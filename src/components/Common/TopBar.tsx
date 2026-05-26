import React from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';

interface TopBarProps {
  onMenuClick?: () => void;
}

const Bar = styled.header`
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  padding: 0 20px;
  background: #eef2ff;
  position: sticky;
  top: 0;
  z-index: ${theme.zIndex.sticky};

  @media (min-width: ${theme.breakpoints.tablet}) {
    padding: 0 24px;
  }
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  min-width: 0;
`;

const MenuButton = styled.button`
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  box-shadow: none;

  @media (min-width: ${theme.breakpoints.laptop}) {
    display: none;
  }
`;

const HamburgerLines = styled.span`
  display: flex;
  width: 18px;
  flex-direction: column;
  gap: 4px;

  span {
    display: block;
    width: 100%;
    height: 2px;
    border-radius: 2px;
    background: ${theme.colors.textPrimary};
  }
`;

const TitleBlock = styled.div`
  min-width: 0;
`;

const Title = styled.h1`
  margin: 0;
  font-size: ${theme.fontSizes.base};
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  line-height: 1.2;
`;

const DateText = styled.p`
  display: none;
  margin: 2px 0 0;
  color: ${theme.colors.textLight};
  font-size: ${theme.fontSizes.xs};

  @media (min-width: ${theme.breakpoints.mobile}) {
    display: block;
  }
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PageHint = styled.p`
  display: none;
  margin: 0;
  color: ${theme.colors.textLight};
  font-size: ${theme.fontSizes.xs};

  @media (min-width: ${theme.breakpoints.tablet}) {
    display: block;
  }
`;

const Avatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, #0052cc, #003d99);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.fontSizes.sm};
  font-weight: 800;
  box-shadow: none;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const routeLabels: Record<string, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Track attendance at a glance' },
  attendance: { title: 'Attendance', sub: 'QR check-in and daily records' },
  users: { title: 'Students', sub: 'Manage hub members' },
  goals: { title: 'Goals Board', sub: 'Daily intentions and progress' },
  events: { title: 'Events', sub: 'Hub sessions and activities' },
  profile: { title: 'Profile', sub: 'Your account settings' },
};

const activeRouteFromPath = (pathname: string) => {
  if (pathname.includes('/users')) return 'users';
  if (pathname.includes('/attendance')) return 'attendance';
  if (pathname.includes('/goals')) return 'goals';
  if (pathname.includes('/events')) return 'events';
  if (pathname.includes('/profile')) return 'profile';
  return 'dashboard';
};

const getInitial = (name?: string) => name?.trim()?.[0]?.toUpperCase() || 'U';

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const location = useLocation();
  const activeRoute = activeRouteFromPath(location.pathname.toLowerCase());
  const info = routeLabels[activeRoute] || routeLabels.dashboard;
  const dateText = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Bar>
      <Left>
        <MenuButton type="button" aria-label="Open navigation" onClick={onMenuClick}>
          <HamburgerLines aria-hidden="true">
            <span />
            <span />
            <span />
          </HamburgerLines>
        </MenuButton>
        <TitleBlock>
          <Title>{info.title}</Title>
          <DateText>{dateText}</DateText>
        </TitleBlock>
      </Left>

      <Right>
        <PageHint>{info.sub}</PageHint>
        <Avatar>
          {user?.photoUrl ? <img src={user.photoUrl} alt="" /> : getInitial(user?.displayName)}
        </Avatar>
      </Right>
    </Bar>
  );
};

export default TopBar;
