import React from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  QrCode,
  Target,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';

type NavItem = {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const DesktopAside = styled.aside`
  display: none;

  @media (min-width: ${theme.breakpoints.laptop}) {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: ${theme.zIndex.fixed};
    display: block;
    width: 240px;
    background: #ffffff;
    border-right: 1px solid rgba(0, 82, 204, 0.07);
  }
`;

const MobileLayer = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${theme.zIndex.modal};

  @media (min-width: ${theme.breakpoints.laptop}) {
    display: none;
  }
`;

const MobileBackdrop = styled.button`
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(4px);
  cursor: pointer;
`;

const MobileAside = styled.aside`
  position: absolute;
  inset: 0 auto 0 0;
  width: min(280px, 88vw);
  background: #ffffff;
  border-right: 1px solid rgba(0, 82, 204, 0.07);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.2);
`;

const SidebarContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid #eef2ff;
`;

const Brand = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  border: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
  color: inherit;
  cursor: pointer;
  text-align: left;
  transform: none;

  &:hover,
  &:active {
    background: transparent;
    box-shadow: none;
    color: inherit;
    transform: none;
  }
`;

const Logo = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }
`;

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const BrandTitle = styled.span`
  font-size: ${theme.fontSizes.sm};
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  line-height: 1;
  letter-spacing: -0.02em;
`;

const BrandSub = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: ${theme.colors.textLight};
  line-height: 1;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const CloseButton = styled.button`
  border: 0;
  background: #f8faff;
  color: ${theme.colors.textSecondary};
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  @media (min-width: ${theme.breakpoints.laptop}) {
    display: none;
  }
`;

const Nav = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 20px 12px;
`;

const NavEyebrow = styled.p`
  margin: 0 12px 12px;
  font-size: 10px;
  font-weight: 800;
  color: #cbd5e1;
  letter-spacing: 0.15em;
  text-transform: uppercase;
`;

const NavButton = styled.button<{ $active?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 0;
  border-radius: 14px;
  padding: 11px 12px;
  margin-bottom: 4px;
  background: ${({ $active }) => ($active ? theme.colors.primary : 'transparent')};
  color: ${({ $active }) => ($active ? theme.colors.white : theme.colors.textSecondary)};
  font-size: ${theme.fontSizes.sm};
  font-weight: 650;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? theme.colors.primaryDark : '#f8faff')};
    color: ${({ $active }) => ($active ? theme.colors.white : theme.colors.textPrimary)};
  }
`;

const NavIcon = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  color: ${({ $active }) => ($active ? theme.colors.white : '#94a3b8')};
`;

const ActiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 999px;
  margin-left: auto;
  background: ${theme.colors.white};
`;

const Footer = styled.div`
  padding: 16px;
  border-top: 1px solid #eef2ff;
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const Avatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, #0052cc, #1a7fff);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.p`
  margin: 0;
  font-size: ${theme.fontSizes.sm};
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserRole = styled.p`
  margin: 2px 0 0;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textLight};
  text-transform: capitalize;
`;

const LogoutButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 14px;
  padding: 10px 12px;
  background: transparent;
  color: ${theme.colors.textLight};
  font-size: ${theme.fontSizes.sm};
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: #fff1f2;
    color: #ef4444;
  }
`;

const getInitials = (name?: string) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const isActivePath = (pathname: string, itemPath: string) => {
  if (itemPath === '/dashboard') {
    return pathname === '/' || pathname.startsWith('/dashboard');
  }
  return pathname.startsWith(itemPath);
};

const SidebarInner: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStaff = user?.userType === 'admin' || user?.userType === 'instructor';

  const staffNav: NavItem[] = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'attendance', path: '/attendance', label: 'Attendance', icon: <QrCode size={18} /> },
    { id: 'users', path: '/users', label: 'Students', icon: <Users size={18} /> },
    { id: 'goals', path: '/goals', label: 'Goals Board', icon: <Target size={18} /> },
    { id: 'events', path: '/events', label: 'Events', icon: <Calendar size={18} /> },
    { id: 'profile', path: '/profile', label: 'Profile', icon: <User size={18} /> },
  ];

  const studentNav: NavItem[] = [
    { id: 'dashboard', path: '/dashboard', label: 'Home', icon: <LayoutDashboard size={18} /> },
    { id: 'attendance', path: '/attendance', label: 'Attendance', icon: <QrCode size={18} /> },
    { id: 'goals', path: '/goals', label: 'My Goals', icon: <Target size={18} /> },
    { id: 'events', path: '/events', label: 'Events', icon: <Calendar size={18} /> },
    { id: 'profile', path: '/profile', label: 'Profile', icon: <User size={18} /> },
  ];

  const navItems = isStaff ? staffNav : studentNav;
  const roleLabel = user?.userType === 'attendee' ? 'Student' : user?.userType || 'Member';

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <SidebarContent>
      <Header>
        <Brand type="button" onClick={() => handleNavigate('/dashboard')}>
          <Logo>
            <img src="/shapes.svg" alt="Uncommon Attendance" />
          </Logo>
          <BrandText>
            <BrandTitle>UNCOMMON</BrandTitle>
            <BrandSub>Attendance</BrandSub>
          </BrandText>
        </Brand>
        <CloseButton type="button" aria-label="Close navigation" onClick={onClose}>
          <X size={16} />
        </CloseButton>
      </Header>

      <Nav aria-label="Main navigation">
        <NavEyebrow>Navigation</NavEyebrow>
        {navItems.map((item) => {
          const active = isActivePath(location.pathname.toLowerCase(), item.path);
          return (
            <NavButton
              key={item.id}
              type="button"
              $active={active}
              onClick={() => handleNavigate(item.path)}
            >
              <NavIcon $active={active}>{item.icon}</NavIcon>
              <span>{item.label}</span>
              {active && <ActiveDot />}
            </NavButton>
          );
        })}
      </Nav>

      <Footer>
        <UserRow>
          <Avatar>
            {user?.photoUrl ? <img src={user.photoUrl} alt="" /> : getInitials(user?.displayName)}
          </Avatar>
          <UserMeta>
            <UserName>{user?.displayName || 'Uncommon user'}</UserName>
            <UserRole>{roleLabel}</UserRole>
          </UserMeta>
        </UserRow>
        <LogoutButton type="button" onClick={logout}>
          <LogOut size={15} />
          Sign out
        </LogoutButton>
      </Footer>
    </SidebarContent>
  );
};

export const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <>
      <DesktopAside>
        <SidebarInner {...props} />
      </DesktopAside>

      {props.isOpen && (
        <MobileLayer>
          <MobileBackdrop type="button" aria-label="Close navigation" onClick={props.onClose} />
          <MobileAside>
            <SidebarInner {...props} />
          </MobileAside>
        </MobileLayer>
      )}
    </>
  );
};
