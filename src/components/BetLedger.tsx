import React, { useState, useMemo } from 'react';
import {
  UserLoggedBet,
  BetLedgerStats,
} from '../types';
import {
  calculateBetLedgerStats,
  saveUserBets,
  INITIAL_SAMPLE_BETS,
} from '../utils/betLedgerStorage';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Trophy,
  Scale,
  Download,
  RotateCcw,
  Sparkles,
  AlertCircle,
  X,
  Copy,
  ChevronDown,
  ChevronUp,
  Filter,
  Check,
  Building,
} from 'lucide-react';

interface BetLedgerProps {
  userBets?: UserLoggedBet[];
  onUpdateBets?: (bets: UserLoggedBet[]) => void;
  selectedWeek?: string;
  onSelectWeek?: (week: string) => void;
  onBackToPicks?: () => void;
  unitSize?: number;
  onSetUnitSize?: (val: number) => void;
  bankrollUnits?: number;
  onSetBankrollUnits?: (val: number) => void;
  onOpenTeam?: (teamName: string) => void;
}

export const BetLedger: React.FC<BetLedgerProps> = ({
  userBets = [],
  onUpdateBets = (_bets: UserLoggedBet[]) => {},
  selectedWeek: propSelectedWeek,
  onSelectWeek: propOnSelectWeek,
  onBackToPicks,
  unitSize = 20,
  onSetUnitSize,
  bankrollUnits = 100,
  onSetBankrollUnits,
  onOpenTeam,
}) => {
  const [internalSelectedWeek, setInternalSelectedWeek] = useState<string>('All Weeks');
  const selectedWeek = propSelectedWeek || internalSelectedWeek;
  const onSelectWeek = (w: string) => {
    setInternalSelectedWeek(w);
    if (propOnSelectWeek) propOnSelectWeek(w);
  };

  // Filters
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LOCKED_NOW' | 'WAITING_FOR_LINE' | 'PENDING' | 'WON' | 'LOST'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'straight' | 'parlay' | 'teaser'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBetId, setEditingBetId] = useState<string | null>(null);

  // Form Fields
  const [formWeek, setFormWeek] = useState<string>(selectedWeek === 'All Weeks' ? 'Week 0' : selectedWeek);
  const [formType, setFormType] = useState<'straight' | 'parlay' | 'teaser'>('straight');
  const [formSelection, setFormSelection] = useState<string>('');
  const [formMatchup, setFormMatchup] = useState<string>('');
  const [formBook, setFormBook] = useState<string>('DraftKings');
  const [formLine, setFormLine] = useState<string>('-3.5');
  const [formOdds, setFormOdds] = useState<number>(-110);
  const [formStakeDollars, setFormStakeDollars] = useState<number>(30);
  const [formStakeUnits, setFormStakeUnits] = useState<number>(1.2);
  const [formTimingStatus, setFormTimingStatus] = useState<'LOCKED_NOW' | 'WAITING_FOR_LINE' | 'LINE_MOVED_BET_NOW' | 'PASSED'>('LOCKED_NOW');
  const [formTargetWaitLine, setFormTargetWaitLine] = useState<string>('');
  const [formTimingNotes, setFormTimingNotes] = useState<string>('');
  const [formGrade, setFormGrade] = useState<'A+' | 'A' | 'B+' | 'B'>('A');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formClvDelta, setFormClvDelta] = useState<number>(1.0);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Calculate stats
  const stats: BetLedgerStats = useMemo(() => calculateBetLedgerStats(userBets, unitSize), [userBets, unitSize]);

  // Filtered bets
  const filteredBets = useMemo(() => {
    return userBets.filter((bet) => {
      if (selectedWeek !== 'All Weeks' && bet.week !== selectedWeek) {
        return false;
      }
      if (filterType !== 'ALL' && bet.ticketType !== filterType) {
        return false;
      }
      if (filterStatus === 'LOCKED_NOW' && bet.timingStatus !== 'LOCKED_NOW') {
        return false;
      }
      if (filterStatus === 'WAITING_FOR_LINE' && bet.timingStatus !== 'WAITING_FOR_LINE') {
        return false;
      }
      if (filterStatus === 'PENDING' && bet.resultStatus !== 'PENDING') {
        return false;
      }
      if (filterStatus === 'WON' && bet.resultStatus !== 'WON') {
        return false;
      }
      if (filterStatus === 'LOST' && bet.resultStatus !== 'LOST') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSelection = bet.selection.toLowerCase().includes(q);
        const matchesMatchup = bet.matchup?.toLowerCase().includes(q);
        const matchesBook = bet.bookName.toLowerCase().includes(q);
        const matchesNotes = bet.timingNotes?.toLowerCase().includes(q) || bet.notes?.toLowerCase().includes(q);
        if (!matchesSelection && !matchesMatchup && !matchesBook && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [userBets, selectedWeek, filterType, filterStatus, searchQuery]);

  // Helper to calculate potential payout
  const computePotentialPayout = (stake: number, odds: number): number => {
    if (odds > 0) {
      return parseFloat((stake + (stake * (odds / 100))).toFixed(2));
    } else {
      return parseFloat((stake + (stake * (100 / Math.abs(odds)))).toFixed(2));
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingBetId(null);
    setFormWeek(selectedWeek === 'All Weeks' ? 'Week 0' : selectedWeek);
    setFormType('straight');
    setFormSelection('');
    setFormMatchup('');
    setFormBook('DraftKings');
    setFormLine('-3.5');
    setFormOdds(-110);
    setFormStakeUnits(1.0);
    setFormStakeDollars(unitSize);
    setFormTimingStatus('LOCKED_NOW');
    setFormTargetWaitLine('');
    setFormTimingNotes('');
    setFormGrade('A');
    setFormNotes('');
    setFormClvDelta(1.0);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (bet: UserLoggedBet) => {
    setEditingBetId(bet.id);
    setFormWeek(bet.week);
    setFormType(bet.ticketType);
    setFormSelection(bet.selection);
    setFormMatchup(bet.matchup || '');
    setFormBook(bet.bookName);
    setFormLine(bet.line);
    setFormOdds(bet.oddsAmerican);
    setFormStakeDollars(bet.stakeDollars);
    setFormStakeUnits(bet.stakeUnits);
    setFormTimingStatus(bet.timingStatus);
    setFormTargetWaitLine(bet.targetWaitLine || '');
    setFormTimingNotes(bet.timingNotes || '');
    setFormGrade(bet.grade || 'A');
    setFormNotes(bet.notes || '');
    setFormClvDelta(bet.clvDeltaPts || 0);
    setIsModalOpen(true);
  };

  // Save Bet (Add or Edit)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSelection.trim()) return;

    const payout = computePotentialPayout(formStakeDollars, formOdds);

    if (editingBetId) {
      // Edit existing
      const updated = userBets.map((b) => {
        if (b.id === editingBetId) {
          return {
            ...b,
            week: formWeek,
            ticketType: formType,
            selection: formSelection,
            matchup: formMatchup,
            bookName: formBook,
            line: formLine,
            oddsAmerican: formOdds,
            stakeDollars: formStakeDollars,
            stakeUnits: formStakeUnits,
            potentialPayoutDollars: payout,
            timingStatus: formTimingStatus,
            targetWaitLine: formTargetWaitLine,
            timingNotes: formTimingNotes,
            grade: formGrade,
            notes: formNotes,
            clvDeltaPts: formClvDelta,
          };
        }
        return b;
      });
      onUpdateBets(updated);
      saveUserBets(updated);
    } else {
      // Add new
      const newBet: UserLoggedBet = {
        id: `user-bet-${Date.now()}`,
        timestamp: new Date().toISOString(),
        week: formWeek,
        ticketType: formType,
        selection: formSelection,
        matchup: formMatchup,
        bookName: formBook,
        line: formLine,
        oddsAmerican: formOdds,
        stakeDollars: formStakeDollars,
        stakeUnits: formStakeUnits,
        potentialPayoutDollars: payout,
        timingStatus: formTimingStatus,
        targetWaitLine: formTargetWaitLine,
        timingNotes: formTimingNotes,
        grade: formGrade,
        resultStatus: 'PENDING',
        clvDeltaPts: formClvDelta,
        notes: formNotes,
      };
      const updated = [newBet, ...userBets];
      onUpdateBets(updated);
      saveUserBets(updated);
    }

    setIsModalOpen(false);
  };

  // Quick Result Update
  const handleUpdateResult = (betId: string, status: 'PENDING' | 'WON' | 'LOST' | 'PUSH') => {
    const updated = userBets.map((b) => {
      if (b.id === betId) {
        let pnl: number | undefined = undefined;
        if (status === 'WON') {
          pnl = b.potentialPayoutDollars - b.stakeDollars;
        } else if (status === 'LOST') {
          pnl = -b.stakeDollars;
        } else if (status === 'PUSH') {
          pnl = 0;
        }
        return {
          ...b,
          resultStatus: status,
          actualPnlDollars: pnl,
        };
      }
      return b;
    });
    onUpdateBets(updated);
    saveUserBets(updated);
  };

  // Quick Timing Status Toggle (e.g. flip from Waiting to Locked In Now)
  const handleToggleTimingStatus = (betId: string) => {
    const updated = userBets.map((b) => {
      if (b.id === betId) {
        const nextStatus = b.timingStatus === 'WAITING_FOR_LINE' ? 'LOCKED_NOW' : 'WAITING_FOR_LINE';
        return {
          ...b,
          timingStatus: nextStatus as any,
          timingNotes: nextStatus === 'LOCKED_NOW'
            ? `⚡ Bet placed & locked in! (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
            : b.timingNotes,
        };
      }
      return b;
    });
    onUpdateBets(updated);
    saveUserBets(updated);
  };

  // Delete Bet
  const handleDeleteBet = (betId: string) => {
    const updated = userBets.filter((b) => b.id !== betId);
    onUpdateBets(updated);
    saveUserBets(updated);
  };

  // Clear All Bets
  const handleClearAllBets = () => {
    if (window.confirm('Clear all logged bets from your ledger?')) {
      onUpdateBets([]);
      saveUserBets([]);
    }
  };

  // Optional Load Sample Demo
  const handleLoadSampleDemo = () => {
    if (window.confirm('Load sample Week 0 / Week 1 historical and active bets into your ledger for demonstration?')) {
      onUpdateBets(INITIAL_SAMPLE_BETS);
      saveUserBets(INITIAL_SAMPLE_BETS);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Date Logged',
      'Week',
      'Type',
      'Selection',
      'Matchup',
      'Sportsbook',
      'Line',
      'Odds',
      'Stake ($)',
      'Stake (u)',
      'Potential Payout ($)',
      'Timing Status',
      'Target Wait Line',
      'Result',
      'Profit / Loss ($)',
      'CLV Beat (pts)',
      'Timing Strategy Notes',
    ];

    const rows = userBets.map((b) => [
      `"${b.timestamp.split('T')[0]}"`,
      `"${b.week}"`,
      `"${b.ticketType.toUpperCase()}"`,
      `"${b.selection.replace(/"/g, '""')}"`,
      `"${(b.matchup || '').replace(/"/g, '""')}"`,
      `"${b.bookName}"`,
      `"${b.line}"`,
      b.oddsAmerican > 0 ? `+${b.oddsAmerican}` : `${b.oddsAmerican}`,
      b.stakeDollars,
      b.stakeUnits,
      b.potentialPayoutDollars,
      `"${b.timingStatus}"`,
      `"${(b.targetWaitLine || '').replace(/"/g, '""')}"`,
      `"${b.resultStatus}"`,
      b.actualPnlDollars !== undefined ? b.actualPnlDollars : 0,
      b.clvDeltaPts || 0,
      `"${(b.timingNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CFB_Bet_Tracker_Performance_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyDirective = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="bet-ledger-container" className="space-y-5 font-mono">
      {/* Top Banner: Crisp Bet Performance & Execution Ledger */}
      <div className="p-4 bg-gradient-to-r from-[#0d1627] via-[#111f38] to-[#0f172a] border border-slate-800 rounded-xl shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Bet Performance & Execution Ledger
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Active positions, unit sizing verification, closing line value (CLV), and historical P&L analytics.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bankroll Presets */}
            <div className="flex items-center gap-1 rounded-lg bg-[#090d16] border border-slate-800 px-2 py-1 text-xs">
              <span className="text-slate-400 text-[10px]">Bankroll:</span>
              <div className="flex items-center gap-0.5">
                {[25, 50, 75, 100].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onSetBankrollUnits && onSetBankrollUnits(b)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      bankrollUnits === b
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={`${b} units = $${(b * unitSize).toLocaleString()}`}
                  >
                    {b}u
                  </button>
                ))}
              </div>
            </div>

            <button
              id="btn-log-new-bet"
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-bold text-xs rounded shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Log Bet</span>
            </button>
            <button
              id="btn-export-ledger-csv"
              onClick={handleExportCSV}
              disabled={userBets.length === 0}
              className="px-2.5 py-1.5 bg-[#172338] hover:bg-[#20304a] disabled:opacity-40 disabled:cursor-not-allowed text-cyan-300 border border-cyan-700/70 font-bold text-xs rounded transition-all flex items-center gap-1"
              title="Export all bets to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            {userBets.length > 0 && (
              <button
                id="btn-clear-all-bets"
                onClick={handleClearAllBets}
                className="px-2.5 py-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-xs font-semibold transition-all flex items-center gap-1"
                title="Clear all bets from ledger"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
            <button
              id="btn-load-sample-ledger"
              onClick={handleLoadSampleDemo}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded text-xs transition-all flex items-center gap-1"
              title="Load sample historical & active plays (Optional Demo)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Wagered */}
        <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Total Wagered</span>
          <p className="text-xl font-bold text-white">${stats.totalWageredDollars.toLocaleString()}</p>
          <span className="text-[10px] text-cyan-400 block font-bold">{stats.totalWageredUnits} units risked</span>
        </div>

        {/* Locked In Now */}
        <div className="p-3 bg-[#0d1e18] border border-emerald-800/60 rounded-lg space-y-1">
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block">Locked In Now</span>
          <p className="text-xl font-bold text-emerald-300">{stats.lockedNowBets}</p>
          <span className="text-[10px] text-emerald-400 block">Placed & Active</span>
        </div>

        {/* Waiting on Line */}
        <div className="p-3 bg-[#241c0e] border border-amber-800/60 rounded-lg space-y-1">
          <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold block">Waiting on Line</span>
          <p className="text-xl font-bold text-amber-300">{stats.waitingBets}</p>
          <span className="text-[10px] text-amber-400 block">Monitoring Steam</span>
        </div>

        {/* Net Profit & Loss */}
        <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Settled P&L</span>
          <p className={`text-xl font-bold ${stats.netPnlDollars >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.netPnlDollars >= 0 ? `+$${stats.netPnlDollars.toFixed(2)}` : `-$${Math.abs(stats.netPnlDollars).toFixed(2)}`}
          </p>
          <span className={`text-[10px] font-bold block ${stats.netPnlUnits >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.netPnlUnits >= 0 ? `+${stats.netPnlUnits}u` : `${stats.netPnlUnits}u`} ({stats.roiPct > 0 ? `+${stats.roiPct}%` : `${stats.roiPct}%`})
          </span>
        </div>

        {/* Win-Loss-Push Record */}
        <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Record (W-L-P)</span>
          <p className="text-xl font-bold text-cyan-300">{stats.wonBets}W - {stats.lostBets}L - {stats.pushBets}P</p>
          <span className="text-[10px] text-cyan-400 block">{stats.winRatePct}% Win Rate</span>
        </div>

        {/* Active Unit Size Setting */}
        <div className="p-3 bg-[#131e2e] border border-cyan-800/60 rounded-lg space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            <span>Unit Size</span>
            <span className="text-emerald-400">1.0u</span>
          </div>
          <p className="text-xl font-black text-emerald-300">${unitSize}.00</p>
          <div className="flex items-center gap-1 pt-0.5">
            {[10, 20, 25, 50, 100].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => onSetUnitSize && onSetUnitSize(u)}
                className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                  unitSize === u
                    ? 'bg-emerald-500 text-black'
                    : 'bg-[#18253b] text-slate-400 hover:text-white'
                }`}
              >
                ${u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-[#0d1424] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Week Selector */}
          <div className="flex items-center gap-1 bg-[#162035] px-2.5 py-1 rounded border border-slate-700">
            <span className="text-slate-400 text-[11px]">Week:</span>
            <select
              value={selectedWeek}
              onChange={(e) => onSelectWeek(e.target.value)}
              className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="All Weeks" className="bg-[#111827] text-white">All Weeks</option>
              <option value="Week 0" className="bg-[#111827] text-white">Week 0</option>
              <option value="Week 1" className="bg-[#111827] text-white">Week 1</option>
              <option value="Week 2" className="bg-[#111827] text-white">Week 2</option>
              <option value="Week 3" className="bg-[#111827] text-white">Week 3</option>
              <option value="Week 4" className="bg-[#111827] text-white">Week 4</option>
              <option value="Week 5" className="bg-[#111827] text-white">Week 5</option>
            </select>
          </div>

          {/* Timing & Result Filter */}
          <div className="flex items-center gap-1 bg-[#162035] px-2.5 py-1 rounded border border-slate-700">
            <span className="text-slate-400 text-[11px]">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-transparent text-emerald-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#111827] text-white">All Statuses</option>
              <option value="LOCKED_NOW" className="bg-[#111827] text-white">⚡ Locked In Now</option>
              <option value="WAITING_FOR_LINE" className="bg-[#111827] text-white">⏳ Waiting on Line</option>
              <option value="PENDING" className="bg-[#111827] text-white">Pending Games</option>
              <option value="WON" className="bg-[#111827] text-white">Won Bets</option>
              <option value="LOST" className="bg-[#111827] text-white">Lost Bets</option>
            </select>
          </div>

          {/* Ticket Type Filter */}
          <div className="flex items-center gap-1 bg-[#162035] px-2.5 py-1 rounded border border-slate-700">
            <span className="text-slate-400 text-[11px]">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-transparent text-purple-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#111827] text-white">All Types</option>
              <option value="straight" className="bg-[#111827] text-white">Straight Bets</option>
              <option value="parlay" className="bg-[#111827] text-white">Parlays</option>
              <option value="teaser" className="bg-[#111827] text-white">6-Pt Teasers</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search teams, bets, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#162035] border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Bets List */}
      <div className="space-y-3">
        {userBets.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-[#0a1120] border-2 border-dashed border-slate-800 rounded-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-950/50">
              <Clock className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">Your Bet Ledger is Clean & Empty</h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Nothing is preloaded automatically. Plays will only appear here when you add them from the <strong>2026 Model Slates</strong>, execute <strong>Parlay/Teaser combinations</strong>, or manually log custom tickets.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onBackToPicks && (
                <button
                  onClick={onBackToPicks}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Browse 2026 Model Picks</span>
                </button>
              )}
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Log Custom Bet</span>
              </button>
              <button
                onClick={handleLoadSampleDemo}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Load Sample Demo Data</span>
              </button>
            </div>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="p-8 text-center bg-[#0d1424] border border-slate-800 rounded-xl space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-slate-400 text-sm">No bets match your active filters ({filterStatus}, {filterType}, {searchQuery || 'No search'}).</p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => {
                  setFilterStatus('ALL');
                  setFilterType('ALL');
                  setSearchQuery('');
                  onSelectWeek('All Weeks');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-all"
              >
                Reset Filters
              </button>
              <button
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition-all"
              >
                Log New Bet
              </button>
            </div>
          </div>
        ) : (
          filteredBets.map((bet) => {
            const isLocked = bet.timingStatus === 'LOCKED_NOW';
            const isWaiting = bet.timingStatus === 'WAITING_FOR_LINE';

            // Split matchup into clickable team tokens if possible
            const matchupTokens = bet.matchup ? bet.matchup.split(/(\svs\s|\sat\s|\s\/\s|\s@\s)/i) : [];

            return (
              <div
                key={bet.id}
                id={`user-bet-card-${bet.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  bet.resultStatus === 'WON'
                    ? 'bg-[#0b1c14] border-emerald-600/70'
                    : bet.resultStatus === 'LOST'
                    ? 'bg-[#1c0e12] border-rose-600/70'
                    : isLocked
                    ? 'bg-[#0f172a] border-cyan-800/80 shadow-md'
                    : 'bg-[#181308] border-amber-700/70'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Main Selection & Details */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded">
                        {bet.week}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold rounded uppercase">
                        {bet.ticketType}
                      </span>
                      {bet.grade && (
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold rounded">
                          Grade {bet.grade}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-slate-900 text-cyan-300 border border-slate-700 text-[10px] font-bold rounded">
                        {bet.bookName}
                      </span>

                      {/* Timing Status Pill */}
                      {isLocked ? (
                        <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 rounded text-[10px] font-bold flex items-center gap-1 animate-pulse">
                          <Zap className="w-3 h-3 fill-emerald-400" />
                          ⚡ LOCKED IN NOW
                        </span>
                      ) : isWaiting ? (
                        <span className="px-2.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-500 rounded text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          ⏳ WAITING ON LINE ({bet.targetWaitLine || 'Monitor Steam'})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]">
                          {bet.timingStatus}
                        </span>
                      )}
                    </div>

                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <span>{bet.selection}</span>
                      <span className="text-cyan-400 font-mono text-sm">
                        ({bet.oddsAmerican > 0 ? `+${bet.oddsAmerican}` : bet.oddsAmerican})
                      </span>
                    </div>

                    {bet.matchup && (
                      <div className="text-xs text-slate-400 font-sans flex items-center flex-wrap gap-1.5">
                        <span>Matchup:</span>
                        <div className="inline-flex items-center flex-wrap gap-1">
                          {matchupTokens.length > 0 ? (
                            matchupTokens.map((token, idx) => {
                              const isDelim = /^\s*(vs|at|\/|@)\s*$/i.test(token);
                              if (isDelim) {
                                return <span key={idx} className="text-slate-500 font-normal">{token.trim()}</span>;
                              }
                              const cleanName = token.trim();
                              if (onOpenTeam && cleanName) {
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => onOpenTeam(cleanName)}
                                    className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold transition-colors"
                                  >
                                    {cleanName}
                                  </button>
                                );
                              }
                              return <span key={idx} className="text-slate-300">{cleanName}</span>;
                            })
                          ) : (
                            <span className="text-slate-300">{bet.matchup}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Parlay Sub-Legs Breakdown */}
                    {bet.legs && bet.legs.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>{bet.legs.length}-Leg Breakdown:</span>
                          <span className="text-rose-400 font-normal">
                            ({bet.legs.filter((l) => l.resultStatus === 'LOST').length} losses)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {bet.legs.map((leg, lIdx) => {
                            const isLegLost = leg.resultStatus === 'LOST';
                            const isLegWon = leg.resultStatus === 'WON';
                            return (
                              <div
                                key={lIdx}
                                className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
                                  isLegLost
                                    ? 'bg-[#180a0e] border-rose-600/60 text-rose-200'
                                    : isLegWon
                                    ? 'bg-[#08180e] border-emerald-600/60 text-emerald-200'
                                    : 'bg-[#0b1322] border-slate-700 text-slate-200'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-white">{leg.selection}</span>
                                  <span className="font-mono text-cyan-300 font-bold">
                                    {leg.oddsAmerican > 0 ? `+${leg.oddsAmerican}` : leg.oddsAmerican}
                                  </span>
                                </div>
                                {leg.scoreDetails && (
                                  <div className="mt-1 text-[10px] text-slate-400 font-sans">
                                    {leg.scoreDetails}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Timing Strategy Notes */}
                    {bet.timingNotes && (
                      <div className="p-2 bg-[#080d1a] rounded border border-slate-800 text-xs font-sans text-slate-300 leading-relaxed">
                        <strong className="text-cyan-400 font-mono">Strategy:</strong> {bet.timingNotes}
                      </div>
                    )}
                  </div>

                  {/* Right: Stakes, Payout, Result Buttons */}
                  <div className="flex flex-wrap lg:flex-col items-end justify-between lg:justify-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">
                        Stake: <span className="font-bold text-white">${bet.stakeDollars}</span> ({bet.stakeUnits}u)
                      </div>
                      <div className="text-xs text-emerald-400 font-bold">
                        Payout: ${bet.potentialPayoutDollars} (+${(bet.potentialPayoutDollars - bet.stakeDollars).toFixed(2)})
                      </div>
                    </div>

                    {/* Fast Status Toggles */}
                    <div className="flex items-center gap-1.5">
                      {isWaiting && (
                        <button
                          onClick={() => handleToggleTimingStatus(bet.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] rounded transition-all flex items-center gap-1 shadow-sm"
                          title="Line reached! Mark as placed/locked in"
                        >
                          <Zap className="w-3 h-3 fill-slate-950" />
                          <span>Lock It Now</span>
                        </button>
                      )}

                      {/* Result Buttons */}
                      <div className="flex items-center gap-1 bg-[#060a12] p-1 rounded-lg border border-slate-800">
                        <button
                          onClick={() => handleUpdateResult(bet.id, 'PENDING')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            bet.resultStatus === 'PENDING' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => handleUpdateResult(bet.id, 'WON')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            bet.resultStatus === 'WON' ? 'bg-emerald-600 text-black' : 'text-slate-500 hover:text-emerald-400'
                          }`}
                        >
                          Won ✅
                        </button>
                        <button
                          onClick={() => handleUpdateResult(bet.id, 'LOST')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            bet.resultStatus === 'LOST' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-rose-400'
                          }`}
                        >
                          Lost ❌
                        </button>
                        <button
                          onClick={() => handleUpdateResult(bet.id, 'PUSH')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            bet.resultStatus === 'PUSH' ? 'bg-amber-600 text-black' : 'text-slate-500 hover:text-amber-400'
                          }`}
                        >
                          Push 🤝
                        </button>
                      </div>

                      {/* Edit & Delete */}
                      <button
                        onClick={() => handleOpenEditModal(bet)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                        title="Edit Bet"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBet(bet.id)}
                        className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded"
                        title="Delete Bet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD / EDIT BET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div
            className="bg-[#0f172a] border-2 border-cyan-500/60 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 relative text-slate-200 font-sans animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                {editingBetId ? 'Edit Tracked Bet' : 'Log / Add Bet to Tracker'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Week */}
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Week</label>
                  <select
                    value={formWeek}
                    onChange={(e) => setFormWeek(e.target.value)}
                    className="w-full p-2 bg-[#1e293b] border border-slate-700 rounded text-white font-mono"
                  >
                    <option value="Week 0">Week 0</option>
                    <option value="Week 1">Week 1</option>
                    <option value="Week 2">Week 2</option>
                    <option value="Week 3">Week 3</option>
                    <option value="Week 4">Week 4</option>
                    <option value="Week 5">Week 5</option>
                  </select>
                </div>

                {/* Bet Type */}
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Bet Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2 bg-[#1e293b] border border-slate-700 rounded text-white font-mono"
                  >
                    <option value="straight">Straight Bet (Single)</option>
                    <option value="parlay">Parlay (Combo)</option>
                    <option value="teaser">6-Pt Teaser</option>
                  </select>
                </div>
              </div>

              {/* Selection */}
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Selection (e.g. Florida State -31.5)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Florida State -31.5 or Memphis +2.5"
                  value={formSelection}
                  onChange={(e) => setFormSelection(e.target.value)}
                  className="w-full p-2 bg-[#1e293b] border border-slate-700 rounded text-white font-bold"
                />
              </div>

              {/* Matchup */}
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Matchup (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Florida State vs New Mexico State"
                  value={formMatchup}
                  onChange={(e) => setFormMatchup(e.target.value)}
                  className="w-full p-2 bg-[#1e293b] border border-slate-700 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Sportsbook */}
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Sportsbook</label>
                  <select
                    value={formBook}
                    onChange={(e) => setFormBook(e.target.value)}
                    className="w-full p-2 bg-[#1e293b] border border-slate-700 rounded text-white font-mono"
                  >
                    <option value="DraftKings">DraftKings</option>
                    <option value="FanDuel">FanDuel</option>
                    <option value="theScore">theScore</option>
                    <option value="Caesars">Caesars</option>
                    <option value="BetRivers">BetRivers</option>
                    <option value="Other">Other Book</option>
                  </select>
                </div>

                {/* Odds */}
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Odds (American)</label>
                  <input
                    type="number"
                    value={formOdds}
                    onChange={(e) => setFormOdds(parseInt(e.target.value) || -110)}
                    className="w-full p-2 bg-[#1e293b] border border-slate-700 rounded text-white font-mono"
                  />
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Confidence Grade</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value as any)}
                    className="w-full p-2 bg-[#1e293b] border border-slate-700 rounded text-white font-mono"
                  >
                    <option value="A+">A+ (Mega Edge)</option>
                    <option value="A">A (High Edge)</option>
                    <option value="B+">B+ (Moderate)</option>
                    <option value="B">B (Action Play)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Stake Dollars */}
                <div>
                  <label className="block text-slate-400 mb-1 font-mono text-xs flex justify-between">
                    <span>Stake ($)</span>
                    <span className="text-cyan-400 font-bold">1u = ${unitSize}</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formStakeDollars}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormStakeDollars(val);
                      setFormStakeUnits(parseFloat((val / unitSize).toFixed(1)));
                    }}
                    className="w-full p-2 bg-[#1e293b] border border-slate-700 rounded text-white font-mono"
                  />
                </div>

                {/* Stake Units */}
                <div>
                  <label className="block text-slate-400 mb-1 font-mono text-xs flex justify-between">
                    <span>Stake (Units)</span>
                    <span className="text-emerald-400 font-bold">{formStakeUnits}u</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formStakeUnits}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormStakeUnits(val);
                      setFormStakeDollars(Math.round(val * unitSize));
                    }}
                    className="w-full p-2 bg-[#1e293b] border border-slate-700 rounded text-white font-mono"
                  />
                </div>
              </div>

              {/* Quick Unit Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-mono">Quick Units:</span>
                {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setFormStakeUnits(u);
                      setFormStakeDollars(Math.round(u * unitSize));
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      formStakeUnits === u
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-[#1e293b] text-slate-300 hover:bg-[#2d3748]'
                    }`}
                  >
                    {u}u (${Math.round(u * unitSize)})
                  </button>
                ))}
              </div>

              {/* Timing Status Selection */}
              <div className="p-3 bg-[#091120] border border-cyan-800/60 rounded-xl space-y-2">
                <label className="block text-cyan-300 font-bold font-mono">
                  In-Turn Timing Status (When to Place)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTimingStatus('LOCKED_NOW')}
                    className={`p-2 rounded text-xs font-bold text-center border transition-all ${
                      formTimingStatus === 'LOCKED_NOW'
                        ? 'bg-emerald-600 text-slate-950 border-emerald-400 shadow-md'
                        : 'bg-[#1e293b] text-slate-300 border-slate-700'
                    }`}
                  >
                    ⚡ Take Now (Locked In)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTimingStatus('WAITING_FOR_LINE')}
                    className={`p-2 rounded text-xs font-bold text-center border transition-all ${
                      formTimingStatus === 'WAITING_FOR_LINE'
                        ? 'bg-amber-600 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-[#1e293b] text-slate-300 border-slate-700'
                    }`}
                  >
                    ⏳ Wait on Line Movement
                  </button>
                </div>

                {formTimingStatus === 'WAITING_FOR_LINE' && (
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px] font-mono">Target Wait Line</label>
                    <input
                      type="text"
                      placeholder="e.g. Memphis +3.5 or +115 ML"
                      value={formTargetWaitLine}
                      onChange={(e) => setFormTargetWaitLine(e.target.value)}
                      className="w-full p-2 bg-[#1e293b] border border-slate-700 rounded text-amber-300 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Timing Strategy Notes */}
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Strategy / Timing Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Take FSU now on open; wait on Memphis until Saturday public steam"
                  value={formTimingNotes}
                  onChange={(e) => setFormTimingNotes(e.target.value)}
                  className="w-full p-2 bg-[#1e293b] border border-slate-700 rounded text-white"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-bold font-mono rounded shadow-lg"
                >
                  {editingBetId ? 'Update Bet' : 'Save & Log Bet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
