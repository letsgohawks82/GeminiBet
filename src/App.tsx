// src/App.tsx
import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { feiData } from './data/feiData';
import { allGamesData } from './data/allGamesData';
import { picks2026Data } from './data/picks2026Data';
import {
  Pick2026,
  BetSlipLeg,
  CuratedParlayPick,
  CuratedTeaserPick,
  ModelHyperparameters,
  UserLoggedBet,
  DetailedGame,
} from './types';
import { DEFAULT_HYPERPARAMETERS } from './utils/modelOptimizerEngine';
import { generateAllTiers, getTopActionableEdges } from './utils/bettingAnalytics';
import { loadUserBets, saveUserBets } from './utils/betLedgerStorage';
import { Layout } from './components/Layout';
import { CompactBetSlip } from './components/CompactBetSlip';
import { ExecutionHub } from './pages/ExecutionHub';
import { LiveOddsProvider } from './context/LiveOddsContext';
import { TeamProfileModal } from './components/TeamProfileModal';
import { GameDetailModal } from './components/GameDetailModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import {
  PicksSkeleton,
  LedgerSkeleton,
  OptimizerSkeleton,
  RetrainSkeleton,
  GenericSectionSkeleton,
} from './components/Skeletons';

// Lazy-loaded secondary hubs for optimal bundle code-splitting
const BetLedger = lazy(() =>
  import('./components/BetLedger').then((m) => ({ default: m.BetLedger }))
);
const SlatePortfolioOptimizer = lazy(() =>
  import('./components/SlatePortfolioOptimizer').then((m) => ({ default: m.SlatePortfolioOptimizer }))
);
const WinTotalPoolAnalyzer = lazy(() =>
  import('./components/WinTotalPoolAnalyzer').then((m) => ({ default: m.WinTotalPoolAnalyzer }))
);
const AutoRetrainWorkbench = lazy(() =>
  import('./components/AutoRetrainWorkbench').then((m) => ({ default: m.AutoRetrainWorkbench }))
);
const BacktestWorkbench = lazy(() =>
  import('./components/BacktestWorkbench').then((m) => ({ default: m.BacktestWorkbench }))
);
const TierScreenerMatrix = lazy(() =>
  import('./components/TierScreenerMatrix').then((m) => ({ default: m.TierScreenerMatrix }))
);
const SeasonExplorer = lazy(() =>
  import('./components/SeasonExplorer').then((m) => ({ default: m.SeasonExplorer }))
);
const SummaryTable = lazy(() =>
  import('./components/SummaryTable').then((m) => ({ default: m.SummaryTable }))
);
const BeginnerGuideModal = lazy(() =>
  import('./components/BeginnerGuideModal').then((m) => ({ default: m.BeginnerGuideModal }))
);

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('optimizer');
  const [activeHyperparameters, setActiveHyperparameters] = useState<ModelHyperparameters>(DEFAULT_HYPERPARAMETERS);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [userBets, setUserBets] = useState<UserLoggedBet[]>(() => loadUserBets());
  const [slipLegs, setSlipLegs] = useState<BetSlipLeg[]>([]);

  // Team & Game Drill-down State
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
  const [selectedGame2026, setSelectedGame2026] = useState<Pick2026 | null>(null);
  const [selectedGameHistorical, setSelectedGameHistorical] = useState<DetailedGame | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // Global Keyboard Shortcuts (⌘K, Ctrl+K, / to open search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // User unit size preferences
  const [unitSize, setUnitSizeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cfb_fei_user_unit_size_v1');
      return saved ? JSON.parse(saved) : 20;
    } catch {
      return 20;
    }
  });

  const setUnitSize = (val: number) => {
    setUnitSizeState(val);
    try {
      localStorage.setItem('cfb_fei_user_unit_size_v1', JSON.stringify(val));
    } catch (e) {
      console.warn('Could not save unit size', e);
    }
  };

  // Configurable Bankroll (25-50-75-100u)
  const [bankrollUnits, setBankrollUnitsState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cfb_fei_bankroll_units_v1');
      return saved ? JSON.parse(saved) : 100;
    } catch {
      return 100;
    }
  });

  const setBankrollUnits = (val: number) => {
    setBankrollUnitsState(val);
    try {
      localStorage.setItem('cfb_fei_bankroll_units_v1', JSON.stringify(val));
    } catch (e) {
      console.warn('Could not save bankroll units', e);
    }
  };

  const handleUpdateBets = (newBets: UserLoggedBet[]) => {
    setUserBets(newBets);
    saveUserBets(newBets);
  };

  // Toggle single pick in/out of bet slip
  const handleToggleSlipLeg = (pick: Pick2026) => {
    setSlipLegs((prev) => {
      const existing = prev.find((l) => l.gameId === pick.id);
      if (existing) {
        return prev.filter((l) => l.gameId !== pick.id);
      }
      const newLeg: BetSlipLeg = {
        id: `leg_${pick.id}_${Date.now()}`,
        gameId: pick.id,
        matchup: `${pick.favorite} vs ${pick.underdog}`,
        betType: pick.recommendedBetSide.toLowerCase().includes('total') ? 'total' : 'spread',
        selection: pick.recommendedBetText,
        line: `${pick.marketSpread}`,
        odds: pick.bestBook?.odds || -110,
        modelEdge: pick.spreadEdgeAbs,
        winProb: pick.feiWinProb,
        ev: pick.expectedValue,
        stakeDollars: Math.round(pick.units * unitSize),
        kellyUnits: pick.units,
        bestBookName: pick.bestBook?.bookName || 'DraftKings',
        bestBookLine: pick.bestBook?.line,
        bestBookOdds: pick.bestBook?.odds,
        directUrl: pick.bestBook?.directUrl,
      };
      return [...prev, newLeg];
    });
  };

  const handleRemoveLeg = (id: string) => {
    setSlipLegs((prev) => prev.filter((l) => l.id !== id));
  };

  const handleClearSlip = () => {
    setSlipLegs([]);
  };

  const handleAddParlayToSlip = (parlay: CuratedParlayPick) => {
    const newLegs: BetSlipLeg[] = parlay.legs.map((leg, idx) => ({
      id: `parlay_leg_${parlay.id}_${idx}_${Date.now()}`,
      gameId: leg.gameId,
      matchup: leg.matchup,
      betType: 'spread',
      selection: leg.selection,
      line: '0',
      odds: -110,
      modelEdge: leg.modelEdge,
      winProb: leg.winProb,
      ev: parlay.expectedValue,
      stakeDollars: Math.round(parlay.suggestedUnit * unitSize),
      kellyUnits: parlay.suggestedUnit,
      bestBookName: 'DraftKings',
    }));

    setSlipLegs((prev) => {
      const existingGameIds = new Set(prev.map((l) => l.gameId));
      const filtered = newLegs.filter((l) => !existingGameIds.has(l.gameId));
      return [...prev, ...filtered];
    });
  };

  const handleAddTeaserToSlip = (teaser: CuratedTeaserPick) => {
    const newLegs: BetSlipLeg[] = teaser.legs.map((leg, idx) => ({
      id: `teaser_leg_${teaser.id}_${idx}_${Date.now()}`,
      gameId: leg.gameId,
      matchup: leg.matchup,
      betType: 'spread',
      selection: `${leg.teasedLine} (${leg.keyNumbersCrossed})`,
      line: '0',
      odds: -120,
      modelEdge: 4.5,
      winProb: 0.74,
      ev: teaser.expectedValue,
      stakeDollars: Math.round(teaser.suggestedUnit * unitSize),
      kellyUnits: teaser.suggestedUnit,
      bestBookName: 'DraftKings',
    }));

    setSlipLegs((prev) => {
      const existingGameIds = new Set(prev.map((l) => l.gameId));
      const filtered = newLegs.filter((l) => !existingGameIds.has(l.gameId));
      return [...prev, ...filtered];
    });
  };

  // Open team drilldown
  const handleOpenTeam = (teamName: string) => {
    setSelectedTeamName(teamName);
  };

  // Open 2026 game details
  const handleOpenGame2026 = (pick: Pick2026) => {
    setSelectedGame2026(pick);
    setSelectedGameHistorical(null);
  };

  // Open historical game details
  const handleOpenGameHistorical = (game: DetailedGame) => {
    setSelectedGameHistorical(game);
    setSelectedGame2026(null);
  };

  // Right Rail component (Compact Bet Slip)
  const allTiers = useMemo(() => generateAllTiers(allGamesData), []);

  const rightRailComponent = (
    <CompactBetSlip
      legs={slipLegs}
      onRemoveLeg={handleRemoveLeg}
      onClearSlip={handleClearSlip}
      onLogBetsToLedger={(loggedBets) => {
        const combined = [...loggedBets, ...userBets];
        handleUpdateBets(combined);
      }}
      unitSize={unitSize}
      onNavigateToLedger={() => setActiveTab('betLedger')}
      onOpenTeam={handleOpenTeam}
    />
  );

  const slipGameIds = useMemo(() => new Set(slipLegs.map((l) => l.gameId)), [slipLegs]);

  return (
    <LiveOddsProvider>
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unitSize={unitSize}
        onSetUnitSize={setUnitSize}
        bankrollUnits={bankrollUnits}
        onSetBankrollUnits={setBankrollUnits}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        slipCount={slipLegs.length}
        rightRail={activeTab === 'optimizer' ? rightRailComponent : undefined}
      >
        {/* Tab Content Routing */}
        {(activeTab === 'optimizer' || activeTab === 'picks2026') && (
          <Suspense fallback={<OptimizerSkeleton />}>
            <SlatePortfolioOptimizer
              userBets={userBets}
              onUpdateBets={handleUpdateBets}
              onNavigateToLedger={() => setActiveTab('betLedger')}
              onLoadTicketToSlip={(legs) => {
                setSlipLegs(legs);
              }}
              unitSize={unitSize}
              onSetUnitSize={setUnitSize}
              bankrollUnits={bankrollUnits}
              onSetBankrollUnits={setBankrollUnits}
            />
          </Suspense>
        )}

        {activeTab === 'winTotalPool' && (
          <Suspense fallback={<GenericSectionSkeleton />}>
            <WinTotalPoolAnalyzer onOpenTeam={handleOpenTeam} />
          </Suspense>
        )}

        {activeTab === 'betLedger' && (
          <Suspense fallback={<LedgerSkeleton />}>
            <BetLedger
              userBets={userBets}
              onUpdateBets={handleUpdateBets}
              onBackToPicks={() => setActiveTab('optimizer')}
              unitSize={unitSize}
              onSetUnitSize={setUnitSize}
              bankrollUnits={bankrollUnits}
              onOpenTeam={handleOpenTeam}
            />
          </Suspense>
        )}

        {activeTab === 'backtest' && (
          <Suspense fallback={<GenericSectionSkeleton />}>
            <div className="space-y-6">
              <BacktestWorkbench games={allGamesData} allGames={allGamesData} />
              <TierScreenerMatrix
                allTiers={allTiers}
                onSelectTier={() => {}}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
              <SeasonExplorer
                seasons={feiData.seasons}
                feiData={feiData}
                onOpenTeam={handleOpenTeam}
                onOpenGame={handleOpenGameHistorical}
              />
              <SummaryTable seasons={feiData.seasons} overall={feiData.overall} feiData={feiData} />
            </div>
          </Suspense>
        )}

        {activeTab === 'retrain' && (
          <Suspense fallback={<RetrainSkeleton />}>
            <AutoRetrainWorkbench
              activeHyperparameters={activeHyperparameters}
              userBets={userBets}
              onOpenTeam={handleOpenTeam}
              onApplyHyperparameters={(params) => {
                setActiveHyperparameters(params);
                setActiveTab('optimizer');
              }}
            />
          </Suspense>
        )}

        {/* Global Search Modal (⌘K) */}
        <GlobalSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onSelectTeam={handleOpenTeam}
          onSelectGame2026={handleOpenGame2026}
          onSelectGameHistorical={handleOpenGameHistorical}
          picks2026={picks2026Data}
        />

        {/* Team Profile Drill-down Modal */}
        <TeamProfileModal
          teamName={selectedTeamName}
          isOpen={!!selectedTeamName}
          onClose={() => setSelectedTeamName(null)}
          onSelectTeam={handleOpenTeam}
          onSelectGame2026={handleOpenGame2026}
          onSelectGameHistorical={handleOpenGameHistorical}
          onToggleSlipLeg={handleToggleSlipLeg}
          slipGameIds={slipGameIds}
          unitSize={unitSize}
          allGames={allGamesData}
        />

        {/* Game Detail Modal (2026 & Historical) */}
        <GameDetailModal
          isOpen={!!selectedGame2026 || !!selectedGameHistorical}
          game2026={selectedGame2026}
          gameHistorical={selectedGameHistorical}
          onClose={() => {
            setSelectedGame2026(null);
            setSelectedGameHistorical(null);
          }}
          onSelectTeam={handleOpenTeam}
          onToggleSlipLeg={handleToggleSlipLeg}
          isInSlip={selectedGame2026 ? slipGameIds.has(selectedGame2026.id) : false}
          unitSize={unitSize}
        />

        {/* Beginner Guide Modal */}
        {isGuideOpen && (
          <Suspense fallback={null}>
            <BeginnerGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
          </Suspense>
        )}
      </Layout>
    </LiveOddsProvider>
  );
}

