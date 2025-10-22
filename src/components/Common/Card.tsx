import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import { cardAnimation, respectMotionPreference } from '../../styles/animations';

interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
}

const getPaddingStyles = (padding: string) => {
  switch (padding) {
    case 'sm':
      return css`
        padding: ${theme.spacing.sm};
      `;
    case 'lg':
      return css`
        padding: ${theme.spacing.xl};
      `;
    default:
      return css`
        padding: ${theme.spacing.md};
      `;
  }
};

const getShadowStyles = (shadow: string) => {
  switch (shadow) {
    case 'sm':
      return css`
        box-shadow: ${theme.shadows.sm};
      `;
    case 'lg':
      return css`
        box-shadow: ${theme.shadows.lg};
      `;
    default:
      return css`
        box-shadow: ${theme.shadows.base};
      `;
  }
};

const StyledCard = styled.div<CardProps>`
  background-color: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.gray200};
  ${cardAnimation}
  ${respectMotionPreference}
  
  ${({ padding = 'md' }) => getPaddingStyles(padding)}
  ${({ shadow = 'md' }) => getShadowStyles(shadow)}
  
  ${({ hover }) =>
    hover &&
    css`
      cursor: pointer;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
      }
    `}
`;

export const Card: React.FC<CardProps> = ({ children, ...props }) => {
  return <StyledCard {...props}>{children}</StyledCard>;
};
