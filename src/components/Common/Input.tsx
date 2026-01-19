import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';

interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
}

const InputContainer = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  
  ${({ fullWidth }) =>
    fullWidth &&
    css`
      width: 100%;
    `}
`;

const Label = styled.label`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textPrimary};
`;

const getSizeStyles = (size: string) => {
  switch (size) {
    case 'sm':
      return css`
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
        font-size: ${theme.fontSizes.sm};
        min-height: 32px;
      `;
    case 'lg':
      return css`
        padding: ${theme.spacing.md} ${theme.spacing.md};
        font-size: ${theme.fontSizes.lg};
        min-height: 48px;
      `;
    default:
      return css`
        padding: ${theme.spacing.sm} ${theme.spacing.sm};
        font-size: ${theme.fontSizes.base};
        min-height: 40px;
      `;
  }
};

const StyledInput = styled.input<{ hasError?: boolean; size?: string }>`
  width: 100%;
  border: 1px solid ${({ hasError }) => 
    hasError ? theme.colors.danger : theme.colors.gray300};
  border-radius: ${theme.borderRadius.md};
  font-family: ${theme.fonts.primary};
  color: ${theme.colors.textPrimary};
  background-color: ${theme.colors.white};
  transition: all 0.2s ease;
  
  ${({ size = 'md' }) => getSizeStyles(size)}

  &::placeholder {
    color: ${theme.colors.textLight};
  }

  &:focus {
    outline: none;
    border-color: ${({ hasError }) => 
      hasError ? theme.colors.danger : theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ hasError }) => 
      hasError ? `${theme.colors.danger}20` : `${theme.colors.primary}20`};
  }

  &:disabled {
    background-color: ${theme.colors.gray100};
    color: ${theme.colors.textLight};
    cursor: not-allowed;
  }
`;

const HelperText = styled.span<{ isError?: boolean }>`
  font-size: ${theme.fontSizes.xs};
  color: ${({ isError }) => 
    isError ? theme.colors.danger : theme.colors.textSecondary};
`;

const RequiredIndicator = styled.span`
  color: ${theme.colors.danger};
  margin-left: 2px;
`;

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  size = 'md',
  required = false,
  id,
  name,
  ...props
}) => {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <InputContainer fullWidth={fullWidth}>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required && <RequiredIndicator>*</RequiredIndicator>}
        </Label>
      )}
      <StyledInput
        id={inputId}
        name={name}
        hasError={!!error}
        size={size}
        required={required}
        {...props}
      />
      {(error || helperText) && (
        <HelperText isError={!!error}>
          {error || helperText}
        </HelperText>
      )}
    </InputContainer>
  );
};
