// src/context/LiveOddsContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Pick2026, ModelHyperparameters } from '../types';
import { picks2026Data, getPicks2026WithParams } from '../data/picks2026Data';
import {
  fetchLiveOddsFeed,
  mergeLiveOddsWithPicks,
  ParsedLiveGame,
  LiveOddsMeta,
} from '../services/liveOddsService';

interface LiveOddsContextValue {
  isLive: boolean;
  isLoading: boolean;
  lastRefreshed: Date | null;
  quotaRemaining: number | null;
  quotaUsed: number | null;
  totalLiveGames: number;
  sourceName: string;
  error: string | null;
  refreshOdds: (force?: boolean) => Promise<void>;
  liveGames: ParsedLiveGame[];
  getPicks: (hyperparameters?: ModelHyperparameters) => Pick2026[];
}

const LiveOddsContext = createContext<LiveOddsContextValue | null>(null);

export const LiveOddsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [liveGames, setLiveGames] = useState<ParsedLiveGame[]>([]);
  const [meta, setMeta] = useState<LiveOddsMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshOdds = useCallback(async (force: boolean = true) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLiveOddsFeed(force);
      setLiveGames(data.games);
      setMeta(data.meta);
      setLastRefreshed(new Date(data.meta.timestamp));
    } catch (err: any) {
      console.error('Failed to load live odds feed:', err);
      setError(err?.message || 'Failed to connect to The Odds API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    refreshOdds(false);
  }, [refreshOdds]);

  const getPicks = useCallback(
    (hyperparameters?: ModelHyperparameters): Pick2026[] => {
      const base = hyperparameters ? getPicks2026WithParams(hyperparameters) : picks2026Data;
      if (liveGames.length === 0) {
        return base;
      }
      return mergeLiveOddsWithPicks(base, liveGames, hyperparameters);
    },
    [liveGames]
  );

  const contextValue = useMemo<LiveOddsContextValue>(
    () => ({
      isLive: liveGames.length > 0,
      isLoading,
      lastRefreshed,
      quotaRemaining: meta?.quota.requestsRemaining ?? null,
      quotaUsed: meta?.quota.requestsUsed ?? null,
      totalLiveGames: liveGames.length,
      sourceName: meta?.source || 'The Odds API',
      error,
      refreshOdds,
      liveGames,
      getPicks,
    }),
    [liveGames, isLoading, lastRefreshed, meta, error, refreshOdds, getPicks]
  );

  return <LiveOddsContext.Provider value={contextValue}>{children}</LiveOddsContext.Provider>;
};

export function useLiveOdds(): LiveOddsContextValue {
  const context = useContext(LiveOddsContext);
  if (!context) {
    throw new Error('useLiveOdds must be used within a LiveOddsProvider');
  }
  return context;
}
