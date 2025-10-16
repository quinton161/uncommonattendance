import { cn } from '../../lib/utils';

const badgeVariants = {
  default: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
  destructive: "bg-red-100 text-red-800 hover:bg-red-200",
  success: "bg-green-100 text-green-800 hover:bg-green-200",
  warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  info: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  outline: "border border-gray-200 text-gray-900 hover:bg-gray-100",
};

export default function Badge({ 
  className, 
  variant = "default", 
  size = "default",
  ...props 
}) {
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    default: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm"
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        badgeVariants[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
