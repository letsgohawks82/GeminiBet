import React, { useState, useMemo } from 'react';
import { DetailedGame } from '../types';
import {
  simulateParlays,
  simulateTeasers,
  calculateCustomStraightMetrics,
  calculateKellyStake,
  americanToDecimal,
} from '../utils/bettingAnalytics';

interface BettingLabProps {
  games: DetailedGame[];
}

export const BettingLab: React.FC<BettingLabProps> = ({ games }) => {
  // Straight line pricing selection
  const [selectedJuice, setSelectedJuice] = useState<number>(-110);
  const [straightTierFilter, setStraightTierFilter] = useState<'all' | 'highEdge' | 'megaEdge' | 'dogs'>('highEdge');

  // Kelly Bankroll state
  const [bankroll, setBankroll] = useState<number>(10000);
  const [kellyFraction, setKellyFraction] = useState<number>(0.25); // Quarter-Kelly
  const [customWinPct, setCustomWinPct] = useState<number>(56.5);
  const [customOdds, setCustomOdds] = useState<number>(-110);

  // Filter games for straight line testing
  const filteredStraightGames = useMemo(() => {
    if (straightTierFilter === 'megaEdge') {
      return games.filter(g => g.spreadEdgeAbs >= 7.0);
    } else if (straightTierFilter === 'highEdge') {
      return games.filter(g => g.spreadEdgeAbs >= 5.0);
    } else if (straightTierFilter === 'dogs') {
      return games.filter(g => g.modelAtsSide === 'Dog' && g.spreadEdgeAbs >= 4.0);
    }
    return games;
  }, [games, straightTierFilter]);

  // Compute straight metrics across filtered games with current juice
  const straightMetrics = useMemo(() => {
    let wins = 0, losses = 0, pushes = 0;
    for (const g of filteredStraightGames) {
      if (g.ats === 'Win') wins++;
      else if (g.ats === 'Loss') losses++;
      else if (g.ats === 'Push') pushes++;
    }
    return calculateCustomStraightMetrics(wins, losses, pushes, selectedJuice);
  }, [filteredStraightGames, selectedJuice]);

  // Parlay simulation results across 3,174 games
  const parlayResults = useMemo(() => {
    return simulateParlays(games);
  }, [games]);

  // Teaser simulation results
  const teaserResults = useMemo(() => {
    return simulateTeasers(games);
  }, [games]);

  // Kelly calculation
  const kellyCalc = useMemo(() => {
    return calculateKellyStake(customWinPct, customOdds, bankroll, kellyFraction);
  }, [customWinPct, customOdds, bankroll, kellyFraction]);

  return (
    <div id="betting-lab-container" className="space-y-4">
      {/* Top Banner: Mathematical Edge & ROI Overview */}
      <div id="betting-lab-header" className="p-3 bg-[#131924] border border-[#1e293b] rounded text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono uppercase font-bold text-emerald-400 tracking-wider">Quantitative ROI & Betting Math Engine</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Backtested on {games.length.toLocaleString()} College Football Matchups (2022–2025)</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-slate-400">Standard Break-Even: <strong className="text-amber-400">52.38% (-110)</strong></span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Reduced Juice Break-Even: <strong className="text-emerald-400">51.22% (-105)</strong></span>
        </div>
      </div>

      {/* Grid: Straight Line Pricing Matrix & Kelly Bankroll Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Straight Line Pricing Simulator (7 cols) */}
        <div id="straight-pricing-card" className="lg:col-span-7 p-3.5 bg-[#0f141f] border border-[#1e293b] rounded">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-cyan-400 font-bold">1.</span> Straight Line Pricing & Juice Impact Simulator
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Simulate historical returns under various sportsbook price models (-105 reduced juice to -115 sharp).
              </p>
            </div>
            <div className="flex gap-1">
              {[
                { id: 'highEdge', label: '≥5.0 Edge' },
                { id: 'megaEdge', label: '≥7.0 Mega' },
                { id: 'dogs', label: 'Dog Discrepancy' },
                { id: 'all', label: 'All 3.1k' },
              ].map(t => (
                <button
                  key={t.id}
                  id={`filter-tier-${t.id}`}
                  onClick={() => setStraightTierFilter(t.id as any)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                    straightTierFilter === t.id
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-[#151c2a] border-[#222f44] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Buttons */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { odds: -105, label: '-105 (Reduced Juice / Pinnacle / Circa)', breakEven: '51.22%' },
              { odds: -108, label: '-108 (Low Juice Book)', breakEven: '51.92%' },
              { odds: -110, label: '-110 (Standard Vegas Market)', breakEven: '52.38%' },
              { odds: -115, label: '-115 (Expensive Retail Line)', breakEven: '53.49%' },
              { odds: 100, label: '+100 (Even Money / Zero Vigorish)', breakEven: '50.00%' },
            ].map(p => (
              <button
                key={p.odds}
                id={`price-btn-${p.odds}`}
                onClick={() => setSelectedJuice(p.odds)}
                className={`flex-1 min-w-[120px] p-1.5 rounded border text-left font-mono text-[10px] transition-all ${
                  selectedJuice === p.odds
                    ? 'bg-cyan-900/40 border-cyan-400 text-white shadow-sm'
                    : 'bg-[#141a27] border-[#1f293d] text-slate-400 hover:bg-[#192233]'
                }`}
              >
                <div className="font-bold text-slate-200">{p.label}</div>
                <div className="text-[9px] text-slate-500">BE: {p.breakEven}</div>
              </button>
            ))}
          </div>

          {/* Key Simulation Output KPI Cards */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="p-2 bg-[#141b28] border border-[#1e2a3e] rounded">
              <div className="text-[10px] text-slate-400 font-mono">Sample Bets</div>
              <div className="text-base font-mono font-bold text-white mt-0.5">
                {straightMetrics.decisive} <span className="text-[10px] text-slate-500 font-normal">({straightMetrics.wins}-{straightMetrics.losses})</span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">+{straightMetrics.pushes} pushes</div>
            </div>

            <div className="p-2 bg-[#141b28] border border-[#1e2a3e] rounded">
              <div className="text-[10px] text-slate-400 font-mono">Actual Win %</div>
              <div className={`text-base font-mono font-bold mt-0.5 ${
                straightMetrics.winPct >= 55 ? 'text-emerald-400' : straightMetrics.winPct >= 52.4 ? 'text-cyan-300' : 'text-rose-400'
              }`}>
                {straightMetrics.winPct.toFixed(1)}%
              </div>
              <div className="text-[9px] text-emerald-400/80 font-mono">
                {straightMetrics.edgePct >= 0 ? `+${straightMetrics.edgePct.toFixed(1)}% vs BE` : `${straightMetrics.edgePct.toFixed(1)}%`}
              </div>
            </div>

            <div className="p-2 bg-[#141b28] border border-[#1e2a3e] rounded">
              <div className="text-[10px] text-slate-400 font-mono">Profit Units (1u = $100)</div>
              <div className={`text-base font-mono font-bold mt-0.5 ${
                straightMetrics.unitProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {straightMetrics.unitProfit >= 0 ? `+${straightMetrics.unitProfit.toFixed(1)}u` : `${straightMetrics.unitProfit.toFixed(1)}u`}
              </div>
              <div className="text-[9px] text-slate-500 font-mono">${straightMetrics.totalProfitDollars.toLocaleString()} net</div>
            </div>

            <div className="p-2 bg-[#141b28] border border-[#1e2a3e] rounded">
              <div className="text-[10px] text-slate-400 font-mono">Simulated ROI</div>
              <div className={`text-base font-mono font-bold mt-0.5 ${
                straightMetrics.roi >= 5 ? 'text-emerald-400' : straightMetrics.roi >= 0 ? 'text-cyan-300' : 'text-rose-400'
              }`}>
                {straightMetrics.roi >= 0 ? `+${straightMetrics.roi.toFixed(1)}%` : `${straightMetrics.roi.toFixed(1)}%`}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">Price: {selectedJuice > 0 ? `+${selectedJuice}` : selectedJuice}</div>
            </div>
          </div>

          <div className="p-2 bg-[#0a0d14] rounded border border-[#1b2333] text-[10px] text-slate-400 leading-relaxed font-mono">
            <span className="text-cyan-400 font-bold">💡 Line Shopping Edge:</span> Moving from -110 standard juice to -105 reduced juice increases total portfolio ROI by <strong className="text-emerald-400">+2.3%</strong> across sample plays, adding pure profit with zero change in model win rate.
          </div>
        </div>

        {/* Kelly Criterion Bankroll Sizing & Risk Management (5 cols) */}
        <div id="kelly-sizing-card" className="lg:col-span-5 p-3.5 bg-[#0f141f] border border-[#1e293b] rounded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">2.</span> Kelly Bankroll Optimizer
              </h3>
              <span className="px-1.5 py-0.5 bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[9px] font-mono rounded">
                Risk-Adjusted Sizing
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Calculate optimal bet sizing to maximize long-term bankroll growth while avoiding drawdown ruin.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Bankroll ($):</label>
                <input
                  type="number"
                  value={bankroll}
                  onChange={(e) => setBankroll(Math.max(100, Number(e.target.value)))}
                  className="w-full bg-[#151c29] border border-[#222e42] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Model Win Prob (%):</label>
                <input
                  type="number"
                  step="0.5"
                  value={customWinPct}
                  onChange={(e) => setCustomWinPct(Number(e.target.value))}
                  className="w-full bg-[#151c29] border border-[#222e42] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Market Line Odds:</label>
                <select
                  value={customOdds}
                  onChange={(e) => setCustomOdds(Number(e.target.value))}
                  className="w-full bg-[#151c29] border border-[#222e42] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={-105}>-105 (Reduced)</option>
                  <option value={-110}>-110 (Standard)</option>
                  <option value={-115}>-115 (Sharp)</option>
                  <option value={100}>+100 (Even)</option>
                  <option value={120}>+120 (Small Dog)</option>
                  <option value={150}>+150 (Underdog)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Fractional Kelly:</label>
                <select
                  value={kellyFraction}
                  onChange={(e) => setKellyFraction(Number(e.target.value))}
                  className="w-full bg-[#151c29] border border-[#222e42] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={0.25}>1/4 Kelly (Conservative / Recommended)</option>
                  <option value={0.33}>1/3 Kelly (Balanced)</option>
                  <option value={0.50}>1/2 Kelly (Aggressive)</option>
                  <option value={1.00}>Full Kelly (High Volatility)</option>
                </select>
              </div>
            </div>

            {/* Kelly Results Output */}
            <div className="p-2.5 bg-[#141a27] border border-[#1f293d] rounded space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Expected Value (EV):</span>
                <span className={`font-bold ${kellyCalc.expectedValuePct > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {kellyCalc.expectedValuePct > 0 ? `+${kellyCalc.expectedValuePct.toFixed(1)}%` : `${kellyCalc.expectedValuePct.toFixed(1)}%`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Recommended Bet Size (% of Bankroll):</span>
                <span className="font-bold text-amber-300">{kellyCalc.recommendedFractionPct.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#1e283b]">
                <span className="text-white font-bold">Suggested Stake Amount:</span>
                <span className="text-sm font-bold text-emerald-400">${kellyCalc.stakeDollars.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 text-[9px] text-slate-500 font-mono">
            *Quarter-Kelly is standardly used by quantitative syndicates to protect against estimation variance and downswings.
          </div>
        </div>
      </div>

      {/* Grid: Parlay Backtester & Teaser Backtester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Parlay Historical Backtester */}
        <div id="parlay-backtester-card" className="p-3.5 bg-[#0f141f] border border-[#1e293b] rounded">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-purple-400 font-bold">3.</span> Multi-Leg Weekly Parlay Backtester
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Simulating weekly parlays formed by combining the highest FEI spread edge plays across 82 game weeks.
              </p>
            </div>
            <span className="px-2 py-0.5 bg-purple-950/70 border border-purple-800 text-purple-300 font-mono text-[9px] rounded font-bold">
              Multi-Leg Alpha
            </span>
          </div>

          <div className="space-y-2 mt-3">
            {/* 2-Leg Parlay */}
            <div className="p-2.5 bg-[#141a27] border border-[#1e283c] rounded font-mono">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> 2-Leg Top Edge Parlay (+264 Standard Payout)
                </span>
                <span className="text-[10px] text-slate-400">Break-Even: {parlayResults.parlay2Leg.breakEvenWinPct}%</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] pt-1">
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Tickets</div>
                  <div className="font-bold text-slate-200 mt-0.5">{parlayResults.parlay2Leg.totalTickets} ({parlayResults.parlay2Leg.winningTickets} W)</div>
                </div>
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Win Rate</div>
                  <div className={`font-bold mt-0.5 ${parlayResults.parlay2Leg.winRate >= parlayResults.parlay2Leg.breakEvenWinPct ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {parlayResults.parlay2Leg.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Net Units</div>
                  <div className={`font-bold mt-0.5 ${parlayResults.parlay2Leg.profitUnits >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {parlayResults.parlay2Leg.profitUnits >= 0 ? `+${parlayResults.parlay2Leg.profitUnits.toFixed(1)}u` : `${parlayResults.parlay2Leg.profitUnits.toFixed(1)}u`}
                  </div>
                </div>
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Parlay ROI</div>
                  <div className={`font-bold mt-0.5 ${parlayResults.parlay2Leg.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {parlayResults.parlay2Leg.roi >= 0 ? `+${parlayResults.parlay2Leg.roi.toFixed(1)}%` : `${parlayResults.parlay2Leg.roi.toFixed(1)}%`}
                  </div>
                </div>
              </div>
            </div>

            {/* 3-Leg Parlay */}
            <div className="p-2.5 bg-[#141a27] border border-[#1e283c] rounded font-mono">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> 3-Leg Top Edge Parlay (+596 Standard Payout)
                </span>
                <span className="text-[10px] text-slate-400">Break-Even: {parlayResults.parlay3Leg.breakEvenWinPct}%</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] pt-1">
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Tickets</div>
                  <div className="font-bold text-slate-200 mt-0.5">{parlayResults.parlay3Leg.totalTickets} ({parlayResults.parlay3Leg.winningTickets} W)</div>
                </div>
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Win Rate</div>
                  <div className={`font-bold mt-0.5 ${parlayResults.parlay3Leg.winRate >= parlayResults.parlay3Leg.breakEvenWinPct ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {parlayResults.parlay3Leg.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Net Units</div>
                  <div className={`font-bold mt-0.5 ${parlayResults.parlay3Leg.profitUnits >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {parlayResults.parlay3Leg.profitUnits >= 0 ? `+${parlayResults.parlay3Leg.profitUnits.toFixed(1)}u` : `${parlayResults.parlay3Leg.profitUnits.toFixed(1)}u`}
                  </div>
                </div>
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Parlay ROI</div>
                  <div className={`font-bold mt-0.5 ${parlayResults.parlay3Leg.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {parlayResults.parlay3Leg.roi >= 0 ? `+${parlayResults.parlay3Leg.roi.toFixed(1)}%` : `${parlayResults.parlay3Leg.roi.toFixed(1)}%`}
                  </div>
                </div>
              </div>
            </div>

            {/* 4-Leg Parlay */}
            <div className="p-2.5 bg-[#141a27] border border-[#1e283c] rounded font-mono">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> 4-Leg Top Edge Parlay (+1228 Standard Payout)
                </span>
                <span className="text-[10px] text-slate-400">Break-Even: {parlayResults.parlay4Leg.breakEvenWinPct}%</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] pt-1">
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Tickets</div>
                  <div className="font-bold text-slate-200 mt-0.5">{parlayResults.parlay4Leg.totalTickets} ({parlayResults.parlay4Leg.winningTickets} W)</div>
                </div>
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Win Rate</div>
                  <div className={`font-bold mt-0.5 ${parlayResults.parlay4Leg.winRate >= parlayResults.parlay4Leg.breakEvenWinPct ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {parlayResults.parlay4Leg.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Net Units</div>
                  <div className={`font-bold mt-0.5 ${parlayResults.parlay4Leg.profitUnits >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {parlayResults.parlay4Leg.profitUnits >= 0 ? `+${parlayResults.parlay4Leg.profitUnits.toFixed(1)}u` : `${parlayResults.parlay4Leg.profitUnits.toFixed(1)}u`}
                  </div>
                </div>
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Parlay ROI</div>
                  <div className={`font-bold mt-0.5 ${parlayResults.parlay4Leg.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {parlayResults.parlay4Leg.roi >= 0 ? `+${parlayResults.parlay4Leg.roi.toFixed(1)}%` : `${parlayResults.parlay4Leg.roi.toFixed(1)}%`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2.5 p-2 bg-[#0a0d14] rounded border border-[#1b2333] text-[10px] text-slate-400 leading-relaxed font-mono">
            <span className="text-purple-400 font-bold">⚠️ Mathematical Takeaway:</span> Compounding standard juice across legs multiplies sportsbook hold. Straight betting high-edge single tiers generates substantially higher risk-adjusted Sharpe ratio than multi-leg parlays.
          </div>
        </div>

        {/* Teaser Historical Backtester */}
        <div id="teaser-backtester-card" className="p-3.5 bg-[#0f141f] border border-[#1e293b] rounded">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">4.</span> College Football Teaser Backtester
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Testing +6.0, +6.5, and +7.0 pt adjustments on games matching FEI directional model edge.
              </p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-mono text-[9px] rounded font-bold">
              Line Teasing
            </span>
          </div>

          <div className="space-y-2 mt-3 font-mono text-[11px]">
            {/* 6.0 pt Teaser */}
            <div className="p-2.5 bg-[#141a27] border border-[#1e283c] rounded">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> +6.0 Point Teaser Adjustment
                </span>
                <span className="text-[10px] text-slate-400">Sample: {teaserResults.t6.legsWon + teaserResults.t6.legsLost} legs</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">Individual Leg Win %</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{teaserResults.t6.legWinRate.toFixed(1)}%</div>
                  <div className="text-[9px] text-slate-500">({teaserResults.t6.legsWon}-{teaserResults.t6.legsLost})</div>
                </div>
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">2-Team Ticket Win %</div>
                  <div className="font-bold text-slate-200 mt-0.5">{teaserResults.t6.twoTeamTicketWinRate.toFixed(1)}%</div>
                  <div className="text-[9px] text-slate-500">Hurdle: 54.5% (-120)</div>
                </div>
                <div className="bg-[#0b0e15] p-1.5 rounded border border-[#1a2333]">
                  <div className="text-slate-500">2-Team Teaser ROI</div>
                  <div className={`font-bold mt-0.5 ${teaserResults.t6.twoTeamRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {teaserResults.t6.twoTeamRoi >= 0 ? `+${teaserResults.t6.twoTeamRoi.toFixed(1)}%` : `${teaserResults.t6.twoTeamRoi.toFixed(1)}%`}
                  </div>
                  <div className="text-[9px] text-slate-500">At standard -120</div>
                </div>
              </div>
            </div>

            {/* 6.5 pt & 7.0 pt Teasers */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-[#141a27] border border-[#1e283c] rounded">
                <div className="text-[10px] text-slate-400">+6.5 Point Teaser</div>
                <div className="text-sm font-bold text-white mt-0.5">{teaserResults.t65.legWinRate.toFixed(1)}% <span className="text-[10px] text-slate-500 font-normal">Leg Win Rate</span></div>
                <div className="text-[9px] text-slate-500 mt-1">{teaserResults.t65.legsWon} covers / {teaserResults.t65.legsLost} losses</div>
              </div>

              <div className="p-2.5 bg-[#141a27] border border-[#1e283c] rounded">
                <div className="text-[10px] text-slate-400">+7.0 Point Teaser</div>
                <div className="text-sm font-bold text-white mt-0.5">{teaserResults.t7.legWinRate.toFixed(1)}% <span className="text-[10px] text-slate-500 font-normal">Leg Win Rate</span></div>
                <div className="text-[9px] text-slate-500 mt-1">{teaserResults.t7.legsWon} covers / {teaserResults.t7.legsLost} losses</div>
              </div>
            </div>

            {/* Wong Corridor Backtest */}
            <div className="p-2.5 bg-[#141a27] border border-amber-900/40 rounded">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-amber-300">Wong Corridor Subset (Teasing Dogs +1.5 to +3.5 & Favs -7.5 to -9.5):</span>
                <span className="text-xs font-bold text-white">{teaserResults.wong.legWinRate.toFixed(1)}% Leg Win Rate</span>
              </div>
              <div className="text-[9px] text-slate-400 mt-1">
                Sample: {teaserResults.wong.sampleSize} games crossing key scoring margins 3, 4, 6, and 7.
              </div>
            </div>
          </div>

          <div className="mt-2.5 p-2 bg-[#0a0d14] rounded border border-[#1b2333] text-[10px] text-slate-400 leading-relaxed font-mono">
            <span className="text-emerald-400 font-bold">🎯 Quantitative Rule:</span> Unlike NFL where scoring variance is tighter, College Football blowouts create wider tails. To profitably tease in CFB, reserve teasers strictly for low total games (&lt;48 pts) crossing key numbers 3, 4, and 7.
          </div>
        </div>
      </div>
    </div>
  );
};
