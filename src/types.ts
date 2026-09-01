export interface RecordMetric {
  wins: number;
  losses: number;
  pushes?: number;
  winPctDecisive: number;
  winPctTotal: number;
  roi?: number;
  profitUnits?: number;
  profitDollars?: number; // on $100 flat bets (-110 juice)
}

export interface DetailedGame {
  id: string;
  year: number;
  week: string;
  weekPhase: string;
  winner: string;
  loser: string;
  pw: number;
  pm: number;
  pf: number;
  pa: number;
  pt: number;
  final: string;
  cl: string;
  clNum: number;
  ct: number;
  pe: number;
  su: 'Win' | 'Loss';
  ats: 'Win' | 'Loss' | 'Push';
  ou: 'Win' | 'Loss' | 'Push';
  spreadDiff: number;
  spreadEdgeAbs: number;
  totalDiff: number;
  totalEdgeAbs: number;
  atsEdgeTier: string;
  ouEdgeTier: string;
  spreadMagnitudeTier: string;
  pwTier: string;
  totalRangeTier: string;
  modelAtsSide: 'Fav' | 'Dog' | 'Neutral';
  modelOuSide: 'Over' | 'Under' | 'Neutral';
}

export interface TierRow {
  name: string;
  category: string;
  totalGames: number;
  ats: RecordMetric;
  ou: RecordMetric;
  su: RecordMetric;
  avgPe: number;
  edgeRating: 'elite' | 'strong' | 'neutral' | 'avoid';
  recommendation: string;
}

export interface WeekStat {
  count: number;
  suWins: number;
  atsWins: number;
  ouWins: number;
  peSum: number;
}

export interface GameProjection {
  winner: string;
  loser: string;
  pw: number;
  pm: number;
  pf: number;
  pa: number;
  pt: number;
  final: string;
  cl: string;
  ct: number;
  pe: number;
  su: string;
  ats: string;
  ou: string;
  week: string;
}

export interface SeasonStat {
  year: number;
  totalGames: number;
  su: RecordMetric;
  ats: RecordMetric;
  ou: RecordMetric;
  avgPe: number;
  weekBreakdown: Record<string, WeekStat>;
  sampleGames?: GameProjection[];
}

export interface OverallSummary {
  totalGames: number;
  su: RecordMetric;
  ats: RecordMetric;
  ou: RecordMetric;
  avgPe: number;
}

export interface FeiDataset {
  seasons: SeasonStat[];
  overall: OverallSummary;
}

export interface BetPricingOption {
  odds: number; // e.g. -110, -105, -115, +100
  label: string;
  impliedWinPct: number;
  payoutMultiplier: number; // decimal multiplier
}

export interface ParlaySimulationResult {
  legCount: 2 | 3 | 4;
  totalTickets: number;
  winningTickets: number;
  winRate: number;
  payoutOdds: number; // e.g. +264, +596, +1228
  totalProfitUnits: number;
  roi: number;
  breakEvenWinPct: number;
  edgeOverMarket: number; // winRate - breakEvenWinPct
  description: string;
}

export interface TeaserSimulationResult {
  teaserPoints: 6.0 | 6.5 | 7.0;
  totalLegs: number;
  winningLegs: number;
  legWinRate: number;
  twoTeamWinRate: number; // (legWinRate)^2
  twoTeamRoi: number; // at -120 price
  threeTeamWinRate: number; // (legWinRate)^3
  threeTeamRoi: number; // at +160 price
  wongCorridorLegWinRate: number;
  wongCorridorSample: number;
}

export type ExecutionTimingWindow =
  | '⚡ Early-Week Open (Mon–Tue)'
  | '📈 Mid-Week Steam (Wed–Thu)'
  | '⏳ Game-Day Weather/Injury Wait (Sat AM)'
  | '🎯 Late Public Buyback (1-2hr Pre-Kick)';

export type TimingUrgency = 'IMMEDIATE LOCK' | 'MONITOR STEAM' | 'WAIT FOR SATURDAY' | 'BUY LATE PEAK';

