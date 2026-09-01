// src/utils/weekPicker.ts

/**
 * Normalizes common informal date strings (like 'Sept 5, 2026' -> 'Sep 5, 2026')
 * for cross-platform Date.parse compatibility.
 */
export function parseGameDate(dateStr: string): number | null {
  if (!dateStr) return null;
  try {
    const normalized = dateStr.replace(/Sept\b/gi, 'Sep').trim();
    const timestamp = new Date(normalized).getTime();
    return isNaN(timestamp) ? null : timestamp;
  } catch {
    return null;
  }
}

/**
 * Finds the active or upcoming week label for picks.
 * Automatically rolls forward: if all games in a week are settled or in the past,
 * it selects the next upcoming week (e.g. Week 1 following Week 0).
 */
export function findClosestWeekToDate(
  games: { date?: string; week?: string; isSettled?: boolean }[],
  now: Date = new Date()
): string {
  if (!games || games.length === 0) return 'Week 0';

  const targetTime = now.getTime();

  // Group games by week with metadata
  const weekInfo = new Map<
    string,
    {
      timestamps: number[];
      hasUnsettled: boolean;
      allSettled: boolean;
      maxTimestamp: number;
      minTimestamp: number;
    }
  >();

  for (const g of games) {
    if (!g.week || g.week === 'All' || g.week === 'All Weeks') continue;
    const t = g.date ? parseGameDate(g.date) : null;
    const existing = weekInfo.get(g.week) || {
      timestamps: [],
      hasUnsettled: false,
      allSettled: true,
      maxTimestamp: -Infinity,
      minTimestamp: Infinity,
    };

    if (t !== null) {
      existing.timestamps.push(t);
      if (t > existing.maxTimestamp) existing.maxTimestamp = t;
      if (t < existing.minTimestamp) existing.minTimestamp = t;
    }
    if (!g.isSettled) {
      existing.hasUnsettled = true;
      existing.allSettled = false;
    }
    weekInfo.set(g.week, existing);
  }

  if (weekInfo.size === 0) return 'Week 1';

  // 1. First priority: find the earliest week that has unsettled upcoming games (>= now - 12 hours)
  const sortedWeeks = Array.from(weekInfo.entries()).sort((a, b) => {
    const timeA = a[1].minTimestamp === Infinity ? 0 : a[1].minTimestamp;
    const timeB = b[1].minTimestamp === Infinity ? 0 : b[1].minTimestamp;
    return timeA - timeB;
  });

  for (const [week, info] of sortedWeeks) {
    if (info.hasUnsettled && info.maxTimestamp >= targetTime - 12 * 3600 * 1000) {
      return week;
    }
  }

  // 2. Second priority: find the week whose upcoming date is immediately ahead of now
  for (const [week, info] of sortedWeeks) {
    if (info.minTimestamp >= targetTime - 24 * 3600 * 1000) {
      return week;
    }
  }

  // 3. Fallback: closest median timestamp
  let bestWeek = sortedWeeks[0]?.[0] || 'Week 1';
  let bestDiff = Infinity;
  for (const [week, info] of sortedWeeks) {
    if (info.timestamps.length === 0) continue;
    const sorted = info.timestamps.slice().sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const diff = Math.abs(median - targetTime);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestWeek = week;
    }
  }

  return bestWeek;
}

