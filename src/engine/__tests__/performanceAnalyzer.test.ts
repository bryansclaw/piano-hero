import { describe, it, expect } from 'vitest';
import {
  calculateGrade,
  timeToMeasure,
  analyzeTimings,
  analyzeDynamics,
  findTroubleSpots,
  generateSuggestions,
  generatePerformanceReport,
  getImprovementInsight,
} from '../performanceAnalyzer';
import type { NoteTimingData, SessionHistory } from '../../types';

function makeTiming(overrides: Partial<NoteTimingData> = {}): NoteTimingData {
  return {
    noteId: 'note-0',
    midi: 60,
    expectedTime: 1,
    actualTime: 1.01,
    deltaMs: 10,
    velocity: 80,
    hand: 'right',
    rating: 'perfect',
    measure: 1,
    ...overrides,
  };
}

describe('calculateGrade', () => {
  it('returns S for 98%+', () => {
    expect(calculateGrade(100)).toBe('S');
    expect(calculateGrade(98)).toBe('S');
  });

  it('returns A for 90-97%', () => {
    expect(calculateGrade(95)).toBe('A');
    expect(calculateGrade(90)).toBe('A');
  });

  it('returns B for 80-89%', () => {
    expect(calculateGrade(85)).toBe('B');
  });

  it('returns C for 70-79%', () => {
    expect(calculateGrade(75)).toBe('C');
  });

  it('returns D for 60-69%', () => {
    expect(calculateGrade(65)).toBe('D');
  });

  it('returns F for below 60%', () => {
    expect(calculateGrade(50)).toBe('F');
    expect(calculateGrade(0)).toBe('F');
  });
});

describe('timeToMeasure', () => {
  it('calculates measure number correctly', () => {
    // At 120 BPM, each beat = 0.5s, each measure (4 beats) = 2s
    expect(timeToMeasure(0, 120)).toBe(1);
    expect(timeToMeasure(1.5, 120)).toBe(1);
    expect(timeToMeasure(2, 120)).toBe(2);
    expect(timeToMeasure(4, 120)).toBe(3);
  });

  it('handles different time signatures', () => {
    // 3/4 time at 120 BPM: measure = 3 beats = 1.5s
    expect(timeToMeasure(0, 120, 3)).toBe(1);
    expect(timeToMeasure(1.5, 120, 3)).toBe(2);
  });
});

describe('analyzeTimings', () => {
  it('handles empty timings', () => {
    const result = analyzeTimings([]);
    expect(result.averageDeltaMs).toBe(0);
    expect(result.steadiness).toBe(100);
  });

  it('detects rushing tendency', () => {
    const timings = Array.from({ length: 10 }, () => makeTiming({ deltaMs: -25 }));
    const result = analyzeTimings(timings);
    expect(result.rushingTendency).toBe(true);
    expect(result.draggingTendency).toBe(false);
  });

  it('detects dragging tendency', () => {
    const timings = Array.from({ length: 10 }, () => makeTiming({ deltaMs: 25 }));
    const result = analyzeTimings(timings);
    expect(result.draggingTendency).toBe(true);
    expect(result.rushingTendency).toBe(false);
  });

  it('analyzes left and right hand separately', () => {
    const timings = [
      makeTiming({ hand: 'left', deltaMs: -30 }),
      makeTiming({ hand: 'left', deltaMs: -25 }),
      makeTiming({ hand: 'right', deltaMs: 5 }),
      makeTiming({ hand: 'right', deltaMs: 10 }),
    ];
    const result = analyzeTimings(timings);
    expect(result.leftHandAvgDelta).toBeLessThan(0);
    expect(result.rightHandAvgDelta).toBeGreaterThan(0);
  });

  it('ignores missed notes in timing analysis', () => {
    const timings = [
      makeTiming({ rating: 'miss', deltaMs: 500 }),
      makeTiming({ rating: 'perfect', deltaMs: 5 }),
      makeTiming({ rating: 'great', deltaMs: 10 }),
    ];
    const result = analyzeTimings(timings);
    expect(result.averageDeltaMs).toBe(7.5);
  });
});

