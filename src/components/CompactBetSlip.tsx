// src/components/CompactBetSlip.tsx
import React, { useState } from 'react';
import { BetSlipLeg, UserLoggedBet } from '../types';
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Receipt,
  Sparkles,
  ExternalLink,
  Plus,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { LoadingButton } from './Shared/LoadingButton';
import { americanToDecimal } from '../utils/bettingAnalytics';

export interface CompactBetSlipProps {
  legs: BetSlipLeg[];
  onRemoveLeg: (id: string) => void;
  onClearSlip: () => void;
  onLogBetsToLedger?: (bets: UserLoggedBet[]) => void;
  unitSize?: number;
  onNavigateToLedger?: () => void;
  onOpenTeam?: (teamName: string) => void;
}

export const CompactBetSlip: React.FC<CompactBetSlipProps> = ({
  legs,
  onRemoveLeg,
  onClearSlip,
  onLogBetsToLedger,
  unitSize = 20,
  onNavigateToLedger,
  onOpenTeam,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [betMode, setBetMode] = useState<'straight' | 'parlay'>('straight');
  const [customStake, setCustomStake] = useState<number>(unitSize);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Keep stake synced if unit size updates and customStake equals old default
  React.useEffect(() => {
    if (customStake === 20 && unitSize !== 20) {
      setCustomStake(unitSize);
    }
  }, [unitSize]);

  const totalLegs = legs.length;

  // Straight total calculations
  const totalStraightStake = legs.reduce((acc, leg) => acc + (leg.stakeDollars || customStake), 0);
  const avgEdge = totalLegs > 0 ? legs.reduce((acc, l) => acc + l.modelEdge, 0) / totalLegs : 0;
  const avgEv = totalLegs > 0 ? legs.reduce((acc, l) => acc + l.ev, 0) / totalLegs : 0;

  // Parlay calculation
  const parlayMultiplier = legs.reduce((acc, leg) => acc * americanToDecimal(leg.odds), 1);
  const parlayPotentialPayout = customStake * (parlayMultiplier - 1);

  const handleLogToLedger = () => {
    if (!onLogBetsToLedger || totalLegs === 0) return;

    if (betMode === 'straight') {
      const newBets: UserLoggedBet[] = legs.map((leg) => {
        const stake = leg.stakeDollars || customStake;
        const decMultiplier = americanToDecimal(leg.odds);
        const payout = stake * (decMultiplier - 1);
        return {
          id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: new Date().toISOString(),
          week: 'Week 0',
          ticketType: 'straight',
          selection: leg.selection,
          matchup: leg.matchup,
          bookName: leg.bestBookName || 'DraftKings',
          line: leg.line,
          oddsAmerican: leg.odds,
          stakeDollars: stake,
          stakeUnits: Number((stake / unitSize).toFixed(2)),
          potentialPayoutDollars: payout,
          timingStatus: 'LOCKED_NOW',
          resultStatus: 'PENDING',
          notes: `Alpha Edge: +${leg.modelEdge.toFixed(1)} pts | Model EV: +${leg.ev.toFixed(1)}%`,
          gameIds: [leg.gameId],
        };
      });
      onLogBetsToLedger(newBets);
    } else {
      const parlayAmerican =
        parlayMultiplier >= 2.0
          ? Math.round((parlayMultiplier - 1) * 100)
          : Math.round(-100 / (parlayMultiplier - 1));

      const newParlay: UserLoggedBet = {
        id: `parlay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        week: 'Week 0',
        ticketType: 'parlay',
        selection: `${totalLegs}-Leg Parlay: ` + legs.map((l) => l.selection).join(' & '),
        matchup: legs.map((l) => l.matchup.split(' vs ')[0]).join(' / '),
        bookName: legs[0]?.bestBookName || 'DraftKings',
        line: 'Parlay',
        oddsAmerican: parlayAmerican,
        stakeDollars: customStake,
        stakeUnits: Number((customStake / unitSize).toFixed(2)),
        potentialPayoutDollars: parlayPotentialPayout,
        timingStatus: 'LOCKED_NOW',
        resultStatus: 'PENDING',
        notes: `Combined Edge Parlay (${totalLegs} legs)`,
        gameIds: legs.map((l) => l.gameId),
      };
      onLogBetsToLedger([newParlay]);
    }

    setSuccessMessage(`Logged ${totalLegs} selection${totalLegs > 1 ? 's' : ''} to Ledger!`);
    setTimeout(() => {
      setSuccessMessage(null);
      onClearSlip();
    }, 1800);
  };

  return (
    <div
      id="compact-bet-slip"
      className="rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl backdrop-blur-md transition-all overflow-hidden"
    >
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 cursor-pointer hover:bg-slate-950 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">Execution Slip</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                {totalLegs}
              </span>
            </div>
            {!isExpanded && totalLegs > 0 && (
              <span className="text-xs text-slate-400">
                ${totalStraightStake} total stake • +{avgEv.toFixed(1)}% EV
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalLegs > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearSlip();
              }}
              className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded transition-colors"
              title="Clear all"
            >
              Clear
            </button>
          )}
          <div className="text-slate-400">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {totalLegs === 0 ? (
            <div className="text-center py-8 px-2 space-y-2">
              <Receipt className="h-8 w-8 mx-auto text-slate-600" />
              <p className="text-sm font-medium text-slate-300">Your bet slip is empty</p>
              <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                Click "+ Add to Slip" on any game to assemble straight bets or multi-leg parlays.
              </p>
            </div>
          ) : (
            <>
              {/* Bet Mode Selector */}
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setBetMode('straight')}
                  className={`py-1.5 rounded font-medium transition-all ${
                    betMode === 'straight'
                      ? 'bg-slate-800 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Straight ({totalLegs})
                </button>
                <button
                  type="button"
                  onClick={() => setBetMode('parlay')}
                  disabled={totalLegs < 2}
                  className={`py-1.5 rounded font-medium transition-all ${
                    betMode === 'parlay'
                      ? 'bg-slate-800 text-white shadow-xs font-semibold'
                      : totalLegs < 2
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Parlay ({parlayMultiplier >= 2 ? `+${Math.round((parlayMultiplier - 1) * 100)}` : 'N/A'})
                </button>
              </div>

              {/* Legs List */}
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {legs.map((leg) => (
                  <div
                    key={leg.id}
                    className="relative rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5 transition-all hover:border-slate-700 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] text-slate-400 truncate">{leg.matchup}</div>
                        <div className="font-bold text-white mt-0.5">{leg.selection}</div>
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          <span className="text-emerald-400 font-medium">
                            +{leg.modelEdge.toFixed(1)} pt edge
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-300">
                            {leg.odds > 0 ? `+${leg.odds}` : leg.odds}
                          </span>
                          {leg.bestBookName && (
                            <span className="rounded bg-slate-800 px-1 py-0.2 text-[10px] text-slate-300 font-medium">
                              {leg.bestBookName}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveLeg(leg.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Remove leg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Metrics Summary */}
              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Strategy Mode</span>
                  <span className="text-slate-200 font-medium capitalize">{betMode}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Average Alpha Edge</span>
                  <span className="text-emerald-400 font-semibold">+{avgEdge.toFixed(1)} pts</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Expected Value (EV)</span>
                  <span className="text-emerald-400 font-semibold">+{avgEv.toFixed(1)}%</span>
                </div>
                {betMode === 'parlay' && (
                  <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                    <span>Est. Payout (${customStake} stake)</span>
                    <span className="text-emerald-300 font-bold">
                      +${parlayPotentialPayout.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Stake input */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <label htmlFor="slip-stake-input" className="text-slate-400 font-medium">
                  {betMode === 'straight' ? 'Stake Per Ticket' : 'Parlay Total Stake'}:
                </label>
                <div className="relative w-28">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    id="slip-stake-input"
                    type="number"
                    min="1"
                    step="5"
                    value={customStake}
                    onChange={(e) => setCustomStake(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 pl-6 pr-2 py-1 text-right text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Success Notification */}
              {successMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <LoadingButton
                  onClick={handleLogToLedger}
                  variant="primary"
                  size="md"
                  icon={<Receipt className="h-4 w-4" />}
                  className="w-full"
                >
                  Log to Ledger & Save
                </LoadingButton>

                {onNavigateToLedger && (
                  <button
                    type="button"
                    onClick={onNavigateToLedger}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
                  >
                    View Bet Ledger Portfolio →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
