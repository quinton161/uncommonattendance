import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import { staggeredAnimation, respectMotionPreference } from '../../styles/animations';

interface StatCardProps {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
  animationDelay?: number;
}

const getVariantStyles = (variant: string) => {
  switch (variant) {
    case 'primary':
      return css`
        background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
        color: ${theme.colors.white};
        border: none;
        
        &::before {
          background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%);
        }
      `;
    case 'accent':
      return css`
        background: linear-gradient(135deg, ${theme.colors.accent} 0%, #e67e22 100%);
        color: ${theme.colors.white};
        border: none;
      `;
    case 'success':
      return css`
        background: linear-gradient(135deg, ${theme.colors.success} 0%, #1e8449 100%);
        color: ${theme.colors.white};
        border: none;
      `;
    case 'warning':
      return css`
        background: linear-gradient(135deg, ${theme.colors.warning} 0%, #d68910 100%);
        color: ${theme.colors.white};
        border: none;
      `;
    default:
      return css`
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: ${theme.colors.textPrimary};
      `;
  }
};

const StyledStatCard = styled.div<{ $variant: string; $delay: number }>`
  position: relative;
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  border-radius: ${theme.borderRadius['3xl']};
  box-shadow: 0 8px 32px rgba(0, 82, 204, 0.08);
  overflow: hidden;
  ${({ $delay }) => staggeredAnimation($delay)}
  ${respectMotionPreference}
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${({ $variant }) => getVariantStyles($variant)}
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }
  
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 16px 48px rgba(0, 82, 204, 0.15);
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md} ${theme.spacing.lg};
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius['2xl']};
  background: rgba(255, 255, 255, 0.2);
  margin-bottom: ${theme.spacing.md};
  
  svg {
    width: 24px;
    height: 24px;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    width: 40px;
    height: 40px;
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const StatValue = styled.div`
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.bold};
  line-height: 1.1;
  margin-bottom: ${theme.spacing.xs};
  font-family: ${theme.fonts.heading};
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes['2xl']};
  }
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: ${theme.fontWeights.medium};
`;

const TrendBadge = styled.span<{ $direction: 'up' | 'down' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  margin-top: ${theme.spacing.sm};
  
  background: ${({ $direction }) => {
    switch ($direction) {
      case 'up': return 'rgba(39, 174, 96, 0.2)';
      case 'down': return 'rgba(231, 76, 60, 0.2)';
      default: return 'rgba(255, 255, 255, 0.2)';
    }
  }};
  
  color: ${({ $direction }) => {
    switch ($direction) {
      case 'up': return '#27ae60';
      case 'down': return '#e74c3c';
      default: return 'inherit';
    }
  }};
`;

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  variant = 'default',
  trend,
  className,
  animationDelay = 0.1,
}) => {
  return (
    <StyledStatCard $variant={variant} $delay={animationDelay} className={className}>
      {icon && <IconWrapper>{icon}</IconWrapper>}
      <StatValue>{value}</StatValue>
      <StatLabel>{label}</StatLabel>
      {trend && (
        <TrendBadge $direction={trend.direction}>
          {trend.direction === 'up' && '↑'}
          {trend.direction === 'down' && '↓'}
          {trend.value}
        </TrendBadge>
      )}
    </StyledStatCard>
  );
};

export default StatCard;
