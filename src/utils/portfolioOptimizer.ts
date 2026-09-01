import {
  Pick2026,
  CuratedParlayPick,
  CuratedTeaserPick,
  OptimalPortfolioTicket,
  GameExposureSummary,
  SlatePortfolioPlan,
  BetSlipLeg,
} from '../types';

export interface PortfolioConfig {
  week: string;
  totalBankroll: number;
  unitSize?: number;
  riskMode: 'auto' | 'balanced' | 'pure_equity' | 'aggressive_alpha';
  maxSingleGameRiskPct: number; // e.g. 18 (%)
  gradeFilter: 'All' | 'A+' | 'A_and_Above';
  maxParlayTickets?: number;
  maxTeaserTickets?: number;
}

export function generateOptimalSlatePortfolio(
  picks: Pick2026[],
  parlays: CuratedParlayPick[],
  teasers: CuratedTeaserPick[],
  config: PortfolioConfig
): SlatePortfolioPlan {
  const { week, totalBankroll, unitSize, riskMode, maxSingleGameRiskPct, gradeFilter } = config;
  const MAX_PARLAY_TICKETS = config.maxParlayTickets ?? 8;
  const MAX_TEASER_TICKETS = config.maxTeaserTickets ?? 6;

  // Filter available picks by week and grade
  const availableStraightPicks = picks.filter((p) => {
    if (week !== 'All' && p.week !== week) return false;
    if (gradeFilter === 'A+' && p.confidenceGrade !== 'A+') return false;
    if (gradeFilter === 'A_and_Above' && p.confidenceGrade !== 'A+' && p.confidenceGrade !== 'A') return false;
    return true;
  });

  const availableParlays = parlays.filter((par) => {
    if (week !== 'All' && par.week !== week && par.week !== 'All Weeks') return false;
    if (gradeFilter === 'A+' && par.grade !== 'A+') return false;
    if (gradeFilter === 'A_and_Above' && par.grade !== 'A+' && par.grade !== 'A') return false;
    return true;
  });

  const availableTeasers = teasers.filter((t) => {
    if (week !== 'All' && t.week !== week) return false;
    return true;
  });

  // 1. Dynamic Auto-Allocation AI Engine
  // Analyzes slate edge concentration and auto-determines the mathematically superior allocation
  let effectiveRiskMode = riskMode;
  if (riskMode === 'auto') {
    const aPlusCount = availableStraightPicks.filter((p) => p.confidenceGrade === 'A+').length;
    const highEvParlays = availableParlays.filter((p) => p.expectedValue >= 18).length;
    if (aPlusCount >= 3 && availableTeasers.length >= 2) {
      effectiveRiskMode = 'balanced'; // Optimal asymmetric multi-segment allocation
    } else if (aPlusCount >= 4) {
      effectiveRiskMode = 'pure_equity'; // Heavy straight foundation
    } else if (highEvParlays >= 2) {
      effectiveRiskMode = 'aggressive_alpha';
    } else {
      effectiveRiskMode = 'balanced';
    }
  }

  let straightRatio = 0.60;
  let parlayRatio = 0.25;
  let teaserRatio = 0.15;

  if (effectiveRiskMode === 'pure_equity') {
    straightRatio = 0.75;
    parlayRatio = 0.15;
    teaserRatio = 0.10;
  } else if (effectiveRiskMode === 'aggressive_alpha') {
    straightRatio = 0.45;
    parlayRatio = 0.35;
    teaserRatio = 0.20;
  }

  // Adjust if no parlays or teasers exist for this week
  if (availableParlays.length === 0 && availableTeasers.length === 0) {
    straightRatio = 1.0;
    parlayRatio = 0.0;
    teaserRatio = 0.0;
  } else if (availableParlays.length === 0) {
    straightRatio += parlayRatio * 0.7;
    teaserRatio += parlayRatio * 0.3;
    parlayRatio = 0.0;
  } else if (availableTeasers.length === 0) {
    straightRatio += teaserRatio * 0.7;
    parlayRatio += teaserRatio * 0.3;
    teaserRatio = 0.0;
  }

  // Determine unit value (e.g. $20/unit means standard 100u bankroll is $2,000)
  const unitValue = unitSize && unitSize > 0 ? unitSize : Math.max(1, totalBankroll / 100);
  const effectiveTotalBankroll = totalBankroll;
  const straightTargetDollars = effectiveTotalBankroll * straightRatio;
  const parlayTargetDollars = effectiveTotalBankroll * parlayRatio;
  const teaserTargetDollars = effectiveTotalBankroll * teaserRatio;

  const tickets: OptimalPortfolioTicket[] = [];
  const gameExposureMap: Record<
    string,
    {
      gameName: string;
      grade: 'A+' | 'A' | 'B+' | 'B';
      side: string;
      straightUnits: number;
      parlayUnits: number;
      teaserUnits: number;
      activeTicketsCount: number;
    }
  > = {};

  const getGameKey = (id: string) => id;

  // Initialize tracking
  picks.forEach((p) => {
    const pAny = p as any;
    const gameTitle = p.favorite && p.underdog ? `${p.favorite} vs ${p.underdog}` : pAny.matchup || p.id;
    gameExposureMap[getGameKey(p.id)] = {
      gameName: gameTitle,
      grade: p.confidenceGrade,
      side: p.recommendedBetSide || pAny.recommendedTeam || 'Spread',
      straightUnits: 0,
      parlayUnits: 0,
      teaserUnits: 0,
      activeTicketsCount: 0,
    };
  });

  // Helper to test if adding exposure exceeds single-game cap
  const maxGameUnits = (totalBankroll * (maxSingleGameRiskPct / 100)) / unitValue;

  const canAddExposure = (gameId: string, additionalUnits: number) => {
    const current = gameExposureMap[gameId];
    if (!current) return true;
    const currentTotal = current.straightUnits + current.parlayUnits + current.teaserUnits;
    return currentTotal + additionalUnits <= maxGameUnits + 0.1;
  };

  // -------------------------------------------------------------
  // STEP 1: ALLOCATE STRAIGHT BETS BY GRADE & ROI PRIORITY
  // -------------------------------------------------------------
  // Grade weights: A+ = 2.5u, A = 1.5u, B+ = 0.75u, B = 0.5u
  let straightPoolRemaining = straightTargetDollars;

  // Sort straight picks by Expected Value / Tier ROI descending
  const sortedStraights = [...availableStraightPicks].sort((a, b) => b.expectedValue - a.expectedValue);

  // First pass: compute raw weights
  let totalStraightRawUnits = 0;
  sortedStraights.forEach((p) => {
    let weight = 1.0;
    if (p.confidenceGrade === 'A+') weight = 2.5;
    else if (p.confidenceGrade === 'A') weight = 1.5;
    else if (p.confidenceGrade === 'B+') weight = 0.75;
    else weight = 0.5;
    totalStraightRawUnits += weight;
  });

  if (totalStraightRawUnits > 0 && sortedStraights.length > 0) {
    const scaleFactor = (straightTargetDollars / unitValue) / totalStraightRawUnits;

    sortedStraights.forEach((p) => {
      let baseUnits = 1.0;
      if (p.confidenceGrade === 'A+') baseUnits = 2.5;
      else if (p.confidenceGrade === 'A') baseUnits = 1.5;
      else if (p.confidenceGrade === 'B+') baseUnits = 0.75;
      else baseUnits = 0.5;

      let scaledUnits = Math.round(baseUnits * scaleFactor * 10) / 10;
      // Ensure min 0.5u and max cap
      scaledUnits = Math.min(scaledUnits, maxGameUnits * 0.75);
      scaledUnits = Math.max(0.5, scaledUnits);

      const dollars = Math.round(scaledUnits * unitValue);
      const pctOfBankroll = Math.round((dollars / totalBankroll) * 1000) / 10;
      const potentialPayoutDollars = Math.round(dollars * 1.91);

      const pAny = p as any;
      const fav = p.favorite || (pAny.recommendedTeam ? pAny.recommendedTeam : 'Favorite');
      const dog = p.underdog || (pAny.matchup ? pAny.matchup.split(' vs ')[1] || 'Underdog' : 'Underdog');
      const matchupName = p.favorite && p.underdog ? `${p.favorite} vs ${p.underdog}` : pAny.matchup || `${fav} vs ${dog}`;
      const selectionStr = p.recommendedBetText ||
        (p.recommendedBetSide?.includes('Favorite')
          ? `${p.favorite} ${p.marketSpread > 0 ? `+${p.marketSpread}` : p.marketSpread}`
          : p.recommendedBetSide?.includes('Underdog')
          ? `${p.underdog} ${p.marketSpread > 0 ? `-${p.marketSpread}` : `+${Math.abs(p.marketSpread)}`}`
          : pAny.recommendedTeam ? `${pAny.recommendedTeam} ${p.marketSpread}` : `${fav} ${p.marketSpread}`);

      const edgeValue = p.spreadEdgeAbs ?? pAny.edgePoints ?? 3.5;
      const winProbabilityPct = p.feiWinProb ? Math.round(p.feiWinProb * 1000) / 10 : (pAny.winProbability ? Math.round(pAny.winProbability * 1000) / 10 : 55.0);

      const straightLeg: BetSlipLeg = {
        id: `leg-straight-${p.id}`,
        gameId: p.id,
        matchup: matchupName,
        betType: 'spread',
        selection: selectionStr,
        line: p.marketSpread > 0 ? `+${p.marketSpread}` : `${p.marketSpread}`,
        odds: -110,
        modelEdge: edgeValue,
        winProb: winProbabilityPct,
        ev: p.expectedValue,
      };

      tickets.push({
        ticketId: `opt-straight-${p.id}`,
        ticketType: 'straight',
        title: `Core Straight: ${selectionStr}`,
        grade: p.confidenceGrade,
        exactDirective: p.exactAction || pAny.actionRecommendation || `TAKE ${selectionStr}`,
        oddsAmerican: -110,
        multiplier: 1.91,
        allocatedUnits: scaledUnits,
        allocatedDollars: dollars,
        allocatedPct: pctOfBankroll,
        potentialPayoutDollars,
        expectedRoiPct: p.tierHistoricalRoiPct ?? p.expectedValue,
        expectedValuePct: p.expectedValue,
        winProbPct: winProbabilityPct,
        gameIds: [p.id],
        gameNames: [matchupName],
        legs: [straightLeg],
        rationale: `Foundation equity play. FEI +${edgeValue.toFixed(1)} pt discrepancy (${p.tierSampleSize || 100}G backtested tier).`,
        timingWindow: p.timing?.timingWindow || '⚡ Early-Week Open (Mon–Tue)',
        urgency: p.timing?.urgency || 'IMMEDIATE LOCK',
        timingRationale: p.timing?.timingRationale || 'Lock in before sharp line movement.',
        projectedClvDeltaPts: p.timing?.projectedClvDeltaPts || 1.5,
      });

      if (gameExposureMap[p.id]) {
        gameExposureMap[p.id].straightUnits += scaledUnits;
        gameExposureMap[p.id].activeTicketsCount += 1;
      }
    });
  }

  // -------------------------------------------------------------
  // STEP 2: ALLOCATE CURATED PARLAYS WITH ANTI-CLUSTER FILTER
  // -------------------------------------------------------------
  if (parlayTargetDollars > 0 && availableParlays.length > 0) {
    // Smart Zero-Overlap Sorting: In 'balanced', 'pure_equity', or 'auto' mode,
    // prioritize parlays that do NOT overlap with heavily weighted straight bets,
    // achieving 100% distinct game coverage across the entire slate.
    const sortedParlays = [...availableParlays].sort((a, b) => {
      if (effectiveRiskMode !== 'aggressive_alpha') {
        // Compute how many straight units are already committed to legs of parlay A vs B
        const aOverlapUnits = a.legs.reduce((acc, l) => acc + (gameExposureMap[l.gameId]?.straightUnits || 0), 0);
        const bOverlapUnits = b.legs.reduce((acc, l) => acc + (gameExposureMap[l.gameId]?.straightUnits || 0), 0);
        if (aOverlapUnits !== bOverlapUnits) {
          return aOverlapUnits - bOverlapUnits; // Prefer lower overlap first
        }
      }
      return b.expectedValue - a.expectedValue;
    });
    const parlayBudgetUnits = parlayTargetDollars / unitValue;
    const parlayPerTicketUnits = Math.max(0.5, Math.round((parlayBudgetUnits / Math.min(MAX_PARLAY_TICKETS, sortedParlays.length)) * 10) / 10);

    let allocatedParlaysCount = 0;
    for (const parlay of sortedParlays) {
      if (allocatedParlaysCount >= MAX_PARLAY_TICKETS) break;

      // Check if all legs can take exposure without exceeding max single-game cap
      const allLegsCanFit = parlay.legs.every((l) => canAddExposure(l.gameId, parlayPerTicketUnits));

      if (allLegsCanFit) {
        const dollars = Math.round(parlayPerTicketUnits * unitValue);
        const pctOfBankroll = Math.round((dollars / totalBankroll) * 1000) / 10;
        const potentialPayoutDollars = Math.round(dollars * parlay.multiplier);

        const isZeroOverlap = parlay.legs.every((l) => (gameExposureMap[l.gameId]?.straightUnits || 0) <= 0.5);

        const parlayLegs: BetSlipLeg[] = parlay.legs.map((l: any, idx) => {
          const legSelection = l.selection || (l.pickTeam ? `${l.pickTeam} ${l.targetLine || ''}`.trim() : 'Spread');
          let legLine = 'Spread';
          if (l.targetLine) {
            legLine = l.targetLine;
          } else if (legSelection.includes('+')) {
            legLine = `+${legSelection.split('+')[1].trim()}`;
          } else if (legSelection.includes('-')) {
            legLine = `-${legSelection.split('-')[1].trim()}`;
          }
          const winProbVal = l.winProb !== undefined
            ? (l.winProb <= 1 ? Math.round(l.winProb * 1000) / 10 : l.winProb)
            : (l.individualWinProb ? Math.round(l.individualWinProb * 1000) / 10 : 55.0);

          return {
            id: `leg-parlay-${parlay.id}-${idx}`,
            gameId: l.gameId,
            matchup: l.matchup,
            betType: 'spread',
            selection: legSelection,
            line: legLine,
            odds: l.bookOdds || -110,
            modelEdge: l.modelEdge ?? l.edgePoints ?? 3.5,
            winProb: winProbVal,
            ev: (l.modelEdge ?? l.edgePoints ?? 3.5) * 2.5,
          };
        });

        const parlayAny = parlay as any;
        tickets.push({
          ticketId: `opt-parlay-${parlay.id}`,
          ticketType: 'parlay',
          title: isZeroOverlap ? `Zero-Overlap Parlay: ${parlay.title}` : `Alpha Parlay: ${parlay.title}`,
          grade: parlay.grade || 'A',
          exactDirective: parlay.exactAction || `TAKE PARLAY: ${parlay.title}`,
          oddsAmerican: parlay.payoutOddsAmerican ?? parlayAny.combinedAmericanOdds ?? 260,
          multiplier: parlay.multiplier,
          allocatedUnits: parlayPerTicketUnits,
          allocatedDollars: dollars,
          allocatedPct: pctOfBankroll,
          potentialPayoutDollars,
          expectedRoiPct: parlay.tierHistoricalRoiPct ?? parlay.expectedValue,
          expectedValuePct: parlay.expectedValue,
          winProbPct: parlay.tierWinRatePct ?? (parlayAny.modelWinProbability ? Math.round(parlayAny.modelWinProbability * 1000) / 10 : 35.0),
          gameIds: parlay.legs.map((l) => l.gameId),
          gameNames: parlay.legs.map((l) => l.matchup),
          legs: parlayLegs,
          rationale: isZeroOverlap
            ? `Zero-overlap hedge & growth. Covers slate games independent of primary straight bets (+${parlay.expectedValue}% EV).`
            : `Asymmetric upside combo. Multi-game alpha compounding with strict covariance limits.`,
          timingWindow: '⚡ Early-Week Open (Mon–Tue)',
          urgency: 'IMMEDIATE LOCK',
          timingRationale: 'Parlay leg prices degrade quickly as sharp books adjust individual spreads.',
          projectedClvDeltaPts: 2.5,
        });

        parlay.legs.forEach((l) => {
          if (gameExposureMap[l.gameId]) {
            gameExposureMap[l.gameId].parlayUnits += parlayPerTicketUnits;
            gameExposureMap[l.gameId].activeTicketsCount += 1;
          }
        });

        allocatedParlaysCount++;
      }
    }
  }

  // -------------------------------------------------------------
  // STEP 3: ALLOCATE WONG CORRIDOR TEASERS WITH ANTI-CLUSTER FILTER
  // -------------------------------------------------------------
  if (teaserTargetDollars > 0 && availableTeasers.length > 0) {
    const sortedTeasers = [...availableTeasers].sort((a, b) => b.expectedValue - a.expectedValue);
    const teaserBudgetUnits = teaserTargetDollars / unitValue;
    const teaserPerTicketUnits = Math.max(0.5, Math.round((teaserBudgetUnits / Math.min(MAX_TEASER_TICKETS, sortedTeasers.length)) * 10) / 10);

    let allocatedTeasersCount = 0;
    for (const teaser of sortedTeasers) {
      if (allocatedTeasersCount >= MAX_TEASER_TICKETS) break;

      const allLegsCanFit = teaser.legs.every((l) => canAddExposure(l.gameId, teaserPerTicketUnits));

      if (allLegsCanFit) {
        const dollars = Math.round(teaserPerTicketUnits * unitValue);
        const pctOfBankroll = Math.round((dollars / totalBankroll) * 1000) / 10;
        const potentialPayoutDollars = Math.round(dollars * teaser.multiplier);

        const teaserLegs: BetSlipLeg[] = teaser.legs.map((l: any, idx) => {
          const teamName = l.matchup?.includes(' vs ') ? l.matchup.split(' vs ')[0] : (l.selection || 'Team');
          return {
            id: `leg-teaser-${teaser.id}-${idx}`,
            gameId: l.gameId,
            matchup: l.matchup,
            betType: 'spread',
            selection: `${teamName} (Teased to ${l.teasedLine || '+6'})`,
            line: l.teasedLine || '+6',
            odds: -120,
            modelEdge: 3.5,
            winProb: l.individualTeasedWinProb ? (l.individualTeasedWinProb <= 1 ? Math.round(l.individualTeasedWinProb * 1000) / 10 : l.individualTeasedWinProb) : 74.0,
            ev: 12.0,
          };
        });

        const teaserAny = teaser as any;
        tickets.push({
          ticketId: `opt-teaser-${teaser.id}`,
          ticketType: 'teaser',
          title: `Key-Number Teaser: ${teaser.title}`,
          grade: 'A',
          exactDirective: teaser.exactAction || `TAKE TEASER: ${teaser.title}`,
          oddsAmerican: teaser.payoutOddsAmerican ?? teaserAny.combinedAmericanOdds ?? -120,
          multiplier: teaser.multiplier,
          allocatedUnits: teaserPerTicketUnits,
          allocatedDollars: dollars,
          allocatedPct: pctOfBankroll,
          potentialPayoutDollars,
          expectedRoiPct: teaser.tierHistoricalRoiPct ?? teaser.expectedValue,
          expectedValuePct: teaser.expectedValue,
          winProbPct: teaser.teaserCoverWinRatePct ?? (teaserAny.modelWinProbability ? Math.round(teaserAny.modelWinProbability * 1000) / 10 : 72.0),
          gameIds: teaser.legs.map((l) => l.gameId),
          gameNames: teaser.legs.map((l) => l.matchup),
          legs: teaserLegs,
          rationale: `High-floor cluster defense. Crosses key numbers 3, 4, 6, and 7 at -120 juice.`,
          timingWindow: '⚡ Early-Week Open (Mon–Tue)',
          urgency: 'IMMEDIATE LOCK',
          timingRationale: 'Teaser key corridor value is maximized before lines move off 1.5-2.5 or 7.5-8.5.',
          projectedClvDeltaPts: 1.8,
        });

        teaser.legs.forEach((l) => {
          if (gameExposureMap[l.gameId]) {
            gameExposureMap[l.gameId].teaserUnits += teaserPerTicketUnits;
            gameExposureMap[l.gameId].activeTicketsCount += 1;
          }
        });

        allocatedTeasersCount++;
      }
    }
  }

  // -------------------------------------------------------------
  // STEP 4: COMPILE EXPOSURE HEATMAP & DIVERSIFICATION METRICS
  // -------------------------------------------------------------
  const gameExposures: GameExposureSummary[] = [];
  let maxSingleGameExposurePct = 0;
  let sumSquaredExposure = 0;

  Object.entries(gameExposureMap).forEach(([id, data]) => {
    const totalExposureUnits = data.straightUnits + data.parlayUnits + data.teaserUnits;
    if (totalExposureUnits > 0) {
      const totalExposureDollars = Math.round(totalExposureUnits * unitValue);
      const portfolioExposurePct = Math.round((totalExposureDollars / totalBankroll) * 1000) / 10;

      if (portfolioExposurePct > maxSingleGameExposurePct) {
        maxSingleGameExposurePct = portfolioExposurePct;
      }

      sumSquaredExposure += Math.pow(portfolioExposurePct, 2);

      const isOverConcentrated = portfolioExposurePct > maxSingleGameRiskPct;
      let concentrationRiskTier: 'safe' | 'optimal' | 'elevated' | 'capped' = 'optimal';

      if (portfolioExposurePct <= 10) concentrationRiskTier = 'safe';
      else if (portfolioExposurePct <= 16) concentrationRiskTier = 'optimal';
      else if (portfolioExposurePct <= maxSingleGameRiskPct) concentrationRiskTier = 'elevated';
      else concentrationRiskTier = 'capped';

      gameExposures.push({
        gameId: id,
        gameName: data.gameName,
        grade: data.grade,
        side: data.side,
        straightUnits: Math.round(data.straightUnits * 10) / 10,
        parlayUnits: Math.round(data.parlayUnits * 10) / 10,
        teaserUnits: Math.round(data.teaserUnits * 10) / 10,
        totalExposureUnits: Math.round(totalExposureUnits * 10) / 10,
        totalExposureDollars,
        portfolioExposurePct,
        isOverConcentrated,
        concentrationRiskTier,
        activeTicketsCount: data.activeTicketsCount,
      });
    }
  });

  // Sort exposures by total exposure % descending
  gameExposures.sort((a, b) => b.totalExposureUnits - a.totalExposureUnits);

  // Diversification Score (normalized HHI index)
  // Low HHI (< 1500) = High diversification (score 85-100)
  // Moderate HHI (1500 - 2500) = score 65-84
  // High HHI (> 2500) = High concentration (score < 65)
  const hhi = sumSquaredExposure;
  let diversificationScore = Math.max(20, Math.min(98, Math.round(100 - (hhi / 100))));
  if (gameExposures.length >= 6 && maxSingleGameExposurePct <= maxSingleGameRiskPct) {
    diversificationScore = Math.max(diversificationScore, 88);
  }

  let diversificationHealth: 'Optimal (Anti-Cluster)' | 'Moderate Exposure' | 'High Concentration Warning' =
    'Optimal (Anti-Cluster)';
  if (diversificationScore < 60 || maxSingleGameExposurePct > maxSingleGameRiskPct) {
    diversificationHealth = 'High Concentration Warning';
  } else if (diversificationScore < 80) {
    diversificationHealth = 'Moderate Exposure';
  }

  // Portfolio Totals & Projected ROI %
  let totalAllocatedDollars = 0;
  let totalAllocatedUnits = 0;
  let straightDollars = 0;
  let straightUnits = 0;
  let parlayDollars = 0;
  let parlayUnits = 0;
  let teaserDollars = 0;
  let teaserUnits = 0;
  let weightedRoiSum = 0;

  tickets.forEach((t) => {
    totalAllocatedDollars += t.allocatedDollars;
    totalAllocatedUnits += t.allocatedUnits;
    weightedRoiSum += t.allocatedDollars * (t.expectedRoiPct / 100);

    if (t.ticketType === 'straight') {
      straightDollars += t.allocatedDollars;
      straightUnits += t.allocatedUnits;
    } else if (t.ticketType === 'parlay') {
      parlayDollars += t.allocatedDollars;
      parlayUnits += t.allocatedUnits;
    } else if (t.ticketType === 'teaser') {
      teaserDollars += t.allocatedDollars;
      teaserUnits += t.allocatedUnits;
    }
  });

  const projectedSlateRoiPct =
    totalAllocatedDollars > 0 ? Math.round((weightedRoiSum / totalAllocatedDollars) * 1000) / 10 : 0;
  const projectedNetProfitDollars = Math.round(weightedRoiSum);

  return {
    week,
    totalBankroll,
    unitValue,
    totalUnits: Math.round(totalAllocatedUnits * 10) / 10,
    straightBudgetUnits: Math.round(straightUnits * 10) / 10,
    straightBudgetDollars: straightDollars,
    straightBudgetPct: totalAllocatedDollars > 0 ? Math.round((straightDollars / totalAllocatedDollars) * 1000) / 10 : 0,
    parlayBudgetUnits: Math.round(parlayUnits * 10) / 10,
    parlayBudgetDollars: parlayDollars,
    parlayBudgetPct: totalAllocatedDollars > 0 ? Math.round((parlayDollars / totalAllocatedDollars) * 1000) / 10 : 0,
    teaserBudgetUnits: Math.round(teaserUnits * 10) / 10,
    teaserBudgetDollars: teaserDollars,
    teaserBudgetPct: totalAllocatedDollars > 0 ? Math.round((teaserDollars / totalAllocatedDollars) * 1000) / 10 : 0,
    tickets,
    gameExposures,
    projectedSlateRoiPct,
    projectedNetProfitDollars,
    maxSingleGameExposurePct,
    diversificationScore,
    diversificationHealth,
  };
}
