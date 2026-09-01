import React, { useState } from 'react';
import { TierRow } from '../types';
import { Layers, Copy, Check, FileSpreadsheet, ArrowUpDown, Flame, Zap, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface Props {
  allTiers?: Record<string, TierRow[]>;
  onSelectTierFilter?: (category: string, tierName: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onSelectTier?: (tier: TierRow) => void;
}

export const TierScreenerMatrix: React.FC<Props> = ({
  allTiers,
  onSelectTierFilter,
  onNavigateToTab,
  onSelectTier,
}) => {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('spreadEdge');
  const [sortField, setSortField] = useState<'atsWinPct' | 'atsRoi' | 'ouWinPct' | 'ouRoi' | 'games' | 'pe'>('atsWinPct');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copied, setCopied] = useState<string | null>(null);

  const tiers: Record<string, TierRow[]> = allTiers || {};
  const categories = [
    { key: 'spreadEdge', label: '🎯 Spread Discrepancy (Edge Size)', rows: tiers.spreadEdge || [] },
    { key: 'sideSplits', label: '⚖️ Favorite vs. Underdog Bias', rows: tiers.sideSplits || [] },
    { key: 'spreadMagnitude', label: '📏 Closing Spread Magnitude', rows: tiers.spreadMagnitude || [] },
    { key: 'totalEdge', label: '📊 Over / Under (Totals) Edge', rows: tiers.totalEdge || [] },
    { key: 'pwTiers', label: '🔮 Win Prob Confidence Tiers', rows: tiers.pwTiers || [] },
    { key: 'totalRanges', label: '⚡ Scoring Pace (Game Total Range)', rows: tiers.totalRanges || [] },
    { key: 'weekPhases', label: '⏱️ Season Schedule Phase', rows: tiers.weekPhases || [] },
    { key: 'years', label: '📅 Individual Seasons (2022–2026)', rows: tiers.years || [] },
  ];

  const currentCategory = categories.find(c => c.key === selectedCategoryKey) || categories[0];

  const sortedRows = [...currentCategory.rows].sort((a, b) => {
    let valA = 0;
    let valB = 0;
    if (sortField === 'atsWinPct') {
      valA = a.ats.winPctDecisive;
      valB = b.ats.winPctDecisive;
    } else if (sortField === 'atsRoi') {
      valA = a.ats.roi || 0;
      valB = b.ats.roi || 0;
    } else if (sortField === 'ouWinPct') {
      valA = a.ou.winPctDecisive;
      valB = b.ou.winPctDecisive;
    } else if (sortField === 'ouRoi') {
      valA = a.ou.roi || 0;
      valB = b.ou.roi || 0;
    } else if (sortField === 'games') {
      valA = a.totalGames;
      valB = b.totalGames;
    } else if (sortField === 'pe') {
      valA = a.avgPe;
      valB = b.avgPe;
    }

    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const handleSort = (field: 'atsWinPct' | 'atsRoi' | 'ouWinPct' | 'ouRoi' | 'games' | 'pe') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const copyToClipboard = (format: 'md' | 'csv') => {
    if (format === 'md') {
      let md = `### ${currentCategory.label} - Performance Matrix\n\n`;
      md += `| Criteria Tier | Games | ATS Record | ATS Win% | ATS ROI% | O/U Record | O/U Win% | O/U ROI% | Avg PE | Edge Rating |\n`;
      md += `|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
      for (const r of sortedRows) {
        md += `| ${r.name} | ${r.totalGames} | ${r.ats.wins}-${r.ats.losses}-${r.ats.pushes || 0} | ${r.ats.winPctDecisive.toFixed(1)}% | ${(r.ats.roi || 0).toFixed(1)}% | ${r.ou.wins}-${r.ou.losses}-${r.ou.pushes || 0} | ${r.ou.winPctDecisive.toFixed(1)}% | ${(r.ou.roi || 0).toFixed(1)}% | ${r.avgPe.toFixed(1)} pts | ${r.edgeRating.toUpperCase()} |\n`;
      }
      navigator.clipboard.writeText(md);
      setCopied('md');
      setTimeout(() => setCopied(null), 2000);
    } else {
      let csv = `Category,Tier Name,Total Games,ATS Wins,ATS Losses,ATS Pushes,ATS Win Pct,ATS ROI Pct,OU Wins,OU Losses,OU Pushes,OU Win Pct,OU ROI Pct,Avg PE,Edge Rating\n`;
      for (const r of sortedRows) {
        csv += `"${currentCategory.label}","${r.name}",${r.totalGames},${r.ats.wins},${r.ats.losses},${r.ats.pushes || 0},${r.ats.winPctDecisive},${r.ats.roi || 0},${r.ou.wins},${r.ou.losses},${r.ou.pushes || 0},${r.ou.winPctDecisive},${r.ou.roi || 0},${r.avgPe},"${r.edgeRating}"\n`;
      }
      navigator.clipboard.writeText(csv);
      setCopied('csv');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div id="tier-screener-matrix-container" className="bg-[#111827] border border-[#1e293b] rounded-xl shadow-lg overflow-hidden flex flex-col">
      {/* Matrix Header */}
      <div className="p-4 border-b border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              Multi-Dimensional Edge Criteria Matrix
              <span className="text-[10px] bg-[#1e293b] text-emerald-400 border border-[#334155] px-2 py-0.5 rounded font-mono">
                {currentCategory.rows.length} Tiers Evaluated
              </span>
            </h2>
            <p className="text-[11px] text-[#64748b] font-mono mt-0.5">
              Cut performance across line variance, point spread sizes, totals discrepancy, and confidence tiers
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => copyToClipboard('md')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-[#cbd5e1] bg-[#1e293b] border border-[#334155] rounded hover:bg-[#334155] transition-colors"
          >
            {copied === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#94a3b8]" />}
            {copied === 'md' ? 'Copied MD' : 'Copy Matrix MD'}
          </button>
          <button
            onClick={() => copyToClipboard('csv')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-[#cbd5e1] bg-[#1e293b] border border-[#334155] rounded hover:bg-[#334155] transition-colors"
          >
            {copied === 'csv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-[#94a3b8]" />}
            {copied === 'csv' ? 'Copied CSV' : 'Copy CSV'}
          </button>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="p-3 bg-[#0b0e14]/70 border-b border-[#1e293b] flex items-center gap-2 overflow-x-auto">
        {categories.map(c => {
          const isActive = c.key === selectedCategoryKey;
          return (
            <button
              key={c.key}
              onClick={() => setSelectedCategoryKey(c.key)}
              className={`px-3 py-1.5 text-xs font-mono font-semibold rounded whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-500 text-black shadow-md font-bold'
                  : 'bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#334155] border border-[#334155]'
              }`}
            >
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="bg-[#1e293b]/80 sticky top-0 border-b border-[#1e293b] text-[#94a3b8] uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Criteria Tier Definition</th>
              <th
                onClick={() => handleSort('games')}
                className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Sample</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('atsWinPct')}
                className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>ATS Win %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('atsRoi')}
                className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>ATS ROI (-110)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('ouWinPct')}
                className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>O/U Win %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('ouRoi')}
                className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>O/U ROI (-110)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('pe')}
                className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Avg PE</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-center">Edge Classification</th>
              <th className="px-3 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b] text-[#e2e8f0]">
            {sortedRows.map((row, idx) => {
              const atsRoi = row.ats.roi || 0;
              const ouRoi = row.ou.roi || 0;
              const isAtsProfitable = atsRoi > 0;
              const isOuProfitable = ouRoi > 0;

              return (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {row.name}
                    </div>
                    <div className="text-[10px] text-[#64748b] mt-0.5">{row.recommendation}</div>
                  </td>

                  <td className="px-3 py-3.5 text-center text-[#cbd5e1]">
                    <span className="bg-[#1e293b] border border-[#334155] px-2 py-0.5 rounded text-white font-bold">
                      {row.totalGames}
                    </span>
                  </td>

                  {/* ATS Win % */}
                  <td className="px-3 py-3.5 text-right">
                    <div className={`font-bold text-sm ${row.ats.winPctDecisive >= 52.4 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {row.ats.winPctDecisive.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      {row.ats.wins}W-{row.ats.losses}L-{row.ats.pushes || 0}P
                    </div>
                  </td>

                  {/* ATS ROI */}
                  <td className="px-3 py-3.5 text-right">
                    <span className={`inline-block px-1.5 py-0.5 rounded font-bold ${
                      atsRoi >= 5.0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isAtsProfitable
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {atsRoi >= 0 ? `+${atsRoi.toFixed(1)}%` : `${atsRoi.toFixed(1)}%`}
                    </span>
                  </td>

                  {/* O/U Win % */}
                  <td className="px-3 py-3.5 text-right">
                    <div className={`font-bold text-sm ${row.ou.winPctDecisive >= 52.4 ? 'text-blue-400' : 'text-slate-300'}`}>
                      {row.ou.winPctDecisive.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      {row.ou.wins}W-{row.ou.losses}L-{row.ou.pushes || 0}P
                    </div>
                  </td>

                  {/* O/U ROI */}
                  <td className="px-3 py-3.5 text-right">
                    <span className={`inline-block px-1.5 py-0.5 rounded font-bold ${
                      ouRoi >= 4.0
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : isOuProfitable
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {ouRoi >= 0 ? `+${ouRoi.toFixed(1)}%` : `${ouRoi.toFixed(1)}%`}
                    </span>
                  </td>

                  {/* Avg PE */}
                  <td className="px-3 py-3.5 text-right text-orange-300 font-bold">
                    {row.avgPe.toFixed(1)} pts
                  </td>

                  {/* Edge classification badge */}
                  <td className="px-4 py-3.5 text-center">
                    {row.edgeRating === 'elite' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Flame className="w-3 h-3" />
                        ELITE EDGE
                      </span>
                    ) : row.edgeRating === 'strong' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Zap className="w-3 h-3" />
                        PROFITABLE
                      </span>
                    ) : row.edgeRating === 'avoid' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <ShieldAlert className="w-3 h-3" />
                        FADE / AVOID
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#1e293b] text-[#94a3b8]">
                        MARKET EFFICIENT
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-3 py-3.5 text-center">
                    {onSelectTierFilter && (
                      <button
                        onClick={() => onSelectTierFilter(currentCategory.label, row.name)}
                        className="p-1.5 rounded bg-[#1e293b] hover:bg-emerald-500 hover:text-black text-[#94a3b8] transition-colors"
                        title="Load into Backtest Workbench"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-[#0b0e14]/60 border-t border-[#1e293b] text-[11px] font-mono text-[#64748b] flex flex-col sm:flex-row justify-between gap-2">
        <span>
          * Standard -110 juice calculation (break-even win rate is <strong>52.38%</strong>).
        </span>
        <span>
          Tip: Click any column header to sort tiers by Win Rate or ROI %.
        </span>
      </div>
    </div>
  );
};
