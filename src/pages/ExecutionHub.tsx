// src/pages/ExecutionHub.tsx
import React, { useState, useMemo } from 'react';
import {
  Pick2026,
  BetSlipLeg,
  CuratedParlayPick,
  CuratedTeaserPick,
  ModelHyperparameters,
  UserLoggedBet,
} from '../types';
import { picks2026Data, getPicks2026WithParams } from '../data/picks2026Data';
import { curatedParlays2026, curatedTeasers2026 } from '../data/curatedBetsData';
import { findClosestWeekToDate } from '../utils/weekPicker';
import { useLiveOdds } from '../context/LiveOddsContext';
import { LiveOddsRefreshControl } from '../components/LiveOddsRefreshControl';
import { PickCompact } from '../components/PickCompact';
import { InfoCard } from '../components/Shared/InfoCard';
import { Accordion } from '../components/Shared/Accordion';
import { LoadingButton } from '../components/Shared/LoadingButton';
import {
  Filter,
  Search,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  Flame,
  Layers,
  ChevronRight,
  Info,
  Clock,
  Plus,
  Check,
} from 'lucide-react';

export interface ExecutionHubProps {
  hyperparameters?: ModelHyperparameters;
  slipLegs: BetSlipLeg[];
  onToggleSlipLeg: (pick: Pick2026) => void;
  onAddParlayToSlip?: (parlay: CuratedParlayPick) => void;
  onAddTeaserToSlip?: (teaser: CuratedTeaserPick) => void;
  unitSize: number;
  bankrollUnits?: number;
  onSetBankrollUnits?: (val: number) => void;
  onOpenTeam?: (teamName: string) => void;
  onOpenGame?: (pick: Pick2026) => void;
}

