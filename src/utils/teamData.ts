import { allGamesData } from '../data/allGamesData';
import { picks2026Data } from '../data/picks2026Data';
import { DetailedGame, Pick2026 } from '../types';

export interface TeamSeasonRecord {
  year: number;
  totalGames: number;
  suWins: number;
  suLosses: number;
  suWinPct: number;
  atsWins: number;
  atsLosses: number;
  atsPushes: number;
  atsCoverPct: number;
  ouOverWins: number;
  ouUnderWins: number;
  ouPushes: number;
  avgPointsScored: number;
  avgPointsAllowed: number;
  avgPe: number;
}

export interface TeamHistoricalGame {
  id: string;
  year: number;
  week: string;
  opponent: string;
  isHomeOrNeutral: boolean;
  teamScore: number;
  oppScore: number;
  finalScoreText: string;
  isWin: boolean;
  spreadLine: string;
  closingTotal: number;
  atsResult: 'Cover' | 'Loss' | 'Push';
  ouResult: 'Over' | 'Under' | 'Push';
  feiProjScore: string;
  spreadDiff: number;
  pe: number;
}

export interface TeamProfile {
  name: string;
  shortName: string;
  conference: string;
  primaryColor?: string;
  secondaryColor?: string;
  // 2026 Slate
  activePicks2026: Pick2026[];
  // Historical Aggregates
  totalHistoricalGames: number;
  suWins: number;
  suLosses: number;
  suWinPct: number;
  atsWins: number;
  atsLosses: number;
  atsPushes: number;
  atsCoverPct: number;
  ouOverWins: number;
  ouUnderWins: number;
  ouPushes: number;
  avgPointsScored: number;
  avgPointsAllowed: number;
  avgPe: number;
  seasons: TeamSeasonRecord[];
  gameLogs: TeamHistoricalGame[];
}

export interface SearchResultItem {
  type: 'team' | 'game-2026' | 'game-historical';
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  teamName?: string;
  game2026?: Pick2026;
  gameHistorical?: DetailedGame;
}

