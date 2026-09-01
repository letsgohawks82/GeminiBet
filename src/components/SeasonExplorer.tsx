import React, { useState } from 'react';
import { SeasonStat, WeekStat, DetailedGame } from '../types';
import { Calendar, Search, ExternalLink, Activity, ChevronRight } from 'lucide-react';

interface Props {
  seasons?: SeasonStat[];
  feiData?: { seasons: SeasonStat[] };
  onOpenTeam?: (teamName: string) => void;
  onOpenGame?: (game: DetailedGame) => void;
}

export const SeasonExplorer: React.FC<Props> = ({
  seasons,
  feiData,
  onOpenTeam,
  onOpenGame,
}) => {
  const list = seasons || feiData?.seasons || [];
  const latestYear = list.length > 0 ? Math.max(...list.map((s) => s.year)) : 2026;
  const [selectedYear, setSelectedYear] = useState<number>(latestYear);
  const [searchTerm, setSearchTerm] = useState('');

  const currentSeason = list.find(s => s.year === selectedYear) || list[0] || {
    year: 2026,
    totalGames: 0,
    weekBreakdown: {},
    sampleGames: [],
    su: { wins: 0, losses: 0, winPctTotal: 0, winPctDecisive: 0 },
    ats: { wins: 0, losses: 0, pushes: 0, winPctTotal: 0, winPctDecisive: 0 },
    ou: { wins: 0, losses: 0, pushes: 0, winPctTotal: 0, winPctDecisive: 0 },
    avgPe: 0,
  };

  const weeks = Object.entries(currentSeason.weekBreakdown || {}).map(([name, rawStat]) => {
    const stat = rawStat as WeekStat;
    return {
      name,
      ...stat,
      avgPe: stat.count > 0 ? (stat.peSum / stat.count) : 0,
      suPct: stat.count > 0 ? (stat.suWins / stat.count) * 100 : 0,
      atsPct: stat.count > 0 ? (stat.atsWins / stat.count) * 100 : 0,
      ouPct: stat.count > 0 ? (stat.ouWins / stat.count) * 100 : 0,
    };
  });

  const filteredGames = (currentSeason.sampleGames || []).filter(g => 
    g.winner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.loser.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.week.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="season-explorer-panel" className="bg-[#111827] border border-[#1e293b] rounded-xl shadow-lg overflow-hidden">
      {/* Header & Year Selector */}
      <div className="p-4 border-b border-[#1e293b] bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#e2e8f0] uppercase tracking-widest flex items-center gap-2">
              Granular Season Breakdown & Diagnostics
            </h3>
            <p className="text-[11px] text-[#64748b] mt-0.5">
              Select an archived season to analyze week-by-week trends and individual game model accuracy
            </p>
          </div>
        </div>

        {/* Season Selector Tabs */}
        <div className="flex items-center bg-[#0b0e14] p-1 rounded-lg border border-[#334155]">
          {list.map(s => (
            <button
              key={s.year}
              id={`select-season-${s.year}`}
              onClick={() => setSelectedYear(s.year)}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all ${
                selectedYear === s.year
                  ? 'bg-[#1e293b] text-emerald-400 border border-[#334155] shadow-xs'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              {s.year === 2026 ? '2026 (Live)' : s.year}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Breakdown Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                {selectedYear} Week-by-Week Aggregation ({weeks.length} Segments)
              </h4>
            </div>
            <a
              href={`https://www.bcftoys.com/${selectedYear}-gp`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline font-mono"
            >
              <span>bcftoys.com source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="border border-[#1e293b] rounded-lg overflow-hidden max-h-96 overflow-y-auto bg-[#0b0e14]/40">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-[#1e293b]/80 sticky top-0 border-b border-[#1e293b] text-[#94a3b8] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Segment / Week</th>
                  <th className="py-2.5 px-2 text-center">Games</th>
                  <th className="py-2.5 px-2 text-right">SU Win%</th>
                  <th className="py-2.5 px-2 text-right">ATS Win%</th>
                  <th className="py-2.5 px-2 text-right">O/U Win%</th>
                  <th className="py-2.5 px-3 text-right">Avg PE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-[#e2e8f0]">
                {weeks.map((w, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2 px-3 font-medium text-white truncate max-w-[200px]" title={w.name}>
                      {w.name.replace(' Game Projections', '').replace(' Game Projection', '')}
                    </td>
                    <td className="py-2 px-2 text-center text-[#cbd5e1]">{w.count}</td>
                    <td className="py-2 px-2 text-right">
                      <span className="text-emerald-400 font-bold">{w.suPct.toFixed(1)}%</span>{' '}
                      <span className="text-[#64748b] text-[10px]">({w.suWins}/{w.count})</span>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <span className="text-slate-200 font-bold">{w.atsPct.toFixed(1)}%</span>{' '}
                      <span className="text-[#64748b] text-[10px]">({w.atsWins}/{w.count})</span>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <span className="text-blue-400 font-bold">{w.ouPct.toFixed(1)}%</span>{' '}
                      <span className="text-[#64748b] text-[10px]">({w.ouWins}/{w.count})</span>
                    </td>
                    <td className="py-2 px-3 text-right text-orange-300 font-bold">
                      {w.avgPe.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Highlight Sample Projections */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
              Sample Games & Results ({selectedYear})
            </h4>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748b]" />
            <input
              type="text"
              placeholder="Filter by team or game..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0b0e14] border border-[#334155] rounded-lg focus:outline-hidden focus:border-emerald-500 text-white placeholder-[#64748b] font-mono"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredGames.slice(0, 10).map((g, idx) => (
              <div key={idx} className="p-2.5 bg-[#1e293b]/60 border border-[#334155]/60 hover:border-slate-500 rounded-lg text-xs transition-colors font-mono">
                <div className="flex items-center justify-between font-bold text-white">
                  <div className="truncate flex items-center gap-1.5 font-sans">
                    {onOpenTeam ? (
                      <button
                        type="button"
                        onClick={() => onOpenTeam(g.winner)}
                        className="hover:text-emerald-400 hover:underline transition-colors"
                      >
                        {g.winner}
                      </button>
                    ) : (
                      <span>{g.winner}</span>
                    )}
                    <span className="text-slate-500 font-normal">vs</span>
                    {onOpenTeam ? (
                      <button
                        type="button"
                        onClick={() => onOpenTeam(g.loser)}
                        className="hover:text-emerald-400 hover:underline transition-colors"
                      >
                        {g.loser}
                      </button>
                    ) : (
                      <span>{g.loser}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-emerald-400 font-mono">{g.final}</span>
                    {onOpenGame && (
                      <button
                        type="button"
                        onClick={() => onOpenGame(g)}
                        className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        title="View Historical Game Details"
                      >
                        Game Details
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between text-[#94a3b8] text-[11px]">
                  <span>Proj: {g.winner} by {g.pm.toFixed(1)}</span>
                  <span className="text-orange-300 font-bold">PE: {g.pe.toFixed(1)} pts</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 pt-1 border-t border-[#334155]/40 text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded font-bold ${g.su === 'Win' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                    SU: {g.su}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${g.ats === 'Win' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : g.ats === 'Push' ? 'bg-slate-700 text-slate-300' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                    ATS: {g.ats} (Line {g.cl})
                  </span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${g.ou === 'Win' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : g.ou === 'Push' ? 'bg-slate-700 text-slate-300' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                    O/U: {g.ou}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
