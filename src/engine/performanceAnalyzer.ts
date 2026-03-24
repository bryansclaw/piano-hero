import type {
  NoteTimingData, PerformanceReport, TimingAnalysis, DynamicsAnalysis,
  TroubleSpot, LetterGrade, Difficulty, SessionHistory,
} from '../types';

/**
 * Calculate letter grade from accuracy percentage
 */
export function calculateGrade(accuracy: number): LetterGrade {
  if (accuracy >= 98) return 'S';
  if (accuracy >= 90) return 'A';
  if (accuracy >= 80) return 'B';
  if (accuracy >= 70) return 'C';
  if (accuracy >= 60) return 'D';
  return 'F';
}

/**
 * Determine measure number from a time position given BPM and time signature
 */
export function timeToMeasure(time: number, bpm: number, beatsPerMeasure = 4): number {
  const beatDuration = 60 / bpm;
  const measureDuration = beatDuration * beatsPerMeasure;
  return Math.floor(time / measureDuration) + 1;
}

/**
 * Analyze timing patterns from note timing data
 */
export function analyzeTimings(timings: NoteTimingData[]): TimingAnalysis {
  if (timings.length === 0) {
    return {
      averageDeltaMs: 0,
      leftHandAvgDelta: 0,
      rightHandAvgDelta: 0,
      rushingTendency: false,
      draggingTendency: false,
      steadiness: 100,
      insights: ['No notes to analyze.'],
    };
  }

  const hitTimings = timings.filter(t => t.rating !== 'miss');
  if (hitTimings.length === 0) {
    return {
      averageDeltaMs: 0,
      leftHandAvgDelta: 0,
      rightHandAvgDelta: 0,
      rushingTendency: false,
      draggingTendency: false,
      steadiness: 0,
      insights: ['All notes were missed.'],
    };
  }

  const deltas = hitTimings.map(t => t.deltaMs);
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;

  const leftHand = hitTimings.filter(t => t.hand === 'left');
  const rightHand = hitTimings.filter(t => t.hand === 'right');

  const leftAvg = leftHand.length > 0
    ? leftHand.reduce((a, t) => a + t.deltaMs, 0) / leftHand.length
    : 0;
  const rightAvg = rightHand.length > 0
    ? rightHand.reduce((a, t) => a + t.deltaMs, 0) / rightHand.length
    : 0;

  const rushing = avgDelta < -15;
  const dragging = avgDelta > 15;

  // Steadiness: how consistent are the timing deltas?
  const variance = deltas.reduce((sum, d) => sum + Math.pow(d - avgDelta, 2), 0) / deltas.length;
  const stdDev = Math.sqrt(variance);
  const steadiness = Math.max(0, Math.min(100, 100 - stdDev));

  const insights: string[] = [];
  if (rushing) {
    insights.push(`You tend to rush notes by ${Math.abs(Math.round(avgDelta))}ms on average.`);
  }
  if (dragging) {
    insights.push(`You tend to drag notes by ${Math.round(avgDelta)}ms on average.`);
  }
  if (leftHand.length > 0 && Math.abs(leftAvg) > 20) {
    const dir = leftAvg < 0 ? 'rush' : 'drag';
    insights.push(`You tend to ${dir} notes in the left hand.`);
  }
  if (rightHand.length > 0 && Math.abs(rightAvg) > 20) {
    const dir = rightAvg < 0 ? 'rush' : 'drag';
    insights.push(`You tend to ${dir} notes in the right hand.`);
  }
  if (steadiness > 85) {
    insights.push('Your rhythm is very steady — great job!');
  } else if (steadiness < 50) {
    insights.push('Your rhythm is unsteady — try using the metronome.');
  }

  if (insights.length === 0) {
    insights.push('Your timing is solid overall.');
  }

  return {
    averageDeltaMs: Math.round(avgDelta * 10) / 10,
    leftHandAvgDelta: Math.round(leftAvg * 10) / 10,
    rightHandAvgDelta: Math.round(rightAvg * 10) / 10,
    rushingTendency: rushing,
    draggingTendency: dragging,
    steadiness: Math.round(steadiness),
    insights,
  };
}

/**
 * Analyze dynamics (velocity patterns)
 */
export function analyzeDynamics(timings: NoteTimingData[]): DynamicsAnalysis {
  const hitTimings = timings.filter(t => t.rating !== 'miss');

  if (hitTimings.length === 0) {
    return {
      averageVelocity: 0,
      velocityRange: 0,
      uniformity: 100,
      insights: ['No dynamics data available.'],
    };
  }

  const velocities = hitTimings.map(t => t.velocity);
  const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length;
  const min = Math.min(...velocities);
  const max = Math.max(...velocities);
  const range = max - min;

  // Uniformity: how similar are all velocities?
  const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / velocities.length;
  const stdDev = Math.sqrt(variance);
  const uniformity = Math.max(0, Math.min(100, 100 - stdDev * 2));

  const insights: string[] = [];
  if (uniformity > 85) {
    insights.push('Your velocity is very uniform — try adding more expression and dynamics.');
  } else if (uniformity < 40) {
    insights.push('Your velocity varies a lot — this could be intentional expression or inconsistency.');
  } else {
    insights.push('Good dynamic range in your playing.');
  }

  if (avg < 50) {
    insights.push('You\'re playing quite softly overall. Try playing with more confidence.');
  } else if (avg > 110) {
    insights.push('You\'re playing quite loudly. Consider more nuanced dynamics.');
  }

  return {
    averageVelocity: Math.round(avg),
    velocityRange: range,
    uniformity: Math.round(uniformity),
    insights,
  };
}

/**
 * Find trouble spots — measures with low accuracy
 */
