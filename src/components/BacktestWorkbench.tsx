import React, { useState, useMemo } from 'react';
import { DetailedGame } from '../types';
import { calculateBettingMetric } from '../utils/bettingAnalytics';
import { SlidersHorizontal, Search, RotateCcw, Download, Copy, Check, TrendingUp, DollarSign, Target, ShieldCheck, BarChart2 } from 'lucide-react';
import { MultivariateRegressionSummary } from './MultivariateRegressionSummary';

interface Props {
  games?: DetailedGame[];
  allGames?: DetailedGame[];
  initialFilters?: {
    spreadEdgeTier?: string;
    side?: string;
  };
}

export const BacktestWorkbench: React.FC<Props> = ({ games, allGames, initialFilters }) => {
  const gameList = games || allGames || [];
  const [activeTabMode, setActiveTabMode] = useState<'screener' | 'regression'>('screener');
  const [season, setSeason] = useState<string>('all');
  const [spreadEdgeTier, setSpreadEdgeTier] = useState<string>(initialFilters?.spreadEdgeTier || 'all');
  const [modelSide, setModelSide] = useState<string>(initialFilters?.side || 'all');
  const [spreadMagnitude, setSpreadMagnitude] = useState<string>('all');
  const [ouEdgeTier, setOuEdgeTier] = useState<string>('all');
  const [pwTier, setPwTier] = useState<string>('all');
  const [totalRange, setTotalRange] = useState<string>('all');
  const [weekPhase, setWeekPhase] = useState<string>('all');
  const [searchTeam, setSearchTeam] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [page, setPage] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  const pageSize = 25;

  // Filter games based on current criteria
  const filteredGames = useMemo(() => {
    return (gameList || []).filter((g) => {
      if (season !== 'all' && g.year.toString() !== season) return false;
      if (spreadEdgeTier !== 'all') {
        if (spreadEdgeTier === 'mega' && g.spreadEdgeAbs < 7.0) return false;
        if (spreadEdgeTier === 'high' && (g.spreadEdgeAbs < 5.0 || g.spreadEdgeAbs >= 7.0)) return false;
        if (spreadEdgeTier === 'med' && (g.spreadEdgeAbs < 3.0 || g.spreadEdgeAbs >= 5.0)) return false;
        if (spreadEdgeTier === 'low' && (g.spreadEdgeAbs < 1.0 || g.spreadEdgeAbs >= 3.0)) return false;
        if (spreadEdgeTier === 'none' && g.spreadEdgeAbs >= 1.0) return false;
      }
      if (modelSide !== 'all') {
        if (modelSide === 'fav' && g.modelAtsSide !== 'Fav') return false;
        if (modelSide === 'dog' && g.modelAtsSide !== 'Dog') return false;
      }
      if (spreadMagnitude !== 'all') {
        const absCl = Math.abs(g.clNum);
        if (spreadMagnitude === 'pick' && absCl > 3.0) return false;
        if (spreadMagnitude === 'key' && (absCl <= 3.0 || absCl > 7.0)) return false;
        if (spreadMagnitude === 'med' && (absCl <= 7.0 || absCl > 14.0)) return false;
        if (spreadMagnitude === 'heavy' && (absCl <= 14.0 || absCl > 21.0)) return false;
        if (spreadMagnitude === 'blowout' && absCl <= 21.0) return false;
      }
      if (ouEdgeTier !== 'all') {
        if (ouEdgeTier === 'highOver' && g.totalDiff < 5.0) return false;
        if (ouEdgeTier === 'modOver' && (g.totalDiff < 2.5 || g.totalDiff >= 5.0)) return false;
        if (ouEdgeTier === 'neutral' && (g.totalDiff < -2.4 || g.totalDiff > 2.4)) return false;
        if (ouEdgeTier === 'modUnder' && (g.totalDiff > -2.5 || g.totalDiff <= -5.0)) return false;
        if (ouEdgeTier === 'highUnder' && g.totalDiff > -5.0) return false;
      }
      if (pwTier !== 'all') {
        if (pwTier === 'elite' && g.pw < 0.85) return false;
        if (pwTier === 'strong' && (g.pw < 0.75 || g.pw >= 0.85)) return false;
        if (pwTier === 'mod' && (g.pw < 0.65 || g.pw >= 0.75)) return false;
        if (pwTier === 'tossup' && g.pw >= 0.65) return false;
      }
      if (totalRange !== 'all') {
        if (totalRange === 'low' && g.ct >= 46.0) return false;
        if (totalRange === 'med' && (g.ct < 46.0 || g.ct > 54.5)) return false;
        if (totalRange === 'high' && (g.ct <= 54.5 || g.ct > 64.5)) return false;
        if (totalRange === 'shootout' && g.ct <= 64.5) return false;
      }
      if (weekPhase !== 'all') {
        if (weekPhase === 'early' && g.weekPhase !== 'Early (Wk 0-3)') return false;
        if (weekPhase === 'mid' && g.weekPhase !== 'Mid (Wk 4-9)') return false;
        if (weekPhase === 'late' && g.weekPhase !== 'Late (Wk 10-15)') return false;
        if (weekPhase === 'post' && g.weekPhase !== 'Postseason / Bowls') return false;
      }
      if (searchTeam) {
        const query = searchTeam.toLowerCase();
        if (!g.winner.toLowerCase().includes(query) && !g.loser.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => b.year - a.year);
  }, [games, season, spreadEdgeTier, modelSide, spreadMagnitude, ouEdgeTier, pwTier, totalRange, weekPhase, searchTeam]);

  // Compute live KPIs for the filtered subset
  const kpiStats = useMemo(() => {
    let atsW = 0, atsL = 0, atsP = 0;
    let ouW = 0, ouL = 0, ouP = 0;
    let suW = 0, suL = 0;
    let peSum = 0;

    for (const g of filteredGames) {
      if (g.ats === 'Win') atsW++;
      else if (g.ats === 'Loss') atsL++;
      else if (g.ats === 'Push') atsP++;

      if (g.ou === 'Win') ouW++;
      else if (g.ou === 'Loss') ouL++;
      else if (g.ou === 'Push') ouP++;

      if (g.su === 'Win') suW++;
      else suL++;

      peSum += g.pe;
    }

    const ats = calculateBettingMetric(atsW, atsL, atsP);
    const ou = calculateBettingMetric(ouW, ouL, ouP);
    const su = calculateBettingMetric(suW, suL, 0);
    const avgPe = filteredGames.length > 0 ? peSum / filteredGames.length : 0;

    return { ats, ou, su, avgPe, total: filteredGames.length };
  }, [filteredGames]);

  const resetFilters = () => {
    setSeason('all');
    setSpreadEdgeTier('all');
    setModelSide('all');
    setSpreadMagnitude('all');
    setOuEdgeTier('all');
    setPwTier('all');
    setTotalRange('all');
    setWeekPhase('all');
    setSearchTeam('');
    setPage(1);
  };

  const paginatedGames = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredGames.slice(start, start + pageSize);
  }, [filteredGames, page]);

  const totalPages = Math.ceil(filteredGames.length / pageSize) || 1;

  const exportFilteredCsv = () => {
    let csv = `Year,Week,Winner,Loser,Final Score,Closing Line,FEI Proj Margin,Spread Edge,ATS Result,Closing Total,FEI Proj Total,Total Edge,OU Result,Proj Win Prob,PE\n`;
    for (const g of filteredGames) {
      csv += `${g.year},"${g.week}","${g.winner}","${g.loser}","${g.final}","${g.cl}",${g.pm},${g.spreadDiff},"${g.ats}",${g.ct},${g.pt},${g.totalDiff},"${g.ou}",${g.pw},${g.pe}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FEI_Backtest_${filteredGames.length}_games.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Nav Switcher for Research Hub */}
      <div className="flex items-center justify-between p-2 bg-[#0c1220] border border-[#1e293b] rounded-xl font-mono text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTabMode('screener')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeTabMode === 'screener'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Historical Backtest & Edge Screener (4,800 Games)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabMode('regression')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeTabMode === 'regression'
                ? 'bg-cyan-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Multivariate Regression & OLS Summary Stats</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline">
          FEI Empirical Quantitative Engine
        </span>
      </div>

      {activeTabMode === 'regression' ? (
        <MultivariateRegressionSummary />
      ) : (
        <div id="backtest-workbench-container" className="bg-[#111827] border border-[#1e293b] rounded-xl shadow-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#1e293b] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111827]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  Interactive Edge Backtester & Tier Screener
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    {filteredGames.length.toLocaleString()} Games Matching
                  </span>
                </h2>
                <p className="text-[11px] text-[#64748b] font-mono mt-0.5">
                  Simulate ROI, win percentages, and profit units by combining any historical market criteria
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-[#94a3b8] bg-[#0b0e14] border border-[#334155] rounded hover:text-white hover:bg-[#1e293b] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
              <button
                onClick={exportFilteredCsv}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

      {/* Multi-Criteria Filter Controls Panel */}
      <div className="p-4 bg-[#0b0e14]/70 border-b border-[#1e293b] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 font-mono text-xs">
        {/* Season Year */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] block mb-1">
            Season Year
          </label>
          <select
            value={season}
            onChange={(e) => { setSeason(e.target.value); setPage(1); }}
            className="w-full bg-[#1e293b] border border-[#334155] text-white rounded px-2 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Seasons (2022–2026)</option>
            <option value="2026">2026 Season (To-Date)</option>
            <option value="2025">2025 Season</option>
            <option value="2024">2024 Season</option>
            <option value="2023">2023 Season</option>
            <option value="2022">2022 Season</option>
          </select>
        </div>

        {/* Spread Edge Tier */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
            Spread Edge
          </label>
          <select
            value={spreadEdgeTier}
            onChange={(e) => { setSpreadEdgeTier(e.target.value); setPage(1); }}
            className="w-full bg-[#1e293b] border border-[#334155] text-white rounded px-2 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Spread Edges</option>
            <option value="mega">≥ 7.0 pts (Mega)</option>
            <option value="high">5.0 - 6.9 pts (High)</option>
            <option value="med">3.0 - 4.9 pts (Mod)</option>
            <option value="low">1.0 - 2.9 pts (Low)</option>
            <option value="none">&lt; 1.0 pt (Consensus)</option>
          </select>
        </div>

        {/* Model Side */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] block mb-1">
            Model Side
          </label>
          <select
            value={modelSide}
            onChange={(e) => { setModelSide(e.target.value); setPage(1); }}
            className="w-full bg-[#1e293b] border border-[#334155] text-white rounded px-2 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Both Sides</option>
            <option value="fav">Model on Favorite</option>
            <option value="dog">Model on Underdog</option>
          </select>
        </div>

        {/* Spread Magnitude */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] block mb-1">
            Spread Size
          </label>
          <select
            value={spreadMagnitude}
            onChange={(e) => { setSpreadMagnitude(e.target.value); setPage(1); }}
            className="w-full bg-[#1e293b] border border-[#334155] text-white rounded px-2 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Spread Sizes</option>
            <option value="pick">0 - 3.0 pts (Pick)</option>
            <option value="key">3.5 - 7.0 pts (Key)</option>
            <option value="med">7.5 - 14.0 pts (Med)</option>
            <option value="heavy">14.5 - 21.0 pts (Heavy)</option>
            <option value="blowout">&gt; 21.0 pts (Mega)</option>
          </select>
        </div>

        {/* Totals Edge */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
            O/U Totals Edge
          </label>
          <select
            value={ouEdgeTier}
            onChange={(e) => { setOuEdgeTier(e.target.value); setPage(1); }}
            className="w-full bg-[#1e293b] border border-[#334155] text-white rounded px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">All O/U Edges</option>
            <option value="highOver">High Over (≥ +5.0)</option>
            <option value="modOver">Mod Over (+2.5 to 4.9)</option>
            <option value="neutral">Neutral (-2.4 to +2.4)</option>
            <option value="modUnder">Mod Under (-4.9 to -2.5)</option>
            <option value="highUnder">High Under (≤ -5.0)</option>
          </select>
        </div>

        {/* Win Prob Confidence */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] block mb-1">
            Win Probability
          </label>
          <select
            value={pwTier}
            onChange={(e) => { setPwTier(e.target.value); setPage(1); }}
            className="w-full bg-[#1e293b] border border-[#334155] text-white rounded px-2 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Probabilities</option>
            <option value="elite">≥ 85.0% (Elite Lock)</option>
            <option value="strong">75.0% - 84.9% (Strong)</option>
            <option value="mod">65.0% - 74.9% (Mod)</option>
            <option value="tossup">50.0% - 64.9% (Tossup)</option>
          </select>
        </div>

        {/* Season Phase */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] block mb-1">
            Season Phase
          </label>
          <select
            value={weekPhase}
            onChange={(e) => { setWeekPhase(e.target.value); setPage(1); }}
            className="w-full bg-[#1e293b] border border-[#334155] text-white rounded px-2 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Weeks</option>
            <option value="early">Early (Weeks 0–3)</option>
            <option value="mid">Mid (Weeks 4–9)</option>
            <option value="late">Late (Weeks 10–15)</option>
            <option value="post">Bowls & CFP</option>
          </select>
        </div>

        {/* Team Search */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] block mb-1">
            Search Team
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Ohio State..."
              value={searchTeam}
              onChange={(e) => { setSearchTeam(e.target.value); setPage(1); }}
              className="w-full bg-[#1e293b] border border-[#334155] text-white placeholder-[#64748b] rounded px-2 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Live KPI Performance Cards */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-[#111827] border-b border-[#1e293b] font-mono">
        {/* Games Evaluated */}
        <div className="p-3 bg-[#0b0e14] border border-[#1e293b] rounded-lg">
          <span className="text-[10px] text-[#64748b] uppercase block font-bold">Games Evaluated</span>
          <span className="text-xl font-bold text-white mt-1 block">
            {kpiStats.total.toLocaleString()}
          </span>
          <span className="text-[10px] text-[#94a3b8]">
            {((kpiStats.total / games.length) * 100).toFixed(1)}% of total archive
          </span>
        </div>

        {/* ATS Win % */}
        <div className="p-3 bg-[#0b0e14] border border-[#1e293b] rounded-lg">
          <span className="text-[10px] text-emerald-400 uppercase block font-bold">ATS Win %</span>
          <span className={`text-xl font-bold mt-1 block ${kpiStats.ats.winPctDecisive >= 52.4 ? 'text-emerald-400' : 'text-slate-300'}`}>
            {kpiStats.ats.winPctDecisive.toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#94a3b8]">
            {kpiStats.ats.wins}W - {kpiStats.ats.losses}L - {kpiStats.ats.pushes || 0}P
          </span>
        </div>

        {/* ATS Est ROI */}
        <div className="p-3 bg-[#0b0e14] border border-[#1e293b] rounded-lg">
          <span className="text-[10px] text-emerald-400 uppercase block font-bold">ATS Est. ROI (-110)</span>
          <span className={`text-xl font-bold mt-1 block ${(kpiStats.ats.roi || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {(kpiStats.ats.roi || 0) >= 0 ? `+${(kpiStats.ats.roi || 0).toFixed(1)}%` : `${(kpiStats.ats.roi || 0).toFixed(1)}%`}
          </span>
          <span className="text-[10px] text-[#94a3b8]">
            {(kpiStats.ats.profitDollars || 0) >= 0 ? `+$${(kpiStats.ats.profitDollars || 0).toLocaleString()}` : `-$${Math.abs(kpiStats.ats.profitDollars || 0).toLocaleString()}`} on $100 bets
          </span>
        </div>

        {/* O/U Win % */}
        <div className="p-3 bg-[#0b0e14] border border-[#1e293b] rounded-lg">
          <span className="text-[10px] text-blue-400 uppercase block font-bold">O/U Win %</span>
          <span className={`text-xl font-bold mt-1 block ${kpiStats.ou.winPctDecisive >= 52.4 ? 'text-blue-400' : 'text-slate-300'}`}>
            {kpiStats.ou.winPctDecisive.toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#94a3b8]">
            {kpiStats.ou.wins}W - {kpiStats.ou.losses}L - {kpiStats.ou.pushes || 0}P
          </span>
        </div>

        {/* O/U Est ROI */}
        <div className="p-3 bg-[#0b0e14] border border-[#1e293b] rounded-lg">
          <span className="text-[10px] text-blue-400 uppercase block font-bold">O/U Est. ROI (-110)</span>
          <span className={`text-xl font-bold mt-1 block ${(kpiStats.ou.roi || 0) >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
            {(kpiStats.ou.roi || 0) >= 0 ? `+${(kpiStats.ou.roi || 0).toFixed(1)}%` : `${(kpiStats.ou.roi || 0).toFixed(1)}%`}
          </span>
          <span className="text-[10px] text-[#94a3b8]">
            {(kpiStats.ou.profitDollars || 0) >= 0 ? `+$${(kpiStats.ou.profitDollars || 0).toLocaleString()}` : `-$${Math.abs(kpiStats.ou.profitDollars || 0).toLocaleString()}`} on $100 bets
          </span>
        </div>

        {/* Avg Proj Error */}
        <div className="p-3 bg-[#0b0e14] border border-[#1e293b] rounded-lg">
          <span className="text-[10px] text-orange-400 uppercase block font-bold">Avg Proj Error</span>
          <span className="text-xl font-bold text-orange-400 mt-1 block">
            {kpiStats.avgPe.toFixed(2)} pts
          </span>
          <span className="text-[10px] text-[#94a3b8]">
            SU: {kpiStats.su.winPctDecisive.toFixed(1)}% ({kpiStats.su.wins}W-{kpiStats.su.losses}L)
          </span>
        </div>
      </div>

      {/* Games List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="bg-[#1e293b]/80 sticky top-0 border-b border-[#1e293b] text-[#94a3b8] uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Season / Week</th>
              <th className="px-4 py-3">Projected Matchup</th>
              <th className="px-3 py-3 text-center">Score / Margin</th>
              <th className="px-3 py-3 text-right">FEI Margin (PM)</th>
              <th className="px-3 py-3 text-right">Closing Line (CL)</th>
              <th className="px-3 py-3 text-right">Spread Edge</th>
              <th className="px-3 py-3 text-center">ATS Result</th>
              <th className="px-3 py-3 text-right">FEI Total (PT)</th>
              <th className="px-3 py-3 text-right">Closing Total (CT)</th>
              <th className="px-3 py-3 text-center">O/U Result</th>
              <th className="px-3 py-3 text-right">PE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b] text-[#e2e8f0]">
            {paginatedGames.map((g) => (
              <tr key={g.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="bg-[#1e293b] border border-[#334155] px-1.5 py-0.5 rounded text-emerald-400 font-bold mr-1.5">
                    {g.year}
                  </span>
                  <span className="text-[#94a3b8] text-[11px] truncate max-w-[120px] inline-block align-middle">
                    {g.week.replace('Week ', 'Wk ')}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="font-bold text-white">
                    <span className="text-emerald-400 font-bold">{g.winner}</span>
                    <span className="text-[#64748b] mx-1">vs</span>
                    <span>{g.loser}</span>
                  </div>
                  <div className="text-[10px] text-[#64748b]">
                    PW: {(g.pw * 100).toFixed(1)}% | Proj: {g.pf.toFixed(1)} - {g.pa.toFixed(1)}
                  </div>
                </td>

                <td className="px-3 py-3 text-center">
                  <span className="font-bold text-white">{g.final}</span>
                </td>

                <td className="px-3 py-3 text-right font-bold text-[#cbd5e1]">
                  +{g.pm.toFixed(1)}
                </td>

                <td className="px-3 py-3 text-right font-bold text-[#94a3b8]">
                  {g.cl}
                </td>

                <td className="px-3 py-3 text-right">
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    g.spreadEdgeAbs >= 5.0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-[#cbd5e1]'
                  }`}>
                    {g.spreadDiff > 0 ? `+${g.spreadDiff.toFixed(1)}` : g.spreadDiff.toFixed(1)}
                  </span>
                </td>

                <td className="px-3 py-3 text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-[10px] ${
                    g.ats === 'Win'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : g.ats === 'Push'
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {g.ats}
                  </span>
                </td>

                <td className="px-3 py-3 text-right text-[#cbd5e1]">
                  {g.pt.toFixed(1)}
                </td>

                <td className="px-3 py-3 text-right text-[#94a3b8]">
                  {g.ct.toFixed(1)}
                </td>

                <td className="px-3 py-3 text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-[10px] ${
                    g.ou === 'Win'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : g.ou === 'Push'
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {g.ou}
                  </span>
                </td>

                <td className="px-3 py-3 text-right text-orange-300 font-bold">
                  {g.pe.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination & Footer */}
      <div className="p-3 bg-[#0b0e14] border-t border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#94a3b8]">
        <div>
          Showing {paginatedGames.length} of {filteredGames.length} games (Page {page} of {totalPages})
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1 bg-[#1e293b] border border-[#334155] rounded disabled:opacity-40 hover:bg-[#334155] text-white"
          >
            Previous
          </button>
          <span className="text-white font-bold">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2.5 py-1 bg-[#1e293b] border border-[#334155] rounded disabled:opacity-40 hover:bg-[#334155] text-white"
          >
            Next
          </button>
        </div>
      </div>
    </div>
    )}
  </div>
  );
};