// Conference Mapping for FBS teams
export const TEAM_CONFERENCE_MAP: Record<string, string> = {
  // SEC (16 teams)
  'Georgia': 'SEC',
  'Alabama': 'SEC',
  'Texas': 'SEC',
  'Oklahoma': 'SEC',
  'LSU': 'SEC',
  'Ole Miss': 'SEC',
  'Tennessee': 'SEC',
  'Texas A&M': 'SEC',
  'Missouri': 'SEC',
  'Kentucky': 'SEC',
  'Auburn': 'SEC',
  'Florida': 'SEC',
  'Arkansas': 'SEC',
  'South Carolina': 'SEC',
  'Mississippi State': 'SEC',
  'Vanderbilt': 'SEC',

  // Big Ten (18 teams)
  'Ohio State': 'Big Ten',
  'Oregon': 'Big Ten',
  'Penn State': 'Big Ten',
  'Michigan': 'Big Ten',
  'USC': 'Big Ten',
  'Washington': 'Big Ten',
  'Iowa': 'Big Ten',
  'Wisconsin': 'Big Ten',
  'Nebraska': 'Big Ten',
  'Michigan State': 'Big Ten',
  'Minnesota': 'Big Ten',
  'Illinois': 'Big Ten',
  'Indiana': 'Big Ten',
  'Rutgers': 'Big Ten',
  'Maryland': 'Big Ten',
  'UCLA': 'Big Ten',
  'Northwestern': 'Big Ten',
  'Purdue': 'Big Ten',

  // Big 12 (16 teams)
  'TCU': 'Big 12',
  'Utah': 'Big 12',
  'Kansas State': 'Big 12',
  'Oklahoma State': 'Big 12',
  'Arizona': 'Big 12',
  'Arizona State': 'Big 12',
  'Iowa State': 'Big 12',
  'Colorado': 'Big 12',
  'Kansas': 'Big 12',
  'Texas Tech': 'Big 12',
  'Baylor': 'Big 12',
  'West Virginia': 'Big 12',
  'UCF': 'Big 12',
  'BYU': 'Big 12',
  'Cincinnati': 'Big 12',
  'Houston': 'Big 12',

  // ACC (17 teams)
  'Clemson': 'ACC',
  'Florida State': 'ACC',
  'Miami': 'ACC',
  'Louisville': 'ACC',
  'SMU': 'ACC',
  'North Carolina': 'ACC',
  'NC State': 'ACC',
  'Virginia Tech': 'ACC',
  'Georgia Tech': 'ACC',
  'Pittsburgh': 'ACC',
  'Duke': 'ACC',
  'Syracuse': 'ACC',
  'Boston College': 'ACC',
  'Virginia': 'ACC',
  'Wake Forest': 'ACC',
  'California': 'ACC',
  'Stanford': 'ACC',

  // Mountain West (13 teams)
  'North Dakota State': 'Mountain West (FBS)',
  'Boise State': 'Mountain West',
  'UNLV': 'Mountain West',
  'Fresno State': 'Mountain West',
  'San Diego State': 'Mountain West',
  'Air Force': 'Mountain West',
  'Colorado State': 'Mountain West',
  'Wyoming': 'Mountain West',
  'San Jose State': 'Mountain West',
  'Hawaii': 'Mountain West',
  'Nevada': 'Mountain West',
  'New Mexico': 'Mountain West',
  'Utah State': 'Mountain West',

  // American Athletic (14 teams)
  'Memphis': 'American',
  'Tulane': 'American',
  'UTSA': 'American',
  'South Florida': 'American',
  'Navy': 'American',
  'East Carolina': 'American',
  'North Texas': 'American',
  'Rice': 'American',
  'Tulsa': 'American',
  'UAB': 'American',
  'FAU': 'American',
  'Temple': 'American',
  'Charlotte': 'American',
  'Army': 'American',

  // Sun Belt (14 teams)
  'Appalachian State': 'Sun Belt',
  'James Madison': 'Sun Belt',
  'Troy': 'Sun Belt',
  'Coastal Carolina': 'Sun Belt',
  'Marshall': 'Sun Belt',
  'Texas State': 'Sun Belt',
  'Georgia Southern': 'Sun Belt',
  'Louisiana': 'Sun Belt',
  'South Alabama': 'Sun Belt',
  'Arkansas State': 'Sun Belt',
  'Southern Miss': 'Sun Belt',
  'Old Dominion': 'Sun Belt',
  'Louisiana-Monroe': 'Sun Belt',
  'Georgia State': 'Sun Belt',

  // Mid-American / MAC (12 teams)
  'Toledo': 'MAC',
  'Miami (OH)': 'MAC',
  'Western Michigan': 'MAC',
  'Northern Illinois': 'MAC',
  'Bowling Green': 'MAC',
  'Ohio': 'MAC',
  'Eastern Michigan': 'MAC',
  'Central Michigan': 'MAC',
  'Ball State': 'MAC',
  'Akron': 'MAC',
  'Buffalo': 'MAC',
  'Kent State': 'MAC',

  // Conference USA (12 teams)
  'Jacksonville State': 'Conference USA',
  'Liberty': 'Conference USA',
  'Western Kentucky': 'Conference USA',
  'Middle Tennessee': 'Conference USA',
  'FIU': 'Conference USA',
  'UTEP': 'Conference USA',
  'Sam Houston': 'Conference USA',
  'New Mexico State': 'Conference USA',
  'Louisiana Tech': 'Conference USA',
  'Kennesaw State': 'Conference USA',
  'Delaware': 'Conference USA',
  'Missouri State': 'Conference USA',

  // Independents / Other
  'Notre Dame': 'Independent',
  'UConn': 'Independent',
  'UMass': 'Independent',
};