export interface SportsbookQuote {
  bookName: 'DraftKings' | 'FanDuel' | 'theScore' | 'Caesars' | 'BetRivers';
  spread: number;
  spreadOdds: number;
  total?: number;
  totalOdds?: number;
  moneyline?: number;
  isBestForPick?: boolean;
  edgeAdvantageDescription?: string;
  externalUrl?: string;
}

export interface SportsbookBestLine {
  bookName: string;
  line: string;
  odds: number;
  edgeSummary: string;
  juiceSavingsPct: number;
  directUrl?: string;
}

export interface BetTimingIntelligence {
  timingWindow: ExecutionTimingWindow;
  urgency: TimingUrgency;
  timingRationale: string;
  projectedClvDeltaPts: number; // estimated CLV point advantage e.g. +1.5 pts
  marketMovementForecast: string; // e.g. "Sharps pounding line; buy now before spread crosses key 7"
}

export interface Pick2026 {
  id: string;
  week: string;
  weekNumber: number;
  date: string;
  favorite: string;
  underdog: string;
  venue: string;
  isNeutral: boolean;
  marketSpread: number; // e.g. -7.5 (fav is favored by 7.5)
  marketTotal: number; // e.g. 52.5
  feiProjWinner: string;
  feiProjMargin: number; // e.g. 13.2
  feiProjScore: string; // e.g. "34 - 21"
  feiProjTotal: number; // e.g. 55.0
  feiWinProb: number; // e.g. 0.785
  spreadDiff: number; // feiProjMargin - (-marketSpread)
  spreadEdgeAbs: number;
  totalDiff: number; // feiProjTotal - marketTotal
  totalEdgeAbs: number;
  recommendedBetSide: 'Favorite Spread' | 'Underdog Spread' | 'Over Total' | 'Under Total' | 'Moneyline Value';
  recommendedBetText: string;
  exactAction: string; // e.g. "TAKE Florida State -10.5 (-110)"
  confidenceGrade: 'A+' | 'A' | 'B+' | 'B';
  alphaTierTag: string;
  tierHistoricalRoiPct: number; // e.g. 14.8
  tierWinRatePct: number; // e.g. 61.4
  tierSampleSize: number; // e.g. 420 games
  teaserEligible: boolean;
  teaserAngleText?: string;
  expectedValue: number; // True EV %
  kellyFractionPct: number; // Quarter-Kelly % of bankroll
  fullKellyPct: number; // Full Kelly %
  halfKellyPct: number; // Half Kelly %
  breakEvenWinPct: number; // e.g. 52.38% for -110
  units: number; // suggested standalone unit sizing e.g. 2.0, 1.5, 1.0
  standaloneStakeDollars?: number; // e.g. $47 for $1k bankroll
  timing?: BetTimingIntelligence;
  sportsbooks?: SportsbookQuote[];
  bestBook?: SportsbookBestLine;
  isSettled?: boolean;
  finalScore?: string;
  actualResult?: 'WON' | 'LOST' | 'PUSH';
  postMortemNotes?: string;
}

export interface CuratedParlayPick {
  id: string;
  title: string;
  week: string;
  weekNumber: number;
  grade: 'A+' | 'A' | 'B+' | 'B';
  legsCount: 2 | 3 | 4;
  payoutOddsAmerican: number; // e.g. +264, +596
  multiplier: number; // e.g. 3.64
  tierHistoricalRoiPct: number; // historical ROI from backtesting e.g. +14.2%
  tierWinRatePct: number; // e.g. 34.8%
  breakEvenWinRatePct: number; // e.g. 27.4%
  expectedValue: number; // e.g. +26.8%
  suggestedUnit: number; // e.g. 1.0u
  exactAction: string; // e.g. "TAKE: 2-Leg Alpha Parlay (Ohio State -4.5 + Georgia -12.5)"
  legs: {
    gameId: string;
    matchup: string;
    selection: string;
    modelEdge: number;
    winProb: number;
    angle: string;
  }[];
  rationale: string;
}

