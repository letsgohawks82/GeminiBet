import { DetailedGame, RecordMetric, TierRow } from '../types';

export function calculateBettingMetric(
  wins: number,
  losses: number,
  pushes: number = 0
): RecordMetric {
  const decisiveTotal = wins + losses;
  const total = wins + losses + pushes;
  const winPctDecisive = decisiveTotal > 0 ? (wins / decisiveTotal) * 100 : 0;
  const winPctTotal = total > 0 ? (wins / total) * 100 : 0;

  // -110 standard juice betting calculation (risk $110 to win $100, or flat $100 bet: win pays $90.909, loss loses $100)
  const profitDollars = wins * 90.909 - losses * 100;
  const totalRiskDollars = (wins + losses) * 100;
  const roi = totalRiskDollars > 0 ? (profitDollars / totalRiskDollars) * 100 : 0;
  const profitUnits = wins * 0.90909 - losses * 1.0;

  return {
    wins,
    losses,
    pushes,
    winPctDecisive: Math.round(winPctDecisive * 100) / 100,
    winPctTotal: Math.round(winPctTotal * 100) / 100,
    profitDollars: Math.round(profitDollars),
    profitUnits: Math.round(profitUnits * 10) / 10,
    roi: Math.round(roi * 10) / 10,
  };
}

export function computeTierGroup(
  games: DetailedGame[],
  tierName: string,
  category: string
): TierRow {
  let atsWins = 0;
  let atsLosses = 0;
  let atsPushes = 0;

  let ouWins = 0;
  let ouLosses = 0;
  let ouPushes = 0;

  let suWins = 0;
  let suLosses = 0;
  let peSum = 0;

  for (const g of games) {
    if (g.ats === 'Win') atsWins++;
    else if (g.ats === 'Loss') atsLosses++;
    else if (g.ats === 'Push') atsPushes++;

    if (g.ou === 'Win') ouWins++;
    else if (g.ou === 'Loss') ouLosses++;
    else if (g.ou === 'Push') ouPushes++;

    if (g.su === 'Win') suWins++;
    else suLosses++;

    peSum += g.pe;
  }

  const totalGames = games.length;
  const atsMetric = calculateBettingMetric(atsWins, atsLosses, atsPushes);
  const ouMetric = calculateBettingMetric(ouWins, ouLosses, ouPushes);
  const suMetric = calculateBettingMetric(suWins, suLosses, 0);
  const avgPe = totalGames > 0 ? Math.round((peSum / totalGames) * 100) / 100 : 0;

  // Determine edge rating based on ATS win rate & sample size
  let edgeRating: 'elite' | 'strong' | 'neutral' | 'avoid' = 'neutral';
  let recommendation = 'Neutral expectation near market coinflip.';

  if (totalGames >= 30) {
    if (atsMetric.winPctDecisive >= 55.0 && atsMetric.roi && atsMetric.roi > 4.5) {
      edgeRating = 'elite';
      recommendation = `🔥 High Edge (+${atsMetric.roi}% ROI). Model shows strong alpha against closing line.`;
    } else if (atsMetric.winPctDecisive >= 52.4) {
      edgeRating = 'strong';
      recommendation = `⚡ Profitable Edge (+${atsMetric.roi}% ROI). Beat standard -110 hurdle.`;
    } else if (atsMetric.winPctDecisive <= 48.0) {
      edgeRating = 'avoid';
      recommendation = `⚠️ Fade / Avoid (${atsMetric.roi}% ROI). Underperforms market baseline.`;
    }
  }

  return {
    name: tierName,
    category,
    totalGames,
    ats: atsMetric,
    ou: ouMetric,
    su: suMetric,
    avgPe,
    edgeRating,
    recommendation,
  };
}

