import React from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  User,
  Users,
  Shield,
  X,
  Clock,
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
    display: flex;
    flex-direction: column;
    width: 260px;
    background: #ffffff;
    border-right: 1px solid rgba(0, 82, 204, 0.08);
    box-shadow: 4px 0 24px rgba(0, 82, 204, 0.04);
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
  display: flex;
  flex-direction: column;
`;

const SidebarContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const BrandSection = styled.div`
  padding: 24px 20px 20px;
  background: linear-gradient(135deg, #0052CC 0%, #003D99 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -30%;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -40%;
    left: -20%;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
  }
`;

const BrandRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
`;

const Brand = styled.button`
  display: flex;
  align-items: center;
  gap: 14px;
  border: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
  color: inherit;
  cursor: pointer;
  text-align: left;

  &:hover, &:active {
    background: transparent;
    box-shadow: none;
  }
`;

const Logo = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(4px);

  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
`;

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const BrandTitle = styled.span`
  font-size: ${theme.fontSizes.lg};
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
  letter-spacing: -0.03em;
`;

const BrandSub = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1;
  letter-spacing: 0.18em;
  text-transform: uppercase;
`;

const CloseButton = styled.button`
  border: 0;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  backdrop-filter: blur(4px);

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
  }

  @media (min-width: ${theme.breakpoints.laptop}) {
    display: none;
  }
`;

const Nav = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
`;

const NavSection = styled.div`
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const NavEyebrow = styled.p`
  margin: 16px 12px 8px;
  font-size: 10px;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.15em;
  text-transform: uppercase;
`;

const NavButton = styled.button<{ $active?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 0;
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 2px;
  background: ${({ $active }) => ($active ? 'rgba(0, 82, 204, 0.08)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#0052CC' : theme.colors.textSecondary)};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${({ $active }) => ($active ? 700 : 600)};
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: all 0.2s ease;

  ${({ $active }) =>
    $active &&
    `
    &::before {
      content: '';
      position: absolute;
      left: -12px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 24px;
      border-radius: 0 3px 3px 0;
      background: #0052CC;
    }
  `}

  &:hover {
    background: ${({ $active }) => ($active ? 'rgba(0, 82, 204, 0.12)' : '#f8faff')};
    color: ${({ $active }) => ($active ? '#0052CC' : theme.colors.textPrimary)};
    transform: translateX(2px);
  }
`;

const NavIcon = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  color: ${({ $active }) => ($active ? '#0052CC' : theme.colors.gray500)};
  flex-shrink: 0;

  svg {
    color: currentColor;
  }
`;

const NavLabel = styled.span`
  line-height: 1;
`;

const Footer = styled.div`
  padding: 16px;
  border-top: 1px solid rgba(0, 82, 204, 0.06);
  background: #fafbff;
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #0052cc, #1a7fff);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.fontSizes.sm};
  font-weight: 800;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 82, 204, 0.2);

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
  border-radius: 10px;
  padding: 9px 12px;
  background: transparent;
  color: ${theme.colors.textLight};
  font-size: ${theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

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
    { id: 'attendance', path: '/attendance', label: 'Attendance', icon: <Clock size={18} /> },
    { id: 'users', path: '/users', label: 'Students', icon: <Users size={18} /> },
    { id: 'staff', path: '/staff', label: 'Staff', icon: <Shield size={18} /> },
    { id: 'profile', path: '/profile', label: 'Profile', icon: <User size={18} /> },
  ];

  const studentNav: NavItem[] = [
    { id: 'dashboard', path: '/dashboard', label: 'Home', icon: <LayoutDashboard size={18} /> },
    { id: 'attendance', path: '/attendance', label: 'My Attendance', icon: <Calendar size={18} /> },
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
      <BrandSection>
        <BrandRow>
          <Brand type="button" data-ui="nav" onClick={() => handleNavigate('/dashboard')}>
            <Logo>
              <img src="/shapes.svg" alt="Uncommon" />
            </Logo>
            <BrandText>
              <BrandTitle>Uncommon</BrandTitle>
              <BrandSub>Attendance</BrandSub>
            </BrandText>
          </Brand>
          <CloseButton type="button" data-ui="nav" aria-label="Close navigation" onClick={onClose}>
            <X size={16} />
          </CloseButton>
        </BrandRow>
      </BrandSection>

      <Nav aria-label="Main navigation">
        <NavSection>
          <NavEyebrow>Menu</NavEyebrow>
          {navItems.map((item) => {
            const active = isActivePath(location.pathname.toLowerCase(), item.path);
            return (
              <NavButton
                key={item.id}
                type="button"
                data-ui="nav"
                $active={active}
                onClick={() => handleNavigate(item.path)}
              >
                <NavIcon $active={active}>{item.icon}</NavIcon>
                <NavLabel>{item.label}</NavLabel>
              </NavButton>
            );
          })}
        </NavSection>
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
        <LogoutButton type="button" data-ui="nav" onClick={logout}>
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
