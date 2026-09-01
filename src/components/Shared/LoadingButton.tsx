// src/components/Shared/LoadingButton.tsx
import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  id?: string;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantStyles = {
  primary:
    'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-sm focus-visible:ring-emerald-400 disabled:bg-emerald-500/50 disabled:text-slate-900',
  secondary:
    'bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium focus-visible:ring-slate-400 disabled:bg-slate-800/50 disabled:text-slate-400',
  outline:
    'border border-slate-700 hover:border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800/50 focus-visible:ring-slate-400 disabled:opacity-50',
  danger:
    'bg-rose-600 hover:bg-rose-500 text-white font-medium focus-visible:ring-rose-400 disabled:bg-rose-600/50',
  ghost:
    'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white focus-visible:ring-slate-400 disabled:opacity-40',
};

const sizeStyles = {
  sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-md min-h-[32px]',
  md: 'px-3.5 py-1.5 text-sm gap-2 rounded-lg min-h-[38px]',
  lg: 'px-5 py-2.5 text-base gap-2.5 rounded-lg min-h-[44px]',
};

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  id,
  loading = false,
  loadingText,
  icon,
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      id={id}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 cursor-pointer disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-current" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon && <span className="text-current">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
