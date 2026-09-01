import { UserLoggedBet, BetLedgerStats } from '../types';

const STORAGE_KEY = 'cfb_fei_user_bet_ledger_v3';
const LEGACY_STORAGE_KEY = 'cfb_fei_user_bet_ledger_v2';

export const INITIAL_SAMPLE_BETS: UserLoggedBet[] = [
  // -------------------------------------------------------------
  // WEEK 0 (Saturday, Aug 29, 2026 - USER BET LEDGER)
  // -------------------------------------------------------------
  {
    id: 'user-bet-w0-tcu-spread',
    timestamp: '2026-08-29T16:00:00Z',
    week: 'Week 0',
    ticketType: 'straight',
    selection: 'TCU -7.5 · Spread',
    matchup: 'UNC 15 - 10 TCU · FINAL 8/29',
    bookName: 'DraftKings',
    line: '-7.5',
    oddsAmerican: -120,
    stakeDollars: 20, // 1.0u @ $20/u
    stakeUnits: 1.0,
    potentialPayoutDollars: 36.67,
    timingStatus: 'LOCKED_NOW',
    timingNotes: 'UNC 15 - 10 TCU · FINAL 8/29',
    grade: 'A+',
    resultStatus: 'LOST',
    actualPnlDollars: -20,
    closingLine: 'Closed TCU -8.0 (Final: UNC 15, TCU 10)',
    clvDeltaPts: 0.5,
    notes: 'UNC 15 - 10 TCU. Severe Dublin coastal rain & 3 turnovers suppressed scoring; TCU fell short of -7.5 spread.',
  },
  {
    id: 'user-bet-w0-unc-tcu-over',
    timestamp: '2026-08-29T16:00:00Z',
    week: 'Week 0',
    ticketType: 'straight',
    selection: 'Over 45.5 · Total',
    matchup: '25 · UNC 15 - 10 TCU · FINAL 8/29',
    bookName: 'DraftKings',
    line: '45.5',
    oddsAmerican: -125,
    stakeDollars: 16, // 0.8u @ $20/u
    stakeUnits: 0.8,
    potentialPayoutDollars: 28.80,
    timingStatus: 'LOCKED_NOW',
    timingNotes: '25 · UNC 15 - 10 TCU · FINAL 8/29',
    grade: 'A',
    resultStatus: 'LOST',
    actualPnlDollars: -16,
    closingLine: 'Closed 46.5 (Final: 25 total pts)',
    clvDeltaPts: 1.0,
    notes: '25 total points scored (UNC 15, TCU 10). Dublin downpour kept total well under 45.5.',
  },
  {
    id: 'user-bet-w0-parlay-tcu-over',
    timestamp: '2026-08-29T16:00:00Z',
    week: 'Week 0',
    ticketType: 'parlay',
    selection: '2-Leg Parlay',
    matchup: 'UNC vs TCU · 2 losses',
    bookName: 'DraftKings',
    line: '2 Legs (+199)',
    oddsAmerican: 199,
    stakeDollars: 16, // 0.8u @ $20/u
    stakeUnits: 0.8,
    potentialPayoutDollars: 47.84,
    timingStatus: 'LOCKED_NOW',
    timingNotes: 'Over 45.5 Total (-125) [25 · UNC 15-10 TCU] & TCU -7.5 Spread (-120) [UNC 15-10 TCU]',
    grade: 'A',
    resultStatus: 'LOST',
    actualPnlDollars: -16,
    closingLine: 'Closed Parlay (Both legs lost)',
    clvDeltaPts: 0.5,
    notes: '2-Leg Parlay: Leg 1 Over 45.5 (-125) + Leg 2 TCU -7.5 (-120). Both legs failed in Dublin opener.',
    legs: [
      {
        selection: 'Over 45.5 · Total',
        oddsAmerican: -125,
        matchup: 'UNC vs TCU',
        resultStatus: 'LOST',
        scoreDetails: '25 · UNC 15 - 10 TCU · FINAL 8/29',
      },
      {
        selection: 'TCU -7.5 · Spread',
        oddsAmerican: -120,
        matchup: 'UNC vs TCU',
        resultStatus: 'LOST',
        scoreDetails: 'UNC 15 - 10 TCU · FINAL 8/29',
      },
    ],
  },
  {
    id: 'user-bet-w0-jvs-nds-over',
    timestamp: '2026-08-29T19:30:00Z',
    week: 'Week 0',
    ticketType: 'straight',
    selection: 'Over 45.5 · Total',
    matchup: '40 · JVS 7 - 33 NDS · FINAL 8/29',
    bookName: 'DraftKings',
    line: '45.5',
    oddsAmerican: -120,
    stakeDollars: 30, // 1.5u @ $20/u
    stakeUnits: 1.5,
    potentialPayoutDollars: 55.00,
    timingStatus: 'LOCKED_NOW',
    timingNotes: '40 · JVS 7 - 33 NDS · FINAL 8/29',
    grade: 'A',
    resultStatus: 'LOST',
    actualPnlDollars: -30,
    closingLine: 'Closed 46.0 (Final: JVS 7, NDS 33 - Total 40)',
    clvDeltaPts: 0.5,
    notes: '40 total points scored (NDS 33, JVS 7). NDSU suffocating defense kept total 5.5 points under 45.5 line.',
  },
];

/**
 * Loads user bets from storage.
 * Defaults to the user's 4 logged bets from the ledger if not already stored.
 */
