import type { TimingWindows, Difficulty } from '../types';

// Note colors - rainbow by pitch class
export const NOTE_COLORS: Record<number, string> = {
  0: '#ff4444',  // C  - red
  1: '#ff6644',  // C# - red-orange
  2: '#ff8800',  // D  - orange
  3: '#ffaa00',  // D# - orange-yellow
  4: '#ffdd00',  // E  - yellow
  5: '#44dd44',  // F  - green
  6: '#22bbaa',  // F# - teal
  7: '#4488ff',  // G  - blue
  8: '#5566ff',  // G# - blue-indigo
  9: '#6644ff',  // A  - indigo
  10: '#8844ff', // A# - indigo-violet
  11: '#aa44ff', // B  - violet
};

export function getNoteColor(midi: number): string {
  return NOTE_COLORS[midi % 12] ?? '#ffffff';
}

// Timing windows per difficulty (ms)
export const TIMING_WINDOWS: Record<Difficulty, TimingWindows> = {
  easy:   { perfect: 80, great: 150, good: 250 },
  medium: { perfect: 60, great: 120, good: 180 },
  hard:   { perfect: 50, great: 100, good: 150 },
  expert: { perfect: 35, great: 70,  good: 120 },
};

// Fall speed per difficulty (pixels per second)
export const FALL_SPEEDS: Record<Difficulty, number> = {
  easy: 200,
  medium: 300,
  hard: 400,
  expert: 500,
};

// Scoring
export const SCORE_VALUES: Record<string, number> = {
  perfect: 300,
  great: 200,
  good: 100,
  miss: 0,
};

export const COMBO_THRESHOLDS = [
  { combo: 50, multiplier: 4 },
  { combo: 25, multiplier: 3 },
  { combo: 10, multiplier: 2 },
  { combo: 0,  multiplier: 1 },
];

// Star thresholds (percentage of max possible score)
export const STAR_THRESHOLDS = [0, 0.3, 0.5, 0.7, 0.85, 0.95];

// Piano
export const PIANO_MIN_NOTE = 21; // A0
export const PIANO_MAX_NOTE = 108; // C8
export const TOTAL_KEYS = 88;

// Game canvas
export const HIT_LINE_Y_PERCENT = 0.85;
export const NOTE_WIDTH = 28;
export const NOTE_BORDER_RADIUS = 4;

// Theme colors
export const THEME = {
  bg: '#0a0a1a',
  bgLight: '#141432',
  bgCard: '#1a1a3e',
  accent: '#e040fb',
  accentBlue: '#40c4ff',
  accentPink: '#ff4081',
  accentGreen: '#69f0ae',
  textPrimary: '#ffffff',
  textSecondary: '#b0b0d0',
  border: '#2a2a5e',
  hitLineColor: '#ffffff44',
  comboGlow: '#ffdd00',
};
