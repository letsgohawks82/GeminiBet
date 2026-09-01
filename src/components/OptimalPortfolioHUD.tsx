import React, { useState } from 'react';
import { SlatePortfolioPlan, OptimalPortfolioTicket, BetSlipLeg } from '../types';
import {
  Scale,
  ShieldCheck,
  Zap,
  TrendingUp,
  Coins,
  Copy,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  PieChart,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface OptimalPortfolioHUDProps {
  portfolioPlan: SlatePortfolioPlan;
  totalBankroll: number;
  onSetTotalBankroll: (amt: number) => void;
  unitSize?: number;
  onSetUnitSize?: (val: number) => void;
  bankrollUnits?: number;
  onSetBankrollUnits?: (val: number) => void;
  riskMode: 'auto' | 'balanced' | 'pure_equity' | 'aggressive_alpha';
  onSetRiskMode: (mode: 'auto' | 'balanced' | 'pure_equity' | 'aggressive_alpha') => void;
  onLoadTicketToSlip: (legs: BetSlipLeg[], mode: 'straight' | 'parlay' | 'teaser') => void;
  onLoadAllStraightsToSlip: () => void;
  onLoadFullMasterSlateToSlip: () => void;
}

export const OptimalPortfolioHUD: React.FC<OptimalPortfolioHUDProps> = ({
  portfolioPlan,
  totalBankroll,
  onSetTotalBankroll,
  bankrollUnits = 100,
  onSetBankrollUnits,
  unitSize = 20,
  onSetUnitSize,
  riskMode,
  onSetRiskMode,
  onLoadTicketToSlip,
  onLoadAllStraightsToSlip,
  onLoadFullMasterSlateToSlip,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showTimingGuide, setShowTimingGuide] = useState<boolean>(false);

  const tickets = portfolioPlan?.tickets || [];

  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyAllDirectives = () => {
    if (!portfolioPlan) return;
    const lines = [
      `=== OPTIMAL DIVERSIFIED SLATE PORTFOLIO ===`,
      `Bankroll: $${totalBankroll.toLocaleString()} | Projected ROI: +${portfolioPlan.projectedSlateRoiPct}% | Diversification: ${portfolioPlan.diversificationScore}/100`,
      `Allocation: Straights $${portfolioPlan.straightBudgetDollars} (${portfolioPlan.straightBudgetPct}%) | Parlays $${portfolioPlan.parlayBudgetDollars} (${portfolioPlan.parlayBudgetPct}%) | Teasers $${portfolioPlan.teaserBudgetDollars} (${portfolioPlan.teaserBudgetPct}%)`,
      '',
      '--- EXACT BET TICKETS & TIMING DIRECTIVES ---',
      ...tickets.map(
        (t, idx) =>
          `[Ticket #${idx + 1}] ${t.exactDirective} | STAKE: $${t.allocatedDollars} (${t.allocatedUnits}u) | Grade: ${t.grade} | TIMING: ${t.timingWindow || 'Early-Week'} [${t.urgency || 'LOCK'}] | Est ROI: +${t.expectedRoiPct}%`
      ),
    ];

    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n'));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  if (!portfolioPlan) return null;

  return (
    <div
      id="optimal-portfolio-hud"
      className="p-4 bg-gradient-to-r from-[#0d1424] via-[#101b30] to-[#0c1524] border-2 border-cyan-500/50 rounded-xl shadow-2xl font-mono space-y-3 relative overflow-hidden"
    >
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-72 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold border border-cyan-400/40 shadow-inner">
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                Optimal Slate Portfolio & Auto-Allocation AI
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500 rounded font-black tracking-wide flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 0-Click Auto-Optimized
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans">
              Mathematically balanced multi-ticket slate. Auto-allocates bankroll and guards against game-cluster correlation risks.
            </p>
          </div>
        </div>

        {/* 1-Click Fast Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTimingGuide(!showTimingGuide)}
            className="px-2.5 py-1.5 bg-[#172236] hover:bg-[#21304d] text-amber-300 border border-amber-500/40 rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{showTimingGuide ? 'Hide Timing Guide' : 'When To Place Bets?'}</span>
          </button>

          <button
            id="btn-copy-master-slate"
            onClick={handleCopyAllDirectives}
            className="px-3 py-1.5 bg-[#172236] hover:bg-[#21304d] text-cyan-300 border border-cyan-700/60 rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Copy all bet actions to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedAll ? 'Copied Full Slate!' : 'Copy Slate Text'}</span>
          </button>

          <button
            id="btn-load-master-slate-slip"
            onClick={onLoadFullMasterSlateToSlip}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 rounded text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Load Master Slate</span>
          </button>
        </div>
      </div>

      {/* Expandable Timing Intelligence Guide */}
      {showTimingGuide && (
        <div className="p-3 bg-[#080e1b] border border-amber-500/50 rounded-lg text-xs space-y-2 relative z-10 text-slate-200">
          <div className="flex items-center gap-1.5 font-bold text-amber-300 uppercase tracking-wider">
            <Clock className="w-4 h-4" /> Market Timing & Execution Strategy (When to Place Each Bet)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] pt-1">
            <div className="p-2 bg-[#0d1527] border border-cyan-800 rounded">
              <span className="font-bold text-cyan-400 block">⚡ Early-Week Open (Mon–Tue)</span>
              <p className="text-slate-400 mt-1">
                <strong>Lock immediately:</strong> Key numbers (3, 7, 10) on A+ favorites & teasers. Sharp limits open early; beat the public before juice inflates.
              </p>
            </div>
            <div className="p-2 bg-[#0d1527] border border-blue-800 rounded">
              <span className="font-bold text-blue-400 block">📈 Mid-Week Steam (Wed–Thu)</span>
              <p className="text-slate-400 mt-1">
                <strong>Follow steam:</strong> Betting limits double on Wednesday. Enter positions where syndicate volume aligns with FEI projected margin.
              </p>
            </div>
            <div className="p-2 bg-[#0d1527] border border-purple-800 rounded">
              <span className="font-bold text-purple-400 block">🎯 Late Public Buyback (Sat AM)</span>
              <p className="text-slate-400 mt-1">
                <strong>Wait for peak points:</strong> Heavy recreational money inflates favorites on Saturday morning. Buy underdogs right before kick for maximum points.
              </p>
            </div>
            <div className="p-2 bg-[#0d1527] border border-amber-800 rounded">
              <span className="font-bold text-amber-400 block">⏳ Weather/Injury Radar (Sat Walkthrough)</span>
              <p className="text-slate-400 mt-1">
                <strong>Wait for confirmation:</strong> Island/neutral games & Totals depend on morning wind gusts and QB status. Confirm before placing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10 pt-1">
        <div className="p-2.5 bg-[#090e18] border border-[#1b273d] rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">Projected Slate ROI</span>
          <span className="text-base font-black text-emerald-400">+{portfolioPlan.projectedSlateRoiPct}%</span>
          <span className="text-[9px] text-slate-400 block">Historical multi-year backtest</span>
        </div>

        <div className="p-2.5 bg-[#090e18] border border-[#1b273d] rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">Diversification Score</span>
          <span className="text-base font-black text-cyan-300">{portfolioPlan.diversificationScore}/100</span>
          <span className="text-[9px] text-emerald-400 block">✓ Anti-Cluster Shield Active</span>
        </div>

        <div className="p-2.5 bg-[#090e18] border border-[#1b273d] rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">Total Planned Stake</span>
          <div className="flex items-center gap-1">
            <span className="text-base font-black text-white">${portfolioPlan.totalAllocatedDollars}</span>
            <span className="text-[10px] text-amber-400 font-bold">({portfolioPlan.totalAllocatedUnits}u)</span>
          </div>
          <span className="text-[9px] text-slate-400 block">Of ${totalBankroll.toLocaleString()} Bankroll</span>
        </div>

        <div className="p-2.5 bg-[#090e18] border border-[#1b273d] rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">Active Slate Tickets</span>
          <span className="text-base font-black text-amber-300">{tickets.length} Optimal Tickets</span>
          <span className="text-[9px] text-slate-400 block">
            {tickets.filter((t) => t.ticketType === 'straight').length} Straight •{' '}
            {tickets.filter((t) => t.ticketType === 'parlay').length} Parlay •{' '}
            {tickets.filter((t) => t.ticketType === 'teaser').length} Teaser
          </span>
        </div>
      </div>

      {/* Allocation Breakdown Progress Bar */}
      <div className="space-y-1.5 p-2.5 bg-[#080d17] border border-[#182338] rounded-lg relative z-10">
        <div className="flex flex-wrap items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-white uppercase">Optimal Asset Allocation:</span>
            <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Straights: ${portfolioPlan.straightBudgetDollars} ({portfolioPlan.straightBudgetPct}%)
            </span>
            <span className="text-[10px] text-purple-400 flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Parlays: ${portfolioPlan.parlayBudgetDollars} ({portfolioPlan.parlayBudgetPct}%)
            </span>
            <span className="text-[10px] text-amber-400 flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Teasers: ${portfolioPlan.teaserBudgetDollars} ({portfolioPlan.teaserBudgetPct}%)
            </span>
          </div>

          {/* Quick Bankroll & Risk Mode Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400">Risk:</span>
              <select
                value={riskMode}
                onChange={(e) => onSetRiskMode(e.target.value as any)}
                className="bg-[#121927] border border-[#22304a] text-cyan-300 font-bold rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-cyan-400"
              >
                <option value="auto">⚡ Auto-AI</option>
                <option value="balanced">Balanced (60/25/15)</option>
                <option value="pure_equity">Conservative (75/15/10)</option>
                <option value="aggressive_alpha">Aggressive (45/35/20)</option>
              </select>
            </div>

            {/* Bankroll Units Selector (25-50-75-100u) */}
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400">Bankroll:</span>
              <div className="flex items-center gap-0.5 bg-[#121927] p-0.5 rounded border border-[#22304a]">
                {[25, 50, 75, 100].map((units) => (
                  <button
                    key={units}
                    type="button"
                    onClick={() => {
                      if (onSetBankrollUnits) onSetBankrollUnits(units);
                      onSetTotalBankroll(units * (unitSize || 20));
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                      (bankrollUnits || 100) === units
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={`${units}u = $${(units * (unitSize || 20)).toLocaleString()}`}
                  >
                    {units}u
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400">Unit:</span>
              <select
                value={unitSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (onSetUnitSize) onSetUnitSize(val);
                  onSetTotalBankroll((bankrollUnits || 100) * val);
                }}
                className="bg-[#121927] border border-emerald-500/50 text-emerald-300 font-bold rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-emerald-400"
              >
                <option value={5}>$5</option>
                <option value={10}>$10</option>
                <option value={20}>$20</option>
                <option value={25}>$25</option>
                <option value={50}>$50</option>
                <option value={100}>$100</option>
              </select>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
              <span>(Total: <strong className="text-white">${((bankrollUnits || 100) * (unitSize || 20)).toLocaleString()}</strong>)</span>
            </div>
          </div>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="h-2 w-full bg-[#141d2e] rounded-full overflow-hidden flex">
          <div
            style={{ width: `${portfolioPlan.straightBudgetPct}%` }}
            className="h-full bg-cyan-400 transition-all duration-500"
            title={`Straights: ${portfolioPlan.straightBudgetPct}%`}
          />
          <div
            style={{ width: `${portfolioPlan.parlayBudgetPct}%` }}
            className="h-full bg-purple-500 transition-all duration-500"
            title={`Parlays: ${portfolioPlan.parlayBudgetPct}%`}
          />
          <div
            style={{ width: `${portfolioPlan.teaserBudgetPct}%` }}
            className="h-full bg-amber-400 transition-all duration-500"
            title={`Teasers: ${portfolioPlan.teaserBudgetPct}%`}
          />
        </div>
      </div>

      {/* Pre-Engineered Optimal Tickets Grid */}
      <div className="space-y-2 relative z-10 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              Exact Optimal Bet Tickets (Pre-Calculated & Ranked)
            </span>
            <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              {tickets.length} Active Tickets
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLoadAllStraightsToSlip}
              className="text-[10px] text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded hover:bg-cyan-900/60 transition-colors"
            >
              + Load Straights to Slip
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[10px] text-slate-400 hover:text-white underline"
            >
              {isExpanded ? 'Collapse Tickets' : 'Expand Tickets'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticketId}
                className="p-3 bg-[#0a0f1c] border border-[#1e2a40] hover:border-cyan-500/60 rounded-lg flex flex-col justify-between space-y-2 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase ${
                        ticket.ticketType === 'straight'
                          ? 'bg-cyan-950 border-cyan-600 text-cyan-300'
                          : ticket.ticketType === 'parlay'
                          ? 'bg-purple-950 border-purple-600 text-purple-300'
                          : 'bg-amber-950 border-amber-600 text-amber-300'
                      }`}
                    >
                      {ticket.ticketType}
                    </span>

                    <div className="flex items-center gap-1 text-[9px]">
                      <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded font-bold">
                        +{ticket.expectedRoiPct}% ROI
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-800 text-white rounded font-bold">
                        Grade {ticket.grade}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-[11px] font-bold text-white line-clamp-1">{ticket.title}</h4>

                  {/* Timing & Execution Badge */}
                  <div className="mt-1 flex items-center justify-between gap-1 text-[9px] bg-[#0f172a] px-2 py-1 rounded border border-[#243350]">
                    <span className="text-cyan-300 font-bold flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      {ticket.timingWindow || '⚡ Early-Week Open'}
                    </span>
                    <span className="text-amber-400 font-black">
                      {ticket.urgency || 'IMMEDIATE LOCK'}
                    </span>
                  </div>

                  {/* Directive Box */}
                  <div className="my-1.5 p-1.5 bg-[#05080f] border border-[#182338] rounded text-[10px]">
                    <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-amber-400" /> Action:
                    </div>
                    <div className="text-white font-bold leading-tight line-clamp-2">{ticket.exactDirective}</div>
                  </div>

                  {/* Stake & Payout */}
                  <div className="grid grid-cols-3 gap-1 text-[9px] text-center bg-[#111726] p-1.5 rounded border border-[#1b253b]">
                    <div>
                      <span className="text-slate-400 block text-[8px]">Stake</span>
                      <span className="font-bold text-amber-300">${ticket.allocatedDollars} ({ticket.allocatedUnits}u)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[8px]">Odds</span>
                      <span className="font-bold text-white">
                        {ticket.oddsAmerican > 0 ? `+${ticket.oddsAmerican}` : ticket.oddsAmerican}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[8px]">Potential Payout</span>
                      <span className="font-bold text-emerald-400">${ticket.potentialPayoutDollars}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => handleCopy(ticket.exactDirective, ticket.ticketId)}
                    className="flex-1 py-1 bg-[#151e30] hover:bg-[#1e2a44] text-slate-300 hover:text-white rounded text-[10px] font-bold transition-colors text-center"
                  >
                    {copiedId === ticket.ticketId ? 'Copied!' : 'Copy'}
                  </button>

                  <button
                    onClick={() => onLoadTicketToSlip(ticket.legs, ticket.ticketType)}
                    className={`flex-2 py-1 px-2 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                      ticket.ticketType === 'straight'
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : ticket.ticketType === 'parlay'
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-black'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Load to Slip</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
