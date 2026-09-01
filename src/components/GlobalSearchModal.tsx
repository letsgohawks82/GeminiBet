import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Shield, Calendar, ChevronRight, Sparkles, Trophy, Grid } from 'lucide-react';
import { searchTeamsAndGames, SearchResultItem, TEAM_CONFERENCE_MAP, getAllConferences, getTeamsByConference } from '../utils/teamData';
import { Pick2026, DetailedGame } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTeam: (teamName: string) => void;
  onSelectGame2026: (pick: Pick2026) => void;
  onSelectGameHistorical: (game: DetailedGame) => void;
  picks2026: Pick2026[];
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTeam,
  onSelectGame2026,
  onSelectGameHistorical,
  picks2026,
}) => {
  const [query, setQuery] = useState('');
  const [selectedConference, setSelectedConference] = useState<string>('All');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedConference('All');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = searchTeamsAndGames(query, picks2026);
  const conferences = ['All', 'SEC', 'Big Ten', 'Big 12', 'ACC', 'Mountain West', 'American', 'Sun Belt', 'MAC', 'Conference USA', 'Independent'];

  if (!isOpen) return null;

  const handleItemClick = (item: SearchResultItem) => {
    if (item.type === 'team' && item.teamName) {
      onSelectTeam(item.teamName);
      onClose();
    } else if (item.type === 'game-2026' && item.game2026) {
      onSelectGame2026(item.game2026);
      onClose();
    } else if (item.type === 'game-historical' && item.gameHistorical) {
      onSelectGameHistorical(item.gameHistorical);
      onClose();
    }
  };

  const handleSelectTeamByName = (teamName: string) => {
    onSelectTeam(teamName);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 pt-12 sm:pt-20 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-mono"
    >
      <div className="relative w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Box */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any team (e.g. Georgia, TCU, LSU, Memphis, Ohio, Troy) or game..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition-colors shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Conference Filter Bar */}
        <div className="px-4 py-2 bg-[#0a101d] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-emerald-400" />
            <span>Conf:</span>
          </span>
          {conferences.map((conf) => (
            <button
              key={conf}
              type="button"
              onClick={() => {
                setSelectedConference(conf);
                if (conf !== 'All') {
                  setQuery('');
                }
              }}
              className={`px-2.5 py-0.5 rounded-full transition-all whitespace-nowrap ${
                selectedConference === conf
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {conf}
            </button>
          ))}
        </div>

        {/* Results List or Conference Directory */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {query.trim() === '' && selectedConference === 'All' ? (
            <div className="space-y-4">
              <div className="p-4 text-center text-slate-400 text-xs sm:text-sm bg-slate-900/40 rounded-xl border border-slate-800/80 space-y-2">
                <p className="font-semibold text-white flex items-center justify-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>College Football Team & Game Explorer</span>
                </p>
                <p className="text-xs text-slate-400 font-sans max-w-lg mx-auto">
                  Type any team name or filter by conference above to drill into complete 2026 schedules, historical game logs, ATS records, and FEI efficiency metrics.
                </p>
              </div>

              {/* Quick Picks / Popular */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1">
                  Active 2026 Slate Teams
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {[
                    'TCU',
                    'North Carolina',
                    'North Dakota State',
                    'Jacksonville State',
                    'Memphis',
                    'UNLV',
                    'Florida State',
                    'USC',
                    'Stanford',
                    'Hawaii',
                    'LSU',
                    'Clemson',
                    'Auburn',
                    'Baylor',
                    'Georgia',
                    'Texas',
                  ].map((team) => {
                    const conf = TEAM_CONFERENCE_MAP[team] || 'FBS';
                    return (
                      <button
                        key={team}
                        type="button"
                        onClick={() => handleSelectTeamByName(team)}
                        className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs group-hover:text-emerald-400 truncate">
                            {team}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            {conf}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : query.trim() === '' && selectedConference !== 'All' ? (
            /* Browse by Conference */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {selectedConference} Directory ({getTeamsByConference(selectedConference).length} Teams)
                </span>
                <span className="text-[11px] text-slate-500 font-sans">
                  Click any team to drill into profile
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {getTeamsByConference(selectedConference).map((team) => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => handleSelectTeamByName(team)}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 shrink-0">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-white text-xs group-hover:text-emerald-400 truncate">
                        {team}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No teams or games found matching &quot;{query}&quot;.
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-900 text-left transition-colors group border border-transparent hover:border-slate-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-slate-900 group-hover:bg-emerald-500/10 border border-slate-800 group-hover:border-emerald-500/30 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 shrink-0 transition-colors">
                    {item.type === 'team' ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <Calendar className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate font-sans">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5 font-sans">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 shrink-0 transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
