import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const CardContainer = styled.div<{ variant?: 'default' | 'elevated' | 'outlined' | 'gradient' }>`
  background: ${props => {
    switch (props.variant) {
      case 'gradient':
        return `linear-gradient(135deg, ${theme.colors.white} 0%, ${theme.colors.gray50} 100%)`;
      default:
        return theme.colors.white;
    }
  }};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.lg};
    border-radius: ${theme.borderRadius.lg};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
    border-radius: ${theme.borderRadius.md};
  }
  
  ${props => {
    switch (props.variant) {
      case 'elevated':
        return `
          box-shadow: ${theme.shadows.lg};
          border: 1px solid ${theme.colors.gray100};
          
          &:hover {
            transform: translateY(-4px);
            box-shadow: ${theme.shadows.xl};
          }
        `;
      case 'outlined':
        return `
          border: 2px solid ${theme.colors.gray200};
          box-shadow: none;
          
          &:hover {
            border-color: ${theme.colors.primary};
            box-shadow: 0 0 0 4px rgba(6, 71, 161, 0.1);
          }
        `;
      case 'gradient':
        return `
          border: 1px solid ${theme.colors.gray100};
          box-shadow: ${theme.shadows.md};
          
          &:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%);
          }
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: ${theme.shadows.lg};
          }
        `;
      default:
        return `
          box-shadow: ${theme.shadows.md};
          border: 1px solid ${theme.colors.gray100};
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: ${theme.shadows.lg};
            border-color: ${theme.colors.gray200};
          }
        `;
    }
  }}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg};
`;

const CardTitle = styled.h3`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin: 0 0 ${theme.spacing.xs} 0;
  line-height: 1.2;
`;

const CardSubtitle = styled.p`
  font-family: ${theme.fonts.primary};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  margin: 0;
  line-height: 1.4;
`;

const CardContent = styled.div`
  color: ${theme.colors.textPrimary};
  line-height: 1.6;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${theme.spacing.lg};
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.gray200};
`;

const CardIcon = styled.div<{ color?: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.lg};
  background: ${props => props.color ? `linear-gradient(135deg, ${props.color} 0%, ${props.color}dd 100%)` : `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.white};
  font-size: ${theme.fontSizes.lg};
  box-shadow: ${theme.shadows.sm};
  flex-shrink: 0;
`;

const CardBadge = styled.div<{ variant?: 'primary' | 'success' | 'warning' | 'error' }>`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    switch (props.variant) {
      case 'success':
        return `
          background: rgba(39, 174, 96, 0.1);
          color: ${theme.colors.success};
        `;
      case 'warning':
        return `
          background: rgba(243, 156, 18, 0.1);
          color: ${theme.colors.warning};
        `;
      case 'error':
        return `
          background: rgba(231, 76, 60, 0.1);
          color: ${theme.colors.error};
        `;
      default:
        return `
          background: rgba(6, 71, 161, 0.1);
          color: ${theme.colors.primary};
        `;
    }
  }}
`;

const CardStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${theme.spacing.lg};
  margin: ${theme.spacing.lg} 0;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${theme.spacing.sm};
  }
`;

const CardStat = styled.div`
  text-align: center;
`;

const CardStatValue = styled.div`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  line-height: 1;
`;

const CardStatLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  margin-top: ${theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

interface UncommonCardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  badge?: {
    text: string;
    variant?: 'primary' | 'success' | 'warning' | 'error';
  };
  stats?: Array<{
    value: string | number;
    label: string;
  }>;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const UncommonCard: React.FC<UncommonCardProps> = ({
  variant = 'default',
  title,
  subtitle,
  icon,
  iconColor,
  badge,
  stats,
  footer,
  children,
  className,
  onClick
}) => {
  return (
    <CardContainer 
      variant={variant} 
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {(title || subtitle || icon || badge) && (
        <CardHeader>
          <div style={{ flex: 1 }}>
            {icon && (
              <CardIcon color={iconColor}>
                {icon}
              </CardIcon>
            )}
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
          </div>
          {badge && (
            <CardBadge variant={badge.variant}>
              {badge.text}
            </CardBadge>
          )}
        </CardHeader>
      )}

      {stats && (
        <CardStats>
          {stats.map((stat, index) => (
            <CardStat key={index}>
              <CardStatValue>{stat.value}</CardStatValue>
              <CardStatLabel>{stat.label}</CardStatLabel>
            </CardStat>
          ))}
        </CardStats>
      )}

      {children && (
        <CardContent>
          {children}
        </CardContent>
      )}

      {footer && (
        <CardFooter>
          {footer}
        </CardFooter>
      )}
    </CardContainer>
  );
};
