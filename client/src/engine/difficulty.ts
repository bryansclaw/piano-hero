import type { Difficulty, SongNote } from '../types';
import { TIMING_WINDOWS, FALL_SPEEDS } from '../utils/constants';

export interface DifficultyPreset {
  label: string;
  description: string;
  fallSpeed: number;
  timingWindows: { perfect: number; great: number; good: number };
  noteFilter: (notes: SongNote[]) => SongNote[];
  unlockStars: number; // stars needed on previous difficulty to unlock
}

/**
 * Filter to melody-only (right hand), and slow notes
 */
function filterEasy(notes: SongNote[]): SongNote[] {
  // Only right hand, skip very fast passages
  const rightHand = notes.filter((n) => n.hand === 'right');
  // Thin out if notes are too close together
  const filtered: SongNote[] = [];
  let lastTime = -1;
  for (const note of rightHand) {
    if (note.time - lastTime >= 0.3) {
      filtered.push(note);
      lastTime = note.time;
    }
  }
  return filtered;
}

/**
 * Both hands but simplified - skip very fast runs
 */
function filterMedium(notes: SongNote[]): SongNote[] {
  const filtered: SongNote[] = [];
  let lastTime = -1;
  for (const note of notes) {
    if (note.time - lastTime >= 0.15) {
      filtered.push(note);
      lastTime = note.time;
    }
  }
  return filtered;
}

/**
 * Full arrangement
 */
function filterHard(notes: SongNote[]): SongNote[] {
  return [...notes];
}

/**
 * Full arrangement, no mercy
 */
function filterExpert(notes: SongNote[]): SongNote[] {
  return [...notes];
}

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyPreset> = {
  easy: {
    label: 'Easy',
    description: 'Melody only, slow speed, forgiving timing',
    fallSpeed: FALL_SPEEDS.easy,
    timingWindows: TIMING_WINDOWS.easy,
    noteFilter: filterEasy,
    unlockStars: 0,
  },
  medium: {
    label: 'Medium',
    description: 'Both hands simplified, normal speed',
    fallSpeed: FALL_SPEEDS.medium,
    timingWindows: TIMING_WINDOWS.medium,
    noteFilter: filterMedium,
    unlockStars: 3,
  },
  hard: {
    label: 'Hard',
    description: 'Full arrangement, tight timing',
    fallSpeed: FALL_SPEEDS.hard,
    timingWindows: TIMING_WINDOWS.hard,
    noteFilter: filterHard,
    unlockStars: 3,
  },
  expert: {
    label: 'Expert',
    description: 'Full arrangement, fast, very tight timing',
    fallSpeed: FALL_SPEEDS.expert,
    timingWindows: TIMING_WINDOWS.expert,
    noteFilter: filterExpert,
    unlockStars: 3,
  },
};

/**
 * Get notes for a specific difficulty
 */
export function getNotesForDifficulty(allNotes: SongNote[], difficulty: Difficulty): SongNote[] {
  return DIFFICULTY_PRESETS[difficulty].noteFilter(allNotes);
}

/**
 * Check if a difficulty level is unlocked for a song
 */
export function isDifficultyUnlocked(
  difficulty: Difficulty,
  bestStars: Record<Difficulty, number>,
): boolean {
  const order: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
  const index = order.indexOf(difficulty);

  if (index === 0) return true; // Easy always unlocked

  const prevDifficulty = order[index - 1];
  const prevStars = bestStars[prevDifficulty] ?? 0;
  return prevStars >= DIFFICULTY_PRESETS[difficulty].unlockStars;
}
