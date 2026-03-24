import type { SkillPathData, SkillPath, Lesson, SongNote, PracticePlan, PracticePlanActivity, AnalyticsData } from '../types';

const CURRICULUM_KEY = 'piano-hero-curriculum';

// ===== Note generation helpers =====
function makeNote(midi: number, time: number, duration: number, hand: 'left' | 'right' = 'right', velocity = 80): SongNote {
  return { midi, time, duration, velocity, hand };
}

function makeScale(root: number, intervals: number[], startTime: number, noteDuration: number, gap: number, hand: 'left' | 'right' = 'right'): SongNote[] {
  return intervals.map((interval, i) =>
    makeNote(root + interval, startTime + i * gap, noteDuration, hand)
  );
}

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11, 12];
// Minor intervals for future use
// const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10, 12];

// ===== Fundamentals Path =====
function createFundamentalsLessons(): Lesson[] {
  return [
    {
      id: 'fund-01', pathId: 'fundamentals', order: 1,
      title: 'Middle C Position',
      description: 'Learn where middle C is and play it with proper hand position.',
      explanation: 'Middle C (MIDI 60) is the foundation of piano. Place your right thumb on it. Keep your wrist relaxed and fingers curved.',
      exerciseNotes: [
        makeNote(60, 0, 0.8), makeNote(60, 1, 0.8), makeNote(60, 2, 0.8), makeNote(60, 3, 0.8),
        makeNote(60, 4, 0.8), makeNote(60, 62, 1.6), makeNote(60, 6, 0.8), makeNote(60, 7, 0.8),
      ],
      exerciseBpm: 80, passingAccuracy: 70, prerequisites: [], completed: false, bestAccuracy: 0,
    },
    {
      id: 'fund-02', pathId: 'fundamentals', order: 2,
      title: 'C-D-E Right Hand',
      description: 'Play C, D, E with fingers 1, 2, 3.',
      explanation: 'Use your thumb (1) for C, index finger (2) for D, and middle finger (3) for E. Keep even pressure.',
      exerciseNotes: [
        makeNote(60, 0, 0.8), makeNote(62, 1, 0.8), makeNote(64, 2, 0.8),
        makeNote(62, 3, 0.8), makeNote(60, 4, 0.8), makeNote(62, 5, 0.8),
        makeNote(64, 6, 0.8), makeNote(64, 7, 1.6),
      ],
      exerciseBpm: 80, passingAccuracy: 70, prerequisites: ['fund-01'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'fund-03', pathId: 'fundamentals', order: 3,
      title: 'Five-Finger Position (C-G)',
      description: 'Play C through G using all five fingers.',
      explanation: 'Place each finger on C-D-E-F-G. This five-finger position is the basis for many melodies.',
      exerciseNotes: [
        makeNote(60, 0, 0.8), makeNote(62, 1, 0.8), makeNote(64, 2, 0.8),
        makeNote(65, 3, 0.8), makeNote(67, 4, 0.8), makeNote(65, 5, 0.8),
        makeNote(64, 6, 0.8), makeNote(62, 7, 0.8), makeNote(60, 8, 1.6),
      ],
      exerciseBpm: 90, passingAccuracy: 75, prerequisites: ['fund-02'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'fund-04', pathId: 'fundamentals', order: 4,
      title: 'Left Hand Basics',
      description: 'Mirror the five-finger position with your left hand.',
      explanation: 'Left hand uses fingers 5-4-3-2-1 for C-D-E-F-G below middle C.',
      exerciseNotes: [
        makeNote(48, 0, 0.8, 'left'), makeNote(50, 1, 0.8, 'left'), makeNote(52, 2, 0.8, 'left'),
        makeNote(53, 3, 0.8, 'left'), makeNote(55, 4, 0.8, 'left'), makeNote(53, 5, 0.8, 'left'),
        makeNote(52, 6, 0.8, 'left'), makeNote(50, 7, 0.8, 'left'), makeNote(48, 8, 1.6, 'left'),
      ],
      exerciseBpm: 80, passingAccuracy: 70, prerequisites: ['fund-03'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'fund-05', pathId: 'fundamentals', order: 5,
      title: 'Both Hands Together',
      description: 'Play simple patterns with both hands simultaneously.',
      explanation: 'Start slow. Play the same note in both hands, then gradually add independence.',
      exerciseNotes: [
        makeNote(60, 0, 0.8), makeNote(48, 0, 0.8, 'left'),
        makeNote(62, 1, 0.8), makeNote(50, 1, 0.8, 'left'),
        makeNote(64, 2, 0.8), makeNote(52, 2, 0.8, 'left'),
        makeNote(62, 3, 0.8), makeNote(50, 3, 0.8, 'left'),
        makeNote(60, 4, 1.6), makeNote(48, 4, 1.6, 'left'),
      ],
      exerciseBpm: 70, passingAccuracy: 65, prerequisites: ['fund-04'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'fund-06', pathId: 'fundamentals', order: 6,
      title: 'Quarter & Half Notes',
      description: 'Practice different note durations.',
      explanation: 'Quarter notes get one beat, half notes get two. Count steadily: 1-2-3-4.',
      exerciseNotes: [
        makeNote(60, 0, 0.5), makeNote(62, 0.5, 0.5), makeNote(64, 1, 1),
        makeNote(62, 2, 0.5), makeNote(60, 2.5, 0.5), makeNote(64, 3, 1),
        makeNote(67, 4, 2),
      ],
      exerciseBpm: 90, passingAccuracy: 75, prerequisites: ['fund-05'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'fund-07', pathId: 'fundamentals', order: 7,
      title: 'Eighth Notes',
      description: 'Subdivide the beat into eighth notes.',
      explanation: 'Eighth notes are twice as fast as quarter notes. Count: 1-and-2-and-3-and-4-and.',
      exerciseNotes: [
        ...Array.from({ length: 8 }, (_, i) => makeNote(60 + (i % 5) * 2, i * 0.5, 0.4)),
        makeNote(60, 4, 2),
      ],
      exerciseBpm: 90, passingAccuracy: 70, prerequisites: ['fund-06'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'fund-08', pathId: 'fundamentals', order: 8,
      title: 'C Major Scale - Right Hand',
      description: 'Play the complete C major scale ascending and descending.',
      explanation: 'C-D-E-F-G-A-B-C. Thumb crosses under after E to reach F. Practice the thumb crossing slowly.',
      exerciseNotes: [
        ...makeScale(60, MAJOR_INTERVALS, 0, 0.7, 0.8),
        ...makeScale(60, [...MAJOR_INTERVALS].reverse(), 6.4, 0.7, 0.8),
      ],
      exerciseBpm: 80, passingAccuracy: 75, prerequisites: ['fund-07'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'fund-09', pathId: 'fundamentals', order: 9,
      title: 'G Major Scale',
      description: 'Learn the G major scale with one sharp (F#).',
      explanation: 'G-A-B-C-D-E-F#-G. Note the F# — the first accidental you\'ll encounter.',
      exerciseNotes: [
        ...makeScale(55, [0, 2, 4, 5, 7, 9, 11, 12], 0, 0.7, 0.8),
        ...makeScale(55, [12, 11, 9, 7, 5, 4, 2, 0], 6.4, 0.7, 0.8),
      ],
      exerciseBpm: 80, passingAccuracy: 75, prerequisites: ['fund-08'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'fund-10', pathId: 'fundamentals', order: 10,
      title: 'Simple Melody',
      description: 'Put it all together with a simple melody using both hands.',
      explanation: 'Apply everything you\'ve learned. Right hand plays melody, left hand holds bass notes.',
      exerciseNotes: [
        makeNote(60, 0, 0.8), makeNote(48, 0, 2, 'left'),
        makeNote(62, 1, 0.8), makeNote(64, 2, 0.8),
        makeNote(60, 3, 0.8), makeNote(48, 2, 2, 'left'),
        makeNote(67, 4, 1.6), makeNote(55, 4, 2, 'left'),
        makeNote(65, 6, 0.8), makeNote(64, 7, 0.8),
        makeNote(62, 8, 0.8), makeNote(48, 6, 3, 'left'),
        makeNote(60, 9, 2),
      ],
      exerciseBpm: 85, passingAccuracy: 70, prerequisites: ['fund-09'], completed: false, bestAccuracy: 0,
    },
  ];
}

// ===== Chords Path =====
function createChordsLessons(): Lesson[] {
  return [
    {
      id: 'chord-01', pathId: 'chords', order: 1,
      title: 'C Major Triad',
      description: 'Play the C major chord: C-E-G.',
      explanation: 'A major triad is built with the 1st, 3rd, and 5th notes of the scale. C major = C, E, G.',
      exerciseNotes: [
        makeNote(60, 0, 1.5), makeNote(64, 0, 1.5), makeNote(67, 0, 1.5),
        makeNote(60, 2, 1.5), makeNote(64, 2, 1.5), makeNote(67, 2, 1.5),
        makeNote(60, 4, 1.5), makeNote(64, 4, 1.5), makeNote(67, 4, 1.5),
        makeNote(60, 6, 2), makeNote(64, 6, 2), makeNote(67, 6, 2),
      ],
      exerciseBpm: 70, passingAccuracy: 65, prerequisites: [], completed: false, bestAccuracy: 0,
    },
    {
      id: 'chord-02', pathId: 'chords', order: 2,
      title: 'F & G Major Triads',
      description: 'Learn F major (F-A-C) and G major (G-B-D).',
      explanation: 'These are the most common chords to pair with C major. Together they form the I-IV-V progression.',
      exerciseNotes: [
        makeNote(65, 0, 1.5), makeNote(69, 0, 1.5), makeNote(72, 0, 1.5),
        makeNote(67, 2, 1.5), makeNote(71, 2, 1.5), makeNote(74, 2, 1.5),
        makeNote(60, 4, 1.5), makeNote(64, 4, 1.5), makeNote(67, 4, 1.5),
        makeNote(65, 6, 1.5), makeNote(69, 6, 1.5), makeNote(72, 6, 1.5),
        makeNote(67, 8, 2), makeNote(71, 8, 2), makeNote(74, 8, 2),
      ],
      exerciseBpm: 65, passingAccuracy: 65, prerequisites: ['chord-01'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'chord-03', pathId: 'chords', order: 3,
      title: 'Minor Triads',
      description: 'Learn Am, Dm, and Em minor triads.',
      explanation: 'Minor triads lower the 3rd by a half step. A minor = A, C, E.',
      exerciseNotes: [
        makeNote(69, 0, 1.5), makeNote(72, 0, 1.5), makeNote(76, 0, 1.5),
        makeNote(62, 2, 1.5), makeNote(65, 2, 1.5), makeNote(69, 2, 1.5),
        makeNote(64, 4, 1.5), makeNote(67, 4, 1.5), makeNote(71, 4, 1.5),
        makeNote(69, 6, 2), makeNote(72, 6, 2), makeNote(76, 6, 2),
      ],
      exerciseBpm: 65, passingAccuracy: 65, prerequisites: ['chord-02'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'chord-04', pathId: 'chords', order: 4,
      title: 'Chord Inversions',
      description: 'Play C major in root position, 1st, and 2nd inversion.',
      explanation: 'Inversions rearrange the notes: Root (C-E-G), 1st (E-G-C), 2nd (G-C-E). Smoother voice leading!',
      exerciseNotes: [
        makeNote(60, 0, 1.5), makeNote(64, 0, 1.5), makeNote(67, 0, 1.5),
        makeNote(64, 2, 1.5), makeNote(67, 2, 1.5), makeNote(72, 2, 1.5),
        makeNote(67, 4, 1.5), makeNote(72, 4, 1.5), makeNote(76, 4, 1.5),
        makeNote(60, 6, 2), makeNote(64, 6, 2), makeNote(67, 6, 2),
      ],
      exerciseBpm: 60, passingAccuracy: 65, prerequisites: ['chord-03'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'chord-05', pathId: 'chords', order: 5,
      title: 'I-IV-V-I Progression',
      description: 'The most fundamental chord progression in music.',
      explanation: 'In C major: C → F → G → C. This progression appears in thousands of songs.',
      exerciseNotes: [
        makeNote(60, 0, 1.5), makeNote(64, 0, 1.5), makeNote(67, 0, 1.5),
        makeNote(48, 0, 1.5, 'left'),
        makeNote(65, 2, 1.5), makeNote(69, 2, 1.5), makeNote(72, 2, 1.5),
        makeNote(53, 2, 1.5, 'left'),
        makeNote(67, 4, 1.5), makeNote(71, 4, 1.5), makeNote(74, 4, 1.5),
        makeNote(55, 4, 1.5, 'left'),
        makeNote(60, 6, 2), makeNote(64, 6, 2), makeNote(67, 6, 2),
        makeNote(48, 6, 2, 'left'),
      ],
      exerciseBpm: 60, passingAccuracy: 60, prerequisites: ['chord-04'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'chord-06', pathId: 'chords', order: 6,
      title: 'I-V-vi-IV Pop Progression',
      description: 'The famous pop progression used in countless hits.',
      explanation: 'In C: C → G → Am → F. You\'ll recognize this from many Taylor Swift songs!',
      exerciseNotes: [
        makeNote(60, 0, 1.5), makeNote(64, 0, 1.5), makeNote(67, 0, 1.5),
        makeNote(67, 2, 1.5), makeNote(71, 2, 1.5), makeNote(74, 2, 1.5),
        makeNote(69, 4, 1.5), makeNote(72, 4, 1.5), makeNote(76, 4, 1.5),
        makeNote(65, 6, 1.5), makeNote(69, 6, 1.5), makeNote(72, 6, 1.5),
        makeNote(60, 8, 2), makeNote(64, 8, 2), makeNote(67, 8, 2),
      ],
      exerciseBpm: 65, passingAccuracy: 65, prerequisites: ['chord-05'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'chord-07', pathId: 'chords', order: 7,
      title: 'Seventh Chords',
      description: 'Add the 7th to create richer harmonies.',
      explanation: 'Cmaj7 = C-E-G-B, C7 = C-E-G-Bb, Cm7 = C-Eb-G-Bb. These add color and tension.',
      exerciseNotes: [
        makeNote(60, 0, 1.5), makeNote(64, 0, 1.5), makeNote(67, 0, 1.5), makeNote(71, 0, 1.5),
        makeNote(60, 2, 1.5), makeNote(64, 2, 1.5), makeNote(67, 2, 1.5), makeNote(70, 2, 1.5),
        makeNote(60, 4, 1.5), makeNote(63, 4, 1.5), makeNote(67, 4, 1.5), makeNote(70, 4, 1.5),
        makeNote(60, 6, 2), makeNote(64, 6, 2), makeNote(67, 6, 2), makeNote(71, 6, 2),
      ],
      exerciseBpm: 55, passingAccuracy: 60, prerequisites: ['chord-06'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'chord-08', pathId: 'chords', order: 8,
      title: 'Voicings & Spread Chords',
      description: 'Learn open voicings for fuller sound.',
      explanation: 'Instead of stacking notes close together, spread them across octaves for a bigger sound.',
      exerciseNotes: [
        makeNote(48, 0, 2, 'left'), makeNote(64, 0, 2), makeNote(67, 0, 2), makeNote(72, 0, 2),
        makeNote(53, 2, 2, 'left'), makeNote(65, 2, 2), makeNote(69, 2, 2), makeNote(72, 2, 2),
        makeNote(55, 4, 2, 'left'), makeNote(67, 4, 2), makeNote(71, 4, 2), makeNote(74, 4, 2),
        makeNote(48, 6, 2, 'left'), makeNote(64, 6, 2), makeNote(67, 6, 2), makeNote(72, 6, 2),
      ],
      exerciseBpm: 55, passingAccuracy: 60, prerequisites: ['chord-07'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'chord-09', pathId: 'chords', order: 9,
      title: 'Sus & Add Chords',
      description: 'Explore suspended and added-tone chords.',
      explanation: 'Csus4 = C-F-G, Csus2 = C-D-G, Cadd9 = C-E-G-D. Great for creating ambiguity.',
      exerciseNotes: [
        makeNote(60, 0, 1.5), makeNote(65, 0, 1.5), makeNote(67, 0, 1.5),
        makeNote(60, 2, 1.5), makeNote(62, 2, 1.5), makeNote(67, 2, 1.5),
        makeNote(60, 4, 1.5), makeNote(64, 4, 1.5), makeNote(67, 4, 1.5), makeNote(74, 4, 1.5),
        makeNote(60, 6, 2), makeNote(64, 6, 2), makeNote(67, 6, 2),
      ],
      exerciseBpm: 60, passingAccuracy: 60, prerequisites: ['chord-08'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'chord-10', pathId: 'chords', order: 10,
      title: 'Chord Progressions Medley',
      description: 'Play through multiple progressions smoothly.',
      explanation: 'Combine what you\'ve learned: I-V-vi-IV, ii-V-I, and vi-IV-I-V. Smooth transitions are key.',
      exerciseNotes: [
        makeNote(60, 0, 1), makeNote(64, 0, 1), makeNote(67, 0, 1), makeNote(48, 0, 1, 'left'),
        makeNote(67, 1.5, 1), makeNote(71, 1.5, 1), makeNote(74, 1.5, 1), makeNote(55, 1.5, 1, 'left'),
        makeNote(69, 3, 1), makeNote(72, 3, 1), makeNote(76, 3, 1), makeNote(57, 3, 1, 'left'),
        makeNote(65, 4.5, 1), makeNote(69, 4.5, 1), makeNote(72, 4.5, 1), makeNote(53, 4.5, 1, 'left'),
        makeNote(60, 6, 2), makeNote(64, 6, 2), makeNote(67, 6, 2), makeNote(48, 6, 2, 'left'),
      ],
      exerciseBpm: 65, passingAccuracy: 60, prerequisites: ['chord-09'], completed: false, bestAccuracy: 0,
    },
  ];
}

// ===== Sight Reading Path =====
function createSightReadingLessons(): Lesson[] {
  const lessons: Lesson[] = [];
  const titles = [
    'Single Notes - Treble Clef', 'Single Notes - Bass Clef', 'Steps & Skips',
    'Octave Recognition', 'Sharps & Flats', 'Chord Reading',
    'Rhythm Reading - Quarter/Half', 'Rhythm Reading - Eighth Notes',
    'Mixed Rhythms', 'Full Score Reading',
  ];
  const descriptions = [
    'Identify and play single notes in the treble clef.',
    'Read and play notes in the bass clef.',
    'Recognize step-wise and skip-wise motion.',
    'Quickly identify octave jumps.',
    'Read accidentals (sharps and flats).',
    'Read and play chord symbols.',
    'Read quarter and half note rhythms.',
    'Read eighth note patterns.',
    'Combine different rhythmic values.',
    'Read a full piano score with both clefs.',
  ];

  for (let i = 0; i < 10; i++) {
    const baseNote = 60 + (i % 7) * 2;
    const notes: SongNote[] = Array.from({ length: 8 }, (_, j) =>
      makeNote(baseNote + (j % 5) * (i < 5 ? 2 : 1), j * 0.8, 0.6, i < 2 ? 'right' : (j % 2 === 0 ? 'right' : 'left'))
    );

    lessons.push({
      id: `sight-${String(i + 1).padStart(2, '0')}`,
      pathId: 'sightReading',
      order: i + 1,
      title: titles[i],
      description: descriptions[i],
      explanation: `Practice reading ${titles[i].toLowerCase()} at sight. Focus on quick recognition.`,
      exerciseNotes: notes,
      exerciseBpm: 70 + i * 5,
      passingAccuracy: 65 + i * 2,
      prerequisites: i > 0 ? [`sight-${String(i).padStart(2, '0')}`] : [],
      completed: false,
      bestAccuracy: 0,
    });
  }
  return lessons;
}

// ===== Technique Path =====
function createTechniqueLessons(): Lesson[] {
  return [
    {
      id: 'tech-01', pathId: 'technique', order: 1,
      title: 'Legato Playing',
      description: 'Smooth, connected notes.',
      explanation: 'Hold each note until the next one begins. No gaps between notes.',
      exerciseNotes: makeScale(60, MAJOR_INTERVALS, 0, 0.9, 1),
      exerciseBpm: 70, passingAccuracy: 70, prerequisites: [], completed: false, bestAccuracy: 0,
    },
    {
      id: 'tech-02', pathId: 'technique', order: 2,
      title: 'Staccato Playing',
      description: 'Short, detached notes.',
      explanation: 'Play each note briefly and lift. The silence between notes is as important as the notes.',
      exerciseNotes: makeScale(60, MAJOR_INTERVALS, 0, 0.3, 0.7),
      exerciseBpm: 80, passingAccuracy: 70, prerequisites: ['tech-01'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'tech-03', pathId: 'technique', order: 3,
      title: 'Arpeggios - C Major',
      description: 'Play broken chords ascending and descending.',
      explanation: 'C-E-G-C-G-E-C. Arpeggios train your hand to stretch and move smoothly.',
      exerciseNotes: [
        ...[60, 64, 67, 72, 67, 64, 60].map((n, i) => makeNote(n, i * 0.6, 0.5)),
        ...[48, 52, 55, 60, 55, 52, 48].map((n, i) => makeNote(n, (i + 7) * 0.6, 0.5, 'left')),
      ],
      exerciseBpm: 80, passingAccuracy: 70, prerequisites: ['tech-02'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'tech-04', pathId: 'technique', order: 4,
      title: 'Octave Playing',
      description: 'Play octaves with thumb and pinky.',
      explanation: 'Stretch from C3 to C4 (thumb to pinky). Keep your hand relaxed.',
      exerciseNotes: [
        ...[48, 50, 52, 53, 55, 53, 52, 50, 48].map((n, i) => makeNote(n, i * 0.7, 0.6, 'left')),
        ...[60, 62, 64, 65, 67, 65, 64, 62, 60].map((n, i) => makeNote(n, i * 0.7, 0.6)),
      ],
      exerciseBpm: 75, passingAccuracy: 65, prerequisites: ['tech-03'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'tech-05', pathId: 'technique', order: 5,
      title: 'Dynamic Control - Piano',
      description: 'Play softly with controlled velocity.',
      explanation: 'Piano (p) means soft. Control your finger pressure to produce gentle sounds.',
      exerciseNotes: makeScale(60, MAJOR_INTERVALS, 0, 0.8, 1).map(n => ({ ...n, velocity: 40 })),
      exerciseBpm: 70, passingAccuracy: 70, prerequisites: ['tech-04'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'tech-06', pathId: 'technique', order: 6,
      title: 'Dynamic Control - Forte',
      description: 'Play loudly with confidence.',
      explanation: 'Forte (f) means loud. Use arm weight, not just finger strength.',
      exerciseNotes: makeScale(60, MAJOR_INTERVALS, 0, 0.8, 1).map(n => ({ ...n, velocity: 110 })),
      exerciseBpm: 75, passingAccuracy: 70, prerequisites: ['tech-05'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'tech-07', pathId: 'technique', order: 7,
      title: 'Crescendo & Diminuendo',
      description: 'Gradually increase and decrease volume.',
      explanation: 'Start soft, get louder (crescendo), then get softer (diminuendo). Smooth transitions!',
      exerciseNotes: makeScale(60, MAJOR_INTERVALS, 0, 0.8, 1).map((n, i) => ({
        ...n,
        velocity: i < 4 ? 40 + i * 20 : 120 - (i - 4) * 20,
      })),
      exerciseBpm: 70, passingAccuracy: 65, prerequisites: ['tech-06'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'tech-08', pathId: 'technique', order: 8,
      title: 'Chromatic Scale',
      description: 'Play every key in sequence.',
      explanation: 'The chromatic scale uses all 12 notes. Great for finger independence.',
      exerciseNotes: Array.from({ length: 13 }, (_, i) => makeNote(60 + i, i * 0.4, 0.3)),
      exerciseBpm: 90, passingAccuracy: 70, prerequisites: ['tech-07'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'tech-09', pathId: 'technique', order: 9,
      title: 'Hand Independence',
      description: 'Different rhythms in each hand.',
      explanation: 'Right hand plays eighth notes while left hand plays quarter notes. This builds independence.',
      exerciseNotes: [
        ...Array.from({ length: 8 }, (_, i) => makeNote(60 + (i % 5) * 2, i * 0.5, 0.4)),
        ...Array.from({ length: 4 }, (_, i) => makeNote(48 + (i % 3) * 4, i * 1, 0.8, 'left')),
      ],
      exerciseBpm: 80, passingAccuracy: 65, prerequisites: ['tech-08'], completed: false, bestAccuracy: 0,
    },
    {
      id: 'tech-10', pathId: 'technique', order: 10,
      title: 'Speed Building',
      description: 'Fast scale runs with accuracy.',
      explanation: 'Play scales as fast as you can while maintaining accuracy. Speed follows accuracy, not the other way around.',
      exerciseNotes: [
        ...makeScale(60, MAJOR_INTERVALS, 0, 0.25, 0.3),
        ...makeScale(60, [...MAJOR_INTERVALS].reverse(), 2.4, 0.25, 0.3),
        ...makeScale(60, MAJOR_INTERVALS, 4.8, 0.2, 0.25),
      ],
      exerciseBpm: 120, passingAccuracy: 70, prerequisites: ['tech-09'], completed: false, bestAccuracy: 0,
    },
  ];
}

// ===== Song Mastery Path =====
function createSongMasteryLessons(): Lesson[] {
  const songs = [
    { id: 'sm-01', title: 'Love Story - Intro', songRef: 'love-story', notes: [60, 62, 64, 67, 65, 64, 62, 60] },
    { id: 'sm-02', title: 'Wildest Dreams - Verse', songRef: 'wildest-dreams', notes: [64, 64, 65, 67, 67, 65, 64, 62] },
    { id: 'sm-03', title: 'All Too Well - Chorus', songRef: 'all-too-well', notes: [67, 67, 69, 71, 72, 71, 69, 67] },
    { id: 'sm-04', title: 'Anti-Hero - Main Riff', songRef: 'anti-hero', notes: [64, 64, 62, 60, 67, 65, 64, 62] },
    { id: 'sm-05', title: 'Blank Space - Melody', songRef: 'blank-space', notes: [65, 65, 67, 69, 69, 70, 72, 72] },
    { id: 'sm-06', title: 'Shake It Off - Chorus', songRef: 'shake-it-off', notes: [67, 67, 67, 64, 60, 64, 67, 72] },
    { id: 'sm-07', title: 'Cruel Summer - Bridge', songRef: 'cruel-summer', notes: [69, 71, 73, 76, 73, 71, 69, 69] },
    { id: 'sm-08', title: 'Enchanted - Build', songRef: 'enchanted', notes: [70, 72, 74, 74, 72, 70, 74, 77] },
    { id: 'sm-09', title: 'Cardigan - Verse', songRef: 'cardigan', notes: [68, 70, 72, 72, 70, 68, 75, 73] },
    { id: 'sm-10', title: 'Fortnight - Full', songRef: 'fortnight', notes: [69, 71, 72, 72, 71, 69, 72, 74] },
  ];

  return songs.map((s, i) => ({
    id: s.id,
    pathId: 'songMastery' as SkillPath,
    order: i + 1,
    title: s.title,
    description: `Master this section from ${s.songRef.replace(/-/g, ' ')}.`,
    explanation: `Practice this specific passage until you can play it smoothly at full tempo.`,
    exerciseNotes: s.notes.map((n, j) => makeNote(n, j * 0.6, 0.5)),
    exerciseBpm: 80 + i * 5,
    passingAccuracy: 70 + i * 2,
    prerequisites: i > 0 ? [songs[i - 1].id] : [],
    completed: false,
    bestAccuracy: 0,
  }));
}

// ===== Full Curriculum =====
export function getCurriculum(): SkillPathData[] {
  return [
    {
      id: 'fundamentals', name: 'Fundamentals', icon: '🎵',
      description: 'Scales, hand position, and basic rhythm',
      lessons: createFundamentalsLessons(),
    },
    {
      id: 'chords', name: 'Chords & Harmony', icon: '🎶',
      description: 'Triads, inversions, progressions, voicings',
      lessons: createChordsLessons(),
    },
    {
      id: 'sightReading', name: 'Sight Reading', icon: '👁️',
      description: 'Progressive difficulty note recognition drills',
      lessons: createSightReadingLessons(),
    },
    {
      id: 'technique', name: 'Technique', icon: '✋',
      description: 'Arpeggios, octaves, dynamic control',
      lessons: createTechniqueLessons(),
    },
    {
      id: 'songMastery', name: 'Song Mastery', icon: '⭐',
      description: 'Curated song progression from easy to expert',
      lessons: createSongMasteryLessons(),
    },
  ];
}

// ===== Lesson state =====
export function isLessonAvailable(lesson: Lesson, completedLessons: Set<string>): boolean {
  return lesson.prerequisites.every(p => completedLessons.has(p));
}

export function checkPrerequisites(lessonId: string, allLessons: Lesson[], completedLessons: Set<string>): boolean {
  const lesson = allLessons.find(l => l.id === lessonId);
  if (!lesson) return false;
  return lesson.prerequisites.every(p => completedLessons.has(p));
}

export function getLessonProgress(allLessons: Lesson[], completedLessons: Set<string>): {
  total: number;
  completed: number;
  percent: number;
} {
  const total = allLessons.length;
  const completed = allLessons.filter(l => completedLessons.has(l.id)).length;
  return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

// ===== Practice Plan Generator =====
export function generatePracticePlan(
  durationMinutes: number,
  analytics: AnalyticsData,
  curriculum: SkillPathData[],
  completedLessons: Set<string>,
): PracticePlan {
  const activities: PracticePlanActivity[] = [];
  let remainingMinutes = durationMinutes;

  // Find weak keys
  const weakKeys = analytics.keyAccuracy
    .filter(k => k.accuracy < 70 && k.totalHits > 5)
    .sort((a, b) => a.accuracy - b.accuracy);

  // Find next available lessons
  const allLessons = curriculum.flatMap(p => p.lessons);
  const nextLessons = allLessons
    .filter(l => !completedLessons.has(l.id) && isLessonAvailable(l, completedLessons))
    .slice(0, 3);

  // 1. Warm-up: technique exercise
  if (remainingMinutes >= 5) {
    activities.push({
      type: 'exercise',
      title: 'Warm-up: Scales',
      description: 'Play C and G major scales slowly to warm up your fingers.',
      duration: 5,
      targetId: 'fund-08',
    });
    remainingMinutes -= 5;
  }

  // 2. Work on weaknesses
  if (weakKeys.length > 0 && remainingMinutes >= 5) {
    const dur = Math.min(10, remainingMinutes);
    activities.push({
      type: 'exercise',
      title: 'Weak Spot Training',
      description: `Focus on keys you struggle with. Your weakest: MIDI ${weakKeys[0].midi} (${weakKeys[0].accuracy}% accuracy).`,
      duration: dur,
      targetId: 'technique',
    });
    remainingMinutes -= dur;
  }

  // 3. Next curriculum lessons
  for (const lesson of nextLessons) {
    if (remainingMinutes < 5) break;
    const dur = Math.min(10, remainingMinutes);
    activities.push({
      type: 'lesson',
      title: lesson.title,
      description: lesson.description,
      duration: dur,
      targetId: lesson.id,
    });
    remainingMinutes -= dur;
  }

  // 4. Free play with a song
  if (remainingMinutes >= 5) {
    // Pick a song the player hasn't mastered yet
    const recentSongs = analytics.sessionHistory.slice(-10).map(s => s.songId);
    const songToSuggest = recentSongs[0] || 'love-story';
    activities.push({
      type: 'song',
      title: 'Song Practice',
      description: `Practice "${songToSuggest.replace(/-/g, ' ')}" at a comfortable tempo.`,
      duration: remainingMinutes,
      targetId: songToSuggest,
    });
  }

  return { duration: durationMinutes, activities };
}

// ===== Persistence =====
export function loadCompletedLessons(): Set<string> {
  try {
    const data = localStorage.getItem(CURRICULUM_KEY);
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveCompletedLessons(completed: Set<string>): void {
  try {
    localStorage.setItem(CURRICULUM_KEY, JSON.stringify([...completed]));
  } catch (e) {
    console.error('[PianoHero] Failed to save completed lessons:', e);
  }
}

export function loadLessonBestAccuracies(): Record<string, number> {
  try {
    const data = localStorage.getItem(CURRICULUM_KEY + '-scores');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveLessonBestAccuracy(lessonId: string, accuracy: number): void {
  try {
    const scores = loadLessonBestAccuracies();
    if (!scores[lessonId] || accuracy > scores[lessonId]) {
      scores[lessonId] = accuracy;
      localStorage.setItem(CURRICULUM_KEY + '-scores', JSON.stringify(scores));
    }
  } catch (e) {
    console.error('[PianoHero] Failed to save lesson accuracy:', e);
  }
}
