import React from 'react';
import { OverallSummary } from '../types';
import { Trophy, TrendingUp, Compass, Target, Hash } from 'lucide-react';

interface Props {
  overall: OverallSummary;
}

export const MetricCards: React.FC<Props> = ({ overall }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Games */}
      <div id="stat-card-total-games" className="bg-[#1e293b] p-4 rounded-lg border border-[#334155] shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#94a3b8] text-[10px] uppercase tracking-wider font-bold">Games Analyzed</p>
            <p className="text-[9px] text-cyan-400 font-sans">Total match history database</p>
          </div>
          <div className="w-6 h-6 rounded bg-[#0b0e14]/60 border border-[#334155] flex items-center justify-center text-[#94a3b8]">
            <Hash className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-3xl font-mono font-bold text-white">{overall.totalGames.toLocaleString()}</p>
          <div className="mt-2 h-1 w-full bg-[#0b0e14] rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[100%]"></div>
          </div>
          <p className="text-[10px] text-[#64748b] mt-1.5 font-medium">4 Full Seasons (2022–2025)</p>
        </div>
      </div>

      {/* Straight Up (SU) */}
      <div id="stat-card-su-win" className="bg-[#1e293b] p-4 rounded-lg border border-[#334155] shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#94a3b8] text-[10px] uppercase tracking-wider font-bold">Outright Winner (SU)</p>
            <p className="text-[9px] text-emerald-400 font-sans">Picking who wins the game</p>
          </div>
          <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Trophy className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-3xl font-mono font-bold text-emerald-400">{overall.su.winPctDecisive.toFixed(1)}%</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
              {overall.su.wins.toLocaleString()}W - {overall.su.losses.toLocaleString()}L
            </span>
          </div>
        </div>
      </div>

      {/* Against the Spread (ATS) */}
      <div id="stat-card-ats-win" className="bg-[#1e293b] p-4 rounded-lg border border-[#334155] shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#94a3b8] text-[10px] uppercase tracking-wider font-bold">Point Spread (ATS)</p>
            <p className="text-[9px] text-blue-400 font-sans">Beating Vegas point lines</p>
          </div>
          <div className="w-6 h-6 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-3xl font-mono font-bold text-emerald-400">{overall.ats.winPctDecisive.toFixed(1)}%</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
              {overall.ats.wins}W-{overall.ats.losses}L-{overall.ats.pushes || 0}P
            </span>
          </div>
        </div>
      </div>

      {/* Over / Under (O/U) */}
      <div id="stat-card-ou-win" className="bg-[#1e293b] p-4 rounded-lg border border-[#334155] shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#94a3b8] text-[10px] uppercase tracking-wider font-bold">Over / Under (Totals)</p>
            <p className="text-[9px] text-purple-400 font-sans">Total combined points scored</p>
          </div>
          <div className="w-6 h-6 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Compass className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-3xl font-mono font-bold text-purple-300">{overall.ou.winPctDecisive.toFixed(1)}%</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
              {overall.ou.wins}W-{overall.ou.losses}L-{overall.ou.pushes || 0}P
            </span>
          </div>
        </div>
      </div>

      {/* Aggregate Mean PE */}
      <div id="stat-card-avg-pe" className="bg-[#1e293b] p-4 rounded-lg border border-[#334155] shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#94a3b8] text-[10px] uppercase tracking-wider font-bold">Avg Prediction Error</p>
            <p className="text-[9px] text-orange-400 font-sans">Model accuracy in points</p>
          </div>
          <div className="w-6 h-6 rounded bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Target className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-3xl font-mono font-bold text-orange-400">{overall.avgPe.toFixed(2)} pts</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded font-bold">
              Lower is Better
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

