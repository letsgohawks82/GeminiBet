import { DetailedGame } from '../types';
import { rawGamesList } from './rawGamesData';
import { picks2026Data } from './picks2026Data';

export const games2026Detailed: DetailedGame[] = picks2026Data
  .filter((p) => p.isSettled)
  .map((p) => {
    const spreadEdgeAbs = p.spreadEdgeAbs;
    const totalEdgeAbs = p.totalEdgeAbs;

    let atsEdgeTier = '< 1.0 pt (Consensus)';
    if (spreadEdgeAbs >= 7.0) atsEdgeTier = '≥ 7.0 pts (Mega)';
    else if (spreadEdgeAbs >= 5.0) atsEdgeTier = '5.0 - 6.9 pts (High)';
    else if (spreadEdgeAbs >= 3.0) atsEdgeTier = '3.0 - 4.9 pts (Mod)';
    else if (spreadEdgeAbs >= 1.0) atsEdgeTier = '1.0 - 2.9 pts (Low)';

    let ouEdgeTier = '< 1.0 pt';
    if (totalEdgeAbs >= 5.0) ouEdgeTier = '≥ 5.0 pts (High)';
    else if (totalEdgeAbs >= 2.5) ouEdgeTier = '2.5 - 4.9 pts (Mod)';
    else if (totalEdgeAbs >= 1.0) ouEdgeTier = '1.0 - 2.4 pts (Low)';

    const absSpread = Math.abs(p.marketSpread);
    let spreadMagnitudeTier = 'Pick-3.0 pts';
    if (absSpread > 21.0) spreadMagnitudeTier = '> 21.0 pts (Blowout)';
    else if (absSpread > 14.0) spreadMagnitudeTier = '14.5 - 21.0 pts (Heavy)';
    else if (absSpread > 7.0) spreadMagnitudeTier = '7.5 - 14.0 pts (Med)';
    else if (absSpread > 3.0) spreadMagnitudeTier = '3.5 - 7.0 pts (Key)';

    let pwTier = '< 55% (Tossup)';
    if (p.feiWinProb >= 0.85) pwTier = '≥ 85% (Elite)';
    else if (p.feiWinProb >= 0.75) pwTier = '75-84% (Strong)';
    else if (p.feiWinProb >= 0.65) pwTier = '65-74% (Mod)';
    else if (p.feiWinProb >= 0.55) pwTier = '55-64% (Slight)';

    let totalRangeTier = '46.0 - 54.5 (Med)';
    if (p.marketTotal < 46.0) totalRangeTier = '< 46.0 (Low)';
    else if (p.marketTotal > 64.5) totalRangeTier = '≥ 65.0 (Shootout)';
    else if (p.marketTotal > 54.5) totalRangeTier = '55.0 - 64.5 (High)';

    const modelAtsSide = p.recommendedBetSide.toLowerCase().includes('fav')
      ? 'Fav'
      : p.recommendedBetSide.toLowerCase().includes('dog') || p.recommendedBetSide.toLowerCase().includes('underdog')
      ? 'Dog'
      : 'Neutral';

    const modelOuSide = p.recommendedBetSide.toLowerCase().includes('over')
      ? 'Over'
      : p.recommendedBetSide.toLowerCase().includes('under')
      ? 'Under'
      : 'Neutral';

    return {
      id: p.id,
      year: 2026,
      week: p.week,
      weekPhase: 'Early (Wk 0-3)',
      winner: p.favorite,
      loser: p.underdog,
      pw: p.feiWinProb,
      pm: p.feiProjMargin,
      pf: 30.0,
      pa: 20.0,
      pt: p.feiProjTotal,
      final: p.finalScore || 'Final',
      cl: `${p.marketSpread}`,
      clNum: p.marketSpread,
      ct: p.marketTotal,
      pe: 11.2,
      su: p.actualResult === 'WON' ? 'Win' : 'Loss',
      ats: p.actualResult === 'WON' ? 'Win' : p.actualResult === 'LOST' ? 'Loss' : 'Push',
      ou: p.recommendedBetSide.toLowerCase().includes('over') && p.actualResult === 'LOST' ? 'Loss' : 'Win',
      spreadDiff: p.spreadDiff,
      spreadEdgeAbs: p.spreadEdgeAbs,
      totalDiff: p.totalDiff,
      totalEdgeAbs: p.totalEdgeAbs,
      atsEdgeTier,
      ouEdgeTier,
      spreadMagnitudeTier,
      pwTier,
      totalRangeTier,
      modelAtsSide,
      modelOuSide,
    };
  });

export const allGamesData: DetailedGame[] = [...rawGamesList, ...games2026Detailed];

