import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  Shield,
  Calendar,
  Clock,
  Check,
  Plus,
  AlertCircle,
  TrendingUp,
  Store,
  ChevronRight,
} from 'lucide-react';
import { Pick2026, DetailedGame } from '../types';
import { useApiRequest } from '../utils/useApiRequest';

interface GameDetailModalProps {
  game2026?: Pick2026 | null;
  gameHistorical?: DetailedGame | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTeam: (teamName: string) => void;
  onToggleSlipLeg?: (pick: Pick2026) => void;
  isInSlip?: boolean;
  unitSize?: number;
}

interface BreakdownResponse {
  analysis?: string;
  cached?: boolean;
  error?: string;
}

export const GameDetailModal: React.FC<GameDetailModalProps> = ({
  game2026,
  gameHistorical,
  isOpen,
  onClose,
  onSelectTeam,
  onToggleSlipLeg,
  isInSlip = false,
  unitSize = 20,
}) => {
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const { data, loading: aiLoading, error: aiError, execute, abort, reset } = useApiRequest<BreakdownResponse>();

  // Handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Request AI breakdown on trigger
  const handleRequestAi = () => {
    if (!game2026) return;
    setShowAiAnalysis(true);
    reset();
    execute('/api/ai/game-breakdown', {
      matchData: {
        id: game2026.id,
        favorite: game2026.favorite,
        underdog: game2026.underdog,
        week: game2026.week,
        marketSpread: game2026.marketSpread,
        projectedSpread: game2026.feiProjMargin,
        edgePts: game2026.spreadEdgeAbs,
        edgeTier: game2026.alphaTierTag,
        recommendedBetSide: game2026.recommendedBetSide,
        confidenceGrade: game2026.confidenceGrade,
        winProbPct: Math.round(game2026.feiWinProb * 100),
        kellyUnits: game2026.units,
        bestBook: game2026.bestBook?.bookName,
        oddsAmerican: game2026.bestBook?.odds,
      },
    });
  };

  if (!isOpen || (!game2026 && !gameHistorical)) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {game2026 ? game2026.week : `${gameHistorical?.year} ${gameHistorical?.week}`}
                </span>
                {game2026?.venue && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{game2026.venue}</span>
                  </>
                )}
              </div>
              <h2 id="game-detail-title" className="text-lg sm:text-xl font-black text-white tracking-tight">
                {game2026
                  ? `${game2026.favorite} vs ${game2026.underdog}`
                  : `${gameHistorical?.winner} vs ${gameHistorical?.loser}`}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close game modal"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 2026 GAME VIEW */}
          {game2026 && (
            <>
              {/* Settlement Banner if Settled */}
              {game2026.isSettled && (
                <div
                  className={`rounded-xl p-4 border text-xs sm:text-sm ${
                    game2026.actualResult === 'WON'
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : game2026.actualResult === 'LOST'
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                      : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                    <span className="font-extrabold text-sm uppercase tracking-wide">
                      {game2026.actualResult === 'WON'
                        ? '✓ Final Settlement: Bet WON'
                        : game2026.actualResult === 'LOST'
                        ? '✗ Final Settlement: Bet LOST'
                        : '– Final Settlement: PUSH'}
                    </span>
                    {game2026.finalScore && (
                      <span className="font-mono font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                        {game2026.finalScore}
                      </span>
                    )}
                  </div>
                  {game2026.postMortemNotes && (
                    <p className="text-slate-300 leading-relaxed font-normal mt-1">
                      <strong>Post-Game Debrief:</strong> {game2026.postMortemNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Matchup Team Cards with Clickable Team Profiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Favorite */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative group hover:border-slate-700 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Projected Favorite
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white">{game2026.favorite}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Consensus Line: <strong>{game2026.marketSpread > 0 ? `-${game2026.marketSpread}` : game2026.marketSpread}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTeam(game2026.favorite)}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-emerald-500/40 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>View Team</span>
                    </button>
                  </div>
                </div>

                {/* Underdog */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative group hover:border-slate-700 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Projected Underdog
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white">{game2026.underdog}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Underdog Line: <strong>{game2026.marketSpread > 0 ? `+${game2026.marketSpread}` : game2026.marketSpread}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTeam(game2026.underdog)}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-emerald-500/40 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>View Team</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quantitative FEI Model Analytics Matrix */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>FEI Quantitative Model Metrics</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                    Grade {game2026.confidenceGrade} • {game2026.alphaTierTag}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Proj Score</span>
                    <span className="font-bold text-white text-sm">{game2026.feiProjScore}</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">FEI Margin</span>
                    <span className="font-bold text-emerald-300 text-sm">{game2026.favorite} -{game2026.feiProjMargin.toFixed(1)}</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Math Spread Edge</span>
                    <span className="font-bold text-emerald-400 text-sm">+{game2026.spreadEdgeAbs.toFixed(1)} pts</span>
                  </div>

                  <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Win Probability</span>
                    <span className="font-bold text-white text-sm">{Math.round(game2026.feiWinProb * 100)}%</span>
                  </div>
                </div>

                {/* Mathematical Derivation & BCFtoys Data Source Disclosure */}
                <div className="mt-2 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] font-sans space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300 font-mono text-[10px]">
                    <span className="font-bold text-cyan-400 uppercase tracking-wide">
                      ⚡ BCFtoys FEI Mathematical Derivation:
                    </span>
                    <span className="text-slate-400">
                      Formula: (ΔFEI × Possessions) + HFA
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Derived from <strong>Brian Fremeau's FEI (bcftoys.com)</strong> baseline ratings. When single-game projection tables are pending release on bcftoys, our engine evaluates the net per-possession efficiency delta between {game2026.favorite} and {game2026.underdog}, scaled across 68 expected game possessions {game2026.isNeutral ? '(Neutral site)' : '+ 2.45 pts Home Field Advantage'}.
                  </p>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                    <span>Market Spread: <strong>{game2026.marketSpread > 0 ? `+${game2026.marketSpread}` : game2026.marketSpread}</strong></span>
                    <span>•</span>
                    <span>Model Line: <strong>-{game2026.feiProjMargin.toFixed(1)}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">Discrepancy: +{game2026.spreadEdgeAbs.toFixed(1)} pts</span>
                  </div>
                </div>
              </div>

              {/* Recommended Bet & Action Header */}
              <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                    Recommended Model Action
                  </span>
                  <div className="text-base font-black text-white">
                    {game2026.recommendedBetText}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-300 font-mono">
                    <span>EV: <strong className="text-emerald-300">+{game2026.expectedValue.toFixed(1)}%</strong></span>
                    <span>•</span>
                    <span>Kelly Size: <strong className="text-white">{game2026.units}u</strong> (${Math.round(game2026.units * unitSize)})</span>
                    <span>•</span>
                    <span>Historical ROI: <strong className="text-emerald-400">+{game2026.tierHistoricalRoiPct.toFixed(1)}%</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRequestAi}
                    className="flex items-center gap-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-800/60 px-3 py-2 text-xs font-semibold text-purple-300 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Explain Edge</span>
                  </button>

                  {onToggleSlipLeg && !game2026.isSettled && (
                    <button
                      type="button"
                      onClick={() => onToggleSlipLeg(game2026)}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                        isInSlip
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      {isInSlip ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{isInSlip ? 'In Bet Slip' : 'Add to Slip'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sportsbook Quotes Comparison */}
              {game2026.sportsbooks && game2026.sportsbooks.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-emerald-400" />
                      <span>Live Sportsbook Line Shopping</span>
                    </span>
                    {game2026.bestBook && (
                      <span className="text-[11px] font-semibold text-emerald-300">
                        Best Line: {game2026.bestBook.bookName} ({game2026.bestBook.line})
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    {game2026.sportsbooks.map((b) => (
                      <div
                        key={b.bookName}
                        className={`rounded-lg p-2.5 border text-center transition-all ${
                          b.isBest
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-[10px] font-bold block text-slate-400 truncate">
                          {b.bookName}
                        </span>
                        <span className="font-bold text-white block mt-0.5">
                          {b.spread} ({b.odds > 0 ? `+${b.odds}` : b.odds})
                        </span>
                        {b.directUrl && (
                          <a
                            href={b.directUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-400 hover:underline mt-1 inline-flex items-center gap-0.5 font-sans font-medium"
                          >
                            <span>Bet</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timing Intelligence Rationale */}
              {game2026.timing && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Market Timing Window: {game2026.timing.timingWindow}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {game2026.timing.timingRationale}
                  </p>
                  {game2026.timing.marketMovementForecast && (
                    <p className="text-slate-400 font-sans italic text-[11px] mt-1">
                      Forecast: {game2026.timing.marketMovementForecast}
                    </p>
                  )}
                </div>
              )}

              {/* AI Deep Dive Drawer / Panel */}
              {showAiAnalysis && (
                <div className="rounded-xl border border-purple-800/50 bg-slate-900/80 p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white text-xs">
                        Gemini AI Quantitative Matchup Analysis
                      </span>
                    </div>
                    <button
                      onClick={() => setShowAiAnalysis(false)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {aiLoading && (
                    <div className="py-6 text-center space-y-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-400 border-t-transparent mx-auto" />
                      <p className="text-xs text-slate-400 font-mono">
                        Analyzing FEI efficiency, trench differentials, and sharp money...
                      </p>
                    </div>
                  )}

                  {aiError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-xs text-rose-300">
                      {aiError}
                    </div>
                  )}

                  {data?.analysis && (
                    <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                      {data.analysis}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* HISTORICAL GAME VIEW */}
          {gameHistorical && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    Winner
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-white">{gameHistorical.winner}</span>
                    <button
                      type="button"
                      onClick={() => onSelectTeam(gameHistorical.winner)}
                      className="text-xs font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Team Profile</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Loser
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-white">{gameHistorical.loser}</span>
                    <button
                      type="button"
                      onClick={() => onSelectTeam(gameHistorical.loser)}
                      className="text-xs font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Team Profile</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Historical Result Summary */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-sans font-bold text-white text-sm">Archived Game Results</span>
                  <span className="font-bold text-emerald-400 text-sm">Final Score: {gameHistorical.final}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Closing Spread</span>
                    <span className="font-bold text-white text-sm">{gameHistorical.cl}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">ATS Result</span>
                    <span className={`font-bold text-sm ${gameHistorical.ats === 'Win' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {gameHistorical.ats === 'Win' ? 'Favorite Cover' : 'Underdog Cover'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Closing Total</span>
                    <span className="font-bold text-white text-sm">{gameHistorical.ct} ({gameHistorical.ou})</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Projection Error</span>
                    <span className="font-bold text-cyan-400 text-sm">{gameHistorical.pe.toFixed(1)} pts</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 font-sans">
                  <strong className="text-white block mb-0.5">FEI Model Projection at Kickoff:</strong>
                  Projected Score: {gameHistorical.pf.toFixed(1)} - {gameHistorical.pa.toFixed(1)} (Margin: {gameHistorical.pm.toFixed(1)} pts, Win Prob: {Math.round(gameHistorical.pw * 100)}%). Spread Difference vs Market: {gameHistorical.spreadDiff.toFixed(1)} pts.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Click any team name to explore their schedule and records.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-1.5 font-semibold text-white transition-colors"
          >
            Close Game
          </button>
        </div>
      </div>
    </div>
  );
};
