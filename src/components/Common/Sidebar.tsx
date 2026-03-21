import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { 
  PersonIcon,
  LogoutIcon,
  BarChartIcon,
  PeopleIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  StarIcon
} from './Icons';
import { useAuth } from '../../contexts/AuthContext';

const SidebarContainer = styled.aside<{ $isExpanded: boolean }>`
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: ${props => props.$isExpanded ? '240px' : '72px'};
  background-color: ${theme.colors.primary};
  color: ${theme.colors.white};
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: ${theme.zIndex.fixed};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: ${theme.shadows.lg};

  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }

  &:hover {
    width: 240px;
  }
`;

const SidebarHeader = styled.div<{ $isExpanded: boolean }>`
  height: 72px;
  display: flex;
  align-items: center;
  padding: 0 ${props => props.$isExpanded ? '24px' : '0'};
  justify-content: ${props => props.$isExpanded ? 'flex-start' : 'center'};
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const LogoWrapper = styled.div`
  min-width: 24px;
  display: flex;
  justify-content: center;
  font-size: 24px;
  color: ${theme.colors.white};
`;

const BrandName = styled.span`
  font-weight: ${theme.fontWeights.bold};
  font-size: ${theme.fontSizes.lg};
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
`;

const NavList = styled.nav`
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NavItem = styled.div<{ $active?: boolean; $danger?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  color: ${props => {
    if (props.$danger) return '#ff8a8a';
    return theme.colors.white;
  }};

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
    color: ${theme.colors.white};
  }

  svg {
    color: ${theme.colors.white} !important;
  }
`;

const IconWrapper = styled.div`
  min-width: 24px;
  margin-right: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const NavText = styled.span`
  white-space: nowrap;
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
`;

const SidebarFooter = styled.div`
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const SupportCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: ${theme.borderRadius.lg};
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SupportTitle = styled.div`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.white};
`;

const SupportText = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
`;

const ContactButton = styled.button`
  background: ${theme.colors.white};
  color: ${theme.colors.secondaryDark};
  border: none;
  border-radius: ${theme.borderRadius.md};
  padding: 8px;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  cursor: pointer;
  width: 100%;
  margin-top: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.9);
  }
`;

const MobileBottomNav = styled.nav`
  display: none;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    display: flex;
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    height: 64px;
    background-color: ${theme.colors.primary};
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: ${theme.zIndex.fixed};
    align-items: center;
    justify-content: space-around;
    padding: 0 10px;
  }
`;

const MobileNavItem = styled.div<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  color: ${theme.colors.white};
  transition: all 0.3s ease;
  width: 48px;
  height: 48px;

  ${props => props.$active && `
    &::before {
      content: '';
      position: absolute;
      top: -12px;
      width: 20px;
      height: 3px;
      background: ${theme.colors.white};
      border-radius: 0 0 4px 4px;
      box-shadow: 0 2px 10px rgba(255, 255, 255, 0.5);
    }
    
    &::after {
      content: '';
      position: absolute;
      top: -10px;
      width: 30px;
      height: 40px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }
  `}

  svg {
    color: ${theme.colors.white} !important;
  }
`;

interface SidebarProps {
  activeNav?: string;
  onNavClick?: (navItem: string) => void;
  onMasterReset?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeNav = 'dashboard', 
  onNavClick = () => {}, 
  onMasterReset 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { user, logout } = useAuth();

  const isAdmin = user?.userType === 'admin' || user?.userType === 'instructor';

  const menuItems = isAdmin ? [
    { id: 'dashboard', icon: <BarChartIcon size={20} />, label: user?.userType === 'instructor' ? 'Instructor' : 'Admin' },
    { id: 'analytics', icon: <TrendingUpIcon size={20} />, label: 'Analytics' },
    { id: 'users', icon: <PeopleIcon size={20} />, label: 'Users' },
    { id: 'profile', icon: <PersonIcon size={20} />, label: 'Profile' },
  ] : [
    { id: 'dashboard', icon: <BarChartIcon size={20} />, label: 'Dashboard' },
    { id: 'analytics', icon: <TrendingUpIcon size={20} />, label: 'Analytics' },
    { id: 'profile', icon: <PersonIcon size={20} />, label: 'Profile' },
  ];

  const StarDecoration = ({ $active }: { $active?: boolean }) => (
    <div style={{
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      opacity: $active ? 1 : 0.3,
      display: 'flex',
      gap: '2px'
    }}>
      <StarIcon size={10} />
      <StarIcon size={14} />
    </div>
  );

  return (
    <>
      <SidebarContainer 
        $isExpanded={isHovered}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <SidebarHeader $isExpanded={isHovered}>
          {isHovered ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <LogoWrapper>
                <img src="/shapes.svg" alt="Logo" style={{ width: '32px', height: '32px' }} />
              </LogoWrapper>
              <BrandName>Uncommon</BrandName>
            </div>
          ) : (
            <LogoWrapper>
              <img src="/shapes.svg" alt="Logo" style={{ width: '24px', height: '24px' }} />
            </LogoWrapper>
          )}
        </SidebarHeader>

        <NavList>
          {menuItems.map((item) => (
            <NavItem 
              key={item.id} 
              $active={activeNav === item.id}
              onClick={() => onNavClick(item.id)}
              style={{ position: 'relative' }}
            >
              <IconWrapper>{item.icon}</IconWrapper>
              {isHovered && <NavText>{item.label}</NavText>}
              {isHovered && <StarDecoration $active={activeNav === item.id} />}
            </NavItem>
          ))}

          {isHovered && isAdmin && user?.userType === 'admin' && onMasterReset && (
            <NavItem $danger onClick={onMasterReset}>
              <IconWrapper><RefreshCwIcon size={20} /></IconWrapper>
              <NavText>Master Reset</NavText>
            </NavItem>
          )}
        </NavList>

        {isHovered && (
          <SidebarFooter>
            <SupportCard>
              <SupportTitle>Need support?</SupportTitle>
              <SupportText>Get in touch with our agents</SupportText>
              <ContactButton>Contact us</ContactButton>
            </SupportCard>
          </SidebarFooter>
        )}
        
        {!isHovered && (
          <SidebarFooter 
            style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}
            onClick={logout}
          >
            <LogoutIcon size={20} style={{ opacity: 0.5 }} title="Logout" />
          </SidebarFooter>
        )}
        
        {isHovered && (
          <SidebarFooter>
            <NavItem onClick={logout}>
              <IconWrapper><LogoutIcon size={20} /></IconWrapper>
              <NavText>Logout</NavText>
            </NavItem>
          </SidebarFooter>
        )}
      </SidebarContainer>

      <MobileBottomNav>
        {menuItems.map((item) => (
          <MobileNavItem 
            key={item.id} 
            $active={activeNav === item.id}
            onClick={() => onNavClick(item.id)}
          >
            {item.icon}
          </MobileNavItem>
        ))}
        <MobileNavItem onClick={logout}>
          <LogoutIcon size={20} />
        </MobileNavItem>
      </MobileBottomNav>
    </>
  );
};
