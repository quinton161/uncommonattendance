import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import { staggeredAnimation, respectMotionPreference } from '../../styles/animations';

interface StatCardProps {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  sub?: string;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
  animationDelay?: number;
}

const getAccentColor = (color?: string) => {
  switch (color) {
    case 'blue': return '#0052CC';
    case 'green': return '#10B981';
    case 'orange': return '#F59E0B';
    case 'red': return '#EF4444';
    case 'purple': return '#8B5CF6';
    default: return undefined;
  }
};

const getVariantStyles = (variant: string) => {
  switch (variant) {
    case 'primary':
      return css`
        background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
        color: ${theme.colors.white};
        border: none;
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
        background: #ffffff;
        border: 1px solid rgba(0, 82, 204, 0.08);
        color: ${theme.colors.textPrimary};
      `;
  }
};

const StyledStatCard = styled.div<{ $variant: string; $delay: number; $accentColor?: string }>`
  position: relative;
  padding: ${theme.spacing.lg};
  border-radius: 12px;
  box-shadow: none;
  overflow: hidden;
  ${({ $delay }) => staggeredAnimation($delay)}
  ${respectMotionPreference}
  transition: border-color 0.2s ease, background 0.2s ease;
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
    border-color: rgba(0, 82, 204, 0.14);
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md} ${theme.spacing.lg};
  }
`;

const IconWrapper = styled.div<{ $accentColor?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: ${({ $accentColor }) => $accentColor || theme.colors.primary};
  color: ${theme.colors.white};
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
  color: ${({ color }) => color || 'inherit'};

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

const StatSub = styled.div`
  margin-top: ${theme.spacing.xs};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
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
  sub,
  variant = 'default',
  color,
  trend,
  className,
  animationDelay = 0.1,
}) => {
  const accentColor = getAccentColor(color);

  return (
    <StyledStatCard $variant={variant} $delay={animationDelay} className={className}>
      {icon && <IconWrapper $accentColor={accentColor}>{icon}</IconWrapper>}
      <StatValue>{value}</StatValue>
      <StatLabel>{label}</StatLabel>
      {sub && <StatSub>{sub}</StatSub>}
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
