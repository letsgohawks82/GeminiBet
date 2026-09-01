import React, { useEffect } from 'react';
import { useApiRequest } from '../utils/useApiRequest';
import { LoadingButton } from './Shared/LoadingButton';
import { X, MessageSquare, AlertCircle, RefreshCw, StopCircle, Info, CheckCircle2, Clock } from 'lucide-react';
import { Pick2026 } from '../types';

interface AiMatchupModalProps {
  isOpen: boolean;
  onClose: () => void;
  pick: Pick2026 | null;
}

interface BreakdownResponse {
  analysis?: string;
  cached?: boolean;
  error?: string;
}

export const AiMatchupModal: React.FC<AiMatchupModalProps> = ({ isOpen, onClose, pick }) => {
  const { data, loading, error, retryAfterSec, execute, abort, reset } = useApiRequest<BreakdownResponse>();

  useEffect(() => {
    if (isOpen && pick) {
      reset();
      execute('/api/ai/game-breakdown', {
        matchData: {
          id: pick.id,
          favorite: pick.favorite,
          underdog: pick.underdog,
          week: pick.week,
          venue: pick.venue,
          marketSpread: pick.marketSpread,
          projectedSpread: pick.feiProjMargin,
        },
      });
    } else {
      reset();
    }
  }, [isOpen, pick, execute, reset]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !pick) return null;

  const handleRetry = () => {
    if (!pick) return;
    execute('/api/ai/game-breakdown', {
      matchData: {
        id: pick.id,
        favorite: pick.favorite,
        underdog: pick.underdog,
        week: pick.week,
        venue: pick.venue,
        marketSpread: pick.marketSpread,
        projectedSpread: pick.feiProjMargin,
      },
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 id="ai-modal-title" className="text-sm font-black text-white font-mono uppercase tracking-wider">
                Qualitative Matchup Commentary (Non-Signal)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {pick.favorite} vs {pick.underdog} • {pick.week}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explicit Non-Signal Mandate Banner */}
        <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-cyan-300">Non-Signal Policy: </strong>
            Gemini analysis provides qualitative situational context only (schemes, coaching, depth, injuries, and weather). It is strictly decoupled from quantitative pricing and <strong>NEVER</strong> determines bet selection, unit sizing, or portfolio risk.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-300 font-sans space-y-4 leading-relaxed">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono text-slate-400 animate-pulse">
                Fetching qualitative context from Gemini server proxy...
              </p>
              <button
                onClick={abort}
                className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/60 border border-rose-800 text-rose-300 font-mono text-[11px] hover:bg-rose-900/60"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Cancel Request</span>
              </button>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-mono font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Commentary Service Notice</span>
              </div>
              <p className="text-xs text-rose-200/90">{error}</p>
              {retryAfterSec && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono bg-amber-950/50 p-2 rounded border border-amber-800/50">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Rate limit reset in ~{retryAfterSec} seconds</span>
                </div>
              )}
              <div className="pt-2">
                <LoadingButton
                  onClick={handleRetry}
                  variant="danger"
                  size="sm"
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Retry Commentary with Backoff
                </LoadingButton>
              </div>
            </div>
          )}

          {!loading && !error && data?.analysis && (
            <div className="space-y-3 font-sans">
              <div className="whitespace-pre-line bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 text-[13px] leading-relaxed font-sans">
                {data.analysis}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Proxy-Secured • Server-Side API Only</span>
          </div>

          <div className="flex items-center gap-2">
            {!loading && (
              <LoadingButton
                onClick={handleRetry}
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Regenerate Context
              </LoadingButton>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-mono font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-md transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
