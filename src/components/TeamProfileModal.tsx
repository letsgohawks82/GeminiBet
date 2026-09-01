import React, { useState, useMemo } from 'react';
import {
  X,
  Shield,
  Calendar,
  Activity,
  TrendingUp,
  Award,
  ChevronRight,
  ExternalLink,
  Plus,
  Check,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { getTeamProfile, TeamHistoricalGame } from '../utils/teamData';
import { Pick2026, DetailedGame } from '../types';

interface TeamProfileModalProps {
  teamName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTeam: (teamName: string) => void;
  onSelectGame2026: (pick: Pick2026) => void;
  onSelectGameHistorical: (game: DetailedGame) => void;
  onToggleSlipLeg?: (pick: Pick2026) => void;
  slipGameIds?: Set<string>;
  unitSize?: number;
  allGames?: DetailedGame[];
}

export const TeamProfileModal: React.FC<TeamProfileModalProps> = ({
  teamName,
  isOpen,
  onClose,
  onSelectTeam,
  onSelectGame2026,
  onSelectGameHistorical,
  onToggleSlipLeg,
  slipGameIds = new Set(),
  unitSize = 20,
  allGames = [],
}) => {
  const [activeTab, setActiveTab] = useState<'2026' | 'history' | 'seasons'>('2026');
  const [gameLogSearch, setGameLogSearch] = useState('');
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<number | 'ALL'>('ALL');

  const profile = useMemo(() => {
    if (!teamName) return null;
    return getTeamProfile(teamName);
  }, [teamName]);

  // Handle ESC
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !teamName || !profile) return null;

  const filteredGameLogs = profile.gameLogs.filter((log) => {
    const matchesSeason = selectedSeasonFilter === 'ALL' || log.year === selectedSeasonFilter;
    const matchesSearch =
      !gameLogSearch ||
      log.opponent.toLowerCase().includes(gameLogSearch.toLowerCase()) ||
      log.week.toLowerCase().includes(gameLogSearch.toLowerCase()) ||
      log.finalScoreText.toLowerCase().includes(gameLogSearch.toLowerCase());
    return matchesSeason && matchesSearch;
  });

  const handleGameLogClick = (log: TeamHistoricalGame) => {
    const matchedGame = allGames.find((g) => g.id === log.id);
    if (matchedGame) {
      onSelectGameHistorical(matchedGame);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl shrink-0 shadow-md">
              <Shield className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="team-profile-title" className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  {profile.name}
                </h2>
                <span className="rounded-md bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                  {profile.conference}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive FEI Efficiency Profile & All-Game Matchup History
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="self-end sm:self-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-900/50 border-b border-slate-800 text-xs">
          <div className="rounded-xl bg-slate-900 p-2.5 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Straight-Up Record</span>
            <span className="text-sm font-bold text-white">
              {profile.suWins}-{profile.suLosses}
            </span>
            <span className="text-[11px] text-slate-400 ml-1">
              ({profile.suWinPct.toFixed(1)}%)
            </span>
          </div>

          <div className="rounded-xl bg-slate-900 p-2.5 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Against the Spread</span>
            <span className="text-sm font-bold text-emerald-400">
              {profile.atsWins}-{profile.atsLosses}
              {profile.atsPushes > 0 ? `-${profile.atsPushes}` : ''}
            </span>
            <span className="text-[11px] text-emerald-300/80 ml-1">
              ({profile.atsCoverPct.toFixed(1)}% Cover)
            </span>
          </div>

          <div className="rounded-xl bg-slate-900 p-2.5 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Avg Scoring</span>
            <span className="text-sm font-bold text-slate-200">
              {profile.avgPointsScored.toFixed(1)} PF / {profile.avgPointsAllowed.toFixed(1)} PA
            </span>
          </div>

          <div className="rounded-xl bg-slate-900 p-2.5 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">FEI Avg Proj Error</span>
            <span className="text-sm font-bold text-cyan-400">
              {profile.avgPe > 0 ? `${profile.avgPe.toFixed(1)} pts` : '—'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('2026')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === '2026'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>2026 Slates ({profile.activePicks2026.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Historical Game Log ({profile.totalHistoricalGames})</span>
          </button>

          <button
            onClick={() => setActiveTab('seasons')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'seasons'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Season Records ({profile.seasons.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: 2026 Active Slates */}
          {activeTab === '2026' && (
            <div className="space-y-4">
              {profile.activePicks2026.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 text-sm">
                  <p>No currently scheduled 2026 model picks for {profile.name}.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Check the Historical Game Log tab below for archived games.
                  </p>
                </div>
              ) : (
                profile.activePicks2026.map((pick) => {
                  const isInSlip = slipGameIds.has(pick.id);
                  const isOpponentFav = pick.favorite.toLowerCase() !== profile.name.toLowerCase();
                  const opponentName = isOpponentFav ? pick.favorite : pick.underdog;

                  return (
                    <div
                      key={pick.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold uppercase tracking-wider text-slate-400">
                            {pick.week}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">{pick.venue}</span>
                        </div>

                        {pick.isSettled ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                              pick.actualResult === 'WON'
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                                : pick.actualResult === 'LOST'
                                ? 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                                : 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            <span>{pick.actualResult === 'WON' ? '✓ SETTLED: WON' : pick.actualResult === 'LOST' ? '✗ SETTLED: LOST' : '– SETTLED: PUSH'}</span>
                            {pick.finalScore && <span className="opacity-80 font-normal">({pick.finalScore})</span>}
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-emerald-400 font-medium">
                            {pick.alphaTierTag}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-base font-bold text-white">
                            <button
                              type="button"
                              onClick={() => onSelectTeam(pick.favorite)}
                              className="hover:text-emerald-400 hover:underline transition-colors"
                            >
                              {pick.favorite}
                            </button>
                            <span className="text-slate-500 font-normal">vs</span>
                            <button
                              type="button"
                              onClick={() => onSelectTeam(pick.underdog)}
                              className="hover:text-emerald-400 hover:underline transition-colors"
                            >
                              {pick.underdog}
                            </button>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <span>Market Spread: <strong>{pick.marketSpread > 0 ? `-${pick.marketSpread}` : pick.marketSpread}</strong></span>
                            <span>•</span>
                            <span>FEI Proj Score: <strong className="text-emerald-300">{pick.feiProjScore}</strong></span>
                            <span>•</span>
                            <span>Edge: <strong className="text-emerald-400">+{pick.spreadEdgeAbs.toFixed(1)} pts</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectGame2026(pick)}
                            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors inline-flex items-center gap-1"
                          >
                            <span>Game Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          {onToggleSlipLeg && !pick.isSettled && (
                            <button
                              type="button"
                              onClick={() => onToggleSlipLeg(pick)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                                isInSlip
                                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                              }`}
                            >
                              {isInSlip ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              <span>{isInSlip ? 'In Slip' : 'Add Bet'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Recommended Bet Bar */}
                      <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 px-3 py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Recommended Bet</span>
                          <span className="font-bold text-emerald-300">{pick.recommendedBetText}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">EV / Kelly</span>
                          <span className="font-bold text-white">+{pick.expectedValue.toFixed(1)}% / {pick.units}u</span>
                        </div>
                      </div>

                      {/* Settled Post Mortem Note if available */}
                      {pick.isSettled && pick.postMortemNotes && (
                        <div className="rounded-lg bg-slate-950 p-2.5 text-xs text-slate-300 border border-slate-800">
                          <strong className="text-slate-200 block mb-0.5">Post-Game Takeaway:</strong>
                          {pick.postMortemNotes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: Historical Game Log */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {/* Search & Season Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={gameLogSearch}
                    onChange={(e) => setGameLogSearch(e.target.value)}
                    placeholder="Search opponent or week..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1 self-end text-xs">
                  <span className="text-slate-400 text-[11px] mr-1">Season:</span>
                  <button
                    onClick={() => setSelectedSeasonFilter('ALL')}
                    className={`px-2 py-1 rounded font-mono text-xs ${
                      selectedSeasonFilter === 'ALL'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  {profile.seasons.map((s) => (
                    <button
                      key={s.year}
                      onClick={() => setSelectedSeasonFilter(s.year)}
                      className={`px-2 py-1 rounded font-mono text-xs ${
                        selectedSeasonFilter === s.year
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s.year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Log Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Season / Week</th>
                      <th className="py-2.5 px-3">Opponent</th>
                      <th className="py-2.5 px-3">Score</th>
                      <th className="py-2.5 px-3">Closing Spread</th>
                      <th className="py-2.5 px-3">ATS Cover</th>
                      <th className="py-2.5 px-3">O/U Total</th>
                      <th className="py-2.5 px-3">FEI Error</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredGameLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-500">
                          No games matched the search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredGameLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-300">
                            <span className="font-bold text-white">{log.year}</span>{' '}
                            <span className="text-slate-500 text-[11px]">({log.week})</span>
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <button
                              type="button"
                              onClick={() => onSelectTeam(log.opponent)}
                              className="text-white hover:text-emerald-400 hover:underline font-semibold transition-colors text-left"
                            >
                              {log.opponent}
                            </button>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`font-bold ${
                                log.isWin ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {log.finalScoreText}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{log.spreadLine}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                log.atsResult === 'Cover'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : log.atsResult === 'Loss'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {log.atsResult}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {log.ouResult} ({log.closingTotal})
                          </td>
                          <td className="py-2.5 px-3 text-cyan-400">{log.pe.toFixed(1)} pts</td>
                          <td className="py-2.5 px-3 text-right font-sans">
                            <button
                              type="button"
                              onClick={() => handleGameLogClick(log)}
                              className="rounded px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                            >
                              View Game
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Season-by-Season Breakdown */}
          {activeTab === 'seasons' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.seasons.map((season) => (
                  <div
                    key={season.year}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white text-base">{season.year} Season</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {season.totalGames} Games Logged
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-slate-400 text-[10px] uppercase block">SU Record</span>
                        <span className="font-bold text-white">
                          {season.suWins}-{season.suLosses} ({season.suWinPct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-slate-400 text-[10px] uppercase block">ATS Cover Rate</span>
                        <span className="font-bold text-emerald-400">
                          {season.atsWins}-{season.atsLosses} ({season.atsCoverPct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-slate-400 text-[10px] uppercase block">Avg Scoring</span>
                        <span className="font-bold text-slate-200">
                          {season.avgPointsScored.toFixed(1)} - {season.avgPointsAllowed.toFixed(1)}
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-slate-400 text-[10px] uppercase block">Avg Proj Error</span>
                        <span className="font-bold text-cyan-400">
                          {season.avgPe.toFixed(1)} pts
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSeasonFilter(season.year);
                        setActiveTab('history');
                      }}
                      className="w-full text-center py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      View {season.year} Games Log →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Click any opponent or game to inspect their full profile.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-1.5 font-semibold text-white transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
