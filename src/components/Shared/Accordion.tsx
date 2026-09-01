// src/components/Shared/Accordion.tsx
import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface AccordionProps {
  id?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  id,
  title,
  subtitle,
  badge,
  children,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  className = '',
  headerClassName = '',
  bodyClassName = '',
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalOpen;

  const handleToggle = () => {
    const next = !open;
    if (!isControlled) {
      setInternalOpen(next);
    }
    onToggle?.(next);
  };

  return (
    <div
      id={id}
      className={`overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60 transition-colors ${className}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${headerClassName}`}
        aria-expanded={open}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-slate-200 truncate">{title}</div>
              {badge}
            </div>
            {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
          </div>
        </div>
        <div className="flex items-center text-slate-400">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {open && (
        <div
          className={`border-t border-slate-800/80 px-4 py-3.5 text-sm text-slate-300 bg-slate-950/40 ${bodyClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
