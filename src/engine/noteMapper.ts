import { PIANO_MIN_NOTE, PIANO_MAX_NOTE, NOTE_WIDTH } from '../utils/constants';
import { isBlackKey } from '../utils/midiUtils';

/**
 * Map a MIDI note to an X position on the canvas/keyboard.
 * Returns the center X position for the note within the given canvas width.
 */
export function noteToX(midi: number, canvasWidth: number): number {
  // Count white keys from min to max
  const totalWhiteKeys = countWhiteKeys(PIANO_MIN_NOTE, PIANO_MAX_NOTE);
  const whiteKeyWidth = canvasWidth / totalWhiteKeys;

  if (isBlackKey(midi)) {
    // Black key sits between two white keys
    const prevWhite = midi - 1;
    const whiteIndex = countWhiteKeys(PIANO_MIN_NOTE, prevWhite) - 1;
    return whiteIndex * whiteKeyWidth + whiteKeyWidth * 0.75;
  } else {
    const whiteIndex = countWhiteKeys(PIANO_MIN_NOTE, midi) - 1;
    return whiteIndex * whiteKeyWidth + whiteKeyWidth / 2;
  }
}

/**
 * Get the width of a note rectangle based on whether it's black or white
 */
export function noteDisplayWidth(midi: number, canvasWidth: number): number {
  const totalWhiteKeys = countWhiteKeys(PIANO_MIN_NOTE, PIANO_MAX_NOTE);
  const whiteKeyWidth = canvasWidth / totalWhiteKeys;

  if (isBlackKey(midi)) {
    return Math.max(whiteKeyWidth * 0.6, NOTE_WIDTH * 0.7);
  }
  return Math.max(whiteKeyWidth * 0.85, NOTE_WIDTH);
}

/**
 * Count white keys from low to high (inclusive)
 */
export function countWhiteKeys(low: number, high: number): number {
  let count = 0;
  for (let n = low; n <= high; n++) {
    if (!isBlackKey(n)) count++;
  }
  return count;
}

/**
 * Map canvas X coordinate back to the nearest MIDI note
 */
export function xToNote(x: number, canvasWidth: number): number {
  const totalWhiteKeys = countWhiteKeys(PIANO_MIN_NOTE, PIANO_MAX_NOTE);
  const whiteKeyWidth = canvasWidth / totalWhiteKeys;
  const whiteIndex = Math.floor(x / whiteKeyWidth);

  // Walk white keys to find the MIDI note at this index
  let count = 0;
  for (let n = PIANO_MIN_NOTE; n <= PIANO_MAX_NOTE; n++) {
    if (!isBlackKey(n)) {
      if (count === whiteIndex) return n;
      count++;
    }
  }
  return PIANO_MAX_NOTE;
}

/**
 * Get the visible range of notes that should be rendered
 * based on the song's note range, with some padding
 */
export function getVisibleRange(notes: number[]): { low: number; high: number } {
  if (notes.length === 0) return { low: 48, high: 84 }; // C3 to C6

  const min = Math.min(...notes);
  const max = Math.max(...notes);

  // Pad by an octave on each side
  return {
    low: Math.max(PIANO_MIN_NOTE, min - 12),
    high: Math.min(PIANO_MAX_NOTE, max + 12),
  };
}
