import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button as ShadcnButton } from '../UI/button';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'> = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
  outline: 'outline',
  ghost: 'ghost',
};

const sizeMap: Record<string, 'default' | 'sm' | 'lg'> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  loading = false,
  disabled = false,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth,
  onClick,
  style,
}) => {
  return (
    <ShadcnButton
      type={type}
      disabled={disabled || loading}
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={fullWidth ? 'w-full' : ''}
      onClick={onClick}
      style={style}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </ShadcnButton>
  );
};