export function generateAllTiers(games: DetailedGame[]): Record<string, TierRow[]> {
  // 1. Spread Edge Magnitude
  const spreadEdgeTiers = [
    { label: '≥ 7.0 pts Edge (Mega Discrepancy)', filter: (g: DetailedGame) => g.spreadEdgeAbs >= 7.0 },
    { label: '5.0 - 6.9 pts Edge (High Discrepancy)', filter: (g: DetailedGame) => g.spreadEdgeAbs >= 5.0 && g.spreadEdgeAbs < 7.0 },
    { label: '3.0 - 4.9 pts Edge (Moderate Discrepancy)', filter: (g: DetailedGame) => g.spreadEdgeAbs >= 3.0 && g.spreadEdgeAbs < 5.0 },
    { label: '1.0 - 2.9 pts Edge (Low Discrepancy)', filter: (g: DetailedGame) => g.spreadEdgeAbs >= 1.0 && g.spreadEdgeAbs < 3.0 },
    { label: '< 1.0 pt Edge (Consensus / Market Aligned)', filter: (g: DetailedGame) => g.spreadEdgeAbs < 1.0 },
  ];

  // 2. Model Side / Bias Splits (Backing Favorite vs Underdog with Edge)
  const sideSplits = [
    { label: 'Model Backs Favorite (PM > Market Spread)', filter: (g: DetailedGame) => g.modelAtsSide === 'Fav' },
    { label: 'Model Backs Favorite with ≥ 5.0 pts Edge', filter: (g: DetailedGame) => g.modelAtsSide === 'Fav' && g.spreadEdgeAbs >= 5.0 },
    { label: 'Model Backs Underdog (PM < Market Spread or Dog)', filter: (g: DetailedGame) => g.modelAtsSide === 'Dog' },
    { label: 'Model Backs Underdog with ≥ 5.0 pts Edge', filter: (g: DetailedGame) => g.modelAtsSide === 'Dog' && g.spreadEdgeAbs >= 5.0 },
  ];

  // 3. Spread Magnitude (Closing Spread Sizes)
  const spreadMagnitudeTiers = [
    { label: 'Pick\'em / Tight (0 - 3.0 pts)', filter: (g: DetailedGame) => Math.abs(g.clNum) <= 3.0 },
    { label: 'Key Number Zone (3.5 - 7.0 pts)', filter: (g: DetailedGame) => Math.abs(g.clNum) > 3.0 && Math.abs(g.clNum) <= 7.0 },
    { label: 'Medium Spread (7.5 - 14.0 pts)', filter: (g: DetailedGame) => Math.abs(g.clNum) > 7.0 && Math.abs(g.clNum) <= 14.0 },
    { label: 'Heavy Favorite (14.5 - 21.0 pts)', filter: (g: DetailedGame) => Math.abs(g.clNum) > 14.0 && Math.abs(g.clNum) <= 21.0 },
    { label: 'Mega Blowout (> 21.0 pts)', filter: (g: DetailedGame) => Math.abs(g.clNum) > 21.0 },
  ];

  // 4. Over / Under Discrepancy Tiers
  const totalEdgeTiers = [
    { label: 'High Over Edge (Proj Total ≥ +5.0 pts vs Line)', filter: (g: DetailedGame) => g.totalDiff >= 5.0 },
    { label: 'Moderate Over Edge (+2.5 to +4.9 pts)', filter: (g: DetailedGame) => g.totalDiff >= 2.5 && g.totalDiff < 5.0 },
    { label: 'Neutral Totals (-2.4 to +2.4 pts)', filter: (g: DetailedGame) => g.totalDiff >= -2.4 && g.totalDiff <= 2.4 },
    { label: 'Moderate Under Edge (-4.9 to -2.5 pts)', filter: (g: DetailedGame) => g.totalDiff <= -2.5 && g.totalDiff > -5.0 },
    { label: 'High Under Edge (Proj Total ≤ -5.0 pts vs Line)', filter: (g: DetailedGame) => g.totalDiff <= -5.0 },
  ];

  // 5. Win Probability (PW) Confidence Tiers
  const pwTiers = [
    { label: 'Elite Lock (PW ≥ 85.0%)', filter: (g: DetailedGame) => g.pw >= 0.85 },
    { label: 'Strong Confidence (PW 75.0% - 84.9%)', filter: (g: DetailedGame) => g.pw >= 0.75 && g.pw < 0.85 },
    { label: 'Moderate Favorite (PW 65.0% - 74.9%)', filter: (g: DetailedGame) => g.pw >= 0.65 && g.pw < 0.75 },
    { label: 'Slight Favorite (PW 55.0% - 64.9%)', filter: (g: DetailedGame) => g.pw >= 0.55 && g.pw < 0.65 },
    { label: 'Pure Tossup (PW 50.0% - 54.9%)', filter: (g: DetailedGame) => g.pw >= 0.50 && g.pw < 0.55 },
  ];

  // 6. Total Range (Game Pace / Shootout vs Defense)
  const totalRangeTiers = [
    { label: 'Low Total (< 46.0 pts)', filter: (g: DetailedGame) => g.ct < 46.0 },
    { label: 'Medium Total (46.0 - 54.5 pts)', filter: (g: DetailedGame) => g.ct >= 46.0 && g.ct <= 54.5 },
    { label: 'High Total (55.0 - 64.5 pts)', filter: (g: DetailedGame) => g.ct >= 55.0 && g.ct <= 64.5 },
    { label: 'Shootout Total (≥ 65.0 pts)', filter: (g: DetailedGame) => g.ct >= 65.0 },
  ];

  // 7. Season Schedule Phase
  const weekPhaseTiers = [
    { label: 'Early Season / Non-Conf (Weeks 0–3)', filter: (g: DetailedGame) => g.weekPhase === 'Early (Wk 0-3)' },
    { label: 'Mid-Season Conference Play (Weeks 4–9)', filter: (g: DetailedGame) => g.weekPhase === 'Mid (Wk 4-9)' },
    { label: 'Late Season & Rivalry Week (Weeks 10–15)', filter: (g: DetailedGame) => g.weekPhase === 'Late (Wk 10-15)' },
    { label: 'Postseason / Bowls & CFP', filter: (g: DetailedGame) => g.weekPhase === 'Postseason / Bowls' },
  ];

  // 8. Individual Season Years
  const yearTiers = [
    { label: '2026 Season (To-Date)', filter: (g: DetailedGame) => g.year === 2026 },
    { label: '2025 Season', filter: (g: DetailedGame) => g.year === 2025 },
    { label: '2024 Season', filter: (g: DetailedGame) => g.year === 2024 },
    { label: '2023 Season', filter: (g: DetailedGame) => g.year === 2023 },
    { label: '2022 Season', filter: (g: DetailedGame) => g.year === 2022 },
  ];

  return {
    spreadEdge: spreadEdgeTiers.map(t => computeTierGroup(games.filter(t.filter), t.label, 'Spread Edge Size')),
    sideSplits: sideSplits.map(t => computeTierGroup(games.filter(t.filter), t.label, 'Side & Bias')),
    spreadMagnitude: spreadMagnitudeTiers.map(t => computeTierGroup(games.filter(t.filter), t.label, 'Spread Magnitude')),
    totalEdge: totalEdgeTiers.map(t => computeTierGroup(games.filter(t.filter), t.label, 'O/U Totals Edge')),
    pwTiers: pwTiers.map(t => computeTierGroup(games.filter(t.filter), t.label, 'Win Prob Confidence')),
    totalRanges: totalRangeTiers.map(t => computeTierGroup(games.filter(t.filter), t.label, 'Total Points Range')),
    weekPhases: weekPhaseTiers.map(t => computeTierGroup(games.filter(t.filter), t.label, 'Season Phase')),
    years: yearTiers.map(t => computeTierGroup(games.filter(t.filter), t.label, 'Season Year')),
  };
}

