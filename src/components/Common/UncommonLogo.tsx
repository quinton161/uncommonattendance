import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const LogoContainer = styled.div<{ size?: 'sm' | 'md' | 'lg' }>`
  display: flex;
  align-items: center;
`;

const LogoText = styled.div<{ size?: 'sm' | 'md' | 'lg' }>`
  display: flex;
  flex-direction: column;
  line-height: 1;
`;

const LogoTitle = styled.span<{ size?: 'sm' | 'md' | 'lg' }>`
  font-family: ${theme.fonts.heading};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  font-size: ${props => {
    switch (props.size) {
      case 'sm': return theme.fontSizes.lg;
      case 'lg': return theme.fontSizes['4xl'];
      default: return theme.fontSizes.xl;
    }
  }};
  letter-spacing: -0.02em;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${props => {
      switch (props.size) {
        case 'sm': return theme.fontSizes.base;
        case 'lg': return theme.fontSizes['2xl'];
        default: return theme.fontSizes.lg;
      }
    }};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${props => {
      switch (props.size) {
        case 'sm': return theme.fontSizes.sm;
        case 'lg': return theme.fontSizes.xl;
        default: return theme.fontSizes.base;
      }
    }};
  }
`;

const LogoSubtitle = styled.span<{ size?: 'sm' | 'md' | 'lg' }>`
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textSecondary};
  font-size: ${props => {
    switch (props.size) {
      case 'sm': return theme.fontSizes.xs;
      case 'lg': return theme.fontSizes.base;
      default: return theme.fontSizes.sm;
    }
  }};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

interface UncommonLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const UncommonLogo: React.FC<UncommonLogoProps> = ({ 
  size = 'md', 
  showSubtitle = true,
  className 
}) => {
  return (
    <LogoContainer size={size} className={className}>
      <LogoText size={size}>
        <LogoTitle size={size}>Uncommon</LogoTitle>
        {showSubtitle && (
          <LogoSubtitle size={size}>Attendance</LogoSubtitle>
        )}
      </LogoText>
    </LogoContainer>
  );
};
