// src/components/PickCompact.tsx
import React, { useState } from 'react';
import { Pick2026, BetSlipLeg } from '../types';
import { computeTimingStatus } from '../utils/timing';
import { Accordion } from './Shared/Accordion';
import { LoadingButton } from './Shared/LoadingButton';
import { useApiRequest } from '../hooks/useApiRequest';
import {
  Sparkles,
  Plus,
  Check,
  TrendingUp,
  Clock,
  ExternalLink,
  ShieldCheck,
  Store,
  HelpCircle,
  AlertCircle,
  X,
} from 'lucide-react';

export interface PickCompactProps {
  pick: Pick2026;
  isInSlip: boolean;
  onToggleSlip: (pick: Pick2026) => void;
  unitSize?: number;
  onOpenTeam?: (teamName: string) => void;
  onOpenGame?: (pick: Pick2026) => void;
}

export const PickCompact: React.FC<PickCompactProps> = ({
  pick,
  isInSlip,
  onToggleSlip,
  unitSize = 20,
  onOpenTeam,
  onOpenGame,
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // Client request hook with AbortController support
  const { call, loading: aiLoading, error: aiError, abort: abortAi } = useApiRequest();

  // Dynamic timing status
  const timing = computeTimingStatus({
    kickoffUtc: pick.date,
    recommendedUrgency: pick.timing?.urgency === 'IMMEDIATE LOCK' ? 'LOCKED_NOW' : undefined,
    marketLiquid: true,
  });

  const handleExplainWithAi = async () => {
    setShowAiModal(true);
    if (aiAnalysis) return; // already loaded and cached in local component state

    try {
      const payload = {
        matchData: {
          id: pick.id,
          favorite: pick.favorite,
          underdog: pick.underdog,
          week: pick.week,
          marketSpread: pick.marketSpread,
          projectedSpread: pick.feiProjMargin,
          edgePts: pick.spreadEdgeAbs,
          edgeTier: pick.alphaTierTag,
          recommendedBetSide: pick.recommendedBetText,
          confidenceGrade: pick.confidenceGrade,
          winProbPct: Math.round(pick.feiWinProb * 100),
          kellyUnits: pick.units,
          bestBook: pick.bestBook?.bookName || 'DraftKings',
          oddsAmerican: pick.bestBook?.odds || -110,
        },
      };

      const res = await call('/api/ai/game-breakdown', payload);
      if (res?.data?.analysis) {
        setAiAnalysis(res.data.analysis);
      }
    } catch (err) {
      console.warn('AI Breakdown call error:', err);
    }
  };

  const confidenceBadgeStyles = {
    'A+': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    A: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    'B+': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    B: 'bg-slate-700/60 text-slate-300 border-slate-600/40',
  };

  return (
    <div
      id={`pick-card-${pick.id}`}
      className={`rounded-xl border transition-all duration-200 ${
        isInSlip
          ? 'border-emerald-500/40 bg-slate-900/90 shadow-md ring-1 ring-emerald-500/30'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
      }`}
    >
      {/* Primary Card Body */}
      <div className="p-4 sm:p-5">
        {/* Top Meta: Week, Timing Badge, Grade, Settlement */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {pick.week}
            </span>
            <span className="text-slate-600">•</span>
            {pick.isSettled ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                  pick.actualResult === 'WON'
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                    : pick.actualResult === 'LOST'
                    ? 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                    : 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                }`}
              >
                <span>{pick.actualResult === 'WON' ? '✓ SETTLED: WON' : pick.actualResult === 'LOST' ? '✗ SETTLED: LOST' : '– SETTLED: PUSH'}</span>
                {pick.finalScore && <span className="opacity-80 font-normal">({pick.finalScore})</span>}
              </span>
            ) : (
              /* Dynamic Timing Badge */
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${timing.colorClass}`}
                title={timing.helperText}
              >
                <Clock className="h-3 w-3" />
                {timing.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold border ${
                confidenceBadgeStyles[pick.confidenceGrade] || confidenceBadgeStyles.A
              }`}
            >
              Grade {pick.confidenceGrade}
            </span>
            <span className="text-xs text-slate-400">{pick.alphaTierTag}</span>
          </div>
        </div>

        {/* Matchup Header & Key Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {onOpenTeam ? (
                <button
                  type="button"
                  onClick={() => onOpenTeam(pick.favorite)}
                  className="text-base font-bold text-white tracking-tight hover:text-emerald-400 hover:underline transition-colors text-left"
                  title={`View ${pick.favorite} Team Profile & Records`}
                >
                  {pick.favorite}
                </button>
              ) : (
                <span className="text-base font-bold text-white tracking-tight">
                  {pick.favorite}
                </span>
              )}
              <span className="text-slate-500 font-normal">vs</span>
              {onOpenTeam ? (
                <button
                  type="button"
                  onClick={() => onOpenTeam(pick.underdog)}
                  className="text-base font-bold text-white tracking-tight hover:text-emerald-400 hover:underline transition-colors text-left"
                  title={`View ${pick.underdog} Team Profile & Records`}
                >
                  {pick.underdog}
                </button>
              ) : (
                <span className="text-base font-bold text-white tracking-tight">
                  {pick.underdog}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs flex-wrap">
              <span className="text-emerald-400 font-semibold">
                +{pick.spreadEdgeAbs.toFixed(1)} pt Math Edge
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">
                EV: <strong className="text-emerald-300">+{pick.expectedValue.toFixed(1)}%</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                Kelly: <strong>{pick.units}u</strong> (${Math.round(pick.units * unitSize)})
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenGame && (
              <button
                type="button"
                onClick={() => onOpenGame(pick)}
                className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors inline-flex items-center gap-1"
                title="Open Comprehensive Game Analytics"
              >
                <span>Game Details</span>
              </button>
            )}

            <LoadingButton
              onClick={() => onToggleSlip(pick)}
              variant={isInSlip ? 'secondary' : 'primary'}
              size="md"
              icon={isInSlip ? <Check className="h-4 w-4 text-emerald-400" /> : <Plus className="h-4 w-4" />}
            >
              {isInSlip ? 'In Bet Slip' : 'Add to Slip'}
            </LoadingButton>
          </div>
        </div>

        {/* Recommended Bet Highlight Box */}
        <div className="mt-3.5 flex items-center justify-between gap-3 rounded-lg bg-slate-950/70 border border-slate-800/80 px-3.5 py-2.5">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Recommended Bet
            </span>
            <span className="text-sm font-bold text-emerald-300 truncate block">
              {pick.exactAction}
            </span>
          </div>

          {/* AI Explain Mini Button */}
          <button
            type="button"
            onClick={handleExplainWithAi}
            className="flex items-center gap-1.5 rounded-md bg-purple-950/30 hover:bg-purple-900/50 border border-purple-800/40 px-2.5 py-1 text-xs font-medium text-purple-300 transition-colors shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Explain Edge</span>
          </button>
        </div>

        {/* Post-Mortem Settlement Takeaway */}
        {pick.isSettled && pick.postMortemNotes && (
          <div
            className={`mt-2.5 rounded-lg p-3 text-xs border ${
              pick.actualResult === 'WON'
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                : pick.actualResult === 'LOST'
                ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              {pick.actualResult === 'WON' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
              )}
              <span>Post-Game Takeaway & Analysis</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-normal">{pick.postMortemNotes}</p>
          </div>
        )}

        {/* Details Accordion for progressive disclosure */}
        <div className="mt-3">
          <Accordion
            title="Matchup Details & Best Sportsbook Line"
            isOpen={isDetailsOpen}
            onToggle={setIsDetailsOpen}
            className="bg-transparent border-slate-800/60"
            headerClassName="py-2 text-xs text-slate-400 hover:text-slate-200"
          >
            <div className="space-y-3 pt-1 text-xs">
              {/* Detailed Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-md bg-slate-900 p-2 border border-slate-800">
                  <div className="text-slate-500">Market Spread</div>
                  <div className="font-semibold text-slate-200">
                    {pick.favorite} {pick.marketSpread > 0 ? `-${pick.marketSpread}` : pick.marketSpread}
                  </div>
                </div>
                <div className="rounded-md bg-slate-900 p-2 border border-slate-800">
                  <div className="text-slate-500">FEI Model Line</div>
                  <div className="font-semibold text-emerald-300">
                    {pick.favorite} -{pick.feiProjMargin.toFixed(1)}
                  </div>
                </div>
                <div className="rounded-md bg-slate-900 p-2 border border-slate-800">
                  <div className="text-slate-500">Win Probability</div>
                  <div className="font-semibold text-slate-200">
                    {Math.round(pick.feiWinProb * 100)}%
                  </div>
                </div>
                <div className="rounded-md bg-slate-900 p-2 border border-slate-800">
                  <div className="text-slate-500">Historical Tier ROI</div>
                  <div className="font-semibold text-emerald-400">
                    +{pick.tierHistoricalRoiPct.toFixed(1)}% ({pick.tierSampleSize} gms)
                  </div>
                </div>
              </div>

              {/* Best Sportsbook Odds Line */}
              {pick.bestBook && (
                <div className="flex items-center justify-between rounded-md bg-emerald-950/20 border border-emerald-800/30 p-2.5">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-emerald-400" />
                    <div>
                      <span className="font-semibold text-white">{pick.bestBook.bookName}: </span>
                      <span className="text-slate-300">{pick.bestBook.line} ({pick.bestBook.odds > 0 ? `+${pick.bestBook.odds}` : pick.bestBook.odds})</span>
                    </div>
                  </div>
                  {pick.bestBook.directUrl && (
                    <a
                      href={pick.bestBook.directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Bet on {pick.bestBook.bookName}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Timing Rationale */}
              {pick.timing && (
                <div className="rounded-md bg-slate-900 p-2.5 border border-slate-800 text-slate-400">
                  <strong className="text-slate-300 block mb-0.5">Execution Window:</strong>
                  {pick.timing.timingRationale}
                </div>
              )}
            </div>
          </Accordion>
        </div>
      </div>

      {/* AI Breakdown Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-white">
                  FEI Quantitative Edge Analysis: {pick.favorite} vs {pick.underdog}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  abortAi();
                  setShowAiModal(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-3 text-sm text-slate-300">
              {aiLoading && (
                <div className="py-12 text-center space-y-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-400 border-t-transparent mx-auto" />
                  <p className="text-slate-400">Calculating quantitative efficiency factors & market edge...</p>
                  <button
                    type="button"
                    onClick={abortAi}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Cancel Analysis Request
                  </button>
                </div>
              )}

              {aiError && (
                <div className="rounded-lg bg-rose-950/30 border border-rose-800/50 p-3 text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">AI Analysis Notice</strong>
                    <span className="text-xs">{aiError}</span>
                  </div>
                </div>
              )}

              {aiAnalysis && (
                <div className="rounded-lg bg-slate-950/80 p-4 border border-slate-800 whitespace-pre-line leading-relaxed text-xs sm:text-sm font-sans">
                  {aiAnalysis}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
