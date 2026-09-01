import React from 'react';

/**
 * High-Density Dark Theme Skeletons to prevent layout shifts (CLS)
 * during code-splitting and async data fetching.
 */

export const PicksSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-[#0d121c] border border-[#1b263b] rounded-xl p-5 space-y-4 animate-pulse min-h-[480px]">
      {/* Top Controls Bar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1b263b]">
        <div className="flex items-center gap-2">
          <div className="w-24 h-7 bg-[#1c273c] rounded"></div>
          <div className="w-28 h-7 bg-[#1c273c] rounded"></div>
          <div className="w-32 h-7 bg-[#1c273c] rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-7 bg-[#1c273c] rounded"></div>
          <div className="w-36 h-7 bg-[#1c273c] rounded"></div>
        </div>
      </div>

      {/* Hero / HUD Banner Skeleton */}
      <div className="w-full h-24 bg-gradient-to-r from-[#141d2d] to-[#101826] border border-[#22334d] rounded-lg p-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-48 h-4 bg-[#1f2d44] rounded"></div>
          <div className="w-72 h-3 bg-[#172235] rounded"></div>
        </div>
        <div className="flex gap-3">
          <div className="w-20 h-10 bg-[#1f2d44] rounded"></div>
          <div className="w-24 h-10 bg-[#1f2d44] rounded"></div>
        </div>
      </div>

      {/* Grid of Picks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-44 bg-[#111827] border border-[#1f2d42] rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="w-20 h-3 bg-[#1e2c40] rounded"></div>
              <div className="w-12 h-4 bg-[#1e2c40] rounded-full"></div>
            </div>
            <div className="space-y-1.5">
              <div className="w-36 h-5 bg-[#25364e] rounded"></div>
              <div className="w-24 h-4 bg-[#1b273a] rounded"></div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#1a2538]">
              <div className="w-16 h-4 bg-[#1e2c40] rounded"></div>
              <div className="w-20 h-6 bg-[#25364e] rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LedgerSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-[#0d121c] border border-[#1b263b] rounded-xl p-5 space-y-4 animate-pulse min-h-[420px]">
      <div className="flex justify-between items-center pb-3 border-b border-[#1b263b]">
        <div className="w-40 h-6 bg-[#1c273c] rounded"></div>
        <div className="w-32 h-7 bg-[#1c273c] rounded"></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-[#111827] border border-[#1e293b] rounded-lg p-3 space-y-2">
            <div className="w-16 h-3 bg-[#1e2c40] rounded"></div>
            <div className="w-24 h-5 bg-[#25364e] rounded"></div>
          </div>
        ))}
      </div>
      <div className="w-full h-56 bg-[#111827] border border-[#1e293b] rounded-lg"></div>
    </div>
  );
};

export const OptimizerSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-[#0d121c] border border-[#1b263b] rounded-xl p-5 space-y-4 animate-pulse min-h-[460px]">
      <div className="flex justify-between items-center pb-3 border-b border-[#1b263b]">
        <div className="w-56 h-6 bg-[#1c273c] rounded"></div>
        <div className="w-28 h-7 bg-[#1c273c] rounded"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-64 bg-[#111827] border border-[#1e293b] rounded-lg p-4 space-y-3">
          <div className="w-24 h-4 bg-[#1e2c40] rounded"></div>
          <div className="w-full h-12 bg-[#172235] rounded"></div>
          <div className="w-full h-24 bg-[#172235] rounded"></div>
        </div>
        <div className="md:col-span-2 h-64 bg-[#111827] border border-[#1e293b] rounded-lg p-4 space-y-3">
          <div className="w-32 h-4 bg-[#1e2c40] rounded"></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-20 bg-[#172235] rounded"></div>
            <div className="h-20 bg-[#172235] rounded"></div>
          </div>
          <div className="w-full h-16 bg-[#172235] rounded"></div>
        </div>
      </div>
    </div>
  );
};

export const RetrainSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-[#0d121c] border border-[#1b263b] rounded-xl p-5 space-y-4 animate-pulse min-h-[440px]">
      <div className="flex justify-between items-center pb-3 border-b border-[#1b263b]">
        <div className="w-64 h-6 bg-[#1c273c] rounded"></div>
        <div className="w-36 h-7 bg-[#1c273c] rounded"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 bg-[#111827] border border-[#1e293b] rounded-lg p-4 space-y-3">
          <div className="w-32 h-4 bg-[#1e2c40] rounded"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 bg-[#172235] rounded"></div>
            ))}
          </div>
        </div>
        <div className="h-72 bg-[#111827] border border-[#1e293b] rounded-lg p-4 space-y-3">
          <div className="w-40 h-4 bg-[#1e2c40] rounded"></div>
          <div className="w-full h-52 bg-[#172235] rounded"></div>
        </div>
      </div>
    </div>
  );
};

export const GenericSectionSkeleton: React.FC<{ title?: string; height?: string }> = ({
  title = 'Loading Section...',
  height = 'h-64',
}) => {
  return (
    <div
      className={`w-full bg-[#0d121c] border border-[#1b263b] rounded-xl p-5 space-y-3 animate-pulse ${height} flex flex-col justify-between`}
    >
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-cyan-500/20"></div>
        <span className="text-xs font-mono text-slate-500">{title}</span>
      </div>
      <div className="flex-1 w-full bg-[#111827]/80 border border-[#192436] rounded-lg flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
          <div className="w-3.5 h-3.5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Rendering module...</span>
        </div>
      </div>
    </div>
  );
};
