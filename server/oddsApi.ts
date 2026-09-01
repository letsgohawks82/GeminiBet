// server/oddsApi.ts
import { logStructured } from './metrics';

export interface RawOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface RawMarket {
  key: 'spreads' | 'totals' | 'h2h' | string;
  last_update?: string;
  outcomes: RawOutcome[];
}

export interface RawBookmaker {
  key: string;
  title: string;
  last_update?: string;
  markets: RawMarket[];
}

export interface RawOddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: RawBookmaker[];
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
  consensusSpread: number; // Negative for favorite (e.g. -8.0)
  consensusTotal: number; // e.g. 46.5
  favoriteSpreadPrice: number; // e.g. -110
  underdogSpreadPrice: number; // e.g. -110
  homeMoneyline?: number;
  awayMoneyline?: number;
  bookmakersCount: number;
  sportsbooks: StandardizedBookQuote[];
  lastUpdated: string;
}

export interface LiveOddsResponse {
  success: boolean;
  source: string;
  timestamp: string;
  totalGames: number;
  games: ParsedLiveGame[];
  quota: {
    requestsRemaining: number | null;
    requestsUsed: number | null;
  };
  cached: boolean;
}

// In-Memory Live Odds Cache
interface CacheEntry {
  data: LiveOddsResponse;
  expiresAt: number;
}

let oddsCache: CacheEntry | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes fresh cache

// Known college team short name normalizer
const TEAM_ALIAS_MAP: Record<string, string> = {
  'tcu horned frogs': 'TCU',
  'tcu': 'TCU',
  'north carolina tar heels': 'North Carolina',
  'north carolina': 'North Carolina',
  'unc': 'North Carolina',
  'nc state wolfpack': 'NC State',
  'nc state': 'NC State',
  'north carolina state': 'NC State',
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
  'lsu tigers': 'LSU',
  'lsu': 'LSU',
  'ole miss rebels': 'Ole Miss',
  'ole miss': 'Ole Miss',
  'tennessee volunteers': 'Tennessee',
  'tennessee': 'Tennessee',
  'smu mustangs': 'SMU',
  'smu': 'SMU',
  'clemson tigers': 'Clemson',
  'clemson': 'Clemson',
  'miami hurricanes': 'Miami (FL)',
  'miami': 'Miami (FL)',
  'colorado buffaloes': 'Colorado',
  'colorado': 'Colorado',
  'nebraska cornhuskers': 'Nebraska',
  'nebraska': 'Nebraska',
  'oklahoma sooners': 'Oklahoma',
  'oklahoma': 'Oklahoma',
  'utah utes': 'Utah',
  'utah': 'Utah',
  'arizona wildcats': 'Arizona',
  'arizona': 'Arizona',
  'arizona state sun devils': 'Arizona State',
  'arizona state': 'Arizona State',
  'iowa hawkeyes': 'Iowa',
  'iowa': 'Iowa',
  'iowa state cyclones': 'Iowa State',
  'iowa state': 'Iowa State',
  'kansas state wildcats': 'Kansas State',
  'kansas state': 'Kansas State',
  'kansas jayhawks': 'Kansas',
  'kansas': 'Kansas',
  'wisconsin badgers': 'Wisconsin',
  'wisconsin': 'Wisconsin',
  'louisville cardinals': 'Louisville',
  'louisville': 'Louisville',
  'kentucky wildcats': 'Kentucky',
  'kentucky': 'Kentucky',
  'auburn tigers': 'Auburn',
  'auburn': 'Auburn',
  'texas a&m aggies': 'Texas A&M',
  'texas a&m': 'Texas A&M',
};