export interface CuratedTeaserPick {
  id: string;
  title: string;
  week: string;
  weekNumber: number;
  teaserPoints: 6.0 | 7.0;
  legsCount: 2 | 3;
  payoutOddsAmerican: number; // e.g. -120, +160
  multiplier: number; // e.g. 1.83
  tierHistoricalRoiPct: number; // e.g. +9.4%
  legHitRatePct: number; // e.g. 74.2%
  teaserCoverWinRatePct: number; // e.g. 55.0%
  breakEvenWinRatePct: number; // e.g. 54.5%
  expectedValue: number; // e.g. +12.8%
  suggestedUnit: number; // e.g. 1.5u
  exactAction: string; // e.g. "TAKE 6-PT TEASER: Kansas State +9.5 & Florida State -4.5"
  legs: {
    gameId: string;
    matchup: string;
    originalLine: string;
    teasedLine: string;
    keyNumbersCrossed: string; // e.g. "Crosses 4, 6, 7"
    rationale: string;
  }[];
  rationale: string;
}

export interface BetSlipLeg {
  id: string;
  gameId: string;
  matchup: string;
  betType: 'spread' | 'total' | 'moneyline';
  selection: string;
  line: string;
  odds: number;
  modelEdge: number;
  winProb: number;
  ev: number;
  stakeDollars?: number;
  kellyUnits?: number;
  bestBookName?: string;
  bestBookLine?: string;
  bestBookOdds?: number;
  directUrl?: string;
}

export interface FilterCriteria {
  season: string;
  spreadEdgeTier: string;
  ouEdgeTier: string;
  spreadMagnitude: string;
  pwTier: string;
  totalRange: string;
  side: string;
  ouSide: string;
  weekPhase: string;
  searchTeam: string;
  minPe: number;
  maxPe: number;
}

export interface OptimalPortfolioTicket {
  ticketId: string;
  ticketType: 'straight' | 'parlay' | 'teaser';
  title: string;
  grade: 'A+' | 'A' | 'B+' | 'B';
  exactDirective: string;
  oddsAmerican: number;
  multiplier: number;
  allocatedUnits: number;
  allocatedDollars: number;
  allocatedPct: number;
  potentialPayoutDollars: number;
  expectedRoiPct: number;
  expectedValuePct: number;
  winProbPct: number;
  gameIds: string[];
  gameNames: string[];
  legs: BetSlipLeg[];
  rationale: string;
  timingWindow?: ExecutionTimingWindow;
  urgency?: TimingUrgency;
  timingRationale?: string;
  projectedClvDeltaPts?: number;
}

export interface GameExposureSummary {
  gameId: string;
  gameName: string;
  grade: 'A+' | 'A' | 'B+' | 'B';
  side: string;
  straightUnits: number;
  parlayUnits: number;
  teaserUnits: number;
  totalExposureUnits: number;
  totalExposureDollars: number;
  portfolioExposurePct: number;
  isOverConcentrated: boolean;
  concentrationRiskTier: 'safe' | 'optimal' | 'elevated' | 'capped';
  activeTicketsCount: number;
}

export interface ModelHyperparameters {
  spreadDiscrepancyWeight: number; // 0.5 to 2.0 (default 1.0)
  homeFieldAdvantageBaseline: number; // 1.5 to 4.0 pts (default 2.5)
  recentRecencyDecay: number; // 0.0 to 0.5 (default 0.15)
  turnoverVarianceDampener: number; // 0.5 to 1.5 (default 0.85)
  garbageTimeDeflation: number; // 0.0 to 1.0 (default 0.70)
  keyNumberTeaserBonus: number; // 1.0 to 3.0 (default 1.8)
  gradeThresholdAPlus: number; // e.g. 7.0 pts edge
  gradeThresholdA: number; // e.g. 5.0 pts edge
  gradeThresholdBPlus: number; // e.g. 3.0 pts edge
  minKellyFraction: number; // 0.10 to 0.50 (default 0.25)
  // In-Season 2026 Live Retraining Parameters
  includeCurrentSeasonToDate?: boolean; // Ingest 2026 Week 0+ settled games into optimization
  currentSeasonRecencyWeight?: number; // 1.0x to 5.0x weight multiplier on 2026 results
  inSeasonPriorBlendPct?: number; // 50% to 95% prior Bayesian regression vs. 2026 actuals
  includeUserLedgerBets?: boolean; // Include user settled bets from Bet Ledger in fine-tuning
}

