// src/utils/timing.ts

export type TimingStatus =
  | 'POST_KICKOFF'
  | 'TAKE_NOW'
  | 'SURVEY'
  | 'WAIT'
  | 'MONITOR'
  | 'EARLY';

export interface TimingResult {
  status: TimingStatus;
  label: string;
  colorClass: string; // Tailwind color classes for badges
  helperText: string;
}

export interface TimingThresholds {
  takeNow: number;
  survey: number;
  monitor: number;
}

export interface ComputeTimingOptions {
  kickoffUtc: string;
  nowUtc?: string;
  marketLiquid?: boolean;
  recommendedUrgency?: 'LOCKED_NOW' | 'WAIT' | 'BUYBACK' | string;
  thresholds?: TimingThresholds;
}

function hoursUntil(kickoffIso: string, now = new Date()): number {
  const kickoff = new Date(kickoffIso);
  if (Number.isNaN(kickoff.getTime())) {
    return Number.NaN;
  }
  return (kickoff.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export function computeTimingStatus({
  kickoffUtc,
  nowUtc,
  marketLiquid,
  recommendedUrgency,
  thresholds = { takeNow: 3, survey: 24, monitor: 72 },
}: ComputeTimingOptions): TimingResult {
  const now = nowUtc ? new Date(nowUtc) : new Date();

  if (!kickoffUtc || typeof kickoffUtc !== 'string') {
    return {
      status: 'EARLY',
      label: 'Schedule TBD',
      colorClass: 'bg-slate-700 text-slate-200 border-slate-600',
      helperText: 'Kickoff not available; monitor schedule.',
    };
  }

  const h = hoursUntil(kickoffUtc, now);

  if (Number.isNaN(h)) {
    return {
      status: 'EARLY',
      label: 'Schedule TBD',
      colorClass: 'bg-slate-700 text-slate-200 border-slate-600',
      helperText: 'Kickoff time invalid; monitor schedule.',
    };
  }

  if (h <= 0) {
    return {
      status: 'POST_KICKOFF',
      label: 'Started',
      colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      helperText: 'Game in progress or kickoff passed.',
    };
  }

  // Respect recommendedUrgency override
  if (recommendedUrgency === 'LOCKED_NOW') {
    return {
      status: 'TAKE_NOW',
      label: 'Take Now',
      colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      helperText: 'Recommended to lock this now by model confidence.',
    };
  }

  // Close to kickoff (<= takeNow hours, default 3h)
  if (h <= thresholds.takeNow) {
    // If market illiquid and very close to kickoff (< 1h), prefer SURVEY
    if (marketLiquid === false && h < 1) {
      return {
        status: 'SURVEY',
        label: 'Survey (Low Liquidity)',
        colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        helperText: 'Low market liquidity — approach carefully.',
      };
    }
    const minutes = Math.max(1, Math.round(h * 60));
    return {
      status: 'TAKE_NOW',
      label: 'Take Now',
      colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      helperText: `Kickoff in ${minutes}m — consider taking now.`,
    };
  }

  // Within survey window (<= survey hours, default 24h)
  if (h <= thresholds.survey) {
    return {
      status: 'WAIT',
      label: 'Wait & Monitor',
      colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      helperText: `Kickoff in ~${Math.round(h)}h — recommended to wait and monitor.`,
    };
  }

  // Within monitor window (<= monitor hours, default 72h)
  if (h <= thresholds.monitor) {
    return {
      status: 'MONITOR',
      label: 'Monitor Line',
      colorClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      helperText: 'Monitor market movement and news; not urgent.',
    };
  }

  // Early in the cycle
  return {
    status: 'EARLY',
    label: 'Early Open',
    colorClass: 'bg-slate-700 text-slate-300 border-slate-600',
    helperText: 'Early in the week — keep on radar.',
  };
}