// Normalize team name for clean matching
export function normalizeTeamName(name: string): string {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ');
}

// Get all unique teams across mapping, 2026 slate, and historical datasets
export function getAllTeams(): string[] {
  const teamSet = new Set<string>();

  // Add all mapped FBS teams
  Object.keys(TEAM_CONFERENCE_MAP).forEach((t) => teamSet.add(t));

  // Add from 2026 picks
  picks2026Data.forEach((p) => {
    if (p.favorite) teamSet.add(p.favorite.trim());
    if (p.underdog) teamSet.add(p.underdog.trim());
  });

  // Add from allGames historical dataset
  allGamesData.forEach((g) => {
    if (g.winner) teamSet.add(g.winner.trim());
    if (g.loser) teamSet.add(g.loser.trim());
  });

  return Array.from(teamSet).sort();
}

export function getAllConferences(): string[] {
  const confSet = new Set<string>();
  Object.values(TEAM_CONFERENCE_MAP).forEach((c) => confSet.add(c));
  return Array.from(confSet).sort();
}

export function getTeamsByConference(conference: string): string[] {
  return Object.entries(TEAM_CONFERENCE_MAP)
    .filter(([_, conf]) => conf.toLowerCase() === conference.toLowerCase())
    .map(([team]) => team)
    .sort();
}

/**
 * Computes full analytical profile for any college football team
 */