export function getTopActionableEdges(allTiers: Record<string, TierRow[]>): {
  topAtsEdges: TierRow[];
  topOuEdges: TierRow[];
} {
  const flattened = Object.values(allTiers).flat();

  // Find tiers with sample size >= 50 and positive ROI
  const validTiers = flattened.filter(t => t.totalGames >= 40);

  const topAtsEdges = [...validTiers]
    .sort((a, b) => (b.ats.roi || 0) - (a.ats.roi || 0))
    .slice(0, 6);

  const topOuEdges = [...validTiers]
    .sort((a, b) => (b.ou.roi || 0) - (a.ou.roi || 0))
    .slice(0, 6);

  return { topAtsEdges, topOuEdges };
}

// -------------------------------------------------------------
// ADVANCED PRICING & ODDS CONVERSIONS
// -------------------------------------------------------------
export function americanToDecimal(american: number): number {
  if (american > 0) {
    return american / 100 + 1;
  } else {
    return 100 / Math.abs(american) + 1;
  }
}

export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2.0) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

export function calculateBreakEvenWinPct(american: number): number {
  if (american < 0) {
    return (Math.abs(american) / (Math.abs(american) + 100)) * 100;
  } else {
    return (100 / (american + 100)) * 100;
  }
}

export function calculateCustomStraightMetrics(
  wins: number,
  losses: number,
  pushes: number = 0,
  americanOdds: number = -110
) {
  const decisive = wins + losses;
  const winPct = decisive > 0 ? (wins / decisive) * 100 : 0;
  const breakEven = calculateBreakEvenWinPct(americanOdds);
  const decOdds = americanToDecimal(americanOdds);

  // Profit calculation on $100 flat stake per bet
  // When win, net profit = $100 * (decOdds - 1)
  // When loss, net loss = -$100
  const netWinPerBet = (decOdds - 1) * 100;
  const totalProfitDollars = wins * netWinPerBet - losses * 100;
  const totalRiskDollars = decisive * 100;
  const roi = totalRiskDollars > 0 ? (totalProfitDollars / totalRiskDollars) * 100 : 0;
  const unitProfit = decisive > 0 ? totalProfitDollars / 100 : 0;

  return {
    wins,
    losses,
    pushes,
    decisive,
    winPct: Math.round(winPct * 100) / 100,
    breakEven: Math.round(breakEven * 100) / 100,
    edgePct: Math.round((winPct - breakEven) * 100) / 100,
    totalProfitDollars: Math.round(totalProfitDollars),
    unitProfit: Math.round(unitProfit * 10) / 10,
    roi: Math.round(roi * 10) / 10,
  };
}

