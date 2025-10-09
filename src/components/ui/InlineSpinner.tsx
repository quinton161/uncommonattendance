'use client';

interface InlineSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'blue' | 'gray';
  text?: string;
}

export default function InlineSpinner({ 
  size = 'md', 
  color = 'blue',
  text 
}: InlineSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    white: 'border-white border-t-transparent',
    blue: 'border-uncommon-blue border-t-transparent',
    gray: 'border-gray-400 border-t-transparent'
  };

  return (
    <div className="flex items-center justify-center">
      <div 
        className={`${sizeClasses[size]} ${colorClasses[color]} border-2 rounded-full animate-spin`}
      />
      {text && (
        <span className="ml-2 text-sm">{text}</span>
      )}
    </div>
  );
}