export function getTeamProfile(teamName: string, customPicks?: Pick2026[]): TeamProfile | null {
  const normName = normalizeTeamName(teamName);
  if (!normName) return null;

  const currentPicks = customPicks || picks2026Data;

  // Find all 2026 games
  const activePicks2026 = currentPicks.filter(
    (p) =>
      p.favorite.toLowerCase() === normName.toLowerCase() ||
      p.underdog.toLowerCase() === normName.toLowerCase()
  );

  // Find all historical games from allGamesData
  const matchingGames = allGamesData.filter(
    (g) =>
      g.winner.toLowerCase() === normName.toLowerCase() ||
      g.loser.toLowerCase() === normName.toLowerCase()
  );

  let suWins = 0;
  let suLosses = 0;
  let atsWins = 0;
  let atsLosses = 0;
  let atsPushes = 0;
  let ouOverWins = 0;
  let ouUnderWins = 0;
  let ouPushes = 0;
  let totalPointsScored = 0;
  let totalPointsAllowed = 0;
  let sumPe = 0;

  // Season-by-season grouping
  const seasonsMap = new Map<number, {
    year: number;
    total: number;
    suW: number;
    suL: number;
    atsW: number;
    atsL: number;
    atsP: number;
    ouOver: number;
    ouUnder: number;
    ouP: number;
    pf: number;
    pa: number;
    peSum: number;
  }>();

  const gameLogs: TeamHistoricalGame[] = [];

  for (const g of matchingGames) {
    const isWinner = g.winner.toLowerCase() === normName.toLowerCase();
    const opponent = isWinner ? g.loser : g.winner;

    // Parse score from final string e.g. "W 31-24" or "L 17-21" or "65-7"
    let teamScore = 0;
    let oppScore = 0;
    const scoreMatch = g.final?.match(/(\d+)[^\d]+(\d+)/);
    if (scoreMatch) {
      const s1 = parseInt(scoreMatch[1], 10);
      const s2 = parseInt(scoreMatch[2], 10);
      teamScore = isWinner ? Math.max(s1, s2) : Math.min(s1, s2);
      oppScore = isWinner ? Math.min(s1, s2) : Math.max(s1, s2);
    } else {
      teamScore = isWinner ? g.pf : g.pa;
      oppScore = isWinner ? g.pa : g.pf;
    }

    totalPointsScored += teamScore;
    totalPointsAllowed += oppScore;
    sumPe += g.pe || 0;

    // SU Record
    if (isWinner) {
      suWins++;
    } else {
      suLosses++;
    }

    // ATS Record
    // Note: in allGamesData, g.ats is 'Win'/'Loss'/'Push' from favorite perspective.
    // If team was winner and covered, or underdog who covered
    let atsResult: 'Cover' | 'Loss' | 'Push' = 'Loss';
    if (g.ats === 'Push') {
      atsResult = 'Push';
      atsPushes++;
    } else if (isWinner) {
      if (g.ats === 'Win') {
        atsResult = 'Cover';
        atsWins++;
      } else {
        atsResult = 'Loss';
        atsLosses++;
      }
    } else {
      // Team is loser: if favorite lost ATS, then underdog won ATS
      if (g.ats === 'Loss') {
        atsResult = 'Cover';
        atsWins++;
      } else {
        atsResult = 'Loss';
        atsLosses++;
      }
    }

    // O/U Record
    let ouResult: 'Over' | 'Under' | 'Push' = 'Push';
    if (g.ou === 'Push') {
      ouResult = 'Push';
      ouPushes++;
    } else if (g.ou === 'Win') {
      // Model won OU
      if (g.modelOuSide === 'Over') {
        ouResult = 'Over';
        ouOverWins++;
      } else {
        ouResult = 'Under';
        ouUnderWins++;
      }
    } else {
      // Model lost OU
      if (g.modelOuSide === 'Over') {
        ouResult = 'Under';
        ouUnderWins++;
      } else {
        ouResult = 'Over';
        ouOverWins++;
      }
    }

    // Season Group
    if (!seasonsMap.has(g.year)) {
      seasonsMap.set(g.year, {
        year: g.year,
        total: 0,
        suW: 0,
        suL: 0,
        atsW: 0,
        atsL: 0,
        atsP: 0,
        ouOver: 0,
        ouUnder: 0,
        ouP: 0,
        pf: 0,
        pa: 0,
        peSum: 0,
      });
    }

    const sEntry = seasonsMap.get(g.year)!;
    sEntry.total++;
    if (isWinner) sEntry.suW++;
    else sEntry.suL++;

    if (atsResult === 'Cover') sEntry.atsW++;
    else if (atsResult === 'Loss') sEntry.atsL++;
    else sEntry.atsP++;

    if (ouResult === 'Over') sEntry.ouOver++;
    else if (ouResult === 'Under') sEntry.ouUnder++;
    else sEntry.ouP++;

    sEntry.pf += teamScore;
    sEntry.pa += oppScore;
    sEntry.peSum += g.pe || 0;

    gameLogs.push({
      id: g.id,
      year: g.year,
      week: g.week,
      opponent,
      isHomeOrNeutral: true,
      teamScore,
      oppScore,
      finalScoreText: `${isWinner ? 'W' : 'L'} ${teamScore}-${oppScore}`,
      isWin: isWinner,
      spreadLine: g.cl,
      closingTotal: g.ct,
      atsResult,
      ouResult,
      feiProjScore: `${g.pf.toFixed(1)} - ${g.pa.toFixed(1)}`,
      spreadDiff: g.spreadDiff,
      pe: g.pe,
    });
  }

  const totalHistoricalGames = matchingGames.length;
  const suWinPct = totalHistoricalGames > 0 ? (suWins / totalHistoricalGames) * 100 : 0;
  const atsDecisive = atsWins + atsLosses;
  const atsCoverPct = atsDecisive > 0 ? (atsWins / atsDecisive) * 100 : 0;
  const avgPointsScored = totalHistoricalGames > 0 ? totalPointsScored / totalHistoricalGames : 0;
  const avgPointsAllowed = totalHistoricalGames > 0 ? totalPointsAllowed / totalHistoricalGames : 0;
  const avgPe = totalHistoricalGames > 0 ? sumPe / totalHistoricalGames : 0;

  const seasons: TeamSeasonRecord[] = Array.from(seasonsMap.values())
    .sort((a, b) => b.year - a.year)
    .map((s) => {
      const sAtsDecisive = s.atsW + s.atsL;
      return {
        year: s.year,
        totalGames: s.total,
        suWins: s.suW,
        suLosses: s.suL,
        suWinPct: s.total > 0 ? (s.suW / s.total) * 100 : 0,
        atsWins: s.atsW,
        atsLosses: s.atsL,
        atsPushes: s.atsP,
        atsCoverPct: sAtsDecisive > 0 ? (s.atsW / sAtsDecisive) * 100 : 0,
        ouOverWins: s.ouOver,
        ouUnderWins: s.ouUnder,
        ouPushes: s.ouP,
        avgPointsScored: s.total > 0 ? s.pf / s.total : 0,
        avgPointsAllowed: s.total > 0 ? s.pa / s.total : 0,
        avgPe: s.total > 0 ? s.peSum / s.total : 0,
      };
    });

  const conference = TEAM_CONFERENCE_MAP[normName] || 'FBS Collegiate';

  return {
    name: normName,
    shortName: normName,
    conference,
    activePicks2026,
    totalHistoricalGames,
    suWins,
    suLosses,
    suWinPct,
    atsWins,
    atsLosses,
    atsPushes,
    atsCoverPct,
    ouOverWins,
    ouUnderWins,
    ouPushes,
    avgPointsScored,
    avgPointsAllowed,
    avgPe,
    seasons,
    gameLogs,
  };
}

