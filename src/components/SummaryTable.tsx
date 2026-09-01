import React, { useState } from 'react';
import { SeasonStat, OverallSummary } from '../types';
import { Copy, Check, Table, FileSpreadsheet, ArrowUpDown } from 'lucide-react';

interface Props {
  seasons?: SeasonStat[];
  overall?: OverallSummary;
  feiData?: { seasons: SeasonStat[]; overall: OverallSummary };
}

export const SummaryTable: React.FC<Props> = ({ seasons, overall, feiData }) => {
  const [includePushesInPct, setIncludePushesInPct] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);

  const seasonList = seasons || feiData?.seasons || [];
  const overallSummary = overall || feiData?.overall || {
    totalGames: 0,
    su: { wins: 0, losses: 0, winPctTotal: 0, winPctDecisive: 0 },
    ats: { wins: 0, losses: 0, pushes: 0, winPctTotal: 0, winPctDecisive: 0 },
    ou: { wins: 0, losses: 0, pushes: 0, winPctTotal: 0, winPctDecisive: 0 },
    avgPe: 0,
  };

  const getMarkdown = () => {
    let md = `| Season | Total Games | Straight Up (SU) Win% (Record) | Against the Spread (ATS) Win% (Record) | Over/Under (O/U) Win% (Record) | Average Projection Error (PE) |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    
    seasonList.forEach(s => {
      const suPct = (includePushesInPct ? s.su.winPctTotal : s.su.winPctDecisive).toFixed(2);
      const atsPct = (includePushesInPct ? s.ats.winPctTotal : s.ats.winPctDecisive).toFixed(2);
      const ouPct = (includePushesInPct ? s.ou.winPctTotal : s.ou.winPctDecisive).toFixed(2);
      md += `| **${s.year}** | ${s.totalGames} | ${suPct}% (${s.su.wins}-${s.su.losses}) | ${atsPct}% (${s.ats.wins}-${s.ats.losses}-${s.ats.pushes || 0}) | ${ouPct}% (${s.ou.wins}-${s.ou.losses}-${s.ou.pushes || 0}) | ${s.avgPe.toFixed(2)} pts |\n`;
    });

    const ovSuPct = (includePushesInPct ? overallSummary.su.winPctTotal : overallSummary.su.winPctDecisive).toFixed(2);
    const ovAtsPct = (includePushesInPct ? overallSummary.ats.winPctTotal : overallSummary.ats.winPctDecisive).toFixed(2);
    const ovOuPct = (includePushesInPct ? overallSummary.ou.winPctTotal : overallSummary.ou.winPctDecisive).toFixed(2);
    
    md += `| **Historical Average / Total** | **${overallSummary.totalGames}** | **${ovSuPct}%** (${overallSummary.su.wins}-${overallSummary.su.losses}) | **${ovAtsPct}%** (${overallSummary.ats.wins}-${overallSummary.ats.losses}-${overallSummary.ats.pushes || 0}) | **${ovOuPct}%** (${overallSummary.ou.wins}-${overallSummary.ou.losses}-${overallSummary.ou.pushes || 0}) | **${overallSummary.avgPe.toFixed(2)} pts** |\n`;
    return md;
  };

  const copyToClipboard = (type: 'md' | 'csv') => {
    if (type === 'md') {
      navigator.clipboard.writeText(getMarkdown());
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } else {
      let csv = `Season,Total Games,SU Wins,SU Losses,SU Win Pct,ATS Wins,ATS Losses,ATS Pushes,ATS Win Pct,OU Wins,OU Losses,OU Pushes,OU Win Pct,Avg PE\n`;
      seasonList.forEach(s => {
        csv += `${s.year},${s.totalGames},${s.su.wins},${s.su.losses},${s.su.winPctDecisive.toFixed(2)}%,${s.ats.wins},${s.ats.losses},${s.ats.pushes || 0},${s.ats.winPctDecisive.toFixed(2)}%,${s.ou.wins},${s.ou.losses},${s.ou.pushes || 0},${s.ou.winPctDecisive.toFixed(2)}%,${s.avgPe.toFixed(2)}\n`;
      });
      csv += `Historical Total / Avg,${overallSummary.totalGames},${overallSummary.su.wins},${overallSummary.su.losses},${overallSummary.su.winPctDecisive.toFixed(2)}%,${overallSummary.ats.wins},${overallSummary.ats.losses},${overallSummary.ats.pushes || 0},${overallSummary.ats.winPctDecisive.toFixed(2)}%,${overallSummary.ou.wins},${overallSummary.ou.losses},${overallSummary.ou.pushes || 0},${overallSummary.ou.winPctDecisive.toFixed(2)}%,${overallSummary.avgPe.toFixed(2)}\n`;
      navigator.clipboard.writeText(csv);
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2000);
    }
  };

  return (
    <div id="fei-summary-table-container" className="bg-[#111827] border border-[#1e293b] rounded-xl shadow-lg overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-[#e2e8f0] uppercase tracking-widest flex items-center gap-2">
              Year-over-Year Comparative Matrix
              <span className="text-[10px] bg-[#1e293b] text-[#94a3b8] px-2 py-0.5 rounded border border-[#334155] font-mono normal-case">
                Archive 2022–2026
              </span>
            </h2>
            <p className="text-[11px] text-[#64748b] mt-0.5">
              Aggregated projections performance breakdown across all archived FBS seasons on bcftoys.com
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            id="toggle-win-pct-mode"
            onClick={() => setIncludePushesInPct(!includePushesInPct)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#cbd5e1] bg-[#1e293b] border border-[#334155] rounded hover:bg-[#334155] transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#94a3b8]" />
            {includePushesInPct ? 'Win% (Inc. Pushes)' : 'Win% (Excl. Pushes)'}
          </button>

          <button
            id="copy-markdown-btn"
            onClick={() => copyToClipboard('md')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#cbd5e1] bg-[#1e293b] border border-[#334155] rounded hover:bg-[#334155] transition-colors"
          >
            {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#94a3b8]" />}
            {copiedMd ? 'Copied MD' : 'Copy Markdown'}
          </button>

          <button
            id="copy-csv-btn"
            onClick={() => copyToClipboard('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#cbd5e1] bg-[#1e293b] border border-[#334155] rounded hover:bg-[#334155] transition-colors"
          >
            {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-[#94a3b8]" />}
            {copiedCsv ? 'Copied CSV' : 'Copy CSV'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table id="fei-historical-metrics-table" className="w-full text-left border-collapse text-sm font-mono">
          <thead className="bg-[#1e293b]/70 sticky top-0">
            <tr className="text-[#94a3b8] text-[11px] uppercase tracking-wider">
              <th className="px-6 py-3.5 font-bold border-b border-[#1e293b]">Season Year</th>
              <th className="px-6 py-3.5 text-center font-bold border-b border-[#1e293b]">Total Games</th>
              <th className="px-6 py-3.5 text-right font-bold border-b border-[#1e293b]">Straight Up (SU)</th>
              <th className="px-6 py-3.5 text-right font-bold border-b border-[#1e293b]">Against Spread (ATS)</th>
              <th className="px-6 py-3.5 text-right font-bold border-b border-[#1e293b]">Over/Under (O/U)</th>
              <th className="px-6 py-3.5 text-right font-bold border-b border-[#1e293b]">Avg. Proj. Error (PE)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b] text-[#e2e8f0]">
            {seasons.map((season) => {
              const suPct = includePushesInPct ? season.su.winPctTotal : season.su.winPctDecisive;
              const atsPct = includePushesInPct ? season.ats.winPctTotal : season.ats.winPctDecisive;
              const ouPct = includePushesInPct ? season.ou.winPctTotal : season.ou.winPctDecisive;

              return (
                <tr
                  key={season.year}
                  className="border-b border-[#1e293b] hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold text-white">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#1e293b] border border-[#334155] text-emerald-400 font-mono text-xs">
                      {season.year}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-[#cbd5e1]">
                    {season.totalGames.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-emerald-400">
                      {suPct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-[#64748b] ml-2">
                      ({season.su.wins}-{season.su.losses})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${atsPct >= 50 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {atsPct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-[#64748b] ml-2">
                      ({season.ats.wins}-{season.ats.losses}-{season.ats.pushes || 0})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${ouPct >= 50 ? 'text-blue-400' : 'text-slate-300'}`}>
                      {ouPct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-[#64748b] ml-2">
                      ({season.ou.wins}-{season.ou.losses}-{season.ou.pushes || 0})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-orange-300 font-bold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded text-xs">
                      {season.avgPe.toFixed(2)} pts
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#1e293b]/40 border-t-2 border-[#334155] font-bold">
              <td className="px-6 py-4 text-white uppercase tracking-wider font-bold">
                Historical Avg.
              </td>
              <td className="px-6 py-4 text-center text-white">
                {overall.totalGames.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-emerald-400 underline decoration-2 underline-offset-4 font-bold">
                  {(includePushesInPct ? overall.su.winPctTotal : overall.su.winPctDecisive).toFixed(1)}%
                </span>
                <span className="text-xs text-[#64748b] ml-2">
                  ({overall.su.wins}-{overall.su.losses})
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-emerald-400 underline decoration-2 underline-offset-4 font-bold">
                  {(includePushesInPct ? overall.ats.winPctTotal : overall.ats.winPctDecisive).toFixed(1)}%
                </span>
                <span className="text-xs text-[#64748b] ml-2">
                  ({overall.ats.wins}-{overall.ats.losses}-{overall.ats.pushes || 0})
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-blue-400 underline decoration-2 underline-offset-4 font-bold">
                  {(includePushesInPct ? overall.ou.winPctTotal : overall.ou.winPctDecisive).toFixed(1)}%
                </span>
                <span className="text-xs text-[#64748b] ml-2">
                  ({overall.ou.wins}-{overall.ou.losses}-{overall.ou.pushes || 0})
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-orange-400 underline decoration-2 underline-offset-4 font-bold">
                  {overall.avgPe.toFixed(2)} pts
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="p-3 bg-[#0b0e14]/60 border-t border-[#1e293b] text-[11px] text-[#64748b] flex flex-col sm:flex-row justify-between gap-2">
        <span>
          * <strong>Decisive Win %</strong> calculates <code className="bg-[#1e293b] text-[#94a3b8] px-1 py-0.5 rounded border border-[#334155]">Wins / (Wins + Losses)</code>, standard in sports analytics.
        </span>
        <span>
          Data source: <a href="https://www.bcftoys.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-medium">bcftoys.com</a> Game Projections Archive
        </span>
      </div>
    </div>
  );
};
