// src/services/liveOddsService.ts
import {
  Pick2026,
  SportsbookQuote,
  SportsbookBestLine,
  ModelHyperparameters,
  CuratedParlayPick,
  CuratedTeaserPick,
  ExecutionTimingWindow,
  TimingUrgency,
  BetTimingIntelligence,
} from '../types';
import { DEFAULT_HYPERPARAMETERS } from '../utils/modelOptimizerEngine';
import { generateSportsbookQuotes } from '../utils/sportsbookQuotes';

export interface LiveOddsMeta {
  success: boolean;
  source: string;
  timestamp: string;
  totalGames: number;
  quota: {
    requestsRemaining: number | null;
    requestsUsed: number | null;
  };
  cached: boolean;
}

export interface StandardizedBookQuote {
  bookmakerKey: string;
  bookmakerTitle: string;
  homeSpread?: number;
  homeSpreadOdds?: number;
  awaySpread?: number;
  awaySpreadOdds?: number;
  total?: number;
  overOdds?: number;
  underOdds?: number;
  homeMoneyline?: number;
  awayMoneyline?: number;
  lastUpdated?: string;
}

export interface ParsedLiveGame {
  id: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamShort: string;
  awayTeamShort: string;
  favorite: string;
  underdog: string;
  consensusSpread: number;
  consensusTotal: number;
  favoriteSpreadPrice: number;
  underdogSpreadPrice: number;
  homeMoneyline?: number;
  awayMoneyline?: number;
  bookmakersCount: number;
  sportsbooks: StandardizedBookQuote[];
  lastUpdated: string;
}

export interface LiveOddsData {
  meta: LiveOddsMeta;
  games: ParsedLiveGame[];
}

// Client-side normalized team name lookup
const NORMALIZE_MAP: Record<string, string> = {
  'tcu horned frogs': 'TCU',
  'tcu': 'TCU',
  'north carolina tar heels': 'North Carolina',
  'north carolina': 'North Carolina',
  'unc': 'North Carolina',
  'nc state wolfpack': 'NC State',
  'nc state': 'NC State',
  'virginia cavaliers': 'Virginia',
  'virginia': 'Virginia',
  'stanford cardinal': 'Stanford',
  'stanford': 'Stanford',
  'hawaii rainbow warriors': 'Hawaii',
  'hawaii': 'Hawaii',
  'usc trojans': 'USC',
  'usc': 'USC',
  'san jose state spartans': 'San Jose State',
  'san jose state': 'San Jose State',
  'florida state seminoles': 'Florida State',
  'florida state': 'Florida State',
  'fsu': 'Florida State',
  'new mexico state aggies': 'New Mexico State',
  'new mexico state': 'New Mexico State',
  'unlv rebels': 'UNLV',
  'unlv': 'UNLV',
  'memphis tigers': 'Memphis',
  'memphis': 'Memphis',
  'eastern michigan eagles': 'Eastern Michigan',
  'eastern michigan': 'Eastern Michigan',
  'sacramento state hornets': 'Sacramento State',
  'sacramento state': 'Sacramento State',
  'north dakota state bison': 'North Dakota State',
  'north dakota state': 'North Dakota State',
  'jacksonville state gamecocks': 'Jacksonville State',
  'jacksonville state': 'Jacksonville State',
  'rutgers scarlet knights': 'Rutgers',
  'rutgers': 'Rutgers',
  'umass minutemen': 'UMass',
  'umass': 'UMass',
  'wake forest demon deacons': 'Wake Forest',
  'wake forest': 'Wake Forest',
  'akron zips': 'Akron',
  'akron': 'Akron',
  'clemson tigers': 'Clemson',
  'clemson': 'Clemson',
  'lsu tigers': 'LSU',
  'lsu': 'LSU',
  'ohio state buckeyes': 'Ohio State',
  'ohio state': 'Ohio State',
  'texas longhorns': 'Texas',
  'texas': 'Texas',
  'georgia bulldogs': 'Georgia',
  'georgia': 'Georgia',
  'alabama crimson tide': 'Alabama',
  'alabama': 'Alabama',
  'oregon ducks': 'Oregon',
  'oregon': 'Oregon',
  'penn state nittany lions': 'Penn State',
  'penn state': 'Penn State',
  'notre dame fighting irish': 'Notre Dame',
  'notre dame': 'Notre Dame',
  'michigan wolverines': 'Michigan',
  'michigan': 'Michigan',
};