/**
 * Universal Search for any Team or Game
 */
export function searchTeamsAndGames(
  query: string,
  picks2026: Pick2026[] = picks2026Data
): SearchResultItem[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const results: SearchResultItem[] = [];

  // 1. Teams matching query
  const allTeamsList = getAllTeams();
  const matchedTeams = allTeamsList.filter((t) =>
    t.toLowerCase().includes(cleanQ)
  );

  matchedTeams.slice(0, 8).forEach((team) => {
    const conf = TEAM_CONFERENCE_MAP[team] || 'FBS';
    const num2026 = picks2026.filter(
      (p) =>
        p.favorite.toLowerCase() === team.toLowerCase() ||
        p.underdog.toLowerCase() === team.toLowerCase()
    ).length;

    results.push({
      type: 'team',
      id: `team_${team}`,
      title: team,
      subtitle: `${conf} • ${num2026 > 0 ? `${num2026} 2026 Slates` : 'Archived Profile'}`,
      badge: 'TEAM',
      teamName: team,
    });
  });

  // 2. 2026 Games matching query
  picks2026.forEach((p) => {
    const text = `${p.favorite} ${p.underdog} ${p.week} ${p.venue} ${p.recommendedBetText}`.toLowerCase();
    if (text.includes(cleanQ)) {
      results.push({
        type: 'game-2026',
        id: p.id,
        title: `${p.favorite} vs ${p.underdog}`,
        subtitle: `${p.week} • ${p.marketSpread > 0 ? `-${p.marketSpread}` : p.marketSpread} • O/U ${p.marketTotal}`,
        badge: p.isSettled ? `2026 (${p.actualResult})` : '2026 SLATE',
        game2026: p,
      });
    }
  });

  // 3. Historical Games matching query
  if (results.length < 15) {
    const matchedHistorical = allGamesData.filter((g) => {
      const matchText = `${g.winner} ${g.loser} ${g.year} ${g.week}`.toLowerCase();
      return matchText.includes(cleanQ);
    });

    matchedHistorical.slice(0, 10 - results.length).forEach((g) => {
      results.push({
        type: 'game-historical',
        id: g.id,
        title: `${g.winner} vs ${g.loser}`,
        subtitle: `${g.year} ${g.week} • Final: ${g.final} (Line: ${g.cl})`,
        badge: `${g.year} ARCHIVE`,
        gameHistorical: g,
      });
    });
  }

  return results;
}
