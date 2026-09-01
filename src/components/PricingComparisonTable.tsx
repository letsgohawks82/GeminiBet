// src/components/PricingComparisonTable.tsx
import React, { useState } from 'react';
import { PricingComparisonItem } from '../types';
import { Lock, Scale, Activity, ArrowRight, ShieldAlert, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { AiMatchupModal } from './AiMatchupModal';

interface PricingComparisonTableProps {
  items: PricingComparisonItem[];
  onOpenCommentary?: (item: PricingComparisonItem) => void;
}

export const PricingComparisonTable: React.FC<PricingComparisonTableProps> = ({ items, onOpenCommentary }) => {
  const [filterWeek, setFilterWeek] = useState<string>('All');
  const [selectedMatchupForModal, setSelectedMatchupForModal] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredItems = items.filter((item) => {
    if (filterWeek === 'All') return true;
    return item.week === filterWeek;
  });

  const handleOpenAiCommentary = (item: PricingComparisonItem) => {
    if (onOpenCommentary) {
      onOpenCommentary(item);
    } else {
      setSelectedMatchupForModal({
        id: item.id,
        favorite: item.favorite,
        underdog: item.underdog,
        week: item.week,
        venue: item.venue,
        marketSpread: item.marketClosingSpread,
        feiProjMargin: item.modelFairSpread,
      });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Controls & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
              Model Price vs. Market Consensus Comparison
            </h3>
            <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
              Comparison Mode (Locked)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Displaying side-by-side market lines against model fair prices and CFBD SP+/SRS ratings. Bet recommendations and Kelly sizing are strictly locked by the Calibration Gate.
          </p>
        </div>

        {/* Week Selector */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-400"
          >
            <option value="All">All Slates (Week 0 - 1)</option>
            <option value="Week 0">Week 0</option>
            <option value="Week 1">Week 1</option>
          </select>
        </div>
      </div>

      {/* Grid of Matchup Cards */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredItems.map((game) => (
          <div
            key={game.id}
            className="rounded-xl border border-slate-800 bg-slate-900/90 hover:border-slate-700 transition-all p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
          >
            {/* Matchup & Venue */}
            <div className="space-y-1.5 md:w-1/3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400 font-semibold">
                  {game.week} • {game.date}
                </span>
                {game.isNeutral && (
                  <span className="rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300 px-1.5 py-0.5 text-[9px] font-mono">
                    Neutral Site
                  </span>
                )}
              </div>
              <div className="text-base font-black text-white flex items-center gap-2">
                <span>{game.favorite}</span>
                <span className="text-xs font-normal text-slate-500 font-mono">vs</span>
                <span className="text-slate-300">{game.underdog}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>{game.venue}</span>
              </div>

              {/* CFBD Ratings Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                <span className="rounded bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 text-slate-300">
                  SP+ Diff: <strong className="text-white">+{game.spPlusDiff} pts</strong>
                </span>
                <span className="rounded bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 text-slate-300">
                  SRS: <strong className="text-white">+{game.srsDiff}</strong>
                </span>
                <span className="rounded bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 text-slate-300">
                  FPI: <strong className="text-white">+{game.fpiDiff}</strong>
                </span>
              </div>
            </div>

            {/* Side-by-Side Pricing Comparison Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 md:w-1/2 font-mono">
              {/* Market Column */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Market Line</div>
                <div className="mt-1 text-sm font-black text-white">
                  {game.marketClosingSpread > 0 ? `+${game.marketClosingSpread}` : game.marketClosingSpread}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  De-vigged: {(game.marketDeviggedProb * 100).toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Open: {game.marketOpenerSpread > 0 ? `+${game.marketOpenerSpread}` : game.marketOpenerSpread}
                </div>
              </div>

              {/* Model Fair Price Column */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Model Price</div>
                <div className="mt-1 text-sm font-black text-slate-200">
                  {game.modelFairSpread > 0 ? `+${game.modelFairSpread}` : game.modelFairSpread}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Fair Prob: {(game.modelFairProb * 100).toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Proj Score: {game.modelScoreProjection}
                </div>
              </div>

              {/* Market Blend & Calibration Delta */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-2.5 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold text-amber-300 uppercase flex items-center justify-between">
                  <span>Blend (λ=0.024)</span>
                  <Scale className="h-3 w-3 text-amber-400" />
                </div>
                <div className="mt-1 text-sm font-black text-amber-200">
                  {(game.marketAnchoredBlendProb * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">
                  Raw Delta: {game.spreadDiscrepancy > 0 ? `+${game.spreadDiscrepancy}` : game.spreadDiscrepancy} pts
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  CLV: {game.clvMovementPts > 0 ? `+${game.clvMovementPts}` : game.clvMovementPts} pts
                </div>
              </div>
            </div>

            {/* Actions / Locked Status */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span className="font-bold font-mono text-[11px]">Sizing Locked</span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAiCommentary(game)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Commentary</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <AiMatchupModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pick={selectedMatchupForModal}
        />
      )}
    </div>
  );
};
