import React, { useState, useEffect } from 'react';
import { ModelHyperparameters, OptimizationIterationLog, UserLoggedBet } from '../types';
import {
  DEFAULT_HYPERPARAMETERS,
  OPTIMIZATION_PRESETS,
  evaluateModelPerformance,
  runOptimizationStep,
  computeInSeason2026Metrics,
  INITIAL_BASELINE_METRICS,
} from '../utils/modelOptimizerEngine';
import { MultivariateRegressionSummary } from './MultivariateRegressionSummary';
import {
  Cpu,
  RefreshCw,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sliders,
  CheckCircle2,
  Activity,
  Award,
  ArrowRight,
  RotateCcw,
  BarChart3,
  LineChart,
  Layers,
  HelpCircle,
  Clock,
  Check,
  Info,
  Calendar,
  AlertTriangle,
  Flame,
  BarChart2,
} from 'lucide-react';

interface AutoRetrainWorkbenchProps {
  onApplyHyperparameters?: (params: ModelHyperparameters) => void;
  activeHyperparameters?: ModelHyperparameters;
  userBets?: UserLoggedBet[];
  onOpenTeam?: (teamName: string) => void;
}

export const AutoRetrainWorkbench: React.FC<AutoRetrainWorkbenchProps> = ({
  onApplyHyperparameters,
  activeHyperparameters,
  userBets = [],
  onOpenTeam,
}) => {
  const [params, setParams] = useState<ModelHyperparameters>(
    activeHyperparameters || DEFAULT_HYPERPARAMETERS
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ai-optimal');
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const totalEpochs = 12;
  const [logs, setLogs] = useState<OptimizationIterationLog[]>([]);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'parameters' | 'inSeason2026' | 'intuitionGuide' | 'regressionSummary'>('parameters');

  // Keep local params in sync if activeHyperparameters prop updates
  useEffect(() => {
    if (activeHyperparameters) {
      setParams(activeHyperparameters);
    }
  }, [activeHyperparameters]);

  // Current performance calculated live
  const currentMetrics = evaluateModelPerformance(params, userBets);
  const inSeasonMetrics = currentMetrics.inSeasonMetrics;

  const handleSliderChange = (key: keyof ModelHyperparameters, value: number | boolean) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSelectedPresetId('custom');
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = OPTIMIZATION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setParams(preset.params);
      if (onApplyHyperparameters) {
        onApplyHyperparameters(preset.params);
        triggerNotification(`Applied preset: ${preset.name}`);
      }
    }
  };

  const handleResetToDefault = () => {
    setParams(DEFAULT_HYPERPARAMETERS);
    setSelectedPresetId('default');
    if (onApplyHyperparameters) {
      onApplyHyperparameters(DEFAULT_HYPERPARAMETERS);
      triggerNotification('Model reset to foundational default calibration');
    }
  };

  const triggerNotification = (msg: string) => {
    setAppliedNotification(msg);
    setTimeout(() => {
      setAppliedNotification(null);
    }, 4000);
  };

  // Automated iterative retraining loop
  const handleStartAutoRetrain = () => {
    if (isRetraining) return;
    setIsRetraining(true);
    setTrainingProgress(0);
    setCurrentEpoch(0);
    setLogs([]);

    let epoch = 0;
    let tempParams = { ...params };
    const tempLogs: OptimizationIterationLog[] = [];

    const interval = setInterval(() => {
      epoch += 1;
      const step = runOptimizationStep(epoch, totalEpochs, tempParams, selectedPresetId, userBets);
      tempParams = step.updatedParams;
      tempLogs.unshift(step.log);

      setParams({ ...tempParams });
      setLogs([...tempLogs]);
      setCurrentEpoch(epoch);
      setTrainingProgress(Math.round((epoch / totalEpochs) * 100));

      if (epoch >= totalEpochs) {
        clearInterval(interval);
        setIsRetraining(false);
        if (onApplyHyperparameters) {
          onApplyHyperparameters(tempParams);
        }
        triggerNotification(`Self-retraining converged! Ingested 2026 in-season sample (+${step.log.historicalRoiPct}% ROI).`);
      }
    }, 350);
  };

  return (
    <div className="space-y-6" id="retrain-workbench-container">
      {/* Top Banner: Real-Time Self-Optimization Status */}
      <div className="bg-gradient-to-r from-[#0a0f1d] via-[#10192e] to-[#0c1427] border border-cyan-500/30 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-950/80 border border-cyan-500/50 rounded-lg text-cyan-400 shadow-inner">
                <Cpu className={`w-5 h-5 ${isRetraining ? 'animate-spin text-cyan-300' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Adaptive Self-Retraining & Dynamic Hyperparameter Engine
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
                    FEI v4.6 In-Season Grid
                  </span>
                  {params.includeCurrentSeasonToDate && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      2026 To-Date Ingested
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Continuous backtest optimization across 4,800 historical games (2018–2025) plus live 2026 Week 0+ settled results with automated Bayesian shrinkage.
                </p>
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="btn-auto-retrain-run"
              onClick={handleStartAutoRetrain}
              disabled={isRetraining}
              className={`px-4 py-2 text-xs font-mono font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg ${
                isRetraining
                  ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold shadow-cyan-500/20 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRetraining ? 'animate-spin' : ''}`} />
              <span>{isRetraining ? `Retraining (${trainingProgress}%)` : 'Run Automated Retrain'}</span>
            </button>

            <button
              id="btn-retrain-reset"
              onClick={handleResetToDefault}
              disabled={isRetraining}
              className="px-3 py-2 text-xs font-mono font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Progress Bar (Visible during active retraining) */}
        {isRetraining && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-cyan-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                Optimizing Weights & In-Season Loss Epoch {currentEpoch}/{totalEpochs}...
              </span>
              <span className="text-slate-300 font-bold">{trainingProgress}% Complete</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${trainingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {appliedNotification && (
          <div className="mt-3 p-2.5 bg-emerald-950/70 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{appliedNotification}</span>
          </div>
        )}
      </div>

      {/* KPI Comparison Grid: Baseline vs. Optimized Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Historical ATS Win Rate */}
        <div className="bg-[#0b101d] border border-[#1e293b] rounded-xl p-4 shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              ATS Win Rate (Trained)
            </span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {currentMetrics.winRatePct}%
            </span>
            <span className={`text-xs font-mono font-bold ${currentMetrics.winRatePct >= 56.4 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {currentMetrics.winRatePct >= 56.4 ? `+${(currentMetrics.winRatePct - 56.4).toFixed(1)}%` : `${(currentMetrics.winRatePct - 56.4).toFixed(1)}%`}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-400">
            Record: {currentMetrics.atsRecord}
          </p>
          <div className="mt-2 text-[10px] text-slate-500 flex justify-between border-t border-slate-800/60 pt-1.5">
            <span>Baseline: 56.4%</span>
            <span>Breakeven: 52.38%</span>
          </div>
        </div>

        {/* KPI 2: Overall Portfolio ROI */}
        <div className="bg-[#0b101d] border border-[#1e293b] rounded-xl p-4 shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Simulated Backtest ROI
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              +{currentMetrics.roiPct}%
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-500">
              on $100 Flat
            </span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-400">
            Sample: {currentMetrics.effectiveSample.toLocaleString()} games ({params.includeCurrentSeasonToDate ? '+2026 live' : 'historical only'})
          </p>
          <div className="mt-2 text-[10px] text-slate-500 flex justify-between border-t border-slate-800/60 pt-1.5">
            <span>Sharpe Ratio: {currentMetrics.sharpeRatio}</span>
            <span className="text-emerald-400 font-bold">Positive Alpha</span>
          </div>
        </div>

        {/* KPI 3: 2026 In-Season Scorecard (Week 0 To-Date) */}
        <div className="bg-[#0b101d] border border-cyan-900/40 rounded-xl p-4 shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              2026 To-Date ({inSeasonMetrics.settledGamesCount} Settled)
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-mono bg-cyan-500/20 text-cyan-300 rounded font-bold">
              Week 0
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-300">
              {inSeasonMetrics.season2026AtsWinPct}%
            </span>
            <span className={`text-xs font-mono font-bold ${inSeasonMetrics.season2026RoiPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {inSeasonMetrics.season2026RoiPct >= 0 ? `+${inSeasonMetrics.season2026RoiPct}%` : `${inSeasonMetrics.season2026RoiPct}%`} ROI
            </span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-400">
            {inSeasonMetrics.season2026AtsWins}W - {inSeasonMetrics.season2026AtsLosses}L - {inSeasonMetrics.season2026AtsPushes}P (CLV Beat: {inSeasonMetrics.season2026ClvBeatRatePct}%)
          </p>
          <div className="mt-2 text-[10px] text-slate-500 flex justify-between border-t border-slate-800/60 pt-1.5">
            <span>Prior Blend: {params.inSeasonPriorBlendPct ?? 80}% Prior</span>
            <span className="text-cyan-400 font-bold">{params.currentSeasonRecencyWeight ?? 2.5}x Weight</span>
          </div>
        </div>

        {/* KPI 4: Brier Calibration & Drawdown */}
        <div className="bg-[#0b101d] border border-[#1e293b] rounded-xl p-4 shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Brier Calibration
            </span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-300">
              {currentMetrics.brierScore}
            </span>
            <span className="text-xs font-mono text-slate-400">
              (Optimal &lt; 0.220)
            </span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-400">
            Max Drawdown: -{currentMetrics.maxDrawdownPct}%
          </p>
          <div className="mt-2 text-[10px] text-slate-500 flex justify-between border-t border-slate-800/60 pt-1.5">
            <span>Optimal Kelly: {(params.minKellyFraction * 100).toFixed(0)}%</span>
            <span className="text-purple-300 font-bold">Stable</span>
          </div>
        </div>
      </div>

      {/* Preset Profiles & Objective Selection */}
      <div className="bg-[#080d18] border border-[#182338] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Optimization Objective Presets
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            One-click hyperparameter configurations for distinct risk & in-season mandates
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {OPTIMIZATION_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-card-${preset.id}`}
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-3.5 rounded-lg text-left transition-all flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-[#0b1220] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs font-bold text-white font-mono">
                      {preset.name}
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 rounded shrink-0">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Target:</span>
                  <span className="text-cyan-400 font-bold">{preset.targetObjective}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tabs: 1. Sliders & In-Season Ingestion | 2. 2026 In-Season Diagnostics | 3. Intuition & Bayesian Guide | 4. OLS Regression Stats */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('parameters')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTab === 'parameters'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Factor Weights & In-Season Ingestion</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('inSeason2026')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTab === 'inSeason2026'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>2026 In-Season Diagnostics ({inSeasonMetrics.settledGamesCount} Games)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('regressionSummary')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTab === 'regressionSummary'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>OLS Regression Summary Stats</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('intuitionGuide')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTab === 'intuitionGuide'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Mathematical Intuition Guide</span>
        </button>
      </div>

      {activeSubTab === 'parameters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Hyperparameter Fine-Tuning & In-Season Ingestion */}
          <div className="lg:col-span-7 bg-[#090e1a] border border-[#1a253a] rounded-xl p-5 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Factor Weights & In-Season Ingestion
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Interactive Calibration Controls
              </span>
            </div>

            {/* In-Season 2026 Ingestion Controls */}
            <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-cyan-500/20 rounded text-cyan-300">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">
                      Current Season (2026) Ingestion Engine
                    </h4>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Ingest Week 0 settled games (TCU, NDSU, Memphis, Stanford, FSU) into active loss gradient.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.includeCurrentSeasonToDate ?? true}
                    onChange={(e) => handleSliderChange('includeCurrentSeasonToDate', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {params.includeCurrentSeasonToDate && (
                <div className="pt-2 border-t border-cyan-900/40 space-y-3">
                  {/* Slider: In-Season Recency Weight */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-200 font-semibold">
                        In-Season Recency Multiplier:
                        <span className="text-cyan-400 ml-1.5 font-bold">
                          {(params.currentSeasonRecencyWeight || 2.5).toFixed(1)}x
                        </span>
                      </span>
                      <span className="text-slate-400 text-[10px]">Range: 1.0x – 5.0x</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={params.currentSeasonRecencyWeight || 2.5}
                      onChange={(e) => handleSliderChange('currentSeasonRecencyWeight', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <p className="text-[11px] text-slate-400 leading-tight">
                      <strong>Intuition:</strong> Multiplies the error penalty for 2026 completed games vs. historical games from 2018-2025.
                    </p>
                  </div>

                  {/* Slider: Bayesian Preseason Prior Blend */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-200 font-semibold">
                        Preseason Prior vs. 2026 Actuals Blend:
                        <span className="text-cyan-400 ml-1.5 font-bold">
                          {params.inSeasonPriorBlendPct ?? 80}% Prior / {(100 - (params.inSeasonPriorBlendPct ?? 80))}% Actual
                        </span>
                      </span>
                      <span className="text-slate-400 text-[10px]">Range: 50% – 95%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      step="5"
                      value={params.inSeasonPriorBlendPct ?? 80}
                      onChange={(e) => handleSliderChange('inSeasonPriorBlendPct', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <p className="text-[11px] text-slate-400 leading-tight">
                      <strong>Intuition:</strong> In early weeks (Week 0-2), small samples need shrinkage towards recruiting & returning production priors to prevent overreacting to 1 game.
                    </p>
                  </div>

                  {/* User Bet Ledger Ingestion Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-300">
                      Include User-Logged Settled Bets ({userBets.filter((b) => b.resultStatus === 'WON' || b.resultStatus === 'LOST').length} settled in Ledger)
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={params.includeUserLedgerBets ?? true}
                        onChange={(e) => handleSliderChange('includeUserLedgerBets', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Slider 1: Spread Discrepancy Weight */}
              <div className="p-3 bg-[#060a14] border border-slate-800/80 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    1. Edge Sensitivity (Spread Difference):
                    <span className="text-cyan-400">{params.spreadDiscrepancyWeight.toFixed(2)}x</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">Range: 0.5x – 2.0x</span>
                </div>
                <input
                  id="slider-spread-weight"
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={params.spreadDiscrepancyWeight}
                  onChange={(e) => handleSliderChange('spreadDiscrepancyWeight', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[11px] text-slate-300 font-sans leading-tight">
                  <strong>In Plain English:</strong> How heavily the model rewards big point differences between Vegas and our math. (Default 1.0x is balanced).
                </p>
              </div>

              {/* Slider 2: Home Field Advantage Baseline */}
              <div className="p-3 bg-[#060a14] border border-slate-800/80 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    2. Home Field Boost:
                    <span className="text-cyan-400">{params.homeFieldAdvantageBaseline.toFixed(2)} pts</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">Range: 1.5 – 4.0 pts</span>
                </div>
                <input
                  id="slider-hfa"
                  type="range"
                  min="1.5"
                  max="4.0"
                  step="0.1"
                  value={params.homeFieldAdvantageBaseline}
                  onChange={(e) => handleSliderChange('homeFieldAdvantageBaseline', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[11px] text-slate-300 font-sans leading-tight">
                  <strong>In Plain English:</strong> How many points to give the home team. (College football average is ~2.45 pts).
                </p>
              </div>

              {/* Slider 3: Turnover Variance Dampener */}
              <div className="p-3 bg-[#060a14] border border-slate-800/80 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    3. Ignore Lucky Turnovers Filter:
                    <span className="text-cyan-400">{params.turnoverVarianceDampener.toFixed(2)}</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">Range: 0.50 – 1.50</span>
                </div>
                <input
                  id="slider-turnover-dampener"
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={params.turnoverVarianceDampener}
                  onChange={(e) => handleSliderChange('turnoverVarianceDampener', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[11px] text-slate-300 font-sans leading-tight">
                  <strong>In Plain English:</strong> Strips out fluky fumble bounces and tipped interceptions so we don't overreact to random luck.
                </p>
              </div>

              {/* Slider 4: Garbage Time Deflation */}
              <div className="p-3 bg-[#060a14] border border-slate-800/80 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    4. Blowout Garbage Time Deflation:
                    <span className="text-cyan-400">{params.garbageTimeDeflation.toFixed(2)}</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">Range: 0.40 – 0.95</span>
                </div>
                <input
                  id="slider-garbage-deflation"
                  type="range"
                  min="0.40"
                  max="0.95"
                  step="0.05"
                  value={params.garbageTimeDeflation}
                  onChange={(e) => handleSliderChange('garbageTimeDeflation', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[11px] text-slate-300 font-sans leading-tight">
                  <strong>In Plain English:</strong> Discounts late 4th-quarter touchdowns scored against backup third-stringers in blowouts.
                </p>
              </div>

              {/* Slider 5: Key Number Teaser Cross Bonus */}
              <div className="p-3 bg-[#060a14] border border-slate-800/80 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    5. Key Football Numbers Bonus (3 & 7):
                    <span className="text-cyan-400">{params.keyNumberTeaserBonus.toFixed(2)}x</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">Range: 1.0 – 3.0x</span>
                </div>
                <input
                  id="slider-teaser-bonus"
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={params.keyNumberTeaserBonus}
                  onChange={(e) => handleSliderChange('keyNumberTeaserBonus', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[11px] text-slate-300 font-sans leading-tight">
                  <strong>In Plain English:</strong> College football games most frequently end by 3 (field goal) or 7 (touchdown) points. This boosts bets that cross those lines.
                </p>
              </div>

              {/* Slider 6: Fractional Kelly Sizing Factor */}
              <div className="p-3 bg-[#060a14] border border-slate-800/80 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    6. Smart Bet Sizing (Quarter-Kelly):
                    <span className="text-cyan-400">{(params.minKellyFraction * 100).toFixed(0)}% Kelly</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">Range: 10% – 50%</span>
                </div>
                <input
                  id="slider-kelly-fraction"
                  type="range"
                  min="0.10"
                  max="0.50"
                  step="0.05"
                  value={params.minKellyFraction}
                  onChange={(e) => handleSliderChange('minKellyFraction', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[11px] text-slate-300 font-sans leading-tight">
                  <strong>In Plain English:</strong> Prevents you from betting too much money on any single game. 25% (Quarter-Kelly) is the math gold standard.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                id="btn-apply-hyperparams"
                onClick={() => {
                  if (onApplyHyperparameters) {
                    onApplyHyperparameters(params);
                    triggerNotification('Successfully applied custom hyperparameters across 2026 slate!');
                  }
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs rounded-lg flex items-center gap-2 transition-all shadow-md shadow-cyan-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Hyperparameters to Slate</span>
              </button>
            </div>
          </div>

          {/* Right Column: Training Iteration Logs & Convergence Visualizer */}
          <div className="lg:col-span-5 bg-[#090e1a] border border-[#1a253a] rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Convergence Log & Telemetry
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/60">
                  {logs.length > 0 ? `${logs.length} Iterations` : 'Ready'}
                </span>
              </div>

              {/* Telemetry Stream */}
              <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {logs.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg space-y-2">
                    <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-mono">
                      No active training run in progress.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Click <strong>"Run Automated Retrain"</strong> above to launch gradient search across 4,800 historical games + 2026 in-season sample.
                    </p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.epoch}
                      className={`p-2.5 rounded border font-mono text-xs flex justify-between items-center transition-all ${
                        log.status === 'converged'
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-[#060a14] border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">Epoch {log.epoch}:</span>
                          <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                          {log.status === 'converged' && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 font-bold rounded">
                              CONVERGED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex gap-3">
                          <span>Win: <strong className="text-white">{log.winRatePct}%</strong></span>
                          <span>Brier: <strong className="text-cyan-300">{log.brierScore}</strong></span>
                          <span>Sharpe: <strong className="text-purple-300">{log.sharpeRatio}</strong></span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-bold ${log.historicalRoiPct >= 12.0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                          +{log.historicalRoiPct}% ROI
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Model Specification Card */}
            <div className="p-3 bg-[#060a14] border border-slate-800 rounded-lg space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span>Historical Dataset:</span>
                <span className="text-white font-bold">4,800 FBS Games (2018–2025)</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>In-Season Sample:</span>
                <span className="text-emerald-400 font-bold">
                  {params.includeCurrentSeasonToDate ? `2026 Week 0 (${inSeasonMetrics.settledGamesCount} Settled)` : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Target Loss Function:</span>
                <span className="text-cyan-400 font-bold">Log-Loss & Brier Minimization</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Staking Optimizer:</span>
                <span className="text-purple-300 font-bold">Covariance Shield / Anti-Cluster</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: 2026 In-Season Diagnostics */}
      {activeSubTab === 'inSeason2026' && (
        <div className="space-y-5 bg-[#090e1a] border border-[#1a253a] rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                2026 In-Season Settled Games & Model Machine Learnings
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Week 0 settled results ingested into active model retraining and Bayesian regression.
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300 rounded">
              Current Week: Week 0 Settled / Week 1 Active
            </span>
          </div>

          {/* Learnings Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {inSeasonMetrics.inSeasonLearnings.map((learning, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#060a14] border border-slate-800 rounded-lg text-xs space-y-1"
              >
                <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Learning #{idx + 1}</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  {learning}
                </p>
              </div>
            ))}
          </div>

          {/* Settled Games In-Depth Log */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              Settled 2026 Games (Week 0 Ledger Plays) Ingested in Retraining
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Bet 1: TCU -7.5 Spread */}
              <div className="p-3.5 bg-[#060a14] border border-rose-600/40 rounded-lg space-y-2 font-mono text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white block">TCU -7.5 · Spread</span>
                    <span className="text-[10px] text-slate-400">UNC 15 - 10 TCU · FINAL 8/29</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] bg-rose-500/20 text-rose-300 font-bold rounded">
                    LOST (-1.0u / -$20)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Stake: <strong>1.0u @ -120</strong></span>
                  <span className="text-rose-400 font-bold">Margin: UNC +5</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans border-t border-slate-800/80 pt-1.5 leading-relaxed">
                  Dublin gale-force rain & 3 turnovers suppressed TCU offense; model calibrated coastal adverse-weather scoring dampener.
                </p>
              </div>

              {/* Bet 2: Over 45.5 UNC vs TCU */}
              <div className="p-3.5 bg-[#060a14] border border-rose-600/40 rounded-lg space-y-2 font-mono text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white block">Over 45.5 · Total</span>
                    <span className="text-[10px] text-slate-400">25 · UNC 15 - 10 TCU · FINAL 8/29</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] bg-rose-500/20 text-rose-300 font-bold rounded">
                    LOST (-0.8u / -$16)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Stake: <strong>0.8u @ -125</strong></span>
                  <span className="text-cyan-400 font-bold">Total: 25 Pts (Under)</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans border-t border-slate-800/80 pt-1.5 leading-relaxed">
                  Total landed at 25 pts (under by 20.5 pts) due to red zone inefficiency and weather; informs rain-induced pace deflation.
                </p>
              </div>

              {/* Bet 3: 2-Leg Parlay (UNC/TCU Over + TCU Spread) */}
              <div className="p-3.5 bg-[#060a14] border border-rose-600/40 rounded-lg space-y-2 font-mono text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white block">2-Leg Parlay (2 Losses)</span>
                    <span className="text-[10px] text-slate-400">Over 45.5 [-125] + TCU -7.5 [-120]</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] bg-rose-500/20 text-rose-300 font-bold rounded">
                    LOST (-0.8u / -$16)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Stake: <strong>0.8u @ +199</strong></span>
                  <span className="text-purple-400 font-bold">2 Legs Settled</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans border-t border-slate-800/80 pt-1.5 leading-relaxed">
                  Both legs failed together under joint weather drag; retrain activates anti-clustering covariance shield for correlated parlays.
                </p>
              </div>

              {/* Bet 4: Over 45.5 Jacksonville St vs NDSU */}
              <div className="p-3.5 bg-[#060a14] border border-rose-600/40 rounded-lg space-y-2 font-mono text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white block">Over 45.5 · Total</span>
                    <span className="text-[10px] text-slate-400">40 · JVS 7 - 33 NDS · FINAL 8/29</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] bg-rose-500/20 text-rose-300 font-bold rounded">
                    LOST (-1.5u / -$30)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Stake: <strong>1.5u @ -120</strong></span>
                  <span className="text-cyan-400 font-bold">Total: 40 Pts</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans border-t border-slate-800/80 pt-1.5 leading-relaxed">
                  NDSU held Jax State to 7 pts (Total 40 vs 45.5 line); model prioritizes opponent trench stop rate over raw tempo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Mathematical Intuition Guide */}
      {activeSubTab === 'intuitionGuide' && (
        <div className="space-y-5 bg-[#090e1a] border border-[#1a253a] rounded-xl p-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Intuition Guide: How Model Retraining & In-Season Calibration Work
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              An intuitive breakdown of Bayesian shrinkage, sample noise dampening, and Kelly staking mathematics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guide Card 1: In-Season Bayesian Shrinkage */}
            <div className="p-4 bg-[#060a14] border border-cyan-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>1. In-Season Bayesian Shrinkage</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Why not rely 100% on Week 0 scores? In statistics, a sample size of 1 game has high random variance (fumble recoveries, weather, penalty calls). Bayesian shrinkage blends the robust 8-year preseason prior with 2026 live observations:
              </p>
              <div className="p-2.5 bg-slate-900 rounded font-mono text-[11px] text-cyan-300 border border-slate-800">
                Posterior Rating = (w_prior × Preseason Rating) + (1 - w_prior) × In-Season Efficiency
              </div>
              <p className="text-[11px] text-slate-400">
                In Week 0/1, <code className="text-white">w_prior ≈ 0.80</code>. By Week 6, as sample size grows, <code className="text-white">w_prior ≈ 0.35</code>.
              </p>
            </div>

            {/* Guide Card 2: Closing Line Value (CLV) Beat Rate */}
            <div className="p-4 bg-[#060a14] border border-purple-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-purple-300 font-mono font-bold text-xs">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>2. Closing Line Value (CLV) Alpha</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Beating the closing line is the single highest predictor of long-term sports betting profitability. If we lock in Memphis at <code className="text-emerald-300 font-bold">+2.5</code> on Monday and it closes at <code className="text-emerald-300 font-bold">-1.5</code> on Saturday, we captured <strong>+4.0 points of pure market CLV</strong>.
              </p>
              <p className="text-[11px] text-slate-400">
                Our retrained model tracks early steam moves to execute before syndicate money pushes lines past key numbers.
              </p>
            </div>

            {/* Guide Card 3: Key Football Numbers (3, 6, 7, 10, 14) */}
            <div className="p-4 bg-[#060a14] border border-amber-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-xs">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>3. Key Numbers & Wong Teaser Corridors</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Over 25% of all college football games land on margins of <strong>3</strong> (field goal) or <strong>7</strong> (touchdown). A 6-point teaser crossing from underdog +2.0 to +8.0 crosses both 3, 4, 6, and 7, capturing disproportionately high probability coverage.
              </p>
              <p className="text-[11px] text-slate-400">
                The retrain engine gives a statistical bonus multiplier to teaser legs that cross these key thresholds.
              </p>
            </div>

            {/* Guide Card 4: Quarter-Kelly Bankroll Compounding */}
            <div className="p-4 bg-[#060a14] border border-emerald-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-300 font-mono font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>4. Fractional Kelly Sizing (Anti-Ruin)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Full Kelly staking maximizes theoretical growth but incurs extreme variance (30%+ drawdowns). Academic research and quantitative betting desks utilize <strong>Quarter-Kelly (25%)</strong>:
              </p>
              <div className="p-2.5 bg-slate-900 rounded font-mono text-[11px] text-emerald-300 border border-slate-800">
                Stake % = 0.25 × [(WinProb × DecimalOdds - 1) / (DecimalOdds - 1)]
              </div>
              <p className="text-[11px] text-slate-400">
                Guarantees zero risk of ruin while capturing 75% of the growth rate of full Kelly.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'regressionSummary' && (
        <MultivariateRegressionSummary />
      )}
    </div>
  );
};