export interface InSeasonRetrainMetrics {
  settledGamesCount: number;
  season2026AtsWins: number;
  season2026AtsLosses: number;
  season2026AtsPushes: number;
  season2026AtsWinPct: number;
  season2026RoiPct: number;
  season2026BrierScore: number;
  season2026ClvBeatRatePct: number;
  earlySeasonNoiseDampening: number; // e.g. 0.82
  inSeasonLearnings: string[];
}

export interface OptimizationIterationLog {
  epoch: number;
  timestamp: string;
  historicalRoiPct: number;
  winRatePct: number;
  brierScore: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  status: 'converged' | 'improving' | 'evaluating';
  hyperparameters: ModelHyperparameters;
}

export interface SlatePortfolioPlan {
  week: string;
  totalBankroll: number;
  unitValue: number;
  totalUnits: number;
  straightBudgetUnits: number;
  straightBudgetDollars: number;
  straightBudgetPct: number;
  parlayBudgetUnits: number;
  parlayBudgetDollars: number;
  parlayBudgetPct: number;
  teaserBudgetUnits: number;
  teaserBudgetDollars: number;
  teaserBudgetPct: number;
  tickets: OptimalPortfolioTicket[];
  gameExposures: GameExposureSummary[];
  projectedSlateRoiPct: number;
  projectedNetProfitDollars: number;
  maxSingleGameExposurePct: number;
  diversificationScore: number; // 0 to 100
  diversificationHealth: 'Optimal (Anti-Cluster)' | 'Moderate Exposure' | 'High Concentration Warning';
}

export interface UserLoggedBet {
  id: string;
  timestamp: string;
  week: string;
  ticketType: 'straight' | 'parlay' | 'teaser';
  selection: string;
  matchup?: string;
  bookName: string;
  line: string;
  oddsAmerican: number;
  stakeDollars: number;
  stakeUnits?: number;
  potentialPayoutDollars: number;
  timingStatus: 'LOCKED_NOW' | 'WAITING_FOR_LINE' | 'LINE_MOVED_BET_NOW' | 'PASSED';
  targetWaitLine?: string;
  timingNotes?: string;
  grade?: 'A+' | 'A' | 'B+' | 'B';
  resultStatus: 'PENDING' | 'WON' | 'LOST' | 'PUSH' | 'CANCELLED';
  closingLine?: string;
  clvDeltaPts?: number;
  actualPnlDollars?: number;
  notes?: string;
  gameIds?: string[];
  legs?: Array<{
    selection: string;
    oddsAmerican: number;
    line?: string;
    matchup?: string;
    resultStatus?: 'PENDING' | 'WON' | 'LOST' | 'PUSH';
    scoreDetails?: string;
  }>;
}

export interface BetLedgerStats {
  totalBets: number;
  pendingBets: number;
  lockedNowBets: number;
  waitingBets: number;
  wonBets: number;
  lostBets: number;
  pushBets: number;
  totalWageredDollars: number;
  totalWageredUnits: number;
  totalSettledDollars: number;
  totalSettledUnits: number;
  netPnlDollars: number;
  netPnlUnits: number;
  roiPct: number;
  winRatePct: number;
  pendingPotentialProfitDollars: number;
  pendingPotentialProfitUnits: number;
  avgClvDeltaPts: number;
}

// ============================================================================
// CALIBRATION GATE & VALIDATED PRICING ENGINE CONTRACTS
// ============================================================================

