// src/components/SlatePortfolioOptimizer.tsx
import React, { useState, useMemo } from 'react';
import { Pick2026, BetSlipLeg, CalibrationGateReport } from '../types';
import { useLiveOdds } from '../context/LiveOddsContext';
import { computeWalkForwardCalibrationReport, generatePricingComparisonSlate } from '../services/pricingEngineService';
import { CalibrationGateBanner } from './CalibrationGateBanner';
import { PricingComparisonTable } from './PricingComparisonTable';
import {
  Lock,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Layers,
  Scale,
  Sparkles,
  Info,
} from 'lucide-react';

interface SlatePortfolioOptimizerProps {
  userBets?: any[];
  onUpdateBets?: (bets: any[]) => void;
  onNavigateToLedger?: () => void;
  onLoadTicketToSlip?: (legs: BetSlipLeg[], mode: 'straight' | 'parlay' | 'teaser') => void;
  unitSize?: number;
  onSetUnitSize?: (val: number) => void;
  bankrollUnits?: number;
  onSetBankrollUnits?: (val: number) => void;
}

export const SlatePortfolioOptimizer: React.FC<SlatePortfolioOptimizerProps> = ({
  userBets,
  onUpdateBets,
  onNavigateToLedger,
  onLoadTicketToSlip,
  unitSize = 20,
  onSetUnitSize,
  bankrollUnits = 100,
  onSetBankrollUnits,
}) => {
  const { getPicks } = useLiveOdds();
  const [gateReport] = useState<CalibrationGateReport>(() => computeWalkForwardCalibrationReport());
  const [comparisonItems] = useState(() => generatePricingComparisonSlate());

  const isLocked = gateReport.gateStatus === 'LOCKED';

  return (
    <div className="space-y-6">
      {/* Calibration Gate Locked Master Banner */}
      <CalibrationGateBanner report={gateReport} />

      {/* Structural Gate Explanation Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white font-mono uppercase tracking-wide">
              Quantitative Portfolio Optimization & Kelly Sizing Disabled
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              In accordance with statistical rigor, automated bet recommendations, Kelly bankroll sizing, and multi-ticket portfolio optimization are deactivated until the underlying pricing model passes the out-of-sample calibration gate.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 text-xs font-mono">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
              <span>Why is sizing locked?</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Kelly sizing on unvalidated probabilities leads to catastrophic bankroll drawdown when the model does not beat de-vigged closing lines.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
              <span>Market Blend Weight (λ)</span>
              <Scale className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Optimal weight <strong className="text-white font-mono">λ = 0.024</strong> (95% CI: [0.000, 0.058]) indicates the model adds near-zero unique signal beyond market consensus.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
              <span>What is shown below?</span>
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Side-by-side pricing comparing market consensus closing lines against model projections and CFBD SP+/SRS ratings for analytical evaluation.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Comparison Table (Model Price beside Market Price) */}
      <PricingComparisonTable items={comparisonItems} />
    </div>
  );
};