// Mascot suffixes to strip if not in dictionary
const MASCOT_SUFFIXES = [
  'Horned Frogs', 'Tar Heels', 'Wolfpack', 'Cavaliers', 'Cardinal', 'Rainbow Warriors',
  'Trojans', 'Spartans', 'Seminoles', 'Aggies', 'Rebels', 'Tigers', 'Eagles', 'Hornets',
  'Bison', 'Gamecocks', 'Scarlet Knights', 'Minutemen', 'Demon Deacons', 'Zips',
  'Buckeyes', 'Longhorns', 'Bulldogs', 'Crimson Tide', 'Ducks', 'Nittany Lions',
  'Fighting Irish', 'Wolverines', 'Volunteers', 'Mustangs', 'Hurricanes', 'Buffaloes',
  'Cornhuskers', 'Sooners', 'Utes', 'Wildcats', 'Sun Devils', 'Hawkeyes', 'Cyclones',
  'Jayhawks', 'Badgers', 'Cardinals', 'Golden Gophers', 'Boilermakers', 'Hoosiers',
  'Fighting Illini', 'Wildcats', 'Mountaineers', 'Bearcats', 'Cougars', 'Red Raiders',
  'Knights', 'Black Knights', 'Midshipmen', 'Falcons', 'Broncos', 'Chippewas',
  'Bobcats', 'Bulls', 'Green Wave', 'Golden Hurricane', 'Owls', 'Miners',
  'Roadrunners', 'Blazers', 'Monarchs', 'Thundering Herd', 'Ragin Cajuns', 'Warhawks',
  'Red Wolves', 'Jaguars', 'Chanticleers', 'Flames', 'Dukes', 'Toreros', 'Aztecs',
];

export function normalizeTeamName(fullName: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  const lower = trimmed.toLowerCase();

  if (TEAM_ALIAS_MAP[lower]) {
    return TEAM_ALIAS_MAP[lower];
  }

  // Strip mascot if present
  let cleanName = trimmed;
  for (const mascot of MASCOT_SUFFIXES) {
    const regex = new RegExp(`\\s+${mascot}$`, 'i');
    if (regex.test(cleanName)) {
      cleanName = cleanName.replace(regex, '').trim();
      break;
    }
  }

  const cleanLower = cleanName.toLowerCase();
  if (TEAM_ALIAS_MAP[cleanLower]) {
    return TEAM_ALIAS_MAP[cleanLower];
  }

  return cleanName;
}

export function parseOddsApiData(rawEvents: RawOddsEvent[]): ParsedLiveGame[] {
  const parsedGames: ParsedLiveGame[] = [];

  for (const event of rawEvents) {
    if (!event.home_team || !event.away_team) continue;

    const homeTeamShort = normalizeTeamName(event.home_team);
    const awayTeamShort = normalizeTeamName(event.away_team);

    const homeSpreads: number[] = [];
    const homeSpreadPrices: number[] = [];
    const totals: number[] = [];
    const standardBooks: StandardizedBookQuote[] = [];

    for (const bookmaker of event.bookmakers || []) {
      const spreadMkt = bookmaker.markets?.find((m) => m.key === 'spreads');
      const totalsMkt = bookmaker.markets?.find((m) => m.key === 'totals');
      const h2hMkt = bookmaker.markets?.find((m) => m.key === 'h2h');

      const homeSpreadOutcome = spreadMkt?.outcomes?.find((o) => o.name === event.home_team);
      const awaySpreadOutcome = spreadMkt?.outcomes?.find((o) => o.name === event.away_team);
      const overOutcome = totalsMkt?.outcomes?.find((o) => o.name === 'Over');
      const underOutcome = totalsMkt?.outcomes?.find((o) => o.name === 'Under');
      const homeH2h = h2hMkt?.outcomes?.find((o) => o.name === event.home_team);
      const awayH2h = h2hMkt?.outcomes?.find((o) => o.name === event.away_team);

      if (homeSpreadOutcome?.point !== undefined) {
        homeSpreads.push(homeSpreadOutcome.point);
        if (homeSpreadOutcome.price !== undefined) {
          homeSpreadPrices.push(homeSpreadOutcome.price);
        }
      }

      if (overOutcome?.point !== undefined) {
        totals.push(overOutcome.point);
      }

      standardBooks.push({
        bookmakerKey: bookmaker.key,
        bookmakerTitle: bookmaker.title,
        homeSpread: homeSpreadOutcome?.point,
        homeSpreadOdds: homeSpreadOutcome?.price,
        awaySpread: awaySpreadOutcome?.point,
        awaySpreadOdds: awaySpreadOutcome?.price,
        total: overOutcome?.point,
        overOdds: overOutcome?.price,
        underOdds: underOutcome?.price,
        homeMoneyline: homeH2h?.price,
        awayMoneyline: awayH2h?.price,
        lastUpdated: bookmaker.last_update,
      });
    }

    // Compute consensus
    let consensusHomeSpread = -3.5; // fallback
    if (homeSpreads.length > 0) {
      // Sort and take median or rounded mean to nearest 0.5
      homeSpreads.sort((a, b) => a - b);
      const mid = Math.floor(homeSpreads.length / 2);
      consensusHomeSpread =
        homeSpreads.length % 2 !== 0
          ? homeSpreads[mid]
          : Math.round(((homeSpreads[mid - 1] + homeSpreads[mid]) / 2) * 2) / 2;
    }

    let consensusTotal = 52.5; // fallback
    if (totals.length > 0) {
      totals.sort((a, b) => a - b);
      const mid = Math.floor(totals.length / 2);
      consensusTotal =
        totals.length % 2 !== 0
          ? totals[mid]
          : Math.round(((totals[mid - 1] + totals[mid]) / 2) * 2) / 2;
    }

    const isHomeFavorite = consensusHomeSpread < 0;
    const favorite = isHomeFavorite ? homeTeamShort : awayTeamShort;
    const underdog = isHomeFavorite ? awayTeamShort : homeTeamShort;
    const favoriteSpread = isHomeFavorite ? consensusHomeSpread : -Math.abs(consensusHomeSpread);

    parsedGames.push({
      id: event.id,
      commenceTime: event.commence_time,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      homeTeamShort,
      awayTeamShort,
      favorite,
      underdog,
      consensusSpread: favoriteSpread,
      consensusTotal,
      favoriteSpreadPrice: -110,
      underdogSpreadPrice: -110,
      bookmakersCount: standardBooks.length,
      sportsbooks: standardBooks,
      lastUpdated: new Date().toISOString(),
    });
  }

  return parsedGames;
}

