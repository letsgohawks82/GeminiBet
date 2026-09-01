import { SportsbookQuote, SportsbookBestLine } from '../types';

export interface GameOddsProfile {
  spread: number;
  total: number;
  favorite: string;
  underdog: string;
  recommendedBetSide: 'Favorite Spread' | 'Underdog Spread' | 'Over Total' | 'Under Total' | 'Moneyline Value';
}

export function generateSportsbookQuotes(profile: GameOddsProfile): {
  quotes: SportsbookQuote[];
  bestBook: SportsbookBestLine;
} {
  const { spread, total, recommendedBetSide, favorite, underdog } = profile;

  // Base spreads and odds variations across the 5 target sportsbooks:
  // DraftKings, FanDuel, theScore, Caesars, BetRivers
  let dkSpread = spread;
  let dkOdds = -110;
  let dkTotal = total;
  let dkTotalOdds = -110;

  let fdSpread = spread;
  let fdOdds = -110;
  let fdTotal = total;
  let fdTotalOdds = -110;

  let scoreSpread = spread;
  let scoreOdds = -110;
  let scoreTotal = total;
  let scoreTotalOdds = -110;

  let czrSpread = spread;
  let czrOdds = -110;
  let czrTotal = total;
  let czrTotalOdds = -110;

  let rivSpread = spread;
  let rivOdds = -110;
  let rivTotal = total;
  let rivTotalOdds = -110;

  // Create authentic cross-book line shopping opportunities across the 5 books
  // Hash the matchup to produce deterministic, consistent lines per matchup
  const hashKey = (favorite.length * 7 + underdog.length * 13 + Math.abs(spread) * 10) % 5;

  if (recommendedBetSide === 'Favorite Spread') {
    if (hashKey === 0 || hashKey === 3) {
      // FanDuel offers a half-point discount on the favorite with reduced vig
      fdSpread = spread > -4 ? spread : spread + 0.5; // e.g. -6.5 -> -6.0 or -10.5 -> -10.0
      fdOdds = -108;
      czrSpread = spread - 0.5;
      czrOdds = -112;
      rivOdds = -110;
      scoreOdds = -110;
      dkOdds = -110;
    } else if (hashKey === 1) {
      // Caesars offers a discount on the favorite line
      czrSpread = spread > -4 ? spread : spread + 0.5;
      czrOdds = -108;
      fdOdds = -110;
      dkSpread = spread - 0.5;
      dkOdds = -112;
    } else if (hashKey === 2) {
      // DraftKings offers lowest juice and favorable hook
      dkSpread = spread > -4 ? spread : spread + 0.5;
      dkOdds = -108;
      rivSpread = spread;
      rivOdds = -112;
    } else {
      // BetRivers / theScore provides best favorite pricing
      rivSpread = spread > -4 ? spread : spread + 0.5;
      rivOdds = -108;
      scoreOdds = -109;
    }
  } else if (recommendedBetSide === 'Underdog Spread') {
    if (hashKey === 0 || hashKey === 2) {
      // DraftKings offers +0.5 point extra cushion on the underdog
      dkSpread = spread > 0 ? spread + 0.5 : spread - 0.5; // gives dog +0.5 more
      dkOdds = -108;
      fdSpread = spread;
      fdOdds = -110;
      czrOdds = -112;
    } else if (hashKey === 1) {
      // BetRivers offers +0.5 extra point on dog
      rivSpread = spread > 0 ? spread + 0.5 : spread - 0.5;
      rivOdds = -108;
      dkOdds = -110;
    } else if (hashKey === 3) {
      // theScore offers underdog value with +0.5 cushion
      scoreSpread = spread > 0 ? spread + 0.5 : spread - 0.5;
      scoreOdds = -108;
      fdOdds = -112;
    } else {
      // Caesars offers extra underdog cushion
      czrSpread = spread > 0 ? spread + 0.5 : spread - 0.5;
      czrOdds = -108;
    }
  } else if (recommendedBetSide === 'Over Total') {
    if (hashKey % 2 === 0) {
      // DraftKings has 0.5 lower total for the Over
      dkTotal = total - 0.5;
      dkTotalOdds = -108;
      fdTotalOdds = -110;
      rivTotalOdds = -112;
    } else {
      // BetRivers has 0.5 lower total
      rivTotal = total - 0.5;
      rivTotalOdds = -108;
      czrTotalOdds = -110;
    }
  } else if (recommendedBetSide === 'Under Total') {
    if (hashKey % 2 === 0) {
      // Caesars offers 0.5 higher total for the Under
      czrTotal = total + 0.5;
      czrTotalOdds = -108;
    } else {
      // theScore offers 0.5 higher total
      scoreTotal = total + 0.5;
      scoreTotalOdds = -108;
    }
  }

  const quotes: SportsbookQuote[] = [
    {
      bookName: 'DraftKings',
      spread: dkSpread,
      spreadOdds: dkOdds,
      total: dkTotal,
      totalOdds: dkTotalOdds,
      moneyline: spread < 0 ? Math.round(spread * 36 - 45) : Math.round(spread * 31 + 125),
      isBestForPick: false,
      externalUrl: 'https://sportsbook.draftkings.com',
    },
    {
      bookName: 'FanDuel',
      spread: fdSpread,
      spreadOdds: fdOdds,
      total: fdTotal,
      totalOdds: fdTotalOdds,
      moneyline: spread < 0 ? Math.round(spread * 35 - 50) : Math.round(spread * 30 + 120),
      isBestForPick: false,
      externalUrl: 'https://sportsbook.fanduel.com',
    },
    {
      bookName: 'theScore',
      spread: scoreSpread,
      spreadOdds: scoreOdds,
      total: scoreTotal,
      totalOdds: scoreTotalOdds,
      moneyline: spread < 0 ? Math.round(spread * 35 - 48) : Math.round(spread * 30 + 122),
      isBestForPick: false,
      externalUrl: 'https://thescore.bet',
    },
    {
      bookName: 'Caesars',
      spread: czrSpread,
      spreadOdds: czrOdds,
      total: czrTotal,
      totalOdds: czrTotalOdds,
      moneyline: spread < 0 ? Math.round(spread * 37 - 55) : Math.round(spread * 32 + 130),
      isBestForPick: false,
      externalUrl: 'https://www.caesars.com/sportsbook-and-casino',
    },
    {
      bookName: 'BetRivers',
      spread: rivSpread,
      spreadOdds: rivOdds,
      total: rivTotal,
      totalOdds: rivTotalOdds,
      moneyline: spread < 0 ? Math.round(spread * 35 - 46) : Math.round(spread * 31 + 124),
      isBestForPick: false,
      externalUrl: 'https://www.betrivers.com',
    },
  ];

  // Determine the best sportsbook among DraftKings, FanDuel, theScore, Caesars, and BetRivers
  let bestBook: SportsbookBestLine;

  if (recommendedBetSide === 'Favorite Spread') {
    // Find the book with best spread (least negative) or best odds
    let bestIdx = 1; // default FanDuel
    if (fdSpread > spread || fdOdds > -110) {
      bestIdx = 1; // FanDuel
    } else if (czrSpread > spread || czrOdds > -110) {
      bestIdx = 3; // Caesars
    } else if (dkSpread > spread || dkOdds > -110) {
      bestIdx = 0; // DraftKings
    } else if (rivSpread > spread || rivOdds > -110) {
      bestIdx = 4; // BetRivers
    } else if (scoreSpread > spread || scoreOdds > -110) {
      bestIdx = 2; // theScore
    }

    const chosen = quotes[bestIdx];
    chosen.isBestForPick = true;
    chosen.edgeAdvantageDescription =
      chosen.spread > spread
        ? `Saves 0.5 pts (${chosen.spread} vs market ${spread})`
        : `Reduced vig (${chosen.spreadOdds})`;

    bestBook = {
      bookName: chosen.bookName,
      line: `${favorite} ${chosen.spread > 0 ? `+${chosen.spread}` : chosen.spread}`,
      odds: chosen.spreadOdds,
      edgeSummary: `Take at ${chosen.bookName}: ${chosen.spread > 0 ? `+${chosen.spread}` : chosen.spread} (${chosen.spreadOdds}) ${
        chosen.spread > spread ? `saves 0.5 pts over market ${spread}` : 'offers best reduced vig price'
      }`,
      juiceSavingsPct: chosen.spreadOdds >= -108 ? 2.0 : 1.0,
      directUrl: chosen.externalUrl,
    };
  } else if (recommendedBetSide === 'Underdog Spread') {
    let bestIdx = 0; // default DraftKings
    if (Math.abs(dkSpread) > Math.abs(spread) || dkOdds > -110) {
      bestIdx = 0; // DraftKings
    } else if (Math.abs(rivSpread) > Math.abs(spread) || rivOdds > -110) {
      bestIdx = 4; // BetRivers
    } else if (Math.abs(scoreSpread) > Math.abs(spread) || scoreOdds > -110) {
      bestIdx = 2; // theScore
    } else if (Math.abs(czrSpread) > Math.abs(spread) || czrOdds > -110) {
      bestIdx = 3; // Caesars
    } else {
      bestIdx = 1; // FanDuel
    }

    const chosen = quotes[bestIdx];
    chosen.isBestForPick = true;
    chosen.edgeAdvantageDescription =
      Math.abs(chosen.spread) > Math.abs(spread)
        ? `Extra +0.5 pt spread cushion on ${underdog}`
        : `Best underdog pricing (${chosen.spreadOdds})`;

    bestBook = {
      bookName: chosen.bookName,
      line: `${underdog} +${Math.abs(chosen.spread)}`,
      odds: chosen.spreadOdds,
      edgeSummary: `Take at ${chosen.bookName}: +${Math.abs(chosen.spread)} (${chosen.spreadOdds}) provides ${
        Math.abs(chosen.spread) > Math.abs(spread) ? `extra +0.5 pt cushion over market ${spread}` : 'lowest vig rate'
      }`,
      juiceSavingsPct: 2.0,
      directUrl: chosen.externalUrl,
    };
  } else if (recommendedBetSide === 'Over Total') {
    let bestIdx = 0; // DraftKings
    if (dkTotal < total || dkTotalOdds > -110) {
      bestIdx = 0; // DraftKings
    } else if (rivTotal < total || rivTotalOdds > -110) {
      bestIdx = 4; // BetRivers
    } else {
      bestIdx = 1; // FanDuel
    }

    const chosen = quotes[bestIdx];
    chosen.isBestForPick = true;
    chosen.edgeAdvantageDescription = `Lowest Over line: ${chosen.total} (${chosen.totalOdds})`;

    bestBook = {
      bookName: chosen.bookName,
      line: `OVER ${chosen.total}`,
      odds: chosen.totalOdds || -110,
      edgeSummary: `Take at ${chosen.bookName}: OVER ${chosen.total} (${chosen.totalOdds}) gives best line for Over bettors`,
      juiceSavingsPct: 2.0,
      directUrl: chosen.externalUrl,
    };
  } else if (recommendedBetSide === 'Under Total') {
    let bestIdx = 3; // Caesars
    if (czrTotal > total || czrTotalOdds > -110) {
      bestIdx = 3; // Caesars
    } else if (scoreTotal > total || scoreTotalOdds > -110) {
      bestIdx = 2; // theScore
    } else {
      bestIdx = 4; // BetRivers
    }

    const chosen = quotes[bestIdx];
    chosen.isBestForPick = true;
    chosen.edgeAdvantageDescription = `Highest Under line: ${chosen.total} (${chosen.totalOdds})`;

    bestBook = {
      bookName: chosen.bookName,
      line: `UNDER ${chosen.total}`,
      odds: chosen.totalOdds || -110,
      edgeSummary: `Take at ${chosen.bookName}: UNDER ${chosen.total} (${chosen.totalOdds}) gives highest total buffer`,
      juiceSavingsPct: 2.0,
      directUrl: chosen.externalUrl,
    };
  } else {
    // Moneyline Value
    const chosen = quotes[0]; // DraftKings
    chosen.isBestForPick = true;
    bestBook = {
      bookName: chosen.bookName,
      line: `${underdog} ML`,
      odds: chosen.moneyline || +115,
      edgeSummary: `Take at ${chosen.bookName}: best moneyline value at ${chosen.moneyline && chosen.moneyline > 0 ? `+${chosen.moneyline}` : chosen.moneyline}`,
      juiceSavingsPct: 2.5,
      directUrl: chosen.externalUrl,
    };
  }

  return { quotes, bestBook };
}
