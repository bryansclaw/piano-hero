import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadAnalytics,
  recordSession,
  aggregatePracticeTime,
  calculateAccuracyTrend,
  calculateTotalStats,
  calculatePercentile,
} from '../analyticsEngine';
import type { AnalyticsData, SessionHistory, NoteTimingData } from '../../types';

function emptyAnalytics(): AnalyticsData {
  return {
    dailyPractice: [],
    keyAccuracy: [],
    sessionHistory: [],
    songAccuracyTrends: {},
  };
}

function makeSession(overrides: Partial<SessionHistory> = {}): SessionHistory {
  return {
    songId: 'test-song',
    difficulty: 'easy',
    date: new Date().toISOString(),
    score: 5000,
    accuracy: 85,
    duration: 120,
    ...overrides,
  };
}

function makeTiming(midi = 60, rating: 'perfect' | 'miss' = 'perfect'): NoteTimingData {
  return {
    noteId: 'n-1',
    midi,
    expectedTime: 1,
    actualTime: 1.01,
    deltaMs: 10,
    velocity: 80,
    hand: 'right',
    rating,
    measure: 1,
  };
}

describe('recordSession', () => {
  it('adds session to history', () => {
    const analytics = emptyAnalytics();
    const session = makeSession();
    const updated = recordSession(analytics, session, []);
    expect(updated.sessionHistory.length).toBe(1);
    expect(updated.sessionHistory[0].songId).toBe('test-song');
  });

  it('updates daily practice data', () => {
    const analytics = emptyAnalytics();
    const session = makeSession({ duration: 300 }); // 5 minutes
    const updated = recordSession(analytics, session, []);
    expect(updated.dailyPractice.length).toBe(1);
    expect(updated.dailyPractice[0].totalMinutes).toBe(5);
    expect(updated.dailyPractice[0].sessions).toBe(1);
  });

  it('merges multiple sessions on same day', () => {
    const analytics = emptyAnalytics();
    const s1 = makeSession({ duration: 300, accuracy: 80 });
    const a1 = recordSession(analytics, s1, []);
    const s2 = makeSession({ duration: 600, accuracy: 90 });
    const a2 = recordSession(a1, s2, []);
    expect(a2.dailyPractice.length).toBe(1);
    expect(a2.dailyPractice[0].sessions).toBe(2);
    expect(a2.dailyPractice[0].totalMinutes).toBe(15);
  });

  it('updates key accuracy', () => {
    const analytics = emptyAnalytics();
    const timings = [makeTiming(60, 'perfect'), makeTiming(60, 'miss'), makeTiming(62, 'perfect')];
    const updated = recordSession(analytics, makeSession(), timings);
    const c60 = updated.keyAccuracy.find(k => k.midi === 60);
    expect(c60).toBeDefined();
    expect(c60!.totalHits).toBe(2);
    expect(c60!.correctHits).toBe(1);
    expect(c60!.accuracy).toBe(50);
  });

  it('updates song accuracy trends', () => {
    const analytics = emptyAnalytics();
    const session = makeSession({ accuracy: 85 });
    const updated = recordSession(analytics, session, []);
    expect(updated.songAccuracyTrends['test-song']).toBeDefined();
    expect(updated.songAccuracyTrends['test-song'].length).toBe(1);
    expect(updated.songAccuracyTrends['test-song'][0].accuracy).toBe(85);
  });

  it('limits session history to 200', () => {
    let analytics = emptyAnalytics();
    for (let i = 0; i < 205; i++) {
      analytics = recordSession(analytics, makeSession(), []);
    }
    expect(analytics.sessionHistory.length).toBe(200);
  });
});

describe('aggregatePracticeTime', () => {
  it('filters by week', () => {
    const data = [
      { date: new Date().toISOString().split('T')[0], totalMinutes: 30, sessions: 2, averageAccuracy: 80, songsPlayed: ['a'] },
      { date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], totalMinutes: 20, sessions: 1, averageAccuracy: 75, songsPlayed: ['b'] },
    ];
    const result = aggregatePracticeTime(data, 'week');
    expect(result.values.length).toBe(1);
    expect(result.values[0]).toBe(30);
  });

  it('returns all for "all" period', () => {
    const data = [
      { date: '2020-01-01', totalMinutes: 10, sessions: 1, averageAccuracy: 70, songsPlayed: ['a'] },
      { date: new Date().toISOString().split('T')[0], totalMinutes: 30, sessions: 2, averageAccuracy: 80, songsPlayed: ['b'] },
    ];
    const result = aggregatePracticeTime(data, 'all');
    expect(result.values.length).toBe(2);
  });
});

describe('calculateAccuracyTrend', () => {
  it('sorts by date and returns values', () => {
    const trends = [
      { date: '2024-01-02', accuracy: 85 },
      { date: '2024-01-01', accuracy: 70 },
      { date: '2024-01-03', accuracy: 90 },
    ];
    const result = calculateAccuracyTrend(trends);
    expect(result.values).toEqual([70, 85, 90]);
  });

  it('handles empty trends', () => {
    const result = calculateAccuracyTrend([]);
    expect(result.values.length).toBe(0);
  });
});