export async function fetchLiveCfbOdds(options: {
  apiKey?: string;
  force?: boolean;
}): Promise<LiveOddsResponse> {
  const now = Date.now();
  if (!options.force && oddsCache && oddsCache.expiresAt > now) {
    return {
      ...oddsCache.data,
      cached: true,
    };
  }

  const apiKey =
    options.apiKey ||
    process.env.ODDS_API_KEY ||
    process.env.THE_ODDS_API_KEY ||
    '0a4998e0a7ca95e7bffc6f1235561eba';

  const url = `https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds/?apiKey=${encodeURIComponent(
    apiKey
  )}&regions=us&markets=spreads,totals,h2h&oddsFormat=american`;

  try {
    const response = await fetch(url);
    const requestsRemaining = response.headers.get('x-requests-remaining')
      ? parseInt(response.headers.get('x-requests-remaining')!, 10)
      : null;
    const requestsUsed = response.headers.get('x-requests-used')
      ? parseInt(response.headers.get('x-requests-used')!, 10)
      : null;

    if (!response.ok) {
      const errText = await response.text();
      logStructured('error', 'The Odds API request failed', {
        status: response.status,
        error: errText,
      });
      throw new Error(`The Odds API HTTP ${response.status}: ${errText}`);
    }

    const rawData = (await response.json()) as RawOddsEvent[];
    if (!Array.isArray(rawData)) {
      throw new Error('Invalid response format from The Odds API');
    }

    const parsedGames = parseOddsApiData(rawData);

    const result: LiveOddsResponse = {
      success: true,
      source: 'The Odds API (Live NCAA Football Feed)',
      timestamp: new Date().toISOString(),
      totalGames: parsedGames.length,
      games: parsedGames,
      quota: {
        requestsRemaining,
        requestsUsed,
      },
      cached: false,
    };

    oddsCache = {
      data: result,
      expiresAt: now + CACHE_TTL_MS,
    };

    logStructured('info', 'Successfully refreshed live CFB odds', {
      totalGames: parsedGames.length,
      requestsRemaining,
    });

    return result;
  } catch (err: any) {
    logStructured('error', 'Failed to fetch live CFB odds', {
      error: err?.message || String(err),
    });

    // If cache exists even if expired, return it with error note
    if (oddsCache) {
      return {
        ...oddsCache.data,
        cached: true,
      };
    }

    throw err;
  }
}