export function loadUserBets(): UserLoggedBet[] {
  try {
    if (typeof localStorage === 'undefined') return INITIAL_SAMPLE_BETS;
    
    // Check clean v3 storage key
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Default to initial sample bets matching user's actual ledger
      saveUserBets(INITIAL_SAMPLE_BETS);
      return INITIAL_SAMPLE_BETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_BETS;
  } catch {
    return INITIAL_SAMPLE_BETS;
  }
}

export function saveUserBets(bets: UserLoggedBet[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
  } catch (err) {
    console.error('Failed to save user bets to localStorage', err);
  }
}

export function clearAllUserBets(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear user bets from localStorage', err);
  }
}

function getSavedUnitValue(): number {
  try {
    if (typeof localStorage === 'undefined') return 20;
    const saved = localStorage.getItem('cfb_fei_user_unit_size_v1');
    if (!saved) return 20;
    const parsed = JSON.parse(saved);
    if (typeof parsed === 'number' && !isNaN(parsed) && parsed > 0) return parsed;
    return 20;
  } catch {
    return 20;
  }
}

/**
 * Calculate ledger stats.
 * @param bets - array of UserLoggedBet
 * @param unitValue - optional current unit dollar value (e.g., 20). If omitted, we check localStorage fallback, then default to 20.
 */
export function calculateBetLedgerStats(bets: UserLoggedBet[], unitValue?: number): BetLedgerStats {
  const unitVal = typeof unitValue === 'number' && unitValue > 0 ? unitValue : getSavedUnitValue();

  const totalBets = bets.length;
  let pendingBets = 0;
  let lockedNowBets = 0;
  let waitingBets = 0;
  let wonBets = 0;
  let lostBets = 0;
  let pushBets = 0;
  let totalWageredDollars = 0;
  let totalWageredUnits = 0;
  let totalSettledDollars = 0;
  let totalSettledUnits = 0;
  let netPnlDollars = 0;
  let netPnlUnits = 0;
  let pendingPotentialProfitDollars = 0;
  let pendingPotentialProfitUnits = 0;
  let totalClvDelta = 0;
  let clvCount = 0;

  for (const bet of bets) {
    // compute units using explicit stakeUnits when present, otherwise derive from stakeDollars using unitVal
    const units = typeof bet.stakeUnits === 'number' && !isNaN(bet.stakeUnits)
      ? bet.stakeUnits
      : (bet.stakeDollars && unitVal > 0 ? bet.stakeDollars / unitVal : 0);

    totalWageredDollars += bet.stakeDollars || 0;
    totalWageredUnits += units;

    if (bet.timingStatus === 'LOCKED_NOW') lockedNowBets++;
    else if (bet.timingStatus === 'WAITING_FOR_LINE') waitingBets++;

    if (typeof bet.clvDeltaPts === 'number') {
      totalClvDelta += bet.clvDeltaPts;
      clvCount++;
    }

    if (bet.resultStatus === 'PENDING') {
      pendingBets++;
      const potentialProfit = Math.max(0, (bet.potentialPayoutDollars || 0) - (bet.stakeDollars || 0));
      pendingPotentialProfitDollars += potentialProfit;
      const profitMultiplier = (bet.stakeDollars && bet.stakeDollars > 0) ? (potentialProfit / bet.stakeDollars) : 0;
      pendingPotentialProfitUnits += units * profitMultiplier;
    } else if (bet.resultStatus === 'WON') {
      wonBets++;
      totalSettledDollars += bet.stakeDollars || 0;
      totalSettledUnits += units;
      const profit = typeof bet.actualPnlDollars === 'number'
        ? bet.actualPnlDollars
        : ((bet.potentialPayoutDollars || 0) - (bet.stakeDollars || 0));
      netPnlDollars += profit;
      const profitMultiplier = (bet.stakeDollars && bet.stakeDollars > 0) ? profit / bet.stakeDollars : 0;
      netPnlUnits += units * profitMultiplier;
    } else if (bet.resultStatus === 'LOST') {
      lostBets++;
      totalSettledDollars += bet.stakeDollars || 0;
      totalSettledUnits += units;
      const loss = typeof bet.actualPnlDollars === 'number' ? bet.actualPnlDollars : -(bet.stakeDollars || 0);
      netPnlDollars += loss;
      netPnlUnits -= units;
    } else if (bet.resultStatus === 'PUSH') {
      pushBets++;
      totalSettledDollars += bet.stakeDollars || 0;
      totalSettledUnits += units;
    }
  }

  const settledCount = wonBets + lostBets;
  const winRatePct = settledCount > 0 ? parseFloat(((wonBets / settledCount) * 100).toFixed(1)) : 0;
  const roiPct = totalSettledDollars > 0 ? parseFloat(((netPnlDollars / totalSettledDollars) * 100).toFixed(1)) : 0;
  const avgClvDeltaPts = clvCount > 0 ? parseFloat((totalClvDelta / clvCount).toFixed(2)) : 0;

  return {
    totalBets,
    pendingBets,
    lockedNowBets,
    waitingBets,
    wonBets,
    lostBets,
    pushBets,
    totalWageredDollars: Math.round(totalWageredDollars),
    totalWageredUnits: parseFloat(totalWageredUnits.toFixed(1)),
    totalSettledDollars: Math.round(totalSettledDollars),
    totalSettledUnits: parseFloat(totalSettledUnits.toFixed(1)),
    netPnlDollars: parseFloat(netPnlDollars.toFixed(2)),
    netPnlUnits: parseFloat(netPnlUnits.toFixed(2)),
    roiPct,
    winRatePct,
    pendingPotentialProfitDollars: parseFloat(pendingPotentialProfitDollars.toFixed(2)),
    pendingPotentialProfitUnits: parseFloat(pendingPotentialProfitUnits.toFixed(2)),
    avgClvDeltaPts,
  };
}
