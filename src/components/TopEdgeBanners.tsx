import React from 'react';
import { TierRow } from '../types';
import { Flame, Zap, ArrowUpRight, TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  topAtsEdges: TierRow[];
  topOuEdges: TierRow[];
  onSelectTierFilter?: (category: string, tierName: string) => void;
}

export const TopEdgeBanners: React.FC<Props> = ({ topAtsEdges, topOuEdges, onSelectTierFilter }) => {
  return (
    <div id="top-edge-banners-container" className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Rhythm AI-Style Top Edge Screener
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                Alpha Tiers
              </span>
            </h2>
            <p className="text-[11px] text-[#94a3b8] font-mono">
              Statistically significant tiers with verified positive ROI across 3,180+ historical college football projections (2022–2026)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#64748b]">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Hurdle: 52.38% ATS (-110 Juice)</span>
        </div>
      </div>

      {/* Grid of Top ATS Edges */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-[#cbd5e1]">
            Top Against The Spread (ATS) Edges
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topAtsEdges.slice(0, 3).map((tier, idx) => {
            const isElite = (tier.ats.roi || 0) >= 5.0;
            return (
              <div
                key={idx}
                className="bg-[#111827] border border-[#1e293b] hover:border-emerald-500/50 rounded-xl p-4 transition-all relative overflow-hidden group shadow-lg"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748b] bg-[#0b0e14] border border-[#334155] px-1.5 py-0.5 rounded">
                      {tier.category}
                    </span>
                    <h4 className="text-sm font-bold font-mono text-white mt-1.5 group-hover:text-emerald-400 transition-colors">
                      {tier.name}
                    </h4>
                  </div>
                  <div className={`p-1.5 rounded-lg border ${isElite ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                    {isElite ? <Flame className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#1e293b] pt-3 font-mono">
                  <div>
                    <span className="text-[10px] text-[#64748b] uppercase block">ATS Win %</span>
                    <span className="text-base font-bold text-emerald-400">
                      {tier.ats.winPctDecisive.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748b] uppercase block">Record</span>
                    <span className="text-xs font-bold text-slate-200">
                      {tier.ats.wins}W-{tier.ats.losses}L
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748b] uppercase block">Est. ROI</span>
                    <span className="text-base font-bold text-emerald-400">
                      +{(tier.ats.roi || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#94a3b8] bg-[#0b0e14]/60 p-2 rounded border border-[#1e293b]">
                  <span>Sample: <strong className="text-white">{tier.totalGames}</strong> games</span>
                  <span className="text-emerald-400 font-bold">
                    +${tier.ats.profitDollars?.toLocaleString()} profit
                  </span>
                </div>

                {onSelectTierFilter && (
                  <button
                    onClick={() => onSelectTierFilter(tier.category, tier.name)}
                    className="mt-2.5 w-full py-1.5 bg-[#1e293b] hover:bg-emerald-500 hover:text-black text-[#cbd5e1] text-xs font-mono font-bold rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Backtest This Edge</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid of Top Over/Under Edges */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-[#cbd5e1]">
            Top Over / Under (Totals) Edges
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topOuEdges.slice(0, 3).map((tier, idx) => {
            const isElite = (tier.ou.roi || 0) >= 4.0;
            return (
              <div
                key={idx}
                className="bg-[#111827] border border-[#1e293b] hover:border-blue-500/50 rounded-xl p-4 transition-all relative overflow-hidden group shadow-lg"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748b] bg-[#0b0e14] border border-[#334155] px-1.5 py-0.5 rounded">
                      {tier.category}
                    </span>
                    <h4 className="text-sm font-bold font-mono text-white mt-1.5 group-hover:text-blue-400 transition-colors">
                      {tier.name}
                    </h4>
                  </div>
                  <div className={`p-1.5 rounded-lg border ${isElite ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                    <Flame className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#1e293b] pt-3 font-mono">
                  <div>
                    <span className="text-[10px] text-[#64748b] uppercase block">O/U Win %</span>
                    <span className="text-base font-bold text-blue-400">
                      {tier.ou.winPctDecisive.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748b] uppercase block">Record</span>
                    <span className="text-xs font-bold text-slate-200">
                      {tier.ou.wins}W-{tier.ou.losses}L
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748b] uppercase block">Est. ROI</span>
                    <span className={`text-base font-bold ${(tier.ou.roi || 0) >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                      {(tier.ou.roi || 0) >= 0 ? `+${(tier.ou.roi || 0).toFixed(1)}%` : `${(tier.ou.roi || 0).toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#94a3b8] bg-[#0b0e14]/60 p-2 rounded border border-[#1e293b]">
                  <span>Sample: <strong className="text-white">{tier.totalGames}</strong> games</span>
                  <span className="text-blue-400 font-bold">
                    +${tier.ou.profitDollars?.toLocaleString()} profit
                  </span>
                </div>

                {onSelectTierFilter && (
                  <button
                    onClick={() => onSelectTierFilter(tier.category, tier.name)}
                    className="mt-2.5 w-full py-1.5 bg-[#1e293b] hover:bg-blue-500 hover:text-black text-[#cbd5e1] text-xs font-mono font-bold rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Backtest This Edge</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
