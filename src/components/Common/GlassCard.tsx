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
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 8px 32px rgba(0, 82, 204, 0.1);
      `;
    case 'dark':
      return css`
        background: rgba(0, 82, 204, 0.9);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 8px 32px rgba(0, 82, 204, 0.3);
        color: ${theme.colors.white};
      `;
    case 'primary':
      return css`
        background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px rgba(0, 82, 204, 0.25);
        color: ${theme.colors.white};
      `;
    default: // light
      return css`
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow: 0 8px 32px rgba(0, 82, 204, 0.08);
      `;
  }
};

const StyledGlassCard = styled.div<GlassCardProps>`
  border-radius: ${theme.borderRadius['3xl']};
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
        transform: translateY(-4px);
        box-shadow: 0 16px 48px rgba(0, 82, 204, 0.15);
      }
    `}
`;

export const GlassCard: React.FC<GlassCardProps> = ({ children, ...props }) => {
  return <StyledGlassCard {...props}>{children}</StyledGlassCard>;
};

export default GlassCard;
