// src/components/Shared/InfoCard.tsx
import React, { ReactNode } from 'react';

export interface InfoCardProps {
  id?: string;
  title?: string;
  icon?: ReactNode;
  variant?: 'default' | 'emerald' | 'amber' | 'blue' | 'purple' | 'slate';
  badge?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-slate-900/80 border-slate-800 text-slate-200',
  emerald: 'bg-emerald-950/20 border-emerald-800/40 text-emerald-100',
  amber: 'bg-amber-950/20 border-amber-800/40 text-amber-100',
  blue: 'bg-blue-950/20 border-blue-800/40 text-blue-100',
  purple: 'bg-purple-950/20 border-purple-800/40 text-purple-100',
  slate: 'bg-slate-900/40 border-slate-800/60 text-slate-300',
};

export const InfoCard: React.FC<InfoCardProps> = ({
  id,
  title,
  icon,
  variant = 'default',
  badge,
  action,
  children,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`rounded-xl border p-4 shadow-sm transition-colors ${variantStyles[variant]} ${className}`}
    >
      {(title || icon || badge || action) && (
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
          <div className="flex items-center gap-2">
            {icon && <span className="text-slate-400">{icon}</span>}
            {title && <h4 className="text-sm font-semibold text-white">{title}</h4>}
            {badge && (
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">
                {badge}
              </span>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
};