// -------------------------------------------------------------
// KELLY CRITERION BANKROLL SIZING
// -------------------------------------------------------------
export function calculateKellyStake(
  winProbabilityPct: number,
  americanOdds: number,
  bankroll: number = 10000,
  fractionMultiplier: number = 0.25 // Quarter Kelly default for sports betting safety
) {
  const p = winProbabilityPct / 100;
  const q = 1 - p;
  const b = americanToDecimal(americanOdds) - 1; // decimal payout ratio

  // Full Kelly formula: f* = (b*p - q) / b
  const fullKelly = (b * p - q) / b;
  const safeKelly = Math.max(0, fullKelly * fractionMultiplier);
  const stakeDollars = Math.round(bankroll * safeKelly);
  const expectedValuePct = Math.round((p * b - q) * 1000) / 10;

  return {
    fullKellyPct: Math.round(fullKelly * 10000) / 100,
    recommendedFractionPct: Math.round(safeKelly * 10000) / 100,
    stakeDollars,
    expectedValuePct,
  };
}

// -------------------------------------------------------------
// PARLAY SIMULATION ENGINE (2-LEG, 3-LEG, 4-LEG)
// -------------------------------------------------------------
export function simulateParlays(games: DetailedGame[]): {
  parlay2Leg: {
    totalTickets: number;
    winningTickets: number;
    winRate: number;
    payoutAmerican: number;
    profitUnits: number;
    roi: number;
    breakEvenWinPct: number;
  };
  parlay3Leg: {
    totalTickets: number;
    winningTickets: number;
    winRate: number;
    payoutAmerican: number;
    profitUnits: number;
    roi: number;
    breakEvenWinPct: number;
  };
  parlay4Leg: {
    totalTickets: number;
    winningTickets: number;
    winRate: number;
    payoutAmerican: number;
    profitUnits: number;
    roi: number;
    breakEvenWinPct: number;
  };
} {
  // Group games by season-week
  const weekGroups: Record<string, DetailedGame[]> = {};
  for (const g of games) {
    const key = `${g.year}-${g.week}`;
    if (!weekGroups[key]) weekGroups[key] = [];
    weekGroups[key].push(g);
  }

  let p2_total = 0, p2_won = 0, p2_units = 0;
  let p3_total = 0, p3_won = 0, p3_units = 0;
  let p4_total = 0, p4_won = 0, p4_units = 0;

  // Standard payout on -110 individual legs:
  // 2-leg: (100/110 + 1)^2 - 1 = +2.6446 => +264
  // 3-leg: (100/110 + 1)^3 - 1 = +5.958 => +596
  // 4-leg: (100/110 + 1)^4 - 1 = +12.283 => +1228
  const P2_PAYOUT = 2.645;
  const P3_PAYOUT = 5.958;
  const P4_PAYOUT = 12.283;

  for (const key of Object.keys(weekGroups)) {
    const wkGames = weekGroups[key];
    if (wkGames.length < 2) continue;

    // Sort by highest spread edge
    const sorted = [...wkGames].sort((a, b) => b.spreadEdgeAbs - a.spreadEdgeAbs);

    // 2-Leg Top Edge Parlay (minimum 3.0 pts model edge)
    if (sorted.length >= 2 && sorted[1].spreadEdgeAbs >= 3.0) {
      p2_total++;
      const w1 = sorted[0].ats === 'Win';
      const w2 = sorted[1].ats === 'Win';
      if (w1 && w2) {
        p2_won++;
        p2_units += P2_PAYOUT;
      } else {
        p2_units -= 1.0;
      }
    }

    // 3-Leg Top Edge Parlay
    if (sorted.length >= 3 && sorted[2].spreadEdgeAbs >= 3.0) {
      p3_total++;
      const w1 = sorted[0].ats === 'Win';
      const w2 = sorted[1].ats === 'Win';
      const w3 = sorted[2].ats === 'Win';
      if (w1 && w2 && w3) {
        p3_won++;
        p3_units += P3_PAYOUT;
      } else {
        p3_units -= 1.0;
      }
    }

    // 4-Leg Top Edge Parlay
    if (sorted.length >= 4 && sorted[3].spreadEdgeAbs >= 2.5) {
      p4_total++;
      const w1 = sorted[0].ats === 'Win';
      const w2 = sorted[1].ats === 'Win';
      const w3 = sorted[2].ats === 'Win';
      const w4 = sorted[3].ats === 'Win';
      if (w1 && w2 && w3 && w4) {
        p4_won++;
        p4_units += P4_PAYOUT;
      } else {
        p4_units -= 1.0;
      }
    }
  }

  return {
    parlay2Leg: {
      totalTickets: p2_total,
      winningTickets: p2_won,
      winRate: p2_total > 0 ? Math.round((p2_won / p2_total) * 1000) / 10 : 0,
      payoutAmerican: 264,
      profitUnits: Math.round(p2_units * 10) / 10,
      roi: p2_total > 0 ? Math.round((p2_units / p2_total) * 1000) / 10 : 0,
      breakEvenWinPct: 27.4,
    },
    parlay3Leg: {
      totalTickets: p3_total,
      winningTickets: p3_won,
      winRate: p3_total > 0 ? Math.round((p3_won / p3_total) * 1000) / 10 : 0,
      payoutAmerican: 596,
      profitUnits: Math.round(p3_units * 10) / 10,
      roi: p3_total > 0 ? Math.round((p3_units / p3_total) * 1000) / 10 : 0,
      breakEvenWinPct: 14.4,
    },
    parlay4Leg: {
      totalTickets: p4_total,
      winningTickets: p4_won,
      winRate: p4_total > 0 ? Math.round((p4_won / p4_total) * 1000) / 10 : 0,
      payoutAmerican: 1228,
      profitUnits: Math.round(p4_units * 10) / 10,
      roi: p4_total > 0 ? Math.round((p4_units / p4_total) * 1000) / 10 : 0,
      breakEvenWinPct: 7.5,
    },
  };
}

