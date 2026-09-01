import React from 'react';
import {
  HelpCircle,
  X,
  Target,
  Sparkles,
  Zap,
  ShieldCheck,
  Scale,
  TrendingUp,
  Store,
  Calculator,
  CheckCircle2,
} from 'lucide-react';

interface BeginnerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BeginnerGuideModal: React.FC<BeginnerGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-[#0f172a] border-2 border-cyan-500/60 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8 relative text-slate-200 font-sans animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg shadow-cyan-500/20">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                College Football Betting 101 & Terminal Guide
              </h2>
              <p className="text-xs text-cyan-300 font-mono">
                Everything you need to understand every pick, line, and number in 2 minutes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: The Core Concept (What is Edge?) */}
        <div className="p-4 bg-[#1e293b]/70 border border-cyan-800/60 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm uppercase tracking-wide font-mono">
            <Target className="w-4 h-4 text-emerald-400" />
            1. What is "Spread Edge" and How Does the Model Find Picks?
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sportsbooks (like DraftKings and FanDuel) set a point spread. For example,{' '}
            <strong className="text-white">TCU -3.5</strong> means TCU is expected to win by 3.5 points.
          </p>
          <div className="p-3 bg-[#0b0f19] rounded-lg border border-slate-700 font-mono text-xs space-y-1">
            <div className="text-slate-400">
              • <strong className="text-cyan-300">Vegas Line:</strong> TCU -3.5 (needs to win by 4+)
            </div>
            <div className="text-slate-400">
              • <strong className="text-emerald-400">FEI Computer Math Model:</strong> TCU is projected to win by{' '}
              <strong className="text-white">+8.5 points</strong>.
            </div>
            <div className="text-amber-300 font-bold">
              • The Difference = 5.0 Point Edge (+5.0 pts)!
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Across 3,170+ historical college football games, bets with an edge of{' '}
            <strong className="text-emerald-400">5.0+ points</strong> have won over <strong className="text-white">60% of the time</strong>, producing huge long-term profits.
          </p>
        </div>

        {/* Section 2: The 3 Main Bet Types */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            2. The 3 Types of Bets You Can Make
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Straight */}
            <div className="p-3.5 bg-[#131b2e] border border-blue-800/60 rounded-xl space-y-2">
              <div className="font-bold text-blue-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Straight Bet (Single)
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                The standard, safest bet. You bet on <strong>one game</strong>. If your team covers the spread, you win!
              </p>
              <div className="text-[10px] text-slate-400 font-mono bg-[#0b0e17] p-1.5 rounded">
                Example: TCU -3.5 ($100 wins $91)
              </div>
            </div>

            {/* Parlay */}
            <div className="p-3.5 bg-[#1f132e] border border-purple-800/60 rounded-xl space-y-2">
              <div className="font-bold text-purple-400 font-mono flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Parlay (Combo)
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Combines 2 or more picks into one ticket. <strong>All must win</strong>, but you get a massive payout!
              </p>
              <div className="text-[10px] text-purple-300 font-mono bg-[#0b0e17] p-1.5 rounded">
                Example: TCU -3.5 & NC State -4.5 at +264 ($100 wins $264)
              </div>
            </div>

            {/* Teaser */}
            <div className="p-3.5 bg-[#122e23] border border-emerald-800/60 rounded-xl space-y-2">
              <div className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                6-Point Teaser
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Gives you <strong>6 free points</strong> on your spreads. Turns difficult favorite lines into easy underdog cushions!
              </p>
              <div className="text-[10px] text-emerald-300 font-mono bg-[#0b0e17] p-1.5 rounded">
                Example: TCU -3.5 becomes TCU +2.5
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Best Sportsbook & Line Shopping */}
        <div className="p-4 bg-[#111e2e]/70 border border-slate-700 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-white font-bold font-mono">
            <Store className="w-4 h-4 text-cyan-400" />
            3. Why "Best Book" Line Shopping Matters
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Different apps offer slightly different odds or point spreads. Our terminal continuously evaluates the 5 major sportsbooks:
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="px-2 py-1 bg-slate-800 text-emerald-300 rounded border border-slate-700">DraftKings</span>
            <span className="px-2 py-1 bg-slate-800 text-blue-300 rounded border border-slate-700">FanDuel</span>
            <span className="px-2 py-1 bg-slate-800 text-purple-300 rounded border border-slate-700">theScore</span>
            <span className="px-2 py-1 bg-slate-800 text-amber-300 rounded border border-slate-700">Caesars</span>
            <span className="px-2 py-1 bg-slate-800 text-cyan-300 rounded border border-slate-700">BetRivers</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            If DraftKings gives you TCU -3.0 while others have TCU -3.5, taking it at DraftKings saves you a half-point hook and wins you more games!
          </p>
        </div>

        {/* Section 4: What is a "Unit" and Kelly Sizing? */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#0d1526] border border-slate-800 rounded-xl space-y-1.5">
            <div className="font-bold text-amber-300 font-mono flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              What is a "Unit" (u)?
            </div>
            <p className="text-slate-400 text-[11px]">
              A <strong>Unit</strong> is your standard bet size (usually 1% to 2% of your total budget, e.g. $10 or $25).
              A <strong>1.5u</strong> recommendation means higher confidence, so you bet 1.5 times your standard amount.
            </p>
          </div>

          <div className="p-3 bg-[#0d1526] border border-slate-800 rounded-xl space-y-1.5">
            <div className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              What are EV and ROI?
            </div>
            <p className="text-slate-400 text-[11px]">
              <strong>EV (Expected Value):</strong> The statistical profit edge on the bet. +15% EV means averaging $15 profit per $100 bet.
              <br />
              <strong>ROI:</strong> Historical return on investment from similar bets in our database.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Got It! Take Me to the Picks →
          </button>
        </div>
      </div>
    </div>
  );
};
