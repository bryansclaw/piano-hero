import React, { useCallback, useEffect, useRef } from 'react';
import { isBlackKey, midiToNoteName } from '../utils/midiUtils';
import { PIANO_MIN_NOTE, PIANO_MAX_NOTE } from '../utils/constants';

// Computer keyboard → MIDI note mapping (2 octaves around middle C)
// Lower row: C4-C5 white keys
// Upper row: C5-C6 white keys
const KEYBOARD_MAP: Record<string, number> = {
  // Lower octave (C4=60 to B4=71) — home row
  'a': 60,  // C4
  'w': 61,  // C#4
  's': 62,  // D4
  'e': 63,  // D#4
  'd': 64,  // E4
  'f': 65,  // F4
  't': 66,  // F#4
  'g': 67,  // G4
  'y': 68,  // G#4
  'h': 69,  // A4
  'u': 70,  // A#4
  'j': 71,  // B4
  // Upper octave (C5=72 to C6=84) — upper row
  'k': 72,  // C5
  'o': 73,  // C#5
  'l': 74,  // D5
  'p': 75,  // D#5
  ';': 76,  // E5
  "'": 77,  // F5
  // Number row for even higher
  'z': 48,  // C3
  'x': 50,  // D3
  'c': 52,  // E3
  'v': 53,  // F3
  'b': 55,  // G3
  'n': 57,  // A3
  'm': 59,  // B3
};

interface PianoKeyboardProps {
  activeNotes: Set<number>;
  expectedNotes?: Set<number>;
  correctNotes?: Set<number>;
  wrongNotes?: Set<number>;
  showNoteNames?: boolean;
  onNoteOn?: (note: number) => void;
  onNoteOff?: (note: number) => void;
}

const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  activeNotes,
  expectedNotes = new Set(),
  correctNotes = new Set(),
  wrongNotes = new Set(),
  showNoteNames = false,
  onNoteOn,
  onNoteOff,
}) => {
  // Track which keyboard keys are currently held down to prevent repeat events
  const heldKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      if (KEYBOARD_MAP[key] !== undefined && !heldKeys.current.has(key)) {
        heldKeys.current.add(key);
        onNoteOn?.(KEYBOARD_MAP[key]);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (KEYBOARD_MAP[key] !== undefined) {
        heldKeys.current.delete(key);
        onNoteOff?.(KEYBOARD_MAP[key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onNoteOn, onNoteOff]);

  // Find the keyboard shortcut for a note (if any)
  const getKeyboardShortcut = useCallback((note: number): string | null => {
    for (const [key, midi] of Object.entries(KEYBOARD_MAP)) {
      if (midi === note) return key === ';' ? ';' : key === "'" ? "'" : key.toUpperCase();
    }
    return null;
  }, []);

  const getKeyColor = useCallback(
    (note: number) => {
      if (correctNotes.has(note)) return '#34d399';
      if (wrongNotes.has(note)) return '#f87171';
      if (expectedNotes.has(note)) return '#22d3ee';
      if (activeNotes.has(note)) return '#ec4899';
      return undefined;
    },
    [activeNotes, expectedNotes, correctNotes, wrongNotes],
  );

  // Build keys
  const whiteKeys: number[] = [];
  const blackKeys: number[] = [];
  for (let n = PIANO_MIN_NOTE; n <= PIANO_MAX_NOTE; n++) {
    if (isBlackKey(n)) {
      blackKeys.push(n);
    } else {
      whiteKeys.push(n);
    }
  }

  const whiteKeyWidth = 100 / whiteKeys.length;

  const getWhiteKeyIndex = (note: number): number => {
    let idx = 0;
    for (let n = PIANO_MIN_NOTE; n <= note; n++) {
      if (!isBlackKey(n)) idx++;
    }
    return idx - 1;
  };

  const getBlackKeyPosition = (note: number): number => {
    const prevWhiteIdx = getWhiteKeyIndex(note - 1);
    return (prevWhiteIdx + 0.65) * whiteKeyWidth;
  };

  return (
    <div
      className="relative w-full select-none touch-none"
      style={{ height: '120px', minHeight: '80px' }}
      role="group"
      aria-label="Piano keyboard"
      data-testid="piano-keyboard"
    >
      {/* White keys */}
      {whiteKeys.map((note) => {
        const idx = getWhiteKeyIndex(note);
        const highlight = getKeyColor(note);
        const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
        return (
          <button
            key={note}
            data-note={note}
            className="absolute top-0 border rounded-b-md transition-colors duration-75"
            style={{
              left: `${idx * whiteKeyWidth}%`,
              width: `${whiteKeyWidth}%`,
              height: '100%',
              backgroundColor: highlight ?? (isDark ? '#e2e8f0' : '#f8fafc'),
              borderColor: isDark ? '#334155' : '#cbd5e1',
              zIndex: 1,
            }}
            onPointerDown={() => onNoteOn?.(note)}
            onPointerUp={() => onNoteOff?.(note)}
            onPointerLeave={() => onNoteOff?.(note)}
            aria-label={midiToNoteName(note)}
          >
            {showNoteNames && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 flex flex-col items-center gap-0.5">
                {note % 12 === 0 && <span>{midiToNoteName(note)}</span>}
                {getKeyboardShortcut(note) && (
                  <span className="bg-slate-200 dark:bg-slate-600 rounded px-1 text-[7px] font-mono text-slate-600 dark:text-slate-300">
                    {getKeyboardShortcut(note)}
                  </span>
                )}
              </span>
            )}
          </button>
        );
      })}

      {/* Black keys */}
      {blackKeys.map((note) => {
        const left = getBlackKeyPosition(note);
        const highlight = getKeyColor(note);
        return (
          <button
            key={note}
            data-note={note}
            className="absolute top-0 rounded-b-md transition-colors duration-75"
            style={{
              left: `${left}%`,
              width: `${whiteKeyWidth * 0.6}%`,
              height: '65%',
              backgroundColor: highlight ?? '#1e293b',
              zIndex: 2,
            }}
            onPointerDown={() => onNoteOn?.(note)}
            onPointerUp={() => onNoteOff?.(note)}
            onPointerLeave={() => onNoteOff?.(note)}
            aria-label={midiToNoteName(note)}
          />
        );
      })}
    </div>
  );
};

export default PianoKeyboard;