describe('calculateTotalStats', () => {
  it('calculates total minutes', () => {
    const analytics: AnalyticsData = {
      ...emptyAnalytics(),
      dailyPractice: [
        { date: '2024-01-01', totalMinutes: 30, sessions: 2, averageAccuracy: 80, songsPlayed: ['a'] },
        { date: '2024-01-02', totalMinutes: 45, sessions: 3, averageAccuracy: 85, songsPlayed: ['b'] },
      ],
      sessionHistory: [makeSession({ accuracy: 80 }), makeSession({ accuracy: 90 })],
    };
    const stats = calculateTotalStats(analytics);
    expect(stats.totalMinutes).toBe(75);
    expect(stats.songsCompleted).toBe(2);
    expect(stats.averageAccuracy).toBe(85);
  });

  it('finds favorite song', () => {
    const analytics: AnalyticsData = {
      ...emptyAnalytics(),
      sessionHistory: [
        makeSession({ songId: 'song-a' }),
        makeSession({ songId: 'song-b' }),
        makeSession({ songId: 'song-a' }),
        makeSession({ songId: 'song-a' }),
      ],
    };
    const stats = calculateTotalStats(analytics);
    expect(stats.favoriteSong).toBe('song-a');
  });

  it('calculates longest streak', () => {
    const analytics: AnalyticsData = {
      ...emptyAnalytics(),
      dailyPractice: [
        { date: '2024-01-01', totalMinutes: 10, sessions: 1, averageAccuracy: 80, songsPlayed: [] },
        { date: '2024-01-02', totalMinutes: 10, sessions: 1, averageAccuracy: 80, songsPlayed: [] },
        { date: '2024-01-03', totalMinutes: 10, sessions: 1, averageAccuracy: 80, songsPlayed: [] },
        { date: '2024-01-10', totalMinutes: 10, sessions: 1, averageAccuracy: 80, songsPlayed: [] },
      ],
    };
    const stats = calculateTotalStats(analytics);
    expect(stats.longestStreak).toBe(3);
  });
});

describe('calculatePercentile', () => {
  it('calculates player percentile', () => {
    const leaderboard = [
      { score: 100000, isPlayer: false },
      { score: 80000, isPlayer: true },
      { score: 50000, isPlayer: false },
      { score: 30000, isPlayer: false },
    ];
    const percentile = calculatePercentile(leaderboard);
    expect(percentile).toBe(75);
  });

  it('returns 50 for missing player', () => {
    const leaderboard = [{ score: 100000, isPlayer: false }];
    expect(calculatePercentile(leaderboard)).toBe(50);
  });
});

describe('recordSession with unknown songId', () => {
  it('does not crash with curriculum lesson ID', () => {
    const analytics = emptyAnalytics();
    const session = makeSession({ songId: 'fund-01' }); // Curriculum lesson ID
    const updated = recordSession(analytics, session, []);
    expect(updated.sessionHistory.length).toBe(1);
    expect(updated.sessionHistory[0].songId).toBe('fund-01');
    expect(updated.songAccuracyTrends['fund-01']).toBeDefined();
  });

  it('handles sessions with arbitrary IDs', () => {
    const analytics = emptyAnalytics();
    const session = makeSession({ songId: 'nonexistent-song-id-12345' });
    const updated = recordSession(analytics, session, []);
    expect(updated.sessionHistory.length).toBe(1);
    expect(updated.dailyPractice.length).toBe(1);
  });
});

describe('loadAnalytics', () => {
  const ANALYTICS_KEY = 'piano-hero-analytics';

  beforeEach(() => {
    localStorage.removeItem(ANALYTICS_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(ANALYTICS_KEY);
  });

  it('returns defaults with corrupted localStorage', () => {
    localStorage.setItem(ANALYTICS_KEY, '{invalid json!!!');
    const result = loadAnalytics();
    expect(result.dailyPractice).toEqual([]);
    expect(result.keyAccuracy).toEqual([]);
    expect(result.sessionHistory).toEqual([]);
    expect(result.songAccuracyTrends).toEqual({});
  });

  it('returns defaults with empty localStorage', () => {
    const result = loadAnalytics();
    expect(result.dailyPractice).toEqual([]);
    expect(result.keyAccuracy).toEqual([]);
    expect(result.sessionHistory).toEqual([]);
    expect(result.songAccuracyTrends).toEqual({});
  });

  it('loads valid data from localStorage', () => {
    const data: AnalyticsData = {
      dailyPractice: [{ date: '2024-01-01', totalMinutes: 30, sessions: 1, averageAccuracy: 80, songsPlayed: ['a'] }],
      keyAccuracy: [],
      sessionHistory: [],
      songAccuracyTrends: {},
    };
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
    const result = loadAnalytics();
    expect(result.dailyPractice.length).toBe(1);
    expect(result.dailyPractice[0].totalMinutes).toBe(30);
  });
});
