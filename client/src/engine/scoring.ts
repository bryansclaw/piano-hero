import type { GameScore, HitRating, TimingWindows } from '../types';
import { SCORE_VALUES, COMBO_THRESHOLDS, STAR_THRESHOLDS } from '../utils/constants';

/**
 * Create a fresh score object
 */
export function createInitialScore(): GameScore {
  return {
    points: 0,
    combo: 0,
    maxCombo: 0,
    multiplier: 1,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    accuracy: 100,
    stars: 0,
  };
}

/**
 * Determine hit rating based on timing delta
 */
export function getHitRating(deltaMs: number, windows: TimingWindows): HitRating {
  const abs = Math.abs(deltaMs);
  if (abs <= windows.perfect) return 'perfect';
  if (abs <= windows.great) return 'great';
  if (abs <= windows.good) return 'good';
  return 'miss';
}

/**
 * Get the combo multiplier for the current combo count
 */
export function getMultiplier(combo: number): number {
  for (const threshold of COMBO_THRESHOLDS) {
    if (combo >= threshold.combo) return threshold.multiplier;
  }
  return 1;
}

/**
 * Process a hit and return updated score
 */
export function processHit(score: GameScore, rating: HitRating): GameScore {
  const next = { ...score };

  if (rating === 'miss') {
    next.miss += 1;
    next.combo = 0;
    next.multiplier = 1;
  } else {
    next[rating] += 1;
    next.combo += 1;
    next.maxCombo = Math.max(next.maxCombo, next.combo);
    next.multiplier = getMultiplier(next.combo);
    next.points += SCORE_VALUES[rating] * next.multiplier;
  }

  // Recalculate accuracy
  const totalNotes = next.perfect + next.great + next.good + next.miss;
  if (totalNotes > 0) {
    const hitNotes = next.perfect + next.great + next.good;
    next.accuracy = Math.round((hitNotes / totalNotes) * 10000) / 100;
  }

  return next;
}

/**
 * Calculate stars (0-5) from score relative to max possible
 */
export function calculateStars(score: number, maxPossibleScore: number): number {
  if (maxPossibleScore <= 0) return 0;
  const ratio = score / maxPossibleScore;
  let stars = 0;
  for (let i = STAR_THRESHOLDS.length - 1; i >= 0; i--) {
    if (ratio >= STAR_THRESHOLDS[i]) {
      stars = i;
      break;
    }
  }
  return Math.min(stars, 5);
}

/**
 * Calculate max possible score for a given number of notes
 * (assuming all perfects with max combo)
 */
export function calculateMaxScore(totalNotes: number): number {
  let score = 0;
  let combo = 0;
  for (let i = 0; i < totalNotes; i++) {
    combo++;
    const mult = getMultiplier(combo);
    score += SCORE_VALUES.perfect * mult;
  }
  return score;
}
