'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export default function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const baseClasses = "relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  
  const variantClasses = {
    primary: "bg-uncommon-blue text-white hover:bg-blue-800 focus:ring-uncommon-blue shadow-lg hover:shadow-xl",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 shadow-md hover:shadow-lg",
    outline: "border-2 border-uncommon-blue text-uncommon-blue hover:bg-uncommon-blue hover:text-white focus:ring-uncommon-blue"
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <span className={cn("flex items-center space-x-2", loading && "opacity-0")}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
      </span>
      
      {/* Ripple effect on click */}
      <span className="absolute inset-0 rounded-lg bg-white opacity-0 hover:opacity-10 transition-opacity duration-200"></span>
    </button>
  );
}
