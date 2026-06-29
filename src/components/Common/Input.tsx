import React from 'react';
import { Input as ShadcnInput } from '../UI/input';
import { Label } from '../UI/label';

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
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  size,
  required = false,
  id,
  name,
  icon,
  ...props
}) => {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-2.5 flex items-center justify-center text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <ShadcnInput
          id={inputId}
          name={name}
          required={required}
          className={`
            ${icon ? 'pl-9' : ''}
            ${error ? 'border-destructive focus-visible:ring-destructive' : ''}
          `}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <span className={`text-xs ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
};
