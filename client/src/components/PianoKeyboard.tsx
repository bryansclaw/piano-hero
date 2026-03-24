import React, { useCallback } from 'react';
import { isBlackKey, midiToNoteName } from '../utils/midiUtils';
import { PIANO_MIN_NOTE, PIANO_MAX_NOTE } from '../utils/constants';

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
            {showNoteNames && note % 12 === 0 && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-slate-500">
                {midiToNoteName(note)}
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
