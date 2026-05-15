import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

interface HorizontalNavProps {
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

const NavContainer = styled.nav`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs};
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: ${theme.borderRadius.full};
  border: 1px solid rgba(255, 255, 255, 0.4);
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const NavItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.full};
  border: none;
  font-family: ${theme.fonts.primary};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  background: ${({ $active }) => $active 
    ? theme.colors.primary 
    : 'transparent'
  };
  color: ${({ $active }) => $active 
    ? theme.colors.white 
    : theme.colors.textSecondary
  };
  
  &:hover {
    background: ${({ $active }) => $active 
      ? theme.colors.primary 
      : 'rgba(0, 82, 204, 0.08)'
    };
    color: ${({ $active }) => $active 
      ? theme.colors.white 
      : theme.colors.primary
    };
  }
  
  &:focus {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
  
  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.xs} ${theme.spacing.md};
    font-size: ${theme.fontSizes.xs};
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

export const HorizontalNav: React.FC<HorizontalNavProps> = ({
  items,
  activeId,
  onSelect,
  className,
}) => {
  return (
    <NavContainer className={className} role="tablist">
      {items.map((item) => (
        <NavItem
          key={item.id}
          $active={item.id === activeId}
          onClick={() => onSelect(item.id)}
          role="tab"
          aria-selected={item.id === activeId}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavItem>
      ))}
    </NavContainer>
  );
};

export default HorizontalNav;
