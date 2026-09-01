// src/components/Layout.tsx
import React, { ReactNode } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  BookOpen,
  Receipt,
  Cpu,
  Coins,
  Sparkles,
  Layers,
  ChevronRight,
  Search,
} from 'lucide-react';
import { LiveOddsRefreshControl } from './LiveOddsRefreshControl';

export interface LayoutProps {
  children: ReactNode;
  rightRail?: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  unitSize: number;
  onSetUnitSize: (val: number) => void;
  bankrollUnits?: number;
  onSetBankrollUnits?: (val: number) => void;
  onOpenGuide: () => void;
  onOpenSearch?: () => void;
  slipCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  rightRail,
  activeTab,
  onTabChange,
  unitSize,
  onSetUnitSize,
  bankrollUnits = 100,
  onSetBankrollUnits,
  onOpenGuide,
  onOpenSearch,
  slipCount = 0,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans antialiased">
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20">
                <TrendingUp className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-white font-mono">
                    CFBD TERMINAL
                  </span>
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Gate: Locked
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  College Football Quantitative Pricing Terminal & Calibration Gate
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => onTabChange('optimizer')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  activeTab === 'optimizer'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Pricing & Calibration
              </button>
              <button
                type="button"
                onClick={() => onTabChange('winTotalPool')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'winTotalPool'
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span>Win Total Pool</span>
                <span className="rounded bg-amber-500/20 text-amber-300 px-1 py-0.2 text-[9px] font-mono font-bold">
                  45W
                </span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('betLedger')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  activeTab === 'betLedger'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Bet Ledger
              </button>
              <button
                type="button"
                onClick={() => onTabChange('backtest')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  activeTab === 'backtest'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Research & Backtest
              </button>
              <button
                type="button"
                onClick={() => onTabChange('retrain')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  activeTab === 'retrain'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Model Tuning
              </button>
            </nav>

            {/* Global Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Team / Game Search Bar */}
              {onOpenSearch && (
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:border-emerald-500/50 hover:text-slate-200 transition-colors shadow-xs"
                >
                  <Search className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Search team or game...</span>
                  <span className="sm:hidden font-medium">Search</span>
                  <kbd className="hidden sm:inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                    ⌘K
                  </kbd>
                </button>
              )}

              {/* Real-time Odds Sync Control */}
              <LiveOddsRefreshControl compact />

              {/* Configurable Bankroll (25-50-75-100u) */}
              <div className="hidden sm:flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs">
                <span className="text-slate-400 font-medium text-[11px] hidden md:inline">Bankroll:</span>
                <div className="flex items-center gap-0.5">
                  {[25, 50, 75, 100].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => onSetBankrollUnits && onSetBankrollUnits(b)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        bankrollUnits === b
                          ? 'bg-emerald-500 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={`${b} units = $${(b * unitSize).toLocaleString()}`}
                    >
                      {b}u
                    </button>
                  ))}
                </div>
              </div>

              {/* Unit Sizing Selector */}
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs">
                <Coins className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-400 font-medium hidden sm:inline">Unit:</span>
                <select
                  value={unitSize}
                  onChange={(e) => onSetUnitSize(Number(e.target.value))}
                  className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
                >
                  <option value={10}>$10</option>
                  <option value={20}>$20</option>
                  <option value={50}>$50</option>
                  <option value={100}>$100</option>
                </select>
              </div>

              {/* Beginner Guide Button */}
              <button
                type="button"
                onClick={onOpenGuide}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
                title="Beginner Guide & Math Glossary"
              >
                <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Guide</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Sub-bar */}
          <div className="flex lg:hidden items-center justify-between overflow-x-auto py-2 border-t border-slate-800/60 gap-2 text-xs">
            <button
              type="button"
              onClick={() => onTabChange('optimizer')}
              className={`rounded-lg px-2.5 py-1 font-semibold shrink-0 transition-all ${
                activeTab === 'optimizer'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300'
              }`}
            >
              Slate Optimizer
            </button>
            <button
              type="button"
              onClick={() => onTabChange('winTotalPool')}
              className={`rounded-lg px-2.5 py-1 font-semibold shrink-0 transition-all ${
                activeTab === 'winTotalPool'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-amber-400/90'
              }`}
            >
              Win Total Pool
            </button>
            <button
              type="button"
              onClick={() => onTabChange('betLedger')}
              className={`rounded-lg px-2.5 py-1 font-semibold shrink-0 transition-all ${
                activeTab === 'betLedger'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300'
              }`}
            >
              Bet Ledger
            </button>
            <button
              type="button"
              onClick={() => onTabChange('backtest')}
              className={`rounded-lg px-2.5 py-1 font-semibold shrink-0 transition-all ${
                activeTab === 'backtest'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300'
              }`}
            >
              Research
            </button>
            <button
              type="button"
              onClick={() => onTabChange('retrain')}
              className={`rounded-lg px-2.5 py-1 font-semibold shrink-0 transition-all ${
                activeTab === 'retrain'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300'
              }`}
            >
              Tuning
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Right Rail - Optimized Screen Space */}
      <main className="flex-1 mx-auto w-full max-w-[1600px] px-3 sm:px-5 lg:px-6 py-4">
        {rightRail ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Primary Area (8 cols on large screens) */}
            <div className="lg:col-span-8 space-y-4">{children}</div>

            {/* Right Rail Slot (4 cols on large screens, sticky) */}
            <aside className="lg:col-span-4 lg:sticky lg:top-18 space-y-3.5">
              {rightRail}
            </aside>
          </div>
        ) : (
          <div className="w-full space-y-4">{children}</div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          <p>
            BCFP2 Quantitative Betting Terminal • Grounded in 4,800+ Game Fremeau Efficiency Index (FEI) Historical Backtest
          </p>
        </div>
      </footer>
    </div>
  );
};
