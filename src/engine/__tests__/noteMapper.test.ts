import { describe, it, expect } from 'vitest';
import { noteToX, noteDisplayWidth, countWhiteKeys, xToNote, getVisibleRange } from '../noteMapper';

describe('noteMapper', () => {
  const canvasWidth = 1200;

  describe('noteToX', () => {
    it('returns a position within canvas bounds', () => {
      const x = noteToX(60, canvasWidth); // Middle C
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(canvasWidth);
    });

    it('higher notes map to higher X values', () => {
      const xC4 = noteToX(60, canvasWidth);
      const xC5 = noteToX(72, canvasWidth);
      expect(xC5).toBeGreaterThan(xC4);
    });

    it('black keys are positioned between white keys', () => {
      const xC4 = noteToX(60, canvasWidth); // C4 (white)
      const xCsharp4 = noteToX(61, canvasWidth); // C#4 (black)
      const xD4 = noteToX(62, canvasWidth); // D4 (white)
      expect(xCsharp4).toBeGreaterThan(xC4);
      expect(xCsharp4).toBeLessThan(xD4);
    });
  });

  describe('noteDisplayWidth', () => {
    it('returns a positive width', () => {
      expect(noteDisplayWidth(60, canvasWidth)).toBeGreaterThan(0);
    });

    it('black keys are narrower than white keys', () => {
      const whiteW = noteDisplayWidth(60, canvasWidth); // C4
      const blackW = noteDisplayWidth(61, canvasWidth); // C#4
      expect(blackW).toBeLessThan(whiteW);
    });
  });

  describe('countWhiteKeys', () => {
    it('counts C4 to C5 as 8 white keys', () => {
      // C4(60), D4(62), E4(64), F4(65), G4(67), A4(69), B4(71), C5(72)
      expect(countWhiteKeys(60, 72)).toBe(8);
    });

    it('counts full 88-key range correctly', () => {
      expect(countWhiteKeys(21, 108)).toBe(52);
    });

    it('counts single key', () => {
      expect(countWhiteKeys(60, 60)).toBe(1); // C is white
      expect(countWhiteKeys(61, 61)).toBe(0); // C# is black
    });
  });

  describe('xToNote', () => {
    it('maps back approximately to the original note', () => {
      const x = noteToX(60, canvasWidth);
      const note = xToNote(x, canvasWidth);
      // Should be close to 60 (exact or neighbor white key)
      expect(Math.abs(note - 60)).toBeLessThanOrEqual(2);
    });
  });

  describe('getVisibleRange', () => {
    it('returns default range for empty notes', () => {
      const range = getVisibleRange([]);
      expect(range.low).toBe(48);
      expect(range.high).toBe(84);
    });

    it('pads by an octave', () => {
      const range = getVisibleRange([60, 72]);
      expect(range.low).toBe(48); // 60 - 12
      expect(range.high).toBe(84); // 72 + 12
    });

    it('clamps to keyboard range', () => {
      const range = getVisibleRange([22, 107]);
      expect(range.low).toBe(21); // clamped to min
      expect(range.high).toBe(108); // clamped to max
    });
  });
});
