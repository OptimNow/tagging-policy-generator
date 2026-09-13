import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // 'unstyled' keeps layout, size and focus styles but sets no colours, so the
  // caller's className controls them. Use it instead of overriding another
  // variant's colours: Tailwind picks between conflicting utilities by
  // stylesheet order, not by the order of classes, so an override can lose.
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'unstyled';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-charcoal focus:ring-chartreuse font-medium disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-chartreuse text-charcoal hover:bg-chartreuse-hover",
    secondary: "bg-white text-charcoal hover:bg-gray-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-white/10",
    unstyled: ""
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
