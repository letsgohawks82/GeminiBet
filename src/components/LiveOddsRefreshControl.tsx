// src/components/LiveOddsRefreshControl.tsx
import React, { useState, useEffect } from 'react';
import { useLiveOdds } from '../context/LiveOddsContext';
import { RefreshCw, Radio, Check, AlertCircle, Database, Zap } from 'lucide-react';

interface LiveOddsRefreshControlProps {
  compact?: boolean;
  className?: string;
}

export const LiveOddsRefreshControl: React.FC<LiveOddsRefreshControlProps> = ({
  compact = false,
  className = '',
}) => {
  const {
    isLive,
    isLoading,
    lastRefreshed,
    quotaRemaining,
    totalLiveGames,
    error,
    refreshOdds,
  } = useLiveOdds();

  const [timeAgo, setTimeAgo] = useState<string>('just now');

  useEffect(() => {
    const update = () => {
      if (!lastRefreshed) {
        setTimeAgo('never');
        return;
      }
      const diffSec = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);
      if (diffSec < 15) {
        setTimeAgo('just now');
      } else if (diffSec < 60) {
        setTimeAgo(`${diffSec}s ago`);
      } else if (diffSec < 3600) {
        setTimeAgo(`${Math.floor(diffSec / 60)}m ago`);
      } else {
        setTimeAgo(`${Math.floor(diffSec / 3600)}h ago`);
      }
    };

    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [lastRefreshed]);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => refreshOdds(true)}
          disabled={isLoading}
          title={isLive ? `Live NCAAF Odds synced ${timeAgo}. Click to refresh.` : 'Click to fetch live odds'}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
            isLoading
              ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 cursor-wait'
              : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isLoading ? 'Syncing...' : 'Refresh Odds'}
          </span>
          <span className="sm:hidden">
            {isLoading ? '...' : 'Sync'}
          </span>
        </button>

        <div className="hidden lg:flex items-center gap-1.5 rounded-md bg-slate-900/80 px-2 py-1 border border-slate-800 text-[11px] text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{isLive ? `${totalLiveGames} Live Odds (${timeAgo})` : 'Offline Odds'}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900/95 via-slate-900 to-slate-950 p-3 sm:p-4 shadow-md ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Radio className={`h-4 w-4 ${isLive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                The Odds API Feed
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isLive
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isLive ? `Live (${totalLiveGames} Games)` : 'Connecting...'}
              </span>
              {quotaRemaining !== null && (
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-400">
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span>{quotaRemaining} API calls left</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real-time multi-book consensus (DraftKings, FanDuel, BetRivers, etc.) synced {timeAgo}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => refreshOdds(true)}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm ${
              isLoading
                ? 'bg-emerald-600/60 text-slate-950 cursor-wait'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:shadow-emerald-500/20 active:scale-95'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing Live Odds...' : 'Refresh Odds & Spreads'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-950/40 border border-red-800/60 p-2 text-xs text-red-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
          <span>{error} (Using cached odds)</span>
        </div>
      )}
    </div>
  );
};
