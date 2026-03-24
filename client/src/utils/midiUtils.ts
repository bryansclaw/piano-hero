const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Convert MIDI note number to note name + octave (e.g., 60 -> "C4")
 */
export function midiToNoteName(midi: number, useFlats = false): string {
  const names = useFlats ? FLAT_NAMES : NOTE_NAMES;
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${names[noteIndex]}${octave}`;
}

/**
 * Convert note name + octave to MIDI number (e.g., "C4" -> 60)
 */
export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!match) return -1;

  let notePart = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);

  // Handle flats by converting to sharp equivalent
  const flatToSharp: Record<string, string> = {
    'DB': 'C#', 'EB': 'D#', 'FB': 'E', 'GB': 'F#', 'AB': 'G#', 'BB': 'A#', 'CB': 'B',
  };
  if (notePart.includes('B') && notePart.length === 2) {
    notePart = flatToSharp[notePart] ?? notePart;
  }

  const index = NOTE_NAMES.indexOf(notePart);
  if (index === -1) return -1;
  return (octave + 1) * 12 + index;
}

/**
 * Get pitch class (0-11) from MIDI number
 */
export function midiToPitchClass(midi: number): number {
  return midi % 12;
}

/**
 * Get octave from MIDI number
 */
export function midiToOctave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

/**
 * Check if MIDI note is a black key
 */
export function isBlackKey(midi: number): boolean {
  const pc = midi % 12;
  return [1, 3, 6, 8, 10].includes(pc);
}

/**
 * Get frequency in Hz from MIDI note
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Clamp MIDI note to valid 88-key piano range
 */
export function clampToKeyboard(midi: number): number {
  return Math.max(21, Math.min(108, midi));
}
