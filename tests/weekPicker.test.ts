// tests/weekPicker.test.ts
import { describe, it, expect } from 'vitest';
import { findClosestWeekToDate } from '../src/utils/weekPicker';
import { Pick2026 } from '../src/types';

describe('findClosestWeekToDate unit tests', () => {
  const sampleGames: Partial<Pick2026>[] = [
    {
      id: 'g1',
      week: 'Week 0',
      date: 'Aug 29, 2026',
    },
    {
      id: 'g2',
      week: 'Week 0',
      date: 'Aug 29, 2026',
    },
    {
      id: 'g3',
      week: 'Week 1',
      date: 'Sept 5, 2026',
    },
    {
      id: 'g4',
      week: 'Week 2',
      date: 'Sept 12, 2026',
    },
  ];

  it('selects Week 0 when reference date is in late August 2026', () => {
    const refDate = new Date('2026-08-29T12:00:00Z');
    const closest = findClosestWeekToDate(sampleGames as Pick2026[], refDate);
    expect(closest).toBe('Week 0');
  });

  it('selects Week 1 when reference date is in early September 2026', () => {
    const refDate = new Date('2026-09-04T12:00:00Z');
    const closest = findClosestWeekToDate(sampleGames as Pick2026[], refDate);
    expect(closest).toBe('Week 1');
  });

  it('selects Week 2 when reference date is mid September 2026', () => {
    const refDate = new Date('2026-09-12T12:00:00Z');
    const closest = findClosestWeekToDate(sampleGames as Pick2026[], refDate);
    expect(closest).toBe('Week 2');
  });

  it('falls back gracefully when list is empty', () => {
    const closest = findClosestWeekToDate([], new Date());
    expect(closest).toBe('Week 0');
  });
});
