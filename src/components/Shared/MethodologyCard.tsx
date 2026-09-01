// src/components/Shared/MethodologyCard.tsx
import React from 'react';
import { Scale, TrendingUp, ShieldCheck, Zap, X } from 'lucide-react';

interface BeginnerCheatSheetProps {
  onDismiss?: () => void;
}

export const BeginnerCheatSheet: React.FC<BeginnerCheatSheetProps> = ({ onDismiss }) => {
  return (
    <div id="beginner-cheat-sheet" className="p-3.5 bg-[#0b1220] border border-cyan-800/70 rounded-xl space-y-3 font-sans shadow-lg text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-mono">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-600 rounded text-[10px] font-bold uppercase">
            Beginner Cheat Sheet
          </span>
          <span className="font-bold text-white text-xs">
            How to understand the 4 betting areas:
          </span>
        </div>
        {onDismiss && (
          <button
            id="btn-dismiss-cheat-sheet"
            onClick={onDismiss}
            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Dismiss</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-2.5 bg-[#121c30] border border-blue-900/60 rounded-lg space-y-1">
          <div className="font-mono font-bold text-cyan-300 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" />
            Area 1: Portfolio Game Plan
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Splits your weekly budget across safe straight bets and fun combo tickets so no single loss hurts you.
          </p>
        </div>

        <div className="p-2.5 bg-[#1e1430] border border-purple-900/60 rounded-lg space-y-1">
          <div className="font-mono font-bold text-purple-300 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Area 2: High-Payout Parlays
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Combines 2-3 games where all must win. Pays out higher upside multipliers with disciplined unit stakes.
          </p>
        </div>

        <div className="p-2.5 bg-[#261f10] border border-amber-900/60 rounded-lg space-y-1">
          <div className="font-mono font-bold text-amber-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Area 3: 6-Pt Teaser Cushions
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Adds 6 safety points to each spread to cross key football thresholds (3, 4, 6, 7) for higher cover rates.
          </p>
        </div>

        <div className="p-2.5 bg-[#0e1f18] border border-emerald-900/60 rounded-lg space-y-1">
          <div className="font-mono font-bold text-emerald-300 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Area 4: Straight Bets
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            The foundation single-game bets. We highlight the exact team, target line, and best available sportsbook.
          </p>
        </div>
      </div>
    </div>
  );
};
