import { describe, it, expect } from 'vitest';
import {
  midiToNoteName,
  noteNameToMidi,
  midiToPitchClass,
  midiToOctave,
  isBlackKey,
  midiToFrequency,
  clampToKeyboard,
} from '../midiUtils';

describe('midiUtils', () => {
  describe('midiToNoteName', () => {
    it('converts middle C', () => {
      expect(midiToNoteName(60)).toBe('C4');
    });

    it('converts A4 (concert pitch)', () => {
      expect(midiToNoteName(69)).toBe('A4');
    });

    it('converts lowest piano key', () => {
      expect(midiToNoteName(21)).toBe('A0');
    });

    it('converts highest piano key', () => {
      expect(midiToNoteName(108)).toBe('C8');
    });

    it('uses flats when requested', () => {
      expect(midiToNoteName(61, true)).toBe('Db4');
      expect(midiToNoteName(63, true)).toBe('Eb4');
    });
  });

  describe('noteNameToMidi', () => {
    it('converts C4 to 60', () => {
      expect(noteNameToMidi('C4')).toBe(60);
    });

    it('converts A4 to 69', () => {
      expect(noteNameToMidi('A4')).toBe(69);
    });

    it('handles sharps', () => {
      expect(noteNameToMidi('C#4')).toBe(61);
      expect(noteNameToMidi('F#3')).toBe(54);
    });

    it('returns -1 for invalid input', () => {
      expect(noteNameToMidi('X4')).toBe(-1);
      expect(noteNameToMidi('')).toBe(-1);
    });

    it('roundtrips with midiToNoteName', () => {
      for (let n = 21; n <= 108; n++) {
        const name = midiToNoteName(n);
        expect(noteNameToMidi(name)).toBe(n);
      }
    });
  });

  describe('midiToPitchClass', () => {
    it('returns 0 for C', () => {
      expect(midiToPitchClass(60)).toBe(0);
      expect(midiToPitchClass(72)).toBe(0);
    });

    it('returns 9 for A', () => {
      expect(midiToPitchClass(69)).toBe(9);
    });
  });

  describe('midiToOctave', () => {
    it('returns correct octave for C4', () => {
      expect(midiToOctave(60)).toBe(4);
    });

    it('returns 0 for A0', () => {
      expect(midiToOctave(21)).toBe(0);
    });
  });

  describe('isBlackKey', () => {
    it('C is white', () => {
      expect(isBlackKey(60)).toBe(false);
    });

    it('C# is black', () => {
      expect(isBlackKey(61)).toBe(true);
    });

    it('E is white', () => {
      expect(isBlackKey(64)).toBe(false);
    });

    it('F# is black', () => {
      expect(isBlackKey(66)).toBe(true);
    });

    it('identifies all black keys in an octave', () => {
      // Black keys: C#, D#, F#, G#, A# (1,3,6,8,10)
      const blackInOctave = [1, 3, 6, 8, 10];
      for (let pc = 0; pc < 12; pc++) {
        expect(isBlackKey(60 + pc)).toBe(blackInOctave.includes(pc));
      }
    });
  });

  describe('midiToFrequency', () => {
    it('A4 = 440 Hz', () => {
      expect(midiToFrequency(69)).toBeCloseTo(440, 1);
    });

    it('A3 = 220 Hz', () => {
      expect(midiToFrequency(57)).toBeCloseTo(220, 1);
    });

    it('C4 ≈ 261.63 Hz', () => {
      expect(midiToFrequency(60)).toBeCloseTo(261.63, 0);
    });
  });

  describe('clampToKeyboard', () => {
    it('clamps below range', () => {
      expect(clampToKeyboard(10)).toBe(21);
    });

    it('clamps above range', () => {
      expect(clampToKeyboard(120)).toBe(108);
    });

    it('passes through in-range values', () => {
      expect(clampToKeyboard(60)).toBe(60);
    });
  });
});
