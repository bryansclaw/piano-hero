import type { SongNote, SongData } from '../types';

// Chord definitions (semitones from root)
const CHORD_TYPES: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dom7: [0, 4, 7, 10],
  min7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
};

// Key signatures - map key name to root MIDI base (C4 = 60)
const KEY_ROOTS: Record<string, number> = {
  'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
  'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
  'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71,
};

// Scale intervals
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

interface ChordEvent {
  root: string;
  type: string;
  beats: number;
}

interface SongBlueprint {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  mode: 'major' | 'minor';
  album: string;
  year: number;
  timeSignature: [number, number];
  sections: SectionDef[];
}

interface SectionDef {
  name: string;
  chords: ChordEvent[];
  melodyPattern: number[]; // scale degrees (1-indexed)
  melodyRhythm: number[]; // beats per melody note
  repeat?: number;
}

// Seeded random for reproducibility
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function parseKey(key: string): { root: number; mode: 'major' | 'minor' } {
  const isMinor = key.toLowerCase().includes('m') && !key.includes('M');
  const rootName = key.replace(/m$/i, '').trim();
  const root = KEY_ROOTS[rootName] ?? 60;
  return { root, mode: isMinor ? 'minor' : 'major' };
}

function getScaleNote(root: number, degree: number, mode: 'major' | 'minor'): number {
  const scale = mode === 'major' ? MAJOR_SCALE : MINOR_SCALE;
  // degree is 1-indexed
  const d = ((degree - 1) % 7 + 7) % 7;
  const octaveShift = Math.floor((degree - 1) / 7);
  return root + scale[d] + octaveShift * 12;
}

function chordToNotes(rootName: string, type: string, octave: number): number[] {
  const root = (KEY_ROOTS[rootName] ?? 60) - 60 + (octave * 12 + 48);
  const intervals = CHORD_TYPES[type] ?? CHORD_TYPES.major;
  return intervals.map((i) => root + i);
}

/**
 * Generate all notes (expert level) for a song from its blueprint
 */
