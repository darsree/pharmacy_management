import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost' | 'ai';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-medium gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-sm font-medium gap-2 rounded-lg',
    lg: 'px-5 py-2.5 text-base font-medium gap-2.5 rounded-xl'
  }[size];

  const variantClasses = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-500/10 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus:ring-2 focus:ring-slate-400 focus:ring-offset-1',
    outline:
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-500/10 focus:ring-2 focus:ring-rose-500 focus:ring-offset-1',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-500/10 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
    ai:
      'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-indigo-500/15 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : variant === 'ai' && !icon ? (
        <Sparkles className="w-4 h-4 text-indigo-200" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
