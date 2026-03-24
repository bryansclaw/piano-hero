import { describe, it, expect } from 'vitest';
import {
  createInitialScore,
  getHitRating,
  getMultiplier,
  processHit,
  calculateStars,
  calculateMaxScore,
} from '../scoring';
import { TIMING_WINDOWS } from '../../utils/constants';

describe('scoring', () => {
  describe('createInitialScore', () => {
    it('returns zeroed score', () => {
      const score = createInitialScore();
      expect(score.points).toBe(0);
      expect(score.combo).toBe(0);
      expect(score.maxCombo).toBe(0);
      expect(score.multiplier).toBe(1);
      expect(score.perfect).toBe(0);
      expect(score.great).toBe(0);
      expect(score.good).toBe(0);
      expect(score.miss).toBe(0);
      expect(score.accuracy).toBe(100);
      expect(score.stars).toBe(0);
    });
  });

  describe('getHitRating', () => {
    const windows = TIMING_WINDOWS.medium;

    it('returns perfect for delta within perfect window', () => {
      expect(getHitRating(30, windows)).toBe('perfect');
      expect(getHitRating(-30, windows)).toBe('perfect');
      expect(getHitRating(0, windows)).toBe('perfect');
    });

    it('returns great for delta within great window', () => {
      expect(getHitRating(90, windows)).toBe('great');
      expect(getHitRating(-90, windows)).toBe('great');
    });

    it('returns good for delta within good window', () => {
      expect(getHitRating(150, windows)).toBe('good');
      expect(getHitRating(-150, windows)).toBe('good');
    });

    it('returns miss for delta outside all windows', () => {
      expect(getHitRating(200, windows)).toBe('miss');
      expect(getHitRating(-200, windows)).toBe('miss');
    });

    it('respects easy difficulty wider windows', () => {
      const easyWindows = TIMING_WINDOWS.easy;
      expect(getHitRating(70, easyWindows)).toBe('perfect');
      expect(getHitRating(140, easyWindows)).toBe('great');
    });

    it('respects expert difficulty tighter windows', () => {
      const expertWindows = TIMING_WINDOWS.expert;
      expect(getHitRating(50, expertWindows)).toBe('great');
      expect(getHitRating(100, expertWindows)).toBe('good');
    });
  });

  describe('getMultiplier', () => {
    it('returns 1x for combo < 10', () => {
      expect(getMultiplier(0)).toBe(1);
      expect(getMultiplier(5)).toBe(1);
      expect(getMultiplier(9)).toBe(1);
    });

    it('returns 2x for combo >= 10', () => {
      expect(getMultiplier(10)).toBe(2);
      expect(getMultiplier(24)).toBe(2);
    });

    it('returns 3x for combo >= 25', () => {
      expect(getMultiplier(25)).toBe(3);
      expect(getMultiplier(49)).toBe(3);
    });

    it('returns 4x for combo >= 50', () => {
      expect(getMultiplier(50)).toBe(4);
      expect(getMultiplier(100)).toBe(4);
    });
  });

  describe('processHit', () => {
    it('adds points for perfect hit', () => {
      const score = createInitialScore();
      const next = processHit(score, 'perfect');
      expect(next.points).toBe(300);
      expect(next.perfect).toBe(1);
      expect(next.combo).toBe(1);
    });

    it('adds points for great hit', () => {
      const score = createInitialScore();
      const next = processHit(score, 'great');
      expect(next.points).toBe(200);
      expect(next.great).toBe(1);
    });

    it('adds points for good hit', () => {
      const score = createInitialScore();
      const next = processHit(score, 'good');
      expect(next.points).toBe(100);
      expect(next.good).toBe(1);
    });

    it('resets combo on miss', () => {
      let score = createInitialScore();
      score = processHit(score, 'perfect');
      score = processHit(score, 'perfect');
      expect(score.combo).toBe(2);
      score = processHit(score, 'miss');
      expect(score.combo).toBe(0);
      expect(score.miss).toBe(1);
      expect(score.multiplier).toBe(1);
    });

    it('tracks max combo', () => {
      let score = createInitialScore();
      for (let i = 0; i < 15; i++) {
        score = processHit(score, 'perfect');
      }
      expect(score.maxCombo).toBe(15);
      score = processHit(score, 'miss');
      score = processHit(score, 'perfect');
      expect(score.maxCombo).toBe(15);
      expect(score.combo).toBe(1);
    });

    it('increases multiplier with combo', () => {
      let score = createInitialScore();
      for (let i = 0; i < 10; i++) {
        score = processHit(score, 'perfect');
      }
      expect(score.multiplier).toBe(2);
    });

    it('calculates accuracy correctly', () => {
      let score = createInitialScore();
      score = processHit(score, 'perfect');
      score = processHit(score, 'miss');
      expect(score.accuracy).toBe(50);
    });
  });

  describe('calculateStars', () => {
    it('returns 0 for 0 score', () => {
      expect(calculateStars(0, 1000)).toBe(0);
    });

    it('returns 5 for near-perfect score', () => {
      expect(calculateStars(960, 1000)).toBe(5);
    });

    it('returns 3 for 70% score', () => {
      expect(calculateStars(700, 1000)).toBe(3);
    });

    it('handles zero max score', () => {
      expect(calculateStars(100, 0)).toBe(0);
    });
  });

  describe('calculateMaxScore', () => {
    it('returns 0 for 0 notes', () => {
      expect(calculateMaxScore(0)).toBe(0);
    });

    it('calculates with combo multipliers', () => {
      const score = calculateMaxScore(10);
      // 9 notes at 1x = 9 * 300, 1 note at 2x = 300 * 2
      // Actually: notes 1-9 at 1x (300 each) = 2700, note 10 at 2x = 600, total = 3300
      expect(score).toBe(3300);
    });

    it('increases with more notes due to multiplier', () => {
      const score10 = calculateMaxScore(10);
      const score50 = calculateMaxScore(50);
      expect(score50).toBeGreaterThan(score10);
    });
  });
});
