import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import { buttonHover, respectMotionPreference } from '../../styles/animations';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const getVariantStyles = (variant: string) => {
  switch (variant) {
    case 'primary':
      return css`
        background-color: ${theme.colors.primary};
        color: ${theme.colors.white};
        border: 1px solid ${theme.colors.primary};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.primaryDark};
          border-color: ${theme.colors.primaryDark};
        }
      `;
    case 'secondary':
      return css`
        background-color: ${theme.colors.secondary};
        color: ${theme.colors.white};
        border: 1px solid ${theme.colors.secondary};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.secondaryDark};
          border-color: ${theme.colors.secondaryDark};
        }
      `;
    case 'danger':
      return css`
        background-color: ${theme.colors.danger};
        color: ${theme.colors.white};
        border: 1px solid ${theme.colors.danger};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.dangerDark};
          border-color: ${theme.colors.dangerDark};
        }
      `;
    case 'outline':
      return css`
        background-color: transparent;
        color: ${theme.colors.primary};
        border: 1px solid ${theme.colors.primary};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.primary};
          color: ${theme.colors.white};
        }
      `;
    case 'ghost':
      return css`
        background-color: transparent;
        color: ${theme.colors.primary};
        border: 1px solid transparent;

        &:hover:not(:disabled) {
          background-color: ${theme.colors.gray100};
        }
      `;
    default:
      return css`
        background-color: ${theme.colors.primary};
        color: ${theme.colors.white};
        border: 1px solid ${theme.colors.primary};
      `;
  }
};

const getSizeStyles = (size: string) => {
  switch (size) {
    case 'sm':
      return css`
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
        font-size: ${theme.fontSizes.sm};
        min-height: 32px;
        
        @media (max-width: ${theme.breakpoints.mobile}) {
          padding: ${theme.spacing.xs} ${theme.spacing.xs};
          font-size: ${theme.fontSizes.xs};
          min-height: 36px;
        }
      `;
    case 'lg':
      return css`
        padding: ${theme.spacing.md} ${theme.spacing.xl};
        font-size: ${theme.fontSizes.lg};
        min-height: 48px;
        
        @media (max-width: ${theme.breakpoints.mobile}) {
          padding: ${theme.spacing.sm} ${theme.spacing.lg};
          font-size: ${theme.fontSizes.base};
          min-height: 44px;
        }
      `;
    default:
      return css`
        padding: ${theme.spacing.sm} ${theme.spacing.md};
        font-size: ${theme.fontSizes.base};
        min-height: 40px;
        
        @media (max-width: ${theme.breakpoints.mobile}) {
          padding: ${theme.spacing.xs} ${theme.spacing.sm};
          font-size: ${theme.fontSizes.sm};
          min-height: 44px;
        }
      `;
  }
};

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: ${theme.borderRadius.md};
  font-family: ${theme.fonts.primary};
  font-weight: ${theme.fontWeights.medium};
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  ${buttonHover}
  ${respectMotionPreference}
  
  ${({ variant = 'primary' }) => getVariantStyles(variant)}
  ${({ size = 'md' }) => getSizeStyles(size)}
  
  ${({ fullWidth }) =>
    fullWidth &&
    css`
      width: 100%;
    `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
      transform: none !important;
      box-shadow: none !important;
    }
  }

  &:focus {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
`;

export const Button: React.FC<ButtonProps> = ({
  children,
  loading = false,
  disabled = false,
  type = 'button',
  ...props
}) => {
  return (
    <StyledButton
      type={type}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {children}
    </StyledButton>
  );
};