export const ExecutionHub: React.FC<ExecutionHubProps> = ({
  hyperparameters,
  slipLegs,
  onToggleSlipLeg,
  onAddParlayToSlip,
  onAddTeaserToSlip,
  unitSize,
  bankrollUnits = 100,
  onSetBankrollUnits,
  onOpenTeam,
  onOpenGame,
}) => {
  const { getPicks, isLive, refreshOdds, isLoading, lastRefreshed, totalLiveGames } = useLiveOdds();

  const [activeCategory, setActiveCategory] = useState<'straight' | 'parlays' | 'teasers'>('straight');
  const defaultWeek = useMemo(() => findClosestWeekToDate(picks2026Data, new Date()), []);
  const [selectedWeek, setSelectedWeek] = useState<string>(defaultWeek || 'Week 0');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModelRationale, setShowModelRationale] = useState<boolean>(false);

  // Compute active picks dynamically merged with Live The Odds API feeds
  const picks: Pick2026[] = useMemo(() => {
    return getPicks(hyperparameters);
  }, [getPicks, hyperparameters]);

  // Slip lookup map for O(1) membership check
  const slipGameIds = useMemo(() => {
    return new Set(slipLegs.map((l) => l.gameId));
  }, [slipLegs]);

  // Filtered straight picks
  const filteredPicks = useMemo(() => {
    return picks.filter((pick) => {
      if (selectedWeek !== 'All' && pick.week !== selectedWeek) return false;
      if (selectedGrade !== 'All' && pick.confidenceGrade !== selectedGrade) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle =
          pick.favorite.toLowerCase().includes(q) ||
          pick.underdog.toLowerCase().includes(q) ||
          pick.recommendedBetText.toLowerCase().includes(q);
        if (!matchTitle) return false;
      }
      return true;
    });
  }, [picks, selectedWeek, selectedGrade, searchQuery]);

  // Curated Parlays filtered by week
  const filteredParlays = useMemo(() => {
    return curatedParlays2026.filter((p) => {
      if (selectedWeek !== 'All' && p.week !== selectedWeek) return false;
      return true;
    });
  }, [selectedWeek]);

  // Curated Teasers filtered by week
  const filteredTeasers = useMemo(() => {
    return curatedTeasers2026.filter((t) => {
      if (selectedWeek !== 'All' && t.week !== selectedWeek) return false;
      return true;
    });
  }, [selectedWeek]);

  const uniqueWeeks = useMemo(() => {
    const set = new Set(picks.map((p) => p.week));
    return ['All', ...Array.from(set)];
  }, [picks]);

  return (
    <div id="execution-hub" className="space-y-6">
      {/* Top Welcome / Header Card */}
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                2026 Model Execution Hub
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Top positive EV selections sized via Quarter-Kelly and backed by 4,800+ historical game backtests.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModelRationale(!showModelRationale)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors self-start sm:self-auto"
          >
            <Info className="h-4 w-4 text-emerald-400" />
            <span>{showModelRationale ? 'Hide Core Rules' : 'Model Principles'}</span>
          </button>
        </div>

        {/* Collapsible Model Principles Card */}
        {showModelRationale && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/60">
              <strong className="text-emerald-400 font-semibold block mb-1">Spread Discrepancy (FEI)</strong>
              Identifies value where market lines differ by ≥3.0 points from Fremeau possession efficiency projections.
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/60">
              <strong className="text-blue-400 font-semibold block mb-1">Variance-Shielded Sizing</strong>
              Uses Quarter-Kelly unit allocation (1.0u to 2.5u) to protect your bankroll while compounding long-term growth.
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/60">
              <strong className="text-purple-400 font-semibold block mb-1">Timing Intelligence</strong>
              Monitors dynamic steam vs public late money to recommend locking lines early or waiting for gameday liquidity.
            </div>
          </div>
        )}
      </div>

      {/* Real-time Odds Sync & Manual Refresh Dashboard Banner */}
      <LiveOddsRefreshControl />

      {/* Category Tabs: Straight Picks, Parlays, Teasers */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('straight')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition-all ${
              activeCategory === 'straight'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Straight Picks ({filteredPicks.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('parlays')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition-all ${
              activeCategory === 'parlays'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Curated Parlays ({filteredParlays.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('teasers')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition-all ${
              activeCategory === 'teasers'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Wong Teasers ({filteredTeasers.length})</span>
          </button>
        </div>

        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Configurable Bankroll (25-50-75-100u) */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-2 py-1">
            <span className="text-slate-400 font-medium text-[11px]">Bankroll:</span>
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

          {/* Week Filter */}
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            {uniqueWeeks.map((w) => (
              <option key={w} value={w}>
                {w === 'All' ? 'All Weeks' : w}
              </option>
            ))}
          </select>

          {/* Grade Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="All">All Grades</option>
            <option value="A+">Grade A+ (Elite)</option>
            <option value="A">Grade A (High EV)</option>
            <option value="B+">Grade B+ (Value)</option>
          </select>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 sm:w-44 rounded-lg border border-slate-800 bg-slate-900 pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Category Display */}
      {activeCategory === 'straight' && (
        <div className="space-y-4">
          {/* Week 0 Official Settlement & Debrief Banner */}
          {selectedWeek === 'Week 0' && (
            <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-4 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-blue-400" />
                  <span className="font-bold text-blue-200">
                    Week 0 Official Results & Post-Game Debrief
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedWeek('Week 1')}
                  className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
                >
                  <span>View Week 1 Slate (Labor Day)</span>
                  <span>→</span>
                </button>
              </div>
              <p className="mt-2 text-slate-300 leading-relaxed">
                <strong>Week 0 Highlights:</strong>{' '}
                <button
                  type="button"
                  onClick={() => onOpenTeam && onOpenTeam('Memphis')}
                  className="text-emerald-400 hover:underline font-semibold inline"
                >
                  Memphis
                </button>{' '}
                road outright upset (+6.0 model edge) and{' '}
                <button
                  type="button"
                  onClick={() => onOpenTeam && onOpenTeam('Stanford')}
                  className="text-emerald-400 hover:underline font-semibold inline"
                >
                  Stanford
                </button>{' '}
                -4.0 cashed cleanly.{' '}
                <button
                  type="button"
                  onClick={() => onOpenTeam && onOpenTeam('TCU')}
                  className="text-rose-400 hover:underline font-semibold inline"
                >
                  TCU
                </button>{' '}
                struggled in heavy Dublin coastal wind/rain and 3 turnovers (lost 10-15 vs{' '}
                <button
                  type="button"
                  onClick={() => onOpenTeam && onOpenTeam('North Carolina')}
                  className="text-blue-300 hover:underline font-semibold inline"
                >
                  UNC
                </button>
                ), while{' '}
                <button
                  type="button"
                  onClick={() => onOpenTeam && onOpenTeam('North Dakota State')}
                  className="text-rose-400 hover:underline font-semibold inline"
                >
                  NDSU
                </button>
                ’s suffocating defense held{' '}
                <button
                  type="button"
                  onClick={() => onOpenTeam && onOpenTeam('Jacksonville State')}
                  className="text-blue-300 hover:underline font-semibold inline"
                >
                  Jax State
                </button>{' '}
                to 7 points in an FCS/FBS rout (Total 40 vs 54.5 Over).{' '}
                <button
                  type="button"
                  onClick={() => onOpenTeam && onOpenTeam('Florida State')}
                  className="text-emerald-400 hover:underline font-semibold inline"
                >
                  Florida State
                </button>{' '}
                missed the -31.5 cover by just 0.5 pt on late kneel downs (41-10).
              </p>
            </div>
          )}

          {filteredPicks.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-10 text-center text-slate-400">
              <p className="text-sm font-medium">No picks matched your current filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedWeek('All');
                  setSelectedGrade('All');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs text-emerald-400 hover:underline"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPicks.map((pick) => (
                <PickCompact
                  key={pick.id}
                  pick={pick}
                  isInSlip={slipGameIds.has(pick.id)}
                  onToggleSlip={onToggleSlipLeg}
                  unitSize={unitSize}
                  onOpenTeam={onOpenTeam}
                  onOpenGame={onOpenGame}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Curated Parlays Display */}
      {activeCategory === 'parlays' && (
        <div className="space-y-4">
          {filteredParlays.map((parlay) => (
            <div
              key={parlay.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 transition-all hover:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                      {parlay.grade} Grade
                    </span>
                    <span className="text-xs font-bold text-white">{parlay.title}</span>
                    <span className="text-xs text-slate-400">({parlay.week})</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="text-emerald-400 font-semibold">
                      Odds: {parlay.payoutOddsAmerican > 0 ? `+${parlay.payoutOddsAmerican}` : parlay.payoutOddsAmerican}
                    </span>
                    <span>•</span>
                    <span>EV: <strong className="text-emerald-300">+{parlay.expectedValue}</strong></span>
                    <span>•</span>
                    <span>Suggested: {parlay.suggestedUnit}u</span>
                  </div>
                </div>

                {onAddParlayToSlip && (
                  <LoadingButton
                    onClick={() => onAddParlayToSlip(parlay)}
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Add {parlay.legsCount} Legs to Slip
                  </LoadingButton>
                )}
              </div>

              {/* Legs Summary */}
              <div className="space-y-1.5 rounded-lg bg-slate-950/70 p-3 border border-slate-800/80 text-xs">
                {parlay.legs.map((leg, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300">
                    <div>
                      <span className="font-semibold text-white">{leg.selection}</span>
                      <span className="text-slate-500 ml-2">({leg.matchup})</span>
                    </div>
                    <span className="text-emerald-400 font-medium">+{leg.modelEdge.toFixed(1)} pt edge</span>
                  </div>
                ))}
              </div>

              <p className="mt-2.5 text-xs text-slate-400 italic">{parlay.rationale}</p>
            </div>
          ))}
        </div>
      )}

      {/* Wong Teasers Display */}
      {activeCategory === 'teasers' && (
        <div className="space-y-4">
          {filteredTeasers.map((teaser) => (
            <div
              key={teaser.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 transition-all hover:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-xs font-bold text-purple-300">
                      {teaser.teaserPoints}-Pt Teaser
                    </span>
                    <span className="text-xs font-bold text-white">{teaser.title}</span>
                    <span className="text-xs text-slate-400">({teaser.week})</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="text-purple-400 font-semibold">
                      Odds: {teaser.payoutOddsAmerican > 0 ? `+${teaser.payoutOddsAmerican}` : teaser.payoutOddsAmerican}
                    </span>
                    <span>•</span>
                    <span>Historical Cover: <strong className="text-emerald-300">{teaser.teaserCoverWinRatePct}%</strong></span>
                    <span>•</span>
                    <span>EV: <strong className="text-emerald-300">+{teaser.expectedValue}</strong></span>
                  </div>
                </div>

                {onAddTeaserToSlip && (
                  <LoadingButton
                    onClick={() => onAddTeaserToSlip(teaser)}
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Add {teaser.legsCount} Legs to Slip
                  </LoadingButton>
                )}
              </div>

              {/* Teaser Legs */}
              <div className="space-y-1.5 rounded-lg bg-slate-950/70 p-3 border border-slate-800/80 text-xs">
                {teaser.legs.map((leg, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300">
                    <div>
                      <span className="font-semibold text-white">{leg.teasedLine}</span>
                      <span className="text-slate-500 ml-2">
                        (was {leg.originalLine} in {leg.matchup})
                      </span>
                    </div>
                    <span className="text-purple-300 font-medium">{leg.keyNumbersCrossed}</span>
                  </div>
                ))}
              </div>

              <p className="mt-2.5 text-xs text-slate-400 italic">{teaser.rationale}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