function generateFullArrangement(bp: SongBlueprint): SongNote[] {
  const notes: SongNote[] = [];
  const beatDuration = 60 / bp.bpm;
  const { root, mode } = parseKey(bp.key);
  const rand = seededRandom(hashString(bp.id));
  let currentBeat = 0;

  // 2-beat intro rest
  currentBeat += 2;

  for (const section of bp.sections) {
    const repeats = section.repeat ?? 1;
    for (let r = 0; r < repeats; r++) {
      let sectionBeat = 0;

      // Generate chord accompaniment (left hand)
      for (const chord of section.chords) {
        const chordNotes = chordToNotes(chord.root, chord.type, 3); // octave 3 for left hand
        const time = (currentBeat + sectionBeat) * beatDuration;

        // Play chord as broken arpeggio or block chord
        if (rand() > 0.5) {
          // Block chord
          for (const cn of chordNotes) {
            notes.push({
              midi: cn,
              time,
              duration: chord.beats * beatDuration * 0.9,
              velocity: 70 + Math.floor(rand() * 20),
              hand: 'left',
            });
          }
        } else {
          // Arpeggio
          for (let i = 0; i < chordNotes.length; i++) {
            notes.push({
              midi: chordNotes[i],
              time: time + i * beatDuration * 0.25,
              duration: (chord.beats - i * 0.25) * beatDuration * 0.8,
              velocity: 65 + Math.floor(rand() * 20),
              hand: 'left',
            });
          }
        }
        sectionBeat += chord.beats;
      }

      // Generate melody (right hand)
      let melodyBeat = 0;
      const totalSectionBeats = sectionBeat;
      let melIdx = 0;

      while (melodyBeat < totalSectionBeats && melIdx < section.melodyPattern.length * 3) {
        const patIdx = melIdx % section.melodyPattern.length;
        const degree = section.melodyPattern[patIdx];
        const rhythmIdx = melIdx % section.melodyRhythm.length;
        const beats = section.melodyRhythm[rhythmIdx];

        const midiNote = getScaleNote(root + 12, degree, mode); // One octave up for melody
        const time = (currentBeat + melodyBeat) * beatDuration;

        // Add some expression
        const velocity = 80 + Math.floor(rand() * 30);
        const humanize = (rand() - 0.5) * 0.02; // slight timing variation

        notes.push({
          midi: midiNote,
          time: time + humanize,
          duration: beats * beatDuration * 0.85,
          velocity,
          hand: 'right',
        });

        // Occasionally add harmony note
        if (rand() > 0.7 && degree > 2) {
          notes.push({
            midi: getScaleNote(root + 12, degree - 2, mode),
            time: time + humanize,
            duration: beats * beatDuration * 0.7,
            velocity: velocity - 15,
            hand: 'right',
          });
        }

        melodyBeat += beats;
        melIdx++;
      }

      currentBeat += totalSectionBeats;
    }
  }

  // Sort by time
  notes.sort((a, b) => a.time - b.time);
  return notes;
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

// ====== TAYLOR SWIFT SONG BLUEPRINTS ======

const BLUEPRINTS: SongBlueprint[] = [
  {
    id: 'love-story',
    title: 'Love Story',
    artist: 'Taylor Swift',
    bpm: 119,
    key: 'D',
    mode: 'major',
    album: 'Fearless',
    year: 2008,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'intro',
        chords: [
          { root: 'D', type: 'major', beats: 4 },
          { root: 'A', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 6, 5, 3, 1, 2, 3, 5],
        melodyRhythm: [1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1],
      },
      {
        name: 'verse',
        chords: [
          { root: 'D', type: 'major', beats: 4 },
          { root: 'A', type: 'major', beats: 4 },
          { root: 'B', type: 'minor', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 3, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 7, 1, 2, 3],
        melodyRhythm: [1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'G', type: 'major', beats: 4 },
          { root: 'D', type: 'major', beats: 4 },
          { root: 'A', type: 'major', beats: 4 },
          { root: 'B', type: 'minor', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
          { root: 'D', type: 'major', beats: 4 },
          { root: 'A', type: 'major', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 5, 6, 5, 3, 1, 5, 5, 6, 5, 4, 3, 3, 4, 5, 3, 1, 2, 3, 5, 6, 5],
        melodyRhythm: [0.5, 0.5, 1, 0.5, 0.5, 2, 0.5, 0.5, 1, 0.5, 0.5, 2, 0.5, 0.5, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: 'you-belong-with-me',
    title: 'You Belong With Me',
    artist: 'Taylor Swift',
    bpm: 130,
    key: 'G',
    mode: 'major',
    album: 'Fearless',
    year: 2008,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'G', type: 'major', beats: 4 },
          { root: 'D', type: 'major', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 1, 3, 3, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'G', type: 'major', beats: 4 },
          { root: 'D', type: 'major', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 6, 7, 8, 5, 3, 1, 5, 6, 5, 3, 4, 5, 3, 2, 1],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 1, 1, 2, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: 'shake-it-off',
    title: 'Shake It Off',
    artist: 'Taylor Swift',
    bpm: 160,
    key: 'G',
    mode: 'major',
    album: '1989',
    year: 2014,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'G', type: 'major', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'D', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 5, 5, 3, 1, 1, 3, 5, 5, 5, 4, 3, 2, 1, 2, 3],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'G', type: 'major', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'D', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 3, 5, 5, 5, 5, 3, 1, 1, 3, 5, 5, 5, 4, 3, 1],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
        repeat: 3,
      },
    ],
  },
  {
    id: 'blank-space',
    title: 'Blank Space',
    artist: 'Taylor Swift',
    bpm: 96,
    key: 'F',
    mode: 'major',
    album: '1989',
    year: 2014,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'F', type: 'major', beats: 4 },
          { root: 'D', type: 'minor', beats: 4 },
          { root: 'Bb', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 1, 2, 3, 3, 4, 5, 5, 4, 3, 2, 1, 7, 1, 2, 1],
        melodyRhythm: [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'Bb', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'D', type: 'minor', beats: 4 },
          { root: 'Bb', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 6, 5, 3, 1, 5, 6, 7, 8, 5, 3, 1, 3, 5, 6, 5, 3, 2, 1],
        melodyRhythm: [0.5, 0.5, 1, 0.5, 0.5, 2, 0.5, 0.5, 0.5, 0.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 1, 1, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: 'bad-blood',
    title: 'Bad Blood',
    artist: 'Taylor Swift',
    bpm: 170,
    key: 'G',
    mode: 'minor',
    album: '1989',
    year: 2014,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'G', type: 'minor', beats: 4 },
          { root: 'Eb', type: 'major', beats: 4 },
          { root: 'Bb', type: 'major', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 3, 5, 4, 3, 1, 5, 4, 3, 2, 1, 7, 1, 3, 5, 1],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 2],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'G', type: 'minor', beats: 4 },
          { root: 'Eb', type: 'major', beats: 4 },
          { root: 'Bb', type: 'major', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 5, 5, 5, 3, 1, 1, 5, 4, 3, 2, 3, 1, 1, 3, 5],
        melodyRhythm: [1, 0.5, 0.5, 0.5, 0.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: 'style',
    title: 'Style',
    artist: 'Taylor Swift',
    bpm: 95,
    key: 'D',
    mode: 'major',
    album: '1989',
    year: 2014,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'D', type: 'major', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
          { root: 'B', type: 'minor', beats: 4 },
          { root: 'A', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 4, 3, 2, 1, 3, 5, 6, 5, 4, 3, 2, 1, 2, 3, 1],
        melodyRhythm: [1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'G', type: 'major', beats: 4 },
          { root: 'D', type: 'major', beats: 4 },
          { root: 'A', type: 'major', beats: 4 },
          { root: 'B', type: 'minor', beats: 4 },
        ],
        melodyPattern: [5, 5, 6, 5, 3, 1, 5, 5, 4, 3, 2, 3, 5, 6, 5, 3],
        melodyRhythm: [0.5, 0.5, 1, 0.5, 0.5, 2, 0.5, 0.5, 1, 0.5, 0.5, 2, 0.5, 0.5, 1, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: 'wildest-dreams',
    title: 'Wildest Dreams',
    artist: 'Taylor Swift',
    bpm: 70,
    key: 'C',
    mode: 'major',
    album: '1989',
    year: 2014,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'C', type: 'major', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
        ],
        melodyPattern: [3, 3, 4, 5, 5, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1, 1],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 1, 2],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'F', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 6, 7, 8, 5, 3, 1, 5, 6, 5, 3, 1, 2, 3, 5, 6, 5],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 1, 1, 2, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: 'anti-hero',
    title: 'Anti-Hero',
    artist: 'Taylor Swift',
    bpm: 97,
    key: 'E',
    mode: 'major',
    album: 'Midnights',
    year: 2022,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'E', type: 'major', beats: 4 },
          { root: 'B', type: 'major', beats: 4 },
          { root: 'C#', type: 'minor', beats: 4 },
          { root: 'A', type: 'major', beats: 4 },
        ],
        melodyPattern: [3, 3, 2, 1, 5, 4, 3, 2, 3, 4, 5, 3, 1, 2, 3, 1],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 2],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'A', type: 'major', beats: 4 },
          { root: 'E', type: 'major', beats: 4 },
          { root: 'B', type: 'major', beats: 4 },
          { root: 'C#', type: 'minor', beats: 4 },
          { root: 'A', type: 'major', beats: 4 },
          { root: 'E', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 5, 3, 1, 5, 6, 5, 3, 1, 3, 5, 6, 5, 3, 2, 1],
        melodyRhythm: [0.5, 0.5, 1, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: 'cruel-summer',
    title: 'Cruel Summer',
    artist: 'Taylor Swift',
    bpm: 170,
    key: 'A',
    mode: 'major',
    album: 'Lover',
    year: 2019,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'A', type: 'major', beats: 4 },
          { root: 'B', type: 'major', beats: 4 },
          { root: 'C#', type: 'minor', beats: 4 },
          { root: 'E', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 2, 3, 5, 5, 4, 3, 2, 1, 3, 5, 6, 5, 3, 2, 1],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'A', type: 'major', beats: 4 },
          { root: 'E', type: 'major', beats: 4 },
          { root: 'B', type: 'major', beats: 4 },
          { root: 'C#', type: 'minor', beats: 4 },
        ],
        melodyPattern: [5, 5, 6, 7, 8, 5, 3, 1, 5, 5, 6, 5, 3, 4, 3, 1],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 2],
        repeat: 3,
      },
    ],
  },
  {
    id: 'all-too-well',
    title: 'All Too Well',
    artist: 'Taylor Swift',
    bpm: 93,
    key: 'C',
    mode: 'major',
    album: 'Red',
    year: 2012,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'C', type: 'major', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 2, 3, 5, 5, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1, 7],
        melodyRhythm: [1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'F', type: 'major', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
        ],
        melodyPattern: [5, 5, 6, 7, 8, 7, 6, 5, 3, 1, 3, 5, 6, 5, 3, 2, 1, 2, 3, 5],
        melodyRhythm: [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: 'enchanted',
    title: 'Enchanted',
    artist: 'Taylor Swift',
    bpm: 130,
    key: 'Bb',
    mode: 'major',
    album: 'Speak Now',
    year: 2010,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'Bb', type: 'major', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
          { root: 'G', type: 'minor', beats: 4 },
          { root: 'Eb', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 3, 5, 5, 4, 3, 2, 3, 4, 5, 6, 5, 3, 2, 1, 1],
        melodyRhythm: [1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'Eb', type: 'major', beats: 4 },
          { root: 'Bb', type: 'major', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
          { root: 'G', type: 'minor', beats: 4 },
          { root: 'Eb', type: 'major', beats: 4 },
          { root: 'Bb', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 6, 7, 8, 5, 3, 1, 5, 6, 5, 3, 1, 3, 5, 6, 5],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 1, 1, 2, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: 'cardigan',
    title: 'Cardigan',
    artist: 'Taylor Swift',
    bpm: 130,
    key: 'Ab',
    mode: 'major',
    album: 'Folklore',
    year: 2020,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'Ab', type: 'major', beats: 4 },
          { root: 'Db', type: 'major', beats: 4 },
          { root: 'F', type: 'minor', beats: 4 },
          { root: 'Eb', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 2, 3, 3, 2, 1, 5, 4, 3, 4, 5, 3, 2, 1, 7, 1],
        melodyRhythm: [1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'Db', type: 'major', beats: 4 },
          { root: 'Ab', type: 'major', beats: 4 },
          { root: 'Eb', type: 'major', beats: 4 },
          { root: 'F', type: 'minor', beats: 4 },
        ],
        melodyPattern: [5, 5, 6, 5, 3, 1, 3, 5, 6, 7, 5, 3, 4, 5, 3, 1],
        melodyRhythm: [0.5, 0.5, 1, 0.5, 0.5, 2, 0.5, 0.5, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: 'willow',
    title: 'Willow',
    artist: 'Taylor Swift',
    bpm: 130,
    key: 'D',
    mode: 'minor',
    album: 'Evermore',
    year: 2020,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'D', type: 'minor', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'Bb', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 3, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 7, 1, 2, 3],
        melodyRhythm: [1, 0.5, 0.5, 0.5, 0.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 1],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'F', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'D', type: 'minor', beats: 4 },
          { root: 'Bb', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 5, 6, 5, 3, 1, 2, 3, 5, 6, 7, 5, 3, 2, 1, 1],
        melodyRhythm: [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: 'lover',
    title: 'Lover',
    artist: 'Taylor Swift',
    bpm: 68,
    key: 'G',
    mode: 'major',
    album: 'Lover',
    year: 2019,
    timeSignature: [3, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'G', type: 'major', beats: 3 },
          { root: 'D', type: 'major', beats: 3 },
          { root: 'E', type: 'minor', beats: 3 },
          { root: 'C', type: 'major', beats: 3 },
        ],
        melodyPattern: [1, 3, 5, 4, 3, 2, 3, 4, 5, 3, 2, 1],
        melodyRhythm: [1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'C', type: 'major', beats: 3 },
          { root: 'G', type: 'major', beats: 3 },
          { root: 'D', type: 'major', beats: 3 },
          { root: 'E', type: 'minor', beats: 3 },
          { root: 'C', type: 'major', beats: 3 },
          { root: 'G', type: 'major', beats: 3 },
        ],
        melodyPattern: [5, 6, 5, 3, 1, 5, 6, 7, 5, 3, 2, 1, 3, 5, 6, 5, 3, 1],
        melodyRhythm: [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 1],
        repeat: 3,
      },
    ],
  },
  {
    id: 'delicate',
    title: 'Delicate',
    artist: 'Taylor Swift',
    bpm: 95,
    key: 'C',
    mode: 'major',
    album: 'Reputation',
    year: 2017,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'C', type: 'major', beats: 4 },
          { root: 'D', type: 'minor', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 1, 2, 3, 3, 2, 1, 5, 5, 4, 3, 2, 3, 4, 5, 3],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 2],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'F', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 5, 3, 1, 5, 6, 5, 3, 1, 3, 5, 6, 5, 3, 2, 1],
        melodyRhythm: [0.5, 0.5, 1, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: '22',
    title: '22',
    artist: 'Taylor Swift',
    bpm: 104,
    key: 'G',
    mode: 'major',
    album: 'Red',
    year: 2012,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'G', type: 'major', beats: 4 },
          { root: 'D', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'E', type: 'minor', beats: 4 },
        ],
        melodyPattern: [1, 3, 5, 5, 3, 1, 2, 3, 5, 5, 4, 3, 2, 3, 4, 5],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'G', type: 'major', beats: 4 },
          { root: 'D', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'E', type: 'minor', beats: 4 },
        ],
        melodyPattern: [5, 6, 5, 3, 1, 1, 3, 5, 5, 4, 3, 2, 1, 3, 5, 6],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 2],
        repeat: 3,
      },
    ],
  },
  {
    id: 'we-are-never-getting-back-together',
    title: 'We Are Never Getting Back Together',
    artist: 'Taylor Swift',
    bpm: 86,
    key: 'G',
    mode: 'major',
    album: 'Red',
    year: 2012,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'G', type: 'major', beats: 4 },
          { root: 'D', type: 'major', beats: 4 },
          { root: 'E', type: 'minor', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 5, 5, 3, 1, 1, 3, 5, 4, 3, 2, 1, 2, 3, 4, 5],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'G', type: 'major', beats: 4 },
          { root: 'D', type: 'major', beats: 4 },
          { root: 'E', type: 'minor', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 3, 5, 5, 5, 5, 3, 1, 1, 3, 5, 5, 4, 3, 2, 1],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 2],
        repeat: 3,
      },
    ],
  },
  {
    id: 'i-knew-you-were-trouble',
    title: 'I Knew You Were Trouble',
    artist: 'Taylor Swift',
    bpm: 77,
    key: 'Eb',
    mode: 'major',
    album: 'Red',
    year: 2012,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'Eb', type: 'major', beats: 4 },
          { root: 'Bb', type: 'major', beats: 4 },
          { root: 'C', type: 'minor', beats: 4 },
          { root: 'Ab', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 3, 5, 5, 4, 3, 2, 1, 3, 5, 6, 5, 4, 3, 2, 1],
        melodyRhythm: [1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 1.5],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'Ab', type: 'major', beats: 4 },
          { root: 'Eb', type: 'major', beats: 4 },
          { root: 'Bb', type: 'major', beats: 4 },
          { root: 'C', type: 'minor', beats: 4 },
        ],
        melodyPattern: [5, 5, 6, 5, 3, 1, 5, 5, 4, 3, 2, 3, 5, 6, 5, 3],
        melodyRhythm: [0.5, 0.5, 1, 0.5, 0.5, 2, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 2],
        repeat: 2,
      },
    ],
  },
  {
    id: 'look-what-you-made-me-do',
    title: 'Look What You Made Me Do',
    artist: 'Taylor Swift',
    bpm: 128,
    key: 'A',
    mode: 'minor',
    album: 'Reputation',
    year: 2017,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'E', type: 'major', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
          { root: 'E', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 1, 1, 3, 3, 2, 1, 5, 5, 5, 4, 3, 2, 1, 7, 1],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
          { root: 'E', type: 'major', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
        ],
        melodyPattern: [5, 5, 5, 3, 1, 1, 3, 5, 5, 5, 4, 3, 1, 1, 3, 5],
        melodyRhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2],
        repeat: 3,
      },
    ],
  },
  {
    id: 'fortnight',
    title: 'Fortnight',
    artist: 'Taylor Swift',
    bpm: 112,
    key: 'A',
    mode: 'minor',
    album: 'The Tortured Poets Department',
    year: 2024,
    timeSignature: [4, 4],
    sections: [
      {
        name: 'verse',
        chords: [
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
        ],
        melodyPattern: [1, 2, 3, 3, 2, 1, 5, 4, 3, 4, 5, 3, 2, 1, 7, 1],
        melodyRhythm: [1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 2],
        repeat: 2,
      },
      {
        name: 'chorus',
        chords: [
          { root: 'F', type: 'major', beats: 4 },
          { root: 'C', type: 'major', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
          { root: 'A', type: 'minor', beats: 4 },
          { root: 'F', type: 'major', beats: 4 },
          { root: 'G', type: 'major', beats: 4 },
        ],
        melodyPattern: [5, 5, 6, 5, 3, 1, 3, 5, 6, 7, 5, 3, 2, 1, 2, 3],
        melodyRhythm: [0.5, 0.5, 1, 0.5, 0.5, 2, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 1.5],
        repeat: 2,
      },
    ],
  },
];

/**
 * Generate a complete SongData object from a blueprint
 */
export function generateSong(bp: SongBlueprint): SongData {
  const expertNotes = generateFullArrangement(bp);
  const duration = expertNotes.length > 0
    ? expertNotes[expertNotes.length - 1].time + expertNotes[expertNotes.length - 1].duration + 2
    : 120;

  return {
    id: bp.id,
    title: bp.title,
    artist: bp.artist,
    bpm: bp.bpm,
    key: bp.key,
    duration,
    notes: {
      easy: expertNotes,
      medium: expertNotes,
      hard: expertNotes,
      expert: expertNotes,
    },
  };
}

/**
 * Generate all songs in the catalog
 */
export function generateAllSongs(): SongData[] {
  return BLUEPRINTS.map(generateSong);
}

/**
 * Get all song blueprints (for metadata)
 */
export function getSongBlueprints(): SongBlueprint[] {
  return BLUEPRINTS;
}

export type { SongBlueprint };
