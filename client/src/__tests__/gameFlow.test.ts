import { describe, it, expect } from 'vitest';
import {
  createGameEngine,
  startCountdown,
  startPlaying,
  updateGame,
  handleNoteInput,
} from '../engine/gameEngine';
import type { GameConfig, SongNote } from '../types';
import { TIMING_WINDOWS, FALL_SPEEDS } from '../utils/constants';

const makeConfig = (difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'easy'): GameConfig => ({
  difficulty,
  songId: 'test-song',
  fallSpeed: FALL_SPEEDS[difficulty],
  timingWindows: TIMING_WINDOWS[difficulty],
});

const makeNotes = (times: number[]): SongNote[] =>
  times.map((t) => ({
    midi: 60,
    time: t,
    duration: 0.5,
    velocity: 80,
    hand: 'right' as const,
  }));

const CANVAS_HEIGHT = 600;

describe('Game Flow Integration', () => {
  it('full lifecycle: create → countdown → play → complete', () => {
    const config = makeConfig();
    const notes = makeNotes([1, 2, 3]);
    const duration = 5;

    // Create
    let state = createGameEngine(config, notes, duration);
    expect(state.gameState).toBe('idle');
    expect(state.score.points).toBe(0);

    // Countdown
    state = startCountdown(state);
    expect(state.gameState).toBe('countdown');
    expect(state.countdown).toBe(3);

    // Start playing
    state = startPlaying(state);
    expect(state.gameState).toBe('playing');
    expect(state.currentTime).toBe(0);

    // Simulate game loop - advance past all notes and song duration
    // Each updateGame call advances by deltaMs
    for (let i = 0; i < 500; i++) {
      state = updateGame(state, 20, CANVAS_HEIGHT); // 20ms per frame
      if (state.gameState === 'complete') break;
    }

    expect(state.gameState).toBe('complete');
  });

  it('game completes when all notes have passed', () => {
    const config = makeConfig();
    const notes = makeNotes([0.5, 1.0, 1.5]);
    const duration = 2; // Short song

    let state = createGameEngine(config, notes, duration);
    state = startPlaying(state);

    // Advance time well past all notes and duration
    for (let i = 0; i < 300; i++) {
      state = updateGame(state, 20, CANVAS_HEIGHT);
      if (state.gameState === 'complete') break;
    }

    expect(state.gameState).toBe('complete');
    // All notes should be marked as hit (missed)
    expect(state.fallingNotes.every(n => n.hit)).toBe(true);
  });

  it('score resets to 0 when creating new game engine', () => {
    const config = makeConfig();
    const notes = makeNotes([1, 2]);

    // First game - play and hit a note
    let state1 = createGameEngine(config, notes, 5);
    state1 = startPlaying(state1);
    state1 = { ...state1, currentTime: 1.0 };
    state1 = handleNoteInput(state1, 60, performance.now(), CANVAS_HEIGHT);
    expect(state1.score.points).toBeGreaterThan(0);

    // Create new game engine - score should be fresh
    const state2 = createGameEngine(config, notes, 5);
    expect(state2.score.points).toBe(0);
    expect(state2.score.combo).toBe(0);
    expect(state2.score.maxCombo).toBe(0);
    expect(state2.score.perfect).toBe(0);
    expect(state2.score.great).toBe(0);
    expect(state2.score.good).toBe(0);
    expect(state2.score.miss).toBe(0);
    expect(state2.score.accuracy).toBe(100);
    expect(state2.currentTime).toBe(0);
    expect(state2.fallingNotes.every(n => !n.hit)).toBe(true);
  });

  it('short exercise notes (curriculum) complete properly', () => {
    const config = makeConfig();
    // Short curriculum-style exercise: 3 notes in 3 seconds
    const notes = makeNotes([0.5, 1.0, 1.5]);
    // Duration calculated like curriculum: max(time + duration, 30) but let's test with short duration
    const duration = 2.5;

    let state = createGameEngine(config, notes, duration);
    expect(state.fallingNotes.length).toBe(3);

    state = startPlaying(state);

    // Advance past everything
    for (let i = 0; i < 400; i++) {
      state = updateGame(state, 20, CANVAS_HEIGHT);
      if (state.gameState === 'complete') break;
    }

    expect(state.gameState).toBe('complete');
  });

  it('handles game with no notes gracefully', () => {
    const config = makeConfig();
    const notes: SongNote[] = [];
    const duration = 2;

    let state = createGameEngine(config, notes, duration);
    expect(state.fallingNotes.length).toBe(0);

    state = startPlaying(state);

    // Advance past duration
    for (let i = 0; i < 300; i++) {
      state = updateGame(state, 20, CANVAS_HEIGHT);
      if (state.gameState === 'complete') break;
    }

    expect(state.gameState).toBe('complete');
  });

  it('second game after first is fully independent', () => {
    const config1 = makeConfig();
    const notes1 = makeNotes([1, 2]);

    // First game
    let state1 = createGameEngine(config1, notes1, 5);
    state1 = startPlaying(state1);
    state1 = { ...state1, currentTime: 1.0 };
    state1 = handleNoteInput(state1, 60, performance.now(), CANVAS_HEIGHT);
    const score1 = state1.score.points;

    // Second game with different notes
    const config2 = makeConfig('medium');
    const notes2 = makeNotes([1, 2, 3, 4]);
    let state2 = createGameEngine(config2, notes2, 8);

    expect(state2.score.points).toBe(0);
    expect(state2.fallingNotes.length).toBe(4);
    expect(state2.config.songId).toBe('test-song');
    expect(state2.gameState).toBe('idle');
  });
});
