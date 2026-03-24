import type {
  AnalyticsData, DailyPracticeData, KeyAccuracyData,
  SessionHistory, NoteTimingData,
} from '../types';

const ANALYTICS_KEY = 'piano-hero-analytics';

// ===== Persistence =====
export function loadAnalytics(): AnalyticsData {
  try {
    const data = localStorage.getItem(ANALYTICS_KEY);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return {
    dailyPractice: [],
    keyAccuracy: [],
    sessionHistory: [],
    songAccuracyTrends: {},
  };
}

export function saveAnalytics(data: AnalyticsData): void {
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
}

// ===== Recording sessions =====
export function recordSession(
  analytics: AnalyticsData,
  session: SessionHistory,
  noteTimings: NoteTimingData[],
): AnalyticsData {
  const updated = { ...analytics };

  // Add session to history
  updated.sessionHistory = [...updated.sessionHistory, session].slice(-200);

  // Update daily practice data
  const today = new Date().toISOString().split('T')[0];
  const existing = updated.dailyPractice.find(d => d.date === today);
  if (existing) {
    existing.totalMinutes += Math.round(session.duration / 60);
    existing.sessions += 1;
    existing.averageAccuracy = Math.round(
      (existing.averageAccuracy * (existing.sessions - 1) + session.accuracy) / existing.sessions
    );
    if (!existing.songsPlayed.includes(session.songId)) {
      existing.songsPlayed.push(session.songId);
    }
  } else {
    updated.dailyPractice = [...updated.dailyPractice, {
      date: today,
      totalMinutes: Math.round(session.duration / 60),
      sessions: 1,
      averageAccuracy: Math.round(session.accuracy),
      songsPlayed: [session.songId],
    }];
  }

  // Update key accuracy
  updated.keyAccuracy = updateKeyAccuracy(updated.keyAccuracy, noteTimings);

  // Update song accuracy trends
  if (!updated.songAccuracyTrends[session.songId]) {
    updated.songAccuracyTrends[session.songId] = [];
  }
  updated.songAccuracyTrends[session.songId].push({
    date: session.date,
    accuracy: session.accuracy,
  });
  // Keep last 50 per song
  if (updated.songAccuracyTrends[session.songId].length > 50) {
    updated.songAccuracyTrends[session.songId] = updated.songAccuracyTrends[session.songId].slice(-50);
  }

  return updated;
}

function updateKeyAccuracy(
  existing: KeyAccuracyData[],
  timings: NoteTimingData[],
): KeyAccuracyData[] {
  const map = new Map<number, KeyAccuracyData>();
  for (const ka of existing) {
    map.set(ka.midi, { ...ka });
  }

  for (const t of timings) {
    const key = map.get(t.midi) || { midi: t.midi, totalHits: 0, correctHits: 0, accuracy: 0 };
    key.totalHits += 1;
    if (t.rating !== 'miss') {
      key.correctHits += 1;
    }
    key.accuracy = Math.round((key.correctHits / key.totalHits) * 100);
    map.set(t.midi, key);
  }

  return Array.from(map.values());
}

// ===== Aggregation functions =====
export function aggregatePracticeTime(
  dailyData: DailyPracticeData[],
  period: 'week' | 'month' | 'all',
): { labels: string[]; values: number[] } {
  const now = new Date();
  let cutoff: Date;

  switch (period) {
    case 'week':
      cutoff = new Date(now.getTime() - 7 * 86400000);
      break;
    case 'month':
      cutoff = new Date(now.getTime() - 30 * 86400000);
      break;
    default:
      cutoff = new Date(0);
  }

  const filtered = dailyData.filter(d => new Date(d.date) >= cutoff);
  const labels = filtered.map(d => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const values = filtered.map(d => d.totalMinutes);

  return { labels, values };
}

export function calculateAccuracyTrend(
  trends: { date: string; accuracy: number }[],
): { labels: string[]; values: number[] } {
  const sorted = [...trends].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const labels = sorted.map(t => {
    const date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const values = sorted.map(t => t.accuracy);
  return { labels, values };
}

export function calculateTotalStats(analytics: AnalyticsData): {
  totalMinutes: number;
  songsCompleted: number;
  averageAccuracy: number;
  longestStreak: number;
  favoriteSong: string;
} {
  const totalMinutes = analytics.dailyPractice.reduce((sum, d) => sum + d.totalMinutes, 0);
  const songsCompleted = analytics.sessionHistory.length;

  const avgAcc = songsCompleted > 0
    ? analytics.sessionHistory.reduce((sum, s) => sum + s.accuracy, 0) / songsCompleted
    : 0;

  // Longest streak of consecutive days
  let longestStreak = 0;
  let currentStreak = 0;
  const sortedDays = analytics.dailyPractice.map(d => d.date).sort();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  // Favorite song
  const songCounts = new Map<string, number>();
  for (const s of analytics.sessionHistory) {
    songCounts.set(s.songId, (songCounts.get(s.songId) || 0) + 1);
  }
  let favoriteSong = '';
  let maxCount = 0;
  for (const [id, count] of songCounts) {
    if (count > maxCount) {
      maxCount = count;
      favoriteSong = id;
    }
  }

  return {
    totalMinutes,
    songsCompleted,
    averageAccuracy: Math.round(avgAcc * 10) / 10,
    longestStreak,
    favoriteSong,
  };
}

export function calculatePercentile(
  leaderboard: { score: number; isPlayer: boolean }[],
): number {
  const playerEntry = leaderboard.find(e => e.isPlayer);
  if (!playerEntry) return 50;

  const allScores = leaderboard.map(e => e.score).sort((a, b) => a - b);
  const playerRank = allScores.indexOf(playerEntry.score);
  return Math.round(((playerRank + 1) / allScores.length) * 100);
}
