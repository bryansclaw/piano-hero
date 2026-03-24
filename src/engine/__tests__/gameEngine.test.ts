import { describe, it, expect } from 'vitest';
import {
  createGameEngine,
  startCountdown,
  startPlaying,
  pauseGame,
  resumeGame,
  completeGame,
  updateGame,
  handleNoteInput,
} from '../gameEngine';
import type { GameConfig, SongNote } from '../../types';
import { TIMING_WINDOWS, FALL_SPEEDS } from '../../utils/constants';

const testConfig: GameConfig = {
  difficulty: 'medium',
  songId: 'test-song',
  fallSpeed: FALL_SPEEDS.medium,
  timingWindows: TIMING_WINDOWS.medium,
};

const testNotes: SongNote[] = [
  { midi: 60, time: 2, duration: 0.5, velocity: 80, hand: 'right' },
  { midi: 62, time: 3, duration: 0.5, velocity: 80, hand: 'right' },
  { midi: 64, time: 4, duration: 0.5, velocity: 80, hand: 'right' },
];

const CANVAS_HEIGHT = 600;

describe('gameEngine', () => {
  describe('createGameEngine', () => {
    it('creates initial state', () => {
      const state = createGameEngine(testConfig, testNotes, 10);
      expect(state.gameState).toBe('idle');
      expect(state.fallingNotes.length).toBe(3);
      expect(state.score.points).toBe(0);
      expect(state.currentTime).toBe(0);
      expect(state.songDuration).toBe(10);
    });

    it('maps notes to falling notes', () => {
      const state = createGameEngine(testConfig, testNotes, 10);
      expect(state.fallingNotes[0].midi).toBe(60);
      expect(state.fallingNotes[1].midi).toBe(62);
      expect(state.fallingNotes[2].midi).toBe(64);
      expect(state.fallingNotes.every((n) => !n.hit)).toBe(true);
    });
  });

  describe('state transitions', () => {
    it('idle -> countdown', () => {
      const state = createGameEngine(testConfig, testNotes, 10);
      const next = startCountdown(state);
      expect(next.gameState).toBe('countdown');
      expect(next.countdown).toBe(3);
    });

    it('countdown -> playing', () => {
      let state = createGameEngine(testConfig, testNotes, 10);
      state = startCountdown(state);
      const next = startPlaying(state);
      expect(next.gameState).toBe('playing');
      expect(next.currentTime).toBe(0);
    });

    it('playing -> paused', () => {
      let state = createGameEngine(testConfig, testNotes, 10);
      state = startPlaying(state);
      const next = pauseGame(state);
      expect(next.gameState).toBe('paused');
    });

    it('paused -> playing', () => {
      let state = createGameEngine(testConfig, testNotes, 10);
      state = startPlaying(state);
      state = pauseGame(state);
      const next = resumeGame(state);
      expect(next.gameState).toBe('playing');
    });

    it('cannot pause from idle', () => {
      const state = createGameEngine(testConfig, testNotes, 10);
      const next = pauseGame(state);
      expect(next.gameState).toBe('idle');
    });

    it('cannot resume from playing', () => {
      let state = createGameEngine(testConfig, testNotes, 10);
      state = startPlaying(state);
      const next = resumeGame(state);
      expect(next.gameState).toBe('playing');
    });

    it('playing -> complete', () => {
      let state = createGameEngine(testConfig, testNotes, 10);
      state = startPlaying(state);
      const next = completeGame(state);
      expect(next.gameState).toBe('complete');
    });
  });

  describe('updateGame', () => {
    it('advances time', () => {
      let state = createGameEngine(testConfig, testNotes, 10);
      state = startPlaying(state);
      const next = updateGame(state, 100, CANVAS_HEIGHT);
      expect(next.currentTime).toBeGreaterThan(0);
    });

    it('does not update when not playing', () => {
      const state = createGameEngine(testConfig, testNotes, 10);
      const next = updateGame(state, 100, CANVAS_HEIGHT);
      expect(next.currentTime).toBe(0);
    });

    it('updates falling note positions', () => {
      let state = createGameEngine(testConfig, testNotes, 10);
      state = startPlaying(state);
      // Advance time significantly
      state = { ...state, currentTime: 1 };
      const next = updateGame(state, 16, CANVAS_HEIGHT);
      // Notes should have Y positions calculated
      expect(next.fallingNotes.some((n) => n.y !== -100)).toBe(true);
    });

    it('marks missed notes', () => {
      let state = createGameEngine(testConfig, testNotes, 10);
      state = startPlaying(state);
      // Jump far past first note
      state = { ...state, currentTime: 5 };
      const next = updateGame(state, 16, CANVAS_HEIGHT);
      const missedNotes = next.fallingNotes.filter((n) => n.hit && n.rating === 'miss');
      expect(missedNotes.length).toBeGreaterThan(0);
    });

    it('completes game after all notes done and song over', () => {
      let state = createGameEngine(testConfig, testNotes, 5);
      state = startPlaying(state);
      // Mark all notes as hit
      state = {
        ...state,
        currentTime: 8,
        fallingNotes: state.fallingNotes.map((n) => ({ ...n, hit: true, rating: 'perfect' })),
      };
      const next = updateGame(state, 16, CANVAS_HEIGHT);
      expect(next.gameState).toBe('complete');
    });
  });

  describe('handleNoteInput', () => {
    it('matches note and scores', () => {
      let state = createGameEngine(testConfig, testNotes, 10);
      state = startPlaying(state);
      state = { ...state, currentTime: 2.0 }; // Right at first note time
      const next = handleNoteInput(state, 60, performance.now(), CANVAS_HEIGHT);
      const hitNote = next.fallingNotes.find((n) => n.midi === 60);
      expect(hitNote?.hit).toBe(true);
      expect(next.score.points).toBeGreaterThan(0);
    });

    it('does not match wrong note', () => {
      let state = createGameEngine(testConfig, testNotes, 10);
      state = startPlaying(state);
      state = { ...state, currentTime: 2.0 };
      const next = handleNoteInput(state, 65, performance.now(), CANVAS_HEIGHT); // Wrong note
      expect(next.score.points).toBe(0);
    });

    it('ignores input when not playing', () => {
      const state = createGameEngine(testConfig, testNotes, 10);
      const next = handleNoteInput(state, 60, performance.now(), CANVAS_HEIGHT);
      expect(next.score.points).toBe(0);
    });
  });
});