describe('analyzeDynamics', () => {
  it('detects uniform velocity', () => {
    const timings = Array.from({ length: 10 }, () => makeTiming({ velocity: 80 }));
    const result = analyzeDynamics(timings);
    expect(result.uniformity).toBeGreaterThan(85);
    expect(result.insights.some(i => i.includes('uniform'))).toBe(true);
  });

  it('detects varied velocity', () => {
    const timings = [
      makeTiming({ velocity: 30 }),
      makeTiming({ velocity: 120 }),
      makeTiming({ velocity: 50 }),
      makeTiming({ velocity: 100 }),
    ];
    const result = analyzeDynamics(timings);
    expect(result.velocityRange).toBeGreaterThan(50);
  });

  it('handles empty timings', () => {
    const result = analyzeDynamics([]);
    expect(result.averageVelocity).toBe(0);
  });
});

describe('findTroubleSpots', () => {
  it('finds measures with low accuracy', () => {
    const timings = [
      makeTiming({ measure: 1, rating: 'perfect' }),
      makeTiming({ measure: 1, rating: 'perfect' }),
      makeTiming({ measure: 5, rating: 'miss' }),
      makeTiming({ measure: 5, rating: 'miss' }),
      makeTiming({ measure: 5, rating: 'miss' }),
    ];
    const spots = findTroubleSpots(timings, 120);
    expect(spots.length).toBeGreaterThan(0);
    expect(spots[0].measureStart).toBe(5);
  });

  it('returns empty for perfect performance', () => {
    const timings = Array.from({ length: 10 }, (_, i) =>
      makeTiming({ measure: Math.floor(i / 2) + 1, rating: 'perfect' })
    );
    const spots = findTroubleSpots(timings, 120);
    expect(spots.length).toBe(0);
  });
});

describe('generateSuggestions', () => {
  it('suggests metronome for rushing', () => {
    const timing = analyzeTimings(Array.from({ length: 10 }, () => makeTiming({ deltaMs: -25 })));
    const dynamics = analyzeDynamics([makeTiming()]);
    const suggestions = generateSuggestions(timing, dynamics, [], 80);
    expect(suggestions.some(s => s.includes('metronome'))).toBe(true);
  });

  it('suggests slower tempo for low accuracy', () => {
    const timing = analyzeTimings([makeTiming()]);
    const dynamics = analyzeDynamics([makeTiming()]);
    const suggestions = generateSuggestions(timing, dynamics, [], 60);
    expect(suggestions.some(s => s.includes('50%') || s.includes('tempo'))).toBe(true);
  });
});

describe('generatePerformanceReport', () => {
  it('creates a complete report', () => {
    const timings = [
      makeTiming({ rating: 'perfect' }),
      makeTiming({ rating: 'great' }),
      makeTiming({ rating: 'miss' }),
    ];
    const report = generatePerformanceReport('test-song', 'easy', timings, 1000, 60, 120);
    expect(report.songId).toBe('test-song');
    expect(report.letterGrade).toBeTruthy();
    expect(report.overallAccuracy).toBeCloseTo(66.67, 0);
    expect(report.timingAnalysis).toBeDefined();
    expect(report.dynamicsAnalysis).toBeDefined();
    expect(report.practiceSuggestions.length).toBeGreaterThan(0);
  });
});

describe('getImprovementInsight', () => {
  it('returns null for single session', () => {
    const history: SessionHistory[] = [
      { songId: 'test', difficulty: 'easy', date: new Date().toISOString(), score: 1000, accuracy: 80, duration: 60 },
    ];
    expect(getImprovementInsight(history, 'test')).toBeNull();
  });

  it('detects improvement', () => {
    const history: SessionHistory[] = [
      { songId: 'test', difficulty: 'easy', date: '2024-01-01', score: 500, accuracy: 72, duration: 60 },
      { songId: 'test', difficulty: 'easy', date: '2024-01-02', score: 800, accuracy: 85, duration: 60 },
    ];
    const insight = getImprovementInsight(history, 'test');
    expect(insight).toContain('improved');
    expect(insight).toContain('72%');
    expect(insight).toContain('85%');
  });
});
