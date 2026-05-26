import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import { cardAnimation, respectMotionPreference } from '../../styles/animations';

interface GlassCardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'strong' | 'dark' | 'primary';
  hover?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const getPaddingStyles = (padding: string) => {
  switch (padding) {
    case 'sm':
      return css`padding: ${theme.spacing.sm};`;
    case 'lg':
      return css`padding: ${theme.spacing.xl};`;
    case 'xl':
      return css`padding: ${theme.spacing['2xl']};`;
    default:
      return css`padding: ${theme.spacing.lg};`;
  }
};

const getVariantStyles = (variant: string) => {
  switch (variant) {
    case 'strong':
      return css`
        background: #ffffff;
        border: 1px solid rgba(0, 82, 204, 0.08);
        box-shadow: 0 1px 4px rgba(0, 82, 204, 0.05);
      `;
    case 'dark':
      return css`
        background: rgba(0, 82, 204, 0.9);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 4px 14px rgba(0, 82, 204, 0.16);
        color: ${theme.colors.white};
      `;
    case 'primary':
      return css`
        background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 14px rgba(0, 82, 204, 0.14);
        color: ${theme.colors.white};
      `;
    default: // light
      return css`
        background: #ffffff;
        border: 1px solid rgba(0, 82, 204, 0.06);
        box-shadow: none;
      `;
  }
};

const StyledGlassCard = styled.div<GlassCardProps>`
  border-radius: 12px;
  ${cardAnimation}
  ${respectMotionPreference}
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${({ padding = 'md' }) => getPaddingStyles(padding)}
  ${({ variant = 'light' }) => getVariantStyles(variant)}
  
  ${({ hover }) =>
    hover &&
    css`
      cursor: pointer;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 82, 204, 0.06);
      }
    `}
`;

export const GlassCard: React.FC<GlassCardProps> = ({ children, hover, ...props }) => {
  return (
    <StyledGlassCard
      {...props}
      hover={hover ? true : undefined}
    >
      {children}
    </StyledGlassCard>
  );
};


export default GlassCard;
