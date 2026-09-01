// tests/betLedgerStorage.test.ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { calculateBetLedgerStats } from '../src/utils/betLedgerStorage';
import { UserLoggedBet } from '../src/types';

// Mock localStorage for Node test runner
const memoryStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => memoryStorage[key] || null,
  setItem: (key: string, val: string) => {
    memoryStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete memoryStorage[key];
  },
  clear: () => {
    Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
  },
};

describe('calculateBetLedgerStats unit tests', () => {
  beforeEach(() => {
    // @ts-ignore
    globalThis.localStorage = mockLocalStorage;
    mockLocalStorage.clear();
  });

  afterAll(() => {
    // @ts-ignore
    delete globalThis.localStorage;
  });

  it('calculates units dynamically based on passed unitValue when stakeUnits is missing', () => {
    const bets: UserLoggedBet[] = [
      {
        id: 'b1',
        timestamp: '2026-08-29T10:00:00Z',
        week: 'Week 0',
        ticketType: 'straight',
        selection: 'TCU -3.5',
        bookName: 'DraftKings',
        line: '-3.5',
        oddsAmerican: -110,
        stakeDollars: 60,
        // stakeUnits omitted
        potentialPayoutDollars: 114.55,
        timingStatus: 'LOCKED_NOW',
        resultStatus: 'PENDING',
      },
    ];

    const stats20 = calculateBetLedgerStats(bets, 20);
    expect(stats20.totalWageredUnits).toBeCloseTo(3.0, 1);

    const stats30 = calculateBetLedgerStats(bets, 30);
    expect(stats30.totalWageredUnits).toBeCloseTo(2.0, 1);

    const stats50 = calculateBetLedgerStats(bets, 50);
    expect(stats50.totalWageredUnits).toBeCloseTo(1.2, 1);
  });

  it('honors explicit stakeUnits when present regardless of unitValue', () => {
    const bets: UserLoggedBet[] = [
      {
        id: 'b2',
        timestamp: '2026-08-29T10:00:00Z',
        week: 'Week 0',
        ticketType: 'straight',
        selection: 'Florida State -31.5',
        bookName: 'DraftKings',
        line: '-31.5',
        oddsAmerican: -110,
        stakeDollars: 50,
        stakeUnits: 2.5,
        potentialPayoutDollars: 95.45,
        timingStatus: 'LOCKED_NOW',
        resultStatus: 'PENDING',
      },
    ];

    const stats20 = calculateBetLedgerStats(bets, 20);
    expect(stats20.totalWageredUnits).toBe(2.5);

    const stats50 = calculateBetLedgerStats(bets, 50);
    expect(stats50.totalWageredUnits).toBe(2.5);
  });

  it('calculates settled won/lost/push net PnL in both dollars and units accurately', () => {
    const bets: UserLoggedBet[] = [
      {
        id: 'won-1',
        timestamp: '2026-08-29T10:00:00Z',
        week: 'Week 0',
        ticketType: 'straight',
        selection: 'Kansas State -14.5',
        bookName: 'FanDuel',
        line: '-14.5',
        oddsAmerican: -110,
        stakeDollars: 40,
        stakeUnits: 2.0,
        potentialPayoutDollars: 76.36,
        timingStatus: 'LOCKED_NOW',
        resultStatus: 'WON',
        actualPnlDollars: 36.36,
      },
      {
        id: 'lost-1',
        timestamp: '2026-08-29T10:00:00Z',
        week: 'Week 0',
        ticketType: 'straight',
        selection: 'Iowa State -7',
        bookName: 'DraftKings',
        line: '-7',
        oddsAmerican: -110,
        stakeDollars: 20,
        stakeUnits: 1.0,
        potentialPayoutDollars: 38.18,
        timingStatus: 'LOCKED_NOW',
        resultStatus: 'LOST',
        actualPnlDollars: -20,
      },
      {
        id: 'push-1',
        timestamp: '2026-08-29T10:00:00Z',
        week: 'Week 0',
        ticketType: 'straight',
        selection: 'Navy +3',
        bookName: 'BetMGM',
        line: '+3',
        oddsAmerican: -110,
        stakeDollars: 20,
        stakeUnits: 1.0,
        potentialPayoutDollars: 20,
        timingStatus: 'LOCKED_NOW',
        resultStatus: 'PUSH',
      },
    ];

    const stats = calculateBetLedgerStats(bets, 20);
    expect(stats.totalBets).toBe(3);
    expect(stats.wonBets).toBe(1);
    expect(stats.lostBets).toBe(1);
    expect(stats.pushBets).toBe(1);
    expect(stats.winRatePct).toBe(50);
    expect(stats.netPnlDollars).toBeCloseTo(16.36, 2);
    expect(stats.netPnlUnits).toBeCloseTo(0.82, 1);
    expect(stats.totalSettledDollars).toBe(80);
    expect(stats.totalSettledUnits).toBe(4.0);
  });

  it('reads user unit size from localStorage when unitValue argument is omitted', () => {
    mockLocalStorage.setItem('cfb_fei_user_unit_size_v1', JSON.stringify(40));

    const bets: UserLoggedBet[] = [
      {
        id: 'b-fallback',
        timestamp: '2026-08-29T10:00:00Z',
        week: 'Week 0',
        ticketType: 'straight',
        selection: 'TCU -3.5',
        bookName: 'DraftKings',
        line: '-3.5',
        oddsAmerican: -110,
        stakeDollars: 80,
        // no stakeUnits
        potentialPayoutDollars: 152.72,
        timingStatus: 'LOCKED_NOW',
        resultStatus: 'PENDING',
      },
    ];

    const stats = calculateBetLedgerStats(bets);
    expect(stats.totalWageredUnits).toBeCloseTo(2.0, 1); // 80 / 40 = 2.0
  });

  it('falls back to 20 when localStorage is empty and unitValue argument is omitted', () => {
    const bets: UserLoggedBet[] = [
      {
        id: 'b-default',
        timestamp: '2026-08-29T10:00:00Z',
        week: 'Week 0',
        ticketType: 'straight',
        selection: 'TCU -3.5',
        bookName: 'DraftKings',
        line: '-3.5',
        oddsAmerican: -110,
        stakeDollars: 60,
        // no stakeUnits
        potentialPayoutDollars: 114.55,
        timingStatus: 'LOCKED_NOW',
        resultStatus: 'PENDING',
      },
    ];

    const stats = calculateBetLedgerStats(bets);
    expect(stats.totalWageredUnits).toBeCloseTo(3.0, 1); // 60 / 20 = 3.0
  });
});
