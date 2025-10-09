'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  glow?: boolean;
}

export default function AnimatedCard({
  children,
  className,
  hover = true,
  gradient = false,
  glow = false
}: AnimatedCardProps) {
  const baseClasses = "bg-white rounded-lg shadow-md transition-all duration-300";
  
  const hoverClasses = hover ? "hover:shadow-xl hover:-translate-y-1 cursor-pointer" : "";
  
  const gradientClasses = gradient ? "bg-gradient-to-br from-white to-blue-50" : "";
  
  const glowClasses = glow ? "hover:shadow-uncommon-blue/20 hover:shadow-2xl" : "";

  return (
    <div 
      className={cn(
        baseClasses,
        hoverClasses,
        gradientClasses,
        glowClasses,
        className
      )}
    >
      {children}
      
      {/* Animated border on hover */}
      {hover && (
        <div className="absolute inset-0 rounded-lg border-2 border-transparent hover:border-uncommon-blue/20 transition-all duration-300 pointer-events-none"></div>
      )}
    </div>
  );
}
