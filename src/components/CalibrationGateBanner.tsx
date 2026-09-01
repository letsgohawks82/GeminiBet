// src/components/CalibrationGateBanner.tsx
import React, { useState } from 'react';
import { CalibrationGateReport } from '../types';
import {
  Lock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
  BarChart3,
  Scale,
  Activity,
  Layers,
} from 'lucide-react';

interface CalibrationGateBannerProps {
  report: CalibrationGateReport;
  onOpenDetailedModal?: () => void;
}

export const CalibrationGateBanner: React.FC<CalibrationGateBannerProps> = ({
  report,
  onOpenDetailedModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { overallMetrics, criteriaChecks, walkForwardFolds, gateStatus, plainLanguageSummary } = report;
  const isLocked = gateStatus === 'LOCKED';

  return (
    <div
      id="calibration-gate-locked-banner"
      className={`rounded-2xl border transition-all ${
        isLocked
          ? 'border-amber-500/50 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 shadow-xl ring-1 ring-amber-500/20'
          : 'border-emerald-500/50 bg-slate-900 shadow-xl ring-1 ring-emerald-500/20'
      }`}
    >
      {/* Top Banner Bar */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold shadow-md ${
              isLocked
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {isLocked ? <Lock className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                {isLocked ? 'MODEL CALIBRATION GATE: LOCKED' : 'MODEL CALIBRATION GATE: PASSED'}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide border ${
                  isLocked
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {report.passedThresholdsCount}/{report.totalThresholdsCount} Tests Passed
              </span>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                Zero-Lookahead Walk-Forward
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed max-w-3xl">
              {isLocked ? (
                <>
                  <strong className="text-amber-300">Bet Recommendations, Kelly Sizing & Portfolio Optimization are Locked. </strong>
                  The market-anchored blend weight <span className="font-mono font-bold text-white">λ = {overallMetrics.lambdaBlendWeight.toFixed(3)}</span> (95% CI: [{overallMetrics.lambdaBootstrapCI95[0].toFixed(3)}, {overallMetrics.lambdaBootstrapCI95[1].toFixed(3)}]) is near zero.
                  The standalone model adds no statistically significant predictive edge over de-vigged closing lines.
                  Model prices are presented beside market consensus for <strong>comparison only</strong>.
                </>
              ) : (
                'Calibration gate criteria satisfied. Automated sizing unlocked.'
              )}
            </p>
          </div>
        </div>

        {/* Action Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-colors shadow-xs"
          >
            <Activity className="h-4 w-4 text-amber-400" />
            <span>{isExpanded ? 'Hide Diagnostics' : 'Inspect Gate Math'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Calibration Diagnostic Workbench */}
      {isExpanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 sm:p-6 space-y-6">
          {/* Key Metric Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Market Blend Weight (λ)</span>
                <Scale className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="mt-1 text-xl font-black font-mono text-white">
                {overallMetrics.lambdaBlendWeight.toFixed(3)}
              </div>
              <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                95% CI: [{overallMetrics.lambdaBootstrapCI95[0].toFixed(3)}, {overallMetrics.lambdaBootstrapCI95[1].toFixed(3)}]
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Threshold: λ ≥ 0.15 (CI &gt; 0.05)
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Brier Score (Model vs Close)</span>
                <BarChart3 className="h-3.5 w-3.5 text-red-400" />
              </div>
              <div className="mt-1 text-xl font-black font-mono text-slate-200">
                {overallMetrics.modelBrierScore.toFixed(3)}{' '}
                <span className="text-xs text-red-400 font-bold">
                  (+{(overallMetrics.brierDelta).toFixed(3)})
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Market Closing: {overallMetrics.marketDeviggedBrierScore.toFixed(3)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Target: Model &lt; Market
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Log Loss Cross-Entropy</span>
                <Activity className="h-3.5 w-3.5 text-red-400" />
              </div>
              <div className="mt-1 text-xl font-black font-mono text-slate-200">
                {overallMetrics.modelLogLoss.toFixed(4)}{' '}
                <span className="text-xs text-red-400 font-bold">
                  (+{overallMetrics.logLossDelta.toFixed(4)})
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Market Closing: {overallMetrics.marketDeviggedLogLoss.toFixed(4)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Target: Model &lt; Market
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Opener-to-Close CLV</span>
                <Layers className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="mt-1 text-xl font-black font-mono text-slate-200">
                {overallMetrics.openerToCloseClvMeanPts > 0 ? `+${overallMetrics.openerToCloseClvMeanPts}` : overallMetrics.openerToCloseClvMeanPts} pts
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Positive Beat Rate: {overallMetrics.openerToCloseClvBeatRatePct}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Target: &gt; +0.25 pts &gt; 53.5%
              </div>
            </div>
          </div>

          {/* Gate Criteria Checklist */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Calibration Gate Criteria Breakdown
            </h3>
            <div className="space-y-2.5">
              {criteriaChecks.map((crit) => (
                <div
                  key={crit.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-800/60 bg-slate-950/40 p-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    {crit.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-white">{crit.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{crit.explanation}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Requirement: {crit.requirement}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        crit.passed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {crit.passed ? 'PASSED' : 'GATE FAILED'}
                    </span>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      {crit.actualValue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Walk-Forward Table (Train 1..N, Predict N+1) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3 overflow-x-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Walk-Forward Out-Of-Sample Validation Matrix (Zero Lookahead)
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                De-vigged closing lines benchmark
              </span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2 px-2">Train Window (Week 1..N)</th>
                  <th className="py-2 px-2">Test Slate (N+1)</th>
                  <th className="py-2 px-2">Model Brier</th>
                  <th className="py-2 px-2">Market Brier</th>
                  <th className="py-2 px-2">Model Log Loss</th>
                  <th className="py-2 px-2">Market Log Loss</th>
                  <th className="py-2 px-2">Opt λ</th>
                  <th className="py-2 px-2">Mean CLV</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {walkForwardFolds.map((fold, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 text-slate-300">
                    <td className="py-2.5 px-2 font-sans text-slate-400">{fold.trainWeeks}</td>
                    <td className="py-2.5 px-2 font-bold text-white">{fold.testWeek}</td>
                    <td className="py-2.5 px-2">{fold.modelBrierScore.toFixed(3)}</td>
                    <td className="py-2.5 px-2 text-emerald-400">{fold.marketDeviggedBrierScore.toFixed(3)}</td>
                    <td className="py-2.5 px-2">{fold.modelLogLoss.toFixed(3)}</td>
                    <td className="py-2.5 px-2 text-emerald-400">{fold.marketDeviggedLogLoss.toFixed(3)}</td>
                    <td className="py-2.5 px-2 text-amber-300">{fold.lambdaBlendWeight.toFixed(2)}</td>
                    <td className="py-2.5 px-2">{fold.clvMeanPts > 0 ? `+${fold.clvMeanPts}` : fold.clvMeanPts}</td>
                    <td className="py-2.5 px-2">
                      <span className="rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.5 text-[9px] font-bold">
                        {fold.foldStatus === 'FAIL_NO_EDGE' ? 'NO EDGE' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