// -------------------------------------------------------------
// TEASER SIMULATION ENGINE (6.0, 6.5, 7.0 PTS)
// -------------------------------------------------------------
export function simulateTeasers(games: DetailedGame[]) {
  let t6_wins = 0, t6_loss = 0;
  let t65_wins = 0, t65_loss = 0;
  let t7_wins = 0, t7_loss = 0;
  let wong_wins = 0, wong_loss = 0;

  for (const g of games) {
    const match = g.final.match(/([WL])\s*(\d+)-(\d+)/i);
    if (!match) continue;
    const isWin = match[1] === 'W';
    const ptsW = parseInt(match[2]);
    const ptsL = parseInt(match[3]);
    const actualWinnerMargin = isWin ? ptsW - ptsL : -(Math.abs(ptsW - ptsL));

    const modelRecommendedSide = g.modelAtsSide;
    if (modelRecommendedSide === 'Neutral') continue;

    const marketMarginForFav = -g.clNum;

    const favTeasedReq = marketMarginForFav - 6.0;
    const favTeasedReq65 = marketMarginForFav - 6.5;
    const favTeasedReq7 = marketMarginForFav - 7.0;

    const dogTeasedLimit = marketMarginForFav + 6.0;
    const dogTeasedLimit65 = marketMarginForFav + 6.5;
    const dogTeasedLimit7 = marketMarginForFav + 7.0;

    let win6 = false;
    let win65 = false;
    let win7 = false;

    if (modelRecommendedSide === 'Fav') {
      win6 = actualWinnerMargin > favTeasedReq;
      win65 = actualWinnerMargin > favTeasedReq65;
      win7 = actualWinnerMargin > favTeasedReq7;
    } else {
      win6 = actualWinnerMargin < dogTeasedLimit;
      win65 = actualWinnerMargin < dogTeasedLimit65;
      win7 = actualWinnerMargin < dogTeasedLimit7;
    }

    if (win6) t6_wins++; else t6_loss++;
    if (win65) t65_wins++; else t65_loss++;
    if (win7) t7_wins++; else t7_loss++;

    // Wong teaser criteria: underdogs +1.5 to +3.5 or favorites -7.5 to -9.5
    const absCl = Math.abs(g.clNum);
    if ((absCl >= 1.5 && absCl <= 3.5) || (absCl >= 7.5 && absCl <= 9.5)) {
      if (win6) wong_wins++; else wong_loss++;
    }
  }

  const calcRate = (w: number, l: number) => (w + l > 0 ? (w / (w + l)) * 100 : 0);
  const r6 = calcRate(t6_wins, t6_loss);
  const r65 = calcRate(t65_wins, t65_loss);
  const r7 = calcRate(t7_wins, t7_loss);
  const rWong = calcRate(wong_wins, wong_loss);

  // 2-team teaser math at standard -120 price (risk 120 to win 100)
  // Break-even leg win rate = sqrt(120/220) = 73.85%
  const p6_dec = r6 / 100;
  const p2_team_win = p6_dec * p6_dec;
  const p2_team_roi = (p2_team_win * 100 - (1 - p2_team_win) * 120) / 120 * 100;

  return {
    t6: {
      legsWon: t6_wins,
      legsLost: t6_loss,
      legWinRate: Math.round(r6 * 10) / 10,
      twoTeamTicketWinRate: Math.round(p2_team_win * 1000) / 10,
      twoTeamRoi: Math.round(p2_team_roi * 10) / 10,
      hurdleLegWinRate: 73.85,
    },
    t65: {
      legsWon: t65_wins,
      legsLost: t65_loss,
      legWinRate: Math.round(r65 * 10) / 10,
    },
    t7: {
      legsWon: t7_wins,
      legsLost: t7_loss,
      legWinRate: Math.round(r7 * 10) / 10,
    },
    wong: {
      legsWon: wong_wins,
      legsLost: wong_loss,
      legWinRate: Math.round(rWong * 10) / 10,
      sampleSize: wong_wins + wong_loss,
    },
  };
}

export function calculateMultiLegOdds(legs: { odds: number }[]): {
  decimalOdds: number;
  americanOdds: number;
  multiplier: number;
} {
  if (legs.length === 0) return { decimalOdds: 1, americanOdds: 0, multiplier: 1 };
  let dec = 1;
  for (const leg of legs) {
    dec *= americanToDecimal(leg.odds);
  }
  const american = decimalToAmerican(dec);
  return {
    decimalOdds: Math.round(dec * 1000) / 1000,
    americanOdds: american,
    multiplier: Math.round(dec * 100) / 100,
  };
}