export function findTroubleSpots(timings: NoteTimingData[], _bpm: number): TroubleSpot[] {
  if (timings.length === 0) return [];

  // Group notes by measure
  const measureGroups = new Map<number, NoteTimingData[]>();
  for (const t of timings) {
    const measure = t.measure;
    if (!measureGroups.has(measure)) measureGroups.set(measure, []);
    measureGroups.get(measure)!.push(t);
  }

  const spots: TroubleSpot[] = [];
  const entries = Array.from(measureGroups.entries()).sort((a, b) => a[0] - b[0]);

  for (const [measure, notes] of entries) {
    const hitCount = notes.filter(n => n.rating !== 'miss').length;
    const accuracy = notes.length > 0 ? (hitCount / notes.length) * 100 : 100;

    if (accuracy < 75 && notes.length >= 2) {
      spots.push({
        measureStart: measure,
        measureEnd: measure,
        accuracy: Math.round(accuracy),
        description: `Measure ${measure}: ${Math.round(accuracy)}% accuracy (${notes.length - hitCount} misses)`,
      });
    }
  }

  // Merge consecutive trouble spots
  const merged: TroubleSpot[] = [];
  for (const spot of spots) {
    const last = merged[merged.length - 1];
    if (last && spot.measureStart - last.measureEnd <= 1) {
      last.measureEnd = spot.measureEnd;
      last.accuracy = Math.round((last.accuracy + spot.accuracy) / 2);
      last.description = `Measures ${last.measureStart}-${last.measureEnd}: ~${last.accuracy}% accuracy`;
    } else {
      merged.push({ ...spot });
    }
  }

  return merged.slice(0, 5); // Top 5 trouble spots
}

/**
 * Generate practice suggestions based on the analysis
 */
export function generateSuggestions(
  timingAnalysis: TimingAnalysis,
  dynamicsAnalysis: DynamicsAnalysis,
  troubleSpots: TroubleSpot[],
  accuracy: number,
): string[] {
  const suggestions: string[] = [];

  if (troubleSpots.length > 0) {
    const spot = troubleSpots[0];
    suggestions.push(
      `Focus on measures ${spot.measureStart}-${spot.measureEnd} at 60% speed, then increase gradually.`
    );
  }

  if (timingAnalysis.rushingTendency) {
    suggestions.push('Practice with the metronome enabled to work on steady timing.');
  }

  if (timingAnalysis.draggingTendency) {
    suggestions.push('Try practicing at a slightly faster tempo to build confidence.');
  }

  if (dynamicsAnalysis.uniformity > 85) {
    suggestions.push('Work on adding dynamics — try accenting downbeats and softening passing notes.');
  }

  if (accuracy < 70) {
    suggestions.push('Try dropping the tempo to 50% and use section looping to build muscle memory.');
  } else if (accuracy < 85) {
    suggestions.push('Use auto speed-up mode starting at 75% to gradually build speed.');
  } else if (accuracy >= 95) {
    suggestions.push('Excellent accuracy! Try the next difficulty level or focus on expressiveness.');
  }

  if (suggestions.length === 0) {
    suggestions.push('Keep practicing regularly — consistency is key to improvement!');
  }

  return suggestions;
}

/**
 * Generate a complete performance report
 */
export function generatePerformanceReport(
  songId: string,
  difficulty: Difficulty,
  noteTimings: NoteTimingData[],
  score: number,
  duration: number,
  bpm: number,
): PerformanceReport {
  const totalNotes = noteTimings.length;
  const hitNotes = noteTimings.filter(t => t.rating !== 'miss').length;
  const overallAccuracy = totalNotes > 0 ? (hitNotes / totalNotes) * 100 : 0;
  const roundedAccuracy = Math.round(overallAccuracy * 100) / 100;

  const timingAnalysis = analyzeTimings(noteTimings);
  const dynamicsAnalysis = analyzeDynamics(noteTimings);
  const troubleSpots = findTroubleSpots(noteTimings, bpm);
  const practiceSuggestions = generateSuggestions(timingAnalysis, dynamicsAnalysis, troubleSpots, roundedAccuracy);

  return {
    songId,
    difficulty,
    date: new Date().toISOString(),
    duration,
    overallAccuracy: roundedAccuracy,
    letterGrade: calculateGrade(roundedAccuracy),
    score,
    timingAnalysis,
    dynamicsAnalysis,
    troubleSpots,
    practiceSuggestions,
    noteTimings,
  };
}

/**
 * Track improvement over sessions
 */
export function getImprovementInsight(history: SessionHistory[], songId: string): string | null {
  const songHistory = history
    .filter(s => s.songId === songId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (songHistory.length < 2) return null;

  const first = songHistory[0];
  const last = songHistory[songHistory.length - 1];
  const diff = Math.round(last.accuracy - first.accuracy);

  if (diff > 0) {
    return `Your accuracy on this song improved from ${Math.round(first.accuracy)}% to ${Math.round(last.accuracy)}% over ${songHistory.length} sessions!`;
  } else if (diff < 0) {
    return `Your accuracy decreased from ${Math.round(first.accuracy)}% to ${Math.round(last.accuracy)}%. Don't worry — off days happen!`;
  }
  return `Consistent performance at ${Math.round(last.accuracy)}% across ${songHistory.length} sessions.`;
}

// ===== localStorage persistence =====
const REPORTS_KEY = 'piano-hero-performance-reports';

export function loadPerformanceReports(): PerformanceReport[] {
  try {
    const data = localStorage.getItem(REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePerformanceReport(report: PerformanceReport): void {
  const reports = loadPerformanceReports();
  reports.push(report);
  // Keep last 100 reports
  const trimmed = reports.slice(-100);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(trimmed));
}
