import { describe, it, expect } from 'vitest';
import { DIFFICULTY_PRESETS, getNotesForDifficulty, isDifficultyUnlocked } from '../difficulty';
import type { SongNote, Difficulty } from '../../types';

function makeNotes(count: number, spacing: number, hand: 'left' | 'right' = 'right'): SongNote[] {
  return Array.from({ length: count }, (_, i) => ({
    midi: 60 + (i % 12),
    time: i * spacing,
    duration: 0.3,
    velocity: 80,
    hand,
  }));
}

describe('difficulty', () => {
  describe('DIFFICULTY_PRESETS', () => {
    it('has all four difficulty levels', () => {
      expect(DIFFICULTY_PRESETS.easy).toBeDefined();
      expect(DIFFICULTY_PRESETS.medium).toBeDefined();
      expect(DIFFICULTY_PRESETS.hard).toBeDefined();
      expect(DIFFICULTY_PRESETS.expert).toBeDefined();
    });

    it('easy has slowest fall speed', () => {
      expect(DIFFICULTY_PRESETS.easy.fallSpeed).toBeLessThan(DIFFICULTY_PRESETS.medium.fallSpeed);
      expect(DIFFICULTY_PRESETS.medium.fallSpeed).toBeLessThan(DIFFICULTY_PRESETS.hard.fallSpeed);
      expect(DIFFICULTY_PRESETS.hard.fallSpeed).toBeLessThan(DIFFICULTY_PRESETS.expert.fallSpeed);
    });

    it('easy has widest timing windows', () => {
      expect(DIFFICULTY_PRESETS.easy.timingWindows.perfect).toBeGreaterThan(
        DIFFICULTY_PRESETS.expert.timingWindows.perfect,
      );
    });

    it('easy requires 0 stars to unlock', () => {
      expect(DIFFICULTY_PRESETS.easy.unlockStars).toBe(0);
    });

    it('medium/hard/expert require 3 stars', () => {
      expect(DIFFICULTY_PRESETS.medium.unlockStars).toBe(3);
      expect(DIFFICULTY_PRESETS.hard.unlockStars).toBe(3);
      expect(DIFFICULTY_PRESETS.expert.unlockStars).toBe(3);
    });
  });

  describe('getNotesForDifficulty', () => {
    it('easy filters to right hand only and thins notes', () => {
      const notes = [
        ...makeNotes(10, 0.1, 'right'),
        ...makeNotes(10, 0.1, 'left'),
      ];
      const easyNotes = getNotesForDifficulty(notes, 'easy');
      // Should only have right hand notes
      expect(easyNotes.every((n) => n.hand === 'right')).toBe(true);
      // Should be thinned out (spaced at least 0.3s apart)
      expect(easyNotes.length).toBeLessThan(notes.length);
    });

    it('medium includes both hands but thins', () => {
      const notes = makeNotes(20, 0.1, 'right');
      const medNotes = getNotesForDifficulty(notes, 'medium');
      expect(medNotes.length).toBeLessThan(notes.length);
    });

    it('hard returns all notes', () => {
      const notes = makeNotes(20, 0.5, 'right');
      const hardNotes = getNotesForDifficulty(notes, 'hard');
      expect(hardNotes.length).toBe(notes.length);
    });

    it('expert returns all notes', () => {
      const notes = makeNotes(20, 0.5, 'right');
      const expertNotes = getNotesForDifficulty(notes, 'expert');
      expect(expertNotes.length).toBe(notes.length);
    });
  });

  describe('isDifficultyUnlocked', () => {
    it('easy is always unlocked', () => {
      expect(isDifficultyUnlocked('easy', { easy: 0, medium: 0, hard: 0, expert: 0 })).toBe(true);
    });

    it('medium is locked without 3 stars on easy', () => {
      expect(isDifficultyUnlocked('medium', { easy: 2, medium: 0, hard: 0, expert: 0 })).toBe(false);
    });

    it('medium is unlocked with 3+ stars on easy', () => {
      expect(isDifficultyUnlocked('medium', { easy: 3, medium: 0, hard: 0, expert: 0 })).toBe(true);
    });

    it('hard requires 3 stars on medium', () => {
      expect(isDifficultyUnlocked('hard', { easy: 5, medium: 2, hard: 0, expert: 0 })).toBe(false);
      expect(isDifficultyUnlocked('hard', { easy: 5, medium: 3, hard: 0, expert: 0 })).toBe(true);
    });

    it('expert requires 3 stars on hard', () => {
      expect(isDifficultyUnlocked('expert', { easy: 5, medium: 5, hard: 2, expert: 0 })).toBe(false);
      expect(isDifficultyUnlocked('expert', { easy: 5, medium: 5, hard: 4, expert: 0 })).toBe(true);
    });
  });
});
