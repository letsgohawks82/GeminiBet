// tests/portfolioOptimizer.test.ts
import { describe, it, expect } from 'vitest';
import { generateOptimalSlatePortfolio, PortfolioConfig } from '../src/utils/portfolioOptimizer';
import { Pick2026, CuratedParlayPick, CuratedTeaserPick } from '../src/types';

describe('generateOptimalSlatePortfolio tests', () => {
  const samplePicks = [
    {
      id: 'p1',
      gameId: 'g1',
      week: 'Week 0',
      matchup: 'TCU vs Stanford',
      kickoffDate: 'Aug 29, 2026',
      betType: 'spread',
      recommendedTeam: 'TCU',
      modelSpread: -7.5,
      marketSpread: -3.5,
      marketOdds: -110,
      edgePoints: 4.0,
      winProbability: 0.62,
      expectedValue: 18.4,
      confidenceGrade: 'A+',
      actionRecommendation: 'TAKE NOW',
      timingReason: 'Sharp steam active',
      urgencyLevel: 'HIGH',
      bestSportsbook: 'DraftKings',
      sportsbookOdds: {
        DraftKings: { spread: -3.5, odds: -110 },
        FanDuel: { spread: -4.0, odds: -110 },
        BetMGM: { spread: -3.5, odds: -115 },
        Caesars: { spread: -4.0, odds: -108 },
        PointsBet: { spread: -3.5, odds: -112 },
      },
      quarterKellyStakeUnits: 1.2,
      halfKellyStakeUnits: 2.4,
      fullKellyStakeUnits: 4.8,
      suggestedStakePct: 2.4,
      keyStats: ['TCU FEI +0.14 vs Stanford -0.05'],
      modelRationale: 'FEI offensive edge',
    },
    {
      id: 'p2',
      gameId: 'g2',
      week: 'Week 0',
      matchup: 'SMU vs Nevada',
      kickoffDate: 'Aug 29, 2026',
      betType: 'spread',
      recommendedTeam: 'SMU',
      modelSpread: -28.0,
      marketSpread: -24.5,
      marketOdds: -110,
      edgePoints: 3.5,
      winProbability: 0.59,
      expectedValue: 12.6,
      confidenceGrade: 'A',
      actionRecommendation: 'TAKE NOW',
      timingReason: 'High market liquidity',
      urgencyLevel: 'MEDIUM',
      bestSportsbook: 'FanDuel',
      sportsbookOdds: {
        DraftKings: { spread: -25.0, odds: -110 },
        FanDuel: { spread: -24.5, odds: -110 },
        BetMGM: { spread: -25.0, odds: -115 },
        Caesars: { spread: -24.5, odds: -115 },
        PointsBet: { spread: -24.5, odds: -112 },
      },
      quarterKellyStakeUnits: 0.9,
      halfKellyStakeUnits: 1.8,
      fullKellyStakeUnits: 3.6,
      suggestedStakePct: 1.8,
      keyStats: ['SMU +0.22 explosive drive rate'],
      modelRationale: 'Explosive drive rate edge',
    },
  ] as unknown as Pick2026[];

  const sampleParlays = [
    {
      id: 'parlay-1',
      title: 'Week 0 Anchor Power Parlay',
      week: 'Week 0',
      description: 'High correlation 2-leg ticket',
      combinedAmericanOdds: 264,
      combinedDecimalOdds: 3.64,
      modelWinProbability: 0.366,
      expectedValue: 33.2,
      correlationAdvantage: 'Positive pace correlation',
      suggestedUnit: 0.75,
      legs: [
        {
          gameId: 'g1',
          matchup: 'TCU vs Stanford',
          betType: 'spread',
          pickTeam: 'TCU',
          targetLine: '-3.5',
          bookOdds: -110,
          bestBook: 'DraftKings',
          individualWinProb: 0.62,
          edgePoints: 4.0,
        },
        {
          gameId: 'g2',
          matchup: 'SMU vs Nevada',
          betType: 'spread',
          pickTeam: 'SMU',
          targetLine: '-24.5',
          bookOdds: -110,
          bestBook: 'FanDuel',
          individualWinProb: 0.59,
          edgePoints: 3.5,
        },
      ],
    },
  ] as unknown as CuratedParlayPick[];

  const sampleTeasers = [
    {
      id: 'teaser-1',
      title: 'Week 0 Wong Power Cushion',
      week: 'Week 0',
      teaserType: '6-Point Two-Leg Teaser',
      multiplier: 1.83,
      combinedAmericanOdds: -120,
      modelWinProbability: 0.72,
      expectedValue: 31.8,
      wongAdvantageExplanation: 'Crosses key numbers 3, 4, 6, 7',
      suggestedUnit: 1.5,
      legs: [
        {
          gameId: 'g1',
          matchup: 'TCU vs Stanford',
          baseLine: '-3.5',
          teasedLine: '+2.5',
          keyNumbersCrossed: 'Crosses 3, 0, +1, +2',
          individualTeasedWinProb: 0.85,
        },
        {
          gameId: 'g2',
          matchup: 'SMU vs Nevada',
          baseLine: '-24.5',
          teasedLine: '-18.5',
          keyNumbersCrossed: 'Crosses 20, 21, 24',
          individualTeasedWinProb: 0.85,
        },
      ],
    },
  ] as unknown as CuratedTeaserPick[];

  it('allocates portfolio with balanced risk and respects unitSize scaling', () => {
    const config: PortfolioConfig = {
      week: 'Week 0',
      totalBankroll: 2000,
      unitSize: 20,
      riskMode: 'balanced',
      maxSingleGameRiskPct: 18,
      gradeFilter: 'All',
    };

    const plan = generateOptimalSlatePortfolio(samplePicks, sampleParlays, sampleTeasers, config);

    expect(plan.tickets.length).toBeGreaterThan(0);
    const totalDollars = plan.straightBudgetDollars + plan.parlayBudgetDollars + plan.teaserBudgetDollars;
    expect(totalDollars).toBeLessThanOrEqual(config.totalBankroll);
    expect(plan.straightBudgetDollars).toBeGreaterThan(0);
    expect(plan.unitValue).toBe(20);
  });

  it('respects maxParlayTickets and maxTeaserTickets limits', () => {
    const config: PortfolioConfig = {
      week: 'Week 0',
      totalBankroll: 5000,
      unitSize: 50,
      riskMode: 'aggressive_alpha',
      maxSingleGameRiskPct: 25,
      gradeFilter: 'All',
      maxParlayTickets: 1,
      maxTeaserTickets: 1,
    };

    const plan = generateOptimalSlatePortfolio(samplePicks, sampleParlays, sampleTeasers, config);

    const parlayTickets = plan.tickets.filter((t) => t.ticketType === 'parlay');
    const teaserTickets = plan.tickets.filter((t) => t.ticketType === 'teaser');

    expect(parlayTickets.length).toBeLessThanOrEqual(1);
    expect(teaserTickets.length).toBeLessThanOrEqual(1);
  });

  it('enforces single game risk caps to prevent overexposure', () => {
    const config: PortfolioConfig = {
      week: 'Week 0',
      totalBankroll: 1000,
      unitSize: 10,
      riskMode: 'pure_equity',
      maxSingleGameRiskPct: 5, // Tight cap: 5% = $50 = 5 units max per game
      gradeFilter: 'All',
    };

    const plan = generateOptimalSlatePortfolio(samplePicks, sampleParlays, sampleTeasers, config);

    plan.gameExposures.forEach((exp) => {
      expect(exp.totalExposureDollars).toBeLessThanOrEqual(55); // Within tolerance
    });
  });
});