export interface WalkForwardFold {
  trainWeeks: string;
  testWeek: string;
  trainSampleSize: number;
  testSampleSize: number;
  modelBrierScore: number;
  marketDeviggedBrierScore: number;
  brierImprovement: number; // positive means model is better
  modelLogLoss: number;
  marketDeviggedLogLoss: number;
  logLossImprovement: number;
  lambdaBlendWeight: number; // optimal blend weight for this test fold
  clvMeanPts: number; // mean beat against closing line
  clvPositiveRatePct: number;
  foldStatus: 'PASS' | 'FAIL_NO_EDGE' | 'FAIL_OVERCONFIDENT';
}

export interface CalibrationGateReport {
  gateStatus: 'LOCKED' | 'PASSED';
  passedThresholdsCount: number;
  totalThresholdsCount: number;
  evaluationTimestamp: string;
  dataWindow: string; // e.g. "2001-2025 Walk-Forward Validation (Zero Lookahead)"
  summaryReason: string;
  isLambdaInformative: boolean; // true if lambda 95% CI is strictly > 0.05
  overallMetrics: {
    modelBrierScore: number;
    marketDeviggedBrierScore: number;
    brierDelta: number; // modelBrier - marketBrier (negative is better)
    modelLogLoss: number;
    marketDeviggedLogLoss: number;
    logLossDelta: number;
    lambdaBlendWeight: number; // market-anchored blend weight
    lambdaBootstrapCI95: [number, number]; // [lower, upper] 95% bootstrap CI
    lambdaBootstrapSamples: number;
    openerToCloseClvMeanPts: number;
    openerToCloseClvBeatRatePct: number;
    closingLineDevigMethod: 'Multiplicative Power Devig' | 'Additive Shin';
  };
  criteriaChecks: Array<{
    id: string;
    title: string;
    requirement: string;
    actualValue: string;
    passed: boolean;
    explanation: string;
  }>;
  walkForwardFolds: WalkForwardFold[];
  plainLanguageSummary: string;
}

export interface PricingComparisonItem {
  id: string;
  week: string;
  weekNumber: number;
  date: string;
  favorite: string;
  underdog: string;
  venue: string;
  isNeutral: boolean;
  // Market Consensuses
  marketOpenerSpread: number; // Opening spread (e.g. -7.0)
  marketClosingSpread: number; // Closing spread (e.g. -8.0)
  marketConsensusOdds: number; // e.g. -110
  marketDeviggedProb: number; // Fair probability from devigged market (e.g. 0.705)
  // Model Projections from Validated Pricing Engine
  modelFairSpread: number; // Model fair spread (e.g. -9.4)
  modelFairTotal: number; // Model fair total (e.g. 48.5)
  modelFairProb: number; // Model fair win prob (e.g. 0.742)
  modelScoreProjection: string; // e.g. "31 - 21"
  // Market Anchor Discrepancy
  spreadDiscrepancy: number; // modelFairSpread - marketClosingSpread
  probDiscrepancy: number; // modelFairProb - marketDeviggedProb
  blendWeightLambda: number; // Current lambda applied
  marketAnchoredBlendProb: number; // lambda * modelProb + (1-lambda) * marketProb
  clvMovementPts: number; // marketClosingSpread - marketOpenerSpread
  // CFBD SP+ Analytics (0.778 Win Correlation)
  spPlusDiff: number; // Favorite SP+ minus Underdog SP+
  spPlusFavOverall: number;
  spPlusFavOffense: number;
  spPlusFavDefense: number;
  spPlusDogOverall: number;
  spPlusDogOffense: number;
  spPlusDogDefense: number;
  srsDiff: number;
  fpiDiff: number;
  // Gate Status
  isLocked: boolean;
  lockedReason: string;
}

export interface SPPlusTeamRating {
  team: string;
  conference: string;
  spPlusRank: number;
  spPlusOverall: number;
  spPlusOffense: number;
  spPlusOffenseRank: number;
  spPlusDefense: number;
  spPlusDefenseRank: number;
  spPlusSpecialTeams: number;
  srsRating: number;
  eloRating: number;
  fpiRating: number;
  winCorrelation: number; // 0.778
  wins2025: number;
  losses2025: number;
  projWins2026: number;
  projLosses2026: number;
  surplusWins: number;
  sosRank: number;
  returningProductionPct: number;
}






