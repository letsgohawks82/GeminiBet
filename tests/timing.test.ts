// tests/timing.test.ts
import { describe, it, expect } from 'vitest';
import { computeTimingStatus } from '../src/utils/timing';

describe('computeTimingStatus unit tests', () => {
  const baseNow = new Date('2026-08-29T12:00:00.000Z');
  const nowIso = baseNow.toISOString();

  it('returns POST_KICKOFF when kickoff is in the past or right now', () => {
    // 10 minutes ago
    const pastIso = new Date('2026-08-29T11:50:00.000Z').toISOString();
    const result = computeTimingStatus({ kickoffUtc: pastIso, nowUtc: nowIso });
    expect(result.status).toBe('POST_KICKOFF');
    expect(result.label).toBe('Started');
    expect(result.helperText).toContain('in progress or kickoff passed');

    // Exactly right now (0 hours)
    const exactNow = computeTimingStatus({ kickoffUtc: nowIso, nowUtc: nowIso });
    expect(exactNow.status).toBe('POST_KICKOFF');
  });

  it('returns TAKE_NOW when kickoff is within takeNow threshold (<= 3.0 hours)', () => {
    // 2 hours away
    const twoHoursAway = new Date('2026-08-29T14:00:00.000Z').toISOString();
    const result = computeTimingStatus({ kickoffUtc: twoHoursAway, nowUtc: nowIso });
    expect(result.status).toBe('TAKE_NOW');
    expect(result.label).toBe('Take Now');
    expect(result.helperText).toContain('Kickoff in 120m');

    // Exactly at 3.0 hours
    const threeHoursAway = new Date('2026-08-29T15:00:00.000Z').toISOString();
    const result3h = computeTimingStatus({ kickoffUtc: threeHoursAway, nowUtc: nowIso });
    expect(result3h.status).toBe('TAKE_NOW');
  });

  it('returns SURVEY when marketLiquid is false and kickoff is within 1 hour', () => {
    // 45 minutes away, illiquid
    const fortyFiveMins = new Date('2026-08-29T12:45:00.000Z').toISOString();
    const result = computeTimingStatus({
      kickoffUtc: fortyFiveMins,
      nowUtc: nowIso,
      marketLiquid: false,
    });
    expect(result.status).toBe('SURVEY');
    expect(result.label).toContain('Survey');
    expect(result.helperText).toContain('Low market liquidity');
  });

  it('returns WAIT when kickoff is between 3h and 24h', () => {
    // 12 hours away
    const twelveHoursAway = new Date('2026-08-30T00:00:00.000Z').toISOString();
    const result = computeTimingStatus({ kickoffUtc: twelveHoursAway, nowUtc: nowIso });
    expect(result.status).toBe('WAIT');
    expect(result.label).toBe('Wait & Monitor');

    // Exactly at 24.0 hours
    const twentyFourHours = new Date('2026-08-30T12:00:00.000Z').toISOString();
    const result24h = computeTimingStatus({ kickoffUtc: twentyFourHours, nowUtc: nowIso });
    expect(result24h.status).toBe('WAIT');
  });

  it('returns MONITOR when kickoff is between 24h and 72h', () => {
    // 48 hours away
    const fortyEightHours = new Date('2026-08-31T12:00:00.000Z').toISOString();
    const result = computeTimingStatus({ kickoffUtc: fortyEightHours, nowUtc: nowIso });
    expect(result.status).toBe('MONITOR');
    expect(result.label).toBe('Monitor Line');

    // Exactly at 72.0 hours
    const seventyTwoHours = new Date('2026-09-01T12:00:00.000Z').toISOString();
    const result72h = computeTimingStatus({ kickoffUtc: seventyTwoHours, nowUtc: nowIso });
    expect(result72h.status).toBe('MONITOR');
  });

  it('returns EARLY when kickoff is > 72h away', () => {
    // 5 days away
    const fiveDaysAway = new Date('2026-09-03T12:00:00.000Z').toISOString();
    const result = computeTimingStatus({ kickoffUtc: fiveDaysAway, nowUtc: nowIso });
    expect(result.status).toBe('EARLY');
    expect(result.label).toBe('Early Open');
  });

  it('respects recommendedUrgency="LOCKED_NOW" override', () => {
    // Even if 5 days away, urgent model flag overrides to TAKE_NOW
    const fiveDaysAway = new Date('2026-09-03T12:00:00.000Z').toISOString();
    const result = computeTimingStatus({
      kickoffUtc: fiveDaysAway,
      nowUtc: nowIso,
      recommendedUrgency: 'LOCKED_NOW',
    });
    expect(result.status).toBe('TAKE_NOW');
    expect(result.helperText).toContain('Recommended to lock this now');
  });

  it('handles missing or invalid kickoff dates gracefully', () => {
    // Missing string
    const emptyResult = computeTimingStatus({ kickoffUtc: '' });
    expect(emptyResult.status).toBe('EARLY');
    expect(emptyResult.label).toBe('Schedule TBD');

    // Invalid ISO string
    const invalidResult = computeTimingStatus({ kickoffUtc: 'invalid-date-string' });
    expect(invalidResult.status).toBe('EARLY');
    expect(invalidResult.label).toBe('Schedule TBD');
  });
});