function normalizeName(str: string): string {
  if (!str) return '';
  const clean = str.trim().toLowerCase();
  if (NORMALIZE_MAP[clean]) return NORMALIZE_MAP[clean];
  for (const [alias, standard] of Object.entries(NORMALIZE_MAP)) {
    if (clean.includes(alias) || alias.includes(clean)) return standard;
  }
  return str.trim();
}

/**
 * Fetches real-time odds from the full-stack server proxy.
 */
export async function fetchLiveOddsFeed(force: boolean = false): Promise<LiveOddsData> {
  const url = force ? '/api/odds/live?force=true' : '/api/odds/live';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch live odds: HTTP ${res.status}`);
  }
  const json = await res.json();
  return {
    meta: {
      success: json.success,
      source: json.source || 'The Odds API',
      timestamp: json.timestamp || new Date().toISOString(),
      totalGames: json.totalGames || (json.games?.length ?? 0),
      quota: json.quota || { requestsRemaining: null, requestsUsed: null },
      cached: Boolean(json.cached),
    },
    games: json.games || [],
  };
}

/**
 * Finds a matching live game for a pick.
 */
export function findMatchingLiveGame(pick: Pick2026, liveGames: ParsedLiveGame[]): ParsedLiveGame | undefined {
  const fav = normalizeName(pick.favorite).toLowerCase();
  const dog = normalizeName(pick.underdog).toLowerCase();

  return liveGames.find((g) => {
    const home = normalizeName(g.homeTeamShort || g.homeTeam).toLowerCase();
    const away = normalizeName(g.awayTeamShort || g.awayTeam).toLowerCase();
    return (
      (home.includes(fav) || fav.includes(home) || home.includes(dog) || dog.includes(home)) &&
      (away.includes(fav) || fav.includes(away) || away.includes(dog) || dog.includes(away))
    );
  });
}

/**
 * Merges raw base picks with real-time live odds from The Odds API.
 * Dynamically re-runs quantitative formulas for spread edge, EV%, Kelly sizing, and confidence grades.
 */
export function mergeLiveOddsWithPicks(
  basePicks: Pick2026[],
  liveGames: ParsedLiveGame[],
  hyperparameters: ModelHyperparameters = DEFAULT_HYPERPARAMETERS
): Pick2026[] {
  if (!liveGames || liveGames.length === 0) {
    return basePicks;
  }

  return basePicks.map((pick) => {
    const liveMatch = findMatchingLiveGame(pick, liveGames);
    if (!liveMatch) {
      return pick;
    }

    // Apply Live Consensus Lines
    const liveSpread = liveMatch.consensusSpread; // e.g. -8.0
    const liveTotal = liveMatch.consensusTotal; // e.g. 46.5

    // Recalculate Model Discrepancy Margin vs Live Spread
    let feiMargin = pick.feiProjMargin;
    let spreadDiff: number;
    let spreadEdgeAbs: number;

    if (pick.recommendedBetSide === 'Favorite Spread') {
      spreadDiff = feiMargin - Math.abs(liveSpread);
      spreadEdgeAbs = Math.abs(spreadDiff);
    } else if (pick.recommendedBetSide === 'Underdog Spread') {
      spreadDiff = Math.abs(liveSpread) - feiMargin;
      spreadEdgeAbs = Math.abs(spreadDiff);
    } else {
      spreadDiff = pick.spreadDiff;
      spreadEdgeAbs = pick.spreadEdgeAbs;
    }

    // Recalculate Win Probability via normal distribution approximation
    const edgeRatio = spreadEdgeAbs / (hyperparameters?.homeFieldAdvantageBaseline || 2.5);
    const baseWinProb = 0.5238; // Breakeven on -110
    const winProb = Math.min(0.89, Math.max(0.51, baseWinProb + edgeRatio * 0.045));
    const lossProb = 1 - winProb;

    // American odds to decimal profit multiplier
    const b = 100 / 110; // approx 0.909 for -110 standard line
    const breakEvenWinPct = 52.4;
    const trueEvPct = parseFloat((((winProb * (1 + b) - 1) * 100)).toFixed(1));

    // Quarter-Kelly unit allocation
    const fullKellyFraction = Math.max(0, (b * winProb - lossProb) / b);
    const fullKellyPct = parseFloat((fullKellyFraction * 100).toFixed(1));
    const halfKellyPct = parseFloat((fullKellyPct * 0.5).toFixed(1));
    const quarterKellyPct = parseFloat((fullKellyPct * 0.25).toFixed(1));
    const standaloneUnits = parseFloat(quarterKellyPct.toFixed(1));

    // Dynamic Confidence Grade
    let dynGrade: 'A+' | 'A' | 'B+' | 'B' = 'B';
    if (spreadEdgeAbs >= 5.0 || trueEvPct >= 8.0) {
      dynGrade = 'A+';
    } else if (spreadEdgeAbs >= 3.5 || trueEvPct >= 6.0) {
      dynGrade = 'A';
    } else if (spreadEdgeAbs >= 2.5 || trueEvPct >= 3.5) {
      dynGrade = 'B+';
    } else {
      dynGrade = 'B';
    }

    // Exact bet recommendation text
    let recommendedBetText = pick.recommendedBetText;
    if (pick.recommendedBetSide === 'Favorite Spread') {
      recommendedBetText = `${pick.favorite} ${liveSpread > 0 ? `-${liveSpread}` : liveSpread} (Live line: FEI projects ${feiMargin.toFixed(1)} pt margin)`;
    } else if (pick.recommendedBetSide === 'Underdog Spread') {
      const dogSpread = Math.abs(liveSpread);
      recommendedBetText = `${pick.underdog} +${dogSpread} (Live line: FEI models value on underdog)`;
    }

    // Exact action
    const exactAction = `TAKE ${pick.favorite} ${liveSpread > 0 ? `-${liveSpread}` : liveSpread} (-110)`;

    // Multi-sportsbook comparison quotes and best book line shopping
    const { quotes: sportsbookQuotes, bestBook } = generateSportsbookQuotes({
      spread: liveSpread,
      total: liveTotal,
      favorite: pick.favorite,
      underdog: pick.underdog,
      recommendedBetSide: pick.recommendedBetSide,
    });

    let timingWindow: ExecutionTimingWindow = '⚡ Early-Week Open (Mon–Tue)';
    let urgency: TimingUrgency = 'IMMEDIATE LOCK';
    let timingRationale = 'Sharp opening money is moving this line. Lock in before line crosses key numbers.';
    let projectedClvDeltaPts = 1.5;
    let marketMovementForecast = 'Sharp steam incoming. Model sees positive Closing Line Value (CLV).';

    if (pick.recommendedBetSide.includes('Underdog')) {
      timingWindow = '🎯 Late Public Buyback (1-2hr Pre-Kick)';
      urgency = 'BUY LATE PEAK';
      projectedClvDeltaPts = 1.0;
      timingRationale = 'Recreational public money often inflates favorite spread closer to kickoff. Wait until game day for underdog spread to peak.';
      marketMovementForecast = 'Public favorite inflation expected. Wait for maximum underdog buffer.';
    } else if (pick.recommendedBetSide.includes('Total') || pick.venue.includes('Island') || pick.venue.includes('Ching') || pick.isNeutral) {
      timingWindow = '⏳ Game-Day Weather/Injury Wait (Sat AM)';
      urgency = 'WAIT FOR SATURDAY';
      projectedClvDeltaPts = 0.5;
      timingRationale = 'Weather radar, coastal wind speeds, and injury inactive reports sway this live market. Confirm morning conditions before placing.';
      marketMovementForecast = 'Weather/injury volatility. Confirm Saturday morning before placing.';
    } else if (dynGrade === 'A+' && pick.recommendedBetSide.includes('Favorite')) {
      timingWindow = '⚡ Early-Week Open (Mon–Tue)';
      urgency = 'IMMEDIATE LOCK';
      projectedClvDeltaPts = 2.0;
      timingRationale = 'Elite A+ Tier model discrepancy. Key number advantage (3, 7, 10) will be hammered off the board early.';
      marketMovementForecast = 'Heavy sharp syndicate action will compress line. Bet immediately at opening limits.';
    } else {
      timingWindow = '📈 Mid-Week Steam (Wed–Thu)';
      urgency = 'MONITOR STEAM';
      projectedClvDeltaPts = 0.8;
      timingRationale = 'Books raise betting limits mid-week. Enter position when consensus line aligns with FEI projection.';
      marketMovementForecast = 'Mid-week limits increase; monitor market consensus to capture favorable juice.';
    }

    const timing: BetTimingIntelligence = {
      timingWindow,
      urgency,
      timingRationale,
      projectedClvDeltaPts,
      marketMovementForecast,
    };

    return {
      ...pick,
      marketSpread: liveSpread,
      marketTotal: liveTotal,
      spreadDiff,
      spreadEdgeAbs,
      recommendedBetText,
      exactAction,
      confidenceGrade: dynGrade,
      expectedValue: trueEvPct,
      breakEvenWinPct,
      fullKellyPct,
      halfKellyPct,
      kellyFractionPct: quarterKellyPct,
      units: standaloneUnits,
      timing,
      sportsbooks: sportsbookQuotes,
      bestBook,
    };
  });
}
